import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../config/axios';
import { API_URL } from '../config/api';
import '../css/WebshopStats.css';

const WebshopStats = () => {
  const { t } = useTranslation();
  const { webshopId } = useParams();

  const [webshop, setWebshop] = useState(null);
  const [balances, setBalances] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [webshopId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [webshopRes, balancesRes, purchasesRes] = await Promise.all([
        apiClient.get(`${API_URL}/webshop/${webshopId}`),
        apiClient.get(`${API_URL}/user/balances/webshop/${webshopId}`),
        apiClient.get(`${API_URL}/purchase/webshop/${webshopId}`),
      ]);
      setWebshop(webshopRes.data);
      setBalances(balancesRes.data);
      setPurchases(purchasesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || t('Hiba történt az adatok betöltése közben.'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="stats-loading">{t('Betöltés...')}</div>;
  }

  if (error) {
    return <div className="stats-error">{error}</div>;
  }

  return (
    <div className="stats-container">
      <div className="stats-header" style={{ backgroundColor: webshop?.header_color_code || '#667eea' }}>
        <h1>{webshop?.subject_name} – {t('Statisztikák')}</h1>
      </div>

      {/* Section 1: Student balances */}
      <div className="stats-section">
        <h2>{t('Hallgatói egyenlegek')}</h2>
        {balances.length === 0 ? (
          <p className="stats-empty">{t('Még senki sem gyűjtött pontot ebben a webshopban.')}</p>
        ) : (
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>{t('Neptun kód')}</th>
                  <th>Email</th>
                  <th>{t('Egyenleg')}</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b, idx) => (
                  <tr key={idx}>
                    <td>{b.username}</td>
                    <td>{b.email}</td>
                    <td>{b.amount} {webshop?.paying_instrument}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Purchases */}
      <div className="stats-section">
        <h2>{t('Vásárlási előzmények')}</h2>
        {purchases.length === 0 ? (
          <p className="stats-empty">{t('Még nem vásároltál semmit.')}</p>
        ) : (
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>{t('Neptun kód')}</th>
                  <th>{t('Termék')}</th>
                  <th>{t('Mennyiség')}</th>
                  <th>{t('Dátum')}</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.purchase_id}>
                    <td>{p.user?.username}</td>
                    <td>{p.product?.name}</td>
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

export default WebshopStats;
