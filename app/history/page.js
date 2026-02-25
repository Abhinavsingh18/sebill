'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function HistoryContent() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const from = searchParams.get('from'); // 'service' or 'company'

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
            // Filter history based on where we came from
            if (from === 'company') {
                setHistoryList(data.filter(b => b.fullState?.type === 'company'));
            } else if (from === 'service') {
                setHistoryList(data.filter(b => b.fullState?.type !== 'company'));
            } else {
                setHistoryList(data);
            }
        } catch (e) {
            console.error('Failed to fetch history', e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div style={{ color: 'white', padding: 50 }}>Loading History...</div>;

    if (!isLoggedIn) {
        return (
            <div className="login-overlay">
                <div className="login-box">
                    <h2>Unauthorized</h2>
                    <p style={{ margin: '20px 0', color: '#94a3b8' }}>Please login on the main page first.</p>
                    <Link href="/">
                        <button className="btn-login">Go to Login</button>
                    </Link>
                </div>
            </div>
        );
    }

    const backPath = from === 'company' ? '/company' : (from === 'service' ? '/service' : '/');

    return (
        <main style={{ overflow: 'auto', height: '100vh', width: '100%' }}>
            <div className="history-container">
                <header className="history-page-header">
                    <h1>
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        {from === 'company' ? ' Company Invoice History' : (from === 'service' ? ' Service Bill History' : ' Transaction History')}
                    </h1>
                    <Link href={backPath}>
                        <button className="btn-back">
                            <i className="fa-solid fa-arrow-left"></i> Back to Generator
                        </button>
                    </Link>
                </header>

                <div className="history-body">
                    {historyList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                            <i className="fa-solid fa-folder-open" style={{ fontSize: '3rem', marginBottom: '20px', display: 'block' }}></i>
                            No {from || ''} bills found in history.
                        </div>
                    ) : (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Receipt No</th>
                                    <th>Date</th>
                                    <th>{from === 'company' ? 'Party Name' : 'Patient Name'}</th>
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

export default function HistoryPage() {
    return (
        <Suspense fallback={<div style={{ color: 'white', padding: 50 }}>Loading...</div>}>
            <HistoryContent />
        </Suspense>
    );
}
