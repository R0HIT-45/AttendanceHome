import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    isMobile?: boolean;
}

const Header = ({ isSidebarOpen, setIsSidebarOpen, isMobile }: HeaderProps) => {
    return (
        <header className="mobile-header" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 'var(--header-height)',
            background: 'var(--gradient-primary)',
            display: isMobile ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.25rem',
            zIndex: 'var(--z-header)',
            boxShadow: 'var(--shadow-md)',
            color: 'white'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        marginRight: '0.5rem'
                    }}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </motion.button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>LAMS</h1>
            </div>
        </header>
    );
};

export default Header;
