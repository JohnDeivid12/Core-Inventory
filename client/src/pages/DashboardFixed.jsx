import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Package, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  AlertTriangle, XCircle, TrendingUp, Clock, CheckCircle2
} from 'lucide-react';

const CHART_COLORS = {
  receipt: '#6366f1',
  delivery: '#22c55e',
  transfer: '#f59e0b',
  adjustment: '#3b82f6'
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Dashboard: Fetching data...');
        const response = await api.get('/dashboard');
        
        console.log('✅ Dashboard: Data received:', response.data);
        
        if (response.data.success && response.data.data) {
          setData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Invalid response format');
        }
      } catch (err) {
        console.error('❌ Dashboard: Error fetching data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px'
      }}>
        <div style={{ 
          background: 'var(--danger-dim)', 
          color: 'var(--danger)', 
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h3>❌ Dashboard Error</h3>
          <p>{error}</p>
          <button 
            onClick={handleRetry}
            className="btn btn-primary"
            style={{ marginTop: '15px' }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <p style={{ color: 'var(--text-muted)' }}>No dashboard data available</p>
        <button onClick={handleRetry} className="btn btn-secondary">
          🔄 Retry
        </button>
      </div>
    );
  }

  const { kpis, recentMoves } = data;

  // Build chart data for last 7 days with error handling
  const chartMap = {};
  if (Array.isArray(recentMoves)) {
    recentMoves.forEach(m => {
      if (m && m.id && m.id.date && m.id.type && m.count !== undefined) {
        const d = m.id.date;
        if (!chartMap[d]) {
          chartMap[d] = { date: d, receipt: 0, delivery: 0, transfer: 0, adjustment: 0 };
        }
        chartMap[d][m.id.type] = m.count;
      }
    });
  }
  const chartData = Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date));

  const kpiCards = [
    { label: 'Total Products', value: kpis.totalProducts || 0, icon: <Package size={20} />, color: 'var(--accent)', colorDim: 'var(--accent-dim)', to: '/products' },
    { label: 'Low Stock Items', value: kpis.lowStockCount || 0, icon: <AlertTriangle size={20} />, color: 'var(--warning)', colorDim: 'var(--warning-dim)', to: '/products?lowStock=true' },
    { label: 'Out of Stock', value: kpis.outOfStockCount || 0, icon: <XCircle size={20} />, color: 'var(--danger)', colorDim: 'var(--danger-dim)', to: '/products' },
    { label: 'Pending Receipts', value: kpis.pendingReceipts || 0, icon: <ArrowDownToLine size={20} />, color: '#6366f1', colorDim: 'rgba(99,102,241,0.12)', to: '/receipts' },
    { label: 'Pending Deliveries', value: kpis.pendingDeliveries || 0, icon: <ArrowUpFromLine size={20} />, color: 'var(--success)', colorDim: 'var(--success-dim)', to: '/deliveries' },
    { label: 'Scheduled Transfers', value: kpis.pendingTransfers || 0, icon: <ArrowLeftRight size={20} />, color: 'var(--warning)', colorDim: 'var(--warning-dim)', to: '/transfers' },
    { label: 'Late Receipts', value: kpis.lateReceipts || 0, icon: <Clock size={20} />, color: 'var(--danger)', colorDim: 'var(--danger-dim)', to: '/receipts' },
    { label: 'Done Today', value: kpis.doneToday || 0, icon: <CheckCircle2 size={20} />, color: 'var(--success)', colorDim: 'var(--success-dim)', to: '/history' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ 
        background: 'var(--bg-elevated)', 
        border: '1px solid var(--border)', 
        borderRadius: 8, 
        padding: '10px 14px', 
        fontSize: 12.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Inventory Dashboard</h2>
          <p>Real-time overview of your stock operations</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => navigate('/receipts')}>
            <ArrowDownToLine size={15} /> New Receipt
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/deliveries')}>
            <ArrowUpFromLine size={15} /> New Delivery
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpiCards.map((k) => (
          <div
            key={k.label}
            className="kpi-card"
            style={{ '--kpi-color': k.color, '--kpi-color-dim': k.colorDim }}
            onClick={() => navigate(k.to)}
          >
            <div className="kpi-icon">
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Activity (Last 7 Days)</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Operations completed by type</div>
            </div>
            <TrendingUp size={18} style={{ color: 'var(--accent-light)' }} />
          </div>
          
          {chartData.length > 0 ? (
            <div style={{ height: '220px' }}>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '80px' }}>
                📊 Chart data available for {chartData.length} days
              </p>
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Chart rendering requires recharts library
              </p>
            </div>
          ) : (
            <div className="empty-state" style={{ paddingTop: 40 }}>
              <TrendingUp size={40} />
              <p>No activity in the last 7 days</p>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Operations Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Receipts Pending', val: kpis.pendingReceipts || 0, late: kpis.lateReceipts || 0, color: 'var(--accent)', to: '/receipts' },
              { label: 'Deliveries Pending', val: kpis.pendingDeliveries || 0, late: kpis.lateDeliveries || 0, color: 'var(--success)', to: '/deliveries' },
              { label: 'Transfers Pending', val: kpis.pendingTransfers || 0, late: 0, color: 'var(--warning)', to: '/transfers' },
            ].map(s => (
              <div key={s.label}
                onClick={() => navigate(s.to)}
                style={{ 
                  background: 'var(--bg-elevated)', 
                  borderRadius: 10, 
                  padding: '14px 16px', 
                  cursor: 'pointer', 
                  border: '1px solid var(--border)', 
                  transition: 'all 0.2s' 
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{s.label}</span>
                  <span style={{ fontWeight: 800, fontSize: 20, color: s.color }}>{s.val}</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, (s.val / 20) * 100)}%`, 
                    height: '100%', 
                    background: s.color, 
                    borderRadius: 4 
                  }} />
                </div>
                {s.late > 0 && <div style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 6 }}>⚠ {s.late} late</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: '20px' }}>
        {/* ... el código que ya tienes ... */}
      </div>

      {/* ===== Dashboard analítico de Looker Studio ===== */}
      <div className="card" style={{ marginTop: 24, padding: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
          Business Analytics (Looker Studio)
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Datos en vivo desde Supabase: KPIs, stock por categoría y estado de los movimientos
        </div>
        <div style={{ position: 'relative', width: '100%', height: 'min(85vh, 900px)', minHeight: 480 }}>
          <iframe
            title="Dashboard analítico CoreInventory"
            src="https://datastudio.google.com/embed/reporting/bb6668de-340f-46a4-aff4-ae316e768427/page/bP1AG"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, borderRadius: 8 }}
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    </div>
  );
}
