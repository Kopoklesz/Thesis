import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import apiClient from '../config/axios';
import { API_URL } from '../config/api';
import '../css/Cart.css';

const Cart = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { webshopId } = useParams();
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user && webshopId) {
      fetchCartItems();
    }
  }, [user, webshopId]);

  const fetchCartItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`${API_URL}/cart/${user.user_id}/${webshopId}`);
      setCartItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setError(t('Nem sikerült betölteni a kosár tartalmát'));
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await apiClient.post(`${API_URL}/cart/${user.user_id}/${webshopId}`, { 
        productId: productId, 
        quantity: newQuantity 
      });
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.product.product_id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError(t('Hiba történt a mennyiség frissítése közben.'));
    }
  };

  const removeItem = async (productId) => {
    try {
      await apiClient.post(`${API_URL}/cart/${user.user_id}/${webshopId}`, { 
        productId: productId, 
        quantity: 0 
      });
      setCartItems(prevItems => prevItems.filter(item => item.product.product_id !== productId));
    } catch (error) {
      console.error('Error removing item:', error);
      setError(t('Hiba történt a termék eltávolítása közben.'));
    }
  };

  const checkout = async () => {
    setProcessing(true);
    setError(null);
    setSuccess('');
    
    try {
      const response = await apiClient.post(`${API_URL}/purchase/${user.user_id}/${webshopId}`);
      
      // Sikeres vásárlás
      setSuccess(t('Sikeres vásárlás! Köszönjük a rendelést.'));
      setCartItems([]);
      
      // 2 másodperc után átirányítás
      setTimeout(() => {
        navigate(`/shop/${webshopId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error during checkout:', error);
      const errorMessage = error.response?.data?.message || t('Hiba történt a fizetés során.');
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0).toFixed(2);
  };

  if (loading) {
    return <div className="cart-loading">{t('Betöltés...')}</div>;
  }

  return (
    <div className="cart-container">
      <h2>{t('Kosár')}</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>{t('A kosár üres')}</p>
          <button onClick={() => navigate(`/shop/${webshopId}`)}>
            {t('Vissza a boltba')}
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.product.product_id} className="cart-item">
                <img 
                  src={item.product.image} 
                  alt={item.product.name}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/100'}
                />
                <div className="item-details">
                  <h3>{item.product.name}</h3>
                  <p className="item-price">
                    {t('Ár')}: {item.product.price} {item.product.webshop?.paying_instrument || 'Ft'}
                  </p>
                  <div className="quantity-control">
                    <button 
                      onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)} 
                      disabled={item.quantity === 1 || processing}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                      disabled={processing}
                    >
                      +
                    </button>
                  </div>
                  <p className="item-subtotal">
                    {t('Összesen')}: {(item.product.price * item.quantity).toFixed(2)} {item.product.webshop?.paying_instrument || 'Ft'}
                  </p>
                </div>
                <button 
                  className="remove-button"
                  onClick={() => removeItem(item.product.product_id)}
                  disabled={processing}
                >
                  {t('Eltávolítás')}
                </button>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <h3>{t('Összesen')}: {calculateTotal()} {cartItems[0]?.product.webshop?.paying_instrument || 'Ft'}</h3>
            <button
              className="checkout-button"
              onClick={checkout}
              disabled={processing || cartItems.length === 0 || user?.is_demo === true}
              title={user?.is_demo === true ? t('Demo felhasználóval ez a művelet nem hajtható végre') : ''}
            >
              {processing ? t('Feldolgozás...') : t('Fizetés')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;