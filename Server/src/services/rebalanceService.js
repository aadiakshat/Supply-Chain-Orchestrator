import LocationNode from '../models/LocationNode.js';
import Shipment from '../models/Shipment.js';

// ─── Haversine distance (km) between two [lng, lat] coordinate pairs ───
const haversineKm = (coordsA, coordsB) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const [lngA, latA] = coordsA;
  const [lngB, latB] = coordsB;

  const dLat = toRad(latB - latA);
  const dLng = toRad(lngB - lngA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── HELPER: Create a transfer shipment, deducting from the donor immediately ───
const createTransferShipment = async (fromNode, toNode, amount) => {
  fromNode.inventory.current -= amount;
  await fromNode.save();

  const shipment = new Shipment({
    origin: fromNode._id,
    destination: toNode._id,
    current_node: fromNode._id,
    status: 'IN_TRANSIT',
    amount,
    isTransferOrder: true,
  });

  return await shipment.save();
};

// ════════════════════════════════════════════════════════════════════════
//  GLOBAL REBALANCE ENGINE
//  1. Identify all deficit nodes  (current < minThreshold)
//  2. Identify all surplus nodes  (current > minThreshold)
//  3. For each deficit, pull from nearest surplus donors until filled
//     to 50% capacity — without dropping any donor below its threshold.
//  4. Skip deficit nodes that already have shipments in-flight.
//  5. Repeat until all deficits are resolved or no donors remain.
// ════════════════════════════════════════════════════════════════════════
export const runGlobalRebalance = async () => {
  console.log('\n══════════════════════════════════════════');
  console.log('  🧠 GLOBAL REBALANCE ENGINE — START');
  console.log('══════════════════════════════════════════\n');

  const logs = [];
  const allNodes = await LocationNode.find({});

  if (allNodes.length === 0) {
    logs.push({ type: 'info', message: 'No nodes in the network.' });
    return logs;
  }

  // ── Step 1: Classify every node ──────────────────────────────────────
  const deficitNodes = [];
  const surplusNodes = [];

  for (const node of allNodes) {
    if (node.inventory.current < node.inventory.minThreshold) {
      deficitNodes.push(node);
    } else if (node.inventory.current > node.inventory.minThreshold) {
      surplusNodes.push(node);
    }
    // Nodes exactly at threshold are balanced — skip
  }

  console.log(`[Rebalance] 📊 Network scan: ${deficitNodes.length} deficit, ${surplusNodes.length} surplus, ${allNodes.length} total nodes`);

  logs.push({
    type: 'info',
    message: `📊 Network scan complete — ${deficitNodes.length} deficit node(s), ${surplusNodes.length} surplus node(s), ${allNodes.length} total`,
  });

  if (deficitNodes.length === 0) {
    logs.push({ type: 'healthy', message: '✅ All nodes are above their minimum threshold. Network is balanced.' });
    console.log('[Rebalance] ✅ Network is balanced. Nothing to do.');
    return logs;
  }

  if (surplusNodes.length === 0) {
    logs.push({ type: 'error', message: '❌ No surplus nodes available to donate. Cannot rebalance.' });
    console.log('[Rebalance] ❌ No surplus available network-wide.');
    return logs;
  }

  // ── Step 2: Track live surplus for each donor (so multi-deficit pulls stay safe) ──
  //    We use a Map so we can decrement as we allocate, preventing double-spending.
  const liveSurplus = new Map();
  for (const s of surplusNodes) {
    liveSurplus.set(s._id.toString(), s.inventory.current - s.inventory.minThreshold);
  }

  // ── Step 3: For each deficit node — match with nearest surplus donors ──
  let totalTransfers = 0;

  for (const deficit of deficitNodes) {
    const target = Math.floor(deficit.inventory.capacity * 0.5);
    let needed = Math.max(target - deficit.inventory.current, 1);

    console.log(`\n[Rebalance] 🚨 DEFICIT: "${deficit.name}" — current: ${deficit.inventory.current}, threshold: ${deficit.inventory.minThreshold}, target: ${target}, needs: ${needed}`);

    // Check if this node already has shipments in-flight
    const inFlightCount = await Shipment.countDocuments({
      destination: deficit._id,
      status: { $in: ['IN_TRANSIT', 'PENDING'] },
    });

    if (inFlightCount > 0) {
      const msg = `⏳ "${deficit.name}" already has ${inFlightCount} shipment(s) in transit. Skipping to avoid oversupply.`;
      console.log(`[Rebalance] ${msg}`);
      logs.push({ type: 'skipped', message: msg });
      continue;
    }

    // Build a distance-sorted list of surplus candidates for THIS deficit
    const candidates = surplusNodes
      .filter((s) => liveSurplus.get(s._id.toString()) > 0)
      .map((s) => ({
        node: s,
        distance: haversineKm(deficit.location.coordinates, s.location.coordinates),
      }))
      .sort((a, b) => a.distance - b.distance);

    if (candidates.length === 0) {
      const msg = `❌ No surplus donors left for "${deficit.name}".`;
      console.log(`[Rebalance] ${msg}`);
      logs.push({ type: 'error', message: msg });
      continue;
    }

    // Pull from nearest donors until fulfilled
    const transfers = [];

    for (const candidate of candidates) {
      if (needed <= 0) break;

      const donorId = candidate.node._id.toString();
      const available = liveSurplus.get(donorId) || 0;

      if (available <= 0) continue;

      const contribution = Math.min(available, needed);
      const dist = Math.round(candidate.distance);

      console.log(`[Rebalance]   ↳ Pulling ${contribution} units from "${candidate.node.name}" (~${dist}km away, surplus: ${available})`);

      // Re-fetch the donor to get the latest DB state before deducting
      const freshDonor = await LocationNode.findById(candidate.node._id);
      const actualSurplus = freshDonor.inventory.current - freshDonor.inventory.minThreshold;

      if (actualSurplus <= 0) {
        console.log(`[Rebalance]   ⚠️ "${freshDonor.name}" no longer has surplus after DB refresh. Skipping.`);
        liveSurplus.set(donorId, 0);
        continue;
      }

      const safeContribution = Math.min(contribution, actualSurplus);

      const shipment = await createTransferShipment(freshDonor, deficit, safeContribution);

      // Decrement the live surplus tracker
      liveSurplus.set(donorId, (liveSurplus.get(donorId) || 0) - safeContribution);
      needed -= safeContribution;
      totalTransfers++;

      transfers.push({
        from: freshDonor.name,
        amount: safeContribution,
        distance: dist,
        shipmentId: shipment._id,
      });

      console.log(`[Rebalance]   ✅ Transfer #${shipment._id} created: ${freshDonor.name} → ${deficit.name} | ${safeContribution} units`);
    }

    if (transfers.length > 0) {
      const totalPulled = transfers.reduce((sum, t) => sum + t.amount, 0);
      const donorSummary = transfers.map((t) => `${t.from} (${t.amount} units, ~${t.distance}km)`).join(', ');
      logs.push({
        type: 'triggered',
        message: `⚡ "${deficit.name}" — pulled ${totalPulled} units from ${transfers.length} donor(s): ${donorSummary}`,
      });
    }

    if (needed > 0) {
      const msg = `⚠️ "${deficit.name}" still needs ${needed} more units — all available donors exhausted.`;
      console.log(`[Rebalance] ${msg}`);
      logs.push({ type: 'warning', message: msg });
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────
  logs.push({
    type: 'info',
    message: `📦 Rebalance complete — ${totalTransfers} transfer order(s) created.`,
  });

  console.log(`\n══════════════════════════════════════════`);
  console.log(`  ✅ REBALANCE COMPLETE — ${totalTransfers} transfers created`);
  console.log(`══════════════════════════════════════════\n`);

  return logs;
};

// ════════════════════════════════════════════════════════════════════════
//  PER-NODE REBALANCE (kept for auto-trigger on delivery / inventory update)
//  Thin wrapper: runs the global engine but only if this specific node
//  is in deficit.  For the full manual run, use runGlobalRebalance().
// ════════════════════════════════════════════════════════════════════════
export const checkAndTriggerRebalance = async (nodeId) => {
  console.log(`[Rebalance] Auto-trigger check for node: ${nodeId}`);

  const node = await LocationNode.findById(nodeId);
  if (!node || node.inventory.current > node.inventory.minThreshold) {
    console.log(`[Rebalance] Node "${node?.name}" is healthy. Skipping.`);
    return;
  }

  // If the node is critical, run the full engine so it benefits from the
  // global view (multi-donor, surplus tracking, etc.)
  console.log(`[Rebalance] Node "${node.name}" is critical — triggering global engine.`);
  await runGlobalRebalance();
};
