import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../config/axios';
import '../css/ManagePartners.css';
import { API_URL } from '../config/api';

const ManagePartners = () => {
  const { t } = useTranslation();
  const { webshopId } = useParams();
  const navigate = useNavigate();
  
  const [webshop, setWebshop] = useState(null);
  const [partners, setPartners] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebshopData();
    fetchPartners();
    fetchAvailableTeachers();
  }, [webshopId]);

  const fetchWebshopData = async () => {
    try {
      const response = await apiClient.get(`${API_URL}/webshop/${webshopId}`);
      console.log('📦 Webshop data:', response.data);
      setWebshop(response.data || null);
    } catch (error) {
      console.error('❌ Error fetching webshop:', error);
      setError(t('Hiba történt a webshop betöltése közben.'));
    }
  };

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${API_URL}/webshop/${webshopId}/partners`);
      
      console.log('👥 Partners response:', response);
      console.log('👥 Partners data:', response.data);
      console.log('👥 Partners type:', typeof response.data);
      console.log('👥 Is array?', Array.isArray(response.data));
      
      const partnersData = response.data || [];
      
      const partnersArray = Array.isArray(partnersData) ? partnersData : [];
      
      console.log('👥 Final partners array:', partnersArray);
      
      setPartners(partnersArray);
    } catch (error) {
      console.error('❌ Error fetching partners:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      
      if (error.response?.status === 403) {
        setError(t('Nincs jogosultságod a partnerek megtekintéséhez.'));
      } else {
        setError(t('Hiba történt a partnerek betöltése közben.'));
      }
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTeachers = async () => {
    try {
      const response = await apiClient.get(`${API_URL}/auth/teachers`);
      console.log('👨‍🏫 Teachers response:', response.data);
      console.log('👨‍🏫 Response type:', typeof response.data);
      console.log('👨‍🏫 Is array?:', Array.isArray(response.data));
      
      const teachers = Array.isArray(response.data) ? response.data : [];
      console.log('👨‍🏫 Teachers count:', teachers.length);
      console.log('👨‍🏫 Teachers:', teachers);
      
      setAvailableTeachers(teachers);
    } catch (error) {
      console.error('❌ Error fetching teachers:', error);
      console.error('❌ Error response:', error.response);
      setAvailableTeachers([]);
    }
  };

  const handleAddPartner = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTeacherId) {
      setError(t('Válassz egy tanárt a partnerek közé!'));
      return;
    }

    try {
      console.log('➕ Adding partner:', selectedTeacherId);
      const response = await apiClient.post(`${API_URL}/webshop/${webshopId}/partners`, {
        partner_teacher_id: parseInt(selectedTeacherId)
      });
      
      console.log('✅ Partner added:', response.data);
      
      setSuccess(t('Partner sikeresen hozzáadva!'));
      closeAddModal();
      fetchPartners();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error adding partner:', error);
      console.error('❌ Error response:', error.response?.data);
      setError(error.response?.data?.message || t('Hiba történt a partner hozzáadása közben.'));
    }
  };

  const handleRemovePartner = async (partnerId) => {
    if (!window.confirm(t('Biztosan el szeretnéd távolítani ezt a partnert?'))) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      console.log('➖ Removing partner:', partnerId);
      await apiClient.delete(`${API_URL}/webshop/${webshopId}/partners/${partnerId}`);
      
      setSuccess(t('Partner sikeresen eltávolítva!'));
      fetchPartners();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error removing partner:', error);
      setError(error.response?.data?.message || t('Hiba történt a partner eltávolítása közben.'));
    }
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedTeacherId('');
    document.body.style.overflow = 'unset';
  };

  const getFilteredTeachers = () => {
    if (!webshop || !Array.isArray(availableTeachers) || !Array.isArray(partners)) {
      console.log('⚠️ Cannot filter teachers - missing data');
      console.log('⚠️ Webshop:', webshop);
      console.log('⚠️ AvailableTeachers:', availableTeachers);
      console.log('⚠️ Partners:', partners);
      return [];
    }
    
    const partnerIds = partners
      .filter(p => p && p.user_id)
      .map(p => Number(p.user_id));
    
    const ownerId = Number(webshop.teacher_id);
    
    console.log('🔍 Filtering teachers:');
    console.log('🔍 Owner ID (number):', ownerId, typeof ownerId);
    console.log('🔍 Partner IDs (numbers):', partnerIds);
    console.log('🔍 Available teachers:', availableTeachers.map(t => ({ id: t.user_id, type: typeof t.user_id, name: t.username || t.email })));
    
    const filtered = availableTeachers.filter(teacher => {
      if (!teacher || !teacher.user_id) {
        console.log('❌ Skipping invalid teacher:', teacher);
        return false;
      }
      
      const teacherId = Number(teacher.user_id);
      const isOwner = teacherId === ownerId;
      const isPartner = partnerIds.includes(teacherId);
      
      console.log(`🔍 Teacher ${teacher.username || teacher.email} (ID: ${teacherId}): owner=${isOwner}, partner=${isPartner}`);
      
      return !isOwner && !isPartner;
    });
    
    console.log('🔍 Final filtered teachers:', filtered.map(t => ({ id: t.user_id, name: t.username || t.email })));
    return filtered;
  };

  const getUsername = (user) => {
    if (!user) return '?';
    return user.username || user.email || 'Névtelen';
  };

  const getEmail = (user) => {
    if (!user) return 'N/A';
    return user.email || 'Nincs email';
  };

  if (loading && !webshop) {
    return (
      <div className="manage-partners">
        <div className="loading">{t('Betöltés...')}</div>
      </div>
    );
  }

  return (
    <div className="manage-partners">
      <div className="partners-header">
        <button className="back-btn" onClick={() => navigate('/teacher-dashboard')}>
          ← {t('Vissza')}
        </button>
        <h1>{t('Partner Kezelés')}</h1>
        {webshop && (
          <p className="webshop-name">
            {webshop.subject_name || 'Webshop'}
          </p>
        )}
      </div>

      {error && <div className="message error-message">{error}</div>}
      {success && <div className="message success-message">{success}</div>}

      <div className="partners-section">
        <div className="section-header">
          <h2>{t('Jelenlegi Partnerek')}</h2>
          <button className="add-partner-btn" onClick={openAddModal}>
            + {t('Partner Hozzáadása')}
          </button>
        </div>

        {loading ? (
          <div className="loading">{t('Betöltés...')}</div>
        ) : !Array.isArray(partners) || partners.length === 0 ? (
          <div className="no-partners">
            <p>{t('Még nincsenek partnerek ehhez a webshophoz.')}</p>
            <button className="add-first-partner-btn" onClick={openAddModal}>
              {t('Adj hozzá egy partnert!')}
            </button>
          </div>
        ) : (
          <div className="partners-grid">
            {partners.map((partner, index) => {
              if (!partner || !partner.user_id) {
                console.warn('⚠️ Invalid partner at index', index, partner);
                return null;
              }
              
              const username = getUsername(partner);
              const email = getEmail(partner);
              
              return (
                <div key={partner.user_id} className="partner-card">
                  <div className="partner-info">
                    <div className="partner-avatar">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <div className="partner-details">
                      <h3>{username}</h3>
                      <p className="partner-email">{email}</p>
                      <span className="partner-role">
                        {partner.role === 'admin' ? t('Admin') : t('Tanár')}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="remove-partner-btn"
                    onClick={() => handleRemovePartner(partner.user_id)}
                  >
                    {t('Eltávolítás')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {webshop && webshop.teacher && (
        <div className="owner-section">
          <div className="section-header">
            <h2>{t('Tulajdonos')}</h2>
          </div>
          <div className="owner-card">
            <div className="owner-info">
              <div className="owner-avatar">
                {getUsername(webshop.teacher).charAt(0).toUpperCase()}
              </div>
              <div className="owner-details">
                <h3>{getUsername(webshop.teacher)}</h3>
                <p className="owner-email">{getEmail(webshop.teacher)}</p>
                <span className="owner-badge">{t('Tulajdonos')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeAddModal}>×</button>
            <h2 className="modal-title">{t('Partner Hozzáadása')}</h2>
            
            <form onSubmit={handleAddPartner}>
              <div className="form-group">
                <label htmlFor="teacher_select">{t('Válassz tanárt')}</label>
                <select
                  id="teacher_select"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                >
                  <option value="">{t('-- Válassz --')}</option>
                  {getFilteredTeachers().map((teacher) => (
                    <option key={teacher.user_id} value={teacher.user_id}>
                      {getUsername(teacher)} ({getEmail(teacher)})
                    </option>
                  ))}
                </select>
              </div>

              {getFilteredTeachers().length === 0 && (
                <p className="no-teachers-message">
                  {t('Nincs több elérhető tanár, akit hozzá lehetne adni partnerként.')}
                </p>
              )}

              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={!selectedTeacherId || getFilteredTeachers().length === 0}
                >
                  {t('Hozzáadás')}
                </button>
                <button type="button" className="cancel-btn" onClick={closeAddModal}>
                  {t('Mégse')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePartners;