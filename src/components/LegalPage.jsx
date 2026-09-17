import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { ShieldCheck, FileText, Lock, Printer, CheckCircle2, CalendarDays, Hash } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const TABS = [
  { id: 'terms', labelEn: 'Terms of Service', labelUrdu: 'Terms & Conditions', icon: FileText },
  { id: 'privacy', labelEn: 'Privacy & PII Policy', labelUrdu: 'Privacy Policy', icon: Lock },
  { id: 'warranty', labelEn: 'Warranty & Delivery Policy', labelUrdu: 'Warranty & Gate Pass', icon: ShieldCheck },
];

export default function LegalPage({ initialTab = 'terms' }) {
  const { isRomanUrdu } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sliding tab indicator — measures the active button and glides the
  // highlight behind it instead of hard-cutting between states.
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  const measureIndicator = () => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    }
  };

  useLayoutEffect(() => {
    measureIndicator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isRomanUrdu]);

  useEffect(() => {
    window.addEventListener('resize', measureIndicator);
    return () => window.removeEventListener('resize', measureIndicator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="legal-page flex flex-col gap-5 max-w-5xl mx-auto">
      {/* Top Banner Header */}
      <div className="card glass-panel legal-hero-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="modal-icon-badge icon-badge-cyan legal-hero-icon">
            <ShieldCheck size={24} className="text-cyan" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-1">
              {isRomanUrdu ? 'Qanooni Maloomat aur Policies' : 'Legal Agreements & Policies'}
            </h2>
            <p className="text-muted text-xs mt-0.5">
              {isRomanUrdu
                ? 'Falcon Honda Motors — Qanooni Rahnumai aur Privacy'
                : 'AutoSuite ERP & Dealership Operational Standards'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 no-print shrink-0">
          <button className="btn btn-outline btn-sm legal-print-btn" onClick={() => window.print()}>
            <Printer size={14} /> {isRomanUrdu ? 'Print Page' : 'Print Page'}
          </button>
        </div>
      </div>

      {/* Main Legal Content Card */}
      <div className="card glass-panel p-6">
        {/* Navigation Tabs Bar */}
        <div className="legal-tabs-bar no-print mb-6 pb-4 border-b flex gap-2 flex-wrap">
          <span
            className="legal-tab-indicator"
            style={{
              left: indicator.left,
              width: indicator.width,
              opacity: indicator.ready ? 1 : 0,
            }}
            aria-hidden="true"
          />
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => (tabRefs.current[tab.id] = el)}
                className={`legal-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={15} />
                {isRomanUrdu ? tab.labelUrdu : tab.labelEn}
              </button>
            );
          })}
        </div>

        {/* Legal Document Content Body */}
        <div className="legal-content-body max-w-4xl">
          {activeTab === 'terms' && (
            <div key="terms" className="legal-section legal-content-anim flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold text-ink-1">1. Dealership ERP & Sales Terms of Service</h3>
                <div className="legal-meta-row flex items-center gap-2 flex-wrap mt-2">
                  <span className="glass-badge badge-muted">
                    <CalendarDays size={11} /> Effective Jan 1, 2026
                  </span>
                  <span className="glass-badge badge-muted">
                    <Hash size={11} /> AST-TOS-2026-v2
                  </span>
                </div>
              </div>

              <hr className="border-line-soft my-1" />

              <div className="legal-text-block flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">1.1 Vehicle Ownership & Title Reservation</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Until the total sales price, including any applicable registration levies, documented surcharges, and financing installment amounts, has been liquidated in full, Falcon Honda Motors retains legal title and ownership rights over any vehicle, chassis, or associated spare inventory.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">1.2 Installment Covenants & Repossession Clause</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Any installment schedule issued through the AutoSuite ERP platform constitutes a legally binding promissory undertaking under the Negotiable Instruments Act and Contract Act. A grace window of 10 calendar days applies beyond due dates, following which default penalties accrue. In the event of default exceeding 60 days, the dealership reserves statutory rights to recall the vehicle.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">1.3 Invoicing & Electronic Audit Trail</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Invoices generated by this ERP system bearing official invoice numbering (e.g., INV-YYYY-XXXX) represent definitive proof of transaction. Tampering, unauthorized deletion, or alteration of invoices is strictly prohibited and logged under our immutable 90-day technical audit logging infrastructure.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">1.4 Jurisdiction & Arbitration</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    All commercial agreements, booking receipts, and dealer wholesale contracts shall be governed in accordance with local commercial dealership law and judicial courts of Pakistan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div key="privacy" className="legal-section legal-content-anim flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold text-ink-1">2. Customer Privacy & CNIC Data Handling Policy</h3>
                <div className="legal-meta-row flex items-center gap-2 flex-wrap mt-2">
                  <span className="glass-badge badge-muted">
                    <ShieldCheck size={11} /> Data Protection Standard
                  </span>
                  <span className="glass-badge badge-muted">
                    <Hash size={11} /> Excise Department Integration
                  </span>
                </div>
              </div>

              <hr className="border-line-soft my-1" />

              <div className="legal-text-block flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">2.1 Collection of Personal Identifiable Information (PII)</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    To facilitate motorcycle registration, chassis verification, excise allotment letters, and warranty claims, AutoSuite ERP processes customer names, mobile telephone numbers, National Computerized Identity Card (CNIC) numbers, residential addresses, and sales transaction metadata.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">2.2 Mandatory Excise & OEM Data Transfer</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Customer records are securely transmitted solely to official regulatory bodies: (a) The Provincial Excise, Taxation & Narcotics Control Department for vehicular road registration; and (b) Atlas Honda OEM manufacturing verification gateways for vehicle warranty activation. No customer PII is rented, commercialized, or sold to third-party telemarketers.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">2.3 90-Day Retention & Access Log Auditing</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    In accordance with regulatory dealership standards, all administrative access, customer lookup queries, payment transactions, and record modifications are logged with client IP addresses and user timestamps, maintained for a mandatory minimum retention window of at least ninety (90) days in compliance with ISO/dealership audit protocols.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">2.4 Soft Deletion & Right to Rectification</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Customers and staff may request correction of erroneous data. In accordance with enterprise integrity standards, deleted records are soft-deleted from active views while audit references remain preserved for fiscal audit compliance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div key="warranty" className="legal-section legal-content-anim flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold text-ink-1">3. Motorcycle Warranty, Gate Pass & Service Guidelines</h3>
                <div className="legal-meta-row flex items-center gap-2 flex-wrap mt-2">
                  <span className="glass-badge badge-muted">
                    <ShieldCheck size={11} /> Atlas Honda OEM Authorized
                  </span>
                </div>
              </div>

              <hr className="border-line-soft my-1" />

              <div className="legal-text-block flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">3.1 Official Delivery Letter & Gate Pass Protocols</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    No motorcycle shall exit the showroom floor or bonded storage yard without an authorized AutoSuite ERP Delivery Letter and Gate Pass containing verified matching Engine Number, Chassis Number, and Sales Officer electronic signature.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">3.2 Manufacturer Warranty Coverage</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Brand new motorcycles carry manufacturer standard warranty coverage for 20,000 kilometers or 24 months (whichever transpires earlier), conditioned upon adherence to authorized scheduled maintenance coupons using genuine OEM 4T engine oils and Atlas Honda certified spare parts.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">3.3 Certified Pre-Owned (Used) Vehicle Disclaimer</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Used motorcycles are certified according to condition grading (Grade A, B, or C). Pre-owned vehicle sales are final upon customer physical inspection and execution of the Book Transfer and Allotment request form.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-semibold text-ink-1">3.4 Registration Book & Smart Card Pickup</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Customers will receive an automated SMS/System notification when vehicle registration smart cards and excise return books are stamped and ready for counter collection.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verified Footer Bar */}
        <div className="mt-8 pt-4 border-t flex items-center gap-2 text-xs text-muted legal-verified-footer">
          <CheckCircle2 size={16} className="text-emerald shrink-0" />
          <span>
            {isRomanUrdu
              ? 'AutoSuite Dealership ERP se tasdeeq shuda'
              : 'Verified compliance document — AutoSuite ERP'}
          </span>
        </div>
      </div>
    </div>
  );
}