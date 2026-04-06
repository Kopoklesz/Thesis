import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios';
import { API_URL } from '../config/api';
import '../css/QRRedeem.css';

const QRRedeem = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const qrParam = searchParams.get('qr');

  const [status, setStatus] = useState('loading');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const redeemAttempted = useRef(false);

  useEffect(() => {
    if (!qrParam) {
      setStatus('error');
      setError(t('Érvénytelen QR kód'));
      return;
    }

    if (loading) return;

    if (!isAuthenticated) {
      sessionStorage.setItem('pannon_shop_redirect_after_login', window.location.href);
      navigate('/login');
      return;
    }

    if (!redeemAttempted.current) {
      redeemAttempted.current = true;
      redeemQR();
    }
  }, [qrParam, isAuthenticated, loading]);

  const redeemQR = async () => {
    try {
      const response = await apiClient.post(`${API_URL}/signature/redeem-qr`, {
        qrData: qrParam,
      });
      setStatus('success');
      setResult(response.data);

      setTimeout(() => {
        navigate('/webshops');
      }, 5000);
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || t('Hiba történt a QR kód beváltása közben.'));

      setTimeout(() => {
        navigate('/webshops');
      }, 5000);
    }
  };

  if (status === 'loading') {
    return (
      <div className="qr-redeem-container">
        <div className="qr-redeem-card">
          <div className="qr-redeem-spinner"></div>
          <p>{t('Betöltés...')}</p>
        </div>
      </div>
    );
  }

  if (status === 'success' && result) {
    return (
      <div className="qr-redeem-container">
        <div className="qr-redeem-card success">
          <div className="qr-redeem-icon success-icon">&#10003;</div>
          <h2>{t('Sikeres beváltás!')}</h2>
          <p className="qr-redeem-value">
            +{result.value} {result.currency}
          </p>
          <p className="qr-redeem-webshop">{result.webshop}</p>
          <button
            className="qr-redeem-btn"
            onClick={() => navigate('/webshops')}
          >
            {t('Webshopok megtekintése')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-redeem-container">
      <div className="qr-redeem-card error">
        <div className="qr-redeem-icon error-icon">&#10007;</div>
        <h2>{t('Hiba')}</h2>
        <p className="qr-redeem-error">{error}</p>
        <button
          className="qr-redeem-btn"
          onClick={() => navigate('/webshops')}
        >
          {t('Webshopok megtekintése')}
        </button>
      </div>
    </div>
  );
};

export default QRRedeem;
