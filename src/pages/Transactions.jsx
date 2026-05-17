import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TopBar from '../components/TopBar';
import api from '../api/client';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions');
      
      if (res.success && Array.isArray(res.data)) {
        setTransactions(res.data);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <TopBar title="Transaction History" subtitle="Track all stock movements (IN/OUT)" />

      <div className="p-6">
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          {error && (
            <div className="p-4 bg-error-container text-on-error-container text-sm">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-on-surface">
              <thead className="text-xs uppercase bg-surface-container text-on-surface-variant font-semibold">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Reference</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-outline">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-outline">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={txn._id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-on-surface-variant">
                        {formatDate(txn.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-medium text-on-surface">
                        {txn.productId ? txn.productId.name : <span className="text-error">Unknown Product</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            txn.type === 'IN'
                              ? 'bg-success-container text-on-success-container'
                              : 'bg-error-container text-on-error-container'
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {txn.type === 'IN' ? '+' : '-'}{txn.quantity}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-sm">
                        {txn.reference || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
