import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios';
import { API_URL } from '../config/api';
import '../css/AdminPanel.css';

const AdminPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${API_URL}/auth/users`);
      setUsers(response.data);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('Hiba') });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDemo = async (userId, currentValue) => {
    try {
      await apiClient.put(`${API_URL}/auth/users/${userId}/demo`, { is_demo: !currentValue });
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_demo: !currentValue } : u));
      setMessage({ type: 'success', text: t('Demo mód sikeresen frissítve!') });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('Hiba') });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm(t('Biztosan törölni szeretnéd ezt a felhasználót?'))) return;
    try {
      await apiClient.delete(`${API_URL}/auth/users/${userId}`);
      setMessage({ type: 'success', text: t('Felhasználó sikeresen törölve!') });
      fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('Hiba') });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch = !searchTerm ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const roleLabels = [
    { value: 'all', label: t('Összes') },
    { value: 'student', label: t('role_student') },
    { value: 'teacher', label: t('role_teacher') },
    { value: 'admin', label: t('role_admin') },
  ];

  if (loading) {
    return <div className="admin-loading">{t('Betöltés...')}</div>;
  }

  return (
    <div className="admin-container">
      <h1>{t('Admin')}</h1>

      <div className="admin-section">
        <h2>{t('Felhasználó kezelés')}</h2>

        {message && (
          <div className={`admin-message ${message.type}`}>{message.text}</div>
        )}

        <div className="admin-filters">
          <div className="admin-role-filters">
            {roleLabels.map(rl => (
              <button
                key={rl.value}
                className={`role-filter-btn ${roleFilter === rl.value ? 'active' : ''}`}
                onClick={() => setRoleFilter(rl.value)}
              >
                {rl.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="admin-search"
            placeholder={t('Keresés...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('Neptun kód')}</th>
                <th>Email</th>
                <th>{t('Szerepkör')}</th>
                <th>{t('Dátum')}</th>
                <th>{t('Demo mód')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.user_id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>
                      {t(`role_${u.role}`)}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('hu-HU')}</td>
                  <td>
                    <label className="demo-toggle">
                      <input
                        type="checkbox"
                        checked={u.is_demo || false}
                        onChange={() => handleToggleDemo(u.user_id, u.is_demo)}
                      />
                      <span className="demo-toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <button
                      className="delete-user-btn"
                      onClick={() => handleDelete(u.user_id)}
                      disabled={user.user_id === u.user_id}
                      title={user.user_id === u.user_id ? t('Saját fiókot nem törölheted') : ''}
                    >
                      {t('Törlés')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
