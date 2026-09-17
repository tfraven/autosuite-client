import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  Users,
  Plus,
  Check,
  Activity,
  CheckCircle2,
  Edit3,
  Trash2,
  Shield,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from './Pagination';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('users'); // users, roles, audit
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Page View States (null | 'add-user' | 'role-form')
  const [subView, setSubView] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // User form
  const [userFormData, setUserFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    roleId: '',
    active: true
  });

  // Role form
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissionIds: []
  });

  const fetchRBACData = async () => {
    try {
      setLoading(true);
      const userParams = { page, limit };
      if (searchQuery) userParams.search = searchQuery;

      const [usersRes, rolesRes, permsRes, logsRes] = await Promise.all([
        api.getUsers(userParams).catch(() => ({ data: [], pagination: { total: 0, totalPages: 1 } })),
        api.getRoles().catch(() => []),
        api.getPermissions().catch(() => []),
        api.getAuditLogs({ limit: 50 }).catch(() => [])
      ]);

      // Handle flexible API responses for users
      if (usersRes && usersRes.pagination) {
        setUsers(usersRes.data || usersRes.users || []);
        setTotalPages(usersRes.pagination.totalPages || 1);
        setTotalCount(usersRes.pagination.total || 0);
      } else {
        const list = Array.isArray(usersRes) ? usersRes : [];
        setUsers(list);
        setTotalCount(list.length);
        setTotalPages(1);
      }

      setRoles(Array.isArray(rolesRes) ? rolesRes : []);
      setPermissions(Array.isArray(permsRes) ? permsRes : []);
      setAuditLogs(Array.isArray(logsRes) ? logsRes : []);
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
      toast.error('Failed to load management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRBACData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchQuery]);

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, userFormData);
        toast.success(`User ${userFormData.name} updated successfully.`);
      } else {
        await api.createUser(userFormData);
        toast.success(`New staff user account ${userFormData.username} created!`);
      }
      setSubView(null);
      setEditingUser(null);
      setUserFormData({ username: '', name: '', email: '', password: '', roleId: '', active: true });
      fetchRBACData();
    } catch (err) {
      toast.error(err.message || 'Failed to save user account');
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, roleFormData);
        toast.success(`Role ${roleFormData.name} updated successfully.`);
      } else {
        await api.createRole(roleFormData);
        toast.success(`New role ${roleFormData.name} created!`);
      }
      setSubView(null);
      setEditingRole(null);
      setRoleFormData({ name: '', description: '', permissionIds: [] });
      fetchRBACData();
    } catch (err) {
      toast.error(err.message || 'Failed to save role');
    }
  };

  const openEditRole = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions ? role.permissions.map(p => p.id) : []
    });
    setSubView('role-form');
  };

  const togglePermissionSelection = (pId) => {
    setRoleFormData(prev => {
      const exists = prev.permissionIds.includes(pId);
      return {
        ...prev,
        permissionIds: exists
          ? prev.permissionIds.filter(id => id !== pId)
          : [...prev.permissionIds, pId]
      };
    });
  };

  // ---------------------------------------------------------------------------
  // SUB-VIEWS: Add/Edit User & Role Forms (Full-page layout for better UX)
  // ---------------------------------------------------------------------------
  if (subView === 'add-user') {
    return (
      <div className="usermgmt-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={() => {
              setSubView(null);
              setEditingUser(null);
              setUserFormData({ username: '', name: '', email: '', password: '', roleId: '', active: true });
            }}>
              <ArrowLeft size={16} /> Back to staff
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">{editingUser ? 'Edit staff member' : 'Add staff member'}</h2>
              <div className="page-form-subtitle">Set their login details and assign a role</div>
            </div>
          </div>

          <form onSubmit={handleSaveUser} className="page-form-container narrow">
            <div className="page-form-card">
              <div className="page-form-card-title">Account details</div>

              <div className="form-field mb-3">
                <label>Full name</label>
                <input
                  type="text"
                  placeholder="e.g. Bilal Farooq"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group-row">
                <div className="form-field">
                  <label>Username</label>
                  <input
                    type="text"
                    placeholder="e.g. operator2"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    required
                    disabled={!!editingUser}
                    className="form-input font-mono"
                  />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="bilal@autosuite.com"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-field">
                  <label>{editingUser ? 'New Password (Optional)' : 'Password'}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    required={!editingUser}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label>Role</label>
                  <select
                    value={userFormData.roleId}
                    onChange={(e) => setUserFormData({ ...userFormData, roleId: e.target.value })}
                    required
                    className="form-input"
                  >
                    <option value="">Select a role</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-field mb-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={userFormData.active}
                    onChange={(e) => setUserFormData({ ...userFormData, active: e.target.checked })}
                    className="perm-checkbox"
                  />
                  <span className="text-sm font-medium text-main">Active Account</span>
                </label>
              </div>

              <div className="page-form-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setSubView(null);
                  setEditingUser(null);
                  setUserFormData({ username: '', name: '', email: '', password: '', roleId: '', active: true });
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> {editingUser ? 'Update staff member' : 'Add staff member'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (subView === 'role-form') {
    return (
      <div className="usermgmt-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={() => setSubView(null)}>
              <ArrowLeft size={16} /> Back to roles
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">{editingRole ? ('Edit role: ' + editingRole.name) : 'Add role'}</h2>
              <div className="page-form-subtitle">Set which modules and actions this role can access</div>
            </div>
          </div>

          <form onSubmit={handleSaveRole} className="page-form-container">
            <div className="page-form-card">
              <div className="page-form-card-title">Role details</div>

              <div className="form-group-row">
                <div className="form-field" style={{ flex: 2 }}>
                  <label>Role name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales Representative"
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-field" style={{ flex: 3 }}>
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Restricted to showroom floor retail sales"
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="page-form-card">
              <div className="page-form-card-title">Permissions</div>
              <p className="text-muted text-xs mb-3">Choose what users with this role are allowed to do:</p>

              <div className="perms-checkbox-grid">
                {permissions.map((p) => {
                  const isChecked = roleFormData.permissionIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={'perm-toggle-card ' + (isChecked ? 'selected' : '')}
                      onClick={() => togglePermissionSelection(p.id)}
                    >
                      <div className="perm-toggle-header">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => { }}
                          className="perm-checkbox"
                        />
                        <span className="font-bold text-sm font-mono text-cyan">{p.name}</span>
                      </div>
                      <div className="perm-meta">
                        <span className="glass-badge badge-purple text-xs">{p.module}</span>
                        <p className="perm-desc-text text-xs text-muted mt-1">{p.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="page-form-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSubView(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Shield size={16} /> Save role
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN VIEW: Tabs for Users, Roles, and Audit
  // ---------------------------------------------------------------------------
  return (
    <div className="usermgmt-view">
      {/* Sub Tabs */}
      <div className="control-bar glass-panel mb-4">
        <div className="type-toggle">
          <button
            className={`toggle-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={15} /> Staff ({totalCount})
          </button>
          <button
            className={`toggle-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <ShieldCheck size={15} /> Roles ({roles.length})
          </button>
          <button
            className={`toggle-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <Activity size={15} /> Activity log
          </button>
        </div>

        <div className="action-group">
          {activeTab === 'users' && (
            <button className="btn btn-primary" onClick={() => {
              setEditingUser(null);
              setUserFormData({ username: '', name: '', email: '', password: '', roleId: '', active: true });
              setSubView('add-user');
            }}>
              <Plus size={16} /> Add staff
            </button>
          )}
          {activeTab === 'roles' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingRole(null);
                setRoleFormData({ name: '', description: '', permissionIds: [] });
                setSubView('role-form');
              }}
            >
              <Plus size={16} /> Add role
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Users (with Search & Pagination) */}
      {activeTab === 'users' && (
        <div className="card glass-panel no-print">
          <div className="control-bar" style={{ marginBottom: 0, borderBottom: '1px solid var(--line)', borderRadius: 0 }}>
            <div className="search-input-wrap" style={{ maxWidth: '320px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search username, name or email…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="search-input"
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name & Email</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="loading-cell">
                      <div className="spinner"></div> Loading staff users…
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className="font-mono text-cyan font-bold">@{u.username}</td>
                      <td>
                        <div className="font-bold text-main">{u.name}</div>
                        <div className="text-xs text-muted font-mono">{u.email}</div>
                      </td>
                      <td>
                        <span className={`glass-badge text-xs ${u.role?.name === 'Admin' ? 'badge-rose' :
                          u.role?.name === 'Manager' ? 'badge-purple' :
                            u.role?.name === 'Operator' ? 'badge-cyan' : 'badge-emerald'
                          }`}>
                          {u.role?.name || u.role || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`glass-badge ${u.active ? 'badge-emerald' : 'badge-rose'}`}
                          onClick={() => {
                            api.updateUser(u.id, { active: !u.active })
                              .then(() => {
                                toast.success(`User ${u.username} is now ${!u.active ? 'Active' : 'Deactivated'}`);
                                fetchRBACData();
                              })
                              .catch(err => toast.error(err.message || 'Failed to update status'));
                          }}
                          disabled={currentUser?.username === u.username}
                          title={currentUser?.username === u.username ? "Cannot deactivate yourself" : "Toggle status"}
                        >
                          {u.active ? 'Active' : 'Deactivated'}
                        </button>
                      </td>
                      <td className="text-xs text-muted">
                        {new Date(u.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="text-right">
                        <div className="table-actions flex items-center justify-end gap-1">
                          <button
                            className="btn-action-icon"
                            onClick={() => {
                              setEditingUser(u);
                              setUserFormData({
                                username: u.username,
                                name: u.name,
                                email: u.email,
                                password: '',
                                roleId: u.role?.id || '',
                                active: u.active
                              });
                              setSubView('add-user');
                            }}
                            title="Edit User"
                          >
                            <Edit3 size={15} />
                          </button>
                          {currentUser?.username !== u.username && (
                            <button
                              className="btn-action-icon text-rose"
                              onClick={() => setUserToDelete(u)}
                              title="Soft Delete User"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-placeholder">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={limit}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>
      )}

      {/* Tab 2: Roles Matrix */}
      {activeTab === 'roles' && (
        <div className="roles-grid">
          {roles.map((r) => (
            <div key={r.id} className="role-card glass-panel">
              <div className="role-card-header">
                <div>
                  <h4 className="role-title font-bold text-cyan">{r.name}</h4>
                  <p className="role-desc text-xs text-muted">{r.description || 'No description.'}</p>
                </div>
                <div className="role-actions">
                  <button className="action-icon-btn" onClick={() => openEditRole(r)} title="Edit role">
                    <Edit3 size={15} />
                  </button>
                </div>
              </div>

              <div className="role-user-count text-xs text-muted mt-2">
                {r.userCount || 0} staff assigned
              </div>

              <div className="role-perms-section mt-3">
                <div className="section-subtitle text-xs text-muted">Permissions</div>
                <div className="role-perms-list mt-2">
                  {r.name === 'Admin' ? (
                    <div className="perm-chip-admin">
                      <CheckCircle2 size={12} /> All permissions
                    </div>
                  ) : r.permissions && r.permissions.length > 0 ? (
                    r.permissions.map((p) => (
                      <span key={p.id} className="perm-chip">
                        <Check size={12} className="text-emerald" /> {p.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted text-xs">No permissions assigned yet.</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="card glass-panel">
          <div className="card-header">
            <h3>Activity log</h3>
            <span className="header-tag">Most recent first</span>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Details</th>
                  <th>IP address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length > 0 ? auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-muted text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="font-medium text-cyan">
                        {log.user?.username || 'System'}
                      </span>
                    </td>
                    <td>
                      <span className="glass-badge badge-amber">{log.action}</span>
                    </td>
                    <td>
                      <span className="glass-badge badge-purple">{log.module}</span>
                    </td>
                    <td className="text-sm">{log.details}</td>
                    <td className="font-mono text-muted text-xs">{log.ipAddress}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="empty-placeholder">No audit logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GitHub-Style Soft Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Soft Delete User Account"
        itemName="Staff Account"
        targetValue={userToDelete?.username || ''}
        promptLabel="Type exact username to confirm soft deletion:"
        onConfirm={async () => {
          if (!userToDelete) return;
          try {
            await api.deleteUser(userToDelete.id);
            toast.success(`User @${userToDelete.username} soft-deleted.`);
            fetchRBACData();
          } catch (err) {
            toast.error(err.message || 'Failed to delete user');
          }
        }}
      />
    </div>
  );
}