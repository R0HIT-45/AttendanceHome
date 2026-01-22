import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, FileText, Table, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { database } from '../../services/database';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import type { Labour, AttendanceRecord } from '../../types';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const SalaryReport = () => {
    const [labours, setLabours] = useState<Labour[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [labourData, attendanceData] = await Promise.all([
                    database.getLabours(),
                    database.getAttendance({ startDate, endDate })
                ]);
                setLabours(labourData);
                setAttendance(attendanceData);
            } catch (error) {
                console.error('Error loading report data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [startDate, endDate]);

    const stats = useMemo(() => {
        const reports = labours.map(labour => {
            const labourAttendance = attendance.filter(a => a.labourId === labour.id);
            const present = labourAttendance.filter(a => a.status === 'present').length;
            const halfDays = labourAttendance.filter(a => a.status === 'half-day').length;
            const totalWage = labourAttendance.reduce((sum, a) => sum + a.wageCalculated, 0);

            return {
                ...labour,
                present,
                halfDays,
                totalAttendance: present + (halfDays * 0.5),
                totalWage,
                dailyHistory: labourAttendance.sort((a, b) => b.date.localeCompare(a.date))
            };
        });

        const totalCompanyWage = reports.reduce((sum, r) => sum + r.totalWage, 0);
        return { reports, totalCompanyWage };
    }, [labours, attendance]);

    const groupedByDate = useMemo(() => {
        const groups: Record<string, { date: string; records: any[]; totalWage: number }> = {};
        attendance.forEach(record => {
            if (!groups[record.date]) {
                groups[record.date] = { date: record.date, records: [], totalWage: 0 };
            }
            groups[record.date].records.push(record);
            groups[record.date].totalWage += record.wageCalculated;
        });
        return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
    }, [attendance]);

    const filteredDates = groupedByDate.map(g => {
        const filteredRecords = g.records.filter(r => {
            const labour = labours.find(l => l.id === r.labourId);
            return !searchTerm ||
                labour?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                labour?.aadhaar.includes(searchTerm);
        });
        return { ...g, records: filteredRecords };
    }).filter(g => g.records.length > 0);

    const handleExport = async (formatType: 'pdf' | 'excel') => {
        const { data: { user } } = await supabase.auth.getUser();
        const exportData = stats.reports.map(r => ({
            name: r.name,
            aadhaar: r.aadhaar,
            attendance: r.totalAttendance,
            wage: `₹${r.totalWage.toLocaleString()}`,
            details: r.dailyHistory.map(h => `${format(parseISO(h.date), 'dd MMM')}: ${h.status}`).join(', ')
        }));

        const columns = [
            { header: 'Labourer Name', dataKey: 'name' },
            { header: 'Aadhaar ID', dataKey: 'aadhaar' },
            { header: 'Days Worked', dataKey: 'attendance' },
            { header: 'Monthly Wage', dataKey: 'wage' },
            { header: 'Detailed Breakdown', dataKey: 'details' }
        ];

        const config = {
            title: 'Monthly Payroll Report',
            subtitle: `Period: ${format(parseISO(startDate), 'dd MMM')} - ${format(parseISO(endDate), 'dd MMM yyyy')}`,
            filename: `Payroll_${startDate}_to_${endDate}`,
            columns,
            data: exportData,
            userName: user?.email || 'Admin'
        };

        if (formatType === 'pdf') exportToPDF(config);
        else exportToExcel(config);
        setShowExportMenu(false);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: '40px', height: '40px', border: '3px solid rgba(102, 126, 234, 0.1)', borderTopColor: '#667eea', borderRadius: '50%' }}
                />
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div className="flex-row justify-between items-end" style={{ marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1 style={{ marginBottom: '0.25rem' }}>Salary & Payroll</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Financial auditing and workforce expenditure</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="search-container" style={{ width: '300px', height: '48px' }}>
                        <Search size={18} color="var(--color-text-muted)" />
                        <input
                            type="text"
                            placeholder="Search by worker or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input"
                            style={{ paddingLeft: '2.8rem', height: '100%' }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="btn btn-primary"
                            style={{ height: '48px', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800 }}
                        >
                            <Download size={18} />
                            Export Data
                        </button>
                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="glass-panel"
                                    style={{
                                        position: 'absolute',
                                        top: '110%',
                                        right: 0,
                                        zIndex: 1000,
                                        padding: '0.5rem',
                                        minWidth: '180px',
                                        boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <button onClick={() => handleExport('pdf')} className="flex-row items-center gap-3" style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', background: 'transparent', color: 'white', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                                        <FileText size={16} color="#ff7675" /> <span style={{ fontWeight: 700 }}>Excel-Ready PDF</span>
                                    </button>
                                    <button onClick={() => handleExport('excel')} className="flex-row items-center gap-3" style={{ width: '100%', padding: '0.85rem', borderRadius: '0.5rem', background: 'transparent', color: 'white', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                                        <Table size={16} color="#55efc4" /> <span style={{ fontWeight: 700 }}>Spreadsheet (XLSX)</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="grid-1-2" style={{ gap: '2rem', marginBottom: '3rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Payroll Range</h3>
                    <div className="flex-row gap-4">
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>From Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input"
                                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>To Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input"
                                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Total Expenditure</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em' }}>
                            ₹{stats.totalCompanyWage.toLocaleString()}
                        </div>
                    </div>
                    <div style={{ width: '2px', height: '60px', background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Workforce Size</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.03em' }}>
                            {stats.reports.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Date-First Chronological Audit view */}
            <div className="flex-col gap-6" style={{ display: 'flex' }}>
                {filteredDates.length > 0 ? (
                    filteredDates.map((group) => (
                        <motion.div
                            key={group.date}
                            layout
                            className="glass-panel"
                            style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="flex-row items-center gap-4">
                                    <div style={{ width: '45px', height: '45px', borderRadius: '14px', background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CalendarIcon size={20} color="var(--color-primary)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text-main)', letterSpacing: '-0.01em' }}>
                                            {format(parseISO(group.date), 'EEEE, do MMMM yyyy')}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                            {group.records.length} Employees Deployed • Daily Audit
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
                                        ₹{group.totalWage.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Daily Total
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem 2.5rem' }}>
                                <div className="flex-row mobile-stack" style={{ borderBottom: '2px solid rgba(255,255,255,0.03)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                    <span style={{ flex: 2, fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Personnel</span>
                                    <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ID / Status</span>
                                    <span style={{ flex: 1, fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Wage (₹)</span>
                                </div>

                                {group.records.map((record, rIdx) => {
                                    const labour = labours.find(l => l.id === record.labourId);
                                    return (
                                        <div key={record.id} className="flex-row items-center mobile-stack" style={{ padding: '1rem 0', borderBottom: rIdx === group.records.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)' }}>
                                            <div className="flex-row items-center gap-4" style={{ flex: 2 }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', boxShadow: '0 4px 10px rgba(102, 126, 234, 0.2)' }}>
                                                    {labour?.name.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>{labour?.name || 'Unknown Labourer'}</span>
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>ID: •••• {labour?.aadhaar.slice(-4)}</div>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    padding: '0.3rem 0.75rem',
                                                    borderRadius: '0.6rem',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    background: record.status === 'present' ? 'rgba(67, 233, 123, 0.1)' : record.status === 'absent' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(254, 202, 87, 0.1)',
                                                    color: record.status === 'present' ? 'var(--color-success)' : record.status === 'absent' ? 'var(--color-danger)' : 'var(--color-warning)',
                                                    border: `1px solid ${record.status === 'present' ? 'rgba(67, 233, 123, 0.15)' : record.status === 'absent' ? 'rgba(255, 107, 107, 0.15)' : 'rgba(254, 202, 87, 0.15)'}`
                                                }}>{record.status}</div>
                                            </div>

                                            <div style={{ flex: 1, textAlign: 'right' }}>
                                                <div style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>₹{record.wageCalculated.toLocaleString()}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Base: ₹{labour?.dailyWage}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="glass-panel" style={{ padding: '6rem 3rem', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <AlertCircle size={32} color="var(--color-text-muted)" />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>No Records Found</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: 500, maxWidth: '400px', margin: '0 auto' }}>
                            There are no attendance logs for the period between {format(parseISO(startDate), 'do MMM')} and {format(parseISO(endDate), 'do MMM yyyy')}.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalaryReport;
