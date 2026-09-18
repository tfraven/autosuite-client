import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Copy,
  Check,
  Edit3,
  Trash2,
  FileSpreadsheet,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from './Pagination';

export default function Inventory({ isOpenAddModal, onCloseAddModal }) {
  const { hasPermission } = useAuth();
  const { isRomanUrdu } = useLanguage();
  const toast = useToast();

  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedChassis, setCopiedChassis] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal & Form State
  const [subView, setSubView] = useState(null);
  const [editingBike, setEditingBike] = useState(null);
  const [bikeToDelete, setBikeToDelete] = useState(null);

  const getLocalDateTimeString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const initialFormData = {
    type: 'BRAND_NEW',
    modelName: '',
    brand: 'Atlas Honda',
    engineNumber: '',
    chassisNumber: '',
    color: '',
    modelYear: new Date().getFullYear(),
    batchNumber: '',
    dealerInvoicePrice: '',
    retailPrice: '',
    status: 'IN_STOCK',
    marketTarget: 'BOTH',
    receivedDate: getLocalDateTimeString(),
    registrationNumber: '',
    prevOwnerName: '',
    prevOwnerPhone: '',
    prevOwnerCnic: '',
    conditionGrade: 'GRADE_A',
    purchaseCost: '',
    refurbishmentCost: '',
    expectedSellingPrice: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [formError, setFormError] = useState('');

  const fetchBikes = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (activeFilter !== 'ALL') params.type = activeFilter;
      if (statusFilter) params.status = statusFilter;
      if (marketFilter) params.marketTarget = marketFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.getBikes(params);
      if (res.pagination) {
        setBikes(res.data || res.bikes || []);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      } else {
        const list = Array.isArray(res) ? res : [];
        setBikes(list);
        setTotalCount(list.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching bikes:', err);
      toast.error('Failed to load inventory records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBikes();
  }, [activeFilter, statusFilter, marketFilter, searchQuery, page, limit]);

  useEffect(() => {
    if (isOpenAddModal) {
      setEditingBike(null);
      setFormData(initialFormData);
      setSubView('bike-form');
    }
  }, [isOpenAddModal]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedChassis(text);
    setTimeout(() => setCopiedChassis(''), 2000);
  };

  const handleEdit = (bike) => {
    setEditingBike(bike);
    setFormData({
      type: bike.type,
      modelName: bike.modelName,
      brand: bike.brand || bike.model?.brand || 'Atlas Honda',
      engineNumber: bike.engineNumber,
      chassisNumber: bike.chassisNumber,
      color: bike.color,
      modelYear: bike.modelYear,
      batchNumber: bike.batchNumber || '',
      dealerInvoicePrice: bike.dealerInvoicePrice || '',
      retailPrice: bike.retailPrice || '',
      status: bike.status,
      marketTarget: bike.marketTarget,
      registrationNumber: bike.registrationNumber || '',
      prevOwnerName: bike.prevOwnerName || '',
      prevOwnerPhone: bike.prevOwnerPhone || '',
      prevOwnerCnic: bike.prevOwnerCnic || '',
      conditionGrade: bike.conditionGrade || 'GRADE_A',
      purchaseCost: bike.purchaseCost || '',
      refurbishmentCost: bike.refurbishmentCost || '',
      expectedSellingPrice: bike.expectedSellingPrice || '',
      notes: bike.notes || ''
    });
    setSubView('bike-form');
  };

  const handleSaveBike = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingBike) {
        await api.updateBike(editingBike.id, formData);
        toast.success(`Motorcycle ${formData.modelName} updated successfully.`);
      } else {
        await api.createBike(formData);
        toast.success(`New motorcycle ${formData.modelName} added to stock!`);
      }
      setSubView(null);
      if (onCloseAddModal) onCloseAddModal();
      fetchBikes();
    } catch (err) {
      setFormError(err.message || 'Failed to save motorcycle record');
    }
  };

  const formatPKR = (val) => {
    return 'PKR ' + Number(val || 0).toLocaleString('en-PK');
  };

  const formatGrade = (grade) => (grade || '').replace(/^GRADE_/, '');

  const getColorSwatch = (colorName) => {
    const c = (colorName || '').toLowerCase();
    if (c.includes('red')) return '#dc2626';
    if (c.includes('black')) return '#18181b';
    if (c.includes('silver') || c.includes('grey') || c.includes('gray')) return '#9ca3af';
    if (c.includes('blue')) return '#2563eb';
    return '#64748b';
  };

  if (subView === 'bike-form') {
    return (
      <div className="inventory-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button
              className="page-form-back-btn"
              onClick={() => {
                setSubView(null);
                if (onCloseAddModal) onCloseAddModal();
              }}
            >
              <ArrowLeft size={16} /> Back to stock
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">
                {editingBike
                  ? (isRomanUrdu ? 'Motorcycle ki Maloomat Edit Karein' : 'Edit motorcycle')
                  : (isRomanUrdu ? 'Nayi Motorcycle Stock Mein Shamil Karein' : 'Add motorcycle')}
              </h2>
              <div className="page-form-subtitle">
                Specifications, chassis numbers, pricing and ownership history
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBike} className="page-form-container">
            {formError && <div className="page-form-error">{formError}</div>}

            <div className="page-form-grid-2">
              <div className="page-form-card">
                <div className="page-form-card-title">Category and identifiers</div>
                <div className="form-group-row mb-3">
                  <div className="form-field">
                    <label>Category</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      disabled={!!editingBike}
                      className="form-input"
                    >
                      <option value="BRAND_NEW">Brand new</option>
                      <option value="USED">Used, certified</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Channel</label>
                    <select
                      value={formData.marketTarget}
                      onChange={(e) => setFormData({ ...formData, marketTarget: e.target.value })}
                      className="form-input"
                    >
                      <option value="BOTH">Retail and wholesale</option>
                      <option value="B2C">Retail only</option>
                      <option value="B2B">Wholesale only</option>
                    </select>
                  </div>
                </div>

                <div className="form-field mb-3">
                  <label className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={13} className="text-cyan" />
                      {isRomanUrdu ? 'Stock Mein Shamil Karne Ki Tareekh' : 'Stock Arrival Date (Paper Record Date)'}
                    </span>
                    <span className="text-xs text-muted">Defaults to now</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.receivedDate || ''}
                    onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                    className="form-input font-mono"
                  />
                </div>

                <div className="form-group-row mb-3">
                  <div className="form-field">
                    <label>Brand / Make</label>
                    <input
                      list="bike-brands"
                      type="text"
                      placeholder="e.g. Honda, Unique, Superstar, Suzuki, Yamaha..."
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="form-input"
                    />
                    <datalist id="bike-brands">
                      <option value="Atlas Honda" />
                      <option value="Unique" />
                      <option value="Superstar" />
                      <option value="Suzuki" />
                      <option value="Yamaha" />
                      <option value="Road Prince" />
                      <option value="United" />
                      <option value="Crown" />
                      <option value="Metro" />
                      <option value="Hi-Speed" />
                    </datalist>
                  </div>
                  <div className="form-field">
                    <label>Model Name</label>
                    <input
                      type="text"
                      placeholder="e.g. CD70 Euro II, UD70, CG125..."
                      value={formData.modelName}
                      onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group-row mb-3">
                  <div className="form-field">
                    <label>Color</label>
                    <input
                      type="text"
                      placeholder="e.g. Red, Black"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group-row mb-3">
                  <div className="form-field">
                    <label>Model Year</label>
                    <input
                      type="number"
                      value={formData.modelYear}
                      onChange={(e) => setFormData({ ...formData, modelYear: Number(e.target.value) })}
                      required
                      className="form-input font-mono"
                    />
                  </div>
                  <div className="form-field">
                    <label>Batch / Lot Number</label>
                    <input
                      type="text"
                      placeholder="e.g. BATCH-2026-Q1"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="page-form-card">
                <div className="page-form-card-title">Chassis and Engine Numbers</div>
                <div className="form-field mb-3">
                  <label>Chassis / VIN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. HND-CG125-982310"
                    value={formData.chassisNumber}
                    onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                    required
                    disabled={!!editingBike}
                    className="form-input font-mono"
                  />
                </div>
                <div className="form-field mb-3">
                  <label>Engine Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ENG-992384-A"
                    value={formData.engineNumber}
                    onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                    required
                    disabled={!!editingBike}
                    className="form-input font-mono"
                  />
                </div>
                <div className="form-field mb-3">
                  <label>Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="IN_STOCK">In stock</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                    <option value="PENDING_DELIVERY">Pending delivery</option>
                  </select>
                </div>
              </div>
            </div>

            {formData.type === 'USED' && (
              <div className="page-form-card mt-4">
                <div className="page-form-card-title flex items-center justify-between">
                  <span>Pre-Owned / Used Details & Ownership History</span>
                  <span className="glass-badge badge-amber text-xs">Used Subtype (3NF/BCNF)</span>
                </div>
                <div className="form-group-row mb-3">
                  <div className="form-field">
                    <label>Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. LHR-24-8891"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                  <div className="form-field">
                    <label>Condition Grade</label>
                    <select
                      value={formData.conditionGrade}
                      onChange={(e) => setFormData({ ...formData, conditionGrade: e.target.value })}
                      className="form-input"
                    >
                      <option value="GRADE_A">Grade A (Mint / Low Mileage)</option>
                      <option value="GRADE_B">Grade B (Good / Minor Wear)</option>
                      <option value="GRADE_C">Grade C (Refurbished / Fair)</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Previous Owner Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Hamza"
                      value={formData.prevOwnerName}
                      onChange={(e) => setFormData({ ...formData, prevOwnerName: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group-row mb-3">
                  <div className="form-field">
                    <label>Previous Owner Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. 0300-1234567"
                      value={formData.prevOwnerPhone}
                      onChange={(e) => setFormData({ ...formData, prevOwnerPhone: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                  <div className="form-field">
                    <label>Previous Owner CNIC</label>
                    <input
                      type="text"
                      placeholder="e.g. 35201-1234567-1"
                      value={formData.prevOwnerCnic}
                      onChange={(e) => setFormData({ ...formData, prevOwnerCnic: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                  <div className="form-field">
                    <label>Purchase Cost (PKR)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.purchaseCost}
                      onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                </div>
                <div className="form-group-row">
                  <div className="form-field">
                    <label>Refurbishment Cost (PKR)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.refurbishmentCost}
                      onChange={(e) => setFormData({ ...formData, refurbishmentCost: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                  <div className="form-field">
                    <label>Expected Selling Price (PKR)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.expectedSellingPrice}
                      onChange={(e) => setFormData({ ...formData, expectedSellingPrice: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="page-form-grid-2 mt-4">
              <div className="page-form-card">
                <div className="page-form-card-title">Commercial Pricing</div>
                <div className="form-group-row mb-3">
                  <div className="form-field">
                    <label>Dealer Invoice Cost (PKR)</label>
                    <input
                      type="number"
                      value={formData.dealerInvoicePrice}
                      onChange={(e) => setFormData({ ...formData, dealerInvoicePrice: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                  <div className="form-field">
                    <label>Retail Selling Price (PKR)</label>
                    <input
                      type="number"
                      value={formData.retailPrice}
                      onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                      required
                      className="form-input font-mono text-lg font-bold"
                    />
                  </div>
                </div>
              </div>
              <div className="page-form-card">
                <div className="page-form-card-title">Internal Notes</div>
                <div className="form-field">
                  <textarea
                    rows="3"
                    className="form-input"
                    placeholder="Additional notes, condition, showroom bay location..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="page-form-footer mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSubView(null);
                  if (onCloseAddModal) onCloseAddModal();
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingBike ? 'Save Changes' : 'Add to Inventory'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-view">
      {/* Control Bar */}
      <div className="control-bar glass-panel no-print inventory-toolbar">
        <div className="inventory-toolbar-controls">
          <div className="filter-group">
            <div className="type-toggle">
              <button
                className={`toggle-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => { setActiveFilter('ALL'); setPage(1); }}
              >
                All
              </button>
              <button
                className={`toggle-btn ${activeFilter === 'BRAND_NEW' ? 'active' : ''}`}
                onClick={() => { setActiveFilter('BRAND_NEW'); setPage(1); }}
              >
                Brand new
              </button>
              <button
                className={`toggle-btn ${activeFilter === 'USED' ? 'active' : ''}`}
                onClick={() => { setActiveFilter('USED'); setPage(1); }}
              >
                Used
              </button>
            </div>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">Any status</option>
              <option value="IN_STOCK">In stock</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
              <option value="PENDING_DELIVERY">Pending delivery</option>
            </select>

            <select
              className="filter-select"
              value={marketFilter}
              onChange={(e) => { setMarketFilter(e.target.value); setPage(1); }}
            >
              <option value="">Any channel</option>
              <option value="B2C">Retail</option>
              <option value="B2B">Wholesale</option>
              <option value="BOTH">Retail and wholesale</option>
            </select>
          </div>

          <div className="action-group">
            <div className="type-toggle view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Card Grid View"
                aria-label="Card grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
                aria-label="Table view"
              >
                <List size={15} />
              </button>
            </div>

            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search chassis, engine or model…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="search-input"
              />
            </div>

            {hasPermission('EXPORT_EXCEL') && (
              <button
                className="btn btn-outline"
                onClick={() => api.downloadExcel('bikes')}
              >
                <FileSpreadsheet size={16} /> <span className="btn-label">Export</span>
              </button>
            )}

            {hasPermission('MANAGE_BIKES') && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingBike(null);
                  setFormData(initialFormData);
                  setSubView('bike-form');
                }}
              >
                <Plus size={16} /> <span className="btn-label">{isRomanUrdu ? 'Nayi Bike Shamil Karein' : 'Add motorcycle'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="bike-cards-grid" key={`grid-${page}-${activeFilter}-${statusFilter}-${marketFilter}-${searchQuery}`}>
          {loading ? (
            <div className="col-span-full module-loading">
              <div className="spinner"></div> Loading inventory stock…
            </div>
          ) : bikes.length > 0 ? (
            bikes.map((bike) => {
              const isNew = bike.type === 'BRAND_NEW';
              const isSold = bike.status === 'SOLD';
              const cost = bike.dealerInvoicePrice || bike.purchaseCost || 0;
              const margin = bike.retailPrice && cost ? bike.retailPrice - cost : 0;
              const statusLabel = (bike.status || '').replace(/_/g, ' ');
              return (
                <div
                  key={bike.id}
                  className={`bike-card glass-panel anim-fade-up${isSold ? ' is-sold' : ''}`}
                >
                  <div className="bike-card-header">
                    <span className={`glass-badge ${isNew ? 'badge-cyan' : 'badge-purple'}`}>
                      {isNew ? 'Brand new' : 'Used certified'}
                    </span>
                    <span
                      className={`glass-badge ${bike.status === 'IN_STOCK'
                        ? 'badge-emerald'
                        : bike.status === 'RESERVED'
                          ? 'badge-amber'
                          : isSold
                            ? 'badge-rose'
                            : 'badge-muted'
                        }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="bike-card-body">
                    {(bike.brand || bike.conditionGrade) && (
                      <div className="bike-card-eyebrow">
                        {bike.brand && <span className="eyebrow-brand">{bike.brand}</span>}
                        {bike.brand && bike.conditionGrade && (
                          <span className="eyebrow-sep" aria-hidden="true" />
                        )}
                        {bike.conditionGrade && (
                          <span className="eyebrow-grade">Grade {formatGrade(bike.conditionGrade)}</span>
                        )}
                      </div>
                    )}
                    <h3 className="bike-card-title">{bike.modelName}</h3>
                    <div className="bike-card-specs">
                      <span className="color-indicator-chip">
                        <span
                          className="color-dot"
                          style={{ backgroundColor: getColorSwatch(bike.color) }}
                        />
                        {bike.color}
                      </span>
                      <span className="spec-tag">{bike.modelYear}</span>
                    </div>

                    <div className="bike-ids-box">
                      <div className="id-row">
                        <span className="id-title">Chassis</span>
                        <span className="id-value id-value-key">{bike.chassisNumber}</span>
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() => copyToClipboard(bike.chassisNumber)}
                          title="Copy chassis"
                          aria-label="Copy chassis number"
                        >
                          {copiedChassis === bike.chassisNumber ? (
                            <Check size={12} />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      <div className="id-row">
                        <span className="id-title">Engine</span>
                        <span className="id-value">{bike.engineNumber}</span>
                      </div>
                    </div>

                    <div className="bike-price-footer">
                      <div className="bike-price-main">
                        <div className="price-val font-mono">{formatPKR(bike.retailPrice)}</div>
                        <div className="cost-val">Cost {formatPKR(cost)}</div>
                      </div>
                      {margin > 0 && !isSold && (
                        <span className="profit-margin-tag">+{formatPKR(margin)}</span>
                      )}
                    </div>
                  </div>

                  {hasPermission('MANAGE_BIKES') && (
                    <div className="bike-card-actions">
                      <button
                        type="button"
                        className="btn-card-action"
                        onClick={() => handleEdit(bike)}
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      {!isSold && (
                        <button
                          type="button"
                          className="btn-card-action danger"
                          onClick={() => setBikeToDelete(bike)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full empty-placeholder glass-panel">
              No motorcycles match the current filters.
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div
          className="card glass-panel no-print inventory-table-card"
          key={`table-${page}-${activeFilter}-${statusFilter}-${marketFilter}-${searchQuery}`}
        >
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Model</th>
                  <th>Chassis & Engine</th>
                  <th>Color & Year</th>
                  <th>Retail Price</th>
                  <th>Channel</th>
                  <th>Status</th>
                  {hasPermission('MANAGE_BIKES') && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="loading-cell">
                      <div className="spinner"></div> Loading inventory…
                    </td>
                  </tr>
                ) : bikes.length > 0 ? (
                  bikes.map((bike) => (
                    <tr key={bike.id}>
                      <td>
                        <span className={`glass-badge ${bike.type === 'BRAND_NEW' ? 'badge-cyan' : 'badge-purple'}`}>
                          {bike.type === 'BRAND_NEW' ? 'Brand New' : 'Used'}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-main">{bike.modelName}</div>
                        {(bike.brand || bike.conditionGrade) && (
                          <div className="bike-card-eyebrow bike-card-eyebrow-table">
                            {bike.brand && <span className="eyebrow-brand">{bike.brand}</span>}
                            {bike.brand && bike.conditionGrade && (
                              <span className="eyebrow-sep" aria-hidden="true" />
                            )}
                            {bike.conditionGrade && (
                              <span className="eyebrow-grade">Grade {formatGrade(bike.conditionGrade)}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="table-chassis-cell">
                          <span className="font-mono font-medium text-main">{bike.chassisNumber}</span>
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() => copyToClipboard(bike.chassisNumber)}
                            title="Copy chassis"
                            aria-label="Copy chassis number"
                          >
                            {copiedChassis === bike.chassisNumber ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="font-mono text-muted text-xs mt-1">{bike.engineNumber}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="color-dot" style={{ backgroundColor: getColorSwatch(bike.color) }} />
                          <span>{bike.color}</span>
                        </div>
                        <div className="text-muted text-xs mt-1">{bike.modelYear}</div>
                      </td>
                      <td>
                        <div className="font-semibold font-mono text-main">{formatPKR(bike.retailPrice)}</div>
                        <div className="text-muted text-xs font-mono">
                          Cost {formatPKR(bike.dealerInvoicePrice || bike.purchaseCost)}
                        </div>
                      </td>
                      <td>
                        <span className="glass-badge badge-muted">{bike.marketTarget}</span>
                      </td>
                      <td>
                        <span
                          className={`glass-badge ${bike.status === 'IN_STOCK'
                            ? 'badge-emerald'
                            : bike.status === 'RESERVED'
                              ? 'badge-amber'
                              : bike.status === 'SOLD'
                                ? 'badge-rose'
                                : 'badge-muted'
                            }`}
                        >
                          {(bike.status || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      {hasPermission('MANAGE_BIKES') && (
                        <td className="text-right">
                          <div className="table-actions flex items-center justify-end gap-1">
                            <button className="btn-action-icon" onClick={() => handleEdit(bike)} title="Edit">
                              <Edit3 size={15} />
                            </button>
                            {bike.status !== 'SOLD' && (
                              <button
                                className="btn-action-icon text-rose"
                                onClick={() => setBikeToDelete(bike)}
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-placeholder">No motorcycles match current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
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

      {/* GitHub-Style Soft Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!bikeToDelete}
        onClose={() => setBikeToDelete(null)}
        title="Soft Delete Motorcycle"
        itemName="Motorcycle Stock Record"
        targetValue={bikeToDelete?.chassisNumber || ''}
        promptLabel="Type exact chassis number below to confirm soft deletion:"
        onConfirm={async () => {
          if (!bikeToDelete) return;
          await api.deleteBike(bikeToDelete.id);
          toast.success(`Motorcycle ${bikeToDelete.modelName} (${bikeToDelete.chassisNumber}) soft-deleted.`);
          fetchBikes();
        }}
      />
    </div>
  );
}