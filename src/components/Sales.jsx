import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Printer,
  CreditCard,
  Calendar,
  FileSpreadsheet,
  DollarSign,
  Bike,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  UserCheck,
  Calculator,
  User,
  Phone,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from './Pagination';
import FinancingCalculatorModal from './FinancingCalculatorModal';

const getDefaultSaleForm = () => ({
  customerId: null,
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
});

export default function Sales({ isOpenNewSaleModal, onCloseNewSaleModal }) {
  const { hasPermission } = useAuth();
  const { isRomanUrdu } = useLanguage();
  const toast = useToast();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saleTypeFilter, setSaleTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Sub-views
  const [subView, setSubView] = useState(null); // 'new-sale' | 'record-payment' | null
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeSaleForPayment, setActiveSaleForPayment] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(null);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleOpenInvoice = async (sale) => {
    setSelectedInvoice(sale);
    try {
      const fullSale = await api.getSale(sale.id);
      if (fullSale) {
        setSelectedInvoice(fullSale);
      }
    } catch (err) {
      console.error('Failed to load full invoice details:', err);
    }
  };

  // Available in-stock bikes for Chassis selection
  const [availableBikes, setAvailableBikes] = useState([]);
  const [selectedBike, setSelectedBike] = useState(null);
  const [chassisSearch, setChassisSearch] = useState('');
  const [chassisError, setChassisError] = useState('');

  // Task 10: Customer Autocomplete & Autofill
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // New Sale Form
  const [saleForm, setSaleForm] = useState(getDefaultSaleForm);
  const [saleFormError, setSaleFormError] = useState('');

  // Payment Recording Form
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    referenceNumber: '',
    installmentId: '',
    notes: ''
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const openNewSaleModal = () => {
    fetchAvailableBikes();
    setSelectedBike(null);
    setChassisSearch('');
    setChassisError('');
    setSaleForm(getDefaultSaleForm());
    setSelectedExistingCustomer(null);
    setCustomerSuggestions([]);
    setSaleFormError('');
    setSubView('new-sale');
  };

  const closeNewSaleModal = () => {
    setSubView(null);
    if (onCloseNewSaleModal) onCloseNewSaleModal();
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit
      };
      if (saleTypeFilter) params.saleType = saleTypeFilter;
      if (paymentFilter) params.paymentType = paymentFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.getSales(params);
      if (res.pagination) {
        setSales(res.data || res.sales || []);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      } else {
        const list = Array.isArray(res) ? res : [];
        setSales(list);
        setTotalCount(list.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
      toast.error('Failed to retrieve sales records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBikes = async () => {
    try {
      const data = await api.getBikes({ status: 'IN_STOCK' });
      const bikesList = Array.isArray(data) ? data : data?.bikes || data?.data || [];
      setAvailableBikes(bikesList);
    } catch (err) {
      console.error('Error fetching in-stock bikes:', err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [saleTypeFilter, paymentFilter, searchQuery, page, limit]);

  useEffect(() => {
    if (isOpenNewSaleModal) {
      openNewSaleModal();
    }
  }, [isOpenNewSaleModal]);

  // Task 10: Fast Customer Lookup & Autofill
  const handleCustomerLookup = async (queryText) => {
    if (!queryText || queryText.trim().length < 2) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const matches = await api.customerLookup(queryText.trim());
      setCustomerSuggestions(matches || []);
      setShowSuggestions((matches && matches.length > 0) || false);
    } catch (err) {
      console.error('Lookup failed', err);
    }
  };

  const selectCustomer = (cust) => {
    setSaleForm((prev) => ({
      ...prev,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerCnic: cust.cnic || '',
      customerAddress: cust.address || '',
      customerType: cust.customerType || 'RETAIL'
    }));
    setSelectedExistingCustomer(cust);
    setShowSuggestions(false);
    toast.info(
      isRomanUrdu
        ? `Kharidar ${cust.name} ka record mil gaya! Details auto-fill ho gayi hain.`
        : `Customer ${cust.name} found! Profile auto-filled.`
    );
  };

  const clearSelectedCustomer = () => {
    setSelectedExistingCustomer(null);
    setSaleForm((prev) => ({
      ...prev,
      customerId: null,
      customerName: '',
      customerPhone: '',
      customerCnic: '',
      customerAddress: '',
      customerType: 'RETAIL'
    }));
  };

  const handleChassisSelect = (bikeId) => {
    const bike = availableBikes.find((b) => b.id === bikeId);
    if (bike) {
      setSelectedBike(bike);
      setSaleForm((prev) => ({
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
      setSaleForm((prev) => ({
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
        customerId: selectedExistingCustomer?.id || saleForm.customerId || null,
        bikeId: selectedBike.id,
        salePrice: Number(saleForm.salePrice),
        discount: Number(saleForm.discount) || 0,
        tax: Number(saleForm.tax) || 0,
        initialDeposit: Number(saleForm.initialDeposit) || 0,
        installmentsCount: Number(saleForm.installmentsCount) || 0
      };

      const newSale = await api.createSale(payload);
      toast.success(
        isRomanUrdu
          ? `Invoice ${newSale.invoiceNumber} kamyabi se issue ho gayi!`
          : `Invoice ${newSale.invoiceNumber} issued successfully!`
      );
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
    const numAmount = Number(paymentFormData.amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid payment amount greater than zero');
      return;
    }
    if (numAmount > activeSaleForPayment.remainingBalance) {
      toast.error(
        `Payment amount cannot exceed remaining balance of PKR ${activeSaleForPayment.remainingBalance.toLocaleString('en-PK')}`
      );
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const payload = {
        amount: numAmount,
        paymentMethod: paymentFormData.paymentMethod || 'CASH',
        referenceNumber: paymentFormData.referenceNumber?.trim() || null,
        installmentId: paymentFormData.installmentId || null,
        notes: paymentFormData.notes?.trim() || null
      };

      const updated = await api.recordPayment(activeSaleForPayment.id, payload);
      toast.success(
        isRomanUrdu
          ? `PKR ${numAmount.toLocaleString('en-PK')} ki adaigi mehfooz ho gayi`
          : `Payment of PKR ${numAmount.toLocaleString('en-PK')} recorded successfully`
      );
      closePaymentModal();
      fetchSales();
      try {
        const fresh = await api.getSale(activeSaleForPayment.id);
        setSelectedInvoice(fresh || updated);
      } catch {
        setSelectedInvoice(updated);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
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
              <h2 className="page-form-title">{isRomanUrdu ? 'Nayi Sale Darj Karein' : 'New sale'}</h2>
              <div className="page-form-subtitle">
                Select the motorcycle, enter buyer's details, or auto-fetch existing customer records
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateSale} className="page-form-container">
            {saleFormError && <div className="page-form-error">{saleFormError}</div>}

            <div className="page-form-grid-2">
              {/* Step 1: Chassis Selection */}
              <div className="page-form-card">
                <div className="page-form-card-title">Motorcycle Selection</div>

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
                        {b.modelName} — Chassis: {b.chassisNumber} — {b.color} (PKR {b.retailPrice.toLocaleString()})
                      </option>
                    ))}
                  </select>

                  <div className="or-divider"><span>or search by chassis number</span></div>

                  <div className="chassis-search-row">
                    <input
                      type="text"
                      placeholder="e.g. CD70-2026-94812"
                      value={chassisSearch}
                      onChange={(e) => setChassisSearch(e.target.value)}
                      className="form-input font-mono"
                    />
                    <button type="button" className="btn btn-secondary" onClick={handleChassisLookup}>
                      Search
                    </button>
                  </div>

                  {chassisError && <div className="error-text text-xs text-rose mt-1">{chassisError}</div>}

                  {selectedBike && (
                    <div className="selected-bike-preview glass-panel mt-3 p-3 rounded-md border border-line-soft">
                      <div className="flex items-center gap-2 text-cyan font-bold">
                        <Bike size={18} />
                        {selectedBike.modelName} ({selectedBike.modelYear})
                      </div>
                      <div className="text-xs text-muted mt-1 font-mono">
                        Chassis: {selectedBike.chassisNumber} | Engine: {selectedBike.engineNumber} | Color: {selectedBike.color}
                      </div>
                      <div className="mt-2 text-sm font-bold text-emerald">
                        Standard Price: {formatPKR(selectedBike.retailPrice)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Buyer Details (Task 10: Auto-fill) */}
              <div className="page-form-card relative">
                <div className="page-form-card-title flex items-center justify-between">
                  <span>Buyer Information</span>
                  {selectedExistingCustomer ? (
                    <span className="glass-badge badge-emerald text-xs flex items-center gap-1">
                      <UserCheck size={12} /> Existing Profile Loaded
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Auto-searches previous records</span>
                  )}
                </div>

                {selectedExistingCustomer && (
                  <div className="existing-customer-alert p-2 mb-3 bg-ok-soft rounded border border-ok-line flex items-center justify-between">
                    <div className="text-xs text-ink-1">
                      <strong>Customer Found:</strong> {selectedExistingCustomer.name} · {selectedExistingCustomer.totalPurchases} prior purchases · Balance: {formatPKR(selectedExistingCustomer.remainingBalance)}
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={clearSelectedCustomer}
                    >
                      Clear / New
                    </button>
                  </div>
                )}

                <div className="form-group-row mb-3">
                  <div className="form-field relative">
                    <label>{isRomanUrdu ? 'Rabta Phone Number' : 'Phone Number'}</label>
                    <input
                      type="text"
                      placeholder="e.g. 0300-1234567"
                      value={saleForm.customerPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSaleForm({ ...saleForm, customerPhone: val });
                        handleCustomerLookup(val);
                      }}
                      required
                      className="form-input font-mono"
                    />

                    {/* Autocomplete dropdown */}
                    {showSuggestions && customerSuggestions.length > 0 && (
                      <div className="customer-autocomplete-dropdown glass-panel">
                        <div className="text-xs text-muted px-3 py-1 bg-surface-2 border-b border-line-soft">
                          Matching Previous Buyers (Click to auto-fill)
                        </div>
                        {customerSuggestions.map((cust, idx) => (
                          <div
                            key={idx}
                            className="autocomplete-item p-2 hover:bg-surface-3 cursor-pointer border-b border-line-soft"
                            onClick={() => selectCustomer(cust)}
                          >
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span>{cust.name}</span>
                              <span className="font-mono text-cyan">{cust.phone}</span>
                            </div>
                            <div className="text-xs text-muted mt-1 flex justify-between">
                              <span>CNIC: {cust.cnic || '-'}</span>
                              <span>Purchases: {cust.totalPurchases}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-field relative">
                    <label>{isRomanUrdu ? 'Kharidar Ka Naam' : 'Customer Name'}</label>
                    <input
                      type="text"
                      placeholder="Full legal name"
                      value={saleForm.customerName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSaleForm({ ...saleForm, customerName: val });
                        handleCustomerLookup(val);
                      }}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group-row mb-3">
                  <div className="form-field">
                    <label>{isRomanUrdu ? 'Shanakhti Card (CNIC)' : 'CNIC / National ID'}</label>
                    <input
                      type="text"
                      placeholder="XXXXX-XXXXXXX-X"
                      value={saleForm.customerCnic}
                      onChange={(e) => setSaleForm({ ...saleForm, customerCnic: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>

                  <div className="form-field">
                    <label>Customer Category</label>
                    <select
                      value={saleForm.customerType}
                      onChange={(e) => setSaleForm({ ...saleForm, customerType: e.target.value })}
                      className="form-input"
                    >
                      <option value="RETAIL">Retail Individual</option>
                      <option value="DEALER">Sub-dealer (B2B)</option>
                      <option value="WORKSHOP">Fleet or Workshop</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label>Residential / Business Address</label>
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

            {/* Pricing & Financing */}
            <div className="page-form-grid-2 mt-4">
              <div className="page-form-card">
                <div className="page-form-card-title">Commercial Terms</div>
                <div className="pricing-box glass-panel p-3 rounded-md">
                  <div className="form-field mb-3">
                    <label>Selling Price (PKR)</label>
                    <input
                      type="number"
                      value={saleForm.salePrice}
                      onChange={(e) => setSaleForm({ ...saleForm, salePrice: e.target.value })}
                      required
                      className="form-input text-lg font-bold font-mono"
                    />
                  </div>

                  <div className="form-group-row mb-3">
                    <div className="form-field">
                      <label>Discount (PKR)</label>
                      <input
                        type="number"
                        value={saleForm.discount}
                        onChange={(e) => setSaleForm({ ...saleForm, discount: e.target.value })}
                        className="form-input font-mono"
                      />
                    </div>
                    <div className="form-field">
                      <label>Tax & Reg Fee (PKR)</label>
                      <input
                        type="number"
                        value={saleForm.tax}
                        onChange={(e) => setSaleForm({ ...saleForm, tax: e.target.value })}
                        className="form-input font-mono"
                      />
                    </div>
                  </div>

                  <div className="final-calc-row p-3 bg-surface-2 rounded-md flex items-center justify-between">
                    <span className="font-semibold">Total Amount Due</span>
                    <strong className="text-cyan text-xl font-mono">{formatPKR(finalAmount)}</strong>
                  </div>
                  {deposit > 0 && (
                    <div className="text-xs text-muted mt-2 px-1 flex justify-between">
                      <span>{isRomanUrdu ? 'Baqaya Wajib-ul-Ada:' : 'Remaining Balance Due:'}</span>
                      <span className="font-mono font-semibold text-ink-1">{formatPKR(remainingDue)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="page-form-card">
                <div className="page-form-card-title flex items-center justify-between">
                  <span>Payment Plan</span>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs flex items-center gap-1"
                    onClick={() => setIsCalcOpen(true)}
                  >
                    <Calculator size={13} /> Financing Calculator
                  </button>
                </div>

                <div className="form-field mb-3">
                  <label>Payment Method</label>
                  <select
                    value={saleForm.paymentType}
                    onChange={(e) => {
                      const mode = e.target.value;
                      setSaleForm((prev) => ({
                        ...prev,
                        paymentType: mode,
                        initialDeposit: mode === 'CASH' ? prev.salePrice : Math.round(Number(prev.salePrice || 0) * 0.3)
                      }));
                    }}
                    className="form-input"
                  >
                    <option value="CASH">Cash (Paid in Full)</option>
                    <option value="BANK_TRANSFER">Bank Transfer / Pay Order</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="CREDIT_INSTALLMENT">Installments (Financed)</option>
                  </select>
                </div>

                <div className="form-group-row mb-3">
                  <div className="form-field">
                    <label>Initial Deposit (PKR)</label>
                    <input
                      type="number"
                      value={saleForm.initialDeposit}
                      onChange={(e) => setSaleForm({ ...saleForm, initialDeposit: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                  <div className="form-field">
                    <label>Payment Reference</label>
                    <input
                      type="text"
                      placeholder="Receipt/Slip #"
                      value={saleForm.paymentReference}
                      onChange={(e) => setSaleForm({ ...saleForm, paymentReference: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                </div>

                {saleForm.paymentType === 'CREDIT_INSTALLMENT' && (
                  <div className="installments-config-box p-3 bg-surface-2 rounded-md border border-line-soft">
                    <div className="form-group-row">
                      <div className="form-field">
                        <label>Tenure (Months)</label>
                        <input
                          type="number"
                          value={saleForm.installmentsCount}
                          onChange={(e) => setSaleForm({ ...saleForm, installmentsCount: e.target.value })}
                          min="1"
                          max="36"
                          className="form-input font-mono"
                        />
                      </div>
                      <div className="form-field">
                        <label>First Due Date</label>
                        <input
                          type="date"
                          value={saleForm.firstInstallmentDueDate}
                          onChange={(e) => setSaleForm({ ...saleForm, firstInstallmentDueDate: e.target.value })}
                          className="form-input font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="page-form-footer mt-4 flex items-center justify-end gap-3">
              <button type="button" className="btn btn-secondary" onClick={closeNewSaleModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Receipt size={16} /> Complete & Issue Invoice
              </button>
            </div>
          </form>

          {/* Financing Calculator Modal rendered directly inside New Sale Form */}
          <FinancingCalculatorModal
            isOpen={isCalcOpen}
            onClose={() => setIsCalcOpen(false)}
            initialPrice={Number(saleForm.salePrice) || (selectedBike?.retailPrice || 185000)}
            onApplyPlan={(plan) => {
              setSaleForm((prev) => ({
                ...prev,
                paymentType: 'CREDIT_INSTALLMENT',
                salePrice: plan.bikePrice,
                initialDeposit: plan.downPayment,
                installmentsCount: plan.tenureMonths
              }));
              setIsCalcOpen(false);
            }}
          />
        </div>
      </div>
    );
  }

  // Full-Page Collect Payment Form (standardized normal form like "Add motorcycle")
  if (subView === 'record-payment' && activeSaleForPayment) {
    return (
      <div className="sales-view payment-collection-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={closePaymentModal}>
              <ArrowLeft size={16} /> Back to sales
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">
                {isRomanUrdu ? 'Rakam Wasool Karein' : 'Collect Payment'}
              </h2>
              <div className="page-form-subtitle">
                {isRomanUrdu
                  ? `Invoice #${activeSaleForPayment.invoiceNumber} ki wasooli darj karein`
                  : `Record payment collection for Invoice #${activeSaleForPayment.invoiceNumber}`}
              </div>
            </div>
          </div>

          <form onSubmit={handleRecordPayment} className="page-form-container">
            <div className="page-form-grid-2">
              {/* Card 1: Sale & Customer Snapshot */}
              <div className="page-form-card">
                <div className="page-form-card-title">Invoice & Customer Overview</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm py-1.5 border-b border-line-soft">
                    <span className="text-muted">Customer</span>
                    <strong className="text-main font-semibold">
                      {activeSaleForPayment.customerName}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1.5 border-b border-line-soft">
                    <span className="text-muted">Contact Phone</span>
                    <span className="font-mono text-cyan font-semibold">
                      {activeSaleForPayment.customerPhone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1.5 border-b border-line-soft">
                    <span className="text-muted">Motorcycle Model</span>
                    <span className="font-semibold text-main">
                      {activeSaleForPayment.bike?.modelName} ({activeSaleForPayment.bike?.color})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1.5 border-b border-line-soft">
                    <span className="text-muted">Chassis Number</span>
                    <span className="font-mono text-xs text-muted">
                      {activeSaleForPayment.bike?.chassisNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 text-center">
                    <div className="p-2.5 bg-surface-2 rounded-lg border border-line-soft">
                      <span className="text-xs text-muted block mb-1">Invoice Total</span>
                      <strong className="text-xs font-mono">{formatPKR(activeSaleForPayment.finalAmount)}</strong>
                    </div>
                    <div className="p-2.5 bg-surface-2 rounded-lg border border-line-soft">
                      <span className="text-xs text-muted block mb-1">Paid So Far</span>
                      <strong className="text-xs font-mono text-emerald">
                        {formatPKR(activeSaleForPayment.finalAmount - activeSaleForPayment.remainingBalance)}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-surface-2 rounded-lg border border-line-soft">
                      <span className="text-xs text-muted block mb-1">Balance Due</span>
                      <strong className="text-sm font-mono text-rose font-bold">
                        {formatPKR(activeSaleForPayment.remainingBalance)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Payment Entry Details */}
              <div className="page-form-card">
                <div className="page-form-card-title">Payment Collection Details</div>

                {/* Installment Link (if applicable) */}
                {activeSaleForPayment.installments && activeSaleForPayment.installments.length > 0 && (
                  <div className="form-field mb-3">
                    <label>{isRomanUrdu ? 'Kis Qist Ke Mad Mein?' : 'Apply to Installment Schedule'}</label>
                    <select
                      className="form-input"
                      value={paymentFormData.installmentId || ''}
                      onChange={(e) => {
                        const instId = e.target.value;
                        const inst = activeSaleForPayment.installments.find((i) => i.id === instId);
                        setPaymentFormData((prev) => ({
                          ...prev,
                          installmentId: instId,
                          amount: inst
                            ? Math.min(activeSaleForPayment.remainingBalance, Math.max(0, inst.amount - inst.paidAmount))
                            : prev.amount
                        }));
                      }}
                    >
                      <option value="">General Balance / Non-scheduled Payment</option>
                      {activeSaleForPayment.installments.map((inst) => {
                        const remaining = Math.max(0, inst.amount - inst.paidAmount);
                        return (
                          <option key={inst.id} value={inst.id}>
                            Installment #{inst.installmentNumber} — Due: {new Date(inst.dueDate).toLocaleDateString('en-GB')} — {formatPKR(inst.amount)} (Remaining: {formatPKR(remaining)}) [{inst.status}]
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Amount to collect */}
                <div className="form-field mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label>{isRomanUrdu ? 'Wasool Shuda Rakam (PKR) *' : 'Amount to Collect (PKR) *'}</label>
                    <button
                      type="button"
                      className="text-xs text-cyan hover:underline cursor-pointer bg-transparent border-0 p-0 font-medium"
                      onClick={() =>
                        setPaymentFormData((prev) => ({
                          ...prev,
                          amount: activeSaleForPayment.remainingBalance
                        }))
                      }
                    >
                      Pay Full Due ({formatPKR(activeSaleForPayment.remainingBalance)})
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={activeSaleForPayment.remainingBalance}
                    step="1"
                    required
                    className="form-input text-lg font-mono font-bold"
                    placeholder="Enter amount in PKR"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                {/* Payment Method & Reference */}
                <div className="form-group-row mb-3">
                  <div className="form-field">
                    <label>{isRomanUrdu ? 'Tareeqa-e-Adaigi' : 'Payment Method'}</label>
                    <select
                      className="form-input"
                      value={paymentFormData.paymentMethod}
                      onChange={(e) => setPaymentFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                    >
                      <option value="CASH">Cash in Hand (Naqd)</option>
                      <option value="BANK_TRANSFER">Bank Transfer / Online / Pay Order</option>
                      <option value="CHEQUE">Bank Cheque</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>{isRomanUrdu ? 'Slip / Transaction Ref #' : 'Reference / Slip #'}</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      placeholder="e.g. Deposit slip #, Cheque #"
                      value={paymentFormData.referenceNumber}
                      onChange={(e) => setPaymentFormData((prev) => ({ ...prev, referenceNumber: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-field">
                  <label>{isRomanUrdu ? 'Tafseelat / Notes (Ikhtiari)' : 'Notes / Remarks (Optional)'}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Received at counter by cashier..."
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="page-form-footer mt-4 flex items-center justify-end gap-3">
              <button type="button" className="btn btn-secondary" onClick={closePaymentModal}>
                {isRomanUrdu ? 'Mansookh' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmittingPayment || !paymentFormData.amount || Number(paymentFormData.amount) <= 0}
              >
                <DollarSign size={16} />
                <span>
                  {isSubmittingPayment
                    ? 'Saving...'
                    : isRomanUrdu
                      ? 'Wasooli Darj Karein'
                      : 'Confirm Payment Receipt'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Detailed Full-Page Invoice View with Installments & Customer Details
  if (selectedInvoice) {
    const isCredit = selectedInvoice.paymentType === 'CREDIT_INSTALLMENT';
    const totalInst = selectedInvoice.installments?.length || 0;
    const paidInst = selectedInvoice.installments?.filter((i) => i.status === 'PAID').length || 0;
    const completionPercent = totalInst > 0 ? Math.round((paidInst / totalInst) * 100) : 100;
    const totalCollected = Math.max(0, (selectedInvoice.finalAmount || 0) - (selectedInvoice.remainingBalance || 0));

    return (
      <div className="sales-view">
        <div className="page-form-view">
          {/* Top Header & Navigation (Screen Only) */}
          <div className="page-form-header no-print">
            <button className="page-form-back-btn" onClick={() => setSelectedInvoice(null)}>
              <ArrowLeft size={16} /> Back to sales
            </button>
            <div className="page-form-title-group">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="page-form-title">Invoice #{selectedInvoice.invoiceNumber}</h2>
                <span className={`glass-badge ${selectedInvoice.status === 'COMPLETED' ? 'badge-emerald' : 'badge-amber'}`}>
                  {selectedInvoice.status}
                </span>
                <span className={`glass-badge ${isCredit ? 'badge-purple' : 'badge-cyan'}`}>
                  {isCredit ? 'Installment Plan' : 'Cash / Full Payment'}
                </span>
                <span className="glass-badge badge-outline text-xs">
                  {selectedInvoice.saleType === 'B2B' ? 'Wholesale (B2B)' : 'Retail (B2C)'}
                </span>
              </div>
              <div className="page-form-subtitle">
                Issued on {new Date(selectedInvoice.saleDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {selectedInvoice.createdBy?.name && ` • Processed by ${selectedInvoice.createdBy.name}`}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedInvoice.remainingBalance > 0 && hasPermission('CREATE_SALE') && (
                <button
                  className="btn btn-primary flex items-center gap-1.5"
                  onClick={() => openPaymentModal(selectedInvoice)}
                >
                  <DollarSign size={16} /> Collect Payment
                </button>
              )}
              <button className="btn btn-secondary flex items-center gap-1.5" onClick={() => window.print()}>
                <Printer size={16} /> Print Document
              </button>
              {hasPermission('CREATE_SALE') && (
                <button
                  className="btn btn-outline text-rose flex items-center gap-1.5"
                  onClick={() => setSaleToDelete(selectedInvoice)}
                  title="Cancel & Delete Sale"
                >
                  <Trash2 size={15} /> Cancel Sale
                </button>
              )}
            </div>
          </div>

          {/* Official Dealership Printable Invoice & Gate Pass (Print Only) */}
          <div className="printable-document invoice-sheet print-only">
            <div className="invoice-header">
              <div className="dealership-info">
                <h2>Falcon Honda Motors</h2>
                <p>Authorized Sales, Service & Spare Parts Dealership · Atlas Honda OEM</p>
                <p className="text-xs">Main Showroom Boulevard, Lahore · Phone: 042-35990000 · NTN: 4829103-8</p>
              </div>
              <div className="invoice-badge">
                <div className="inv-title">SALES INVOICE & GATE PASS</div>
                <div className="inv-num font-mono">{selectedInvoice.invoiceNumber}</div>
                <div className="inv-date">{new Date(selectedInvoice.saleDate).toLocaleDateString('en-GB')}</div>
              </div>
            </div>

            <hr className="doc-divider" />

            <div className="invoice-grid-2">
              <div className="info-block">
                <div className="info-block-title">BUYER / CUSTOMER PROFILE</div>
                <div><strong>Name:</strong> {selectedInvoice.customerName}</div>
                <div><strong>Phone:</strong> {selectedInvoice.customerPhone}</div>
                {selectedInvoice.customerCnic && <div><strong>CNIC:</strong> {selectedInvoice.customerCnic}</div>}
                {selectedInvoice.customerAddress && <div><strong>Address:</strong> {selectedInvoice.customerAddress}</div>}
                <div><strong>Customer Type:</strong> {selectedInvoice.customerType}</div>
              </div>

              <div className="info-block">
                <div className="info-block-title">MOTORCYCLE SPECIFICATION</div>
                <div><strong>Model:</strong> {selectedInvoice.bike?.modelName} ({selectedInvoice.bike?.modelYear})</div>
                <div><strong>Color:</strong> {selectedInvoice.bike?.color}</div>
                <div><strong>Chassis No:</strong> <span className="font-mono font-bold">{selectedInvoice.bike?.chassisNumber}</span></div>
                <div><strong>Engine No:</strong> <span className="font-mono font-bold">{selectedInvoice.bike?.engineNumber}</span></div>
              </div>
            </div>

            <div className="doc-table-wrap mt-4">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Chassis Number</th>
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
                      <td colSpan="3" className="text-right">Special Discount:</td>
                      <td className="text-right text-rose font-bold">-{formatPKR(selectedInvoice.discount)}</td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td colSpan="3" className="text-right font-bold">Total Invoice Amount:</td>
                    <td className="text-right font-bold text-cyan">{formatPKR(selectedInvoice.finalAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-right">Deposit Received ({(selectedInvoice.paymentType || 'CASH').replace(/_/g, ' ')}):</td>
                    <td className="text-right text-emerald font-bold">{formatPKR(selectedInvoice.initialDeposit)}</td>
                  </tr>
                  <tr className="balance-row">
                    <td colSpan="3" className="text-right font-bold">Balance Receivable:</td>
                    <td className="text-right font-bold text-rose">{formatPKR(selectedInvoice.remainingBalance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {selectedInvoice.installments && selectedInvoice.installments.length > 0 && (
              <div className="installments-doc-section mt-4">
                <div className="info-block-title">OFFICIAL INSTALLMENT PAYMENT SCHEDULE</div>
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Inst #</th>
                      <th>Due Date</th>
                      <th>Scheduled (PKR)</th>
                      <th>Paid (PKR)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.installments.map((inst) => (
                      <tr key={inst.id}>
                        <td>#{inst.installmentNumber}</td>
                        <td>{new Date(inst.dueDate).toLocaleDateString('en-GB')}</td>
                        <td>{formatPKR(inst.amount)}</td>
                        <td>{formatPKR(inst.paidAmount)}</td>
                        <td className="font-bold">{inst.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="invoice-signatures mt-6">
              <div className="sig-block">
                <div className="sig-line"></div>
                <div>Buyer Acknowledgment</div>
              </div>
              <div className="seal-round">
                <span>Falcon Honda</span>
                <span>Gate Pass Stamp</span>
                <span>Security Checked</span>
              </div>
              <div className="sig-block">
                <div className="sig-line"></div>
                <div>Showroom Manager Signature</div>
              </div>
            </div>
          </div>

          {/* Interactive Invoice Detail Workspace (Screen Only) */}
          <div className="invoice-detail-page no-print">
            {/* Financial overview */}
            <section className="invoice-overview-card">
              <div className="invoice-overview-main">
                <div className="invoice-overview-eyebrow">
                  <Receipt size={14} /> SALES INVOICE
                </div>
                <div className="invoice-overview-title-row">
                  <h1>{selectedInvoice.invoiceNumber}</h1>
                  <span className={`invoice-status-pill ${selectedInvoice.status === 'COMPLETED' ? 'is-paid' : 'is-pending'}`}>
                    <span className="status-dot" /> {selectedInvoice.status}
                  </span>
                </div>
                <div className="invoice-overview-meta">
                  <span><Calendar size={13} /> {new Date(selectedInvoice.saleDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span className="meta-separator" />
                  <span>{selectedInvoice.saleType === 'B2B' ? 'Wholesale / B2B' : 'Retail / B2C'}</span>
                  <span className="meta-separator" />
                  <span>{isCredit ? `${totalInst}-month financing` : 'Full payment'}</span>
                  {selectedInvoice.createdBy?.name && <><span className="meta-separator" /><span>Processed by {selectedInvoice.createdBy.name}</span></>}
                </div>
              </div>

              <div className="invoice-overview-amount">
                <span className="invoice-overview-label">Outstanding balance</span>
                <strong className={selectedInvoice.remainingBalance > 0 ? 'is-outstanding' : 'is-settled'}>
                  {formatPKR(selectedInvoice.remainingBalance)}
                </strong>
                <span className="invoice-overview-caption">
                  {selectedInvoice.remainingBalance > 0 ? `${completionPercent}% of scheduled payments cleared` : 'Account settled in full'}
                </span>
              </div>
            </section>

            {/* Key financial metrics */}
            <section className="invoice-metrics-grid">
              <div className="invoice-metric-card">
                <div className="invoice-metric-icon is-blue"><Receipt size={17} /></div>
                <div><span>Total invoice</span><strong>{formatPKR(selectedInvoice.finalAmount)}</strong></div>
              </div>
              <div className="invoice-metric-card">
                <div className="invoice-metric-icon is-green"><CheckCircle2 size={17} /></div>
                <div><span>Total collected</span><strong>{formatPKR(totalCollected)}</strong></div>
              </div>
              <div className="invoice-metric-card">
                <div className="invoice-metric-icon is-amber"><CreditCard size={17} /></div>
                <div><span>Initial deposit</span><strong>{formatPKR(selectedInvoice.initialDeposit)}</strong></div>
              </div>
              <div className="invoice-metric-card">
                <div className="invoice-metric-icon is-purple"><Calendar size={17} /></div>
                <div><span>Payment terms</span><strong>{isCredit ? `${totalInst} months` : 'Paid in full'}</strong></div>
              </div>
            </section>

            {/* Customer + vehicle */}
            <section className="invoice-detail-grid">
              <article className="invoice-panel">
                <div className="invoice-panel-header">
                  <div className="invoice-panel-heading">
                    <div className="invoice-panel-icon is-blue"><User size={16} /></div>
                    <div><h3>Customer</h3><p>Buyer profile and contact details</p></div>
                  </div>
                  <span className="invoice-type-tag">{selectedInvoice.customerType || 'RETAIL'}</span>
                </div>

                <div className="invoice-customer-summary">
                  <div className="invoice-avatar">
                    {(selectedInvoice.customerName || selectedInvoice.customer?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="invoice-customer-name">
                    <strong>{selectedInvoice.customerName || selectedInvoice.customer?.name || 'Customer'}</strong>
                    <span>{selectedInvoice.saleType === 'B2B' ? 'Business customer' : 'Retail customer'}</span>
                  </div>
                </div>

                <div className="invoice-info-list">
                  <button
                    type="button"
                    className="invoice-info-row invoice-copy-row"
                    onClick={() => copyToClipboard(selectedInvoice.customerPhone || selectedInvoice.customer?.phone)}
                  >
                    <span className="invoice-info-label"><Phone size={14} /> Phone</span>
                    <span className="invoice-info-value">{selectedInvoice.customerPhone || selectedInvoice.customer?.phone || 'Not provided'} <Copy size={12} /></span>
                  </button>
                  {(selectedInvoice.customerCnic || selectedInvoice.customer?.cnic) && (
                    <button
                      type="button"
                      className="invoice-info-row invoice-copy-row"
                      onClick={() => copyToClipboard(selectedInvoice.customerCnic || selectedInvoice.customer?.cnic)}
                    >
                      <span className="invoice-info-label"><ShieldCheck size={14} /> CNIC</span>
                      <span className="invoice-info-value font-mono">{selectedInvoice.customerCnic || selectedInvoice.customer?.cnic} <Copy size={12} /></span>
                    </button>
                  )}
                  <div className="invoice-info-row">
                    <span className="invoice-info-label"><MapPin size={14} /> Address</span>
                    <span className="invoice-info-value">{selectedInvoice.customerAddress || selectedInvoice.customer?.address || 'Not provided'}</span>
                  </div>
                </div>
              </article>

              <article className="invoice-panel">
                <div className="invoice-panel-header">
                  <div className="invoice-panel-heading">
                    <div className="invoice-panel-icon is-amber"><Bike size={16} /></div>
                    <div><h3>Vehicle</h3><p>Motorcycle identification details</p></div>
                  </div>
                  <span className="invoice-type-tag">{selectedInvoice.bike?.modelYear || '—'} MODEL</span>
                </div>

                <div className="invoice-vehicle-main">
                  <div className="invoice-vehicle-icon"><Bike size={22} /></div>
                  <div>
                    <strong>{selectedInvoice.bike?.modelName || 'Motorcycle'}</strong>
                    <div className="invoice-vehicle-tags">
                      <span>{selectedInvoice.bike?.brand || selectedInvoice.bike?.model?.brand || 'Atlas Honda'}</span>
                      <span>{selectedInvoice.bike?.color || '—'}</span>
                      <span>{selectedInvoice.bike?.type || 'NEW'}</span>
                    </div>
                  </div>
                </div>

                <div className="invoice-vehicle-identifiers">
                  <div className="invoice-identifier">
                    <span>CHASSIS NUMBER</span>
                    <button type="button" onClick={() => copyToClipboard(selectedInvoice.bike?.chassisNumber)} title="Copy chassis number">
                      <span>{selectedInvoice.bike?.chassisNumber || '—'}</span><Copy size={12} />
                    </button>
                  </div>
                  <div className="invoice-identifier">
                    <span>ENGINE NUMBER</span>
                    <strong>{selectedInvoice.bike?.engineNumber || '—'}</strong>
                  </div>
                </div>

                <div className="invoice-price-row">
                  <span>Vehicle price</span><strong>{formatPKR(selectedInvoice.salePrice)}</strong>
                  <span>Discount</span><strong className="is-discount">−{formatPKR(selectedInvoice.discount || 0)}</strong>
                </div>
              </article>
            </section>

            {/* Installment schedule */}
            {selectedInvoice.installments && selectedInvoice.installments.length > 0 ? (
              <section className="invoice-panel invoice-schedule-panel">
                <div className="invoice-panel-header invoice-schedule-header">
                  <div className="invoice-panel-heading">
                    <div className="invoice-panel-icon is-purple"><Calendar size={16} /></div>
                    <div><h3>Installment schedule</h3><p>Payment timeline and outstanding amounts</p></div>
                  </div>
                  <div className="invoice-schedule-progress-label">
                    <strong>{paidInst} / {totalInst}</strong><span>installments cleared</span>
                  </div>
                </div>

                <div className="invoice-progress-track">
                  <div className="invoice-progress-value" style={{ width: `${completionPercent}%` }} />
                </div>

                <div className="invoice-table-wrap">
                  <table className="invoice-detail-table">
                    <thead>
                      <tr><th>Installment</th><th>Due date</th><th>Scheduled</th><th>Paid</th><th>Outstanding</th><th>Status</th><th /></tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.installments.map((inst) => {
                        const isOverdue = inst.status !== 'PAID' && new Date(inst.dueDate) < new Date();
                        const balance = Math.max(0, Number(inst.amount || 0) - Number(inst.paidAmount || 0));
                        return (
                          <tr key={inst.id} className={isOverdue ? 'is-overdue' : ''}>
                            <td><span className="installment-number">#{inst.installmentNumber}</span></td>
                            <td>
                              <div className="invoice-date-cell">{new Date(inst.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              {isOverdue && <span className="invoice-overdue-label"><AlertCircle size={11} /> Overdue</span>}
                            </td>
                            <td className="money-cell">{formatPKR(inst.amount)}</td>
                            <td className="money-cell is-paid">{formatPKR(inst.paidAmount || 0)}</td>
                            <td className="money-cell">{balance > 0 ? <span className="is-due">{formatPKR(balance)}</span> : <span className="is-paid">PKR 0</span>}</td>
                            <td>
                              <span className={`invoice-status-chip ${inst.status === 'PAID' ? 'is-paid' : isOverdue ? 'is-overdue' : 'is-pending'}`}>
                                {inst.status === 'PAID' ? <CheckCircle2 size={12} /> : isOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
                                {inst.status === 'PAID' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                              </span>
                            </td>
                            <td className="invoice-action-cell">
                              {inst.status !== 'PAID' && hasPermission('CREATE_SALE') && (
                                <button
                                  type="button"
                                  className="invoice-table-action"
                                  onClick={() => {
                                    setActiveSaleForPayment(selectedInvoice);
                                    setPaymentFormData({ amount: balance, paymentMethod: 'CASH', referenceNumber: '', installmentId: inst.id, notes: `Payment for Installment #${inst.installmentNumber}` });
                                    setSubView('record-payment');
                                  }}
                                >
                                  Pay <span>#{inst.installmentNumber}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : selectedInvoice.paymentType === 'CASH' ? (
              <section className="invoice-settled-banner">
                <div className="invoice-settled-icon"><CheckCircle2 size={20} /></div>
                <div><strong>Paid in full</strong><span>This cash purchase has no outstanding installments or financing schedule.</span></div>
              </section>
            ) : null}

            {/* Payment receipts */}
            <section className="invoice-panel">
              <div className="invoice-panel-header">
                <div className="invoice-panel-heading">
                  <div className="invoice-panel-icon is-green"><CreditCard size={16} /></div>
                  <div><h3>Payment receipts</h3><p>{selectedInvoice.payments?.length || 0} recorded transaction{(selectedInvoice.payments?.length || 0) === 1 ? '' : 's'}</p></div>
                </div>
                {selectedInvoice.remainingBalance > 0 && hasPermission('CREATE_SALE') && (
                  <button className="btn btn-primary btn-sm" onClick={() => openPaymentModal(selectedInvoice)}><Plus size={14} /> Record payment</button>
                )}
              </div>

              {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                <div className="invoice-table-wrap">
                  <table className="invoice-detail-table payment-table">
                    <thead><tr><th>Receipt / reference</th><th>Date</th><th>Method</th><th>Allocation</th><th className="text-right">Amount</th><th>Notes</th></tr></thead>
                    <tbody>
                      {selectedInvoice.payments.map((pmt) => (
                        <tr key={pmt.id}>
                          <td><span className="receipt-reference">{pmt.referenceNumber || `RCP-${pmt.id.slice(0, 8).toUpperCase()}`}</span></td>
                          <td>{new Date(pmt.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td><span className="invoice-method-chip">{(pmt.paymentMethod || 'CASH').replace(/_/g, ' ')}</span></td>
                          <td><span className="invoice-allocation">{pmt.installmentId ? 'Installment payment' : 'Deposit / general ledger'}</span></td>
                          <td className="money-cell is-paid text-right">{formatPKR(pmt.amount)}</td>
                          <td className="invoice-note-cell">{pmt.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="invoice-empty-state"><CreditCard size={20} /><div><strong>No subsequent receipts</strong><span>The initial deposit was recorded with the sale. Additional collections will appear here.</span></div></div>
              )}
            </section>

            {/* Authority documents */}
            {selectedInvoice.documents && selectedInvoice.documents.length > 0 && (
              <section className="invoice-panel">
                <div className="invoice-panel-header">
                  <div className="invoice-panel-heading">
                    <div className="invoice-panel-icon is-cyan"><FileSpreadsheet size={16} /></div>
                    <div><h3>Dealership documentation</h3><p>Registration and authority document status</p></div>
                  </div>
                  <span className="invoice-document-count">{selectedInvoice.documents.length} documents</span>
                </div>
                <div className="invoice-doc-grid">
                  {selectedInvoice.documents.map((doc) => (
                    <div key={doc.id} className="invoice-doc-card">
                      <div className="invoice-doc-icon"><FileText size={16} /></div>
                      <div className="invoice-doc-content">
                        <strong>{(doc.docType || doc.documentType || 'DOCUMENT').replace(/_/g, ' ')}</strong>
                        <span>{doc.documentNumber || doc.statusNotes || 'Issued & stamped'}</span>
                      </div>
                      <span className="invoice-status-chip is-paid"><Check size={12} /> {(doc.paperworkStatus || doc.status || 'READY').replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Cancel & Soft Delete Modal inside Invoice View */}
          <ConfirmDeleteModal
            isOpen={!!saleToDelete}
            onClose={() => setSaleToDelete(null)}
            title="Cancel & Delete Sale Transaction"
            itemName="Sale Invoice"
            targetValue={saleToDelete?.invoiceNumber || ''}
            promptLabel="Type invoice number to confirm cancellation and return motorcycle to stock:"
            onConfirm={async () => {
              if (!saleToDelete) return;
              await api.deleteSale(saleToDelete.id);
              toast.success(`Sale ${saleToDelete.invoiceNumber} cancelled. Motorcycle returned to inventory.`);
              setSaleToDelete(null);
              setSelectedInvoice(null);
              fetchSales();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="sales-view sales-list-view">
      {/* Control Bar */}
      <div className="control-bar glass-panel no-print mb-4">
        <div className="filter-group">
          <select
            className="filter-select"
            value={saleTypeFilter}
            onChange={(e) => { setSaleTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All channels</option>
            <option value="B2C">Retail</option>
            <option value="B2B">Wholesale</option>
          </select>

          <select
            className="filter-select"
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
          >
            <option value="">All payment modes</option>
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
              placeholder="Search invoice, customer or chassis…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="search-input"
            />
          </div>

          <button
            className="btn btn-outline"
            onClick={() => setIsCalcOpen(true)}
            title="Open Financing Calculator"
          >
            <Calculator size={15} /> Calculator
          </button>

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
              <Plus size={16} /> {isRomanUrdu ? 'Nayi Sale' : 'New sale'}
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
                <th>Total</th>
                <th>Balance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="loading-cell">
                    <div className="spinner"></div> Loading sales records…
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td
                      className="cursor-pointer"
                      onClick={() => handleOpenInvoice(sale)}
                      title="View detailed invoice & installment schedule"
                    >
                      <div className="font-mono text-cyan font-bold hover:underline flex items-center gap-1.5">
                        <Receipt size={14} />
                        <span>{sale.invoiceNumber}</span>
                      </div>
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
                      <div className="font-bold font-mono">{formatPKR(sale.finalAmount)}</div>
                      <span className="text-xs text-muted">{(sale.paymentType || 'CASH').replace(/_/g, ' ')}</span>
                    </td>
                    <td>
                      {sale.remainingBalance > 0 ? (
                        <div>
                          <span className="font-bold text-rose font-mono">{formatPKR(sale.remainingBalance)}</span>
                          <span className="text-muted text-xs block">Installment Due</span>
                        </div>
                      ) : (
                        <span className="glass-badge badge-emerald">Settled</span>
                      )}
                    </td>
                    <td>
                      <span className={`glass-badge ${sale.status === 'COMPLETED' ? 'badge-emerald' : 'badge-amber'}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="table-actions flex items-center justify-end gap-1">
                        <button
                          className="btn btn-xs btn-secondary flex items-center gap-1"
                          onClick={() => handleOpenInvoice(sale)}
                          title="View Detailed Invoice & Installments"
                        >
                          <FileText size={13} /> View
                        </button>
                        {/* <button
                          className="btn-action-icon"
                          onClick={() => handleOpenInvoice(sale)}
                          title="View & Print Invoice / Gate Pass"
                        >
                          <Printer size={15} />
                        </button> */}
                        {sale.remainingBalance > 0 && hasPermission('CREATE_SALE') && (
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => openPaymentModal(sale)}
                            title="Collect Payment"
                          >
                            <DollarSign size={13} /> Collect
                          </button>
                        )}
                        {hasPermission('CREATE_SALE') && (
                          <button
                            className="btn-action-icon text-rose"
                            onClick={() => setSaleToDelete(sale)}
                            title="Cancel & Soft Delete Sale"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-placeholder">
                    No sales records match current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

      {/* GitHub-Style Soft Delete Confirmation Modal (Task 13) */}
      <ConfirmDeleteModal
        isOpen={!!saleToDelete}
        onClose={() => setSaleToDelete(null)}
        title="Cancel & Delete Sale Transaction"
        itemName="Sale Invoice"
        targetValue={saleToDelete?.invoiceNumber || ''}
        promptLabel="Type invoice number to confirm soft deletion and return motorcycle to stock:"
        onConfirm={async () => {
          if (!saleToDelete) return;
          await api.deleteSale(saleToDelete.id);
          toast.success(`Sale ${saleToDelete.invoiceNumber} cancelled. Motorcycle returned to inventory.`);
          fetchSales();
        }}
      />

      {/* Financing Calculator Modal */}
      <FinancingCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        initialPrice={185000}
        onApplyPlan={(plan) => {
          openNewSaleModal();
          setSaleForm((prev) => ({
            ...prev,
            paymentType: 'CREDIT_INSTALLMENT',
            salePrice: plan.bikePrice,
            initialDeposit: plan.downPayment,
            installmentsCount: plan.tenureMonths
          }));
        }}
      />
    </div>
  );
}