import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Papa from 'papaparse';
import { getCustomersFromFirebase, saveCustomerToFirebase, updateCustomerInFirebase } from '../utils/firebaseDb';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', location: '' });

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        status: 'Active',
        ordersCount: 0,
        totalSpent: 0
    });

    const fetchCustomers = useCallback(async () => {
        setTimeout(() => setIsLoading(true), 0);
        setError(null);
        try {
            const data = await getCustomersFromFirebase();
            setCustomers(data);
            
            // Keep selected customer details in drawer updated
            setSelectedCustomer(curr => {
                if (!curr) return null;
                const updated = data.find(c => c.id === curr.id);
                return updated || curr;
            });
        } catch (err) {
            setError(err.message || 'Failed to fetch customers');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            fetchCustomers();
        }, 0);
        return () => clearTimeout(t);
    }, [fetchCustomers]);

    const closeDrawer = () => {
        setDrawerVisible(false);
        setIsEditing(false);
        setTimeout(() => setSelectedCustomer(null), 250);
    };

    const handleRowClick = (c) => {
        if (selectedCustomer?.id === c.id) {
            closeDrawer();
        } else {
            setDrawerVisible(false);
            setIsEditing(false);
            setSelectedCustomer(c);
            setEditForm({
                name: c.name || '',
                email: c.email || '',
                phone: c.phone || '',
                location: c.location || '',
                status: c.status || 'Active',
                ordersCount: c.ordersCount || 0,
                totalSpent: c.totalSpent || 0
            });
            setTimeout(() => {
                setDrawerVisible(true);
            }, 50);
        }
    };

    const handleUpdateCustomer = async (e) => {
        e.preventDefault();
        try {
            await updateCustomerInFirebase(selectedCustomer.id, editForm);
            setIsEditing(false);
            const updatedCustomer = { ...selectedCustomer, ...editForm };
            setSelectedCustomer(updatedCustomer);
            fetchCustomers();
        } catch (err) {
            alert(err.message || 'Failed to update customer');
        }
    };

    const handleExport = () => {
        const csv = Papa.unparse(customers.map(c => ({
            Name: c.name,
            Phone: c.phone || '',
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
            await saveCustomerToFirebase(newCustomer);
            setIsAdding(false);
            setNewCustomer({ name: '', email: '', phone: '', location: '' });
            fetchCustomers();
        } catch (err) {
            alert(err.message || 'Failed to add customer');
        }
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-xl gap-4">
                <div>
                    <h1 className="font-h1 text-2xl sm:text-h1 text-on-surface mb-xs">Customer Directory</h1>
                    <p className="text-sm sm:text-body-md text-on-surface-variant">Manage and analyze your customer relationships and order history.</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <button onClick={handleExport} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-label-md font-semibold text-on-surface hover:bg-surface-container-low transition-all min-h-[44px]">
                        <span className="material-symbols-outlined text-[20px]" data-icon="file_download">file_download</span>
                        Export Log
                    </button>
                    <button onClick={() => setIsAdding(!isAdding)} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 min-h-[44px]">
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

            {selectedCustomer && (
                <div
                    onClick={closeDrawer}
                    className={`fixed inset-0 bg-black/40 transition-opacity duration-250 z-[45] ${drawerVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                />
            )}

            {selectedCustomer && (
                <div className={`fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white shadow-2xl z-[46] flex flex-col transition-transform duration-250 ease-out ${drawerVisible ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Customer Profile</p>
                                <p className="text-[11px] text-outline">{(selectedCustomer.id || selectedCustomer._id || '').substring(0, 8).toUpperCase()}</p>
                            </div>
                        </div>
                        <button onClick={closeDrawer} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    {!isEditing ? (
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
                                <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl shadow-inner mb-3">
                                    {(selectedCustomer.name || '??').substring(0, 2).toUpperCase()}
                                </div>
                                <h2 className="text-xl font-bold text-on-surface mb-1">{selectedCustomer.name}</h2>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${selectedCustomer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {selectedCustomer.status || 'Active'}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-outline">Contact Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">call</span>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Phone Number</p>
                                            <p className="text-sm font-semibold text-on-surface truncate">{selectedCustomer.phone || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">mail</span>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Email Address</p>
                                            <p className="text-sm font-semibold text-on-surface truncate">{selectedCustomer.email || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">location_on</span>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Location</p>
                                            <p className="text-sm font-semibold text-on-surface truncate">{selectedCustomer.location || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-outline">Activity Summary</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Total Orders</p>
                                        <p className="text-xl font-black text-primary">{selectedCustomer.ordersCount || 0}</p>
                                    </div>
                                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Total Spent</p>
                                        <p className="text-xl font-black text-primary">₹{(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateCustomer} className="flex-1 flex flex-col min-h-0 bg-white">
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Customer Name *</label>
                                    <input required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Email Address</label>
                                    <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Phone Number *</label>
                                    <input required type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Location *</label>
                                    <input required value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Status</label>
                                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Total Orders</label>
                                        <input type="number" min="0" value={editForm.ordersCount} onChange={e => setEditForm({ ...editForm, ordersCount: Number(e.target.value) })} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Total Spent (₹)</label>
                                        <input type="number" min="0" step="any" value={editForm.totalSpent} onChange={e => setEditForm({ ...editForm, totalSpent: Number(e.target.value) })} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-white transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10">
                                    <span className="material-symbols-outlined text-[16px]">save</span> Save Changes
                                </button>
                            </div>
                        </form>
                    )}

                    {!isEditing && (
                        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                            <button onClick={closeDrawer} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-white transition-colors">
                                Close
                            </button>
                            <button onClick={() => setIsEditing(true)} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10">
                                <span className="material-symbols-outlined text-[16px]">edit</span> Edit Details
                            </button>
                        </div>
                    )}
                </div>
            )}

            {isAdding && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <h3 className="font-h3 mb-4 text-on-surface">New Customer Details</h3>
                    <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Name</label>
                            <input required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 min-h-[44px]" placeholder="e.g. Acme Corp" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Email Address</label>
                            <input type="email" value={newCustomer.email || ''} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 min-h-[44px]" placeholder="e.g. info@acme.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Phone Number</label>
                            <input required type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 min-h-[44px]" placeholder="e.g. +91 98765 43210" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Location</label>
                            <input required value={newCustomer.location} onChange={e => setNewCustomer({...newCustomer, location: e.target.value})} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 min-h-[44px]" placeholder="e.g. New York, US" />
                        </div>
                        <button type="submit" className="bg-primary text-on-primary px-4 py-3 rounded-lg font-semibold md:col-span-4 min-h-[44px] active:scale-95 transition-all">Save Customer</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-lg mb-6 sm:mb-xl">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <span className="material-symbols-outlined" data-icon="group">group</span>
                        </div>
                    </div>
                    <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-xs">Total Customers</div>
                    <div className="text-2xl font-bold text-on-surface">{customers.length}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <span className="material-symbols-outlined" data-icon="shopping_cart_checkout">shopping_cart_checkout</span>
                        </div>
                    </div>
                    <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-xs">Total Orders</div>
                    <div className="text-2xl font-bold text-on-surface">{customers.reduce((acc, c) => acc + (c.ordersCount || 0), 0)}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <span className="material-symbols-outlined" data-icon="payments">payments</span>
                        </div>
                    </div>
                    <div className="text-on-surface-variant text-label-sm uppercase tracking-wider mb-xs">Avg. LTV</div>
                    <div className="text-2xl font-bold text-on-surface">₹{customers.length > 0 ? Math.round(customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0) / customers.length).toLocaleString('en-IN') : 0}</div>
                </div>
            </div>

            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-on-surface-variant text-[11px] font-bold uppercase tracking-widest border-b border-gray-100">
                                <th className="px-lg py-4">ID</th>
                                <th className="px-lg py-4">Name</th>
                                <th className="px-lg py-4">Phone Number</th>
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
                                    <tr key={c.id || c._id} onClick={() => handleRowClick(c)} className={`transition-all cursor-pointer group ${selectedCustomer?.id === c.id ? 'bg-indigo-50/60' : 'hover:bg-gray-50/80'}`}>
                                        <td className="px-lg py-4 text-on-surface-variant font-body-sm">{(c.id || c._id || '').substring(0, 6).toUpperCase()}</td>
                                        <td className="px-lg py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">{c.name.substring(0,2).toUpperCase()}</div>
                                                <span className="font-semibold text-on-surface">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-lg py-4 text-on-surface-variant font-body-sm">{c.phone || c.email || '—'}</td>
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

            <div className="md:hidden divide-y divide-gray-100 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-on-surface-variant">Loading customers...</div>
                ) : customers.length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant">No customers found.</div>
                ) : (
                    customers.map((c) => {
                        const initials = c.name ? c.name.substring(0,2).toUpperCase() : '??';
                        return (
                            <div key={c.id || c._id} onClick={() => handleRowClick(c)} className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${selectedCustomer?.id === c.id ? 'bg-indigo-50/60' : 'hover:bg-gray-50/80'}`}>
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-on-surface truncate">{c.name}</p>
                                    <p className="text-xs text-on-surface-variant truncate">{c.phone || c.email || '—'}</p>
                                    <p className="text-xs text-on-surface-variant mt-1">{c.location}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {c.status}
                                    </span>
                                    <p className="text-xs font-semibold text-on-surface mt-1">{c.ordersCount || 0} Orders</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Layout>
    );
}