import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { MapPin, AlertCircle, Plus, Pencil } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';

const inputClass = "w-full px-4 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm";
const labelClass = "block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1";

const NODE_TYPES = ['FACTORY', 'REGIONAL_WAREHOUSE', 'LOCAL_RETAILER'];

const AddNodeModal = ({ isOpen, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        name: '', type: 'FACTORY',
        longitude: '', latitude: '',
        capacity: '', minThreshold: '', initialInventory: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/nodes', {
                name: form.name,
                type: form.type,
                coordinates: [parseFloat(form.longitude), parseFloat(form.latitude)],
                capacity: parseInt(form.capacity),
                minThreshold: parseInt(form.minThreshold),
                initialInventory: parseInt(form.initialInventory) || 0,
            });
            onSuccess();
            onClose();
            setForm({ name: '', type: 'FACTORY', longitude: '', latitude: '', capacity: '', minThreshold: '', initialInventory: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create node.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="➕ Add New Node">
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className={labelClass}>Node Name</label>
                        <input name="name" required value={form.name} onChange={handleChange} className={inputClass} placeholder="e.g. West Coast Factory" />
                    </div>
                    <div className="col-span-2">
                        <label className={labelClass}>Node Type</label>
                        <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                            {NODE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Longitude</label>
                        <input name="longitude" type="number" step="any" required value={form.longitude} onChange={handleChange} className={inputClass} placeholder="-122.4194" />
                    </div>
                    <div>
                        <label className={labelClass}>Latitude</label>
                        <input name="latitude" type="number" step="any" required value={form.latitude} onChange={handleChange} className={inputClass} placeholder="37.7749" />
                    </div>
                    <div>
                        <label className={labelClass}>Capacity</label>
                        <input name="capacity" type="number" required value={form.capacity} onChange={handleChange} className={inputClass} placeholder="1000" />
                    </div>
                    <div>
                        <label className={labelClass}>Min Threshold</label>
                        <input name="minThreshold" type="number" required value={form.minThreshold} onChange={handleChange} className={inputClass} placeholder="200" />
                    </div>
                    <div className="col-span-2">
                        <label className={labelClass}>Initial Inventory (optional)</label>
                        <input name="initialInventory" type="number" value={form.initialInventory} onChange={handleChange} className={inputClass} placeholder="0" />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
                        {loading ? 'Creating...' : 'Create Node'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const EditNodeModal = ({ isOpen, onClose, onSuccess, node }) => {
    const [form, setForm] = useState({ capacity: '', minThreshold: '', current: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (node) {
            setForm({
                capacity: node.inventory.capacity.toString(),
                minThreshold: node.inventory.minThreshold.toString(),
                current: node.inventory.current.toString(),
            });
        }
    }, [node]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.put(`/nodes/${node._id}`, {
                capacity: parseInt(form.capacity),
                minThreshold: parseInt(form.minThreshold),
                current: parseInt(form.current),
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update node.');
        } finally {
            setLoading(false);
        }
    };

    if (!node) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`✏️ Edit ${node.name}`}>
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Capacity</label>
                        <input name="capacity" type="number" required value={form.capacity} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Min Threshold</label>
                        <input name="minThreshold" type="number" required value={form.minThreshold} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="col-span-2">
                        <label className={labelClass}>Current Inventory</label>
                        <input name="current" type="number" required value={form.current} onChange={handleChange} className={inputClass} />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const Nodes = () => {
    const { user } = useContext(AuthContext);
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingNode, setEditingNode] = useState(null);

    const fetchNodes = async () => {
        try {
            const res = await api.get('/nodes');
            setNodes(res.data);
        } catch (error) {
            console.error("Error fetching nodes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNodes(); }, []);

    const openEditModal = (node) => {
        setEditingNode(node);
        setEditModalOpen(true);
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>;
    }

    return (
        <div className="space-y-6">
            <AddNodeModal
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSuccess={fetchNodes}
            />
            <EditNodeModal
                isOpen={editModalOpen}
                onClose={() => { setEditModalOpen(false); setEditingNode(null); }}
                onSuccess={fetchNodes}
                node={editingNode}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nodes & Facilities</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage factories, warehouses, and retailers in the network.</p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-500/30"
                    >
                        <Plus size={16} />
                        Add Node
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {nodes.map(node => {
                    const inventoryPercent = Math.min(100, Math.round((node.inventory.current / node.inventory.capacity) * 100));
                    const isCritical = node.inventory.current < node.inventory.minThreshold;

                    return (
                        <div key={node._id} className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 shadow-sm border border-border group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${isCritical ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                        {isCritical ? <AlertCircle size={20} /> : <MapPin size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight group-hover:text-blue-500 transition-colors">{node.name}</h3>
                                        <span className="text-xs font-semibold text-gray-500">{node.type}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={() => openEditModal(node)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            title="Edit node"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                    )}
                                    {isCritical && (
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                            CRITICAL
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Inventory</span>
                                    <span className={`font-bold ${isCritical ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {node.inventory.current} / {node.inventory.capacity}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-700 ${isCritical ? 'bg-red-500' : 'bg-blue-500'}`}
                                        style={{ width: `${inventoryPercent}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-2 text-right">Min Threshold: {node.inventory.minThreshold}</p>
                            </div>
                        </div>
                    );
                })}
                {nodes.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-gray-400">
                        No nodes found. Add your first node to get started.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Nodes;

