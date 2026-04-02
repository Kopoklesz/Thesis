import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';
import GeneratedCodesList from '../lists/GeneratedCodesList';
import '../../css/generators/CodeGenerator.css';

export default function CodeGenerator({ onSuccess }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [webshops, setWebshops] = useState([]);
  const [formData, setFormData] = useState({
    webshop: null,
    codeCount: 1,
    codeValue: '',
    expiryDate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshList, setRefreshList] = useState(0);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    fetchWebshops();
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

  const handleWebshopSelect = (webshop) => {
    setFormData(prev => ({ ...prev, webshop }));
    setError('');
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const validateStep = () => {
    switch (step) {
      case 2:
        if (formData.codeCount < 1 || formData.codeCount > 1000) {
          setError(t('A kódok száma 1 és 1000 között lehet.'));
          return false;
        }
        break;
      case 3:
        if (!formData.codeValue || formData.codeValue <= 0) {
          setError(t('Kérjük adjon meg érvényes értéket.'));
          return false;
        }
        break;
      case 4:
        if (!formData.expiryDate) {
          setError(t('Kérjük válasszon lejárati dátumot.'));
          return false;
        }
        const selectedDate = new Date(formData.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate <= today) {
          setError(t('A lejárati dátumnak jövőbeli dátumnak kell lennie.'));
          return false;
        }
        break;
      default:
        return true;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleGenerate = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');
    
    try {
      const generationData = {
        webshopId: formData.webshop.webshop_id,
        codeCount: parseInt(formData.codeCount),
        codeValue: parseFloat(formData.codeValue),
        expiryDate: formData.expiryDate
      };

      const response = await apiClient.post(
        `${API_ENDPOINTS.BASE}/signature/generate-codes`,
        generationData,
        {
          responseType: 'blob'
        }
      );

      // PDF letöltés
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `codes_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onSuccess(t('Kódok sikeresen generálva és letöltve!'));
      
      // Reset form
      setFormData({
        webshop: null,
        codeCount: 1,
        codeValue: '',
        expiryDate: ''
      });
      setStep(1);
      setRefreshList(prev => prev + 1);
      
    } catch (error) {
      console.error('Error generating codes:', error);
      setError(error.response?.data?.message || t('Hiba történt a kódok generálása közben.'));
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-container">
            <div className="step-header">
              <h2>{t('1. Webshop kiválasztása')}</h2>
              <p>{t('Válaszd ki a webshopot, amelyhez kódokat szeretnél generálni')}</p>
            </div>
            
            {webshops.length === 0 ? (
              <div className="no-webshops">
                <span className="no-webshops-icon">🏪</span>
                <p>{t('Nincs aktív webshop')}</p>
              </div>
            ) : (
              <div className="webshop-grid">
                {webshops.map((webshop) => (
                  <div
                    key={webshop.webshop_id}
                    className={`webshop-card ${formData.webshop?.webshop_id === webshop.webshop_id ? 'selected' : ''}`}
                    onClick={() => handleWebshopSelect(webshop)}
                  >
                    <div className="webshop-card-header" style={{ backgroundColor: webshop.header_color_code }}>
                      <h3>{webshop.subject_name}</h3>
                    </div>
                    <div className="webshop-card-body">
                      <div className="webshop-info">
                        <span className="info-label">{t('Pénznem')}:</span>
                        <span className="info-value">{webshop.paying_instrument}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="step-container">
            <div className="step-header">
              <h2>{t('2. Kódok száma')}</h2>
              <p>{t('Hány kódot szeretnél generálni? (1-1000)')}</p>
            </div>
            
            <div className="form-group-large">
              <label htmlFor="codeCount">{t('Kódok száma')}</label>
              <input
                type="number"
                id="codeCount"
                name="codeCount"
                min="1"
                max="1000"
                value={formData.codeCount}
                onChange={handleInputChange}
                className="input-large"
              />
              <span className="input-hint">{t('Generált kódok PDF formátumban lesznek letölthetők')}</span>
            </div>

            <div className="step-actions">
              <button onClick={handleBack} className="btn-secondary">
                {t('Vissza')}
              </button>
              <button onClick={handleNext} className="btn-primary">
                {t('Következő')}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-container">
            <div className="step-header">
              <h2>{t('3. Kód értéke')}</h2>
              <p>{t('Mennyi egyenleget adjanak a kódok?')}</p>
            </div>
            
            <div className="form-group-large">
              <label htmlFor="codeValue">{t('Érték')}</label>
              <div className="input-with-currency">
                <input
                  type="number"
                  id="codeValue"
                  name="codeValue"
                  min="0.01"
                  step="0.01"
                  value={formData.codeValue}
                  onChange={handleInputChange}
                  className="input-large"
                />
                <span className="currency-label">{formData.webshop?.paying_instrument}</span>
              </div>
              <span className="input-hint">
                {t('Minden kód ezt az értéket adja hozzá a beváltó egyenlegéhez')}
              </span>
            </div>

            <div className="step-actions">
              <button onClick={handleBack} className="btn-secondary">
                {t('Vissza')}
              </button>
              <button onClick={handleNext} className="btn-primary">
                {t('Következő')}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-container">
            <div className="step-header">
              <h2>{t('4. Lejárati dátum')}</h2>
              <p>{t('Meddig legyenek érvényesek a kódok?')}</p>
            </div>
            
            <div className="form-group-large">
              <label htmlFor="expiryDate">{t('Lejárati dátum')}</label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                min={minDate}
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="input-large"
              />
              <span className="input-hint">
                {t('A lejárt kódok automatikusan törlődnek éjfélkor')}
              </span>
            </div>

            <div className="summary-box">
              <h3>{t('Összegzés')}</h3>
              <div className="summary-item">
                <span className="summary-label">{t('Webshop')}:</span>
                <span className="summary-value">{formData.webshop?.subject_name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('Kódok száma')}:</span>
                <span className="summary-value">{formData.codeCount} db</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('Kód értéke')}:</span>
                <span className="summary-value">
                  {formData.codeValue} {formData.webshop?.paying_instrument}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('Lejárat')}:</span>
                <span className="summary-value">
                  {formData.expiryDate ? new Date(formData.expiryDate).toLocaleDateString('hu-HU') : '-'}
                </span>
              </div>
              <div className="summary-total">
                <span className="summary-label">{t('Teljes érték')}:</span>
                <span className="summary-value-large">
                  {(formData.codeCount * formData.codeValue).toFixed(2)} {formData.webshop?.paying_instrument}
                </span>
              </div>
            </div>

            <div className="step-actions">
              <button onClick={handleBack} className="btn-secondary">
                {t('Vissza')}
              </button>
              <button onClick={handleGenerate} className="btn-success" disabled={loading}>
                {loading ? t('Generálás...') : t('Kódok Generálása')}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="code-generator">
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}

      <div className="progress-bar">
        {[1, 2, 3, 4].map((num) => (
          <div
            key={num}
            className={`progress-step ${step >= num ? 'active' : ''} ${step === num ? 'current' : ''}`}
          >
            <div className="progress-circle">{num}</div>
            <span className="progress-label">
              {num === 1 && t('Webshop')}
              {num === 2 && t('Mennyiség')}
              {num === 3 && t('Érték')}
              {num === 4 && t('Lejárat')}
            </span>
          </div>
        ))}
      </div>

      {renderStep()}

      <div className="separator">
        <span>{t('Generált Kódok')}</span>
      </div>

      <GeneratedCodesList key={refreshList} />
    </div>
  );
}