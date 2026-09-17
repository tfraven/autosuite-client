import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  TrendingUp,
  Bike,
  CreditCard,
  Wrench,
  Layers,
  ArrowDownToLine
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [salesExportFilter, setSalesExportFilter] = useState({
    saleType: '',
    paymentMode: '',
    startDate: '',
    endDate: ''
  });

  const [downloading, setDownloading] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching report stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDownload = async (type, params = {}) => {
    try {
      setDownloading(type);
      await api.downloadExcel(type, params);
    } catch (err) {
      alert(err.message || 'Export failed');
    } finally {
      setDownloading('');
    }
  };

  const formatPKR = (amount) => {
    return 'PKR ' + Number(amount || 0).toLocaleString('en-PK');
  };

  return (
    <div className="reports-view">
      <div className="kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Revenue</span>
            <div className="kpi-icon icon-emerald"><TrendingUp size={18} /></div>
          </div>
          <div className="kpi-value">{formatPKR(stats?.totalRevenue)}</div>
          <div className="kpi-footer">
            <span className="badge-emerald glass-badge">All channels</span>
            <span className="kpi-subtext">{stats?.totalSalesCount || 0} sales</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Outstanding balance</span>
            <div className="kpi-icon icon-amber"><CreditCard size={18} /></div>
          </div>
          <div className="kpi-value">{formatPKR(stats?.totalOutstandingCredit)}</div>
          <div className="kpi-footer">
            <span className="badge-amber glass-badge">Receivable</span>
            <span className="kpi-subtext">Customer installment plans</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Sales by channel</span>
            <div className="kpi-icon icon-cyan"><Layers size={18} /></div>
          </div>
          <div className="channel-stats-row">
            <div className="flex justify-between items-center">
              <span className="text-muted">Retail (B2C)</span>
              <strong className="text-cyan">{stats?.b2cCount || 0} sales</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">Wholesale (B2B)</span>
              <strong className="text-purple">{stats?.b2bCount || 0} sales</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="section-title-wrap">
        <h3>Excel exports</h3>
        <p className="section-subtitle">
          Formatted .xlsx workbooks for accounting, audits and tax filing.
        </p>
      </div>

      <div className="export-cards-grid">
        <div className="export-card glass-panel">
          <div className="flex items-center justify-between">
            <div className="export-icon-box icon-cyan">
              <Bike size={20} />
            </div>
            <span className="glass-badge badge-cyan text-xs">Stock</span>
          </div>
          <div className="export-content">
            <h4>Motorcycle stock</h4>
            <p>New and used inventory with chassis, engine, year, dealer cost, retail price and margin.</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => handleDownload('bikes')}
            disabled={downloading === 'bikes'}
          >
            <ArrowDownToLine size={16} />
            {downloading === 'bikes' ? 'Preparing…' : 'Download'}
          </button>
        </div>

        <div className="export-card glass-panel">
          <div className="flex items-center justify-between">
            <div className="export-icon-box icon-purple">
              <Wrench size={20} />
            </div>
            <span className="glass-badge badge-purple text-xs">Parts</span>
          </div>
          <div className="export-content">
            <h4>Spare parts stock</h4>
            <p>Part codes, bin locations, cost and wholesale price, quantity on hand and reorder levels.</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => handleDownload('parts')}
            disabled={downloading === 'parts'}
          >
            <ArrowDownToLine size={16} />
            {downloading === 'parts' ? 'Preparing…' : 'Download'}
          </button>
        </div>

        <div className="export-card glass-panel">
          <div className="flex items-center justify-between">
            <div className="export-icon-box icon-amber">
              <CreditCard size={20} />
            </div>
            <span className="glass-badge badge-amber text-xs">Receivables</span>
          </div>
          <div className="export-content">
            <h4>Installment ledger</h4>
            <p>Every customer with a pending plan: due dates, amounts paid and balance outstanding.</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => handleDownload('credit-ledger')}
            disabled={downloading === 'credit-ledger'}
          >
            <ArrowDownToLine size={16} />
            {downloading === 'credit-ledger' ? 'Preparing…' : 'Download'}
          </button>
        </div>

        <div className="export-card glass-panel full-col">
          <div className="sales-export-header">
            <div className="export-icon-box icon-emerald">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h4>Sales register</h4>
              <p>Narrow the register by date, channel and payment method before exporting.</p>
            </div>
          </div>

          <div className="sales-filter-row mt-3">
            <div className="filter-item">
              <label>Channel</label>
              <select
                value={salesExportFilter.saleType}
                onChange={(e) => setSalesExportFilter({ ...salesExportFilter, saleType: e.target.value })}
                className="form-input"
              >
                <option value="">All channels</option>
                <option value="B2C">Retail only</option>
                <option value="B2B">Wholesale only</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Payment method</label>
              <select
                value={salesExportFilter.paymentMode}
                onChange={(e) => setSalesExportFilter({ ...salesExportFilter, paymentMode: e.target.value })}
                className="form-input"
              >
                <option value="">All methods</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CREDIT_INSTALLMENT">Installments</option>
              </select>
            </div>

            <div className="filter-item">
              <label>From</label>
              <input
                type="date"
                value={salesExportFilter.startDate}
                onChange={(e) => setSalesExportFilter({ ...salesExportFilter, startDate: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="filter-item">
              <label>To</label>
              <input
                type="date"
                value={salesExportFilter.endDate}
                onChange={(e) => setSalesExportFilter({ ...salesExportFilter, endDate: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="filter-item filter-btn-align">
              <button
                className="btn btn-primary"
                onClick={() => handleDownload('sales', { ...salesExportFilter, paymentType: salesExportFilter.paymentMode })}
                disabled={downloading === 'sales'}
              >
                <ArrowDownToLine size={16} />
                {downloading === 'sales' ? 'Preparing…' : 'Export register'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}