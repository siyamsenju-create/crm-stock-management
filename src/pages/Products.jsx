import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import Papa from 'papaparse';

const CATEGORIES = [
    'All', 'Exterior Paints', 'Interior Paints', 'Primers & Undercoats',
    'Distempers & Textures', 'Brushes & Rollers', 'Surface Preparation',
    'Adhesives & Sealants', 'Hardware & Fasteners', 'Safety Equipment', 'Other'
];

const getStatus = (stock, lowThreshold = 20) => {
    if (stock <= 0) return 'Out of Stock';
    if (stock < lowThreshold) return 'Low Stock';
    return 'In Stock';
};

const statusColor = (s) =>
    s === 'In Stock' ? 'bg-green-100 text-green-800' :
    s === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

export default function Products() {
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const fileInputRef = useRef(null);

    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get('/products?limit=1000'); // fetch all for now, to keep client-side filtering working
            const mapped = (res.data || []).map(p => ({
                id: p._id,
                name: p.name,
                sku: p.sku || '',
                category: p.category,
                price: p.price,
                stock: p.quantity,
                status: getStatus(p.quantity, p.lowStockThreshold || 20),
                lowStockAlert: p.lowStockThreshold || 20
            }));
            setProducts(mapped);
            
            // Re-select if open
            if (selectedProduct) {
                const updated = mapped.find(p => p.id === selectedProduct.id);
                if (updated) setSelectedProduct(updated);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch products');
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

    useEffect(() => {
        if (location.state?.search) {
            setSearchQuery(location.state.search);
        }
    }, [location.state]);

    const closeDrawer = () => {
        setDrawerVisible(false);
        setTimeout(() => setSelectedProduct(null), 250);
    };

    const handleRowClick = (p) => {
        if (selectedProduct?.id === p.id) {
            closeDrawer();
        } else {
            setDrawerVisible(false);
            setTimeout(() => {
                setSelectedProduct(p);
            }, selectedProduct ? 200 : 0);
        }
    };

    const filteredProducts = products.filter(p => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            p.name.toLowerCase().includes(q) ||
            (p.sku || '').toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q);
        const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
        return matchesSearch && matchesCat;
    });

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const mapped = results.data.map(row => ({
                    name: row.name || row.Name || 'Unknown',
                    sku: row.sku || row.SKU || '',
                    category: row.category || row.Category || 'Other',
                    price: Number(row.price || row.Price || 0),
                    quantity: Number(row.stock || row.Stock || 0)
                }));
                
                try {
                    // Import sequentially
                    for(const product of mapped) {
                        await api.post('/products', product);
                    }
                    alert('Products imported successfully!');
                    fetchProducts();
                } catch(err) {
                    alert('Error during import: ' + err.message);
                }
            }
        });
        e.target.value = '';
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
                                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Product Details</p>
                                <p className="text-[11px] text-outline">{selectedProduct.id}</p>
                            </div>
                        </div>
                        <button onClick={closeDrawer} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        <div className="w-full h-40 rounded-xl overflow-hidden border border-gray-100 bg-gradient-to-br from-indigo-50 to-gray-50 flex items-center justify-center">
                            {selectedProduct.image
                                ? <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover"/>
                                : <div className="flex flex-col items-center gap-2">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 56 }}>format_paint</span>
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

                        {selectedProduct.description && (
                            <p className="text-sm text-on-surface-variant leading-relaxed">{selectedProduct.description}</p>
                        )}

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
                                    className={`h-full rounded-full ${
                                        selectedProduct.stock <= 0 ? 'bg-red-500' :
                                        selectedProduct.stock < 20 ? 'bg-yellow-500' : 'bg-primary'
                                    }`}
                                    style={{ width: `${stockPct(selectedProduct)}%` }}
                                />
                            </div>
                            {selectedProduct.stock < 20 && selectedProduct.stock > 0 && (
                                <p className="text-xs text-yellow-700 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">warning</span>
                                    Low stock — consider restocking soon
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
                                {selectedProduct.stock} units × ₹{Number(selectedProduct.price).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                        <button onClick={closeDrawer} className="flex-1 py-2.5 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-white transition-colors">
                            Close
                        </button>
                        <button className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-on-surface">Products Catalog</h1>
                    <p className="text-on-surface-variant mt-1">Click any row to view product details.</p>
                </div>
                <div className="flex gap-3">
                    <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-low transition-all">
                        <span className="material-symbols-outlined text-[18px]">upload_file</span> Import CSV
                    </button>
                    <button onClick={() => navigate('/products/add')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-md">
                        <span className="material-symbols-outlined text-[18px]">add</span> Add Product
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-outline-variant rounded-lg pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            placeholder="Search by name, SKU, or category..."
                            type="text"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORIES.slice(0, 6).map(cat => (
                            <button key={cat} onClick={() => setCategoryFilter(cat)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap border ${
                                    categoryFilter === cat ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                                }`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-gray-100">
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 w-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-on-surface-variant">Loading products...</td></tr>
                            ) : filteredProducts.map(p => (
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
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`font-bold ${p.stock <= 0 ? 'text-red-600' : p.stock < 20 ? 'text-yellow-600' : 'text-on-surface'}`}>{p.stock}</span>
                                        <span className="text-on-surface-variant"> units</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`material-symbols-outlined text-[18px] ${selectedProduct?.id === p.id ? 'text-primary' : 'text-gray-300 group-hover:text-primary'} transition-colors`}>
                                            {selectedProduct?.id === p.id ? 'chevron_right' : 'chevron_right'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y divide-gray-100">
                    {isLoading ? (
                        <div className="p-8 text-center text-on-surface-variant">Loading products...</div>
                    ) : filteredProducts.map(p => (
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
                                </div>
                            </div>
                            <span className={`material-symbols-outlined text-[20px] shrink-0 ${selectedProduct?.id === p.id ? 'text-primary' : 'text-gray-300'}`}>chevron_right</span>
                        </div>
                    ))}
                </div>

                {!isLoading && filteredProducts.length === 0 && (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-outline mb-3 block">search_off</span>
                        <p className="text-on-surface-variant font-medium">No products found</p>
                        <button onClick={() => { setSearchQuery(''); setCategoryFilter('All'); }} className="mt-3 text-primary text-sm hover:underline">Clear filters</button>
                    </div>
                )}

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-sm text-on-surface-variant">
                    <span>Showing <span className="font-bold text-on-surface">{filteredProducts.length}</span> of {products.length} products</span>
                    {selectedProduct && <span className="text-primary text-xs font-medium">Viewing: {selectedProduct.name}</span>}
                </div>
            </div>
        </Layout>
    );
}