'use client';
// Deployment Trigger: Public Repo - A4 Size & Fixed Receipt No - Feb 25

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { numberToWords } from '../utils/numberToWords';

export default function Home() {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // App State - Form
  const [labName, setLabName] = useState('SAMRIDDHI ENTERPRISES');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [patientCode, setPatientCode] = useState('');
  const [receiptNo, setReceiptNo] = useState('001');
  const [date, setDate] = useState('');
  const [sourceLab, setSourceLab] = useState('');
  const [advisedBy, setAdvisedBy] = useState('');
  const [adviseDate, setAdviseDate] = useState('');
  const [discount, setDiscount] = useState(0);

  // App State - Items
  const [items, setItems] = useState([{ name: 'TSH', price: 190 }]);

  // App State - History
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  // Initialization
  useEffect(() => {
    // Check Session
    const sess = sessionStorage.getItem('isLoggedIn');
    if (sess) setIsLoggedIn(true);

    // Set Date
    const now = new Date();
    setDate(now.toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm

    // Remove loading screen
    setIsLoading(false);

    // Check if we arrived here to load a specific bill
    const loadId = sessionStorage.getItem('loadBillId');
    if (loadId && sess) {
      sessionStorage.removeItem('loadBillId');
      fetchAndLoadBill(loadId);
    }
  }, []);

  const fetchAndLoadBill = async (id) => {
    try {
      const { data } = await axios.get('/api/bills');
      const bill = data.find(b => (b._id || b.id) === id);
      if (bill) loadBill(bill);
    } catch (e) {
      console.error('Failed to load specific bill', e);
    }
  };

  // Fetch Next Receipt on Login
  useEffect(() => {
    if (isLoggedIn) {
      fetchNextReceipt();
    }
  }, [isLoggedIn]);

  const fetchNextReceipt = async () => {
    try {
      const { data } = await axios.get('/api/next-receipt');
      if (data.nextReceiptNo) setReceiptNo(data.nextReceiptNo);
    } catch (error) {
      console.error('Failed to fetch receipt no', error);
      // Fallback local
      const last = localStorage.getItem('lastReceiptNo') || '004';
      setReceiptNo(String(parseInt(last) + 1).padStart(3, '0'));
    }
  };

  // Auth Functions
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/login', { username, password });
      if (data.success) {
        sessionStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);
      }
    } catch (error) {
      alert('Invalid Credentials');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  // Form Functions
  const addItem = () => {
    setItems([...items, { name: '', price: '' }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Calculations
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  };

  const totalAmount = calculateTotal();
  const netAmount = totalAmount - (parseFloat(discount) || 0);


  // Actions
  const handleGenerate = async () => {
    if (!patientName.trim()) {
      alert('Please enter Patient Name before generating the receipt.');
      return;
    }

    // 1. Save Bill
    const billData = {
      receiptNo,
      patientName,
      date,
      netAmount: `Rs ${netAmount.toFixed(2)}`,
      fullState: {
        labName, items, discount, age, gender, patientCode, advisedBy, adviseDate, sourceLab
      }
    };

    try {
      await axios.post('/api/bills', billData);

      // 2. Increment Receipt (Optimistic)
      const current = parseInt(receiptNo);
      localStorage.setItem('lastReceiptNo', current);
      setReceiptNo(String(current + 1).padStart(3, '0'));

      // 3. Print
      window.print();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to save bill: ${msg}. Printing anyway...`);
      window.print();
    }
  };

  const toggleHistory = async () => {
    if (!showHistory) {
      try {
        const { data } = await axios.get('/api/bills');
        setHistoryList(data);
      } catch (e) {
        console.error(e);
      }
    }
    setShowHistory(!showHistory);
  };

  const loadBill = (bill) => {
    const s = bill.fullState;
    setLabName(s.labName);
    setItems(s.items);
    setDiscount(s.discount);
    setAge(s.age);
    setGender(s.gender);
    setPatientCode(s.patientCode);
    setAdvisedBy(s.advisedBy);
    setAdviseDate(s.adviseDate);
    setSourceLab(s.sourceLab);

    setPatientName(bill.patientName);
    setReceiptNo(bill.receiptNo); // Keep original receipt no? Yes, needed for reprint.
    setDate(bill.date);

    setShowHistory(false);
  };

  // Render Helpers
  const formatDate = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    return d.toLocaleString('en-GB');
  };

  if (isLoading) return <div style={{ color: 'white', padding: 50 }}>Loading...</div>;

  return (
    <main>
      {!isLoggedIn && (
        <div className="login-overlay">
          <div className="login-box">
            <h2>Authorized Access</h2>
            <form onSubmit={handleLogin}>
              <div className="login-input-group">
                <i className="fa-solid fa-user"></i>
                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="login-input-group">
                <i className="fa-solid fa-lock"></i>
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-login">Login <i className="fa-solid fa-arrow-right"></i></button>
            </form>
          </div>
        </div>
      )}

      <div className="app-container" style={{ filter: isLoggedIn ? 'none' : 'blur(5px)' }}>

        {/* EDIT PANEL */}
        <aside className="editor-panel">
          <header className="panel-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{ color: '#3b82f6', fontSize: '1.2rem', fontWeight: '600' }}>
                <i className="fa-solid fa-file-invoice-dollar"></i> Bill App V2.1
              </h1>
              <div>
                <Link href="/history?from=service">
                  <button className="icon-btn-small" title="History" style={{ marginRight: 10 }}><i className="fa-solid fa-clock-rotate-left"></i></button>
                </Link>
                <Link href="/">
                  <button className="icon-btn-small" title="Home" style={{ marginRight: 10 }}><i className="fa-solid fa-house"></i></button>
                </Link>
                <button className="icon-btn-small" onClick={logout} title="Logout"><i className="fa-solid fa-right-from-bracket"></i></button>
              </div>
            </div>
          </header>

          <form onSubmit={e => e.preventDefault()}>
            <div className="input-wrapper">
              <label>Company Name</label>
              <input value={labName} onChange={e => setLabName(e.target.value)} />
            </div>

            <div className="form-section">
              <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', borderBottom: '1px solid #334155', paddingBottom: 5, marginBottom: 10 }}>Patient Details</h3>
              <div className="grid-2">
                <div className="input-wrapper">
                  <label>Patient Name</label>
                  <input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. Mrs. PRIYANKA JAIN" />
                </div>
                <div className="input-wrapper">
                  <label>Age / Gender</label>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <input style={{ width: '60%' }} value={age} onChange={e => setAge(e.target.value)} placeholder="46 (Y)" />
                    <select style={{ width: '40%' }} value={gender} onChange={e => setGender(e.target.value)}>
                      <option>Female</option><option>Male</option><option>Other</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="input-wrapper">
                <label>Patient Code</label>
                <input value={patientCode} onChange={e => setPatientCode(e.target.value)} placeholder="PH..." />
              </div>
            </div>

            <div className="form-section">
              <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', borderBottom: '1px solid #334155', paddingBottom: 5, marginBottom: 10 }}>Receipt Details</h3>
              <div className="grid-2">
                <div className="input-wrapper">
                  <label>Receipt No</label>
                  <input value={receiptNo} onChange={e => setReceiptNo(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div className="input-wrapper">
                  <label>Date & Time</label>
                  <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <label>Test Conducted By</label>
                  <input value={sourceLab} onChange={e => setSourceLab(e.target.value)} placeholder="e.g. SRL" />
                </div>
              </div>
              <div className="grid-2">
                <div className="input-wrapper">
                  <label>Advised By</label>
                  <input value={advisedBy} onChange={e => setAdvisedBy(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <label>Advise Date</label>
                  <input type="datetime-local" value={adviseDate} onChange={e => setAdviseDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', borderBottom: '1px solid #334155', paddingBottom: 5, marginBottom: 10 }}>Investigations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10 }}>
                    <input placeholder="Test Name" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                    <input type="number" placeholder="Price" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} />
                  </div>
                ))}
              </div>
              <button type="button" className="btn-secondary" onClick={addItem} style={{ marginTop: 10 }}>
                <i className="fa-solid fa-plus"></i> Add Test
              </button>
            </div>

            <div className="summary-section" style={{ marginTop: 20, borderTop: '1px solid #334155', paddingTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span>Total:</span>
                <span>{totalAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span>Discount:</span>
                <input type="number" style={{ width: 80, textAlign: 'right' }} value={discount} onChange={e => setDiscount(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', marginTop: 10 }}>
                <span>Net Amount:</span>
                <span>₹{netAmount.toFixed(2)}</span>
              </div>
            </div>

            <button type="button" className="btn-primary" onClick={handleGenerate} style={{ marginTop: 20 }}>
              <i className="fa-solid fa-print"></i> Generate Receipt
            </button>
          </form>
        </aside>

        {/* PREVIEW PANEL */}
        <main className="preview-panel">
          <div className="preview-header">
            <h2>Live Preview (A4 Size)</h2>
          </div>

          <div className="bill-wrapper">
            <div className="bill-paper">
              {/* Header */}
              <header className="bill-header">
                <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>VIA</div>
                <h1 style={{ textTransform: 'uppercase', margin: '1mm 0' }}>{labName}</h1>
                <div style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '2mm' }}>GSTIN: 23BJHPB7822E1ZN</div>
                <p className="address">119 KRISHNA MALL ROXY TALKIES KAMPOO LASHKAR GWALIOR 474001</p>
                <div className="contact-info" style={{ fontSize: '9pt' }}>
                  <p>OFFICE TIMING : 08 AM TO 10 PM , SUNDAY - OPEN</p>
                  <p>Toll Free : 1800-889-9818 | E-mail : SAMRIDDHIENTERPRISES51@GMAIL.COM</p>
                </div>
              </header>

              <div style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', margin: '2mm 0' }}>RECEIPT</div>

              {/* Grid 1 */}
              <div className="bill-grid">
                <div className="grid-row">
                  <div className="col"><strong>Receipt No:</strong> <span>{receiptNo}</span></div>
                  <div className="col text-right"><strong>Date:</strong> <span>{formatDate(date)}</span></div>
                </div>
                <div className="grid-row">
                  <div className="col"><strong>Patient Name:</strong> <span>{patientName}</span></div>
                  <div className="col text-right"><strong>Patient Code:</strong> <span>{patientCode}</span></div>
                </div>
                <div className="grid-row">
                  <div className="col"><strong>Gender/Age:</strong> <span>{gender} / {age}</span></div>
                  <div className="col text-right"><strong>Advised By:</strong> <span>{advisedBy}</span></div>
                </div>
                <div className="grid-row">
                  <div className="col"><strong>Advise Date:</strong> <span>{formatDate(adviseDate)}</span></div>
                  <div className="col text-right">{sourceLab && <><strong>Conducted By:</strong> <span>{sourceLab}</span></>}</div>
                </div>
              </div>

              {/* Table */}
              <table className="bill-table">
                <thead>
                  <tr>
                    <th style={{ width: '10%' }}>S.No.</th>
                    <th style={{ width: '60%' }}>Investigations</th>
                    <th style={{ width: '30%', textAlign: 'right' }}>Charges</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    (item.name || item.price) && (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{item.name}</td>
                        <td style={{ textAlign: 'right' }}>{parseFloat(item.price || 0).toFixed(2)}</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>

              {/* Footer Totals */}
              <div className="bill-footer-totals">
                <div className="total-row"><span>Total Amount:</span> <span>Rs {totalAmount.toFixed(2)}</span></div>
                <div className="total-row"><span>Discount:</span> <span>Rs {parseFloat(discount || 0).toFixed(2)}</span></div>
                <div className="total-row" style={{ fontWeight: 'bold' }}><span>Net Amount:</span> <span>Rs {netAmount.toFixed(2)}</span></div>
                <div className="total-row"><span>Balance:</span> <span>Rs 0.00</span></div>
              </div>

              <div style={{ fontStyle: 'italic', fontSize: '9pt', margin: '3mm 0', padding: '2mm', border: '1px dotted #ccc' }}>
                Received with thanks a sum of <span>{numberToWords(Math.floor(netAmount)) + " Rupees Only"}</span> from <span>{patientName}</span>
              </div>

              {/* Disclaimer */}
              <footer style={{ fontSize: '7pt', textAlign: 'center', borderTop: '1px solid #000', paddingTop: '2mm', marginTop: 'auto' }}>
                <p><strong>Disclaimer:</strong> SAMRIDDHI ENTERPRISES is a service provider only. We do not perform any tests ourselves. We are associated with various certified labs where tests are conducted. We facilitate the coordination and delivery of reports from these diagnostic labs.</p>
                <div className="barcodes">
                  <div className="barcode-box">
                    <div className="bars">*{receiptNo}*</div>
                    <span>Receipt No</span>
                  </div>
                  <div className="barcode-box">
                    <div className="bars">*{patientCode}*</div>
                    <span>Patient Code</span>
                  </div>
                </div>
              </footer>

            </div>
          </div>
        </main>
      </div >
    </main >
  );
}
