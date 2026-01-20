import { useState, useEffect } from 'react';
import { isFuture } from 'date-fns';
import { Calendar as CalendarIcon, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { storage } from '../../services/storage';
import type { Labour, AttendanceRecord } from '../../types';
import { motion } from 'framer-motion';

const MarkAttendance = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [labours, setLabours] = useState<Labour[]>([]);
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'half-day'>>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        // Load Labours
        const allLabours = storage.getLabours().filter(l => l.status === 'active');
        setLabours(allLabours);

        // Load Attendance for selected date
        loadAttendanceForDate(selectedDate);
    }, [selectedDate]);

    const loadAttendanceForDate = (date: string) => {
        const records = storage.getAttendance().filter(r => r.date === date);

        // Map to state
        const attendanceMap: Record<string, 'present' | 'absent' | 'half-day'> = {};
        records.forEach(r => {
            attendanceMap[r.labourId] = r.status;
        });
        setAttendance(attendanceMap);
    };

    const handleStatusChange = (labourId: string, status: 'present' | 'absent' | 'half-day') => {
        setAttendance(prev => ({ ...prev, [labourId]: status }));
    };

    const handleSave = () => {
        if (isFuture(new Date(selectedDate))) {
            setMessage({ type: 'error', text: 'Cannot mark attendance for future dates.' });
            return;
        }

        try {
            const recordsToSave: AttendanceRecord[] = labours.map(labour => {
                const status = attendance[labour.id] || 'present';
                return {
                    id: `${labour.id}_${selectedDate}`,
                    labourId: labour.id,
                    date: selectedDate,
                    status: status,
                    wageCalculated: calculateWage(labour.dailyWage, status)
                };
            });

            recordsToSave.forEach(record => {
                storage.saveAttendance(record);
            });

            setMessage({ type: 'success', text: 'Attendance saved successfully!' });
            loadAttendanceForDate(selectedDate);
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to save attendance.' });
        }
    };

    const calculateWage = (dailyWage: number, status: string) => {
        if (status === 'present') return dailyWage;
        if (status === 'half-day') return dailyWage / 2;
        return 0;
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        if (isFuture(new Date(newDate))) {
            alert('Cannot select future date');
            return;
        }
        setSelectedDate(newDate);
    };

    return (
        <div className="flex-col gap-6" style={{ display: 'flex' }}>
            <div className="flex-row justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1>Mark Attendance</h1>
                    <p>Record daily attendance for all active labours</p>
                </div>
                <div className="flex-row items-center gap-4">
                    <div className="input-group">
                        <CalendarIcon className="input-icon" size={18} />
                        <input
                            type="date"
                            value={selectedDate}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={handleDateChange}
                            className="input-field"
                            style={{ width: '12rem' }}
                        />
                    </div>
                    <button onClick={handleSave} className="btn btn-primary">
                        <Save size={18} style={{ marginRight: '0.5rem' }} />
                        Save Records
                    </button>
                </div>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                        color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'
                    }}
                >
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </motion.div>
            )}

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Labour Name</th>
                                <th>ID</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Wage Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            {labours.map((labour) => {
                                const status = attendance[labour.id] || 'present';
                                return (
                                    <tr key={labour.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{labour.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{labour.designation || 'Helper'}</div>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{labour.aadhaar.slice(-4)}</td>
                                        <td>
                                            <div className="flex-center gap-2" style={{ background: '#F1F5F9', padding: '0.4rem', borderRadius: '0.5rem', width: 'fit-content', margin: '0 auto' }}>
                                                <button
                                                    onClick={() => handleStatusChange(labour.id, 'present')}
                                                    className="btn"
                                                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', background: status === 'present' ? 'var(--color-success)' : 'transparent', color: status === 'present' ? 'white' : 'var(--color-text-secondary)' }}
                                                >
                                                    P
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(labour.id, 'half-day')}
                                                    className="btn"
                                                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', background: status === 'half-day' ? 'var(--color-warning)' : 'transparent', color: status === 'half-day' ? 'white' : 'var(--color-text-secondary)' }}
                                                >
                                                    HD
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(labour.id, 'absent')}
                                                    className="btn"
                                                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', background: status === 'absent' ? 'var(--color-danger)' : 'transparent', color: status === 'absent' ? 'white' : 'var(--color-text-secondary)' }}
                                                >
                                                    A
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ fontWeight: 500 }}>
                                                ₹{calculateWage(labour.dailyWage, status)}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>of ₹{labour.dailyWage}</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {labours.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No active labours found. Add some labours first.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarkAttendance;
