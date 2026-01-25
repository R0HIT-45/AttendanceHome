import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    CreditCard,
    BarChart3,
    LogOut,
    X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile?: boolean;
}

const Sidebar = ({ isOpen, onClose, isMobile }: SidebarProps) => {
    const { signOut, user } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/', animation: 'pulse' },
        { icon: Users, label: 'Labour Management', path: '/labour', animation: 'bounce' },
        { icon: CalendarCheck, label: 'Attendance', path: '/attendance', animation: 'rotate' },
        { icon: CreditCard, label: 'Salary & Leaves', path: '/salary', animation: 'pulse' },
        { icon: BarChart3, label: 'Reports', path: '/reports', animation: 'bounce' },
    ];

    // Animation variants for icons
    const iconVariants = {
        pulse: {
            scale: [1, 1.1, 1],
            transition: {
                duration: 0.5,
                ease: "easeInOut" as const
            }
        },
        bounce: {
            y: [0, -8, 0],
            transition: {
                duration: 0.4,
                ease: "easeOut" as const
            }
        },
        rotate: {
            rotate: [0, 15, -15, 0],
            transition: {
                duration: 0.5,
                ease: "easeInOut" as const
            }
        }
    };

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await signOut();
        }
    };

    return (
        <motion.aside
            initial={isMobile ? { x: -280, opacity: 0 } : { x: 0, opacity: 1 }}
            animate={{ x: isMobile && !isOpen ? -280 : 0, opacity: isMobile && !isOpen ? 0 : 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`sidebar ${isOpen ? 'open' : ''}`}
            style={isMobile ? { position: 'fixed', zIndex: 100 } : {}}
        >
            <div className="sidebar-header">
                <h1 className="brand-title">
                    LAMS <span className="brand-subtitle">Admin Panel</span>
                </h1>
                {isMobile && (
                    <button
                        className="sidebar-close-btn"
                        onClick={onClose}
                        style={{
                            padding: '0.5rem',
                            color: 'white',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        {({ isActive }) => (
                            <>
                                <motion.div
                                    whileHover={item.animation}
                                    variants={iconVariants}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))' : 'none'
                                    }}
                                >
                                    <item.icon size={20} />
                                </motion.div>
                                <span className="font-medium">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                {/* User info */}
                {user && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        marginBottom: '0.5rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.85rem',
                    }} className="user-info-text">
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                            {user.user_metadata?.name || 'Admin User'}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                            {user.email}
                        </div>
                    </div>
                )}

                <motion.button
                    className="logout-btn"
                    onClick={handleLogout}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <motion.div
                        whileHover={{ rotate: [0, -15, 15, 0] }}
                        transition={{ duration: 0.5 }}
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <LogOut size={20} />
                    </motion.div>
                    <span className="font-medium">Logout</span>
                </motion.button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
