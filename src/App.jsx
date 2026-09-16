import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Customers from './components/Customers';
import Documents from './components/Documents';
import Parts from './components/Parts';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import { LogIn, Bike, ShieldAlert, Shield } from 'lucide-react';
import './App.css';

function MainApp() {
  const { user, loading, login, switchUser, hasPermission, isRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Shortcuts
  const [openNewSale, setOpenNewSale] = useState(false);
  const [openNewBike, setOpenNewBike] = useState(false);

  // Fallback to allowed tab if current tab becomes unauthorized on role switch
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'users' && !isRole('Admin')) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'parts' && !hasPermission('MANAGE_PARTS')) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'documents' && !hasPermission('MANAGE_DOCS')) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'inventory' && !hasPermission('MANAGE_BIKES') && !hasPermission('READ_SALES')) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'reports' && !hasPermission('VIEW_REPORTS') && !hasPermission('EXPORT_EXCEL')) {
      setActiveTab('dashboard');
    }
  }, [user, activeTab]);

  if (loading) {
    return (
      <div className="full-screen-loader">
        <div className="spinner"></div>
        <h2>Loading AutoSuite</h2>
        <span className="text-muted text-xs">Checking your account and permissions</span>
      </div>
    );
  }

  // If logged out, render sleek login portal
  if (!user) {
    return <LoginPortal onLogin={login} />;
  }

  return (
    <div className="app-layout">
      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="app-main-content">
        <Header
          activeTab={activeTab}
          onOpenMobile={() => setIsMobileSidebarOpen(true)}
        />

        <main className="module-container">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onOpenNewSale={() => {
                setActiveTab('sales');
                setOpenNewSale(true);
              }}
              onOpenNewBike={() => {
                setActiveTab('inventory');
                setOpenNewBike(true);
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <Inventory
              isOpenAddModal={openNewBike}
              onCloseAddModal={() => setOpenNewBike(false)}
            />
          )}

          {activeTab === 'sales' && (
            <Sales
              isOpenNewSaleModal={openNewSale}
              onCloseNewSaleModal={() => setOpenNewSale(false)}
            />
          )}

          {activeTab === 'customers' && <Customers />}

          {activeTab === 'documents' && <Documents />}

          {activeTab === 'parts' && (
            hasPermission('MANAGE_PARTS') ? (
              <Parts />
            ) : (
              <UnauthorizedWarning
                module="Spare Parts Management (Manager / Admin Role Required)"
                onSwitchAdmin={() => switchUser('admin')}
              />
            )
          )}

          {activeTab === 'reports' && <Reports />}

          {activeTab === 'users' && (
            isRole('Admin') ? (
              <UserManagement />
            ) : (
              <UnauthorizedWarning
                module="User & RBAC Administration (Admin Role Required)"
                onSwitchAdmin={() => switchUser('admin')}
              />
            )
          )}
        </main>
      </div>
    </div>
  );
}

function UnauthorizedWarning({ module, onSwitchAdmin }) {
  return (
    <div className="unauthorized-card glass-panel">
      <ShieldAlert size={28} className="mb-3" />
      <h3>You don't have access to this</h3>
      <p>{module} is limited to other roles. Switch accounts to continue.</p>
      <p className="text-muted text-xs mt-2">
        Use the account switcher in the top right to change role.
      </p>
      {onSwitchAdmin && (
        <button className="btn btn-secondary mt-3" onClick={onSwitchAdmin}>
          <Shield size={16} /> Switch to Admin
        </button>
      )}
    </div>
  );
}

function LoginPortal({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  };

  const quickLogins = [
    { label: 'Full access', u: 'admin', p: 'admin123', color: 'badge-rose' },
    { label: 'Parts and B2B orders', u: 'manager', p: 'manager123', color: 'badge-purple' },
    { label: 'Sales entry only', u: 'operator', p: 'operator123', color: 'badge-cyan' },
    { label: 'Sales and documents', u: 'sales', p: 'sales123', color: 'badge-emerald' }
  ];

  return (
    <div className="login-portal-bg">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-brand-icon">
            <Bike size={22} />
          </div>
          <h2>AutoSuite</h2>
          <p>Dealership inventory, sales and accounts</p>
        </div>

        {error && <div className="modal-error-banner mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
              placeholder="e.g. admin"
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block mt-3" disabled={submitting}>
            <LogIn size={16} /> {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="quick-access-section mt-4">
          <div className="section-title text-xs">Or sign in with a demo account</div>
          <div className="quick-accounts-grid mt-2">
            {quickLogins.map((q) => (
              <button
                key={q.u}
                type="button"
                className="quick-account-btn"
                onClick={() => {
                  setUsername(q.u);
                  setPassword(q.p);
                  onLogin(q.u, q.p);
                }}
              >
                <span className={`glass-badge ${q.color} text-xs`}>{q.u}</span>
                <span className="quick-label text-xs">{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}