import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  LogOut,
  Menu,
  Activity,
  Check,
  Store
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
      setCurrentTime(now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close the role menu on outside click or Escape
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

  const tabTitles = {
    dashboard: { full: 'Dashboard', short: 'Dashboard' },
    inventory: { full: 'Motorcycle stock', short: 'Stock' },
    sales: { full: 'Sales and billing', short: 'Sales' },
    customers: { full: 'Customers', short: 'Customers' },
    documents: { full: 'Letters and documents', short: 'Documents' },
    parts: { full: 'Spare parts', short: 'Parts' },
    reports: { full: 'Reports and exports', short: 'Reports' },
    users: { full: 'Staff and access', short: 'Staff' }
  };

  const roles = [
    { username: 'admin', role: 'Admin', label: 'Admin', desc: 'Everything, including staff and access' },
    { username: 'manager', role: 'Manager', label: 'Manager', desc: 'Parts and B2B orders' },
    { username: 'operator', role: 'Operator', label: 'Operator', desc: 'Sales entry only' },
    { username: 'sales', role: 'Sales Representative', label: 'Sales representative', desc: 'Sales and documents' }
  ];

  const currentTitle = tabTitles[activeTab] || { full: 'AutoSuite', short: 'AutoSuite' };

  return (
    <header className="top-header no-print">
      <div className="header-left">
        {onOpenMobile && (
          <button
            className="mobile-menu-btn"
            onClick={onOpenMobile}
            aria-label="Open navigation"
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
              <Store size={11} />
              Main campus branch
            </span>
            <span className="subtitle-divider">·</span>
            <span className="header-time font-mono">{currentTime}</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="glass-badge badge-emerald system-status-badge" title="Connected to the dealership database">
          <Activity size={12} className="live-activity-icon" />
          <span className="status-text">Online</span>
        </div>

        <div className="rbac-switcher" ref={dropdownRef}>
          <div className="switcher-label">
            <span>Signed in as</span>
          </div>
          <div className="role-dropdown-container">
            <button
              className="role-selector-btn"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              aria-expanded={showRoleMenu}
              aria-haspopup="true"
              title="Change role"
            >
              <span className={`glass-badge ${user?.role === 'Admin' ? 'badge-rose' :
                user?.role === 'Manager' ? 'badge-purple' :
                  user?.role === 'Operator' ? 'badge-cyan' : 'badge-emerald'
                }`}>
                {user?.role || 'Guest'}
              </span>
              <ChevronDown
                size={14}
                style={{ transform: showRoleMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.16s ease' }}
              />
            </button>

            {showRoleMenu && (
              <div className="role-dropdown-menu">
                <div className="dropdown-header">Switch role</div>
                {roles.map((r) => {
                  const isSelected = user?.role === r.role;
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
                        <span className="role-user">{r.desc}</span>
                      </div>
                      {isSelected && <Check size={16} />}
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
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}