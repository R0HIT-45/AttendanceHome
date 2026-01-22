import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const Header = ({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) => {
    return (
        <header className="mobile-header" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 'var(--header-height)',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.25rem',
            zIndex: 'var(--z-header)',
            boxShadow: 'var(--shadow-md)',
            color: 'white'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>LAMS</h1>
                <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.2)',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '1rem',
                    textTransform: 'uppercase'
                }}>Admin</span>
            </div>

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
                    border: '1px solid rgba(255,255,255,0.2)'
                }}
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
        </header>
    );
};

export default Header;
