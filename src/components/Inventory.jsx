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
  X,
  Tag,
  ShieldCheck,
  Fuel,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Inventory({ isOpenAddModal, onCloseAddModal }) {
  const { hasPermission } = useAuth();
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, BRAND_NEW, USED
  const [statusFilter, setStatusFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedChassis, setCopiedChassis] = useState('');

  // Modal State
  const [subView, setSubView] = useState(null);
  const [editingBike, setEditingBike] = useState(null);

  const initialFormData = {
    type: 'BRAND_NEW',
    modelName: '',
    engineNumber: '',
    chassisNumber: '',
    color: '',
    modelYear: new Date().getFullYear(),
    batchNumber: '',
    dealerInvoicePrice: '',
    retailPrice: '',
    status: 'IN_STOCK',
    marketTarget: 'BOTH',
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
      const params = {};
      if (activeFilter !== 'ALL') params.type = activeFilter;
      if (statusFilter) params.status = statusFilter;
      if (marketFilter) params.marketTarget = marketFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await api.getBikes(params);
      setBikes(data);
    } catch (err) {
      console.error('Error fetching bikes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBikes();
  }, [activeFilter, statusFilter, marketFilter, searchQuery]);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this motorcycle from inventory?')) return;
    try {
      await api.deleteBike(id);
      fetchBikes();
    } catch (err) {
      alert(err.message || 'Failed to delete bike');
    }
  };

  const handleSaveBike = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingBike) {
        await api.updateBike(editingBike.id, formData);
      } else {
        await api.createBike(formData);
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

  const getColorSwatch = (colorName) => {
    const c = (colorName || '').toLowerCase();
    if (c.includes('red')) return '#ef4444';
    if (c.includes('black')) return '#1e293b';
    if (c.includes('blue')) return '#3b82f6';
    if (c.includes('silver') || c.includes('grey') || c.includes('gray')) return '#94a3b8';
    if (c.includes('white')) return '#f8fafc';
    if (c.includes('green')) return '#10b981';
    return '#38bdf8';
  };

  if (subView === 'bike-form') {
    return (
      <div className="inventory-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={() => { setSubView(null); setEditingBike(null); if (onCloseAddModal) onCloseAddModal(); }}>
              <ArrowLeft size={16} /> Back to stock
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">{editingBike ? 'Edit motorcycle' : 'Add motorcycle'}</h2>
              <div className="page-form-subtitle">Specifications, chassis numbers, pricing and ownership history</div>
            </div>
          </div>

          <form onSubmit={handleSaveBike} className="page-form-container">
            {formError && <div className="page-form-error">{formError}</div>}

            <div className="page-form-grid-2">
              {/* Card 1: Core Specifications */}
              <div className="page-form-card">
                <div className="page-form-card-title">Category and identifiers</div>

                <div className="form-group-row">
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
                    <label>Sold through</label>
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

                <div className="form-group-row">
                  <div className="form-field">
                    <label>Model name</label>
                    <input
                      type="text"
                      placeholder="e.g. Honda CG125 Special Edition"
                      value={formData.modelName}
                      onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-field">
                    <label>Color</label>
                    <input
                      type="text"
                      placeholder="e.g. Gloss red, matte black"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-field">
                    <label>Model year</label>
                    <input
                      type="number"
                      value={formData.modelYear}
                      onChange={(e) => setFormData({ ...formData, modelYear: Number(e.target.value) })}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-field">
                    <label>Batch or container number</label>
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

              {/* Card 2: Technical Engine & Chassis Numbers */}
              <div className="page-form-card">
                <div className="page-form-card-title">Chassis and engine numbers</div>

                <div className="form-field">
                  <label>Chassis number</label>
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

                <div className="form-field">
                  <label>Engine number</label>
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

                <div className="form-field">
                  <label>Starting status</label>
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

            <div className="page-form-grid-2">
              {/* Card 3: Pricing & Commercials */}
              <div className="page-form-card">
                <div className="page-form-card-title">Pricing</div>

                <div className="form-group-row">
                  <div className="form-field">
                    <label>Dealer cost (PKR)</label>
                    <input
                      type="number"
                      placeholder="Cost from factory or seller"
                      value={formData.dealerInvoicePrice}
                      onChange={(e) => setFormData({ ...formData, dealerInvoicePrice: e.target.value })}
                      required
                      className="form-input font-mono"
                    />
                  </div>

                  <div className="form-field">
                    <label>Retail price (PKR)</label>
                    <input
                      type="number"
                      placeholder="Showroom price"
                      value={formData.retailPrice}
                      onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                      required
                      className="form-input font-mono text-cyan"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Condition and inspection notes</label>
                  <textarea
                    rows="3"
                    placeholder="Inspection remarks, accessories included…"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              {/* Card 4: Pre-Owned Specifics or Warranty */}
              {formData.type === 'USED' ? (
                <div className="page-form-card">
                  <div className="page-form-card-title">Trade-in history</div>

                  <div className="form-group-row">
                    <div className="form-field">
                      <label>Registration number</label>
                      <input
                        type="text"
                        placeholder="e.g. LHR-24-1234"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="form-input font-mono"
                      />
                    </div>
                    <div className="form-field">
                      <label>Condition grade</label>
                      <select
                        value={formData.conditionGrade}
                        onChange={(e) => setFormData({ ...formData, conditionGrade: e.target.value })}
                        className="form-input"
                      >
                        <option value="GRADE_A">Grade A — showroom condition, low mileage</option>
                        <option value="GRADE_B">Grade B — good condition, normal wear</option>
                        <option value="GRADE_C">Grade C — needs refurbishment</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group-row">
                    <div className="form-field">
                      <label>Previous owner name</label>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={formData.prevOwnerName}
                        onChange={(e) => setFormData({ ...formData, prevOwnerName: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label>Previous owner phone</label>
                      <input
                        type="text"
                        placeholder="0300-XXXXXXX"
                        value={formData.prevOwnerPhone}
                        onChange={(e) => setFormData({ ...formData, prevOwnerPhone: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group-row">
                    <div className="form-field">
                      <label>Trade-in cost (PKR)</label>
                      <input
                        type="number"
                        value={formData.purchaseCost}
                        onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label>Refurbishment cost (PKR)</label>
                      <input
                        type="number"
                        value={formData.refurbishmentCost}
                        onChange={(e) => setFormData({ ...formData, refurbishmentCost: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="page-form-card">
                  <div className="page-form-card-title">Warranty</div>
                  <p className="text-muted text-sm">Brand new motorcycles are enrolled in factory warranty tracking once the sale is finalized.</p>
                  <div className="read-only-field mt-3">
                    <ShieldCheck size={16} className="text-emerald" />
                    <span>Atlas Honda warranty active</span>
                  </div>
                </div>
              )}
            </div>

            <div className="page-form-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setSubView(null); setEditingBike(null); if (onCloseAddModal) onCloseAddModal(); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> {editingBike ? 'Save changes' : 'Add motorcycle'}
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
      <div className="control-bar glass-panel">
        <div className="filter-group">
          <div className="type-toggle">
            <button
              className={`toggle-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              All ({bikes.length})
            </button>
            <button
              className={`toggle-btn ${activeFilter === 'BRAND_NEW' ? 'active' : ''}`}
              onClick={() => setActiveFilter('BRAND_NEW')}
            >
              Brand new
            </button>
            <button
              className={`toggle-btn ${activeFilter === 'USED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('USED')}
            >
              Used
            </button>
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            onChange={(e) => setMarketFilter(e.target.value)}
          >
            <option value="">Any channel</option>
            <option value="B2C">Retail</option>
            <option value="B2B">Wholesale</option>
            <option value="BOTH">Retail and wholesale</option>
          </select>
        </div>

        <div className="action-group">
          {/* Grid vs Table View Switcher */}
          <div className="type-toggle">
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
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
              placeholder="Search chassis, engine or model"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {hasPermission('EXPORT_EXCEL') && (
            <button
              className="btn btn-outline"
              onClick={() => api.downloadExcel('bikes')}
            >
              <FileSpreadsheet size={16} /> Export
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
              <Plus size={16} /> Add motorcycle
            </button>
          )}
        </div>
      </div>

      {/* View 1: Card Grid View */}
      {viewMode === 'grid' && (
        <div className="bike-cards-grid">
          {loading ? (
            <div className="col-span-full module-loading">
              <div className="spinner"></div> Loading stock
            </div>
          ) : bikes.length > 0 ? (
            bikes.map((bike) => {
              const isNew = bike.type === 'BRAND_NEW';
              const isInStock = bike.status === 'IN_STOCK';
              const cost = bike.dealerInvoicePrice || bike.purchaseCost || 0;
              const margin = bike.retailPrice && cost ? bike.retailPrice - cost : 0;

              return (
                <div key={bike.id} className="bike-card glass-panel">
                  {/* Card Header & Badges */}
                  <div className="bike-card-header">
                    <span className={`glass-badge ${isNew ? 'badge-cyan' : 'badge-purple'}`}>
                      {isNew ? 'Brand new' : 'Used'}
                    </span>
                    <span className={`glass-badge ${bike.status === 'IN_STOCK' ? 'badge-emerald' :
                      bike.status === 'RESERVED' ? 'badge-amber' :
                        bike.status === 'SOLD' ? 'badge-rose' : 'badge-muted'
                      }`}>
                      <span className="status-dot" style={{ width: 6, height: 6, marginRight: 3 }} />
                      {bike.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Vehicle Graphic & Title */}
                  <div className="bike-card-body">
                    <div className="bike-card-head">
                      <h3 className="bike-card-title" title={bike.modelName}>{bike.modelName}</h3>

                      <div className="bike-card-specs">
                        <span className="spec-tag color-indicator-chip">
                          <span className="color-dot" style={{ backgroundColor: getColorSwatch(bike.color) }} />
                          {bike.color}
                        </span>
                        <span className="spec-tag">{bike.modelYear}</span>
                        <span className="spec-tag">{bike.marketTarget}</span>
                        {bike.conditionGrade && (
                          <span className="spec-tag spec-tag-grade">
                            {bike.conditionGrade.replace('GRADE_', 'Grade ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Technical IDs Box */}
                    <div className="bike-ids-box">
                      <div className="id-row">
                        <span className="id-title">Chassis</span>
                        <span className="id-value id-value-key">{bike.chassisNumber}</span>
                        <button
                          className="copy-btn"
                          onClick={() => copyToClipboard(bike.chassisNumber)}
                          title="Copy chassis number"
                          aria-label={`Copy chassis number ${bike.chassisNumber}`}
                        >
                          {copiedChassis === bike.chassisNumber ? (
                            <Check size={12} className="text-emerald" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      <div className="id-row">
                        <span className="id-title">Engine</span>
                        <span className="id-value">{bike.engineNumber}</span>
                      </div>
                      {bike.registrationNumber && (
                        <div className="id-row">
                          <span className="id-title">Reg no</span>
                          <span className="id-value id-value-reg">{bike.registrationNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Margins */}
                    <div className="bike-price-footer">
                      <div className="price-val">{formatPKR(bike.retailPrice)}</div>
                      {margin > 0 && (
                        <div className="profit-margin-tag">+{formatPKR(margin)}</div>
                      )}
                      <div className="cost-val">Cost {formatPKR(cost)}</div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  {hasPermission('MANAGE_BIKES') && (
                    <div className="bike-card-actions">
                      <button className="btn-card-action" onClick={() => handleEdit(bike)}>
                        <Edit3 size={14} /> Edit
                      </button>
                      {bike.status !== 'SOLD' && (
                        <button className="btn-card-action danger" onClick={() => handleDelete(bike.id)}>
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full empty-placeholder">
              No motorcycles match the current filters.
            </div>
          )}
        </div>
      )}

      {/* View 2: Detailed Table View */}
      {viewMode === 'table' && (
        <div className="card glass-panel">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Chassis and engine</th>
                  <th>Color and year</th>
                  <th>Price</th>
                  <th>Channel</th>
                  <th>Status</th>
                  {hasPermission('MANAGE_BIKES') && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {bikes.map((bike) => (
                  <tr key={bike.id}>
                    <td>
                      <div className="font-bold text-main">{bike.modelName}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`glass-badge text-xs ${bike.type === 'BRAND_NEW' ? 'badge-cyan' : 'badge-purple'}`}>
                          {bike.type === 'BRAND_NEW' ? 'Brand new' : 'Used'}
                        </span>
                        {bike.conditionGrade && (
                          <span className="glass-badge badge-amber text-xs">
                            {bike.conditionGrade.replace('GRADE_', 'Grade ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="font-mono text-cyan font-bold mr-1">{bike.chassisNumber}</span>
                        <button className="copy-btn inline-flex" onClick={() => copyToClipboard(bike.chassisNumber)}>
                          {copiedChassis === bike.chassisNumber ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
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
                      <div className="font-bold text-main">{formatPKR(bike.retailPrice)}</div>
                      <div className="text-muted text-xs font-mono">Cost {formatPKR(bike.dealerInvoicePrice || bike.purchaseCost)}</div>
                    </td>
                    <td>
                      <span className="glass-badge badge-muted">{bike.marketTarget}</span>
                    </td>
                    <td>
                      <span className={`glass-badge ${bike.status === 'IN_STOCK' ? 'badge-emerald' :
                        bike.status === 'RESERVED' ? 'badge-amber' :
                          bike.status === 'SOLD' ? 'badge-rose' : 'badge-muted'
                        }`}>
                        {bike.status.replace('_', ' ')}
                      </span>
                    </td>
                    {hasPermission('MANAGE_BIKES') && (
                      <td className="text-right">
                        <div className="table-actions">
                          <button className="action-icon-btn" onClick={() => handleEdit(bike)} title="Edit">
                            <Edit3 size={15} />
                          </button>
                          {bike.status !== 'SOLD' && (
                            <button className="action-icon-btn text-rose" onClick={() => handleDelete(bike.id)} title="Delete">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}