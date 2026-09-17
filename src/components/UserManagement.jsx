import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Search,
  KeyRound,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from './Pagination';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { isRomanUrdu } = useLanguage();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Sub-views
  const [subView, setSubView] = useState(null); // 'add-user' | null
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    roleId: '',
    active: true
  });

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (searchQuery) params.search = searchQuery;

      const [usersRes, rolesRes] = await Promise.all([
        api.getUsers(params).catch(() => []),
        api.getRoles().catch(() => [])
      ]);

      if (usersRes.pagination) {
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
    } catch (err) {
      console.error('Error fetching user management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [searchQuery, page, limit]);

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, userForm);
        toast.success(`User ${userForm.name} updated successfully.`);
      } else {
        await api.createUser(userForm);
        toast.success(`New staff user account ${userForm.username} created!`);
      }
      setSubView(null);
      fetchUserData();
    } catch (err) {
      toast.error(err.message || 'Failed to save user account');
    }
  };

  return (
    <div className="user-management-view">
      <div className="control-bar glass-panel no-print mb-4">
        <div className="filter-group">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search username, name or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="action-group">
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingUser(null);
              setUserForm({
                username: '',
                name: '',
                email: '',
                password: '',
                roleId: roles[0]?.id || '',
                active: true
              });
              setSubView('add-user');
            }}
          >
            <Plus size={16} /> {isRomanUrdu ? 'Naya Staff User Shamil Karein' : 'Create User Account'}
          </button>
        </div>
      </div>

      <div className="card glass-panel no-print">
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
                      <span className="glass-badge badge-purple text-xs">
                        {u.role?.name || u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`glass-badge ${u.active ? 'badge-emerald' : 'badge-rose'}`}>
                        {u.active ? 'Active' : 'Disabled'}
                      </span>
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
                            setUserForm({
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
                        {u.id !== currentUser?.id && (
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

      {/* Add / Edit User Modal */}
      {subView === 'add-user' && (
        <div className="modal-overlay" onClick={() => setSubView(null)}>
          <div className="modal-container glass-panel slide-in max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User Account' : 'Create Staff Account'}</h3>
              <button className="modal-close-btn" onClick={() => setSubView(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-4">
              <div className="form-field mb-3">
                <label>Username</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  placeholder="e.g. sales_officer_1"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div className="form-field mb-3">
                <label>Full Legal Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ahmed Khan"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-field mb-3">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. ahmed@autosuite.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-field mb-3">
                <label>{editingUser ? 'New Password (Optional)' : 'Password'}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required={!editingUser}
                />
              </div>

              <div className="form-field mb-4">
                <label>Role & Permissions Assignment</label>
                <select
                  className="form-select"
                  value={userForm.roleId}
                  onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.description || 'Custom role'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer pt-3 border-t border-line-soft">
                <button type="button" className="btn btn-secondary" onClick={() => setSubView(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save User Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GitHub-Style Soft Delete Modal (Task 13) */}
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Soft Delete User Account"
        itemName="Staff Account"
        targetValue={userToDelete?.username || ''}
        promptLabel="Type exact username to confirm soft deletion:"
        onConfirm={async () => {
          if (!userToDelete) return;
          await api.deleteUser(userToDelete.id);
          toast.success(`User @${userToDelete.username} soft-deleted.`);
          fetchUserData();
        }}
      />
    </div>
  );
}