import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Printer,
  CreditCard,
  Calendar,
  FileSpreadsheet,
  X,
  DollarSign,
  Bike,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Sales({ isOpenNewSaleModal, onCloseNewSaleModal }) {
  const { hasPermission } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saleTypeFilter, setSaleTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Page View States ('new-sale' | 'record-payment' | null for list view)
  const [subView, setSubView] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeSaleForPayment, setActiveSaleForPayment] = useState(null);

  // Available in-stock bikes for Chassis selection
  const [availableBikes, setAvailableBikes] = useState([]);
  const [selectedBike, setSelectedBike] = useState(null);
  const [chassisSearch, setChassisSearch] = useState('');
  const [chassisError, setChassisError] = useState('');

  // New Sale Form
  const initialSaleForm = {
    saleType: 'B2C',
    customerName: '',
    customerPhone: '',
    customerCnic: '',
    customerAddress: '',
    customerType: 'RETAIL',
    salePrice: '',
    discount: 0,
    tax: 0,
    paymentType: 'CASH',
    initialDeposit: '',
    paymentReference: '',
    installmentsCount: 6,
    installmentIntervalMonths: 1,
    firstInstallmentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  const [saleForm, setSaleForm] = useState(initialSaleForm);
  const [saleFormError, setSaleFormError] = useState('');

  // Payment Recording Form
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    installmentId: '',
    notes: ''
  });

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {};
      if (saleTypeFilter) params.saleType = saleTypeFilter;
      if (paymentFilter) params.paymentType = paymentFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await api.getSales(params);
      setSales(data);
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBikes = async () => {
    try {
      const data = await api.getBikes({ status: 'IN_STOCK' });
      setAvailableBikes(data);
    } catch (err) {
      console.error('Error fetching in-stock bikes:', err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [saleTypeFilter, paymentFilter, searchQuery]);

  useEffect(() => {
    if (isOpenNewSaleModal) {
      openNewSaleModal();
    }
  }, [isOpenNewSaleModal]);

  const openNewSaleModal = () => {
    fetchAvailableBikes();
    setSelectedBike(null);
    setChassisSearch('');
    setChassisError('');
    setSaleForm(initialSaleForm);
    setSaleFormError('');
    setSubView('new-sale');
  };

  const closeNewSaleModal = () => {
    setSubView(null);
    if (onCloseNewSaleModal) onCloseNewSaleModal();
  };

  const handleChassisSelect = (bikeId) => {
    const bike = availableBikes.find(b => b.id === bikeId);
    if (bike) {
      setSelectedBike(bike);
      setSaleForm(prev => ({
        ...prev,
        salePrice: bike.retailPrice,
        initialDeposit: prev.paymentType === 'CASH' ? bike.retailPrice : Math.round(bike.retailPrice * 0.3)
      }));
      setChassisError('');
    }
  };

  const handleChassisLookup = async () => {
    if (!chassisSearch.trim()) return;
    try {
      setChassisError('');
      const bike = await api.searchChassis(chassisSearch.trim());
      setSelectedBike(bike);
      setSaleForm(prev => ({
        ...prev,
        salePrice: bike.retailPrice,
        initialDeposit: prev.paymentType === 'CASH' ? bike.retailPrice : Math.round(bike.retailPrice * 0.3)
      }));
    } catch (err) {
      setChassisError(err.message || 'No available motorcycle found with this chassis number');
      setSelectedBike(null);
    }
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    if (!selectedBike) {
      setSaleFormError('Please select or search a motorcycle using Frame/Chassis Number.');
      return;
    }

    try {
      setSaleFormError('');
      const payload = {
        ...saleForm,
        bikeId: selectedBike.id,
        salePrice: Number(saleForm.salePrice),
        discount: Number(saleForm.discount) || 0,
        tax: Number(saleForm.tax) || 0,
        initialDeposit: Number(saleForm.initialDeposit) || 0,
        installmentsCount: Number(saleForm.installmentsCount) || 0
      };

      const newSale = await api.createSale(payload);
      setSubView(null);
      if (onCloseNewSaleModal) onCloseNewSaleModal();
      fetchSales();
      setSelectedInvoice(newSale);
    } catch (err) {
      setSaleFormError(err.message || 'Failed to complete sales transaction');
    }
  };

  const openPaymentModal = (sale) => {
    setActiveSaleForPayment(sale);
    setPaymentFormData({
      amount: sale.remainingBalance,
      paymentMethod: 'CASH',
      referenceNumber: '',
      installmentId: '',
      notes: ''
    });
    setSubView('record-payment');
  };

  const closePaymentModal = () => {
    setSubView(null);
    setActiveSaleForPayment(null);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!activeSaleForPayment) return;
    try {
      const updated = await api.recordPayment(activeSaleForPayment.id, paymentFormData);
      setSubView(null);
      setActiveSaleForPayment(null);
      fetchSales();
      setSelectedInvoice(updated);
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const formatPKR = (val) => {
    return 'PKR ' + Number(val || 0).toLocaleString('en-PK');
  };

  // Calculations for sale form summary
  const subtotal = Number(saleForm.salePrice) || 0;
  const discount = Number(saleForm.discount) || 0;
  const tax = Number(saleForm.tax) || 0;
  const finalAmount = Math.max(0, subtotal - discount + tax);
  const deposit = Number(saleForm.initialDeposit) || 0;
  const remainingDue = Math.max(0, finalAmount - deposit);

  if (subView === 'new-sale') {
    return (
      <div className="sales-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={closeNewSaleModal}>
              <ArrowLeft size={16} /> Back to sales
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">New sale</h2>
              <div className="page-form-subtitle">Select the motorcycle, enter the buyer's details and set the payment plan</div>
            </div>
          </div>

          <form onSubmit={handleCreateSale} className="page-form-container">
            {saleFormError && <div className="page-form-error">{saleFormError}</div>}

            <div className="page-form-grid-2">
              {/* Step 1: Chassis Selection */}
              <div className="page-form-card">
                <div className="page-form-card-title">Motorcycle</div>

                <div className="chassis-lookup-card">
                  <label>Choose from in-stock motorcycles</label>
                  <select
                    className="form-input mb-2"
                    value={selectedBike?.id || ''}
                    onChange={(e) => handleChassisSelect(e.target.value)}
                  >
                    <option value="">Select a motorcycle</option>
                    {availableBikes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.modelName} — {b.chassisNumber} — {b.color} ({b.retailPrice})
                      </option>
                    ))}
                  </select>

                  <div className="or-divider"><span>or search by chassis number</span></div>

                  <div className="chassis-search-row">
                    <input
                      type="text"
                      placeholder="Scan or type chassis number"
                      value={chassisSearch}
                      onChange={(e) => setChassisSearch(e.target.value)}
                      className="form-input font-mono"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleChassisLookup}
                    >
                      Verify
                    </button>
                  </div>
                  {chassisError && <div className="text-rose text-xs mt-1">{chassisError}</div>}
                </div>

                {selectedBike && (
                  <div className="selected-bike-badge glass-panel mt-3">
                    <div className="badge-header">
                      <Bike size={18} className="text-cyan" />
                      <strong>{selectedBike.modelName} ({selectedBike.modelYear})</strong>
                      <span className="badge-cyan glass-badge">{selectedBike.type}</span>
                    </div>
                    <div className="badge-specs-grid">
                      <div><span>Chassis:</span> <strong className="font-mono">{selectedBike.chassisNumber}</strong></div>
                      <div><span>Engine:</span> <strong className="font-mono">{selectedBike.engineNumber}</strong></div>
                      <div><span>Color:</span> <strong>{selectedBike.color}</strong></div>
                      <div><span>Retail price:</span> <strong className="text-emerald">{formatPKR(selectedBike.retailPrice)}</strong></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Buyer information */}
              <div className="page-form-card">
                <div className="page-form-card-title">Buyer</div>

                <div className="form-group-row">
                  <div className="form-field">
                    <label>Sale channel</label>
                    <select
                      value={saleForm.saleType}
                      onChange={(e) => setSaleForm({ ...saleForm, saleType: e.target.value })}
                      className="form-input"
                    >
                      <option value="B2C">Retail</option>
                      <option value="B2B">Wholesale</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Customer type</label>
                    <select
                      value={saleForm.customerType}
                      onChange={(e) => setSaleForm({ ...saleForm, customerType: e.target.value })}
                      className="form-input"
                    >
                      <option value="RETAIL">Individual</option>
                      <option value="DEALER">Sub-dealer</option>
                      <option value="WORKSHOP">Fleet or workshop</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label>Customer or business name</label>
                  <input
                    type="text"
                    placeholder="Full legal name or business name"
                    value={saleForm.customerName}
                    onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group-row">
                  <div className="form-field">
                    <label>Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. 0300-1234567"
                      value={saleForm.customerPhone}
                      onChange={(e) => setSaleForm({ ...saleForm, customerPhone: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-field">
                    <label>CNIC</label>
                    <input
                      type="text"
                      placeholder="XXXXX-XXXXXXX-X"
                      value={saleForm.customerCnic}
                      onChange={(e) => setSaleForm({ ...saleForm, customerCnic: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Address</label>
                  <input
                    type="text"
                    placeholder="Street address, city"
                    value={saleForm.customerAddress}
                    onChange={(e) => setSaleForm({ ...saleForm, customerAddress: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="page-form-grid-2">
              {/* Pricing */}
              <div className="page-form-card">
                <div className="page-form-card-title">Price</div>

                <div className="pricing-box glass-panel mb-3">
                  <div className="form-field">
                    <label>Selling price (PKR)</label>
                    <input
                      type="number"
                      value={saleForm.salePrice}
                      onChange={(e) => setSaleForm({ ...saleForm, salePrice: e.target.value })}
                      required
                      className="form-input text-lg font-bold"
                    />
                  </div>

                  <div className="form-group-row">
                    <div className="form-field">
                      <label>Discount (PKR)</label>
                      <input
                        type="number"
                        value={saleForm.discount}
                        onChange={(e) => setSaleForm({ ...saleForm, discount: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-field">
                      <label>Tax and registration fee (PKR)</label>
                      <input
                        type="number"
                        value={saleForm.tax}
                        onChange={(e) => setSaleForm({ ...saleForm, tax: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="final-calc-row">
                    <span>Total due</span>
                    <strong className="text-cyan text-xl font-bold font-mono">{formatPKR(finalAmount)}</strong>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="page-form-card">
                <div className="page-form-card-title">Payment</div>

                <div className="form-field">
                  <label>Payment method</label>
                  <select
                    value={saleForm.paymentType}
                    onChange={(e) => {
                      const mode = e.target.value;
                      setSaleForm(prev => ({
                        ...prev,
                        paymentType: mode,
                        initialDeposit: mode === 'CASH' ? prev.salePrice : Math.round(prev.salePrice * 0.3)
                      }));
                    }}
                    className="form-input"
                  >
                    <option value="CASH">Cash, paid in full</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CREDIT_INSTALLMENT">Installments</option>
                  </select>
                </div>

                <div className="form-group-row">
                  <div className="form-field">
                    <label>Deposit received (PKR)</label>
                    <input
                      type="number"
                      value={saleForm.initialDeposit}
                      onChange={(e) => setSaleForm({ ...saleForm, initialDeposit: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-field">
                    <label>Balance remaining</label>
                    <div className="read-only-field font-bold text-rose">
                      {formatPKR(remainingDue)}
                    </div>
                  </div>
                </div>

                {saleForm.paymentType === 'CREDIT_INSTALLMENT' && (
                  <div className="installment-settings-box glass-panel mt-3">
                    <div className="installment-box-header">
                      <Calendar size={16} />
                      <span>Installment schedule</span>
                    </div>

                    <div className="form-group-row">
                      <div className="form-field">
                        <label>Term</label>
                        <select
                          value={saleForm.installmentsCount}
                          onChange={(e) => setSaleForm({ ...saleForm, installmentsCount: Number(e.target.value) })}
                          className="form-input"
                        >
                          <option value={3}>3 months</option>
                          <option value={6}>6 months</option>
                          <option value={12}>12 months</option>
                          <option value={18}>18 months</option>
                          <option value={24}>24 months</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label>First due date</label>
                        <input
                          type="date"
                          value={saleForm.firstInstallmentDueDate}
                          onChange={(e) => setSaleForm({ ...saleForm, firstInstallmentDueDate: e.target.value })}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="installment-calc-preview">
                      <span>Estimated monthly installment</span>
                      <strong className="text-amber font-mono font-bold">
                        {formatPKR(Math.ceil(remainingDue / (saleForm.installmentsCount || 1)))} / mo
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="page-form-footer">
              <button type="button" className="btn btn-secondary" onClick={closeNewSaleModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Receipt size={16} /> Complete sale
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (subView === 'record-payment' && activeSaleForPayment) {
    return (
      <div className="sales-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={closePaymentModal}>
              <ArrowLeft size={16} /> Back to sales
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">Record payment</h2>
              <div className="page-form-subtitle">Cash, bank transfer or cheque against invoice {activeSaleForPayment.invoiceNumber}</div>
            </div>
          </div>

          <form onSubmit={handleRecordPayment} className="page-form-container narrow">
            <div className="page-form-card">
              <div className="page-form-card-title">Payment details</div>

              <div className="payment-target-info mb-2">
                <div><strong>Customer:</strong> {activeSaleForPayment.customerName} ({activeSaleForPayment.customerPhone})</div>
                <div><strong>Invoice:</strong> <span className="font-mono text-cyan">{activeSaleForPayment.invoiceNumber}</span></div>
                <div><strong>Balance:</strong> <span className="text-rose font-bold">{formatPKR(activeSaleForPayment.remainingBalance)}</span></div>
              </div>

              {activeSaleForPayment.installments && activeSaleForPayment.installments.length > 0 && (
                <div className="form-field">
                  <label>Apply to installment</label>
                  <select
                    value={paymentFormData.installmentId}
                    onChange={(e) => {
                      const inst = activeSaleForPayment.installments.find(i => i.id === e.target.value);
                      setPaymentFormData({
                        ...paymentFormData,
                        installmentId: e.target.value,
                        amount: inst ? (inst.amount - inst.paidAmount) : activeSaleForPayment.remainingBalance
                      });
                    }}
                    className="form-input"
                  >
                    <option value="">Oldest due installment</option>
                    {activeSaleForPayment.installments
                      .filter(i => i.status !== 'PAID')
                      .map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          Installment {inst.installmentNumber} — due {new Date(inst.dueDate).toLocaleDateString()} ({inst.amount - inst.paidAmount})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="form-group-row">
                <div className="form-field">
                  <label>Amount received (PKR)</label>
                  <input
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label>Method</label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                    className="form-input"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Reference or cheque number</label>
                <input
                  type="text"
                  placeholder="e.g. TR-982103 or cheque #44921"
                  value={paymentFormData.referenceNumber}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, referenceNumber: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Collected at the counter"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="page-form-footer">
                <button type="button" className="btn btn-secondary" onClick={closePaymentModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CreditCard size={16} /> Record payment
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-view">
      {/* Control Bar */}
      <div className="control-bar glass-panel no-print">
        <div className="filter-group">
          <select
            className="filter-select"
            value={saleTypeFilter}
            onChange={(e) => setSaleTypeFilter(e.target.value)}
          >
            <option value="">All channels</option>
            <option value="B2C">Retail</option>
            <option value="B2B">Wholesale</option>
          </select>

          <select
            className="filter-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">All payment methods</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CREDIT_INSTALLMENT">Installments</option>
          </select>
        </div>

        <div className="action-group">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search invoice, customer or chassis"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {hasPermission('EXPORT_EXCEL') && (
            <button
              className="btn btn-outline"
              onClick={() => api.downloadExcel('sales', { saleType: saleTypeFilter, paymentMode: paymentFilter })}
            >
              <FileSpreadsheet size={16} /> Export
            </button>
          )}

          {hasPermission('CREATE_SALE') && (
            <button className="btn btn-primary" onClick={openNewSaleModal}>
              <Plus size={16} /> New sale
            </button>
          )}
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="card glass-panel no-print">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Motorcycle</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Balance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="loading-cell">
                    <div className="spinner"></div> Loading sales
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <div className="font-mono text-cyan font-bold">{sale.invoiceNumber}</div>
                      <div className="text-muted text-xs mt-1">
                        {new Date(sale.saleDate).toLocaleDateString('en-GB')}
                      </div>
                    </td>
                    <td>
                      <div className="customer-info-cell">
                        <span className="font-bold text-main">{sale.customerName}</span>
                        <span className="text-muted text-xs font-mono">{sale.customerPhone}</span>
                        <div>
                          <span className={`glass-badge ${sale.saleType === 'B2B' ? 'badge-purple' : 'badge-cyan'} text-xs`}>
                            {sale.saleType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="bike-info-cell">
                        <span className="font-bold text-main">{sale.bike?.modelName}</span>
                        <span className="font-mono text-cyan text-xs">
                          {sale.bike?.chassisNumber}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-main">{formatPKR(sale.finalAmount)}</div>
                      {sale.discount > 0 && (
                        <span className="text-rose text-xs font-mono">-{formatPKR(sale.discount)} discount</span>
                      )}
                    </td>
                    <td>
                      <span className={`glass-badge ${sale.paymentType === 'CASH' ? 'badge-emerald' :
                          sale.paymentType === 'CREDIT_INSTALLMENT' ? 'badge-amber' : 'badge-cyan'
                        }`}>
                        {sale.paymentType.replace('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td>
                      {sale.remainingBalance > 0 ? (
                        <div className="credit-cell">
                          <span className="font-bold text-rose">{formatPKR(sale.remainingBalance)}</span>
                          <span className="text-muted text-xs">In installments</span>
                        </div>
                      ) : (
                        <span className="glass-badge badge-emerald">Paid in full</span>
                      )}
                    </td>
                    <td>
                      <span className={`glass-badge ${sale.status === 'COMPLETED' ? 'badge-emerald' : 'badge-amber'}`}>
                        {sale.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="table-actions">
                        <button
                          className="btn-action-icon"
                          onClick={() => setSelectedInvoice(sale)}
                          title="View invoice"
                        >
                          <Printer size={15} />
                        </button>
                        {sale.remainingBalance > 0 && hasPermission('CREATE_SALE') && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => openPaymentModal(sale)}
                            title="Record payment"
                          >
                            <DollarSign size={13} /> Collect
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-placeholder">No sales match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice & Printable Receipt Modal */}
      {selectedInvoice && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel modal-lg invoice-modal-content">
            <div className="modal-header no-print">
              <h3>Invoice</h3>
              <div className="header-actions">
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <Printer size={16} /> Print
                </button>
                <button className="close-btn" onClick={() => setSelectedInvoice(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="printable-document invoice-sheet">
              <div className="invoice-header">
                <div className="dealership-info">
                  <h2>AutoSuite Motorcycles</h2>
                  <p>Authorized sales, service and spare parts dealership — Atlas Honda</p>
                  <p className="text-xs">Main Showroom Boulevard, Lahore · 042-35990000 · NTN 4829103-8</p>
                </div>
                <div className="invoice-badge">
                  <div className="inv-title">Sales invoice</div>
                  <div className="inv-num font-mono">{selectedInvoice.invoiceNumber}</div>
                  <div className="inv-date">{new Date(selectedInvoice.saleDate).toLocaleDateString('en-GB')}</div>
                </div>
              </div>

              <hr className="doc-divider" />

              <div className="invoice-grid-2">
                <div className="info-block">
                  <div className="info-block-title">Buyer</div>
                  <div><strong>Name:</strong> {selectedInvoice.customerName}</div>
                  <div><strong>Phone:</strong> {selectedInvoice.customerPhone}</div>
                  {selectedInvoice.customerCnic && <div><strong>CNIC:</strong> {selectedInvoice.customerCnic}</div>}
                  {selectedInvoice.customerAddress && <div><strong>Address:</strong> {selectedInvoice.customerAddress}</div>}
                  <div><strong>Channel:</strong> {selectedInvoice.customerType}</div>
                </div>

                <div className="info-block">
                  <div className="info-block-title">Vehicle</div>
                  <div><strong>Model:</strong> {selectedInvoice.bike?.modelName}</div>
                  <div><strong>Color:</strong> {selectedInvoice.bike?.color} ({selectedInvoice.bike?.modelYear})</div>
                  <div><strong>Chassis No:</strong> <span className="font-mono font-bold">{selectedInvoice.bike?.chassisNumber}</span></div>
                  <div><strong>Engine No:</strong> <span className="font-mono">{selectedInvoice.bike?.engineNumber}</span></div>
                </div>
              </div>

              <div className="doc-table-wrap mt-4">
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Chassis number</th>
                      <th className="text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{selectedInvoice.bike?.modelName} ({selectedInvoice.bike?.color})</td>
                      <td>{selectedInvoice.bike?.type}</td>
                      <td className="font-mono">{selectedInvoice.bike?.chassisNumber}</td>
                      <td className="text-right font-bold">{formatPKR(selectedInvoice.salePrice)}</td>
                    </tr>
                    {selectedInvoice.discount > 0 && (
                      <tr>
                        <td colSpan="3" className="text-right">Discount:</td>
                        <td className="text-right text-rose font-bold">-{formatPKR(selectedInvoice.discount)}</td>
                      </tr>
                    )}
                    <tr className="total-row">
                      <td colSpan="3" className="text-right font-bold">Total:</td>
                      <td className="text-right font-bold text-cyan">{formatPKR(selectedInvoice.finalAmount)}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-right">Paid ({selectedInvoice.paymentType.replace('_', ' ').toLowerCase()}):</td>
                      <td className="text-right text-emerald font-bold">{formatPKR(selectedInvoice.initialDeposit)}</td>
                    </tr>
                    <tr className="balance-row">
                      <td colSpan="3" className="text-right font-bold">Balance:</td>
                      <td className="text-right font-bold text-rose">{formatPKR(selectedInvoice.remainingBalance)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Installments Table if credit */}
              {selectedInvoice.installments && selectedInvoice.installments.length > 0 && (
                <div className="installments-doc-section mt-4">
                  <div className="info-block-title">Installment schedule</div>
                  <table className="doc-table">
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
                      {selectedInvoice.installments.map((inst) => (
                        <tr key={inst.id}>
                          <td>{inst.installmentNumber}</td>
                          <td>{new Date(inst.dueDate).toLocaleDateString('en-GB')}</td>
                          <td>{formatPKR(inst.amount)}</td>
                          <td>{formatPKR(inst.paidAmount)}</td>
                          <td className="font-bold">
                            {inst.status === 'PAID' ? 'Paid' : 'Pending'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="invoice-signatures mt-6">
                <div className="sig-block">
                  <div className="sig-line"></div>
                  <div>Customer signature</div>
                </div>
                <div className="seal-round">
                  <span>AutoSuite</span>
                  <span>Official seal</span>
                  <span>Lahore</span>
                </div>
                <div className="sig-block">
                  <div className="sig-line"></div>
                  <div>Authorized dealership officer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}