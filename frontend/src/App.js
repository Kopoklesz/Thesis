import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';

import Shop from './components/Shop';
import Nav from './components/Nav';
import TeacherDashboard from './components/TeacherDashboard';
import ManagePartners from './components/ManagePartners';
import Cart from './components/Cart';
import WebshopList from './components/WebshopList';
import ManageProducts from './components/ManageProducts';
import SignatureGenerated from './components/SignatureGenerated';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

import { AuthProvider } from './context/AuthContext';

import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [cart, setCart] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'hu');

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Suspense fallback={<div>Loading...</div>}>
            <Nav 
              cart={cart} 
              currentLanguage={currentLanguage}
              changeLanguage={changeLanguage}
            />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/webshops" element={<WebshopList />} />
              <Route path="/shop/:webshopId" element={<Shop cart={cart} setCart={setCart} />} />

              <Route
                path="/teacher"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/manage-products/:webshopId"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <ManageProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/manage-partners/:webshopId"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <ManagePartners />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/signature-generator"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <SignatureGenerated />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/signature-generated"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <SignatureGenerated />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cart"
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                    <Cart cart={cart} setCart={setCart} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cart/:webshopId"
                element={
                  <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                    <Cart cart={cart} setCart={setCart} />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<Navigate to="/webshops" replace />} />
              <Route path="*" element={<Navigate to="/webshops" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;