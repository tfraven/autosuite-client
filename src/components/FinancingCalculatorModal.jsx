import React, { useState } from 'react';
import { Calculator, X, Calendar, DollarSign, ArrowRight, Percent } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function FinancingCalculatorModal({
  isOpen,
  onClose,
  initialPrice = 185000,
  onApplyPlan
}) {
  const { isRomanUrdu } = useLanguage();
  const [bikePrice, setBikePrice] = useState(initialPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(30);
  const [tenureMonths, setTenureMonths] = useState(6);
  const [annualMarkupRate, setAnnualMarkupRate] = useState(12); // 12% APR

  if (!isOpen) return null;

  const priceNum = Number(bikePrice) || 0;
  const downPayment = Math.round((priceNum * downPaymentPercent) / 100);
  const financedPrincipal = Math.max(0, priceNum - downPayment);
  const markupAmount = Math.round(
    financedPrincipal * ((annualMarkupRate / 100) * (tenureMonths / 12))
  );
  const totalFinancedPayable = financedPrincipal + markupAmount;
  const monthlyInstallment = Math.round(totalFinancedPayable / tenureMonths);
  const totalGrandPayable = downPayment + totalFinancedPayable;

  const handleApply = () => {
    if (onApplyPlan) {
      onApplyPlan({
        bikePrice: priceNum,
        downPayment,
        tenureMonths,
        monthlyInstallment,
        totalFinancedPayable
      });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container financing-modal glass-panel slide-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge icon-badge-amber">
              <Calculator size={22} className="text-amber" />
            </div>
            <div>
              <h3>{isRomanUrdu ? 'Qistain aur Financing Calculator' : 'Installment & Financing Calculator'}</h3>
              <span className="text-xs text-muted">
                {isRomanUrdu
                  ? 'Peshgi rakam, mahana qist aur markup ka hisaab lagayein'
                  : 'Calculate down payment, monthly installments and markup schedule'}
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="form-field">
              <label>{isRomanUrdu ? 'Bike Ki Qeemat (PKR)' : 'Motorcycle Retail Price (PKR)'}</label>
              <input
                type="number"
                className="form-input font-mono"
                value={bikePrice}
                onChange={(e) => setBikePrice(Number(e.target.value))}
                min="10000"
                step="1000"
              />
            </div>

            <div className="form-field">
              <label>{isRomanUrdu ? 'Peshgi Rakam (% Down Payment)' : 'Down Payment (% Upfront)'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="70"
                  step="5"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full"
                />
                <span className="font-mono text-sm w-12 text-right">{downPaymentPercent}%</span>
              </div>
            </div>

            <div className="form-field">
              <label>{isRomanUrdu ? 'Muddad (Tenure Months)' : 'Installment Tenure'}</label>
              <select
                className="form-input font-mono"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={9}>9 Months</option>
                <option value={12}>12 Months (1 Year)</option>
                <option value={18}>18 Months</option>
                <option value={24}>24 Months (2 Years)</option>
              </select>
            </div>

            <div className="form-field">
              <label>{isRomanUrdu ? 'Dealership Markup / Sood (% APR)' : 'Annual Markup Rate (% APR)'}</label>
              <input
                type="number"
                className="form-input font-mono"
                value={annualMarkupRate}
                onChange={(e) => setAnnualMarkupRate(Number(e.target.value))}
                min="0"
                max="40"
              />
            </div>
          </div>

          {/* Result Calculation Card */}
          <div className="calculator-results-box glass-panel p-4 rounded-md">
            <div className="grid grid-cols-3 gap-3 text-center mb-3 pb-3 border-b border-line-soft">
              <div>
                <span className="text-xs text-muted block">Down Payment</span>
                <strong className="text-sm font-mono text-cyan">
                  PKR {downPayment.toLocaleString('en-PK')}
                </strong>
              </div>
              <div>
                <span className="text-xs text-muted block">Monthly Installment</span>
                <strong className="text-base font-mono text-emerald">
                  PKR {monthlyInstallment.toLocaleString('en-PK')} / mo
                </strong>
              </div>
              <div>
                <span className="text-xs text-muted block">Total Markup</span>
                <strong className="text-sm font-mono text-amber">
                  PKR {markupAmount.toLocaleString('en-PK')}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted pt-1">
              <span>
                Total Out-of-Pocket: <strong>PKR {totalGrandPayable.toLocaleString('en-PK')}</strong>
              </span>
              <span>
                Financed Balance: <strong>PKR {totalFinancedPayable.toLocaleString('en-PK')}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {isRomanUrdu ? 'Band Karein' : 'Close'}
          </button>
          {onApplyPlan && (
            <button type="button" className="btn btn-primary" onClick={handleApply}>
              <span>{isRomanUrdu ? 'Sale Form Mein Shamil Karein' : 'Apply to Sale Form'}</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
