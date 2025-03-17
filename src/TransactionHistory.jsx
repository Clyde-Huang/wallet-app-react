import React, { useState, useEffect } from 'react';
import './TransactionHistory.css';

function TransactionHistory({ account, onClose }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'sent', 'received'

    useEffect(() => {
        fetchTransactionHistory();
    }, [account]);

    const fetchTransactionHistory = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8585/money/records', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.records)) {
                    setRecords(data.records);
                } else {
                    setError('無法載入交易記錄');
                }
            } else {
                setError('伺服器回應錯誤');
            }
        } catch (err) {
            console.error('獲取交易記錄時發生錯誤:', err);
            setError('連線失敗，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    // 過濾交易記錄
    const filteredRecords = records.filter(record => {
        if (filter === 'all') {
            return record.sendMoneyAccount === account || record.receiveMoneyAccount === account;
        } else if (filter === 'sent') {
            return record.sendMoneyAccount === account;
        } else if (filter === 'received') {
            return record.receiveMoneyAccount === account;
        }
        return true;
    });

    // 格式化日期時間
    const formatDateTime = (dateTimeString) => {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (e) {
            return dateTimeString;
        }
    };

    // 處理備註顯示
    const formatRemark = (remark) => {
        if (!remark) return '';

        // 提取門牌號碼
        const addressMatch = remark.match(/#([^#]+)#/);
        const address = addressMatch ? addressMatch[1] : '';

        // 提取備註內容
        const noteMatch = remark.match(/\^([^-^]+)\^/);
        const note = noteMatch ? noteMatch[1] : '';

        if (address && note) {
            return `門牌：${address}，費用類型：${note}`;
        } else if (address) {
            return `門牌：${address}`;
        } else if (note) {
            return `費用類型：${note}`;
        }

        return '';
    };

    // 判斷交易類型
    const getTransactionType = (record) => {
        if (record.sendMoneyAccount === account && record.receiveMoneyAccount === account) {
            return '自我轉帳';
        } else if (record.sendMoneyAccount === account) {
            return '轉出';
        } else if (record.receiveMoneyAccount === account) {
            return '轉入';
        }
        return '其他';
    };

    return (
        <div className="transaction-history-overlay">
            <div className="transaction-history-container">
                <div className="transaction-history-header">
                    <h3>交易記錄</h3>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="filter-controls">
                    <button
                        className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        全部
                    </button>
                    <button
                        className={`filter-button ${filter === 'sent' ? 'active' : ''}`}
                        onClick={() => setFilter('sent')}
                    >
                        轉出
                    </button>
                    <button
                        className={`filter-button ${filter === 'received' ? 'active' : ''}`}
                        onClick={() => setFilter('received')}
                    >
                        轉入
                    </button>
                    <button className="refresh-button" onClick={fetchTransactionHistory}>
                        重新整理
                    </button>
                </div>

                {loading ? (
                    <div className="loading-indicator">載入中...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : filteredRecords.length === 0 ? (
                    <div className="no-records-message">無交易記錄</div>
                ) : (
                    <div className="records-container">
                        <table className="records-table">
                            <thead>
                                <tr>
                                    <th>日期時間</th>
                                    <th>類型</th>
                                    <th>對方帳號</th>
                                    <th>金額</th>
                                    <th>備註</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map(record => {
                                    const transactionType = getTransactionType(record);
                                    const isOutgoing = transactionType === '轉出';
                                    const counterpartyAccount = isOutgoing ? record.receiveMoneyAccount : record.sendMoneyAccount;

                                    // 如果是自我轉帳，對方帳號就是自己
                                    const displayAccount = transactionType === '自我轉帳' ? account : counterpartyAccount;

                                    return (
                                        <tr key={record.id} className={isOutgoing ? 'outgoing' : 'incoming'}>
                                            <td>{formatDateTime(record.timeOfReceivingMoney)}</td>
                                            <td className={`transaction-type ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                                                {transactionType}
                                            </td>
                                            <td>{displayAccount}</td>
                                            <td className="amount">{record.receive}</td>
                                            <td className="remark">{formatRemark(record.remark)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TransactionHistory;