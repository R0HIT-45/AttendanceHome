import { useState, useEffect, useMemo } from 'react';
import { isFuture, format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Save, CheckCircle2, AlertCircle, Trash2, Tag, Info, Download, FileText, Table, Edit2, History } from 'lucide-react';
import { database } from '../../services/database';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import type { Labour, Category, AttendanceRecord } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const MarkAttendance = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [labours, setLabours] = useState<Labour[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'half-day'>>({});
    const [savedRecords, setSavedRecords] = useState<AttendanceRecord[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const formattedDate = useMemo(() => {
        try {
            return format(parseISO(selectedDate), 'EEEE, do MMM yyyy');
        } catch {
            return selectedDate;
        }
    }, [selectedDate]);

    const loadAttendanceForDate = async (date: string) => {
        try {
            const records = await database.getAttendanceByDate(date);
            setSavedRecords(records);
            setAttendance({});
        } catch (err) {
            console.error('Failed to load attendance:', err);
        }
    };

    useEffect(() => {
        const initData = async () => {
            try {
                setLoading(true);
                const [allLabours, allCategories] = await Promise.all([
                    database.getLabours(),
                    database.getCategories().catch(() => [])
                ]);
                setLabours(allLabours.filter(l => l.status === 'active'));
                setCategories(allCategories);
                await loadAttendanceForDate(selectedDate);
            } catch (error) {
                console.error('Failed to initialize attendance:', error);
            } finally {
                setLoading(false);
            }
        };

        initData();
    }, [selectedDate]);

    const handleStatusChange = (labourId: string, status: 'present' | 'absent' | 'half-day') => {
        setAttendance(prev => ({ ...prev, [labourId]: status }));
    };

    const handleDeleteRecord = async (id: string) => {
        if (!window.confirm('Void this attendance record? This will return the worker to the pending list and keep an audit trail.')) return;
        try {
            await database.deleteAttendanceRecord(id);
            await loadAttendanceForDate(selectedDate);
            setMessage({ type: 'success', text: 'Record voided successfully.' });
            setTimeout(() => setMessage(null), 2000);
        } catch (err) {
            console.error('Failed to void record:', err);
            setMessage({ type: 'error', text: 'Failed to void record.' });
        }
    };

    const handleSave = async () => {
        if (isFuture(new Date(selectedDate))) {
            setMessage({ type: 'error', text: 'Cannot mark attendance for future dates.' });
            return;
        }

        const pendingCount = labours.length - (savedRecords.length + Object.keys(attendance).length);
        if (pendingCount > 0) {
            setMessage({ type: 'error', text: `Please mark all ${pendingCount} remaining workers before saving.` });
            return;
        }

        setSaving(true);
        try {
            const recordsToSave = Object.entries(attendance).map(([labourId, status]) => {
                const labour = labours.find(l => l.id === labourId);
                return {
                    labourId,
                    date: selectedDate,
                    status,
                    wageCalculated: calculateWage(labour?.dailyWage || 0, status)
                };
            });

            await database.bulkCreateAttendance(recordsToSave);
            setMessage({ type: 'success', text: 'All attendance records saved!' });
            await loadAttendanceForDate(selectedDate);
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error('Save failed:', err);
            setMessage({ type: 'error', text: 'Failed to save attendance.' });
        } finally {
            setSaving(false);
        }
    };

    const calculateWage = (dailyWage: number, status: string) => {
        if (status === 'present') return dailyWage;
        if (status === 'half-day') return dailyWage / 2;
        return 0;
    };

    const markAllPresent = () => {
        const newAttendance = { ...attendance };
        labours.forEach(l => {
            if (!savedRecords.some(r => r.labourId === l.id)) {
                newAttendance[l.id] = 'present';
            }
        });
        setAttendance(newAttendance);
    };

    const handleExport = async (format: 'pdf' | 'excel') => {
        const { data: { user } } = await supabase.auth.getUser();
        const exportData = savedRecords.map(record => {
            const labour = labours.find(l => l.id === record.labourId);
            const category = categories.find(c => c.id === labour?.categoryId);
            return {
                name: labour?.name || 'Unknown',
                aadhaar: labour?.aadhaar || 'N/A',
                category: category?.name || 'General',
                status: record.status.toUpperCase(),
                wage: `₹${record.wageCalculated}`
            };
        });

        const columns = [
            { header: 'Labourer Name', dataKey: 'name' },
            { header: 'Aadhaar ID', dataKey: 'aadhaar' },
            { header: 'Workforce Category', dataKey: 'category' },
            { header: 'Attendance Status', dataKey: 'status' },
            { header: 'Calculated Wage', dataKey: 'wage' }
        ];

        const config = {
            title: 'Daily Attendance Report',
            subtitle: `Date: ${formattedDate}`,
            filename: `Attendance_${selectedDate}`,
            columns,
            data: exportData,
            userName: user?.email || 'Admin'
        };

        if (format === 'pdf') exportToPDF(config);
        else exportToExcel(config);
        setShowExportMenu(false);
    };

    const stats = useMemo(() => {
        const marked = savedRecords.length + Object.keys(attendance).length;
        const total = labours.length;
        return { marked, total, pending: total - marked };
    }, [labours, savedRecords, attendance]);

    return (
        <div className="flex-col gap-6" style={{ display: 'flex', paddingBottom: '4rem' }}>
            <div className="flex-row justify-between items-start mobile-stack" style={{ flexWrap: 'wrap', gap: '2rem' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1 style={{ marginBottom: '0.25rem' }}>Site Attendance</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="glass-panel" style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '2rem' }}>
                            <CalendarIcon size={16} color="var(--color-primary)" />
                            <input
                                type="date"
                                value={selectedDate}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-main)', fontWeight: 800, cursor: 'pointer', outline: 'none' }}
                            />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formattedDate}</h3>
                    </div>
                </div>

                <div className="flex-row gap-3 mobile-stack">
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="btn"
                            disabled={savedRecords.length === 0}
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-main)', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <Download size={18} style={{ marginRight: '0.5rem' }} />
                            Export Report
                        </button>
                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="glass-panel"
                                    style={{ position: 'absolute', top: '110%', right: 0, zIndex: 100, padding: '0.5rem', minWidth: '160px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                                >
                                    <button onClick={() => handleExport('pdf')} className="flex-row items-center gap-3" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'transparent', color: 'white', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                                        <FileText size={16} color="#ff6b6b" /> <span style={{ fontWeight: 600 }}>PDF Document</span>
                                    </button>
                                    <button onClick={() => handleExport('excel')} className="flex-row items-center gap-3" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'transparent', color: 'white', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                                        <Table size={16} color="#43e97b" /> <span style={{ fontWeight: 600 }}>Excel Sheet</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={markAllPresent}
                        className="btn"
                        style={{ background: 'rgba(67, 233, 123, 0.1)', color: '#43e97b', fontWeight: 800, border: '1px solid rgba(67, 233, 123, 0.2)' }}
                        disabled={loading || saving || stats.pending === 0}
                    >
                        Mark All Present
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                        disabled={saving || loading || stats.pending > 0}
                        style={{ padding: '0.75rem 2rem', boxShadow: stats.pending === 0 ? 'var(--shadow-glow-primary)' : 'none', opacity: stats.pending > 0 ? 0.6 : 1 }}
                    >
                        <Save size={18} style={{ marginRight: '0.5rem' }} />
                        {saving ? 'Saving...' : 'Confirm & Save'}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            padding: '1rem 1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                            background: message.type === 'success' ? 'rgba(67, 233, 123, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                            color: message.type === 'success' ? '#43e97b' : '#ff6b6b',
                            border: `1px solid ${message.type === 'success' ? '#43e97b44' : '#ff6b6b44'}`,
                            fontWeight: 700
                        }}
                    >
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '1.25rem' }}>
                <div className="flex-row justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                        Status: {stats.marked} / {stats.total} Marked
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: stats.pending === 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {stats.pending === 0 ? 'Ready to Sync' : `${stats.pending} remaining`}
                    </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.marked / stats.total) * 100}%` }}
                        style={{ height: '100%', background: 'var(--gradient-primary)', borderRadius: '4px' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: '40px', height: '40px', border: '3px solid rgba(102, 126, 234, 0.1)', borderTopColor: '#667eea', borderRadius: '50%' }} />
                    </div>
                ) : (
                    categories.concat({ id: 'unassigned', name: 'General Workforce' } as any).map(category => {
                        const categoryLabours = labours.filter(l => (l.categoryId === category.id || (category.id === 'unassigned' && !l.categoryId)));
                        if (categoryLabours.length === 0) return null;

                        return (
                            <div key={category.id}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                    <Tag size={16} color="var(--color-primary)" />
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                                        {category.name}
                                    </h3>
                                </div>
                                <div className="grid-3" style={{ gap: '1.5rem' }}>
                                    {categoryLabours.map((labour) => {
                                        const savedRecord = savedRecords.find(r => r.labourId === labour.id);
                                        const status = savedRecord ? savedRecord.status : (attendance[labour.id] || null);

                                        return (
                                            <motion.div
                                                key={labour.id}
                                                layout
                                                className="glass-panel"
                                                style={{
                                                    padding: '1.5rem',
                                                    border: '1px solid var(--color-border-light)',
                                                    opacity: savedRecord ? 0.75 : 1,
                                                    boxShadow: !savedRecord && !status ? '0 0 20px rgba(254, 202, 87, 0.05)' : 'none'
                                                }}
                                            >
                                                <div className="flex-row items-center gap-4" style={{ marginBottom: '1.5rem' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                                        {labour.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{labour.name}</h4>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Wage: ₹{labour.dailyWage}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(0,0,0,0.03)', padding: '0.25rem', borderRadius: '0.75rem' }}>
                                                    {[
                                                        { id: 'present', label: 'Present', color: 'var(--color-success)' },
                                                        { id: 'half-day', label: 'Half', color: 'var(--color-warning)' },
                                                        { id: 'absent', label: 'Absent', color: 'var(--color-danger)' }
                                                    ].map(s => (
                                                        <button
                                                            key={s.id}
                                                            disabled={!!savedRecord}
                                                            onClick={() => handleStatusChange(labour.id, s.id as any)}
                                                            style={{
                                                                flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                                                                background: status === s.id ? s.color : 'transparent',
                                                                color: status === s.id ? 'white' : 'var(--color-text-secondary)',
                                                                fontSize: '0.7rem', fontWeight: 800, cursor: !!savedRecord ? 'default' : 'pointer',
                                                                opacity: !!savedRecord && status !== s.id ? 0.3 : 1
                                                            }}
                                                        >
                                                            {s.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {savedRecord && (
                                                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                                        <button
                                                            onClick={async () => {
                                                                setAttendance(prev => ({ ...prev, [labour.id]: savedRecord.status as 'present' | 'absent' | 'half-day' }));
                                                                setSavedRecords(prev => prev.filter(r => r.id !== savedRecord.id));
                                                            }}
                                                            className="btn"
                                                            style={{ border: '1px solid var(--color-primary-light)', background: 'rgba(102, 126, 234, 0.1)', color: 'var(--color-primary)', padding: '0.3rem 1rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                        >
                                                            <Edit2 size={12} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRecord(savedRecord.id)}
                                                            className="btn"
                                                            style={{ border: '1px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.1)', color: '#ff7675', padding: '0.3rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                        >
                                                            <Trash2 size={12} />
                                                            Void Record
                                                        </button>
                                                    </div>
                                                )}

                                                {!savedRecord && !status && (
                                                    <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--color-warning)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                                                        ● PENDING DECISION
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}

                {labours.length === 0 && !loading && (
                    <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                        <AlertCircle size={40} color="var(--color-warning)" style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Active Workforce</h2>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>You need to add active labourers before you can mark attendance.</p>
                        <button onClick={() => window.location.href = '/labour'} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                            Go to Labour Management
                        </button>
                    </div>
                )}

                {labours.length > 0 && stats.marked === 0 && !loading && (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <Info size={32} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Ready for {formattedDate}?</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>No attendance has been recorded for today yet.</p>
                        <button onClick={markAllPresent} className="btn" style={{ background: 'var(--gradient-primary)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', fontWeight: 700 }}>
                            Mark Everyone Present
                        </button>
                    </div>
                )}

                {/* Historical Timeline Section */}
                <div style={{ marginTop: '5rem', borderTop: '2px dashed rgba(255,255,255,0.05)', paddingTop: '4rem' }}>
                    <div className="flex-row items-center gap-3" style={{ marginBottom: '2.5rem' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '15px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <History size={22} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-text-main)' }}>Activity Timeline</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Grouped audit of workforce deployment for {format(parseISO(selectedDate), 'MMM yyyy')}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        {savedRecords.length > 0 ? (
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%)', padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 10px var(--color-success)' }} />
                                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
                                            {format(parseISO(selectedDate), 'EEEE, do MMMM yyyy')}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        {savedRecords.length} Workers Documented
                                    </div>
                                </div>
                                <div style={{ padding: '0.5rem 0' }}>
                                    {savedRecords.map((record, idx) => {
                                        const labour = labours.find(l => l.id === record.labourId);
                                        return (
                                            <div key={record.id} style={{ display: 'flex', borderBottom: idx === savedRecords.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }} className="items-center justify-between padding-responsive mobile-stack">
                                                <style>{`
                                                    .padding-responsive { padding: 1.25rem 2.5rem; }
                                                    @media (max-width: 768px) { .padding-responsive { padding: 1rem; } }
                                                `}</style>
                                                <div className="flex-row items-center gap-4">
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                                                        {labour?.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>{labour?.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>ID: {labour?.aadhaar.slice(-4)} • Rate: ₹{labour?.dailyWage}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>₹{record.wageCalculated}</div>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Daily Payout</div>
                                                    </div>
                                                    <div style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '0.75rem',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 900,
                                                        textTransform: 'uppercase',
                                                        minWidth: '90px',
                                                        textAlign: 'center',
                                                        background: record.status === 'present' ? 'rgba(67, 233, 123, 0.1)' : record.status === 'absent' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(254, 202, 87, 0.1)',
                                                        color: record.status === 'present' ? 'var(--color-success)' : record.status === 'absent' ? 'var(--color-danger)' : 'var(--color-warning)',
                                                        border: `1px solid ${record.status === 'present' ? 'rgba(67, 233, 123, 0.2)' : record.status === 'absent' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(254, 202, 87, 0.2)'}`
                                                    }}>
                                                        {record.status}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.05)' }}>
                                <Info size={40} color="var(--color-text-muted)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Log Clear for {format(parseISO(selectedDate), 'MMM do')}</h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>No historical records found for this specific date selection.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarkAttendance;
