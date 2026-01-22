import { useState } from 'react';
import { X, Upload, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { database } from '../../services/database';
import type { Category, Labour } from '../../types';
import { useEffect } from 'react';

interface AddLabourModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editLabour?: Labour | null;
}

const AddLabourModal = ({ isOpen, onClose, onSuccess, editLabour }: AddLabourModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        aadhaar: '',
        dailyWage: '',
        joiningDate: new Date().toISOString().split('T')[0],
        phone: '',
        designation: 'Helper',
        categoryId: ''
    });

    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showCategoryInput, setShowCategoryInput] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await database.getCategories();
                setCategories(data);
            } catch (err) {
                console.error('Failed to load categories:', err);
            }
        };

        if (isOpen) {
            loadCategories();
        }
    }, [isOpen]);

    useEffect(() => {
        if (editLabour) {
            setFormData({
                name: editLabour.name,
                aadhaar: editLabour.aadhaar,
                dailyWage: editLabour.dailyWage.toString(),
                joiningDate: editLabour.joiningDate,
                phone: editLabour.phone || '',
                designation: editLabour.designation || 'Helper',
                categoryId: editLabour.categoryId || ''
            });
        } else {
            setFormData({
                name: '',
                aadhaar: '',
                dailyWage: '',
                joiningDate: new Date().toISOString().split('T')[0],
                phone: '',
                designation: 'Helper',
                categoryId: ''
            });
        }
    }, [editLabour, isOpen]);

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            setLoading(true);
            const category = await database.createCategory(newCategoryName);
            setCategories([...categories, category]);
            setFormData({ ...formData, categoryId: category.id });
            setNewCategoryName('');
            setShowCategoryInput(false);
        } catch (err) {
            console.error('Failed to create category:', err);
            alert('Failed to create category.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editLabour) {
                await database.updateLabour(editLabour.id, {
                    name: formData.name,
                    aadhaar: formData.aadhaar,
                    dailyWage: Number(formData.dailyWage),
                    joiningDate: formData.joiningDate,
                    phone: formData.phone,
                    designation: formData.designation,
                    categoryId: formData.categoryId || undefined,
                });
            } else {
                await database.createLabour({
                    name: formData.name,
                    aadhaar: formData.aadhaar,
                    dailyWage: Number(formData.dailyWage),
                    joiningDate: formData.joiningDate,
                    status: 'active',
                    phone: formData.phone,
                    designation: formData.designation,
                    categoryId: formData.categoryId || undefined,
                });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save labour:', error);
            alert('Failed to save labour record. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, backdropFilter: 'blur(4px)' }}
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, pointerEvents: 'none', padding: '1.5rem' }}
                    >
                        <div className="glass-panel" style={{
                            width: '100%',
                            maxWidth: '36rem',
                            pointerEvents: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '90vh',
                            padding: 0,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.4)',
                            boxShadow: 'var(--shadow-xl), var(--shadow-glow-primary)'
                        }}>
                            <div className="flex-row justify-between items-center" style={{
                                padding: '1.5rem 2rem',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.1)'
                            }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                                        {editLabour ? 'Edit Information' : 'New Workforce Member'}
                                    </h2>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        {editLabour ? 'Update the details for this worker' : 'Fill in the details to register a new labourer'}
                                    </p>
                                </div>
                                <button onClick={onClose} style={{
                                    padding: '0.5rem',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    color: 'var(--color-text-secondary)',
                                    transition: 'all 0.2s'
                                }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,107,107,0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="grid-2">
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. Ramesh Kumar"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>Aadhaar Number</label>
                                        <input
                                            required
                                            type="text"
                                            maxLength={12}
                                            className="input-field"
                                            style={{ fontFamily: 'monospace' }}
                                            placeholder="XXXXXXXXXXXX"
                                            value={formData.aadhaar}
                                            disabled={!!editLabour} // Aadhaar usually doesn't change
                                            onChange={e => setFormData({ ...formData, aadhaar: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>Phone Number</label>
                                        <input
                                            type="tel"
                                            className="input-field"
                                            style={{ fontFamily: 'monospace' }}
                                            placeholder="9876543210"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>Daily Wage (₹)</label>
                                        <input
                                            required
                                            type="number"
                                            className="input-field"
                                            placeholder="500"
                                            value={formData.dailyWage}
                                            onChange={e => setFormData({ ...formData, dailyWage: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>Joining Date</label>
                                        <input
                                            required
                                            type="date"
                                            className="input-field"
                                            value={formData.joiningDate}
                                            onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                                        />
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Workforce Category</label>
                                        <div className="flex-row gap-2">
                                            <div style={{ flex: 1 }}>
                                                {showCategoryInput ? (
                                                    <div className="flex-row gap-2">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            className="input-field"
                                                            placeholder="New Category Name..."
                                                            value={newCategoryName}
                                                            onChange={e => setNewCategoryName(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleCreateCategory}
                                                            className="btn btn-primary"
                                                            style={{ padding: '0.5rem 1rem' }}
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCategoryInput(false)}
                                                            className="btn"
                                                            style={{ padding: '0.5rem 1rem' }}
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex-row gap-2">
                                                        <select
                                                            className="input-field no-icon"
                                                            value={formData.categoryId}
                                                            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                                            style={{ paddingLeft: '1rem' }}
                                                        >
                                                            <option value="">Select Category (Optional)</option>
                                                            {categories.map(cat => (
                                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCategoryInput(true)}
                                                            className="btn"
                                                            style={{
                                                                padding: '0.5rem 1rem',
                                                                background: 'rgba(102, 126, 234, 0.1)',
                                                                color: 'var(--color-primary)',
                                                                border: '1px dashed var(--color-primary)'
                                                            }}
                                                        >
                                                            <Plus size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aadhaar Verification Photo</label>
                                        <div style={{
                                            border: '2px dashed rgba(102, 126, 234, 0.3)',
                                            borderRadius: '1rem',
                                            padding: '2rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--color-primary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            background: 'rgba(102, 126, 234, 0.05)'
                                        }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.05)';
                                                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                                            }}
                                        >
                                            <Upload size={32} style={{ marginBottom: '0.75rem', opacity: 0.7 }} />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Click or Drag to Upload Photo</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>JPG, PNG up to 5MB</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-row gap-4 justify-end" style={{
                                    padding: '1.5rem 2.5rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderTop: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <button type="button" onClick={onClose} className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--color-text-secondary)' }}>Cancel</button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                        style={{ padding: '0.75rem 2rem', boxShadow: 'var(--shadow-glow-primary)' }}
                                    >
                                        <Check size={18} style={{ marginRight: '0.5rem' }} />
                                        {loading ? (editLabour ? 'Saving...' : 'Registering...') : (editLabour ? 'Update Details' : 'Register Member')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AddLabourModal;
