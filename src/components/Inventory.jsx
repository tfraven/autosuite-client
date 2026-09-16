import React, { useState, useEffect } from 'react';
import { 
  Bike, 
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
  Sparkles,
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
              <ArrowLeft size={16} /> Back to Inventory
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">{editingBike ? 'Edit Motorcycle Specifications' : 'Register New Motorcycle to Fleet'}</h2>
              <div className="page-form-subtitle">Enter technical specs, chassis numbers, pricing, and ownership history</div>
            </div>
          </div>

          <form onSubmit={handleSaveBike} className="page-form-container">
            {formError && <div className="page-form-error">{formError}</div>}

            <div className="page-form-grid-2">
              {/* Card 1: Core Specifications */}
              <div className="page-form-card">
                <div className="page-form-card-title">1. Vehicle Category & Identifiers</div>

                <div className="form-group-row">
                  <div className="form-field">
                    <label>Category *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      disabled={!!editingBike}
                      className="form-input"
                    >
                      <option value="BRAND_NEW">Brand New OEM</option>
                      <option value="USED">Certified Pre-Owned</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Target Channel *</label>
                    <select
                      value={formData.marketTarget}
                      onChange={(e) => setFormData({ ...formData, marketTarget: e.target.value })}
                      className="form-input"
                    >
                      <option value="BOTH">Universal (Both B2B & B2C)</option>
                      <option value="B2C">Retail Customer (B2C Only)</option>
                      <option value="B2B">Wholesale Dealer (B2B Only)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-field">
                    <label>Model Name *</label>
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
                    <label>Color *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Gloss Red, Matte Black" 
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-field">
                    <label>Model Year *</label>
                    <input 
                      type="number" 
                      value={formData.modelYear}
                      onChange={(e) => setFormData({ ...formData, modelYear: Number(e.target.value) })}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-field">
                    <label>Fleet Batch / Container No</label>
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
                <div className="page-form-card-title">2. Engine & Chassis Numbers</div>

                <div className="form-field">
                  <label>Frame / Chassis Number *</label>
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
                  <label>Engine Number *</label>
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
                  <label>Initial Stock Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="IN_STOCK">In-Stock Ready</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                    <option value="PENDING_DELIVERY">Pending Delivery</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="page-form-grid-2">
              {/* Card 3: Pricing & Commercials */}
              <div className="page-form-card">
                <div className="page-form-card-title">3. Pricing & Valuation</div>

                <div className="form-group-row">
                  <div className="form-field">
                    <label>Dealer Invoice / Cost (PKR) *</label>
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
                    <label>Showroom Retail Price (PKR) *</label>
                    <input 
                      type="number" 
                      placeholder="Public retail tag" 
                      value={formData.retailPrice}
                      onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                      required
                      className="form-input font-mono text-cyan"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Vehicle Condition & Inspection Notes</label>
                  <textarea 
                    rows="3"
                    placeholder="Key inspection remarks, accessories included..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              {/* Card 4: Pre-Owned Specifics or Warranty */}
              {formData.type === 'USED' ? (
                <div className="page-form-card">
                  <div className="page-form-card-title">4. Pre-Owned Verification & History</div>

                  <div className="form-group-row">
                    <div className="form-field">
                      <label>Registration Number</label>
                      <input 
                        type="text"
                        placeholder="e.g. LHR-24-1234"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="form-input font-mono"
                      />
                    </div>
                    <div className="form-field">
                      <label>Condition Grading</label>
                      <select
                        value={formData.conditionGrade}
                        onChange={(e) => setFormData({ ...formData, conditionGrade: e.target.value })}
                        className="form-input"
                      >
                        <option value="GRADE_A">Grade A (Showroom Condition / Low Mileage)</option>
                        <option value="GRADE_B">Grade B (Good Condition / Normal Wear)</option>
                        <option value="GRADE_C">Grade C (Refurbishment Required)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group-row">
                    <div className="form-field">
                      <label>Previous Owner Name</label>
                      <input 
                        type="text"
                        placeholder="Full Name"
                        value={formData.prevOwnerName}
                        onChange={(e) => setFormData({ ...formData, prevOwnerName: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label>Previous Owner Phone</label>
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
                      <label>Purchase / Trade-in Cost (PKR)</label>
                      <input 
                        type="number"
                        value={formData.purchaseCost}
                        onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label>Refurbishment Expenses (PKR)</label>
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
                  <div className="page-form-card-title">4. Warranty & Showroom Ready Checklist</div>
                  <p className="text-muted text-sm">Brand New OEM motorcycles are automatically enrolled into factory warranty tracking upon sales finalization.</p>
                  <div className="read-only-field mt-3">
                    <ShieldCheck size={16} className="text-emerald" />
                    <span>Atlas Honda OEM Warranty Validation Active</span>
                  </div>
                </div>
              )}
            </div>

            <div className="page-form-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setSubView(null); setEditingBike(null); if (onCloseAddModal) onCloseAddModal(); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> {editingBike ? 'Save Vehicle Updates' : 'Confirm Registration'}
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
              All Stock ({bikes.length})
            </button>
            <button 
              className={`toggle-btn ${activeFilter === 'BRAND_NEW' ? 'active' : ''}`}
              onClick={() => setActiveFilter('BRAND_NEW')}
            >
              Brand New
            </button>
            <button 
              className={`toggle-btn ${activeFilter === 'USED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('USED')}
            >
              Certified Pre-Owned
            </button>
          </div>

          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Status: All Conditions</option>
            <option value="IN_STOCK">In-Stock Ready</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="PENDING_DELIVERY">Pending Delivery</option>
          </select>

          <select 
            className="filter-select"
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
          >
            <option value="">Target: Universal</option>
            <option value="B2C">Retail Customer (B2C)</option>
            <option value="B2B">Wholesale Dealer (B2B)</option>
            <option value="BOTH">Universal (Both)</option>
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
              placeholder="Search Chassis, Engine, Model..." 
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
              <Plus size={16} /> Add Bike
            </button>
          )}
        </div>
      </div>

      {/* View 1: Card Grid View */}
      {viewMode === 'grid' && (
        <div className="bike-cards-grid">
          {loading ? (
            <div className="col-span-full module-loading">
              <div className="spinner"></div> Loading motorcycle catalog...
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
                      {isNew ? 'Brand New OEM' : 'Certified Pre-Owned'}
                    </span>
                    <span className={`glass-badge ${
                      bike.status === 'IN_STOCK' ? 'badge-emerald' :
                      bike.status === 'RESERVED' ? 'badge-amber' :
                      bike.status === 'SOLD' ? 'badge-rose' : 'badge-muted'
                    }`}>
                      <span className="status-dot" style={{ width: 6, height: 6, marginRight: 3 }} />
                      {bike.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Vehicle Graphic & Title */}
                  <div className="bike-card-body">
                    <div className="bike-card-icon-wrap">
                      <Bike size={28} />
                    </div>
                    <h3 className="bike-card-title">{bike.modelName}</h3>
                    
                    <div className="bike-card-specs">
                      <span className="spec-tag color-indicator-chip">
                        <span className="color-dot" style={{ backgroundColor: getColorSwatch(bike.color) }} />
                        {bike.color}
                      </span>
                      <span className="spec-tag">Year {bike.modelYear}</span>
                      <span className="spec-tag">{bike.marketTarget}</span>
                      {bike.conditionGrade && (
                        <span className="spec-tag text-amber">
                          ★ {bike.conditionGrade.replace('GRADE_', 'Grade ')}
                        </span>
                      )}
                    </div>

                    {/* Technical IDs Box */}
                    <div className="bike-ids-box">
                      <div className="id-row">
                        <span className="id-title">CHASSIS</span>
                        <span className="font-mono text-cyan text-xs font-bold">{bike.chassisNumber}</span>
                        <button 
                          className="copy-btn" 
                          onClick={() => copyToClipboard(bike.chassisNumber)}
                          title="Copy Chassis Number"
                        >
                          {copiedChassis === bike.chassisNumber ? (
                            <>
                              <Check size={12} className="text-emerald" />
                              <span className="text-emerald text-xs">Copied</span>
                            </>
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      <div className="id-row">
                        <span className="id-title">ENGINE</span>
                        <span className="font-mono text-muted text-xs">{bike.engineNumber}</span>
                      </div>
                      {bike.registrationNumber && (
                        <div className="id-row">
                          <span className="id-title">REG NO</span>
                          <span className="font-mono text-amber text-xs font-bold">{bike.registrationNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Margins */}
                    <div className="bike-price-footer">
                      <div>
                        <span className="price-label">Retail Selling Price</span>
                        <div className="price-val">{formatPKR(bike.retailPrice)}</div>
                      </div>
                      <div className="text-right">
                        <span className="price-label">Dealer Cost</span>
                        <div className="cost-val text-muted text-xs font-mono">
                          {formatPKR(cost)}
                        </div>
                        {margin > 0 && (
                          <div className="profit-margin-tag mt-1">
                            +{formatPKR(margin)} margin
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  {hasPermission('MANAGE_BIKES') && (
                    <div className="bike-card-actions">
                      <button className="btn-card-action" onClick={() => handleEdit(bike)}>
                        <Edit3 size={14} /> Edit Specs
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
              No motorcycles found matching current filter criteria.
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
                  <th>Vehicle & Model</th>
                  <th>Chassis & Engine</th>
                  <th>Specs & Color</th>
                  <th>Commercials</th>
                  <th>Target Channel</th>
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
                          {bike.type === 'BRAND_NEW' ? 'Brand New' : 'Used'}
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
                      <div className="font-mono text-muted text-xs mt-1">Eng: {bike.engineNumber}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="color-dot" style={{ backgroundColor: getColorSwatch(bike.color) }} />
                        <span>{bike.color}</span>
                      </div>
                      <div className="text-muted text-xs mt-1">Year {bike.modelYear}</div>
                    </td>
                    <td>
                      <div className="font-bold text-main">{formatPKR(bike.retailPrice)}</div>
                      <div className="text-muted text-xs font-mono">Cost: {formatPKR(bike.dealerInvoicePrice || bike.purchaseCost)}</div>
                    </td>
                    <td>
                      <span className="glass-badge badge-muted">{bike.marketTarget}</span>
                    </td>
                    <td>
                      <span className={`glass-badge ${
                        bike.status === 'IN_STOCK' ? 'badge-emerald' :
                        bike.status === 'RESERVED' ? 'badge-amber' :
                        bike.status === 'SOLD' ? 'badge-rose' : 'badge-muted'
                      }`}>
                        {bike.status.replace('_', ' ')}
                      </span>
                    </td>
                    {hasPermission('MANAGE_BIKES') && (
                      <td className="text-right">
                        <div className="table-actions">
                          <button className="action-icon-btn" onClick={() => handleEdit(bike)} title="Edit Vehicle">
                            <Edit3 size={15} />
                          </button>
                          {bike.status !== 'SOLD' && (
                            <button className="action-icon-btn text-rose" onClick={() => handleDelete(bike.id)} title="Delete Vehicle">
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
