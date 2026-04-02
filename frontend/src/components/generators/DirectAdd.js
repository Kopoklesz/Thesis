import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';
import '../../css/generators/DirectAdd.css';

export default function DirectAdd({ onSuccess }) {
  const { t } = useTranslation();
  const [webshops, setWebshops] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedWebshop, setSelectedWebshop] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [amount, setAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWebshops();
    fetchStudents();
  }, []);

  const fetchWebshops = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.WEBSHOP}/my-webshops`);
      const activeShops = response.data.filter(shop => shop.status === 'active');
      setWebshops(activeShops);
    } catch (error) {
      console.error('Error fetching webshops:', error);
      setError(t('Hiba történt a webshopok betöltése közben.'));
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.BASE}/signature/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError(t('Hiba történt a hallgatók betöltése közben.'));
    }
  };

  const handleWebshopSelect = (webshop) => {
    setSelectedWebshop(webshop);
    setError('');
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredStudentIds = filteredStudents.map(s => s.user_id);
    if (selectedStudents.length === filteredStudentIds.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudentIds);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedWebshop) {
      setError(t('Kérjük válassz webshopot!'));
      return;
    }

    if (selectedStudents.length === 0) {
      setError(t('Kérjük válassz ki legalább egy hallgatót!'));
      return;
    }

    if (!amount || amount <= 0) {
      setError(t('Kérjük adj meg érvényes összeget!'));
      return;
    }

    setLoading(true);

    try {
      await apiClient.post(`${API_ENDPOINTS.BASE}/signature/add-balance-direct`, {
        webshopId: selectedWebshop.webshop_id,
        userIds: selectedStudents,
        amount: parseFloat(amount)
      });

      onSuccess(t(`Egyenleg sikeresen hozzáadva ${selectedStudents.length} hallgatónak!`));
      
      // Reset
      setSelectedStudents([]);
      setAmount('');
      setSearchTerm('');
      
    } catch (error) {
      console.error('Error adding balance:', error);
      setError(error.response?.data?.message || t('Hiba történt az egyenleg hozzáadása közben.'));
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="direct-add">
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="direct-add-form">
        <div className="form-section">
          <div className="section-header">
            <h3>{t('1. Webshop kiválasztása')}</h3>
          </div>

          {webshops.length === 0 ? (
            <div className="no-webshops">
              <span className="no-webshops-icon">🏪</span>
              <p>{t('Nincs aktív webshop')}</p>
            </div>
          ) : (
            <div className="webshop-selector">
              {webshops.map((webshop) => (
                <div
                  key={webshop.webshop_id}
                  className={`webshop-option ${selectedWebshop?.webshop_id === webshop.webshop_id ? 'selected' : ''}`}
                  onClick={() => handleWebshopSelect(webshop)}
                >
                  <div className="webshop-color" style={{ backgroundColor: webshop.header_color_code }}></div>
                  <div className="webshop-details">
                    <span className="webshop-name">{webshop.subject_name}</span>
                    <span className="webshop-currency">{webshop.paying_instrument}</span>
                  </div>
                  {selectedWebshop?.webshop_id === webshop.webshop_id && (
                    <span className="check-icon">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedWebshop && (
          <div className="form-section">
            <div className="section-header">
              <h3>{t('2. Összeg megadása')}</h3>
            </div>

            <div className="amount-input-group">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('Összeg')}
                className="amount-input"
              />
              <span className="currency-badge">{selectedWebshop.paying_instrument}</span>
            </div>
          </div>
        )}

        {selectedWebshop && amount && (
          <div className="form-section">
            <div className="section-header">
              <h3>{t('3. Hallgatók kiválasztása')}</h3>
              <span className="selected-count">
                {selectedStudents.length} / {filteredStudents.length} {t('kiválasztva')}
              </span>
            </div>

            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('Keresés Neptune kód alapján...')}
                className="search-input"
              />
            </div>

            <div className="select-all-container">
              <button
                type="button"
                onClick={handleSelectAll}
                className="select-all-btn"
              >
                {selectedStudents.length === filteredStudents.length
                  ? t('Összes kijelölés törlése')
                  : t('Összes kijelölése')}
              </button>
            </div>

            <div className="students-list">
              {filteredStudents.length === 0 ? (
                <div className="no-results">
                  <p>{t('Nincs találat')}</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.user_id}
                    className={`student-item ${selectedStudents.includes(student.user_id) ? 'selected' : ''}`}
                    onClick={() => handleStudentToggle(student.user_id)}
                  >
                    <div className="student-checkbox">
                      {selectedStudents.includes(student.user_id) && <span>✓</span>}
                    </div>
                    <div className="student-info">
                      <span className="student-username">{student.username}</span>
                      <span className="student-email">{student.email}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {selectedWebshop && amount && selectedStudents.length > 0 && (
          <div className="form-section summary-section">
            <div className="summary-card">
              <h3>{t('Összegzés')}</h3>
              <div className="summary-details">
                <div className="summary-row">
                  <span>{t('Webshop')}:</span>
                  <strong>{selectedWebshop.subject_name}</strong>
                </div>
                <div className="summary-row">
                  <span>{t('Hallgatók száma')}:</span>
                  <strong>{selectedStudents.length} fő</strong>
                </div>
                <div className="summary-row">
                  <span>{t('Összeg/fő')}:</span>
                  <strong>{amount} {selectedWebshop.paying_instrument}</strong>
                </div>
                <div className="summary-row total">
                  <span>{t('Összes kiosztott egyenleg')}:</span>
                  <strong className="total-value">
                    {(selectedStudents.length * parseFloat(amount)).toFixed(2)} {selectedWebshop.paying_instrument}
                  </strong>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? t('Hozzáadás...') : t('Egyenleg Hozzáadása')}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}