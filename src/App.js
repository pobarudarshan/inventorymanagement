import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header';
import Auth from './components/Auth';
import InventoryList from './components/InventoryList';
import InventoryForm from './components/InventoryForm';

// Set default axios headers
axios.defaults.baseURL = 'http://localhost:5000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/auth/me', {
            headers: { 'x-auth-token': token }
          });
          setUser(res.data);
        } catch (err) {
          console.error('Auth error:', err);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  return (
    <Router>
      <div className="App">
        <Header user={user} logout={logout} />
        <div className="container py-4">
          <Routes>
            <Route path="/login" element={
              token ? <Navigate to="/" /> : <Auth login={login} isRegister={false} />
            } />
            <Route path="/register" element={
              token ? <Navigate to="/" /> : <Auth login={login} isRegister={true} />
            } />
            <Route path="/add" element={
              token ? <InventoryForm /> : <Navigate to="/login" />
            } />
            <Route path="/edit/:id" element={
              token ? <InventoryForm /> : <Navigate to="/login" />
            } />
            <Route path="/" element={
              token ? <InventoryList /> : <Navigate to="/login" />
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;