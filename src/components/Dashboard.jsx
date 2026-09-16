import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Bike,
  AlertTriangle,
  CreditCard,
  PlusCircle,
  FileSpreadsheet,
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
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="module-loading">
        <div className="spinner"></div>
        <span>Loading today's figures</span>
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      <div className="welcome-banner glass-panel">
        <div className="welcome-content">
          <h2>{getGreeting()}, {user?.name || 'Administrator'}</h2>
          <p>
            Stock, receivables, parts levels and registration paperwork, as they stand right now.
          </p>
        </div>
        <div className="quick-actions">
          {hasPermission('CREATE_SALE') && (
            <button className="btn btn-primary" onClick={onOpenNewSale}>
              <PlusCircle size={16} /> New sale
            </button>
          )}
          {hasPermission('MANAGE_BIKES') && (
            <button className="btn btn-secondary" onClick={onOpenNewBike}>
              <Bike size={16} /> Add stock
            </button>
          )}
          {hasPermission('EXPORT_EXCEL') && (
            <button className="btn btn-outline" onClick={() => api.downloadExcel('bikes')}>
              <FileSpreadsheet size={16} /> Export stock sheet
            </button>
          )}
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Revenue</span>
            <div className="kpi-icon icon-emerald">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{formatPKR(stats?.totalRevenue)}</div>
          <div className="kpi-footer">
            <span className="badge-emerald glass-badge">{stats?.totalSalesCount || 0} sales</span>
            <span className="kpi-subtext">Retail and wholesale</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Motorcycles in stock</span>
            <div className="kpi-icon icon-cyan">
              <Bike size={18} />
            </div>
          </div>
          <div className="kpi-value">{stats?.inStockBikes || 0} <span className="value-unit">units</span></div>
          <div className="kpi-footer">
            <span className="badge-cyan glass-badge">{stats?.soldBikes || 0} delivered</span>
            <span className="kpi-subtext">{stats?.totalBikes} in the catalogue</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Outstanding installments</span>
            <div className="kpi-icon icon-amber">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="kpi-value">{formatPKR(stats?.totalOutstandingCredit)}</div>
          <div className="kpi-footer">
            <span className="badge-amber glass-badge">Owed to the dealership</span>
            <span className="kpi-subtext">Across active plans</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Needs attention</span>
            <div className="kpi-icon icon-rose">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value">
            {stats?.lowStockPartsCount || 0}
            <span className="value-unit"> parts low</span>
          </div>
          <div className="kpi-footer">
            <span className="badge-rose glass-badge">{stats?.pendingPaperworkCount || 0} papers pending</span>
            <span className="kpi-subtext">Excise and OEM letters</span>
          </div>
        </div>
      </div>

      <div className="dashboard-details-grid">
        <div className="card glass-panel">
          <div className="card-header">
            <h3>Best selling models</h3>
            <span className="header-tag">By units sold</span>
          </div>
          <div className="top-models-list">
            {stats?.topModels && stats.topModels.length > 0 ? (
              stats.topModels.map((item, idx) => {
                const percentage = Math.min(100, Math.round((item.count / (stats.totalSalesCount || 1)) * 100));
                return (
                  <div key={idx} className="model-row">
                    <div className="model-info">
                      <span className="model-rank">{idx + 1}</span>
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
              <div className="empty-placeholder">No sales recorded yet. Your first sale will show up here.</div>
            )}
          </div>
        </div>

        <div className="card glass-panel">
          <div className="card-header">
            <h3>Recent sales</h3>
            <button className="link-btn" onClick={() => setActiveTab('sales')}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Motorcycle</th>
                  <th>Amount</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentSales && stats.recentSales.length > 0 ? (
                  stats.recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-mono text-cyan">{sale.invoiceNumber}</td>
                      <td>
                        <div className="customer-cell">
                          <span className="c-name">{sale.customerName}</span>
                          <span className="c-phone">{sale.customerPhone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="bike-cell">
                          <span className="c-name">{sale.bike?.modelName}</span>
                          <span className="c-phone">{sale.bike?.chassisNumber}</span>
                        </div>
                      </td>
                      <td className="font-mono font-medium text-main">{formatPKR(sale.finalAmount)}</td>
                      <td>
                        <span className={`glass-badge ${sale.paymentType === 'CASH' ? 'badge-emerald' :
                          sale.paymentType === 'CREDIT_INSTALLMENT' ? 'badge-amber' : 'badge-cyan'
                          }`}>
                          {sale.paymentType.replace('_', ' ').toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-placeholder">No sales yet.</td>
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