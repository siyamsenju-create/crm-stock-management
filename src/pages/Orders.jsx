import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('All Orders');

    const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get('/orders');
            setOrders(res.data);
        } catch (err) {
            setError(err.message || 'Failed to fetch orders');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(o => {
        if (filter === 'All Orders') return true;
        return o.status === filter;
    });

    const outstandingRevenue = orders
        .filter(o => o.status === 'Pending')
        .reduce((sum, o) => sum + (o.total || 0), 0);

    return (
        <Layout>
            <div className="flex justify-between items-end mb-xl">
                <div>
                    <h2 className="font-h1 text-h1 text-on-surface">Orders & Billing</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Manage your transactional history and financial documents.</p>
                </div>
                <div className="flex gap-sm">
                    <button className="flex items-center gap-xs px-4 py-2 bg-white border border-outline-variant text-on-surface font-label-md rounded-lg hover:bg-surface-container-low transition-all">
                        <span className="material-symbols-outlined text-[20px]">file_download</span>
                        Export
                    </button>
                    <button className="flex items-center gap-xs px-4 py-2 bg-primary text-on-primary font-label-md rounded-lg hover:opacity-90 transition-all shadow-md">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        New Order
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-12 gap-lg">
                <div className="col-span-12 xl:col-span-8 space-y-lg">
                    <div className="flex items-center justify-between p-md bg-white border border-outline-variant rounded-xl shadow-sm">
                        <div className="flex items-center gap-md">
                            <div className="flex bg-surface-container-low p-1 rounded-lg">
                                {['All Orders', 'Pending', 'Completed'].map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-1.5 font-label-md rounded-md transition-colors ${filter === f ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="text-body-sm text-on-surface-variant">
                            Showing <span className="font-bold text-on-surface">{filteredOrders.length}</span> orders
                        </div>
                    </div>

                    <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low/50">
                                    <th className="px-md py-4 text-left font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Order ID</th>
                                    <th className="px-md py-4 text-left font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Customer</th>
                                    <th className="px-md py-4 text-left font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Date</th>
                                    <th className="px-md py-4 text-left font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Amount</th>
                                    <th className="px-md py-4 text-left font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">Status</th>
                                    <th className="px-md py-4 text-right font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-outline-variant"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-variant">
                                {isLoading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-on-surface-variant">Loading orders...</td></tr>
                                ) : filteredOrders.map(o => {
                                    const customerName = o.customer?.name || 'Unknown';
                                    const dateStr = new Date(o.createdAt).toLocaleDateString();
                                    return (
                                    <tr key={o._id} className="hover:bg-surface-container-lowest transition-colors group">
                                        <td className="px-md py-4 font-label-md text-on-surface">#{o._id.substring(18).toUpperCase()}</td>
                                        <td className="px-md py-4">
                                            <div className="flex items-center gap-sm">
                                                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-primary-container text-on-primary-container`}>
                                                    {customerName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-body-md text-on-surface">{customerName}</span>
                                            </div>
                                        </td>
                                        <td className="px-md py-4 text-body-sm text-on-surface-variant">{dateStr}</td>
                                        <td className="px-md py-4 font-label-md text-on-surface">₹{(o.total || 0).toFixed(2)}</td>
                                        <td className="px-md py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                o.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                                (o.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700')
                                            }`}>
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-md py-4 text-right">
                                            <button className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">more_vert</button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                        {!isLoading && filteredOrders.length === 0 && (
                            <div className="p-8 text-center text-on-surface-variant">No orders match the selected filter.</div>
                        )}
                        <div className="p-md bg-surface-container-lowest flex items-center justify-between">
                            <span className="text-body-sm text-on-surface-variant">Page 1 of 1</span>
                            <div className="flex gap-sm">
                                <button className="px-3 py-1 border border-outline-variant rounded-lg text-body-sm opacity-50 cursor-not-allowed">Previous</button>
                                <button className="px-3 py-1 border border-outline-variant rounded-lg text-body-sm hover:bg-surface-container-high transition-colors">Next</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 xl:col-span-4 space-y-lg">
                    <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden p-xl space-y-md">
                        <div className="flex justify-between items-start">
                            <h3 className="font-h3 text-h3 text-on-surface">Quick Billing</h3>
                            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                        </div>
                        <div className="space-y-sm">
                            <div className="flex justify-between items-center text-body-sm">
                                <span className="text-on-surface-variant">Outstanding Revenue</span>
                                <span className="font-bold text-on-surface">₹{outstandingRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}