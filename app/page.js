'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function PortalPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const sess = sessionStorage.getItem('isLoggedIn');
    if (sess) {
      setIsLoggedIn(true);
      checkLoadBill();
    }
  }, []);

  const checkLoadBill = async () => {
    const loadId = sessionStorage.getItem('loadBillId');
    if (loadId) {
      try {
        const { data } = await axios.get('/api/bills');
        const bill = data.find(b => (b._id || b.id) === loadId);
        if (bill) {
          const type = bill.fullState?.type || 'service';
          window.location.href = type === 'company' ? '/company' : '/service';
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin@123') {
      sessionStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
    } else {
      alert('Invalid Credentials');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="login-overlay">
        <div className="login-box">
          <h2><i className="fa-solid fa-file-invoice-dollar"></i> Bill Portal Login</h2>
          <form onSubmit={handleLogin}>
            <div className="login-input-group">
              <i className="fa-solid fa-user"></i>
              <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="login-input-group">
              <i className="fa-solid fa-lock"></i>
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-login">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main className="selector-screen">
      <Link href="/service">
        <div className="selector-card">
          <i className="fa-solid fa-microscope"></i>
          <h2>Service Bills</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Original Pathology & Laboratory Bill Generator</p>
          <button className="btn-primary" style={{ marginTop: 'auto' }}>Enter Service Portal</button>
        </div>
      </Link>

      <Link href="/company">
        <div className="selector-card">
          <i className="fa-solid fa-truck-ramp-box"></i>
          <h2>Company Bills</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>New Goods & Product Invoice Generator (Khata Format)</p>
          <button className="btn-primary" style={{ marginTop: 'auto', background: '#e11d48' }}>Enter Product Portal</button>
        </div>
      </Link>

      <div style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
        <button
          className="icon-btn-small"
          onClick={logout}
          title="Logout"
          style={{ width: 'auto', padding: '10px 20px', display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <i className="fa-solid fa-right-from-bracket"></i> Logout
        </button>
      </div>
    </main>
  );
}
