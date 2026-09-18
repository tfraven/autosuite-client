import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Plus,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Package,
  ShoppingCart,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from './Pagination';

export default function Parts() {
  const { hasPermission } = useAuth();
  const { t, isRomanUrdu } = useLanguage();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'orders' | 'vendor-pos'
  const [parts, setParts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [vendorPOs, setVendorPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [subView, setSubView] = useState(null); // 'add-part' | 'create-order' | 'create-po'
  const [editingPart, setEditingPart] = useState(null);
  const [partToDelete, setPartToDelete] = useState(null);

  // Forms
  const [partForm, setPartForm] = useState({
    partCode: '',
    partName: '',
    compatibilityModel: '',
    wholesaleCost: '',
    b2bSellingPrice: '',
    quantity: '',
    reorderThreshold: '5',
    category: '',
    location: ''
  });

  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [submittingPO, setSubmittingPO] = useState(false);
  const [poForm, setPoForm] = useState({
    vendorName: '',
    contactNumber: '',
    items: [{ partId: '', quantity: 1, unitCost: 0 }]
  });

  const fetchPartsData = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter) params.category = categoryFilter;

      const [partsRes, alertsRes, ordersRes, posRes, catRes, venRes] = await Promise.all([
        api.getParts(params).catch(() => []),
        api.getLowStockAlerts().catch(() => ({ parts: [] })),
        api.getPartsOrders().catch(() => []),
        api.getVendorPOs().catch(() => []),
        api.getPartCategories().catch(() => []),
        api.getVendors().catch(() => [])
      ]);

      if (partsRes.pagination) {
        setParts(partsRes.data || partsRes.parts || []);
        setTotalPages(partsRes.pagination.totalPages || 1);
        setTotalCount(partsRes.pagination.total || 0);
      } else {
        const list = Array.isArray(partsRes) ? partsRes : [];
        setParts(list);
        setTotalCount(list.length);
        setTotalPages(1);
      }

      setLowStockAlerts(alertsRes.parts || []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setVendorPOs(Array.isArray(posRes) ? posRes : []);
      setCategories(Array.isArray(catRes) ? catRes : (catRes?.categories || []));
      setVendors(Array.isArray(venRes) ? venRes : (venRes?.vendors || []));
    } catch (err) {
      console.error('Error fetching parts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartsData();
  }, [searchQuery, categoryFilter, page, limit]);

  const handleSavePart = async (e) => {
    e.preventDefault();
    try {
      if (editingPart) {
        await api.updatePart(editingPart.id, partForm);
        toast.success(`Part ${partForm.partName} updated successfully.`);
      } else {
        await api.createPart(partForm);
        toast.success(`New spare part ${partForm.partName} added to catalog.`);
      }
      setSubView(null);
      fetchPartsData();
    } catch (err) {
      toast.error(err.message || 'Failed to save spare part');
    }
  };

  const handleReceivePO = async (poId) => {
    try {
      await api.receiveVendorPO(poId);
      toast.success('Shipment received! Stock levels incremented.');
      fetchPartsData();
    } catch (err) {
      toast.error(err.message || 'Failed to receive shipment');
    }
  };

  const handleSavePO = async (e) => {
    e.preventDefault();
    try {
      setSubmittingPO(true);
      const validItems = poForm.items
        .filter((it) => it.partId && Number(it.quantity) > 0)
        .map((it) => ({
          partId: it.partId,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost || 0)
        }));

      if (validItems.length === 0) {
        toast.error('Please select at least one part and specify valid quantity.');
        return;
      }

      await api.createVendorPO({
        vendorName: poForm.vendorName.trim(),
        contactNumber: poForm.contactNumber.trim(),
        items: validItems
      });

      toast.success('Vendor Purchase Order created successfully!');
      setSubView(null);
      fetchPartsData();
    } catch (err) {
      toast.error(err.message || 'Failed to create vendor purchase order');
    } finally {
      setSubmittingPO(false);
    }
  };

  const formatPKR = (val) => 'PKR ' + Number(val || 0).toLocaleString('en-PK');

  return (
    <div className="parts-module-view">
      {/* Module Header Bar */}
      <div className="control-bar glass-panel no-print mb-4">
        <div className="filter-group">
          <div className="type-toggle">
            <button
              className={`toggle-btn ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Wrench size={14} /> Catalog ({totalCount})
            </button>
            <button
              className={`toggle-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingCart size={14} /> B2B Orders ({orders.length})
            </button>
            <button
              className={`toggle-btn ${activeTab === 'vendor-pos' ? 'active' : ''}`}
              onClick={() => setActiveTab('vendor-pos')}
            >
              <Package size={14} /> Vendor POs ({vendorPOs.length})
            </button>
          </div>
        </div>

        <div className="action-group">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search part code, name or model…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <button className="btn btn-outline" onClick={() => api.downloadExcel('parts')}>
            <FileSpreadsheet size={16} /> Export
          </button>

          {hasPermission('MANAGE_PARTS') && activeTab === 'vendor-pos' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setPoForm({
                  vendorName: '',
                  contactNumber: '',
                  items: [{ partId: parts[0]?.id || '', quantity: 1, unitCost: parts[0]?.wholesaleCost || 0 }]
                });
                setSubView('create-po');
              }}
            >
              <Plus size={16} /> Create Vendor PO
            </button>
          )}

          {hasPermission('MANAGE_PARTS') && activeTab === 'inventory' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingPart(null);
                setPartForm({
                  partCode: '',
                  partName: '',
                  compatibilityModel: '',
                  wholesaleCost: '',
                  b2bSellingPrice: '',
                  quantity: '',
                  reorderThreshold: '5',
                  category: '',
                  location: ''
                });
                setSubView('add-part');
              }}
            >
              <Plus size={16} /> Add Spare Part
            </button>
          )}
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="alert-banner p-3 bg-bad-soft text-bad rounded-md mb-4 border border-bad-line flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle size={16} />
            <span>
              Low Stock Warning: <strong>{lowStockAlerts.length} parts</strong> are below minimum reorder thresholds!
            </span>
          </div>
          <span className="glass-badge badge-rose text-xs">Action Required</span>
        </div>
      )}

      {/* View 1: Parts Catalog Table */}
      {activeTab === 'inventory' && (
        <div className="card glass-panel no-print">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Part Name</th>
                  <th>Compatibility</th>
                  <th>Wholesale Cost</th>
                  <th>B2B Selling</th>
                  <th>Stock Qty</th>
                  <th>Location</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="loading-cell">
                      <div className="spinner"></div> Loading spare parts catalog…
                    </td>
                  </tr>
                ) : parts.length > 0 ? (
                  parts.map((p) => {
                    const isLow = p.quantity <= p.reorderThreshold;
                    return (
                      <tr key={p.id} className={isLow ? 'bg-bad-soft/20' : ''}>
                        <td className="font-mono text-cyan font-bold">{p.partCode}</td>
                        <td>
                          <div className="font-bold text-main">{p.partName}</div>
                          <span className="text-xs text-muted">{p.category || 'General'}</span>
                        </td>
                        <td>
                          <span className="glass-badge badge-muted text-xs">{p.compatibilityModel}</span>
                        </td>
                        <td className="font-mono">{formatPKR(p.wholesaleCost)}</td>
                        <td className="font-mono font-bold text-emerald">{formatPKR(p.b2bSellingPrice)}</td>
                        <td>
                          <span className={`glass-badge ${isLow ? 'badge-rose' : 'badge-emerald'} font-mono`}>
                            {p.quantity} units {isLow && '(Low)'}
                          </span>
                        </td>
                        <td className="text-xs text-muted">{p.location || 'Main Shelf'}</td>
                        <td className="text-right">
                          <div className="table-actions flex items-center justify-end gap-1">
                            <button
                              className="btn-action-icon"
                              onClick={() => {
                                setEditingPart(p);
                                setPartForm({
                                  partCode: p.partCode,
                                  partName: p.partName,
                                  compatibilityModel: p.compatibilityModel,
                                  wholesaleCost: p.wholesaleCost,
                                  b2bSellingPrice: p.b2bSellingPrice,
                                  quantity: p.quantity,
                                  reorderThreshold: p.reorderThreshold,
                                  category: p.category || '',
                                  location: p.location || ''
                                });
                                setSubView('add-part');
                              }}
                              title="Edit Part"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              className="btn-action-icon text-rose"
                              onClick={() => setPartToDelete(p)}
                              title="Soft Delete Part"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-placeholder">No spare parts match search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={limit}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>
      )}

      {/* View 2: B2B Orders */}
      {activeTab === 'orders' && (
        <div className="card glass-panel no-print">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer / Workshop</th>
                  <th>Items Included</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td className="font-mono text-cyan font-bold">{o.orderNumber}</td>
                      <td>
                        <div className="font-bold">{o.customerName}</div>
                        <div className="text-xs text-muted font-mono">{o.contactNumber}</div>
                      </td>
                      <td>
                        <span className="glass-badge badge-purple text-xs">
                          {o.items?.length || 0} line items
                        </span>
                      </td>
                      <td className="font-mono font-bold text-emerald">{formatPKR(o.totalAmount)}</td>
                      <td className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                      <td><span className="glass-badge badge-emerald">COMPLETED</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-placeholder">No B2B orders recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Vendor Purchase Orders */}
      {activeTab === 'vendor-pos' && (
        <div className="card glass-panel no-print">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Vendor Supplier</th>
                  <th>Total Payable</th>
                  <th>Ordered At</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorPOs.length > 0 ? (
                  vendorPOs.map((po) => (
                    <tr key={po.id}>
                      <td className="font-mono text-cyan font-bold">{po.poNumber}</td>
                      <td><div className="font-bold">{po.vendorName}</div></td>
                      <td className="font-mono font-bold">{formatPKR(po.totalAmount)}</td>
                      <td className="text-xs text-muted">{new Date(po.orderedAt || po.createdAt).toLocaleDateString('en-GB')}</td>
                      <td>
                        <span className={`glass-badge ${po.status === 'RECEIVED' ? 'badge-emerald' : 'badge-amber'}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {po.status !== 'RECEIVED' && (
                          <button
                            className="btn btn-xs btn-primary"
                            onClick={() => handleReceivePO(po.id)}
                          >
                            <CheckCircle2 size={13} /> Receive & Increment Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-placeholder">No vendor purchase orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Part Modal */}
      {subView === 'add-part' && (
        <div className="modal-overlay" onClick={() => setSubView(null)}>
          <div className="modal-container glass-panel slide-in max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}</h3>
              <button className="modal-close-btn" onClick={() => setSubView(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSavePart} className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="form-field">
                  <label>Part Code</label>
                  <input
                    type="text"
                    className="form-input font-mono uppercase"
                    placeholder="e.g. BRK-PAD-01"
                    value={partForm.partCode}
                    onChange={(e) => setPartForm({ ...partForm, partCode: e.target.value.toUpperCase() })}
                    required
                    disabled={!!editingPart}
                  />
                </div>
                <div className="form-field">
                  <label>Part Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Front Brake Shoe Pad"
                    value={partForm.partName}
                    onChange={(e) => setPartForm({ ...partForm, partName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="form-field">
                  <label>Compatibility Model</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Honda CD-70 / CG-125"
                    value={partForm.compatibilityModel}
                    onChange={(e) => setPartForm({ ...partForm, compatibilityModel: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Category</label>
                  <input
                    type="text"
                    list="parts-category-options"
                    className="form-input"
                    placeholder="e.g. Brakes, Engine, Clutch"
                    value={partForm.category}
                    onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
                  />
                  <datalist id="parts-category-options">
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="form-field">
                  <label>Wholesale Cost (PKR)</label>
                  <input
                    type="number"
                    className="form-input font-mono"
                    value={partForm.wholesaleCost}
                    onChange={(e) => setPartForm({ ...partForm, wholesaleCost: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>B2B Selling Price (PKR)</label>
                  <input
                    type="number"
                    className="form-input font-mono"
                    value={partForm.b2bSellingPrice}
                    onChange={(e) => setPartForm({ ...partForm, b2bSellingPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="form-field">
                  <label>Initial Quantity</label>
                  <input
                    type="number"
                    className="form-input font-mono"
                    value={partForm.quantity}
                    onChange={(e) => setPartForm({ ...partForm, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Reorder Alert Threshold</label>
                  <input
                    type="number"
                    className="form-input font-mono"
                    value={partForm.reorderThreshold}
                    onChange={(e) => setPartForm({ ...partForm, reorderThreshold: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer pt-3 border-t border-line-soft">
                <button type="button" className="btn btn-secondary" onClick={() => setSubView(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Part</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Vendor PO Modal */}
      {subView === 'create-po' && (
        <div className="modal-overlay" onClick={() => setSubView(null)}>
          <div className="modal-container glass-panel slide-in max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Vendor Purchase Order</h3>
              <button className="modal-close-btn" onClick={() => setSubView(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSavePO} className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="form-field">
                  <label>Vendor Supplier Name *</label>
                  <input
                    type="text"
                    list="vendors-list-options"
                    className="form-input"
                    placeholder="e.g. Atlas Honda Genuine Parts Ltd"
                    value={poForm.vendorName}
                    onChange={(e) => {
                      const name = e.target.value;
                      const matched = vendors.find((v) => v.name?.toLowerCase() === name.toLowerCase());
                      setPoForm({
                        ...poForm,
                        vendorName: name,
                        contactNumber: matched?.contactNumber || poForm.contactNumber
                      });
                    }}
                    required
                  />
                  <datalist id="vendors-list-options">
                    {vendors.map((v) => (
                      <option key={v.id} value={v.name}>{v.contactNumber || ''}</option>
                    ))}
                  </datalist>
                </div>
                <div className="form-field">
                  <label>Vendor Contact Number *</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    placeholder="042-35990000"
                    value={poForm.contactNumber}
                    onChange={(e) => setPoForm({ ...poForm, contactNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-sm">Purchase Order Items</label>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => {
                      setPoForm({
                        ...poForm,
                        items: [...poForm.items, { partId: parts[0]?.id || '', quantity: 1, unitCost: parts[0]?.wholesaleCost || 0 }]
                      });
                    }}
                  >
                    <Plus size={13} /> Add Part Line
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {poForm.items.map((item, idx) => {
                    const lineTotal = Number(item.quantity || 0) * Number(item.unitCost || 0);
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-surface-soft border border-line-soft">
                        <div className="flex-1">
                          <select
                            className="form-input text-xs"
                            value={item.partId}
                            onChange={(e) => {
                              const selectedPart = parts.find((p) => p.id === e.target.value);
                              const updated = [...poForm.items];
                              updated[idx] = {
                                ...updated[idx],
                                partId: e.target.value,
                                unitCost: selectedPart?.wholesaleCost || updated[idx].unitCost
                              };
                              setPoForm({ ...poForm, items: updated });
                            }}
                            required
                          >
                            <option value="">-- Select Spare Part --</option>
                            {parts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.partName} ({p.partCode}) - Stock: {p.quantity}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className="form-input text-xs font-mono"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...poForm.items];
                              updated[idx].quantity = e.target.value;
                              setPoForm({ ...poForm, items: updated });
                            }}
                            required
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            min="0"
                            placeholder="Cost"
                            className="form-input text-xs font-mono"
                            value={item.unitCost}
                            onChange={(e) => {
                              const updated = [...poForm.items];
                              updated[idx].unitCost = e.target.value;
                              setPoForm({ ...poForm, items: updated });
                            }}
                            required
                          />
                        </div>
                        <div className="w-28 text-right font-mono text-xs font-semibold text-cyan">
                          {formatPKR(lineTotal)}
                        </div>
                        {poForm.items.length > 1 && (
                          <button
                            type="button"
                            className="text-rose p-1 hover:bg-rose/10 rounded"
                            onClick={() => {
                              const updated = poForm.items.filter((_, i) => i !== idx);
                              setPoForm({ ...poForm, items: updated });
                            }}
                            title="Remove Line"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end items-center gap-2 mt-3 pt-2 border-t border-line-soft">
                  <span className="text-sm text-muted">Total Payable:</span>
                  <span className="font-mono text-base font-bold text-emerald">
                    {formatPKR(
                      poForm.items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.unitCost || 0)), 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="modal-footer pt-3 border-t border-line-soft flex justify-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setSubView(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingPO}>
                  {submittingPO ? 'Creating...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GitHub-Style Soft Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!partToDelete}
        onClose={() => setPartToDelete(null)}
        title="Soft Delete Spare Part"
        itemName="Spare Part"
        targetValue={partToDelete?.partCode || ''}
        promptLabel="Type part code to confirm soft deletion:"
        onConfirm={async () => {
          if (!partToDelete) return;
          await api.deletePart(partToDelete.id);
          toast.success(`Part ${partToDelete.partName} (${partToDelete.partCode}) soft deleted.`);
          fetchPartsData();
        }}
      />
    </div>
  );
}