import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  LogOut,
  Menu,
  Activity,
  Check,
  Store,
  Sun,
  Moon,
  Globe,
  Bell,
  Search,
  AlertTriangle,
  CreditCard,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export default function Header({ activeTab, onOpenMobile, onOpenCommandPalette }) {
  const { user, switchUser, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { lang, toggleLanguage, t, isRomanUrdu } = useLanguage();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [notifications, setNotifications] = useState({ lowStock: 0, overdue: 0, docs: 0 });

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notification counts
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const stats = await api.getDashboardStats().catch(() => null);
        if (stats) {
          setNotifications({
            lowStock: stats.lowStockPartsCount || 0,
            overdue: stats.totalOutstandingCredit > 0 ? 1 : 0,
            docs: stats.pendingPaperworkCount || 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch notification badges:', err);
      }
    };
    fetchNotifs();
  }, []);

  // Close menus on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRoleMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowRoleMenu(false);
        setShowNotifications(false);
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
    dashboard: { full: t('nav_dashboard'), short: 'Dashboard' },
    inventory: { full: t('nav_inventory'), short: 'Stock' },
    sales: { full: t('nav_sales'), short: 'Sales' },
    customers: { full: t('nav_customers'), short: 'Customers' },
    documents: { full: t('nav_documents'), short: 'Documents' },
    parts: { full: t('nav_parts'), short: 'Parts' },
    reports: { full: t('nav_reports'), short: 'Reports' },
    users: { full: t('nav_users'), short: 'Staff' },
    calendar: { full: t('nav_calendar'), short: 'Calendar' },
    analytics: { full: t('nav_analytics'), short: 'Analytics' },
    settings: { full: t('nav_settings'), short: 'Settings' }
  };

  const roles = [
    { username: 'admin', role: 'Admin', label: 'Admin', desc: 'Everything, including staff & access' },
    { username: 'manager', role: 'Manager', label: 'Manager', desc: 'Parts and B2B orders' },
    { username: 'operator', role: 'Operator', label: 'Operator', desc: 'Sales entry only' },
    { username: 'sales', role: 'Sales Representative', label: 'Sales representative', desc: 'Sales and documents' }
  ];

  const currentTitle = tabTitles[activeTab] || { full: 'AutoSuite ERP', short: 'AutoSuite' };
  const totalNotifCount = notifications.lowStock + (notifications.docs > 0 ? 1 : 0);

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
              {t('main_campus')}
            </span>
            <span className="subtitle-divider">·</span>
            <span className="header-time font-mono">{currentTime}</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Command Palette Trigger (Task 8) */}
        <button
          className="header-icon-action-btn"
          onClick={onOpenCommandPalette}
          title="Search (Ctrl+K)"
        >
          <Search size={16} />
          <span className="text-xs font-mono hidden md:inline ml-1">Ctrl+K</span>
        </button>

        {/* Language Switcher (Task 15) */}
        <button
          className="header-icon-action-btn lang-toggle-btn"
          onClick={toggleLanguage}
          title="Toggle Roman Urdu / English"
        >
          <Globe size={16} />
          <span className="text-xs font-semibold uppercase">{lang}</span>
        </button>

        {/* Theme Switcher (Task 6) */}
        <button
          className="header-icon-action-btn theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={17} className="text-amber" /> : <Moon size={17} className="text-cyan" />}
        </button>

        {/* Notifications Center (Task 8) */}
        <div className="notification-center-wrap relative" ref={notifRef}>
          <button
            className="header-icon-action-btn relative"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell size={17} />
            {totalNotifCount > 0 && (
              <span className="notification-dot-badge">{totalNotifCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown-menu glass-panel slide-in">
              <div className="dropdown-header flex items-center justify-between border-b border-line-soft pb-2 mb-2">
                <span className="font-semibold text-xs">System Alerts</span>
                <span className="glass-badge badge-cyan text-xs">{totalNotifCount} active</span>
              </div>

              <div className="notif-items-list">
                {notifications.lowStock > 0 && (
                  <div className="notif-item flex items-center gap-2 p-2 hover:bg-surface-2 rounded text-xs">
                    <AlertTriangle size={15} className="text-rose shrink-0" />
                    <div>
                      <strong className="block text-main">{notifications.lowStock} spare parts low on stock</strong>
                      <span className="text-muted">Reorder thresholds triggered</span>
                    </div>
                  </div>
                )}

                {notifications.docs > 0 && (
                  <div className="notif-item flex items-center gap-2 p-2 hover:bg-surface-2 rounded text-xs mt-1">
                    <FileCheck2 size={15} className="text-cyan shrink-0" />
                    <div>
                      <strong className="block text-main">{notifications.docs} vehicle registrations pending</strong>
                      <span className="text-muted">Excise & allotment paperwork</span>
                    </div>
                  </div>
                )}

                {totalNotifCount === 0 && (
                  <div className="p-4 text-center text-xs text-muted">
                    No active alerts. All systems running normally.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Online Status */}
        <div className="glass-badge badge-emerald system-status-badge hidden sm:flex" title="Connected to database">
          <Activity size={12} className="live-activity-icon" />
          <span className="status-text">{t('system_online')}</span>
        </div>

        {/* Role Switcher */}
        <div className="rbac-switcher" ref={dropdownRef}>
          <div className="role-dropdown-container">
            <button
              className="role-selector-btn"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              title="Change role"
            >
              <span
                className={`glass-badge ${
                  user?.role === 'Admin'
                    ? 'badge-rose'
                    : user?.role === 'Manager'
                    ? 'badge-purple'
                    : user?.role === 'Operator'
                    ? 'badge-cyan'
                    : 'badge-emerald'
                }`}
              >
                {user?.role || 'Guest'}
              </span>
              <ChevronDown
                size={14}
                style={{ transform: showRoleMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.16s ease' }}
              />
            </button>

            {showRoleMenu && (
              <div className="role-dropdown-menu">
                <div className="dropdown-header">Switch Role</div>
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
                        <span className="role-user text-xs text-muted">{r.desc}</span>
                      </div>
                      {isSelected && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
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