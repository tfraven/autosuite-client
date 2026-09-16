import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Bike, 
  Receipt, 
  AlertTriangle, 
  CreditCard,
  PlusCircle,
  FileSpreadsheet,
  ArrowUpRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ setActiveTab, onOpenNewSale, onOpenNewBike }) {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatPKR = (amount) => {
    return 'PKR ' + Number(amount || 0).toLocaleString('en-PK');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="module-loading">
        <div className="spinner"></div>
        <span>Syncing Live Dealership Financial Intelligence...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      {/* Top Welcome Hero Banner */}
      <div className="welcome-banner glass-panel">
        <div className="welcome-content">
          <h2>{getGreeting()}, {user?.name || 'Administrator'}</h2>
          <p>
            Real-time dealership telemetry: fleet inventory distribution, installment receivables ledger, spare parts thresholds, and excise registrations.
          </p>
        </div>
        <div className="quick-actions">
          {hasPermission('CREATE_SALE') && (
            <button className="btn btn-primary" onClick={onOpenNewSale}>
              <PlusCircle size={16} /> New Sale Entry
            </button>
          )}
          {hasPermission('MANAGE_BIKES') && (
            <button className="btn btn-secondary" onClick={onOpenNewBike}>
              <Bike size={16} /> Add Bike Stock
            </button>
          )}
          {hasPermission('EXPORT_EXCEL') && (
            <button className="btn btn-outline" onClick={() => api.downloadExcel('bikes')}>
              <FileSpreadsheet size={16} /> Export Stock Sheet
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Gross Dealership Revenue</span>
            <div className="kpi-icon icon-emerald">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="kpi-value">{formatPKR(stats?.totalRevenue)}</div>
          <div className="kpi-footer">
            <span className="badge-emerald glass-badge">{stats?.totalSalesCount || 0} Deals Completed</span>
            <span className="kpi-subtext font-medium">B2C & B2B Orders</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Motorcycle Stock</span>
            <div className="kpi-icon icon-cyan">
              <Bike size={22} />
            </div>
          </div>
          <div className="kpi-value">{stats?.inStockBikes || 0} <span className="value-unit">Units Ready</span></div>
          <div className="kpi-footer">
            <span className="badge-cyan glass-badge">{stats?.soldBikes || 0} Delivered</span>
            <span className="kpi-subtext font-medium">Catalog: {stats?.totalBikes} Total</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Installment Receivables</span>
            <div className="kpi-icon icon-amber">
              <CreditCard size={22} />
            </div>
          </div>
          <div className="kpi-value">{formatPKR(stats?.totalOutstandingCredit)}</div>
          <div className="kpi-footer">
            <span className="badge-amber glass-badge">Active Credit Ledger</span>
            <span className="kpi-subtext font-medium">Scheduled monthly plans</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Operational Alerts</span>
            <div className="kpi-icon icon-rose">
              <AlertTriangle size={22} />
            </div>
          </div>
          <div className="kpi-value">
            {stats?.lowStockPartsCount || 0}
            <span className="value-unit"> Low Parts</span>
          </div>
          <div className="kpi-footer">
            <span className="badge-rose glass-badge">{stats?.pendingPaperworkCount || 0} Papers in Pipeline</span>
            <span className="kpi-subtext font-medium">Excise & OEM letters</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Top Models & Recent Sales */}
      <div className="dashboard-details-grid">
        {/* Top Selling Models */}
        <div className="card glass-panel">
          <div className="card-header">
            <h3>Top Selling Models</h3>
            <span className="header-tag">By Volume</span>
          </div>
          <div className="top-models-list">
            {stats?.topModels && stats.topModels.length > 0 ? (
              stats.topModels.map((item, idx) => {
                const percentage = Math.min(100, Math.round((item.count / (stats.totalSalesCount || 1)) * 100));
                return (
                  <div key={idx} className="model-row">
                    <div className="model-info">
                      <span className="model-rank">#{idx + 1}</span>
                      <span className="model-name">{item.model}</span>
                    </div>
                    <div className="model-bar-wrap">
                      <div 
                        className="model-bar"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="model-stats">
                      <span className="model-count">{item.count} units ({percentage}%)</span>
                      <span className="model-rev">{formatPKR(item.revenue)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-placeholder">No sales data recorded yet.</div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card glass-panel">
          <div className="card-header">
            <h3>Recent Sales & Bookings</h3>
            <button className="link-btn" onClick={() => setActiveTab('sales')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentSales && stats.recentSales.length > 0 ? (
                  stats.recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-mono text-cyan font-bold">{sale.invoiceNumber}</td>
                      <td>
                        <div className="customer-cell">
                          <span className="c-name">{sale.customerName}</span>
                          <span className="c-phone text-muted">{sale.customerPhone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="bike-cell">
                          <span className="font-medium text-main">{sale.bike?.modelName}</span>
                          <span className="text-faint font-mono text-xs">
                            {sale.bike?.chassisNumber}
                          </span>
                        </div>
                      </td>
                      <td className="font-bold text-main">{formatPKR(sale.finalAmount)}</td>
                      <td>
                        <span className={`glass-badge ${
                          sale.paymentType === 'CASH' ? 'badge-emerald' :
                          sale.paymentType === 'CREDIT_INSTALLMENT' ? 'badge-amber' : 'badge-cyan'
                        }`}>
                          {sale.paymentType.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-placeholder">No transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
