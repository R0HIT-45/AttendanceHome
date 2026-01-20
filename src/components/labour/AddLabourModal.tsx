import { useState } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../../services/storage';
import type { Labour } from '../../types';

interface AddLabourModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddLabourModal = ({ isOpen, onClose, onSuccess }: AddLabourModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        aadhaar: '',
        dailyWage: '',
        joiningDate: new Date().toISOString().split('T')[0],
        phone: '',
        designation: 'Helper'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newLabour: Labour = {
            id: crypto.randomUUID(),
            name: formData.name,
            aadhaar: formData.aadhaar,
            dailyWage: Number(formData.dailyWage),
            joiningDate: formData.joiningDate,
            status: 'active',
            phone: formData.phone,
            designation: formData.designation
        };

        storage.saveLabour(newLabour);
        onSuccess();
        onClose();
        // Reset form
        setFormData({
            name: '',
            aadhaar: '',
            dailyWage: '',
            joiningDate: new Date().toISOString().split('T')[0],
            phone: '',
            designation: 'Helper'
        });
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
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, pointerEvents: 'none' }}
                    >
                        <div style={{ background: 'white', width: '100%', maxWidth: '32rem', borderRadius: '1rem', boxShadow: 'var(--shadow-2xl)', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-background)' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Add New Labour</h2>
                                <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--color-text-secondary)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E2E8F0'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
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
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>Photo</label>
                                        <div style={{ border: '2px dashed #CBD5E1', borderRadius: '0.5rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', cursor: 'pointer', transition: 'background 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <Upload size={24} style={{ marginBottom: '0.5rem' }} />
                                            <span style={{ fontSize: '0.875rem' }}>Click to upload photo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-row gap-3 justify-end" style={{ paddingTop: '1rem' }}>
                                    <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary">
                                        <Check size={18} style={{ marginRight: '0.5rem' }} />
                                        Save Labour
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
