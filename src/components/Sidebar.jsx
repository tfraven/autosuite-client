import React from 'react';
import {
  LayoutDashboard,
  Bike,
  ReceiptText,
  FileCheck2,
  Wrench,
  FileSpreadsheet,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, isMobileOpen, onCloseMobile }) {
  const { user, hasPermission, isRole } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      id: 'inventory',
      label: 'Motorcycle stock',
      icon: Bike,
      show: hasPermission('MANAGE_BIKES') || hasPermission('READ_SALES')
    },
    {
      id: 'sales',
      label: 'Sales and billing',
      icon: ReceiptText,
      show: hasPermission('CREATE_SALE') || hasPermission('READ_SALES')
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      show: hasPermission('READ_SALES') || hasPermission('CREATE_SALE')
    },
    {
      id: 'documents',
      label: 'Letters and documents',
      icon: FileCheck2,
      show: hasPermission('MANAGE_DOCS')
    },
    {
      id: 'parts',
      label: 'Spare parts',
      icon: Wrench,
      show: hasPermission('MANAGE_PARTS')
    },
    {
      id: 'reports',
      label: 'Reports and exports',
      icon: FileSpreadsheet,
      show: hasPermission('VIEW_REPORTS') || hasPermission('EXPORT_EXCEL')
    },
    {
      id: 'users',
      label: 'Staff and access',
      icon: ShieldCheck,
      show: isRole('Admin')
    }
  ];

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside className={`sidebar no-print ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Bike size={18} />
          </div>
          <div>
            <h2>AutoSuite</h2>
            <span className="brand-tagline">Falcon Honda Motors</span>
          </div>
        </div>
        {onCloseMobile && (
          <button
            className="sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="user-role-card">
        <div className="user-avatar">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.name || 'Staff user'}</div>
          <span className={`glass-badge ${user?.role === 'Admin' ? 'badge-rose' :
            user?.role === 'Manager' ? 'badge-purple' :
              user?.role === 'Operator' ? 'badge-cyan' : 'badge-emerald'
            }`}>
            {user?.role}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`nav-link ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={17} className="nav-icon" />
              <span>{item.label}</span>
              {isActive && <div className="active-indicator" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <span className="status-dot"></span>
          <span>Connected to Atlas Honda</span>
        </div>
        <div className="system-version">
          <span>Version 2.4.0</span>
        </div>
      </div>
    </aside>
  );
}