import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
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
      navigate('/webshops');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

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