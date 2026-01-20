import { useState, useEffect } from 'react';
import { Download, IndianRupee, Calendar } from 'lucide-react';
import { storage } from '../../services/storage';
import type { Labour, AttendanceRecord } from '../../types';

const SalaryReport = () => {
    const [labours, setLabours] = useState<Labour[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        setLabours(storage.getLabours());
        setAttendance(storage.getAttendance());
    }, []);

    const getSalaryStats = (labour: Labour) => {
        const records = attendance.filter(r =>
            r.labourId === labour.id && r.date.startsWith(month)
        );

        const presentDays = records.filter(r => r.status === 'present').length;
        const halfDays = records.filter(r => r.status === 'half-day').length;
        const absentDays = records.filter(r => r.status === 'absent').length;

        const totalEarnings = records.reduce((sum, r) => sum + r.wageCalculated, 0);

        return { presentDays, halfDays, absentDays, totalEarnings };
    };

    const totalPayout = labours.reduce((sum, l) => sum + getSalaryStats(l).totalEarnings, 0);

    return (
        <div className="flex-col gap-6" style={{ display: 'flex' }}>
            <div className="flex-row justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1>Salary & Leave Report</h1>
                    <p>Monthly breakdown of labour costs and attendance</p>
                </div>
                <div className="flex-row items-center gap-4">
                    <div className="input-group">
                        <Calendar className="input-icon" size={18} />
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="input-field"
                            style={{ width: '12rem' }}
                        />
                    </div>
                    <button className="btn btn-primary" style={{ background: 'var(--color-primary-light)' }}>
                        <Download size={18} style={{ marginRight: '0.5rem' }} />
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white', border: 'none' }}>
                <h3 style={{ color: '#DBEAFE', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Total Payout ({month})</h3>
                <p style={{ fontSize: '1.875rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                    <IndianRupee size={24} style={{ marginRight: '0.25rem' }} />
                    {totalPayout.toLocaleString()}
                </p>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Labour Name</th>
                                <th style={{ textAlign: 'center' }}>Present</th>
                                <th style={{ textAlign: 'center' }}>Half-Days</th>
                                <th style={{ textAlign: 'center' }}>Absent</th>
                                <th style={{ textAlign: 'right' }}>Total Salary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {labours.map((labour) => {
                                const stats = getSalaryStats(labour);
                                return (
                                    <tr key={labour.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{labour.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Rate: ₹{labour.dailyWage}/day</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="badge badge-success">{stats.presentDays}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="badge badge-warning">{stats.halfDays}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="badge badge-danger">{stats.absentDays}</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                <IndianRupee size={14} />
                                                {stats.totalEarnings.toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {labours.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No data available.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalaryReport;
