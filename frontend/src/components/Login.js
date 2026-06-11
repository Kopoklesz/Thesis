import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { REFERENCE_MODE, REFERENCE_ACCOUNTS, REFERENCE_PASSWORD } from '../config/referenceAccounts';
import '../css/Auth.css';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false
  });
  const [selectedAccount, setSelectedAccount] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const handleLoginSuccess = () => {
    const redirectUrl = sessionStorage.getItem('pannon_shop_redirect_after_login');
    if (redirectUrl) {
      sessionStorage.removeItem('pannon_shop_redirect_after_login');
      window.location.href = redirectUrl;
    } else {
      navigate('/webshops');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.identifier || !formData.password) {
      setError('Minden mező kitöltése kötelező');
      setLoading(false);
      return;
    }

    const result = await login(formData.identifier, formData.password, formData.rememberMe);

    if (result.success) {
      handleLoginSuccess();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleReferenceSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedAccount) {
      setError(t('Válassz egy minta fiókot a bejelentkezéshez'));
      return;
    }

    setLoading(true);
    const result = await login(selectedAccount, REFERENCE_PASSWORD, false);

    if (result.success) {
      handleLoginSuccess();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  if (REFERENCE_MODE) {
    return (
      <div className="auth-container">
        <h2>{t('Bejelentkezés')}</h2>

        <p className="reference-info">
          {t('Ez egy nyilvános referencia példány. Válassz egy minta fiókot a rendszer kipróbálásához.')}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleReferenceSubmit}>
          <div className="form-group">
            <label htmlFor="referenceAccount">
              {t('Minta fiók')}
            </label>
            <select
              id="referenceAccount"
              value={selectedAccount}
              onChange={(e) => { setSelectedAccount(e.target.value); setError(''); }}
              disabled={loading}
            >
              <option value="">{t('Válassz minta fiókot...')}</option>
              {REFERENCE_ACCOUNTS.map((account) => (
                <option key={account.username} value={account.username}>
                  {t(account.labelKey)} ({account.username})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? t('Bejelentkezés...') : t('Bejelentkezés')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2>{t('Bejelentkezés')}</h2>

      {error && <div className="error-message">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="identifier">
            {t('Felhasználónév vagy Email')}
          </label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder={t('Neptune kód vagy email cím')}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            {t('Jelszó')}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('Jelszó')}
            disabled={loading}
          />
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            disabled={loading}
          />
          <label htmlFor="rememberMe">
            {t('Emlékezz rám')}
          </label>
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? t('Bejelentkezés...') : t('Bejelentkezés')}
        </button>
      </form>

      <div className="auth-link">
        {t('Még nincs fiókod?')} <Link to="/register">{t('Regisztrálj itt')}</Link>
      </div>
    </div>
  );
}

export default Login;
