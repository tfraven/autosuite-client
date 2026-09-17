import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bike,
  Receipt,
  User,
  Wrench,
  X,
  ArrowRight,
  Sparkles,
  Command
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function CommandPalette({ isOpen, onClose, onSelectTab, onNavigate }) {
  const navigateTab = onSelectTab || onNavigate || (() => {});
  const { isRomanUrdu } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ bikes: [], sales: [], customers: [], parts: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ bikes: [], sales: [], customers: [], parts: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ bikes: [], sales: [], customers: [], parts: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.trim();
        const [bikesRes, salesRes, partsRes] = await Promise.all([
          api.getBikes({ search: q, limit: 4 }).catch(() => []),
          api.getSales({ search: q, limit: 4 }).catch(() => []),
          api.getParts({ search: q, limit: 4 }).catch(() => [])
        ]);

        const bikesList = Array.isArray(bikesRes) ? bikesRes : bikesRes?.bikes || bikesRes?.data || [];
        const salesList = Array.isArray(salesRes) ? salesRes : salesRes?.sales || salesRes?.data || [];
        const partsList = Array.isArray(partsRes) ? partsRes : partsRes?.parts || partsRes?.data || [];

        setResults({
          bikes: bikesList.slice(0, 4),
          sales: salesList.slice(0, 4),
          parts: partsList.slice(0, 4)
        });
      } catch (err) {
        console.error('Command palette error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Global shortcut Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else window.dispatchEvent(new Event('autosuite_open_palette'));
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalResults =
    (results.bikes?.length || 0) +
    (results.sales?.length || 0) +
    (results.parts?.length || 0);

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        className="command-palette-container glass-panel slide-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="palette-input-row">
          <Search size={18} className="text-muted" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isRomanUrdu
                ? 'Gaari ka model, chassis#, customer, invoice ya spare part talash karein…'
                : 'Search motorcycles, chassis #, customer name, invoice, or spare part…'
            }
          />
          {query && (
            <button className="icon-btn" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
          <kbd className="palette-kbd">ESC</kbd>
        </div>

        <div className="palette-results-body">
          {loading && (
            <div className="palette-loading text-xs text-muted py-4 text-center">
              Searching dealership database…
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div className="palette-empty text-xs text-muted py-6 text-center">
              No matching records found for "{query}".
            </div>
          )}

          {/* Motorcycle Results */}
          {results.bikes?.length > 0 && (
            <div className="palette-group">
              <div className="palette-group-title text-xs text-muted flex items-center gap-1">
                <Bike size={12} className="text-cyan" /> Motorcycles in Stock
              </div>
              {results.bikes.map((b) => (
                <div
                  key={b.id}
                  className="palette-result-item"
                  onClick={() => {
                    navigateTab('inventory');
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{b.modelName}</span>
                    <span className="font-mono text-xs text-cyan">
                      Chassis: {b.chassisNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">
                      PKR {Number(b.retailPrice).toLocaleString('en-PK')}
                    </span>
                    <span className={`glass-badge text-xs ${b.status === 'IN_STOCK' ? 'badge-emerald' : 'badge-amber'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sales Results */}
          {results.sales?.length > 0 && (
            <div className="palette-group mt-2">
              <div className="palette-group-title text-xs text-muted flex items-center gap-1">
                <Receipt size={12} className="text-emerald" /> Sales & Invoices
              </div>
              {results.sales.map((s) => (
                <div
                  key={s.id}
                  className="palette-result-item"
                  onClick={() => {
                    navigateTab('sales');
                    onClose();
                  }}
                >
                  <div>
                    <div className="font-medium text-sm">{s.customerName}</div>
                    <div className="font-mono text-xs text-muted">
                      {s.invoiceNumber} · {s.customerPhone}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-semibold">
                      PKR {Number(s.finalAmount).toLocaleString('en-PK')}
                    </div>
                    <span className={`glass-badge text-xs ${s.remainingBalance > 0 ? 'badge-amber' : 'badge-emerald'}`}>
                      {s.remainingBalance > 0 ? 'Dues' : 'Paid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Spare Parts Results */}
          {results.parts?.length > 0 && (
            <div className="palette-group mt-2">
              <div className="palette-group-title text-xs text-muted flex items-center gap-1">
                <Wrench size={12} className="text-purple" /> Spare Parts Catalog
              </div>
              {results.parts.map((p) => (
                <div
                  key={p.id}
                  className="palette-result-item"
                  onClick={() => {
                    navigateTab('parts');
                    onClose();
                  }}
                >
                  <div>
                    <div className="font-medium text-sm">{p.partName}</div>
                    <div className="font-mono text-xs text-purple">
                      [{p.partCode}] {p.compatibilityModel}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs">
                      PKR {Number(p.b2bSellingPrice).toLocaleString('en-PK')}
                    </span>
                    <span className={`glass-badge text-xs block ${p.quantity <= p.reorderThreshold ? 'badge-rose' : 'badge-cyan'}`}>
                      {p.quantity} in stock
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!query && (
            <div className="palette-hint text-xs text-muted p-4 text-center">
              Type anything to fast-search across motorcycles, customers, invoices, and spare parts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
