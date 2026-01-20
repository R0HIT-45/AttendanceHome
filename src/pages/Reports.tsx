import { BarChart3 } from 'lucide-react';

const Reports = () => {
    return (
        <div className="flex-col gap-6" style={{ display: 'flex' }}>
            <div className="page-header">
                <h1>Reports & Analytics</h1>
                <p>Generate detailed reports and view system analytics</p>
            </div>

            <div className="glass-panel" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', textAlign: 'center' }}>
                <div style={{ width: '5rem', height: '5rem', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <BarChart3 size={40} style={{ color: '#94A3B8' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Reports Coming Soon</h3>
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: '24rem' }}>
                    Advanced analytics, PDF export customization, and workforce insights will be available in the next update.
                </p>
                <button className="btn btn-primary" style={{ marginTop: '2rem' }}>
                    Notify Me When Ready
                </button>
            </div>
        </div>
    );
};

export default Reports;
