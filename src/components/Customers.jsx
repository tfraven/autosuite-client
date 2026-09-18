import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Calendar,
  Bike,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  LayoutGrid,
  List,
  Copy,
  Check,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Plus,
  Edit3,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Pagination from './Pagination';

function normalizeCustomerLedger(customer) {
  if (!customer) return customer;

  const sales = Array.isArray(customer.sales) ? customer.sales : [];
  const purchasedBikes = customer.purchasedBikes?.length
    ? customer.purchasedBikes
    : sales
        .filter((s) => s?.bike)
        .map((s) => ({
          id: s.bike.id,
          saleId: s.id,
          modelName: s.bike.modelName,
          chassisNumber: s.bike.chassisNumber,
          engineNumber: s.bike.engineNumber,
          color: s.bike.color,
          modelYear: s.bike.modelYear,
          saleDate: s.saleDate,
          invoiceNumber: s.invoiceNumber
        }));

  const saleDates = sales.map((s) => s.saleDate).filter(Boolean);
  const fallbackDate = customer.createdAt || customer.lastPurchaseDate || null;

  return {
    ...customer,
    sales,
    purchasedBikes,
    saleType: customer.saleType || sales[0]?.saleType || (customer.customerType === 'DEALER' ? 'B2B' : 'B2C'),
    firstPurchaseDate: customer.firstPurchaseDate || saleDates[saleDates.length - 1] || fallbackDate,
    lastPurchaseDate: customer.lastPurchaseDate || saleDates[0] || fallbackDate,
    totalPurchases: customer.totalPurchases ?? purchasedBikes.length
  };
}

function formatDisplayDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('en-GB');
}

export default function Customers({ onViewInvoice, initialCustomerId }) {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    totalRevenue: 0,
    totalOutstanding: 0,
    debtorsCount: 0,
    dealerCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, DEBTORS, RETAIL, DEALERS, SETTLED
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    if (initialCustomerId) {
      api.getCustomer(initialCustomerId).then((cust) => {
        if (cust) setSelectedCustomer(normalizeCustomerLedger(cust));
      }).catch(console.error);
    }
  }, [initialCustomerId]);

  const handleSelectCustomer = async (c) => {
    setSelectedCustomer(normalizeCustomerLedger(c));
    try {
      const full = await api.getCustomer(c.id);
      if (full) {
        setSelectedCustomer(normalizeCustomerLedger({ ...c, ...full }));
      }
    } catch (err) {
      console.warn('Could not fetch full customer:', err);
    }
  };

  // SubView & Customer Form state
  const [subView, setSubView] = useState(null); // 'customer-form'
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [submittingCustomer, setSubmittingCustomer] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: '',
    cnic: '',
    address: '',
    customerType: 'RETAIL',
    notes: ''
  });

  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerFormData({
      name: '',
      phone: '',
      cnic: '',
      address: '',
      customerType: 'RETAIL',
      notes: ''
    });
    setSubView('customer-form');
  };

  const handleOpenEditCustomer = (cust) => {
    setEditingCustomer(cust);
    setCustomerFormData({
      name: cust.name || '',
      phone: cust.phone || '',
      cnic: cust.cnic || '',
      address: cust.address || '',
      customerType: cust.customerType || 'RETAIL',
      notes: cust.notes || ''
    });
    setSubView('customer-form');
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      setSubmittingCustomer(true);
      if (editingCustomer) {
        const updated = await api.updateCustomer(editingCustomer.id, customerFormData);
        toast.success(`Customer ${updated.name} updated.`);
        if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
          setSelectedCustomer((prev) => ({ ...prev, ...updated }));
        }
      } else {
        const created = await api.createCustomer(customerFormData);
        toast.success(`Customer ${created.name} registered.`);
      }
      setSubView(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setSubmittingCustomer(false);
    }
  };

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeFilter === 'DEBTORS') params.status = 'DUES';
      if (activeFilter === 'SETTLED') params.status = 'SETTLED';
      if (activeFilter === 'RETAIL') params.customerType = 'RETAIL';
      if (activeFilter === 'DEALERS') params.customerType = 'DEALER';

      const data = await api.getCustomers(params);
      if (data?.pagination) {
        setCustomers(data.customers || data.data || []);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      } else {
        const list = data?.customers || (Array.isArray(data) ? data : []);
        setCustomers(list);
        setTotalPages(1);
        setTotalCount(list.length);
      }
      if (data?.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load customer records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [page, limit, searchQuery, activeFilter]);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const formatPKR = (val) => {
    return 'PKR ' + Number(val || 0).toLocaleString('en-PK');
  };

  // Full-Page Customer Form (normal form like "Add motorcycle")
  if (subView === 'customer-form') {
    return (
      <div className="customers-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={() => setSubView(null)}>
              <ArrowLeft size={16} /> Back to customers
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">
                {editingCustomer ? 'Edit customer details' : 'Register new customer'}
              </h2>
              <div className="page-form-subtitle">
                Master customer record, National ID (CNIC), contact phone and credit terms
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveCustomer} className="page-form-container">
            <div className="page-form-grid-2">
              {/* Card 1: Account Identity */}
              <div className="page-form-card">
                <div className="page-form-card-title">Customer Identification</div>
                <div className="form-field mb-3">
                  <label>Full Legal Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Muhammad Aslam"
                    value={customerFormData.name}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                  />
                </div>
                <div className="form-group-row mb-3">
                  <div className="form-field">
                    <label>Account Category</label>
                    <select
                      className="form-input"
                      value={customerFormData.customerType}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, customerType: e.target.value })}
                    >
                      <option value="RETAIL">Retail B2C</option>
                      <option value="DEALER">Dealer B2B</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>National ID (CNIC)</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      placeholder="35201-1234567-1"
                      value={customerFormData.cnic}
                      onChange={(e) => setCustomerFormData({ ...customerFormData, cnic: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Contact & Location */}
              <div className="page-form-card">
                <div className="page-form-card-title">Contact & Location</div>
                <div className="form-field mb-3">
                  <label>Primary Phone Number *</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    required
                    placeholder="03001234567"
                    value={customerFormData.phone}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                  />
                </div>
                <div className="form-field mb-3">
                  <label>Residential / Business Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="House / Street, Area, City"
                    value={customerFormData.address}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="page-form-card">
              <div className="page-form-card-title">Commercial & Reference Notes</div>
              <div className="form-field">
                <textarea
                  rows="3"
                  className="form-input"
                  placeholder="Guarantor references, payment terms, showroom bay or delivery notes..."
                  value={customerFormData.notes}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="page-form-footer mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSubView(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingCustomer}
              >
                {submittingCustomer ? 'Saving…' : (editingCustomer ? 'Save Customer Changes' : 'Register Customer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // If a customer is selected for deep profile view
  if (selectedCustomer) {
    return (
      <div className="customers-view">
        <div className="page-form-view">
          {/* Breadcrumb & Navigation */}
          <div className="page-form-header no-print">
            <button className="page-form-back-btn" onClick={() => setSelectedCustomer(null)}>
              <ArrowLeft size={16} /> Back to customers
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">{selectedCustomer.name}</h2>
              <div className="page-form-subtitle">
                Vehicles owned, invoices and payment history
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasPermission('CREATE_SALE') && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleOpenEditCustomer(selectedCustomer)}
                >
                  <Edit3 size={16} /> Edit details
                </button>
              )}
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print statement
              </button>
            </div>
          </div>

          {/* Printable Document Header (when printed) */}
          <div className="printable-document invoice-sheet print-only mb-4" style={{ display: 'none' }}>
            <div className="invoice-header">
              <div className="dealership-info">
                <h2>AUTOSUITE MOTORCYCLES</h2>
                <p>Authorized Sales, Service & Spare Parts Dealership • Atlas Honda OEM</p>
                <p className="text-xs">Main Showroom Boulevard, Lahore | Phone: 042-35990000 | NTN: 4829103-8</p>
              </div>
              <div className="invoice-badge">
                <div className="inv-title">Customer statement</div>
                <div className="inv-date">Date: {new Date().toLocaleDateString('en-GB')}</div>
              </div>
            </div>
            <hr className="doc-divider" />
          </div>

          <div className="page-form-container">
            {/* Top Overview Card */}
            <div className="page-form-card">
              <div className="customer-profile-hero">
                <div className="customer-avatar-large">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div className="customer-hero-info">
                  <div className="hero-name-row">
                    <h3>{selectedCustomer.name}</h3>
                    <span className={`glass-badge ${selectedCustomer.saleType === 'B2B' ? 'badge-purple' : 'badge-cyan'}`}>
                      {selectedCustomer.customerType}{selectedCustomer.saleType ? ` (${selectedCustomer.saleType})` : ''}
                    </span>
                    <span className={`glass-badge ${selectedCustomer.remainingBalance > 0 ? 'badge-rose' : 'badge-emerald'}`}>
                      <span className="status-dot" />
                      {selectedCustomer.remainingBalance > 0 ? 'Balance due' : 'Fully settled'}
                    </span>
                  </div>

                  <div className="customer-contacts-grid">
                    <div className="contact-item" onClick={() => copyToClipboard(selectedCustomer.phone)} title="Click to copy">
                      <Phone size={14} className="text-cyan" />
                      <span>{selectedCustomer.phone}</span>
                      {copiedText === selectedCustomer.phone ? <Check size={12} className="text-emerald" /> : <Copy size={12} className="text-muted" />}
                    </div>

                    {selectedCustomer.cnic && (
                      <div className="contact-item" onClick={() => copyToClipboard(selectedCustomer.cnic)} title="Click to copy CNIC">
                        <ShieldCheck size={14} className="text-purple" />
                        <span className="font-mono">{selectedCustomer.cnic}</span>
                      </div>
                    )}

                    {selectedCustomer.address && (
                      <div className="contact-item">
                        <Building2 size={14} className="text-amber" />
                        <span>{selectedCustomer.address}</span>
                      </div>
                    )}

                    {formatDisplayDate(selectedCustomer.firstPurchaseDate) && (
                      <div className="contact-item text-muted">
                        <Calendar size={14} />
                        <span>Customer since {formatDisplayDate(selectedCustomer.firstPurchaseDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Summary Bar */}
              <div className="stats-strip mt-3">
                <div className="strip-item">
                  <span className="strip-label">Lifetime spend</span>
                  <strong className="strip-val text-cyan font-mono">{formatPKR(selectedCustomer.totalSpent)}</strong>
                </div>
                <div className="strip-item">
                  <span className="strip-label">Total paid</span>
                  <strong className="strip-val text-emerald font-mono">{formatPKR(selectedCustomer.totalPaid)}</strong>
                </div>
                <div className="strip-item">
                  <span className="strip-label">Balance due</span>
                  <strong className={`strip-val font-mono ${selectedCustomer.remainingBalance > 0 ? 'text-rose' : 'text-muted'}`}>
                    {formatPKR(selectedCustomer.remainingBalance)}
                  </strong>
                </div>
                <div className="strip-item">
                  <span className="strip-label">Motorcycles owned</span>
                  <strong className="strip-val text-amber">{selectedCustomer.totalPurchases}</strong>
                </div>
              </div>
            </div>

            {/* Vehicles Purchased Card */}
            <div className="page-form-card">
              <div className="page-form-card-title">
                Motorcycles owned ({selectedCustomer.purchasedBikes?.length || 0})
              </div>

              <div className="bikes-registered-grid">
                {(selectedCustomer.purchasedBikes || []).map((bike, idx) => (
                  <div key={idx} className="customer-bike-tile">
                    <div className="tile-icon-box">
                      <Bike size={18} />
                    </div>

                    <div className="tile-identity">
                      <h4 className="tile-title">{bike.modelName}</h4>
                      <div className="tile-meta">
                        <span className="spec-tag">{bike.modelYear}</span>
                        <span className="spec-tag">{bike.color}</span>
                      </div>
                    </div>

                    <div className="tile-ids">
                      <div className="tile-id-row">
                        <span className="id-title">Chassis</span>
                        <button
                          type="button"
                          className="id-value id-value-key id-value-copy"
                          onClick={() => copyToClipboard(bike.chassisNumber)}
                          title="Copy chassis number"
                        >
                          {bike.chassisNumber}
                          {copiedText === bike.chassisNumber
                            ? <Check size={11} className="text-emerald" />
                            : <Copy size={11} />}
                        </button>
                      </div>
                      <div className="tile-id-row">
                        <span className="id-title">Engine</span>
                        <span className="id-value">{bike.engineNumber}</span>
                      </div>
                    </div>

                    {onViewInvoice ? (
                      <button
                        type="button"
                        className="tile-invoice tile-invoice-btn"
                        onClick={() => {
                          const matchedSale = selectedCustomer.sales?.find(
                            (s) => s.invoiceNumber === bike.invoiceNumber || s.id === bike.saleId
                          );
                          onViewInvoice(matchedSale || { id: bike.saleId, invoiceNumber: bike.invoiceNumber });
                        }}
                        title="Click to view invoice details"
                      >
                        {bike.invoiceNumber} <ExternalLink size={10} className="inline ml-1 opacity-70" />
                      </button>
                    ) : (
                      <span className="tile-invoice">{bike.invoiceNumber}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sales Invoices & Installments Card */}
            <div className="page-form-card">
              <div className="page-form-card-title">
                Invoices ({selectedCustomer?.sales?.length || 0})
              </div>

              <div className="customer-sales-list">
                {selectedCustomer?.sales?.map((sale) => (
                  <div key={sale.id} className="customer-sale-card glass-panel mb-3">
                    <div className="sale-card-summary-row">
                      <div className="flex items-center gap-2 flex-wrap">
                        {onViewInvoice ? (
                          <button
                            type="button"
                            className="invoice-redirect-link font-mono font-bold text-cyan text-base flex items-center gap-1.5"
                            onClick={() => onViewInvoice(sale)}
                            title="Click to open full invoice details"
                          >
                            <span>{sale.invoiceNumber}</span>
                            <ExternalLink size={14} className="link-arrow-icon text-cyan" />
                          </button>
                        ) : (
                          <span className="font-mono font-bold text-cyan text-base">{sale.invoiceNumber}</span>
                        )}
                        <span className="text-xs text-muted ml-2">
                          {new Date(sale.saleDate).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`glass-badge ${sale.paymentType === 'CREDIT_INSTALLMENT' ? 'badge-amber' : 'badge-emerald'}`}>
                          {(sale.paymentType || 'CASH').replace(/_/g, ' ')}
                        </span>
                        <span className={`glass-badge ${sale.status === 'COMPLETED' ? 'badge-emerald' : 'badge-amber'}`}>
                          {sale.status}
                        </span>
                        {onViewInvoice && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs flex items-center gap-1.5 py-1 px-2.5"
                            onClick={() => onViewInvoice(sale)}
                            title="Open detailed invoice"
                          >
                            <span>View Invoice</span>
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="sale-financial-breakdown">
                      <div><span>Total:</span> <strong>{formatPKR(sale.finalAmount)}</strong></div>
                      <div><span>Balance:</span> <strong className={sale.remainingBalance > 0 ? 'text-rose' : 'text-emerald'}>{formatPKR(sale.remainingBalance)}</strong></div>
                      <div>
                        <span>Motorcycle:</span>{' '}
                        <strong className="text-amber">
                          {sale.bike?.modelName ||
                            sale.bikeModel ||
                            selectedCustomer.purchasedBikes?.find((b) => b.invoiceNumber === sale.invoiceNumber)?.modelName ||
                            'Motorcycle'}
                        </strong>
                      </div>
                    </div>

                    {/* If credit installment, show schedule */}
                    {sale?.installments && sale?.installments?.length > 0 && (
                      <div className="customer-installments-table-wrap mt-3">
                        <div className="text-xs font-medium text-muted mb-2">Installment schedule</div>
                        <table className="mini-ledger-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Due date</th>
                              <th>Amount</th>
                              <th>Paid</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sale?.installments?.map((inst) => {
                              const isOverdue = inst.status !== 'PAID' && new Date(inst.dueDate) < new Date();
                              return (
                                <tr key={inst.id}>
                                  <td className="font-mono">{inst.installmentNumber}</td>
                                  <td>{new Date(inst.dueDate).toLocaleDateString('en-GB')}</td>
                                  <td className="font-mono font-bold">{formatPKR(inst.amount)}</td>
                                  <td className="font-mono text-emerald">{formatPKR(inst.paidAmount)}</td>
                                  <td>
                                    <span className={`glass-badge ${inst.status === 'PAID' ? 'badge-emerald' :
                                      isOverdue ? 'badge-rose' : 'badge-amber'
                                      }`}>
                                      {inst.status === 'PAID' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customers-view">
      {/* KPI Cards Row */}
      <div className="kpi-grid mb-4">
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Customers</span>
            <div className="kpi-icon icon-cyan">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value font-mono">{summary.totalCustomers}</div>
          <div className="kpi-footer">
            <span className="badge-cyan glass-badge">
              <span className="status-dot" /> All accounts
            </span>
            <span className="kpi-subtext">Retail and dealer</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Total sales volume</span>
            <div className="kpi-icon icon-emerald">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value text-emerald font-mono">
            {formatPKR(summary.totalRevenue)}
          </div>
          <div className="kpi-footer">
            <span className="badge-emerald glass-badge">
              <span className="status-dot" /> Lifetime
            </span>
            <span className="kpi-subtext">Completed deliveries</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Outstanding balance</span>
            <div className="kpi-icon icon-rose">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value text-rose font-mono">
            {formatPKR(summary.totalOutstanding)}
          </div>
          <div className="kpi-footer">
            <span className="badge-rose glass-badge">
              <span className="status-dot" /> Owed to the dealership
            </span>
            <span className="kpi-subtext">Across active plans</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Accounts with dues</span>
            <div className="kpi-icon icon-amber">
              <Building2 size={18} />
            </div>
          </div>
          <div className="kpi-value text-amber font-mono">{summary.debtorsCount}</div>
          <div className="kpi-footer">
            <span className="badge-amber glass-badge">
              <span className="status-dot" /> Needs follow-up
            </span>
            <span className="kpi-subtext">Pending collection</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="control-bar glass-panel mb-4">
        <div className="filter-group">
          <div className="type-toggle">
            <button
              className={`toggle-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              All ({summary.totalCustomers})
            </button>
            <button
              className={`toggle-btn ${activeFilter === 'DEBTORS' ? 'active' : ''}`}
              onClick={() => setActiveFilter('DEBTORS')}
            >
              Debtors ({summary.debtorsCount})
            </button>
            <button
              className={`toggle-btn ${activeFilter === 'RETAIL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('RETAIL')}
            >
              Retail B2C
            </button>
            <button
              className={`toggle-btn ${activeFilter === 'DEALERS' ? 'active' : ''}`}
              onClick={() => setActiveFilter('DEALERS')}
            >
              Dealers B2B
            </button>
            <button
              className={`toggle-btn ${activeFilter === 'SETTLED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('SETTLED')}
            >
              Settled
            </button>
          </div>
        </div>

        <div className="action-group">
          <div className="type-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card Grid"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>

          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, phone or CNIC"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {hasPermission('EXPORT_EXCEL') && (
            <button
              className="btn btn-outline"
              onClick={() => api.downloadExcel('sales')}
            >
              <FileSpreadsheet size={16} /> Export
            </button>
          )}

          {hasPermission('CREATE_SALE') && (
            <button
              className="btn btn-primary"
              onClick={handleOpenAddCustomer}
            >
              <Plus size={16} /> Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Customer Directory Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading customers</p>
        </div>
      ) : customers?.length === 0 ? (
        <div className="empty-state glass-panel">
          <Users size={32} className="text-muted mb-2" />
          <h3>No customers found</h3>
          <p className="text-muted text-sm">Try a different search or filter.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="customer-card-grid">
          {customers?.map((c) => (
            <div
              key={c.id}
              className="customer-card glass-panel"
              onClick={() => handleSelectCustomer(c)}
            >
              <div className="customer-card-header">
                <div className="customer-avatar">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="customer-header-text">
                  <h4 className="customer-title">{c.name}</h4>
                  <div className="customer-phone font-mono">{c.phone}</div>
                </div>
                <span className={`glass-badge ml-auto text-xs ${c.saleType === 'B2B' ? 'badge-purple' : 'badge-cyan'}`}>
                  {c.customerType}
                </span>
              </div>

              <div className="customer-card-body">
                <div className="customer-metrics-row">
                  <div className="metric-box">
                    <span className="metric-label">Purchases</span>
                    <strong className="metric-val">{c.totalPurchases} bikes</strong>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Total volume</span>
                    <strong className="metric-val font-mono text-cyan">{formatPKR(c.totalSpent)}</strong>
                  </div>
                </div>

                <div className="customer-balance-box">
                  <span>Balance due</span>
                  <strong className={`font-mono ${c.remainingBalance > 0 ? 'text-rose' : 'text-emerald'}`}>
                    {c.remainingBalance > 0 ? formatPKR(c.remainingBalance) : 'Settled'}
                  </strong>
                </div>

                {c?.purchasedBikes?.length > 0 && (
                  <div className="customer-recent-bike">
                    <Bike size={13} className="text-muted" />
                    <span>Latest: <strong>{c.purchasedBikes[0].modelName}</strong> ({c.purchasedBikes[0].chassisNumber})</span>
                  </div>
                )}
              </div>

              <div className="customer-card-footer flex items-center justify-between">
                <span className="text-xs text-muted">
                  Last active {new Date(c.lastPurchaseDate).toLocaleDateString('en-GB')}
                </span>
                <div className="flex items-center gap-1.5">
                  {hasPermission('CREATE_SALE') && (
                    <button
                      type="button"
                      className="btn-card-action"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditCustomer(c);
                      }}
                      title="Edit Customer"
                    >
                      <Edit3 size={11} /> Edit
                    </button>
                  )}
                  <span className="view-ledger-link">
                    View <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-responsive glass-panel">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>CNIC</th>
                <th>Category</th>
                <th>Bikes bought</th>
                <th>Total volume</th>
                <th>Balance due</th>
                <th>Status</th>
                <th className="text-right">Ledger</th>
              </tr>
            </thead>
            <tbody>
              {customers?.map((c) => (
                <tr key={c.id} onClick={() => handleSelectCustomer(c)} className="clickable-row">
                  <td>
                    <div className="customer-cell-flex">
                      <div className="customer-avatar-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td className="font-mono text-cyan">{c.phone}</td>
                  <td className="font-mono text-xs">{c.cnic || '—'}</td>
                  <td>
                    <span className={`glass-badge text-xs ${c.saleType === 'B2B' ? 'badge-purple' : 'badge-cyan'}`}>
                      {c.customerType}
                    </span>
                  </td>
                  <td>
                    <span className="glass-badge badge-muted text-xs">
                      {c.totalPurchases}
                    </span>
                  </td>
                  <td className="font-mono font-bold text-cyan">{formatPKR(c.totalSpent)}</td>
                  <td className={`font-mono font-bold ${c.remainingBalance > 0 ? 'text-rose' : 'text-emerald'}`}>
                    {formatPKR(c.remainingBalance)}
                  </td>
                  <td>
                    <span className={`glass-badge ${c.remainingBalance > 0 ? 'badge-rose' : 'badge-emerald'}`}>
                      <span className="status-dot" />
                      {c.remainingBalance > 0 ? 'Dues' : 'Settled'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {hasPermission('CREATE_SALE') && (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditCustomer(c);
                          }}
                          title="Edit Customer Record"
                        >
                          <Edit3 size={13} />
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCustomer(c);
                        }}
                      >
                        Ledger <ChevronRight size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Server-Side Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={limit}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />
    </div>
  );
}