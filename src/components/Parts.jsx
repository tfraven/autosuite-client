import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Plus,
  AlertTriangle,
  Truck,
  Package,
  FileSpreadsheet,
  ShoppingBag,
  CheckCircle2,
  X,
  PlusCircle,
  Trash2,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Parts() {
  const { hasPermission } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('catalog'); // catalog, orders, pos
  const [parts, setParts] = useState([]);
  const [lowStockParts, setLowStockParts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Page View States (null | 'add-part' | 'new-order' | 'new-po')
  const [subView, setSubView] = useState(null);

  // Form states
  const [partFormData, setPartFormData] = useState({
    partCode: '',
    partName: '',
    compatibilityModel: '',
    wholesaleCost: '',
    b2bSellingPrice: '',
    quantity: '',
    reorderThreshold: 5,
    category: 'Engine & Transmission',
    location: ''
  });

  // B2B Order Form state
  const [orderFormData, setOrderFormData] = useState({
    customerName: '',
    customerType: 'SECONDARY_WORKSHOP',
    contactNumber: '',
    notes: '',
    items: [{ partId: '', quantity: 1, unitPrice: '' }]
  });

  // Vendor PO Form state
  const [poFormData, setPoFormData] = useState({
    vendorName: 'Atlas Honda Genuine Parts Depot',
    contactNumber: '042-35129000',
    notes: '',
    items: [{ partId: '', quantityOrdered: 10, unitCost: '' }]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [partsData, alertsData, ordersData, posData] = await Promise.all([
        api.getParts({ search: searchQuery }),
        api.getLowStockAlerts(),
        api.getPartsOrders(),
        api.getVendorPOs()
      ]);

      setParts(partsData);
      setLowStockParts(alertsData.parts || []);
      setOrders(ordersData);
      setPos(posData);
    } catch (err) {
      console.error('Error loading parts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const handleCreatePart = async (e) => {
    e.preventDefault();
    try {
      await api.createPart(partFormData);
      setSubView(null);
      setPartFormData({
        partCode: '',
        partName: '',
        compatibilityModel: '',
        wholesaleCost: '',
        b2bSellingPrice: '',
        quantity: '',
        reorderThreshold: 5,
        category: 'Engine & Transmission',
        location: ''
      });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to add spare part');
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await api.createPartsOrder(orderFormData);
      setSubView(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create B2B order');
    }
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    try {
      await api.createVendorPO(poFormData);
      setSubView(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create Vendor PO');
    }
  };

  const handleReceivePo = async (poId) => {
    if (!window.confirm('Receive delivery and update spare parts inventory stock?')) return;
    try {
      await api.receiveVendorPO(poId);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to process PO receipt');
    }
  };

  const formatPKR = (val) => {
    return 'PKR ' + Number(val || 0).toLocaleString('en-PK');
  };

  if (subView === 'add-part') {
    return (
      <div className="parts-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={() => setSubView(null)}>
              <ArrowLeft size={16} /> Back to Spare Parts
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">Register Genuine Spare Part</h2>
              <div className="page-form-subtitle">Add OEM or aftermarket component to inventory and set wholesale pricing</div>
            </div>
          </div>

          <form onSubmit={handleCreatePart} className="page-form-container medium">
            <div className="page-form-card">
              <div className="page-form-card-title">Part Identification & Classification</div>

              <div className="form-group-row">
                <div className="form-field">
                  <label>Part Code / Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. HND-CG-CLU-04"
                    value={partFormData.partCode}
                    onChange={(e) => setPartFormData({ ...partFormData, partCode: e.target.value })}
                    required
                    className="form-input font-mono"
                  />
                </div>
                <div className="form-field">
                  <label>Category</label>
                  <select
                    value={partFormData.category}
                    onChange={(e) => setPartFormData({ ...partFormData, category: e.target.value })}
                    className="form-input"
                  >
                    <option value="Engine & Transmission">Engine & Transmission</option>
                    <option value="Fuel System">Fuel System</option>
                    <option value="Brakes & Suspension">Brakes & Suspension</option>
                    <option value="Electrical & Lighting">Electrical & Lighting</option>
                    <option value="Lubricants & Fluids">Lubricants & Fluids</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Part Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Clutch Cable Assembly"
                  value={partFormData.partName}
                  onChange={(e) => setPartFormData({ ...partFormData, partName: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>Compatible Models *</label>
                <input
                  type="text"
                  placeholder="e.g. Honda CG125 (2020-2026)"
                  value={partFormData.compatibilityModel}
                  onChange={(e) => setPartFormData({ ...partFormData, compatibilityModel: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group-row">
                <div className="form-field">
                  <label>Wholesale Depot Cost (PKR) *</label>
                  <input
                    type="number"
                    value={partFormData.wholesaleCost}
                    onChange={(e) => setPartFormData({ ...partFormData, wholesaleCost: e.target.value })}
                    required
                    className="form-input font-mono"
                  />
                </div>
                <div className="form-field">
                  <label>B2B Workshop Price (PKR) *</label>
                  <input
                    type="number"
                    value={partFormData.b2bSellingPrice}
                    onChange={(e) => setPartFormData({ ...partFormData, b2bSellingPrice: e.target.value })}
                    required
                    className="form-input font-mono text-cyan"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-field">
                  <label>Initial Shelf Stock *</label>
                  <input
                    type="number"
                    value={partFormData.quantity}
                    onChange={(e) => setPartFormData({ ...partFormData, quantity: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label>Warehouse / Bin Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Rack B-12"
                    value={partFormData.location}
                    onChange={(e) => setPartFormData({ ...partFormData, location: e.target.value })}
                    className="form-input font-mono"
                  />
                </div>
                <div className="form-field">
                  <label>Reorder Alert Threshold *</label>
                  <input
                    type="number"
                    value={partFormData.reorderThreshold}
                    onChange={(e) => setPartFormData({ ...partFormData, reorderThreshold: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="page-form-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSubView(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Save Part to Catalog
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (subView === 'new-order') {
    return (
      <div className="parts-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={() => setSubView(null)}>
              <ArrowLeft size={16} /> Back to Orders
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">Create B2B Wholesale Parts Order</h2>
              <div className="page-form-subtitle">Issue wholesale dispatch to secondary workshops, partner mechanics, or sub-dealers</div>
            </div>
          </div>

          <form onSubmit={handleCreateOrder} className="page-form-container">
            <div className="page-form-card">
              <div className="page-form-card-title">Workshop & Buyer Details</div>

              <div className="form-group-row">
                <div className="form-field">
                  <label>Workshop / Dealer Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Shaheen Auto Workshop"
                    value={orderFormData.customerName}
                    onChange={(e) => setOrderFormData({ ...orderFormData, customerName: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label>Customer Type</label>
                  <select
                    value={orderFormData.customerType}
                    onChange={(e) => setOrderFormData({ ...orderFormData, customerType: e.target.value })}
                    className="form-input"
                  >
                    <option value="SECONDARY_WORKSHOP">Secondary Workshop</option>
                    <option value="MECHANIC">Independent Mechanic</option>
                    <option value="PARTNER_DEALER">Partner Dealer</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Contact Phone *</label>
                  <input
                    type="text"
                    placeholder="e.g. 0300-9876543"
                    value={orderFormData.contactNumber}
                    onChange={(e) => setOrderFormData({ ...orderFormData, contactNumber: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="page-form-card">
              <div className="page-form-card-title">Order Line Items</div>

              {orderFormData.items.map((item, idx) => (
                <div key={idx} className="line-item-row">
                  <div className="form-field" style={{ flex: 3 }}>
                    <label>Select Spare Part *</label>
                    <select
                      value={item.partId}
                      onChange={(e) => {
                        const part = parts.find(p => p.id === e.target.value);
                        const updated = [...orderFormData.items];
                        updated[idx].partId = e.target.value;
                        updated[idx].unitPrice = part ? part.b2bSellingPrice : '';
                        setOrderFormData({ ...orderFormData, items: updated });
                      }}
                      required
                      className="form-input"
                    >
                      <option value="">-- Choose Spare Part --</option>
                      {parts.map(p => (
                        <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                          {p.partName} ({p.partCode}) - Avail: {p.quantity} - {formatPKR(p.b2bSellingPrice)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field" style={{ flex: 1 }}>
                    <label>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...orderFormData.items];
                        updated[idx].quantity = Number(e.target.value);
                        setOrderFormData({ ...orderFormData, items: updated });
                      }}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-field" style={{ flex: 1.5 }}>
                    <label>Unit Rate (PKR) *</label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...orderFormData.items];
                        updated[idx].unitPrice = Number(e.target.value);
                        setOrderFormData({ ...orderFormData, items: updated });
                      }}
                      required
                      className="form-input font-mono"
                    />
                  </div>

                  {orderFormData.items.length > 1 && (
                    <button
                      type="button"
                      className="action-icon-btn text-rose mt-4"
                      onClick={() => {
                        const updated = orderFormData.items.filter((_, i) => i !== idx);
                        setOrderFormData({ ...orderFormData, items: updated });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="btn btn-outline btn-sm mt-2"
                onClick={() => setOrderFormData({
                  ...orderFormData,
                  items: [...orderFormData.items, { partId: '', quantity: 1, unitPrice: '' }]
                })}
              >
                <PlusCircle size={14} /> Add Another Item
              </button>

              <div className="form-field mt-3">
                <label>Order Dispatch Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Sent via courier or driver counter pickup"
                  value={orderFormData.notes}
                  onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="page-form-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSubView(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <ShoppingBag size={16} /> Confirm B2B Wholesale Order
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (subView === 'new-po') {
    return (
      <div className="parts-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={() => setSubView(null)}>
              <ArrowLeft size={16} /> Back to Purchase Orders
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">Create Factory / Vendor Restock PO</h2>
              <div className="page-form-subtitle">Order genuine parts restock from Atlas Honda OEM depot or authorized vendor</div>
            </div>
          </div>

          <form onSubmit={handleCreatePo} className="page-form-container">
            <div className="page-form-card">
              <div className="page-form-card-title">Vendor & Supplier Credentials</div>

              <div className="form-group-row">
                <div className="form-field" style={{ flex: 2 }}>
                  <label>Vendor / Parts Supplier *</label>
                  <input
                    type="text"
                    value={poFormData.vendorName}
                    onChange={(e) => setPoFormData({ ...poFormData, vendorName: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label>Supplier Contact *</label>
                  <input
                    type="text"
                    value={poFormData.contactNumber}
                    onChange={(e) => setPoFormData({ ...poFormData, contactNumber: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="page-form-card">
              <div className="page-form-card-title">Procurement Items</div>

              {poFormData.items.map((item, idx) => (
                <div key={idx} className="line-item-row">
                  <div className="form-field" style={{ flex: 3 }}>
                    <label>Select Part *</label>
                    <select
                      value={item.partId}
                      onChange={(e) => {
                        const part = parts.find(p => p.id === e.target.value);
                        const updated = [...poFormData.items];
                        updated[idx].partId = e.target.value;
                        updated[idx].unitCost = part ? part.wholesaleCost : '';
                        setPoFormData({ ...poFormData, items: updated });
                      }}
                      required
                      className="form-input"
                    >
                      <option value="">-- Choose Spare Part --</option>
                      {parts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.partName} ({p.partCode}) - Current: {p.quantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field" style={{ flex: 1 }}>
                    <label>Quantity Ordered *</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantityOrdered}
                      onChange={(e) => {
                        const updated = [...poFormData.items];
                        updated[idx].quantityOrdered = Number(e.target.value);
                        setPoFormData({ ...poFormData, items: updated });
                      }}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-field" style={{ flex: 1.5 }}>
                    <label>Contract Unit Cost (PKR) *</label>
                    <input
                      type="number"
                      value={item.unitCost}
                      onChange={(e) => {
                        const updated = [...poFormData.items];
                        updated[idx].unitCost = Number(e.target.value);
                        setPoFormData({ ...poFormData, items: updated });
                      }}
                      required
                      className="form-input font-mono"
                    />
                  </div>

                  {poFormData.items.length > 1 && (
                    <button
                      type="button"
                      className="action-icon-btn text-rose mt-4"
                      onClick={() => {
                        const updated = poFormData.items.filter((_, i) => i !== idx);
                        setPoFormData({ ...poFormData, items: updated });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="btn btn-outline btn-sm mt-2"
                onClick={() => setPoFormData({
                  ...poFormData,
                  items: [...poFormData.items, { partId: '', quantityOrdered: 10, unitCost: '' }]
                })}
              >
                <PlusCircle size={14} /> Add Another PO Item
              </button>

              <div className="form-field mt-3">
                <label>Purchase Order Terms & Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Urgent shipment via freight depot"
                  value={poFormData.notes}
                  onChange={(e) => setPoFormData({ ...poFormData, notes: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="page-form-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSubView(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Truck size={16} /> Issue Vendor Purchase Order
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="parts-view">
      {/* Low Stock Warning Banner */}
      {lowStockParts.length > 0 && (
        <div className="welcome-banner glass-panel banner-warn">
          <div className="welcome-content">
            <h2 className="text-amber flex items-center gap-2">
              <AlertTriangle size={18} /> {lowStockParts.length} parts are below their reorder level
            </h2>
            <p>
              The following parts require urgent procurement: {lowStockParts.map(p => `${p.partName} (${p.quantity} units left)`).join(', ')}.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setActiveSubTab('pos');
              setSubView('new-po');
            }}
          >
            <Truck size={16} /> Create Restock PO
          </button>
        </div>
      )}

      {/* Sub-nav tabs & Actions */}
      <div className="control-bar glass-panel">
        <div className="type-toggle">
          <button
            className={`toggle-btn ${activeSubTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('catalog')}
          >
            <Package size={15} /> Catalog ({parts.length})
          </button>
          <button
            className={`toggle-btn ${activeSubTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('orders')}
          >
            <ShoppingBag size={15} /> Workshop Sales ({orders.length})
          </button>
          <button
            className={`toggle-btn ${activeSubTab === 'pos' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('pos')}
          >
            <Truck size={15} /> Vendor Orders ({pos.length})
          </button>
        </div>

        <div className="action-group">
          {activeSubTab === 'catalog' && (
            <>
              <div className="search-input-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search Part Code, Name, Model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              {hasPermission('EXPORT_EXCEL') && (
                <button className="btn btn-outline" onClick={() => api.downloadExcel('parts')}>
                  <FileSpreadsheet size={16} /> Export Parts
                </button>
              )}
              {hasPermission('MANAGE_PARTS') && (
                <button className="btn btn-primary" onClick={() => setSubView('add-part')}>
                  <Plus size={16} /> Add Part
                </button>
              )}
            </>
          )}

          {activeSubTab === 'orders' && hasPermission('MANAGE_PARTS') && (
            <button className="btn btn-primary" onClick={() => setSubView('new-order')}>
              <Plus size={16} /> New B2B Order
            </button>
          )}

          {activeSubTab === 'pos' && hasPermission('MANAGE_PARTS') && (
            <button className="btn btn-primary" onClick={() => setSubView('new-po')}>
              <Truck size={16} /> New Purchase Order
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Catalog */}
      {activeSubTab === 'catalog' && (
        <div className="card glass-panel">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Part Description</th>
                  <th>Compatible Model</th>
                  <th>Stock Inventory</th>
                  <th>Threshold</th>
                  <th>Wholesale Cost</th>
                  <th>B2B Price</th>
                  <th>Stock Health</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="loading-cell"><div className="spinner"></div> Loading parts catalog...</td></tr>
                ) : parts.length > 0 ? (
                  parts.map((p) => {
                    const isLow = p.quantity <= p.reorderThreshold;
                    const isZero = p.quantity === 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="font-bold text-main">{p.partName}</div>
                          <div className="font-mono text-cyan text-xs">{p.partCode}</div>
                          <div className="text-muted text-xs">Rack / Bin: {p.location || 'Central Depot'}</div>
                        </td>
                        <td>
                          <span className="font-medium text-xs text-secondary">{p.compatibilityModel}</span>
                        </td>
                        <td>
                          <div className="font-bold font-mono text-base">
                            <span className={isZero ? 'text-rose' : isLow ? 'text-amber' : 'text-emerald'}>
                              {p.quantity} Units
                            </span>
                          </div>
                          {/* Stock Health Progress Bar */}
                          <div className="part-progress-bar-wrap mt-1" style={{ width: 120 }}>
                            <div
                              className={`part-progress-bar ${isZero ? 'bar-red' : isLow ? 'bar-amber' : 'bar-green'}`}
                              style={{ width: `${Math.min(100, Math.max(8, (p.quantity / (p.reorderThreshold * 3)) * 100))}%` }}
                            />
                          </div>
                        </td>
                        <td>
                          <span className="text-muted text-xs font-mono">{p.reorderThreshold} Units</span>
                        </td>
                        <td className="font-mono text-muted">{formatPKR(p.wholesaleCost)}</td>
                        <td className="font-bold text-cyan font-mono">{formatPKR(p.b2bSellingPrice)}</td>
                        <td>
                          <span className={`glass-badge ${isZero ? 'badge-rose' : isLow ? 'badge-amber' : 'badge-emerald'}`}>
                            {isZero ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="7" className="empty-placeholder">No spare parts catalog entries found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: B2B Orders */}
      {activeSubTab === 'orders' && (
        <div className="card glass-panel">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Workshop / Buyer</th>
                  <th>Channel Type</th>
                  <th>Contact</th>
                  <th>Items Ordered</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td className="font-mono text-cyan font-bold">{o.orderNumber}</td>
                      <td className="font-medium text-main">{o.customerName}</td>
                      <td>
                        <span className="glass-badge badge-purple">
                          {o.customerType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-muted text-xs font-mono">{o.contactNumber}</td>
                      <td>
                        <div className="order-items-compact text-xs">
                          {o.items?.map((it, idx) => (
                            <div key={idx}>
                              • {it.part?.partName} x {it.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="font-bold text-emerald font-mono">{formatPKR(o.totalAmount)}</td>
                      <td className="text-muted text-xs font-mono">{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="empty-placeholder">No B2B wholesale orders recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Vendor POs */}
      {activeSubTab === 'pos' && (
        <div className="card glass-panel">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor / Supplier</th>
                  <th>Items Ordered</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pos.length > 0 ? (
                  pos.map((po) => (
                    <tr key={po.id}>
                      <td className="font-mono text-cyan font-bold">{po.poNumber}</td>
                      <td>
                        <div className="font-bold text-main">{po.vendorName}</div>
                        <div className="text-muted text-xs font-mono">{po.contactNumber}</div>
                      </td>
                      <td>
                        <div className="order-items-compact text-xs">
                          {po.items?.map((it, idx) => (
                            <div key={idx}>
                              • {it.part?.partName} ({it.quantityOrdered} units)
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="font-bold font-mono text-main">{formatPKR(po.totalAmount)}</td>
                      <td>
                        <span className={`glass-badge ${po.status === 'RECEIVED' ? 'badge-emerald' : 'badge-amber'}`}>
                          {po.status === 'RECEIVED' ? <CheckCircle2 size={12} /> : <Truck size={12} />}
                          {po.status}
                        </span>
                      </td>
                      <td className="text-muted text-xs font-mono">{new Date(po.createdAt).toLocaleDateString('en-GB')}</td>
                      <td className="text-right">
                        {po.status === 'ORDERED' && hasPermission('MANAGE_PARTS') && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleReceivePo(po.id)}
                          >
                            Mark Received & Restock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="empty-placeholder">No vendor purchase orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}