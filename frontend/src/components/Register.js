import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import authService from '../services/authService';
import '../css/Auth.css';

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: []
  });

  useEffect(() => {
    if (formData.password) {
      const validation = authService.validatePassword(formData.password);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
    }
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = t('A felhasználónév nem lehet üres');
    }

    if (!formData.email) {
      newErrors.email = t('Az email cím kötelező');
    } else {
      const emailValidation = authService.validateEmailDomain(formData.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error;
      }
    }

    if (!passwordValidation.isValid) {
      newErrors.password = t('A jelszó nem felel meg a követelményeknek');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('A jelszavak nem egyeznek');
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.rememberMe
    );

    setLoading(false);

    if (result.success) {
      navigate('/webshops');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <h2>{t('Regisztráció')}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">
            {t('Felhasználónév')}
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder={t('Felhasználónév')}
            className={errors.username ? 'error' : ''}
            disabled={loading}
          />
          {errors.username && <div className="field-error">{errors.username}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="email">
            {t('Email cím')}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="pelda@student.uni-pannon.hu"
            className={errors.email ? 'error' : ''}
            disabled={loading}
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
          <div className="field-hint" style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
            Csak @student.uni-pannon.hu vagy @teacher.uni-pannon.hu email cím használható
          </div>
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
            className={errors.password ? 'error' : ''}
            disabled={loading}
          />
          {errors.password && <div className="field-error">{errors.password}</div>}
          
          {formData.password && (
            <div className="password-requirements">
              <p style={{ margin: '5px 0', fontSize: '0.9em', fontWeight: 'bold' }}>
                {t('Jelszó követelmények')}:
              </p>
              <ul>
                <li className={formData.password.length >= 8 ? 'valid' : ''}>
                  {t('Legalább 8 karakter hosszú')}
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>
                  {t('Legalább egy nagybetű')}
                </li>
                <li className={/[a-z]/.test(formData.password) ? 'valid' : ''}>
                  {t('Legalább egy kisbetű')}
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'valid' : ''}>
                  {t('Legalább egy szám')}
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'valid' : ''}>
                  {t('Legalább egy speciális karakter')}
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">
            {t('Jelszó megerősítése')}
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder={t('Jelszó megerősítése')}
            className={errors.confirmPassword ? 'error' : ''}
            disabled={loading}
          />
          {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
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
          {loading ? t('Regisztráció...') : t('Regisztráció')}
        </button>
      </form>

      <div className="auth-link">
        {t('Már van fiókod?')} <Link to="/login">{t('Jelentkezz be itt')}</Link>
      </div>
    </div>
  );
}

export default Register;