import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Phone, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Labour } from '../../types';
import { storage } from '../../services/storage';
import AddLabourModal from '../../components/labour/AddLabourModal';

const LabourList = () => {
    const [labours, setLabours] = useState<Labour[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Load data
    const loadLabours = () => {
        setLabours(storage.getLabours());
    };

    useEffect(() => {
        loadLabours();
    }, []);

    const filteredLabours = labours.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.aadhaar.includes(searchTerm);
        const matchesFilter = filterStatus === 'all' ? true : l.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex-col gap-6" style={{ display: 'flex' }}>
            <AddLabourModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadLabours}
            />

            <div className="flex-row justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1>Labour Management</h1>
                    <p>Manage your workforce, view profiles and history</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary"
                >
                    <Plus size={20} style={{ marginRight: '0.5rem' }} />
                    Add New Labour
                </button>
            </div>

            {/* Filters & Search */}
            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="input-group" style={{ flex: 1, minWidth: '300px' }}>
                    <Search className="input-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or Aadhaar..."
                        className="input-field"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-row items-center gap-2" style={{ minWidth: '200px' }}>
                    <Filter size={18} style={{ color: 'var(--color-text-muted)' }} />
                    <select
                        className="input-field no-icon"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        style={{ paddingLeft: '1rem' }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Labour Grid */}
            <div className="grid-3">
                {filteredLabours.length > 0 ? (
                    filteredLabours.map((labour, index) => (
                        <motion.div
                            key={labour.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card"
                            style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                            whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                        >
                            <div className="flex-row justify-between" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
                                <div className="flex-row gap-4" style={{ alignItems: 'center' }}>
                                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {labour.photoUrl ? (
                                            <img src={labour.photoUrl} alt={labour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <UserIcon style={{ color: '#94A3B8' }} size={24} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{labour.name}</h3>
                                        <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>ID: {labour.aadhaar.slice(-4)}</p>
                                    </div>
                                </div>
                                <div className={`badge ${labour.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                    {labour.status === 'active' ? 'Active' : 'Inactive'}
                                </div>
                            </div>

                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                <div className="flex-row gap-2 items-center" style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Join Date:</span>
                                    <span>{labour.joiningDate}</span>
                                </div>
                                <div className="flex-row gap-2 items-center">
                                    <span style={{ color: 'var(--color-text-muted)' }}>Daily Wage:</span>
                                    <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>₹{labour.dailyWage}</span>
                                </div>
                            </div>

                            <div className="flex-row gap-2" style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-background)' }}>
                                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}>
                                    View Profile
                                </button>
                                <button className="btn btn-icon" style={{ background: '#EFF6FF', color: '#3B82F6', border: '1px solid #DBEAFE' }}>
                                    <Phone size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                        <div style={{ width: '4rem', height: '4rem', background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <UserIcon style={{ color: '#CBD5E1' }} size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#334155' }}>No labours found</h3>
                        <p style={{ color: '#64748B' }}>Try adjusting your search or add a new labour.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabourList;
