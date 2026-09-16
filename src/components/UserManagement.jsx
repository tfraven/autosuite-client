import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck,
  ArrowLeft, 
  Users, 
  Plus, 
  Check, 
  KeyRound, 
  X, 
  Lock, 
  Activity, 
  CheckCircle2, 
  Edit3, 
  Trash2,
  Shield
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // users, roles, audit
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Page View States (null | 'add-user' | 'role-form')
  const [subView, setSubView] = useState(null);
  const [editingRole, setEditingRole] = useState(null);

  // User form
  const [userFormData, setUserFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    roleId: ''
  });

  // Role form
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissionIds: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, permsData, logsData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getPermissions(),
        api.getAuditLogs({ limit: 50 })
      ]);

      setUsers(usersData);
      setRoles(rolesData);
      setPermissions(permsData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(userFormData);
      setSubView(null);
      setUserFormData({ username: '', name: '', email: '', password: '', roleId: '' });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleToggleUserActive = async (user) => {
    try {
      await api.updateUser(user.id, { active: !user.active });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await api.deleteUser(userId);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, roleFormData);
      } else {
        await api.createRole(roleFormData);
      }
      setSubView(null);
      setEditingRole(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to save role');
    }
  };

  const openEditRole = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map(p => p.id)
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

    if (subView === 'add-user') {
    return (
      <div className="usermgmt-view">
        <div className="page-form-view">
          <div className="page-form-header">
            <button className="page-form-back-btn" onClick={() => setSubView(null)}>
              <ArrowLeft size={16} /> Back to Users
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">Create Staff Account</h2>
              <div className="page-form-subtitle">Register dealership employee, set system credentials, and assign role</div>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="page-form-container narrow">
            <div className="page-form-card">
              <div className="page-form-card-title">User Account Details</div>

              <div className="form-field">
                <label>Full Name *</label>
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
                  <label>Username *</label>
                  <input 
                    type="text"
                    placeholder="e.g. operator2"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    required
                    className="form-input font-mono"
                  />
                </div>
                <div className="form-field">
                  <label>Email Address *</label>
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
                  <label>Initial Password *</label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label>Assigned Role *</label>
                  <select
                    value={userFormData.roleId}
                    onChange={(e) => setUserFormData({ ...userFormData, roleId: e.target.value })}
                    required
                    className="form-input"
                  >
                    <option value="">-- Choose Role --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="page-form-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSubView(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Create User Account
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
              <ArrowLeft size={16} /> Back to Roles
            </button>
            <div className="page-form-title-group">
              <h2 className="page-form-title">{editingRole ? ('Configure Permissions: ' + editingRole.name) : 'Define Custom Role'}</h2>
              <div className="page-form-subtitle">Customize security privileges and granular module access control</div>
            </div>
          </div>

          <form onSubmit={handleSaveRole} className="page-form-container">
            <div className="page-form-card">
              <div className="page-form-card-title">Role Identification</div>

              <div className="form-group-row">
                <div className="form-field" style={{ flex: 2 }}>
                  <label>Role Name *</label>
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
                  <label>Role Scope Description</label>
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
              <div className="page-form-card-title">Granular Permission Matrix</div>
              <p className="text-muted text-xs mb-3">Select the exact action-level and route-level permissions granted to users with this role:</p>
              
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
                          onChange={() => {}}
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
                  <Shield size={16} /> Save Role Configuration
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

return (
    <div className="usermgmt-view">
      {/* Sub Tabs */}
      <div className="control-bar glass-panel mb-4">
        <div className="type-toggle">
          <button 
            className={`toggle-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={15} /> Employees & Accounts ({users.length})
          </button>
          <button 
            className={`toggle-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <ShieldCheck size={15} /> Roles & Permission Matrix ({roles.length})
          </button>
          <button 
            className={`toggle-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <Activity size={15} /> System Audit Logs
          </button>
        </div>

        <div className="action-group">
          {activeTab === 'users' && (
            <button className="btn btn-primary" onClick={() => setSubView('add-user')}>
              <Plus size={16} /> Add Employee User
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
              <Plus size={16} /> Define Custom Role
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Users */}
      {activeTab === 'users' && (
        <div className="card glass-panel">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Assigned Role</th>
                  <th>Permissions Summary</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-bold">{u.name}</div>
                      <div className="text-muted text-xs">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="font-mono text-cyan">{u.username}</td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <span className={`glass-badge ${
                        u.role.name === 'Admin' ? 'badge-rose' :
                        u.role.name === 'Manager' ? 'badge-purple' :
                        u.role.name === 'Operator' ? 'badge-cyan' : 'badge-emerald'
                      }`}>
                        {u.role.name}
                      </span>
                    </td>
                    <td>
                      <div className="perms-tag-cloud text-xs">
                        {u.role.name === 'Admin' ? (
                          <span className="badge-rose glass-badge">Full System Access (Unrestricted)</span>
                        ) : (
                          u.role.permissions.map((p, idx) => (
                            <span key={idx} className="glass-badge badge-muted mr-1 mb-1">
                              {p}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <button 
                        className={`glass-badge ${u.active ? 'badge-emerald' : 'badge-rose'}`}
                        onClick={() => handleToggleUserActive(u)}
                        disabled={currentUser?.username === u.username}
                      >
                        {u.active ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="text-right">
                      {currentUser?.username !== u.username && (
                        <button 
                          className="btn-action-icon text-rose"
                          onClick={() => handleDeleteUser(u.id)}
                          title="Delete User"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  <p className="role-desc text-xs text-muted">{r.description || 'No description provided.'}</p>
                </div>
                <div className="role-actions">
                  <button className="action-icon-btn" onClick={() => openEditRole(r)} title="Edit Permissions">
                    <Edit3 size={15} />
                  </button>
                </div>
              </div>

              <div className="role-user-count text-xs text-muted mt-2">
                <strong>Assigned Staff:</strong> {r.userCount} Active Users
              </div>

              <div className="role-perms-section mt-3">
                <div className="section-subtitle text-xs text-muted font-bold">GRANTED PERMISSIONS:</div>
                <div className="role-perms-list mt-2">
                  {r.name === 'Admin' ? (
                    <div className="perm-chip-admin">
                      <CheckCircle2 size={12} /> Master Root Bypass (All Action & Route Permissions)
                    </div>
                  ) : r.permissions.length > 0 ? (
                    r.permissions.map((p) => (
                      <span key={p.id} className="perm-chip">
                        <Check size={12} className="text-emerald" /> {p.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted text-xs">No permissions assigned.</span>
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
            <h3>Security & Activity Audit Logs</h3>
            <span className="header-tag">Live System Stream</span>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Activity Description</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-muted text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="font-bold text-cyan">
                        {log.user?.username || 'SYSTEM'}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

          </div>
  );
}
