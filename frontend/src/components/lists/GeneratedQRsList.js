import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';
import '../../css/lists/GeneratedQRsList.css';

export default function GeneratedQRsList() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [openEventId, setOpenEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGeneratedQRs();
  }, []);

  const fetchGeneratedQRs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.BASE}/signature/my-qrs`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching QRs:', error);
      setError(t('Hiba történt a QR kódok betöltése közben.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQR = async (qrId) => {
    if (!window.confirm(t('Biztosan törölni szeretnéd ezt a QR kódot?'))) {
      return;
    }

    try {
      await apiClient.delete(`${API_ENDPOINTS.BASE}/signature/qr/${qrId}`);
      fetchGeneratedQRs(); // Refresh list
    } catch (error) {
      console.error('Error deleting QR:', error);
      alert(t('Hiba történt a QR kód törlése közben.'));
    }
  };

  const toggleEvent = (eventId) => {
    setOpenEventId(openEventId === eventId ? null : eventId);
  };

  const isExpired = (date) => {
    return new Date(date) < new Date();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="list-loading">
        <div className="loading-spinner"></div>
        <p>{t('Betöltés...')}</p>
      </div>
    );
  }

  if (error) {
    return <div className="list-error">{error}</div>;
  }

  if (events.length === 0) {
    return (
      <div className="list-empty">
        <span className="empty-icon">📱</span>
        <p>{t('Még nincsenek generált QR kódok.')}</p>
      </div>
    );
  }

  return (
    <div className="generated-qrs-list">
      {events.map((event, index) => {
        const qr = event.qrs[0];
        if (!qr) return null;

        const expired = isExpired(event.expiryDate);
        const progress = (qr.currentActivations / qr.maxActivations) * 100;
        const remaining = qr.maxActivations - qr.currentActivations;

        return (
          <div key={event.eventId} className="qr-event">
            <div
              className={`event-header ${openEventId === event.eventId ? 'open' : ''}`}
              onClick={() => toggleEvent(event.eventId)}
            >
              <div className="event-main-info">
                <div className="event-title">
                  <span className="qr-icon">📱</span>
                  <div className="title-content">
                    <span className="event-name">{event.webshopName}</span>
                    <span className="event-badge">QR #{index + 1}</span>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-info">
                    <span className="progress-text">
                      {qr.currentActivations} / {qr.maxActivations} {t('aktiválás')}
                    </span>
                    <span className={`status-badge ${qr.isActive ? 'active' : 'inactive'}`}>
                      {qr.isActive ? t('Aktív') : t('Inaktív')}
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${progress}%`,
                        background: progress >= 90 ? '#f44336' : progress >= 70 ? '#FF9800' : '#4CAF50'
                      }}
                    ></div>
                  </div>
                  <span className="remaining-text">
                    {remaining > 0 ? `${remaining} ${t('hely maradt')}` : t('Betelt')}
                  </span>
                </div>
              </div>

              <div className="event-meta">
                <div className="meta-item">
                  <span className="meta-label">{t('Érték')}:</span>
                  <span className="meta-value">{event.codeValue} Ft</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">{t('Létrehozva')}:</span>
                  <span className="meta-value">{formatDate(event.createdAt)}</span>
                </div>
                <span className={`expiry-badge ${expired ? 'expired' : 'valid'}`}>
                  {expired ? t('Lejárt') : t('Érvényes')} - {formatDate(event.expiryDate)}
                </span>
                <span className="chevron-icon">
                  {openEventId === event.eventId ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {openEventId === event.eventId && (
              <div className="event-details">
                <div className="qr-info-section">
                  <div className="qr-data-box">
                    <h4>{t('QR Kód Adatok')}</h4>
                    <div className="qr-data-value">{qr.qrData}</div>
                    <button
                      onClick={() => handleDeleteQR(qr.qrId)}
                      className="delete-qr-btn"
                    >
                      🗑️ {t('QR Kód Törlése')}
                    </button>
                  </div>
                </div>

                {qr.activations && qr.activations.length > 0 && (
                  <div className="activations-section">
                    <h4>{t('Aktiválások')}</h4>
                    <div className="activations-table-container">
                      <table className="activations-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>{t('Felhasználó')}</th>
                            <th>{t('Email')}</th>
                            <th>{t('Időpont')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qr.activations.map((activation, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td>
                                <span className="user-badge">{activation.username}</span>
                              </td>
                              <td>{activation.email}</td>
                              <td>{formatDateTime(activation.activatedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(!qr.activations || qr.activations.length === 0) && (
                  <div className="no-activations">
                    <span className="no-activations-icon">⏳</span>
                    <p>{t('Még senki nem aktiválta ezt a QR kódot.')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}