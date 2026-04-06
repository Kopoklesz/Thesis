import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios';
import { API_URL } from '../config/api';
import '../css/Profile.css';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [balances, setBalances] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [code, setCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState(null);

  const fetchBalances = useCallback(async () => {
    setLoadingBalances(true);
    try {
      const response = await apiClient.get(`${API_URL}/user/${user.user_id}/balances`);
      setBalances(response.data);
    } catch (err) {
      setBalances([]);
    } finally {
      setLoadingBalances(false);
    }
  }, [user.user_id]);

  const fetchPurchases = useCallback(async () => {
    setLoadingPurchases(true);
    try {
      const response = await apiClient.get(`${API_URL}/purchase/user/${user.user_id}`);
      setPurchases(response.data);
    } catch (err) {
      setPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  }, [user.user_id]);

  useEffect(() => {
    fetchBalances();
    fetchPurchases();
  }, [fetchBalances, fetchPurchases]);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setRedeemLoading(true);
    setRedeemMessage(null);

    try {
      const response = await apiClient.post(`${API_URL}/signature/redeem-code`, { code: code.trim() });
      setRedeemMessage({ type: 'success', text: `${t('Sikeres beváltás!')} +${response.data.value} ${response.data.currency} (${response.data.webshop})` });
      setCode('');
      fetchBalances();
    } catch (err) {
      setRedeemMessage({ type: 'error', text: err.response?.data?.message || t('Hiba történt a kód beváltása közben.') });
    } finally {
      setRedeemLoading(false);
    }
  };

  const isDemo = user?.is_demo === true;
  const demoTitle = t('Demo felhasználóval ez a művelet nem hajtható végre');

  return (
    <div className="profile-container">
      <h1>{t('Profil')}</h1>

      {/* Section 1: Balances */}
      <div className="profile-section">
        <h2>{t('Egyenlegeim')}</h2>
        {loadingBalances ? (
          <div className="profile-loading">{t('Betöltés...')}</div>
        ) : balances.length === 0 ? (
          <p className="profile-empty">{t('Még nincs egyenleged egyik webshopban sem.')}</p>
        ) : (
          <div className="balance-grid">
            {balances.map((b) => (
              <div key={b.balance_id || b.webshop?.webshop_id} className="balance-card">
                <div
                  className="balance-card-header"
                  style={{ backgroundColor: b.webshop?.header_color_code || '#667eea' }}
                >
                  <span className="balance-webshop-name">{b.webshop?.subject_name}</span>
                </div>
                <div className="balance-card-body">
                  <span className="balance-amount">{Number(b.amount)}</span>
                  <span className="balance-currency">{b.webshop?.paying_instrument}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Code redemption */}
      <div className="profile-section">
        <h2>{t('Kód beváltása')}</h2>
        <div className="redeem-form">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('Add meg a kódot...')}
            disabled={isDemo || redeemLoading}
            maxLength={8}
          />
          <button
            onClick={handleRedeem}
            disabled={isDemo || redeemLoading || !code.trim()}
            title={isDemo ? demoTitle : ''}
            className="redeem-btn"
          >
            {redeemLoading ? t('Betöltés...') : t('Beváltás')}
          </button>
        </div>
        {redeemMessage && (
          <div className={`redeem-message ${redeemMessage.type}`}>
            {redeemMessage.text}
          </div>
        )}
      </div>

      {/* Section 3: Purchase history */}
      <div className="profile-section">
        <h2>{t('Vásárlási előzmények')}</h2>
        {loadingPurchases ? (
          <div className="profile-loading">{t('Betöltés...')}</div>
        ) : purchases.length === 0 ? (
          <p className="profile-empty">{t('Még nem vásároltál semmit.')}</p>
        ) : (
          <div className="purchases-table-wrapper">
            <table className="purchases-table">
              <thead>
                <tr>
                  <th>{t('Termék')}</th>
                  <th>{t('Webshop')}</th>
                  <th>{t('Mennyiség')}</th>
                  <th>{t('Dátum')}</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.purchase_id}>
                    <td>{p.product?.name}</td>
                    <td>{p.product?.webshop?.subject_name || '-'}</td>
                    <td>{p.quantity}</td>
                    <td>{new Date(p.purchase_date).toLocaleDateString('hu-HU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
