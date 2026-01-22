import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Phone, User as UserIcon, Edit2, Trash2, Tag, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Labour, Category } from '../../types';
import { database } from '../../services/database';
import AddLabourModal from '../../components/labour/AddLabourModal';
import { format, parseISO } from 'date-fns';

const LabourList = () => {
    const [labours, setLabours] = useState<Labour[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLabour, setEditingLabour] = useState<Labour | null>(null);

    // Load data
    const loadData = async () => {
        try {
            setLoading(true);
            const [labourData, categoryData] = await Promise.all([
                database.getLabours(),
                database.getCategories().catch(() => [])
            ]);
            setLabours(labourData);
            setCategories(categoryData);
        } catch (error) {
            console.error('Failed to load labours:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to remove ${name}? This will also delete their attendance history.`)) {
            try {
                await database.deleteLabour(id);
                loadData();
            } catch (err) {
                console.error('Failed to delete labour:', err);
                alert('Failed to delete labour.');
            }
        }
    };

    const handleEdit = (labour: Labour) => {
        setEditingLabour(labour);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLabour(null);
    };

    const filteredLabours = labours.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.aadhaar.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' ? true : l.status === filterStatus;
        const matchesCategory = filterCategory === 'all' ? true : l.categoryId === filterCategory;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    return (
        <div className="flex-col gap-6" style={{ display: 'flex' }}>
            <AddLabourModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={loadData}
                editLabour={editingLabour}
            />

            <div className="flex-row justify-between items-center mobile-stack" style={{ flexWrap: 'wrap', gap: '1rem' }}>
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

            {/* Filters & Search Toolbar */}
            <div className="glass-panel" style={{
                padding: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
                alignItems: 'center',
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)'
            }}>
                <div className="input-group" style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    padding: '0 1rem'
                }}>
                    <Search style={{ color: 'var(--color-primary)', opacity: 0.7 }} size={18} />
                    <input
                        type="text"
                        placeholder="Search workforce by name or Aadhaar ID..."
                        className="input-field"
                        style={{ background: 'transparent', border: 'none', padding: '0.8rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-row items-center gap-2" style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '0.25rem 1rem',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <Tag size={16} style={{ color: 'var(--color-primary)' }} />
                    <select
                        className="input-field no-icon"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        style={{ background: 'transparent', border: 'none', padding: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}
                    >
                        <option value="all" style={{ background: '#1a1a2e' }}>All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id} style={{ background: '#1a1a2e' }}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-row items-center gap-2" style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '0.25rem 1rem',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <Filter size={16} style={{ color: 'var(--color-primary)' }} />
                    <select
                        className="input-field no-icon"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        style={{ background: 'transparent', border: 'none', padding: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}
                    >
                        <option value="all" style={{ background: '#1a1a2e' }}>All Status</option>
                        <option value="active" style={{ background: '#1a1a2e' }}>Active Only</option>
                        <option value="inactive" style={{ background: '#1a1a2e' }}>Inactive Only</option>
                    </select>
                </div>
            </div>

            {/* Labour Grid */}
            <div className="grid-3" style={{ position: 'relative', minHeight: '200px' }}>
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            style={{
                                width: '40px',
                                height: '40px',
                                border: '3px solid rgba(102, 126, 234, 0.1)',
                                borderTopColor: '#667eea',
                                borderRadius: '50%',
                            }}
                        />
                    </div>
                ) : filteredLabours.length > 0 ? (
                    filteredLabours.map((labour, index) => (
                        <motion.div
                            key={labour.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-panel"
                            style={{
                                padding: '1.25rem',
                                border: '1px solid var(--color-border-light)',
                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            whileHover={{
                                y: -8,
                                boxShadow: 'var(--shadow-xl), var(--shadow-glow-primary)',
                                borderColor: 'var(--color-primary-light)'
                            }}
                        >
                            <div className="flex-row justify-between" style={{ marginBottom: '1.25rem', alignItems: 'flex-start' }}>
                                <div className="flex-row gap-3" style={{ alignItems: 'center' }}>
                                    <div style={{
                                        width: '3.5rem',
                                        height: '3.5rem',
                                        borderRadius: '1rem',
                                        background: 'var(--gradient-primary)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.25rem',
                                        fontWeight: 800,
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                    }}>
                                        {labour.photoUrl ? (
                                            <img src={labour.photoUrl} alt={labour.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem' }} />
                                        ) : (
                                            labour.name.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.2rem' }}>{labour.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(102, 126, 234, 0.1)', color: 'var(--color-primary)', textTransform: 'uppercase' }}>{labour.designation || 'Specialist'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-row gap-1">
                                    <button
                                        onClick={() => handleEdit(labour)}
                                        className="btn"
                                        style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px', border: '1px solid rgba(102, 126, 234, 0.2)', background: 'rgba(102, 126, 234, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Edit2 size={14} color="var(--color-primary)" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(labour.id, labour.name)}
                                        className="btn"
                                        style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px', border: '1px solid rgba(255,107,107,0.2)', background: 'rgba(255,107,107,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Trash2 size={14} color="#ff6b6b" />
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                                    <Tag size={14} color="var(--color-primary)" />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                        {categories.find(c => c.id === labour.categoryId)?.name || 'General Workforce'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.8rem' }}>
                                    <CalendarIcon size={14} color="var(--color-text-muted)" />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                        Joined: {format(parseISO(labour.createdAt || new Date().toISOString()), 'do MMM yyyy')}
                                    </span>
                                </div>
                                <div style={{
                                    padding: '0.3rem 0.75rem',
                                    borderRadius: '2rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    display: 'inline-block',
                                    background: labour.status === 'active' ? 'rgba(67, 233, 123, 0.1)' : 'rgba(160, 174, 192, 0.1)',
                                    color: labour.status === 'active' ? 'var(--color-success)' : 'var(--color-text-muted)',
                                    border: `1px solid ${labour.status === 'active' ? 'rgba(67, 233, 123, 0.2)' : 'rgba(160, 174, 192, 0.2)'}`
                                }}>
                                    {labour.status}
                                </div>
                            </div>

                            <div style={{
                                padding: '1.25rem',
                                borderRadius: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                marginBottom: '1.5rem'
                            }}>
                                <div className="flex-row justify-between" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Standard Rate</span>
                                    <span style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '1rem' }}>₹{labour.dailyWage}</span>
                                </div>
                                <div className="flex-row justify-between" style={{ fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Aadhaar ID</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }}>•••• •••• {labour.aadhaar.slice(-4)}</span>
                                </div>
                            </div>

                            <div className="flex-row gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                                <button className="btn" style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', borderRadius: '0.75rem', fontWeight: 800, background: 'rgba(102, 126, 234, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                    View Analytics
                                </button>
                                <button className="btn" style={{ width: '42px', height: '42px', padding: 0, borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Phone size={18} color="var(--color-text-muted)" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center' }}>
                        <div style={{ width: '4rem', height: '4rem', background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <UserIcon style={{ color: '#CBD5E1' }} size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                            No labours found
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                            {searchTerm || filterStatus !== 'all'
                                ? "We couldn't find any labour records matching your current filters."
                                : "You haven't added any labourers yet. Start by adding your first workforce member."}
                        </p>
                        {!searchTerm && filterStatus === 'all' && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="btn btn-primary"
                                style={{ padding: '0.75rem 2rem' }}
                            >
                                <Plus size={20} style={{ marginRight: '0.5rem' }} />
                                Add Your First Labour
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabourList;
