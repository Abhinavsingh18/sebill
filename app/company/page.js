'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { numberToWords } from '../utils/numberToWords';

export default function CompanyBillPage() {
    // Auth
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Invoice State
    const [invoiceNo, setInvoiceNo] = useState('01');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
    const [partyName, setPartyName] = useState('');
    const [partyAddress, setPartyAddress] = useState('');
    const [partyPhone, setPartyPhone] = useState('');
    const [partyGstin, setPartyGstin] = useState('');
    const [stateOfSupply, setStateOfSupply] = useState('MADHYA PRADESH');
    const [isPaid, setIsPaid] = useState(true);

    const [items, setItems] = useState([
        { id: 1, name: 'Medical Ink', pricePerUnit: 200, qty: 2, taxPercent: 18 }
    ]);
    const [savedProducts, setSavedProducts] = useState([]);

    useEffect(() => {
        const sess = sessionStorage.getItem('isLoggedIn');
        if (sess) {
            setIsLoggedIn(true);
            const loadId = sessionStorage.getItem('loadBillId');
            if (loadId) {
                sessionStorage.removeItem('loadBillId');
                fetchAndLoadBill(loadId);
            }
        }
        // Load saved products from localStorage
        const saved = JSON.parse(localStorage.getItem('companyProducts') || '[]');
        setSavedProducts(saved);
    }, []);

    const fetchAndLoadBill = async (id) => {
        try {
            const { data } = await axios.get('/api/bills');
            const bill = data.find(b => (b._id || b.id) === id);
            if (bill && bill.fullState?.type === 'company') {
                loadBill(bill);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadBill = (bill) => {
        const s = bill.fullState;
        setInvoiceNo(s.invoiceNo);
        setInvoiceDate(bill.date);
        setPartyName(bill.patientName);
        setPartyAddress(s.partyAddress);
        setPartyPhone(s.partyPhone);
        setPartyGstin(s.partyGstin);
        setStateOfSupply(s.stateOfSupply);
        setIsPaid(s.isPaid);
        setItems(s.items);
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

    const addItem = () => {
        setItems([...items, { id: Date.now(), name: '', pricePerUnit: 0, qty: 1, taxPercent: 18 }]);
    };

    const updateItem = (id, field, value) => {
        const updatedItems = items.map(item => {
            if (item.id === id) {
                const newItem = { ...item, [field]: value };
                // If name changed, check if it matches a saved product to auto-fill
                if (field === 'name') {
                    const match = savedProducts.find(p => p.name.toLowerCase() === value.toLowerCase());
                    if (match) {
                        newItem.pricePerUnit = match.pricePerUnit;
                        newItem.taxPercent = match.taxPercent;
                    }
                }
                return newItem;
            }
            return item;
        });
        setItems(updatedItems);
    };

    const removeItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    // Calculations
    const calculateTotals = () => {
        let subtotal = 0;
        let totalTaxable = 0;
        let totalTax = 0;

        items.forEach(item => {
            const total = item.pricePerUnit * item.qty;
            const taxable = total / (1 + item.taxPercent / 100);
            const tax = total - taxable;

            subtotal += total;
            totalTaxable += taxable;
            totalTax += tax;
        });

        return { subtotal, totalTaxable, totalTax };
    };

    const { subtotal, totalTaxable, totalTax } = calculateTotals();

    const handleGenerate = async () => {
        if (!partyName) {
            alert('Please enter Party Name');
            return;
        }

        const billData = {
            receiptNo: `INV-${invoiceNo}`,
            patientName: partyName, // Using existing field for name
            date: invoiceDate,
            netAmount: `Rs ${subtotal.toFixed(2)}`,
            fullState: {
                type: 'company',
                items, partyAddress, partyPhone, partyGstin, stateOfSupply, isPaid, invoiceNo
            }
        };

        try {
            // Save new products to suggestions list
            const newSavedProducts = [...savedProducts];
            items.forEach(item => {
                if (item.name) {
                    const idx = newSavedProducts.findIndex(p => p.name.toLowerCase() === item.name.toLowerCase());
                    if (idx > -1) {
                        newSavedProducts[idx] = { name: item.name, pricePerUnit: item.pricePerUnit, taxPercent: item.taxPercent };
                    } else {
                        newSavedProducts.push({ name: item.name, pricePerUnit: item.pricePerUnit, taxPercent: item.taxPercent });
                    }
                }
            });
            localStorage.setItem('companyProducts', JSON.stringify(newSavedProducts));
            setSavedProducts(newSavedProducts);

            await axios.post('/api/bills', billData);
            window.print();
        } catch (e) {
            console.error(e);
            window.print();
        }
    };


    if (!isLoggedIn) {
        return (
            <div className="login-overlay">
                <div className="login-box">
                    <h2>Company Portal Login</h2>
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
        <main className="app-container">
            {/* Editor */}
            <aside className="editor-panel">
                <header className="panel-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <h1 style={{ color: '#3b82f6', fontSize: '1.2rem' }}><i className="fa-solid fa-building"></i> Company Bill</h1>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link href="/history/company">
                                <button className="icon-btn-small" title="History"><i className="fa-solid fa-clock-rotate-left"></i></button>
                            </Link>
                            <Link href="/">
                                <button className="icon-btn-small" title="Home"><i className="fa-solid fa-house"></i></button>
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="input-wrapper">
                    <label>Invoice No</label>
                    <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                </div>
                <div className="input-wrapper">
                    <label>Invoice Date</label>
                    <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                </div>

                <div style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: '10px' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Bill To Details</h3>
                    <div className="input-wrapper">
                        <label>Party Name</label>
                        <input type="text" value={partyName} onChange={e => setPartyName(e.target.value)} placeholder="Customer Name" />
                    </div>
                    <div className="input-wrapper">
                        <label>Address</label>
                        <input type="text" value={partyAddress} onChange={e => setPartyAddress(e.target.value)} placeholder="Address" />
                    </div>
                    <div className="grid-2">
                        <div className="input-wrapper">
                            <label>Phone</label>
                            <input type="text" value={partyPhone} onChange={e => setPartyPhone(e.target.value)} placeholder="Phone" />
                        </div>
                        <div className="input-wrapper">
                            <label>GSTIN</label>
                            <input type="text" value={partyGstin} onChange={e => setPartyGstin(e.target.value)} placeholder="GSTIN" />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '0.9rem' }}>Items</h3>
                        <button className="btn-secondary" onClick={addItem} style={{ width: 'auto', padding: '5px 15px' }}>+ Add</button>
                    </div>
                    {items.map(item => (
                        <div key={item.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                            <input
                                list="product-suggestions"
                                type="text"
                                value={item.name}
                                onChange={e => updateItem(item.id, 'name', e.target.value)}
                                placeholder="Item Name"
                                style={{ width: '100%', marginBottom: '5px', padding: '5px' }}
                            />
                            <div className="grid-2">
                                <input type="number" value={item.pricePerUnit} onChange={e => updateItem(item.id, 'pricePerUnit', parseFloat(e.target.value))} placeholder="Price (Inc. GST)" style={{ padding: '5px' }} />
                                <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseInt(e.target.value))} placeholder="Qty" style={{ padding: '5px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                <select value={item.taxPercent} onChange={e => updateItem(item.id, 'taxPercent', parseInt(e.target.value))} style={{ padding: '5px' }}>
                                    <option value="5">5% GST</option>
                                    <option value="12">12% GST</option>
                                    <option value="18">18% GST</option>
                                    <option value="28">28% GST</option>
                                </select>
                                <button className="btn-secondary" onClick={() => removeItem(item.id)} style={{ color: 'red', width: 'auto', border: 'none' }}><i className="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    ))}
                    <datalist id="product-suggestions">
                        {savedProducts.map((p, idx) => (
                            <option key={idx} value={p.name} />
                        ))}
                    </datalist>
                </div>

                <div className="input-wrapper" style={{ marginTop: '20px' }}>
                    <label>Status</label>
                    <select value={isPaid} onChange={e => setIsPaid(e.target.value === 'true')}>
                        <option value="true">PAID</option>
                        <option value="false">UNPAID</option>
                    </select>
                </div>

                <button className="btn-primary" onClick={handleGenerate} style={{ marginTop: '30px' }}>
                    Generate Invoice & Print
                </button>
            </aside>

            {/* Preview */}
            <section className="preview-panel">
                <div className="preview-header">Live Invoice Preview</div>
                <div className="khata-bill-paper">
                    <header className="khata-header">
                        <div className="khata-logo-info">
                            <div className="khata-logo-red">S</div>
                            <div className="khata-address">
                                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Samriddhi Enterprises</h2>
                                <p>shop no. 112, 119, 120 , 1st floor ,</p>
                                <p>krishna mall , infront of roxy talkies</p>
                                <p>lashkar , Gwalior Gwalior 474001</p>
                                <p><strong>Toll Free:</strong> 1800-889-9818</p>
                                <p><strong>GSTIN:</strong> 23BJHPB7822E1ZN | <strong>State:</strong> MADHYA PRADESH</p>
                            </div>
                        </div>
                        <div className="khata-invoice-meta">
                            <h1>Invoice No.{invoiceNo}</h1>
                            <p>Invoice Date: {new Date(invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </header>

                    <div className="khata-bill-to">
                        <p style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '5px' }}>Bill and Ship To</p>
                        <h3 style={{ margin: 0 }}>{partyName || 'Customer Name'}</h3>
                        <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>{partyAddress}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.85rem' }}><strong>Phone:</strong> {partyPhone}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.85rem' }}><strong>GSTIN:</strong> {partyGstin}</p>

                        <div className={`stamp ${isPaid ? 'paid' : 'unpaid'}`}>
                            {isPaid ? 'PAID' : 'UNPAID'}
                        </div>
                    </div>

                    <table className="khata-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th style={{ width: '40%' }}>Item Details</th>
                                <th>Price/Unit</th>
                                <th>Qty</th>
                                <th>Rate (Basic)</th>
                                <th>Tax</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => {
                                const total = item.pricePerUnit * item.qty;
                                const taxable = total / (1 + item.taxPercent / 100);
                                const tax = total - taxable;
                                return (
                                    <tr key={item.id}>
                                        <td>{index + 1}</td>
                                        <td>{item.name}</td>
                                        <td>{item.pricePerUnit.toFixed(2)}</td>
                                        <td>{item.qty}</td>
                                        <td>{taxable.toFixed(2)}</td>
                                        <td>{tax.toFixed(2)} ({item.taxPercent}%)</td>
                                        <td style={{ fontWeight: 'bold' }}>{total.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                        <table className="tax-table" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <th style={{ textAlign: 'left', padding: '5px' }}>Tax Slab</th>
                                    <th style={{ textAlign: 'left', padding: '5px' }}>Taxable</th>
                                    <th style={{ textAlign: 'left', padding: '5px' }}>Tax</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[5, 12, 18, 28].map(slab => {
                                    const slabItems = items.filter(i => i.taxPercent === slab);
                                    if (slabItems.length === 0) return null;
                                    const slabTaxable = slabItems.reduce((acc, curr) => acc + (curr.pricePerUnit * curr.qty) / (1 + slab / 100), 0);
                                    const slabTax = slabItems.reduce((acc, curr) => acc + (curr.pricePerUnit * curr.qty) - (curr.pricePerUnit * curr.qty) / (1 + slab / 100), 0);
                                    return (
                                        <tr key={slab}>
                                            <td style={{ padding: '5px' }}>SGST/CGST {slab / 2}%</td>
                                            <td style={{ padding: '5px' }}>₹{slabTaxable.toFixed(2)}</td>
                                            <td style={{ padding: '5px' }}>₹{slabTax.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="summary-large">
                            <div className="total-amount-box">
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>Total amount</p>
                                <h1 style={{ margin: 0, fontSize: '2rem' }}>₹{subtotal.toFixed(2)}</h1>
                                <p className="amount-words">{numberToWords(Math.floor(subtotal))} Rupees Only</p>
                            </div>
                        </div>
                    </div>

                    <div className="khata-footer">
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            <p>~ THIS IS A DIGITALLY CREATED INVOICE ~</p>
                            <p style={{ marginTop: '5px' }}>Thank you for the business.</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '40mm', height: '1px', background: '#000', marginBottom: '5px' }}></div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>AUTHORISED SIGNATURE</p>
                        </div>
                    </div>
                </div>
            </section>

            <style jsx>{`
                @media print {
                    .editor-panel, .preview-header, .icon-btn-small { display: none !important; }
                    .app-container { display: block !important; }
                    .preview-panel { display: block !important; padding: 0 !important; background: white !important; overflow: visible !important; }
                    .khata-bill-paper { box-shadow: none !important; margin: 0 !important; }
                }
            `}</style>
        </main>
    );
}
