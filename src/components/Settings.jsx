import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  Sliders,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock,
  Phone,
  Clock,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { user, isRole } = useAuth();
  const { isRomanUrdu } = useLanguage();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password' | 'platform'

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Platform Settings Form
  const [platformSettings, setPlatformSettings] = useState({
    dealershipName: 'Falcon Honda Motors',
    dealershipBranch: 'Main Campus Showroom, Lahore',
    currency: 'PKR',
    invoicePrefix: 'INV-',
    defaultTaxRate: '0',
    lowStockThreshold: '5',
    timezone: 'Asia/Karachi',
    contactPhone: '+92 42 35990000',
    ntnNumber: '4829103-8',
    logRetentionDays: '90'
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        const data = await api.getSettings();
        if (data) {
          setPlatformSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-muted' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 33, label: 'Weak', color: 'bg-rose' };
    if (score <= 3) return { score: 66, label: 'Good', color: 'bg-amber' };
    return { score: 100, label: 'Strong', color: 'bg-emerald' };
  };

  const strength = getPasswordStrength(passwordForm.newPassword);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile(profileForm);
      toast.success(isRomanUrdu ? 'Profile kamyabi se update ho gaya' : 'Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(isRomanUrdu ? 'Naya password match nahi kar raha' : 'New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error(isRomanUrdu ? 'Password kam az kam 6 characters ka hona chahiye' : 'Password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success(isRomanUrdu ? 'Password tabdeel ho gaya!' : 'Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpdatePlatformSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateSettings(platformSettings);
      toast.success(isRomanUrdu ? 'Dealership settings mehfooz ho gayin' : 'Platform configuration saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="settings-view">
      {/* Top Header */}
      <div className="settings-header glass-panel mb-4">
        <div>
          <h2>{isRomanUrdu ? 'Settings aur Tarmeemat' : 'Platform & Account Settings'}</h2>
          <span className="text-xs text-muted">
            {isRomanUrdu
              ? 'Account profile, password aur dealership ki markazi settings'
              : 'Manage credentials, security preferences, and dealership configuration'}
          </span>
        </div>

        <div className="settings-tabs-bar">
          <button
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={15} />
            {isRomanUrdu ? 'Account Profile' : 'Account Profile'}
          </button>
          <button
            className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('password')}
          >
            <KeyRound size={15} />
            {isRomanUrdu ? 'Password Tabdeeli' : 'Security & Password'}
          </button>
          {isRole('Admin') && (
            <button
              className={`btn ${activeTab === 'platform' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('platform')}
            >
              <Sliders size={15} />
              {isRomanUrdu ? 'Dealership Settings' : 'Platform Config'}
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="settings-card glass-panel max-w-2xl">
          <div className="card-header border-b border-line-soft pb-3 mb-4">
            <h3>{isRomanUrdu ? 'Account Ki Maloomat' : 'User Account Profile'}</h3>
            <span className="text-xs text-muted">View and modify your public contact details</span>
          </div>

          <form onSubmit={handleUpdateProfile} className="settings-form">
            <div className="user-profile-badge-row flex items-center gap-3 p-3 bg-surface-2 rounded-md mb-4 border border-line-soft">
              <div className="user-avatar avatar-lg">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-base font-semibold">{user?.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="glass-badge badge-cyan text-xs">@{user?.username}</span>
                  <span className="glass-badge badge-purple text-xs">{user?.role}</span>
                </div>
              </div>
            </div>

            <div className="form-field mb-3">
              <label>{isRomanUrdu ? 'Username (Tabdeel nahi ho sakta)' : 'Username (System Identifier)'}</label>
              <input
                type="text"
                className="form-input font-mono"
                value={user?.username || ''}
                disabled
              />
            </div>

            <div className="form-field mb-3">
              <label>{isRomanUrdu ? 'Mukammal Naam' : 'Full Name'}</label>
              <input
                type="text"
                className="form-input"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-field mb-4">
              <label>{isRomanUrdu ? 'Email Address' : 'Email Address'}</label>
              <input
                type="email"
                className="form-input"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              <Save size={16} />
              {savingProfile ? 'Saving…' : (isRomanUrdu ? 'Profile Mehfooz Karein' : 'Save Profile Changes')}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Password Change */}
      {activeTab === 'password' && (
        <div className="settings-card glass-panel max-w-2xl">
          <div className="card-header border-b border-line-soft pb-3 mb-4">
            <h3>{isRomanUrdu ? 'Password Tabdeel Karein' : 'Change Password'}</h3>
            <span className="text-xs text-muted">Ensure your account uses a strong, complex password</span>
          </div>

          <form onSubmit={handleUpdatePassword} className="settings-form">
            <div className="form-field mb-3">
              <label>{isRomanUrdu ? 'Mojooda Password' : 'Current Password'}</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-field mb-3">
              <label>{isRomanUrdu ? 'Naya Password' : 'New Password (min 6 characters)'}</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
              {passwordForm.newPassword && (
                <div className="password-strength-indicator mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted">Strength: {strength.label}</span>
                    <span className="font-mono text-xs">{strength.score}%</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${strength.color}`} style={{ width: `${strength.score}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-field mb-4">
              <label>{isRomanUrdu ? 'Naye Password Ki Tasdeeq' : 'Confirm New Password'}</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingPassword}>
              <Lock size={16} />
              {savingPassword ? 'Updating…' : (isRomanUrdu ? 'Naya Password Mehfooz Karein' : 'Update Password')}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Platform Settings (Admin Only) */}
      {activeTab === 'platform' && isRole('Admin') && (
        <div className="settings-card glass-panel max-w-3xl">
          <div className="card-header border-b border-line-soft pb-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3>{isRomanUrdu ? 'Dealership Platform Configuration' : 'Dealership Platform Configuration'}</h3>
                <span className="text-xs text-muted">System-wide parameters for invoicing, branches, taxes and alerts</span>
              </div>
              <span className="glass-badge badge-purple text-xs">Admin Privilege</span>
            </div>
          </div>

          <form onSubmit={handleUpdatePlatformSettings} className="settings-form">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field">
                <label>{isRomanUrdu ? 'Dealership Ka Naam' : 'Dealership Entity Name'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={platformSettings.dealershipName}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, dealershipName: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label>{isRomanUrdu ? 'Branch Ka Pata' : 'Branch / Campus Location'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={platformSettings.dealershipBranch}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, dealershipBranch: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label>{isRomanUrdu ? 'Currency Symbol' : 'Currency Symbol'}</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  value={platformSettings.currency}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, currency: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label>{isRomanUrdu ? 'Invoice Prefix' : 'Invoice Number Prefix'}</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  value={platformSettings.invoicePrefix}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, invoicePrefix: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label>{isRomanUrdu ? 'Tax Rate (%)' : 'Default Sales Tax / GST (%)'}</label>
                <input
                  type="number"
                  className="form-input font-mono"
                  value={platformSettings.defaultTaxRate}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, defaultTaxRate: e.target.value })}
                  min="0"
                  max="100"
                  required
                />
              </div>

              <div className="form-field">
                <label>{isRomanUrdu ? 'Parts Low Stock Alert Level' : 'Low Stock Warning Threshold'}</label>
                <input
                  type="number"
                  className="form-input font-mono"
                  value={platformSettings.lowStockThreshold}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, lowStockThreshold: e.target.value })}
                  min="1"
                  required
                />
              </div>

              <div className="form-field">
                <label>{isRomanUrdu ? 'Timezone' : 'System Timezone'}</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  value={platformSettings.timezone}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, timezone: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label>{isRomanUrdu ? 'Rabta Phone' : 'Official Telephone'}</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  value={platformSettings.contactPhone}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="p-3 bg-surface-2 rounded-md border border-line-soft mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck size={16} className="text-emerald" />
                <span>
                  Audit Log Retention Standard: <strong>90 Days Guaranteed</strong>
                </span>
              </div>
              <span className="glass-badge badge-emerald text-xs">ISO Dealership Compliant</span>
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={savingSettings}>
              <Save size={16} />
              {savingSettings ? 'Saving Configuration…' : (isRomanUrdu ? 'Settings Mehfooz Karein' : 'Save Platform Settings')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
