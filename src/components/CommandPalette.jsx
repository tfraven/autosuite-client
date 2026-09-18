import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Bike,
  Receipt,
  Users,
  Wrench,
  X,
  ArrowRight,
  Sparkles,
  Command,
  FileText,
  BarChart3,
  Calculator,
  PlusCircle,
  TrendingUp,
  FileSpreadsheet,
  CornerDownLeft,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectTab,
  onNavigate,
  onViewInvoice,
  onSelectCustomer,
  onOpenNewSale,
  onOpenNewBike
}) {
  const navigateTab = onSelectTab || onNavigate || (() => {});
  const { isRomanUrdu } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // ALL, ACTIONS, BIKES, SALES, CUSTOMERS, PARTS
  const [results, setResults] = useState({ bikes: [], sales: [], customers: [], parts: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Quick actions definition
  const quickActions = useMemo(
    () => [
      {
        id: 'act-new-sale',
        type: 'action',
        icon: PlusCircle,
        iconClass: 'text-emerald',
        title: isRomanUrdu ? 'Nayi Sale / Invoice Shuru Karein' : 'Create New Sale / Invoice',
        subtitle: isRomanUrdu ? 'Chassis number aur customer select karein' : 'Select motorcycle, customer and issue invoice',
        category: 'ACTIONS',
        action: () => {
          if (onOpenNewSale) {
            onOpenNewSale();
          } else {
            navigateTab('sales');
          }
          onClose();
        }
      },
      {
        id: 'act-new-bike',
        type: 'action',
        icon: Bike,
        iconClass: 'text-cyan',
        title: isRomanUrdu ? 'Nayi Motorcycle Stock Mein Shamil Karein' : 'Add Motorcycle to Stock',
        subtitle: isRomanUrdu ? 'Chassis, engine aur color register karein' : 'Register brand new or used certified bike',
        category: 'ACTIONS',
        action: () => {
          if (onOpenNewBike) {
            onOpenNewBike();
          } else {
            navigateTab('inventory');
          }
          onClose();
        }
      },
      {
        id: 'act-customers',
        type: 'action',
        icon: Users,
        iconClass: 'text-purple',
        title: isRomanUrdu ? 'Customers aur Khata / Ledger' : 'Customers Ledger & Dues Directory',
        subtitle: isRomanUrdu ? 'Gahak ki qistain aur purani khareedari' : 'Inspect customer balances, overdue dues, and purchase history',
        category: 'ACTIONS',
        action: () => {
          navigateTab('customers');
          onClose();
        }
      },
      {
        id: 'act-analytics',
        type: 'action',
        icon: TrendingUp,
        iconClass: 'text-amber',
        title: isRomanUrdu ? 'Analytics aur Activity Heatmaps' : 'View Analytics & Activity Heatmaps',
        subtitle: isRomanUrdu ? 'Rush hours, showroom demand aur team performance' : 'Showroom rush hours, sales demand heatmaps & telemetry',
        category: 'ACTIONS',
        action: () => {
          navigateTab('analytics');
          onClose();
        }
      },
      {
        id: 'act-reports',
        type: 'action',
        icon: BarChart3,
        iconClass: 'text-blue',
        title: isRomanUrdu ? 'Financial aur Stock Reports' : 'Financial & Stock Reports',
        subtitle: isRomanUrdu ? 'P&L, stock sheets aur Excel downloads' : 'Detailed ledger statements and monthly breakdowns',
        category: 'ACTIONS',
        action: () => {
          navigateTab('reports');
          onClose();
        }
      },
      {
        id: 'act-parts',
        type: 'action',
        icon: Wrench,
        iconClass: 'text-rose',
        title: isRomanUrdu ? 'Spare Parts Inventory' : 'Spare Parts & Workshop Inventory',
        subtitle: isRomanUrdu ? 'Genuine Honda aur OEM parts stock' : 'Catalog, reorder alerts, and wholesale orders',
        category: 'ACTIONS',
        action: () => {
          navigateTab('parts');
          onClose();
        }
      },
      {
        id: 'act-export-sales',
        type: 'action',
        icon: FileSpreadsheet,
        iconClass: 'text-emerald',
        title: isRomanUrdu ? 'Sales Book Excel Export' : 'Export Sales Book (Excel)',
        subtitle: isRomanUrdu ? 'Tamam invoices ki spreadsheet download karein' : 'Download complete spreadsheet of all issued invoices',
        category: 'ACTIONS',
        action: () => {
          api.downloadExcel('sales');
          onClose();
        }
      },
      {
        id: 'act-export-bikes',
        type: 'action',
        icon: FileSpreadsheet,
        iconClass: 'text-cyan',
        title: isRomanUrdu ? 'Motorcycle Stock Excel Export' : 'Export Motorcycle Stock (Excel)',
        subtitle: isRomanUrdu ? 'In-stock aur sold motorcycles ki list' : 'Download full inventory spreadsheet with chassis numbers',
        category: 'ACTIONS',
        action: () => {
          api.downloadExcel('bikes');
          onClose();
        }
      }
    ],
    [isRomanUrdu, onOpenNewSale, onOpenNewBike, navigateTab, onClose]
  );

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory('ALL');
      setResults({ bikes: [], sales: [], customers: [], parts: [] });
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Live query search across Motorcycles, Sales, Customers, Parts
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ bikes: [], sales: [], customers: [], parts: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.trim();
        const [bikesRes, salesRes, custRes, partsRes] = await Promise.all([
          api.getBikes({ search: q, limit: 5 }).catch(() => []),
          api.getSales({ search: q, limit: 5 }).catch(() => []),
          api.getCustomers({ search: q, limit: 5 }).catch(() => []),
          api.getParts({ search: q, limit: 5 }).catch(() => [])
        ]);

        const bikesList = Array.isArray(bikesRes) ? bikesRes : bikesRes?.bikes || bikesRes?.data || [];
        const salesList = Array.isArray(salesRes) ? salesRes : salesRes?.sales || salesRes?.data || [];
        const custList = Array.isArray(custRes) ? custRes : custRes?.customers || custRes?.data || [];
        const partsList = Array.isArray(partsRes) ? partsRes : partsRes?.parts || partsRes?.data || [];

        setResults({
          bikes: bikesList.slice(0, 5),
          sales: salesList.slice(0, 5),
          customers: custList.slice(0, 5),
          parts: partsList.slice(0, 5)
        });
        setSelectedIndex(0);
      } catch (err) {
        console.error('Command palette search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Filtered Actions based on query
  const matchingActions = useMemo(() => {
    if (!query.trim()) return quickActions;
    const cleanQ = query.toLowerCase().replace(/^>/, '').trim();
    return quickActions.filter(
      (a) =>
        a.title.toLowerCase().includes(cleanQ) ||
        a.subtitle.toLowerCase().includes(cleanQ)
    );
  }, [quickActions, query]);

  // Flattened navigable list for arrow-key navigation
  const flatItems = useMemo(() => {
    const list = [];

    // 1. Actions (if category matches)
    if (activeCategory === 'ALL' || activeCategory === 'ACTIONS') {
      matchingActions.forEach((a) => {
        list.push({
          id: a.id,
          group: 'Actions',
          item: a,
          execute: a.action
        });
      });
    }

    // 2. Motorcycles
    if (activeCategory === 'ALL' || activeCategory === 'BIKES') {
      (results.bikes || []).forEach((b) => {
        list.push({
          id: `bike-${b.id}`,
          group: 'Motorcycles',
          item: b,
          execute: () => {
            navigateTab('inventory');
            onClose();
          }
        });
      });
    }

    // 3. Sales / Invoices
    if (activeCategory === 'ALL' || activeCategory === 'SALES') {
      (results.sales || []).forEach((s) => {
        list.push({
          id: `sale-${s.id}`,
          group: 'Invoices',
          item: s,
          execute: () => {
            if (onViewInvoice) {
              onViewInvoice(s);
            } else {
              navigateTab('sales');
            }
            onClose();
          }
        });
      });
    }

    // 4. Customers
    if (activeCategory === 'ALL' || activeCategory === 'CUSTOMERS') {
      (results.customers || []).forEach((c) => {
        list.push({
          id: `cust-${c.id}`,
          group: 'Customers',
          item: c,
          execute: () => {
            if (onSelectCustomer) {
              onSelectCustomer(c);
            } else {
              navigateTab('customers');
            }
            onClose();
          }
        });
      });
    }

    // 5. Parts
    if (activeCategory === 'ALL' || activeCategory === 'PARTS') {
      (results.parts || []).forEach((p) => {
        list.push({
          id: `part-${p.id}`,
          group: 'Parts',
          item: p,
          execute: () => {
            navigateTab('parts');
            onClose();
          }
        });
      });
    }

    return list;
  }, [
    activeCategory,
    matchingActions,
    results,
    navigateTab,
    onViewInvoice,
    onSelectCustomer,
    onClose
  ]);

  // Handle keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems.length > 0 && flatItems[selectedIndex]) {
          flatItems[selectedIndex].execute();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('.palette-item-selected');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const totalResults =
    (results.bikes?.length || 0) +
    (results.sales?.length || 0) +
    (results.customers?.length || 0) +
    (results.parts?.length || 0);

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        className="command-palette-container glass-panel slide-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {/* Search input bar */}
        <div className="palette-input-row">
          <Search size={18} className="text-muted" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={
              isRomanUrdu
                ? 'Gaari ka model, chassis#, customer, invoice ya action talash karein…'
                : 'Search motorcycles, chassis #, customers, invoices, or quick actions…'
            }
          />
          {query && (
            <button className="icon-btn" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
          <kbd className="palette-kbd">ESC</kbd>
        </div>

        {/* Category filter pills */}
        <div className="palette-filter-bar">
          <button
            type="button"
            className={`palette-filter-btn ${activeCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveCategory('ALL')}
          >
            All
          </button>
          <button
            type="button"
            className={`palette-filter-btn ${activeCategory === 'ACTIONS' ? 'active' : ''}`}
            onClick={() => setActiveCategory('ACTIONS')}
          >
            <Sparkles size={11} className="inline mr-1 text-amber" /> Actions
          </button>
          <button
            type="button"
            className={`palette-filter-btn ${activeCategory === 'BIKES' ? 'active' : ''}`}
            onClick={() => setActiveCategory('BIKES')}
          >
            <Bike size={11} className="inline mr-1 text-cyan" /> Stock
          </button>
          <button
            type="button"
            className={`palette-filter-btn ${activeCategory === 'SALES' ? 'active' : ''}`}
            onClick={() => setActiveCategory('SALES')}
          >
            <Receipt size={11} className="inline mr-1 text-emerald" /> Invoices
          </button>
          <button
            type="button"
            className={`palette-filter-btn ${activeCategory === 'CUSTOMERS' ? 'active' : ''}`}
            onClick={() => setActiveCategory('CUSTOMERS')}
          >
            <Users size={11} className="inline mr-1 text-purple" /> Customers
          </button>
          <button
            type="button"
            className={`palette-filter-btn ${activeCategory === 'PARTS' ? 'active' : ''}`}
            onClick={() => setActiveCategory('PARTS')}
          >
            <Wrench size={11} className="inline mr-1 text-rose" /> Parts
          </button>
        </div>

        {/* Results List */}
        <div className="palette-results-body" ref={listRef}>
          {loading && (
            <div className="palette-loading text-xs text-muted py-4 text-center">
              <span className="inline-block animate-pulse">Searching dealership database…</span>
            </div>
          )}

          {!loading && query && totalResults === 0 && matchingActions.length === 0 && (
            <div className="palette-empty text-xs text-muted py-6 text-center">
              No matching records found for "{query}".
            </div>
          )}

          {/* Quick Actions */}
          {(activeCategory === 'ALL' || activeCategory === 'ACTIONS') && matchingActions.length > 0 && (
            <div className="palette-group">
              <div className="palette-group-title text-xs text-muted flex items-center gap-1">
                <Sparkles size={12} className="text-amber" /> Quick Actions & Navigation
              </div>
              {matchingActions.map((act) => {
                const itemIndex = flatItems.findIndex((fi) => fi.id === act.id);
                const isSelected = selectedIndex === itemIndex;
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    className={`palette-result-item ${isSelected ? 'palette-item-selected' : ''}`}
                    onClick={act.action}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`palette-item-icon ${act.iconClass}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-ink-1">{act.title}</div>
                        <div className="text-xs text-muted">{act.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isSelected && <CornerDownLeft size={13} className="text-cyan animate-pulse" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Motorcycle Results */}
          {(activeCategory === 'ALL' || activeCategory === 'BIKES') && results.bikes?.length > 0 && (
            <div className="palette-group mt-2">
              <div className="palette-group-title text-xs text-muted flex items-center gap-1">
                <Bike size={12} className="text-cyan" /> Motorcycles in Stock
              </div>
              {results.bikes.map((b) => {
                const itemIndex = flatItems.findIndex((fi) => fi.id === `bike-${b.id}`);
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={b.id}
                    className={`palette-result-item ${isSelected ? 'palette-item-selected' : ''}`}
                    onClick={() => {
                      navigateTab('inventory');
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{b.modelName}</span>
                      <span className="font-mono text-xs text-cyan">
                        Chassis: {b.chassisNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold">
                        PKR {Number(b.retailPrice).toLocaleString('en-PK')}
                      </span>
                      <span className={`glass-badge text-xs ${b.status === 'IN_STOCK' ? 'badge-emerald' : 'badge-amber'}`}>
                        {b.status}
                      </span>
                      {isSelected && <CornerDownLeft size={13} className="text-cyan ml-1" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sales & Invoices Results */}
          {(activeCategory === 'ALL' || activeCategory === 'SALES') && results.sales?.length > 0 && (
            <div className="palette-group mt-2">
              <div className="palette-group-title text-xs text-muted flex items-center gap-1">
                <Receipt size={12} className="text-emerald" /> Sales & Invoices
              </div>
              {results.sales.map((s) => {
                const itemIndex = flatItems.findIndex((fi) => fi.id === `sale-${s.id}`);
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={s.id}
                    className={`palette-result-item ${isSelected ? 'palette-item-selected' : ''}`}
                    onClick={() => {
                      if (onViewInvoice) onViewInvoice(s);
                      else navigateTab('sales');
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                  >
                    <div>
                      <div className="font-medium text-sm flex items-center gap-1.5">
                        <span>{s.customerName}</span>
                        <span className="text-xs text-muted">· {new Date(s.saleDate).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="font-mono text-xs text-muted">
                        <span className="text-cyan font-bold">{s.invoiceNumber}</span> · {s.customerPhone}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="font-mono text-xs font-semibold">
                          PKR {Number(s.finalAmount).toLocaleString('en-PK')}
                        </div>
                        <span className={`glass-badge text-xs ${s.remainingBalance > 0 ? 'badge-amber' : 'badge-emerald'}`}>
                          {s.remainingBalance > 0 ? 'Dues' : 'Paid'}
                        </span>
                      </div>
                      {isSelected && <CornerDownLeft size={13} className="text-cyan" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Customer Results */}
          {(activeCategory === 'ALL' || activeCategory === 'CUSTOMERS') && results.customers?.length > 0 && (
            <div className="palette-group mt-2">
              <div className="palette-group-title text-xs text-muted flex items-center gap-1">
                <Users size={12} className="text-purple" /> Customers & Debtors
              </div>
              {results.customers.map((c) => {
                const itemIndex = flatItems.findIndex((fi) => fi.id === `cust-${c.id}`);
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={c.id}
                    className={`palette-result-item ${isSelected ? 'palette-item-selected' : ''}`}
                    onClick={() => {
                      if (onSelectCustomer) onSelectCustomer(c);
                      else navigateTab('customers');
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                  >
                    <div>
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="font-mono text-xs text-muted">
                        {c.phone} {c.cnic ? `· CNIC: ${c.cnic}` : ''}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="font-mono text-xs font-semibold">
                          {c.totalPurchases || 0} bikes
                        </div>
                        <span className={`glass-badge text-xs ${c.remainingBalance > 0 ? 'badge-rose' : 'badge-emerald'}`}>
                          {c.remainingBalance > 0 ? `Due: PKR ${Number(c.remainingBalance).toLocaleString('en-PK')}` : 'Settled'}
                        </span>
                      </div>
                      {isSelected && <CornerDownLeft size={13} className="text-cyan" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Spare Parts Results */}
          {(activeCategory === 'ALL' || activeCategory === 'PARTS') && results.parts?.length > 0 && (
            <div className="palette-group mt-2">
              <div className="palette-group-title text-xs text-muted flex items-center gap-1">
                <Wrench size={12} className="text-rose" /> Spare Parts Catalog
              </div>
              {results.parts.map((p) => {
                const itemIndex = flatItems.findIndex((fi) => fi.id === `part-${p.id}`);
                const isSelected = selectedIndex === itemIndex;
                return (
                  <div
                    key={p.id}
                    className={`palette-result-item ${isSelected ? 'palette-item-selected' : ''}`}
                    onClick={() => {
                      navigateTab('parts');
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                  >
                    <div>
                      <div className="font-medium text-sm">{p.partName}</div>
                      <div className="font-mono text-xs text-rose">
                        [{p.partCode}] {p.compatibilityModel}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <span className="font-mono text-xs font-semibold">
                          PKR {Number(p.b2bSellingPrice).toLocaleString('en-PK')}
                        </span>
                        <span className={`glass-badge text-xs block ${p.quantity <= p.reorderThreshold ? 'badge-rose' : 'badge-cyan'}`}>
                          {p.quantity} in stock
                        </span>
                      </div>
                      {isSelected && <CornerDownLeft size={13} className="text-cyan" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="palette-footer-bar text-xs text-muted flex items-center justify-between px-3 py-2 border-t border-line-soft bg-surface-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="palette-kbd"><ArrowUp size={10} /></kbd>
              <kbd className="palette-kbd"><ArrowDown size={10} /></kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="palette-kbd">↵ Enter</kbd> Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="palette-kbd">ESC</kbd> Close
            </span>
          </div>
          <span className="text-xs text-muted flex items-center gap-1">
            <Command size={11} /> AutoSuite Quick Launch
          </span>
        </div>
      </div>
    </div>
  );
}
