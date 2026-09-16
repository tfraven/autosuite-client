import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  TrendingUp, 
  Bike, 
  CreditCard, 
  Wrench, 
  Layers,
  ArrowDownToLine,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Export filters
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
      {/* High-Level Overview Cards */}
      <div className="kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Gross Revenue Inflow</span>
            <div className="kpi-icon icon-emerald"><TrendingUp size={20} /></div>
          </div>
          <div className="kpi-value">{formatPKR(stats?.totalRevenue)}</div>
          <div className="kpi-footer">
            <span className="badge-emerald glass-badge">Consolidated Stream</span>
            <span className="kpi-subtext font-medium">{stats?.totalSalesCount || 0} Transactions</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Outstanding Credit Balance</span>
            <div className="kpi-icon icon-amber"><CreditCard size={20} /></div>
          </div>
          <div className="kpi-value">{formatPKR(stats?.totalOutstandingCredit)}</div>
          <div className="kpi-footer">
            <span className="badge-amber glass-badge">Receivables</span>
            <span className="kpi-subtext font-medium">Customer scheduled loans</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Channel Breakdown</span>
            <div className="kpi-icon icon-cyan"><Layers size={20} /></div>
          </div>
          <div className="channel-stats-row">
            <div className="flex justify-between items-center">
              <span className="text-muted">B2C Retail Units:</span>
              <strong className="text-cyan font-bold">{stats?.b2cCount || 0} deals</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">B2B Wholesale Units:</span>
              <strong className="text-purple font-bold">{stats?.b2bCount || 0} deals</strong>
            </div>
          </div>
          <div className="kpi-footer mt-2">
            <span className="badge-muted glass-badge">Omni-channel Ready</span>
          </div>
        </div>
      </div>

      {/* Direct 1-Click Excel Exports Grid */}
      <div className="section-title-wrap mb-2">
        <h3>Standard Financial & Inventory Excel Workbooks</h3>
        <p className="text-muted text-xs">Official formatted Microsoft Excel (.xlsx) workbooks ready for dealership audits, accounting, and tax filing.</p>
      </div>

      <div className="export-cards-grid">
        {/* Export 1: Motorcycle Stock */}
        <div className="export-card glass-panel">
          <div className="flex items-center justify-between">
            <div className="export-icon-box icon-cyan">
              <Bike size={24} />
            </div>
            <span className="glass-badge badge-cyan text-xs">Fleet Sheet</span>
          </div>
          <div className="export-content">
            <h4>Motorcycle Inventory Catalog</h4>
            <p>Full breakdown of Brand New & Pre-Owned inventory with Chassis, Engine, Year, Dealer Invoice, Retail price, and Margin estimates.</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => handleDownload('bikes')}
            disabled={downloading === 'bikes'}
          >
            <ArrowDownToLine size={16} /> 
            {downloading === 'bikes' ? 'Exporting...' : 'Download .XLSX Catalog'}
          </button>
        </div>

        {/* Export 2: Spare Parts Stock */}
        <div className="export-card glass-panel">
          <div className="flex items-center justify-between">
            <div className="export-icon-box icon-purple">
              <Wrench size={24} />
            </div>
            <span className="glass-badge badge-purple text-xs">Logistics</span>
          </div>
          <div className="export-content">
            <h4>Spare Parts Stock & Thresholds</h4>
            <p>Parts catalog including part codes, bin locations, wholesale costs, B2B wholesale prices, current quantity, and low-stock indicators.</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => handleDownload('parts')}
            disabled={downloading === 'parts'}
          >
            <ArrowDownToLine size={16} /> 
            {downloading === 'parts' ? 'Exporting...' : 'Download .XLSX Parts'}
          </button>
        </div>

        {/* Export 3: Outstanding Credit Ledger */}
        <div className="export-card glass-panel">
          <div className="flex items-center justify-between">
            <div className="export-icon-box icon-amber">
              <CreditCard size={24} />
            </div>
            <span className="glass-badge badge-amber text-xs">Receivables</span>
          </div>
          <div className="export-content">
            <h4>Outstanding Credit & Installments</h4>
            <p>Comprehensive ledger of customers with pending installment schedules, due dates, paid portions, and total outstanding balances.</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => handleDownload('credit-ledger')}
            disabled={downloading === 'credit-ledger'}
          >
            <ArrowDownToLine size={16} /> 
            {downloading === 'credit-ledger' ? 'Exporting...' : 'Download .XLSX Ledger'}
          </button>
        </div>

        {/* Export 4: Filtered Sales Register */}
        <div className="export-card glass-panel full-col">
          <div className="sales-export-header">
            <div className="export-icon-box icon-emerald">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h4>Custom Sales Register Export Builder</h4>
              <p>Filter by date range, sale type (B2B vs B2C), and payment mode before exporting to Excel.</p>
            </div>
          </div>

          <div className="sales-filter-row mt-3">
            <div className="filter-item">
              <label>Sale Channel</label>
              <select 
                value={salesExportFilter.saleType}
                onChange={(e) => setSalesExportFilter({ ...salesExportFilter, saleType: e.target.value })}
                className="form-input"
              >
                <option value="">All Channels (B2C & B2B)</option>
                <option value="B2C">B2C Retail Only</option>
                <option value="B2B">B2B Wholesale Only</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Payment Mode</label>
              <select 
                value={salesExportFilter.paymentMode}
                onChange={(e) => setSalesExportFilter({ ...salesExportFilter, paymentMode: e.target.value })}
                className="form-input"
              >
                <option value="">All Payment Modes</option>
                <option value="CASH">Cash in Hand</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CREDIT_INSTALLMENT">Credit / Installments</option>
              </select>
            </div>

            <div className="filter-item">
              <label>From Date</label>
              <input 
                type="date"
                value={salesExportFilter.startDate}
                onChange={(e) => setSalesExportFilter({ ...salesExportFilter, startDate: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="filter-item">
              <label>To Date</label>
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
                onClick={() => handleDownload('sales', salesExportFilter)}
                disabled={downloading === 'sales'}
              >
                <ArrowDownToLine size={16} /> 
                {downloading === 'sales' ? 'Generating...' : 'Export Filtered Sales Register'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
