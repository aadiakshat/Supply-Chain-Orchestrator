import { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import MapWidget from '../components/MapWidget';
import { Package, Truck, MapPin, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const [nodes, setNodes] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [nodesRes, shipmentsRes] = await Promise.all([
          api.get('/nodes'),
          api.get('/shipments')
        ]);
        setNodes(nodesRes.data);
        setShipments(shipmentsRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeShipments = shipments.filter(s => s.status === 'IN_TRANSIT').length;
  const criticalNodes = nodes.filter(n => n.inventory.current <= n.inventory.minThreshold).length;
  const totalInventory = nodes.reduce((acc, curr) => acc + curr.inventory.current, 0);

  if (loading) {
    return <div className="flex h-full items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time macro view of your supply chain operations.</p>
        </div>
        <div className="flex gap-2">
            <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">Live API Data</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Nodes" value={nodes.length} icon={MapPin} color="blue" />
        <StatCard title="Active Shipments" value={activeShipments} icon={Truck} color="purple" />
        <StatCard title="Total System Inventory" value={totalInventory.toLocaleString()} icon={Package} color="green" />
        <StatCard title="Critical Needs" value={criticalNodes} icon={AlertTriangle} color={criticalNodes > 0 ? "red" : "orange"} subtitle="Nodes below threshold" />
      </div>

      {/* Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        <div className="lg:col-span-2 rounded-2xl overflow-hidden glass p-1 shadow-sm">
           <MapWidget nodes={nodes} />
        </div>
        
        {/* Recent Activity Sidebar-ish within Dashboard */}
        <div className="glass rounded-2xl p-6 flex flex-col shadow-sm">
          <h3 className="font-bold text-lg mb-4 border-b border-border pb-2">Recent Shipments</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {shipments.slice(0, 5).map(ship => (
              <div key={ship._id} className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/30 border border-slate-200 dark:border-gray-700/50">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">{ship.status}</span>
                  <span className="text-xs text-gray-400">Qty: {ship.amount}</span>
                </div>
                <div className="text-sm">
                   {ship.isTransferOrder && <span className="mr-1 text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Auto</span>}
                   From <span className="font-medium">{ship.origin?.name || 'Unknown'}</span>
                </div>
                <div className="text-sm">
                   To <span className="font-medium">{ship.destination?.name || 'Unknown'}</span>
                </div>
              </div>
            ))}
            {shipments.length === 0 && <p className="text-sm text-gray-500">No recent shipments found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
