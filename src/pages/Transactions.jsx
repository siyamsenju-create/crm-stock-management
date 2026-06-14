import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getTransactionsFromFirebase } from '../utils/firebaseDb';

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
      const data = await getTransactionsFromFirebase();
      
      if (Array.isArray(data)) {
        setTransactions(data);
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
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-on-surface">Transaction History</h1>
        <p className="text-on-surface-variant mt-1">Track all stock movements (IN/OUT)</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        {error && (
          <div className="p-4 bg-error-container text-on-error-container text-sm">
            {error}
          </div>
        )}

        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
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
                  <tr key={txn.id || txn._id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
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
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
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

        {/* Mobile View Card List */}
        <div className="md:hidden divide-y divide-outline-variant/30">
          {loading ? (
            <div className="px-6 py-8 text-center text-outline text-sm">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-outline text-sm">
              No transactions found.
            </div>
          ) : (
            transactions.map((txn) => (
              <div key={txn.id || txn._id} className="p-4 flex flex-col gap-2 hover:bg-surface-container-low transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant font-medium">
                    {formatDate(txn.createdAt)}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      txn.type === 'IN'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {txn.type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-sm text-on-surface">
                    {txn.productId ? txn.productId.name : <span className="text-error">Unknown Product</span>}
                  </p>
                  <p className={`font-bold text-sm ${txn.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.type === 'IN' ? '+' : '-'}{txn.quantity}
                  </p>
                </div>
                {txn.reference && (
                  <p className="text-xs text-on-surface-variant bg-surface-container rounded px-2 py-1 self-start">
                    Ref: {txn.reference}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
