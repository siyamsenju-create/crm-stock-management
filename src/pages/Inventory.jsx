import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/client';
import Papa from 'papaparse';

const getStatus = (stock, lowThreshold = 20) => {
    if (stock <= 0) return 'Out of Stock';
    if (stock < lowThreshold) return 'Low Stock';
    return 'In Stock';
};

const statusColor = (s) =>
    s === 'In Stock' ? 'bg-green-100 text-green-800' :
    s === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [restockTarget, setRestockTarget] = useState('');
    const [restockAmount, setRestockAmount] = useState('');
    const [isRestocking, setIsRestocking] = useState(false);
    const [search, setSearch] = useState('');

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/products?limit=1000');
            const mapped = (res.data || []).map(p => ({
                id: p._id,
                name: p.name,
                sku: p.sku || '',
                category: p.category,
                price: p.price,
                stock: p.quantity,
                status: getStatus(p.quantity, p.lowStockThreshold || 20),
                lowStockThreshold: p.lowStockThreshold || 20
            }));
            setProducts(mapped);
            
            if (selectedProduct) {
                const updated = mapped.find(p => p.id === selectedProduct.id);
                if (updated) setSelectedProduct(updated);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            const t = setTimeout(() => setDrawerVisible(true), 10);
            return () => clearTimeout(t);
        } else {
            setDrawerVisible(false);
        }
    }, [selectedProduct]);

    const closeDrawer = () => {
        setDrawerVisible(false);
        setTimeout(() => setSelectedProduct(null), 250);
    };

    const handleRowClick = (p) => {
        if (selectedProduct?.id === p.id) {
            closeDrawer();
        } else {
            setDrawerVisible(false);
            setTimeout(() => setSelectedProduct(p), selectedProduct ? 200 : 0);
        }
    };

    const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
    const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const lowStockCount = products.filter(p => p.stock < p.lowStockThreshold && p.stock > 0).length;
    const outOfStockCount = products.filter(p => p.stock <= 0).length;

    const filtered = products.filter(p =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleExport = () => {
        const csv = Papa.unparse(products.map(p => ({
            Name: p.name, SKU: p.sku, Category: p.category,
            Price: p.price, Stock: p.stock,
            Value: p.price * p.stock, Status: p.status
        })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'jj_painting_inventory.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRestock = async (e) => {
        e.preventDefault();
        if (restockTarget && restockAmount) {
            try {
                await api.post('/transactions', {
                    productId: restockTarget,
                    type: 'IN',
                    quantity: Number(restockAmount),
                    reference: 'Manual Restock'
                });
                setRestockAmount('');
                setRestockTarget('');
                setIsRestocking(false);
                fetchProducts();
            } catch (err) {
                alert(err.message || 'Failed to restock');
            }
        }
    };

    const quickRestock = async (e) => {
        e.preventDefault();
        if (restockAmount && Number(restockAmount) > 0) {
            try {
                await api.post('/transactions', {
                    productId: selectedProduct.id,
                    type: 'IN',
                    quantity: Number(restockAmount),
                    reference: 'Quick Restock'
                });
                setRestockAmount('');
                fetchProducts();
            } catch (err) {
                alert(err.message || 'Failed to restock');
            }
        }
    };

    const stockPct = (p) => Math.min(100, Math.round((p.stock / Math.max(p.stock + 30, 100)) * 100));

    return (
        <Layout>
            {selectedProduct && (
                <div
                    onClick={closeDrawer}
                    className={`fixed inset-0 bg-black/40 transition-opacity duration-250 z-[45] ${drawerVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                />
            )}

            {selectedProduct && (
                <div className={`fixed top-0 right-0 h-full w-[360px] max-w-[90vw] bg-white shadow-2xl z-[46] flex flex-col transition-transform duration-250 ease-out ${drawerVisible ? 'translate-x-0' : 'translate-x-full'}`}>

                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-[18px]">format_paint</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Inventory Detail</p>
                                <p className="text-[11px] text-outline">{selectedProduct.id}</p>
                            </div>
                        </div>
                        <button onClick={closeDrawer} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        <div className="w-full h-36 rounded-xl overflow-hidden border border-gray-100 bg-gradient-to-br from-indigo-50 to-gray-50 flex items-center justify-center">
                            {selectedProduct.image
                                ? <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover"/>
                                : <div className="flex flex-col items-center gap-2">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 48 }}>format_paint</span>
                                    <p className="text-xs text-on-surface-variant">No image</p>
                                  </div>
                            }
                        </div>

                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-on-surface leading-tight">{selectedProduct.name}</h2>
                            <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(selectedProduct.status)}`}>
                                {selectedProduct.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'SKU', value: selectedProduct.sku || '—', icon: 'qr_code' },
                                { label: 'Category', value: selectedProduct.category, icon: 'category' },
                                { label: 'Unit Price', value: `₹${Number(selectedProduct.price).toLocaleString('en-IN')}`, icon: 'currency_rupee' },
                                { label: 'Stock', value: `${selectedProduct.stock} units`, icon: 'inventory_2' },
                            ].map(({ label, value, icon }) => (
                                <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="material-symbols-outlined text-primary text-[14px]">{icon}</span>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
                                    </div>
                                    <p className="text-sm font-bold text-on-surface truncate">{value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-on-surface">Stock Level</span>
                                <span className="text-sm font-bold text-primary">{selectedProduct.stock} units</span>
                            </div>
                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${selectedProduct.stock <= 0 ? 'bg-red-500' : selectedProduct.stock < selectedProduct.lowStockThreshold ? 'bg-yellow-500' : 'bg-primary'}`}
                                    style={{ width: `${stockPct(selectedProduct)}%` }}
                                />
                            </div>
                            {selectedProduct.stock < selectedProduct.lowStockThreshold && selectedProduct.stock > 0 && (
                                <p className="text-xs text-yellow-700 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">warning</span>
                                    Low stock — restock soon
                                </p>
                            )}
                            {selectedProduct.stock <= 0 && (
                                <p className="text-xs text-red-700 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">error</span>
                                    Out of stock — restock required
                                </p>
                            )}
                        </div>

                        <div className="rounded-xl p-4 bg-primary/5 border border-primary/20">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Total Inventory Value</p>
                            <p className="text-2xl font-black text-primary">₹{(selectedProduct.price * selectedProduct.stock).toLocaleString('en-IN')}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                                {selectedProduct.stock} × ₹{Number(selectedProduct.price).toLocaleString('en-IN')}
                            </p>
                        </div>

                        <div className="rounded-xl p-4 border border-outline-variant/40 bg-surface-container-low">
                            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Quick Restock</p>
                            <form onSubmit={quickRestock} className="flex gap-2">
                                <input
                                    type="number" min="1"
                                    value={restockAmount}
                                    onChange={e => setRestockAmount(e.target.value)}
                                    placeholder="Units to add"
                                    className="flex-1 border border-outline-variant rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all whitespace-nowrap">
                                    + Restock
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                        <button onClick={closeDrawer} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-white transition-colors">Close</button>
                        <button className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:brightness-110 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-on-surface">Inventory Control</h1>
                    <p className="text-on-surface-variant mt-1">Click any row to view details or quick-restock. Real-time stock for paints, tools & hardware.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-low transition-all">
                        <span className="material-symbols-outlined text-[18px]">file_download</span> Export CSV
                    </button>
                    <button
                        onClick={() => setIsRestocking(!isRestocking)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isRestocking ? 'bg-error text-white' : 'bg-primary text-white hover:brightness-110'}`}>
                        <span className="material-symbols-outlined text-[18px]">{isRestocking ? 'close' : 'add_box'}</span>
                        {isRestocking ? 'Cancel' : 'Restock Product'}
                    </button>
                </div>
            </div>

            {isRestocking && (
                <div className="bg-white p-6 rounded-xl border border-primary/30 shadow-md mb-6 ring-1 ring-primary/10">
                    <h3 className="font-semibold text-lg text-on-surface mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">add_box</span> Restock Product
                    </h3>
                    <form onSubmit={handleRestock} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Select Product</label>
                            <select required value={restockTarget} onChange={e => setRestockTarget(e.target.value)} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-primary outline-none">
                                <option value="" disabled>Choose a product…</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} — Current: {p.stock} units</option>)}
                            </select>
                        </div>
                        <div className="w-full sm:w-40">
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Units to Add</label>
                            <input required type="number" min="1" value={restockAmount} onChange={e => setRestockAmount(e.target.value)} className="w-full border border-outline-variant rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. 50"/>
                        </div>
                        <button type="submit" className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:brightness-110">Confirm Restock</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Stock Units', value: totalItems.toLocaleString('en-IN'), icon: 'inventory_2', color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Inventory Value', value: `₹${totalValue.toLocaleString('en-IN')}`, icon: 'payments', color: 'text-green-700', bg: 'bg-green-50' },
                    { label: 'Low Stock Items', value: lowStockCount, icon: 'warning', color: 'text-yellow-700', bg: 'bg-yellow-50' },
                    { label: 'Out of Stock', value: outOfStockCount, icon: 'remove_shopping_cart', color: 'text-red-700', bg: 'bg-red-50' },
                ].map(card => (
                    <div key={card.label} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                            <span className={`material-symbols-outlined ${card.color}`}>{card.icon}</span>
                        </div>
                        <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                        <div className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">{card.label}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                    <div className="relative max-w-sm flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white border border-outline-variant rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Search inventory…"/>
                    </div>
                    <p className="text-xs text-on-surface-variant hidden sm:block">Click a row to view details & quick-restock</p>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-gray-100">
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Unit Price</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4">Total Value</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 w-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-on-surface-variant">Loading inventory...</td></tr>
                            ) : filtered.map(p => (
                                <tr key={p.id} onClick={() => handleRowClick(p)}
                                    className={`transition-all cursor-pointer group ${selectedProduct?.id === p.id ? 'bg-indigo-50/60' : 'hover:bg-gray-50/80'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {p.image
                                                ? <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"/>
                                                : <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-primary text-[18px]">format_paint</span>
                                                  </div>
                                            }
                                            <span className="font-semibold text-sm text-on-surface">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-on-surface-variant">{p.sku || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-on-surface-variant">{p.category}</td>
                                    <td className="px-6 py-4 font-semibold text-sm">₹{Number(p.price).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`font-bold text-sm ${p.stock <= 0 ? 'text-red-600' : p.stock < p.lowStockThreshold ? 'text-yellow-600' : 'text-on-surface'}`}>{p.stock}</span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-sm">₹{(p.price * p.stock).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`material-symbols-outlined text-[18px] transition-colors ${selectedProduct?.id === p.id ? 'text-primary' : 'text-gray-300 group-hover:text-primary'}`}>chevron_right</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y divide-gray-100">
                    {isLoading ? (
                        <div className="p-8 text-center text-on-surface-variant">Loading inventory...</div>
                    ) : filtered.map(p => (
                        <div key={p.id} onClick={() => handleRowClick(p)}
                            className={`flex items-center gap-4 px-4 py-4 cursor-pointer transition-colors ${selectedProduct?.id === p.id ? 'bg-indigo-50/60' : 'hover:bg-gray-50'}`}>
                            {p.image
                                ? <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"/>
                                : <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary">format_paint</span>
                                  </div>
                            }
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-on-surface truncate">{p.name}</p>
                                <p className="text-xs text-on-surface-variant">{p.category}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-primary">₹{Number(p.price).toLocaleString('en-IN')}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                                    <span className="text-xs text-on-surface-variant">{p.stock} units</span>
                                </div>
                            </div>
                            <span className={`material-symbols-outlined text-[20px] shrink-0 ${selectedProduct?.id === p.id ? 'text-primary' : 'text-gray-300'}`}>chevron_right</span>
                        </div>
                    ))}
                </div>

                {!isLoading && filtered.length === 0 && (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-outline mb-3 block">inventory_2</span>
                        <p className="text-on-surface-variant font-medium">No items match your search</p>
                        <button onClick={() => setSearch('')} className="mt-3 text-primary text-sm hover:underline">Clear search</button>
                    </div>
                )}

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between text-sm text-on-surface-variant">
                    <span>Showing <span className="font-bold text-on-surface">{filtered.length}</span> of {products.length} items</span>
                    {selectedProduct && <span className="text-primary text-xs font-medium">Viewing: {selectedProduct.name}</span>}
                </div>
            </div>
        </Layout>
    );
}