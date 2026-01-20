import { useEffect, useState } from 'react';
import { Users, CheckCircle2, AlertCircle, IndianRupee } from 'lucide-react';
import { database } from '../services/database';
import { motion, useMotionValue, useTransform, useSpring, animate } from 'framer-motion';

// Animated Counter Component
const AnimatedCounter = ({ value, prefix = '', suffix = '' }: { value: number | string, prefix?: string, suffix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const isNumber = typeof value === 'number';

    useEffect(() => {
        if (isNumber) {
            const controls = animate(0, value, {
                duration: 1.5,
                ease: "easeOut",
                onUpdate(val) {
                    setDisplayValue(Math.floor(val));
                }
            });
            return () => controls.stop();
        }
    }, [value, isNumber]);

    if (!isNumber) {
        return <>{prefix}{value}{suffix}</>;
    }

    return <>{prefix}{displayValue.toLocaleString()}{suffix}</>;
};

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalLabours: 0,
        activeLabours: 0,
        presentToday: 0,
        totalCostMonth: 0
    });

    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {

                setError('');

                const labours = await database.getLabours();
                const attendance = await database.getAttendance();

                const today = new Date().toISOString().split('T')[0];
                const thisMonth = today.slice(0, 7);

                const active = labours.filter(l => l.status === 'active').length;
                const present = attendance.filter(r => r.date === today && r.status === 'present').length;
                const monthlyCost = attendance
                    .filter(r => r.date.startsWith(thisMonth))
                    .reduce((sum, r) => sum + r.wageCalculated, 0);

                setStats({
                    totalLabours: labours.length,
                    activeLabours: active,
                    presentToday: present,
                    totalCostMonth: monthlyCost
                });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data. Please check your database connection.');
            } finally {

            }
        };

        fetchDashboardData();

        // Real-time subscriptions
        const unsubscribeLabours = database.subscribeToLabours(() => {
            fetchDashboardData();
        });

        const unsubscribeAttendance = database.subscribeToAttendance(() => {
            fetchDashboardData();
        });

        return () => {
            unsubscribeLabours();
            unsubscribeAttendance();
        };
    }, []);

    const widgets = [
        {
            label: 'Active Workforce',
            value: stats.activeLabours,
            icon: Users,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            shadowColor: 'rgba(102, 126, 234, 0.4)'
        },
        {
            label: 'Attendance Today',
            value: stats.presentToday,
            icon: CheckCircle2,
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            shadowColor: 'rgba(67, 233, 123, 0.4)'
        },
        {
            label: 'Est. Monthly Cost',
            value: stats.totalCostMonth,
            icon: IndianRupee,
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            shadowColor: 'rgba(250, 112, 154, 0.4)',
            isRupee: true
        },
        {
            label: 'Inactive / On Leave',
            value: stats.totalLabours - stats.activeLabours,
            icon: AlertCircle,
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            shadowColor: 'rgba(240, 147, 251, 0.4)'
        },
    ];

    // 3D Tilt Effect Hook
    const Card3D = ({ children, index }: { children: React.ReactNode; index: number }) => {
        const x = useMotionValue(0);
        const y = useMotionValue(0);

        const rotateX = useTransform(y, [-100, 100], [5, -5]);
        const rotateY = useTransform(x, [-100, 100], [-5, 5]);

        const springConfig = { stiffness: 300, damping: 30 };
        const rotateXSpring = useSpring(rotateX, springConfig);
        const rotateYSpring = useSpring(rotateY, springConfig);

        return (
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: index * 0.1,
                    duration: 0.6,
                    ease: "easeOut"
                }}
                whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.3 }
                }}
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    x.set(e.clientX - centerX);
                    y.set(e.clientY - centerY);
                }}
                onMouseLeave={() => {
                    x.set(0);
                    y.set(0);
                }}
                style={{
                    rotateX: rotateXSpring,
                    rotateY: rotateYSpring,
                    transformStyle: 'preserve-3d',
                    perspective: 1000,
                }}
                className="card"
            >
                {children}
            </motion.div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="page-header">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    Dashboard Overview
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    Welcome back, Admin. Here's what's happening today.
                </motion.p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel"
                    style={{
                        marginBottom: '2rem',
                        padding: '1rem 1.5rem',
                        background: 'linear-gradient(135deg, rgba(245, 87, 108, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%)',
                        border: '1px solid rgba(245, 87, 108, 0.3)',
                        borderRadius: '0.75rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertCircle size={20} style={{ color: '#f5576c', flexShrink: 0 }} />
                        <p style={{ color: '#f5576c', margin: 0, fontWeight: 500 }}>
                            {error}
                        </p>
                    </div>
                </motion.div>
            )}

            <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
                {widgets.map((widget, index) => (
                    <Card3D key={index} index={index}>
                        <div className="flex-row justify-between" style={{ alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                            <div style={{ flex: 1 }}>
                                <p style={{
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    marginBottom: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {widget.label}
                                </p>
                                <h3 style={{
                                    fontSize: '2.25rem',
                                    fontWeight: 800,
                                    background: widget.gradient,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}>
                                    {widget.isRupee ? (
                                        <AnimatedCounter value={widget.value} prefix="₹" />
                                    ) : (
                                        <AnimatedCounter value={widget.value} />
                                    )}
                                </h3>
                            </div>

                            <motion.div
                                style={{
                                    padding: '1rem',
                                    borderRadius: '1rem',
                                    background: widget.gradient,
                                    color: 'white',
                                    boxShadow: `0 8px 24px ${widget.shadowColor}`,
                                    position: 'relative',
                                }}
                                whileHover={{
                                    rotate: [0, -10, 10, 0],
                                    transition: { duration: 0.5 }
                                }}
                            >
                                <widget.icon size={28} strokeWidth={2.5} />
                            </motion.div>
                        </div>

                        <div style={{
                            marginTop: '1.25rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid var(--color-border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            color: 'var(--color-text-muted)',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                                style={{
                                    height: '3px',
                                    background: widget.gradient,
                                    borderRadius: '999px',
                                    marginRight: '0.5rem'
                                }}
                            />
                            <span>Live Data</span>
                        </div>
                    </Card3D>
                ))}
            </div>

            {/* Charts Placeholder with Loading Animation */}
            <div className="grid-2">
                <motion.div
                    className="glass-panel flex-center"
                    style={{
                        height: '20rem',
                        flexDirection: 'column',
                        gap: '1rem',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <motion.div
                        animate={{
                            rotate: 360,
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            border: '4px solid transparent',
                            borderTopColor: '#667eea',
                            borderRightColor: '#764ba2',
                        }}
                    />
                    <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        Attendance Trend Chart
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        Loading analytics...
                    </p>
                </motion.div>

                <motion.div
                    className="glass-panel flex-center"
                    style={{
                        height: '20rem',
                        flexDirection: 'column',
                        gap: '1rem',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <motion.div
                        animate={{
                            rotate: -360,
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            border: '4px solid transparent',
                            borderTopColor: '#43e97b',
                            borderRightColor: '#38f9d7',
                        }}
                    />
                    <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        Cost Analysis Chart
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        Loading analytics...
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
