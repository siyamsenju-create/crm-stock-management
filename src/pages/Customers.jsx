import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import Papa from 'papaparse';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', location: '' });

    const fetchCustomers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (err) {
            setError(err.message || 'Failed to fetch customers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleExport = () => {
        const csv = Papa.unparse(customers.map(c => ({
            Name: c.name,
            Email: c.email,
            Location: c.location,
            'Total Orders': c.ordersCount,
            'Total Spent': c.totalSpent,
            Status: c.status
        })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'customers_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        try {
            await api.post('/customers', newCustomer);
            setIsAdding(false);
            setNewCustomer({ name: '', email: '', location: '' });
            fetchCustomers();
        } catch (err) {
            alert(err.message || 'Failed to add customer');
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-end mb-xl">
                <div>
                    <h1 className="font-h1 text-h1 text-on-surface mb-xs">Customer Directory</h1>
                    <p className="text-body-md text-on-surface-variant">Manage and analyze your customer relationships and order history.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg text-label-md font-semibold text-on-surface hover:bg-surface-container-low transition-all">
                        <span className="material-symbols-outlined text-[20px]" data-icon="file_download">file_download</span>
                        Export Log
                    </button>
                    <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
                        <span className="material-symbols-outlined text-[20px]" data-icon="add">add</span>
                        {isAdding ? 'Cancel' : 'Add Customer'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
                    {error}
                </div>
            )}

            {isAdding && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <h3 className="font-h3 mb-4 text-on-surface">New Customer Details</h3>
                    <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Name</label>
                            <input required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full border border-outline-variant rounded-lg px-3 py-2" placeholder="e.g. Acme Corp" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
                            <input required type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full border border-outline-variant rounded-lg px-3 py-2" placeholder="e.g. contact@acme.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Location</label>
                            <input required value={newCustomer.location} onChange={e => setNewCustomer({...newCustomer, location: e.target.value})} className="w-full border border-outline-variant rounded-lg px-3 py-2" placeholder="e.g. New York, US" />
                        </div>
                        <button type="submit" className="bg-primary text-on-primary px-4 py-2 rounded-lg font-semibold md:col-span-3">Save Customer</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-xl">
                <div className="bg-white p-lg rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-md">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <span className="material-symbols-outlined" data-icon="group">group</span>
                        </div>
                    </div>
                    <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-xs">Total Customers</div>
                    <div className="text-h2 font-h2 text-on-surface">{customers.length}</div>
                </div>
                <div className="bg-white p-lg rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-md">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <span className="material-symbols-outlined" data-icon="shopping_cart_checkout">shopping_cart_checkout</span>
                        </div>
                    </div>
                    <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-xs">Total Orders</div>
                    <div className="text-h2 font-h2 text-on-surface">{customers.reduce((acc, c) => acc + (c.ordersCount || 0), 0)}</div>
                </div>
                <div className="bg-white p-lg rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-md">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <span className="material-symbols-outlined" data-icon="payments">payments</span>
                        </div>
                    </div>
                    <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-xs">Avg. LTV</div>
                    <div className="text-h2 font-h2 text-on-surface">₹{customers.length > 0 ? Math.round(customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0) / customers.length) : 0}</div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-on-surface-variant text-[11px] font-bold uppercase tracking-widest border-b border-gray-100">
                                <th className="px-lg py-4">ID</th>
                                <th className="px-lg py-4">Name</th>
                                <th className="px-lg py-4">Email</th>
                                <th className="px-lg py-4">Location</th>
                                <th className="px-lg py-4">Total Orders</th>
                                <th className="px-lg py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-on-surface-variant">Loading customers...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-on-surface-variant">No customers found.</td></tr>
                            ) : (
                                customers.map((c) => (
                                    <tr key={c._id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-lg py-4 text-on-surface-variant font-body-sm">{c._id.substring(18).toUpperCase()}</td>
                                        <td className="px-lg py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">{c.name.substring(0,2).toUpperCase()}</div>
                                                <span className="font-semibold text-on-surface">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-lg py-4 text-on-surface-variant font-body-sm">{c.email}</td>
                                        <td className="px-lg py-4 text-on-surface-variant font-body-sm">{c.location}</td>
                                        <td className="px-lg py-4 text-on-surface font-semibold">{c.ordersCount || 0} Orders</td>
                                        <td className="px-lg py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}