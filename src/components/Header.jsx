import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  ChevronDown, 
  LogOut, 
  Menu, 
  Activity, 
  Check, 
  Store,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ activeTab, onOpenMobile }) {
  const { user, switchUser, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabTitles = {
    dashboard: { full: 'Operations Hub & Financial Intelligence', short: 'Operations Hub' },
    inventory: { full: 'Motorcycle Fleet & Inventory Control', short: 'Fleet Stock' },
    sales: { full: 'Sales Engine & Installment Billing', short: 'Sales & Billing' },
    customers: { full: 'Customer Directory & Accounts Ledger', short: 'Customer Ledger' },
    documents: { full: 'Motorcycle Letters & Excise Documentation', short: 'Letters & Docs' },
    parts: { full: 'B2B Spare Parts & Supplier Logistics', short: 'Spare Parts B2B' },
    reports: { full: 'Business Intelligence & Excel Stream Exports', short: 'Reports & Exports' },
    users: { full: 'Access Control & Granular RBAC Matrix', short: 'Staff & RBAC' }
  };

  const roles = [
    { username: 'admin', role: 'Admin', label: 'Admin (Full CRUD & RBAC)', color: 'badge-rose' },
    { username: 'manager', role: 'Manager', label: 'Manager (Parts & B2B Orders)', color: 'badge-purple' },
    { username: 'operator', role: 'Operator', label: 'Operator (Sales Entry Only)', color: 'badge-cyan' },
    { username: 'sales', role: 'Sales Representative', label: 'Sales Rep (Sales & Letters)', color: 'badge-emerald' }
  ];

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRoleMenu(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentTitle = tabTitles[activeTab] || { full: 'AutoSuite Dealership ERP', short: 'AutoSuite ERP' };

  return (
    <header className="top-header no-print">
      <div className="header-left">
        {onOpenMobile && (
          <button 
            className="mobile-menu-btn" 
            onClick={onOpenMobile}
            aria-label="Toggle navigation drawer"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="header-titles-wrap">
          <h1 className="header-title">
            <span className="title-full">{currentTitle.full}</span>
            <span className="title-short">{currentTitle.short}</span>
          </h1>
          <div className="header-subtitle">
            <span className="branch-chip">
              <Store size={11} style={{ display: 'inline', marginRight: 4 }} />
              Falcon Honda Motors • Main Campus
            </span>
            <span className="subtitle-divider">•</span>
            <span className="text-cyan font-mono header-time">{currentTime}</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Dealership Live Status Indicator */}
        <div className="glass-badge badge-emerald system-status-badge" title="Real-time telemetry active">
          <Activity size={12} className="live-activity-icon" />
          <span className="status-text">System Online</span>
        </div>

        {/* Quick RBAC Role Switcher */}
        <div className="rbac-switcher" ref={dropdownRef}>
          <div className="switcher-label">
            <Shield size={14} className="text-cyan" /> 
            <span>Persona:</span>
          </div>
          <div className="role-dropdown-container">
            <button 
              className="role-selector-btn"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              aria-expanded={showRoleMenu}
              aria-haspopup="true"
              title="Switch user role for testing"
            >
              <span className={`glass-badge ${
                user?.role === 'Admin' ? 'badge-rose' :
                user?.role === 'Manager' ? 'badge-purple' :
                user?.role === 'Operator' ? 'badge-cyan' : 'badge-emerald'
              }`}>
                {user?.role || 'Guest'}
              </span>
              <ChevronDown size={14} style={{ transform: showRoleMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {showRoleMenu && (
              <div className="role-dropdown-menu">
                <div className="dropdown-header">Switch Demo Persona (RBAC Testing)</div>
                {roles.map((r) => {
                  const isSelected = user?.role === r.role || (r.role === 'Sales Representative' && user?.role === 'Sales Representative');
                  return (
                    <button
                      key={r.username}
                      className={`role-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        switchUser(r.username);
                        setShowRoleMenu(false);
                      }}
                    >
                      <div className="role-item-main">
                        <span className="role-name">{r.label}</span>
                        <span className="role-user font-mono">login: {r.username}</span>
                      </div>
                      {isSelected && <Check size={16} className="text-cyan" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <button 
          className="logout-btn"
          onClick={logout}
          title="Sign Out of AutoSuite"
          aria-label="Sign Out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
