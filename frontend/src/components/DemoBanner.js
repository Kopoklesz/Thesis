import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const DemoBanner = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user?.is_demo) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#ff9800',
      color: '#fff',
      textAlign: 'center',
      padding: '10px 16px',
      fontWeight: 600,
      fontSize: '14px',
      width: '100%',
      boxSizing: 'border-box',
      zIndex: 999,
    }}>
      {t('Demo mód – egyes funkciók nem elérhetők')}
    </div>
  );
};

export default DemoBanner;
