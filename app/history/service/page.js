'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function ServiceHistoryPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const sess = sessionStorage.getItem('isLoggedIn');
        if (sess) {
            setIsLoggedIn(true);
            fetchHistory();
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get('/api/bills');
            // STRICT FILTER: Only show service bills (exclude type: company)
            const serviceBills = data.filter(b => b.fullState?.type !== 'company');
            setHistoryList(serviceBills);
        } catch (e) {
            console.error('Failed to fetch history', e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div style={{ color: 'white', padding: 50 }}>Loading Service History...</div>;

    if (!isLoggedIn) {
        return (
            <div className="login-overlay">
                <div className="login-box">
                    <h2>Unauthorized</h2>
                    <p style={{ margin: '20px 0', color: '#94a3b8' }}>Please login first.</p>
                    <Link href="/">
                        <button className="btn-login">Go to Login</button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main style={{ overflow: 'auto', height: '100vh', width: '100%' }}>
            <div className="history-container">
                <header className="history-page-header">
                    <h1><i className="fa-solid fa-clock-rotate-left"></i> Service Bill History</h1>
                    <Link href="/service">
                        <button className="btn-back">
                            <i className="fa-solid fa-arrow-left"></i> Back to Generator
                        </button>
                    </Link>
                </header>

                <div className="history-body">
                    {historyList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                            <i className="fa-solid fa-folder-open" style={{ fontSize: '3rem', marginBottom: '20px', display: 'block' }}></i>
                            No service bills found.
                        </div>
                    ) : (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Receipt No</th>
                                    <th>Date</th>
                                    <th>Patient Name</th>
                                    <th>Amount</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyList.map(item => (
                                    <tr key={item._id || item.id}>
                                        <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>{item.receiptNo}</td>
                                        <td>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td>{item.patientName}</td>
                                        <td style={{ fontWeight: '600' }}>{item.netAmount}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="icon-btn-small"
                                                    title="View Details"
                                                    onClick={() => {
                                                        sessionStorage.setItem('loadBillId', item._id || item.id);
                                                        window.location.href = '/';
                                                    }}
                                                >
                                                    <i className="fa-solid fa-eye"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </main>
    );
}
