import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { Truck, ArrowRight, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';

const Shipments = () => {
    const { user } = useContext(AuthContext);
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Rebalancer state
    const [rebalancing, setRebalancing] = useState(false);
    const [rebalanceModal, setRebalanceModal] = useState(false);
    const [rebalanceLogs, setRebalanceLogs] = useState([]);

    const fetchShipments = async () => {
        try {
            const res = await api.get('/shipments');
            setShipments(res.data);
        } catch (error) {
            console.error("Error fetching shipments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShipments();
    }, []);

    const getStatusStyle = (status) => {
        switch(status) {
            case 'PENDING': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
            case 'IN_TRANSIT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
            case 'DELIVERED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50';
            case 'FAILED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        }
    };

    const handleMarkDelivered = async (shipmentId) => {
        try {
            await api.put(`/shipments/${shipmentId}/status`, { status: 'DELIVERED' });
            await fetchShipments();
        } catch (err) {
            console.error("Error marking delivered:", err);
        }
    };

    const handleRunRebalancer = async () => {
        setRebalancing(true);
        setRebalanceLogs([]);
        setRebalanceModal(true);
    
        try {
            // Fetch all nodes, then trigger rebalance for each
            const nodesRes = await api.get('/nodes');
            const nodes = nodesRes.data;
            
            const logs = [];
    
            for (const node of nodes) {
                try {
                    await api.post(`/rebalance/${node._id}`);
                    const wasBelowThreshold = node.inventory.current <= node.inventory.minThreshold;
                    logs.push({
                        type: wasBelowThreshold ? 'triggered' : 'healthy',
                        message: wasBelowThreshold
                            ? `⚡ Rebalance triggered for "${node.name}" (stock: ${node.inventory.current} / threshold: ${node.inventory.minThreshold})`
                            : `✅ "${node.name}" is healthy (stock: ${node.inventory.current})`,
                    });
                } catch (err) {
                    logs.push({
                        type: 'error',
                        message: `❌ Failed for "${node.name}": ${err.response?.data?.message || err.message}`,
                    });
                }
            }
    
            setRebalanceLogs(logs);
    
            // Refresh shipments list to show new transfer orders
            await fetchShipments();
        } catch (err) {
            setRebalanceLogs([{ type: 'error', message: `Fatal error: ${err.message}` }]);
        } finally {
            setRebalancing(false);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Active Shipments</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track inventory moving across the logistics network.</p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={handleRunRebalancer}
                        disabled={rebalancing}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-purple-500/30"
                    >
                        <Activity size={16} className={rebalancing ? 'animate-spin' : ''} />
                        {rebalancing ? 'Running...' : 'Run Rebalancer'}
                    </button>
                )}
            </div>

            {/* Rebalancer Results Modal */}
            <Modal isOpen={rebalanceModal} onClose={() => setRebalanceModal(false)} title="🧠 Rebalancer Results">
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {rebalancing && (
                        <div className="flex items-center gap-3 text-blue-500 font-medium text-sm">
                            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                            Analyzing all nodes...
                        </div>
                    )}
                    {rebalanceLogs.map((log, i) => (
                        <div
                            key={i}
                            className={clsx(
                                'p-3 rounded-xl text-sm font-medium border',
                                log.type === 'triggered' && 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
                                log.type === 'healthy' && 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50',
                                log.type === 'error' && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50',
                            )}
                        >
                            {log.message}
                        </div>
                    ))}
                </div>
                {!rebalancing && rebalanceLogs.length > 0 && (
                    <p className="text-xs text-gray-400 mt-4 text-center">Shipment list has been refreshed with new transfer orders.</p>
                )}
            </Modal>

            <div className="glass rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-600 dark:text-gray-400 uppercase bg-slate-100 dark:bg-gray-800/50 border-b border-slate-200 dark:border-border font-bold">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Route</th>
                                <th className="px-6 py-4 font-semibold">Amount</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                {user?.role === 'admin' && <th className="px-6 py-4 font-semibold">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {shipments.length === 0 && (
                                <tr>
                                    <td colSpan={user?.role === 'admin' ? 5 : 4} className="px-6 py-12 text-center text-gray-400">
                                        No shipments found. Run the rebalancer to auto-generate transfer orders.
                                    </td>
                                </tr>
                            )}
                            {shipments.map((ship) => (
                                <tr key={ship._id} className="border-b border-border hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">{ship.origin?.name || 'Origin'}</div>
                                            <ArrowRight size={14} className="text-gray-400" />
                                            <div className="font-medium text-gray-900 dark:text-gray-100">{ship.destination?.name || 'Destination'}</div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            Current: <span className="font-semibold text-blue-500">{ship.current_node?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold">
                                        {ship.amount} units
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx("px-2.5 py-1 text-xs font-bold rounded-md border", getStatusStyle(ship.status))}>
                                            {ship.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {ship.isTransferOrder ? (
                                            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                                                Auto-Rebalance
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">—</span>
                                        )}
                                    </td>
                                    {user?.role === 'admin' && (
                                        <td className="px-6 py-4">
                                            {(ship.status === 'IN_TRANSIT' || ship.status === 'PENDING') && (
                                                <button
                                                    onClick={() => handleMarkDelivered(ship._id)}
                                                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
                                                >
                                                    <CheckCircle size={13} />
                                                    Mark Delivered
                                                </button>
                                            )}
                                            {ship.status === 'DELIVERED' && (
                                                <span className="text-green-500 text-xs font-medium flex items-center gap-1">
                                                    <CheckCircle size={13} /> Done
                                                </span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Shipments;

