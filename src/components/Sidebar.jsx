import React from 'react';
import { 
  LayoutDashboard, 
  Bike, 
  ReceiptText, 
  FileCheck2, 
  Wrench, 
  FileSpreadsheet, 
  ShieldCheck, 
  UserCheck,
  Users,
  X,
  Sparkles,
  Cpu
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
      label: 'Motorcycle Stock',
      icon: Bike,
      show: hasPermission('MANAGE_BIKES') || hasPermission('READ_SALES')
    },
    {
      id: 'sales',
      label: 'Sales & Billing',
      icon: ReceiptText,
      show: hasPermission('CREATE_SALE') || hasPermission('READ_SALES')
    },
    {
      id: 'customers',
      label: 'Customer Records',
      icon: Users,
      show: hasPermission('READ_SALES') || hasPermission('CREATE_SALE')
    },
    {
      id: 'documents',
      label: 'Motorcycle Letters',
      icon: FileCheck2,
      show: hasPermission('MANAGE_DOCS')
    },
    {
      id: 'parts',
      label: 'Spare Parts (B2B)',
      icon: Wrench,
      show: hasPermission('MANAGE_PARTS')
    },
    {
      id: 'reports',
      label: 'Reports & Exports',
      icon: FileSpreadsheet,
      show: hasPermission('VIEW_REPORTS') || hasPermission('EXPORT_EXCEL')
    },
    {
      id: 'users',
      label: 'Staff & RBAC',
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
            <Bike size={24} color="#38bdf8" />
          </div>
          <div>
            <h2>AutoSuite</h2>
            <span className="brand-tagline">
              <Sparkles size={11} /> Enterprise ERP
            </span>
          </div>
        </div>
        {onCloseMobile && (
          <button 
            className="sidebar-close-btn" 
            onClick={onCloseMobile}
            aria-label="Close sidebar"
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
          <div className="user-name">{user?.name || 'Staff User'}</div>
          <span className={`glass-badge ${
            user?.role === 'Admin' ? 'badge-rose' :
            user?.role === 'Manager' ? 'badge-purple' :
            user?.role === 'Operator' ? 'badge-cyan' : 'badge-emerald'
          }`}>
            <UserCheck size={11} /> {user?.role}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Operations</div>
        {navItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="nav-icon" />
              <span>{item.label}</span>
              {isActive && <div className="active-indicator" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <span className="status-dot"></span>
          <span>Atlas Honda Authorized Sync</span>
        </div>
        <div className="system-version">
          <span>Engine v2.4.0</span>
          <span className="text-cyan">14ms latency</span>
        </div>
      </div>
    </aside>
  );
}
