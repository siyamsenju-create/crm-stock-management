import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import {
    getOrdersFromFirebase,
    getCustomersFromFirebase,
    getProductsFromFirebase,
    saveOrderToFirebase
} from '../utils/firebaseDb';

// ─── New Order Modal ──────────────────────────────────────────────────────────
function NewOrderModal({ customers, products, onClose, onSuccess }) {
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [carrier, setCarrier] = useState('Standard Freight');
    const [orderItems, setOrderItems] = useState([]);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitState, setSubmitState] = useState('idle'); // idle | loading | success | error

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const total = subtotal;

    const handleCustomerChange = (e) => {
        const cid = e.target.value;
        setSelectedCustomer(cid);
        const found = customers.find(c => c.id === cid);
        if (found) {
            setCustomerName(found.name || '');
            setCustomerEmail(found.email || '');
        }
    };

    const addProduct = (product) => {
        const price = Number(product.price) || 0;
        const existing = orderItems.find(i => i.productId === product.id);
        if (existing) {
            setOrderItems(items => items.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
        } else {
            setOrderItems(items => [...items, { productId: product.id, name: product.name, image: product.image || '', price, qty: 1 }]);
        }
        setShowProductPicker(false);
    };

    const updateQty = (productId, qty) => {
        if (qty < 1) return;
        setOrderItems(items => items.map(i => i.productId === productId ? { ...i, qty } : i));
    };

    const removeItem = (productId) => {
        setOrderItems(items => items.filter(i => i.productId !== productId));
    };

    const handleFinalize = async () => {
        if (!selectedCustomer || orderItems.length === 0) {
            alert('Please select a customer and add at least one product.');
            return;
        }
        setIsSubmitting(true);
        setSubmitState('loading');
        try {
            await saveOrderToFirebase({
                customerId: selectedCustomer,
                customer: { name: customerName, email: customerEmail },
                items: orderItems.map(i => ({ productId: i.productId, quantity: i.qty, price: i.price })),
                subtotal,
                total,
                status: 'Pending',
                deliveryDate,
                carrier,
                shippingAddress
            });
            setSubmitState('success');
            setTimeout(() => { onSuccess(); onClose(); }, 1200);
        } catch (err) {
            console.error(err);
            setSubmitState('error');
            setIsSubmitting(false);
        }
    };

    const handleSaveDraft = async () => {
        if (orderItems.length === 0 && !selectedCustomer) {
            alert('Add at least a customer or product before saving a draft.');
            return;
        }
        try {
            await saveOrderToFirebase({
                customerId: selectedCustomer || '',
                customer: { name: customerName, email: customerEmail },
                items: orderItems.map(i => ({ productId: i.productId, quantity: i.qty, price: i.price })),
                subtotal,
                total,
                status: 'Draft',
                deliveryDate,
                carrier,
                shippingAddress
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Draft save error:', err);
            alert('Failed to save draft. Please try again.');
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-stretch md:items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto md:py-8 md:px-4">
            <div className="bg-[#fcf8fa] w-full md:max-w-4xl md:rounded-2xl shadow-2xl overflow-hidden border border-[#c6c6cd]/50 flex flex-col md:my-auto">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-[#c6c6cd] bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <nav className="flex items-center gap-1.5 text-xs text-[#45464d]">
                            <span className="hover:text-black cursor-pointer transition-colors">Orders</span>
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            <span className="text-black font-semibold">New Order</span>
                        </nav>
                    </div>
                    <button onClick={onClose} className="flex items-center justify-center w-9 h-9 hover:bg-[#eae7e9] rounded-full transition-colors">
                        <span className="material-symbols-outlined text-[#45464d]">close</span>
                    </button>
                </div>

                <div className="px-8 py-6 overflow-y-auto flex-1">
                    <h2 className="text-3xl font-bold text-black tracking-tight mb-8" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>New Order</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                        {/* ── Left column: Order Items + Actions ── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Order Items card */}
                            <section className="bg-white border border-[#c6c6cd] rounded-xl overflow-hidden shadow-sm">
                                <div className="px-6 py-4 flex justify-between items-center border-b border-[#c6c6cd] bg-[#f6f3f5]">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-black">shopping_bag</span>
                                        <h3 className="text-lg font-bold text-black" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Order Items</h3>
                                        {orderItems.length > 0 && (
                                            <span className="text-xs font-medium text-[#515f74] bg-[#d5e3fd] px-2 py-0.5 rounded-full">
                                                {orderItems.length} {orderItems.length === 1 ? 'Item' : 'Items'}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowProductPicker(true)}
                                        className="px-4 py-2.5 bg-black text-white rounded-lg text-xs font-semibold hover:opacity-80 active:scale-[0.97] transition-all min-h-[40px]"
                                    >
                                        + Add Product
                                    </button>
                                </div>

                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#f6f3f5]/50 border-b border-[#c6c6cd]">
                                            <tr>
                                                <th className="px-6 py-3 text-[10px] font-bold text-[#45464d] uppercase tracking-widest">Product</th>
                                                <th className="px-6 py-3 text-[10px] font-bold text-[#45464d] uppercase tracking-widest w-28 text-center">Qty</th>
                                                <th className="px-6 py-3 text-[10px] font-bold text-[#45464d] uppercase tracking-widest text-right">Price</th>
                                                <th className="px-2 py-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#c6c6cd]/50">
                                            {orderItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center gap-3 text-[#76777d]">
                                                            <span className="material-symbols-outlined text-4xl opacity-30">shopping_cart</span>
                                                            <p className="text-sm font-medium">No products added yet</p>
                                                            <p className="text-xs opacity-70">Click "+ Add Product" to begin</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : orderItems.map(item => (
                                                <tr key={item.productId} className="hover:bg-[#f6f3f5]/40 transition-colors group">
                                                    <td className="px-6 py-5 font-semibold text-black text-base" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.qty}
                                                            onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)}
                                                            className="w-16 bg-[#f6f3f5] border border-[#c6c6cd] rounded-lg py-2 text-center text-sm font-medium focus:border-black outline-none transition-colors min-h-[36px]"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-bold text-black text-base" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                                                        ₹{(item.price * item.qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-2 py-5">
                                                        <button onClick={() => removeItem(item.productId)} className="w-7 h-7 flex items-center justify-center rounded-full text-[#76777d] hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile items list */}
                                <div className="md:hidden p-4 space-y-4">
                                    {orderItems.length === 0 ? (
                                        <div className="py-8 text-center text-[#76777d] text-sm">No products yet. Tap "+ Add Product"</div>
                                    ) : orderItems.map(item => (
                                        <div key={item.productId} className="flex justify-between items-start py-2 border-b border-[#c6c6cd]/40 last:border-0">
                                            <div>
                                                <p className="font-semibold text-black text-sm">{item.name}</p>
                                                <p className="text-xs text-[#515f74] mt-0.5">{item.qty} × ₹{item.price.toLocaleString('en-IN')}</p>
                                            </div>
                                            <button onClick={() => removeItem(item.productId)} className="p-1 text-[#76777d] hover:text-red-500 transition-colors flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[20px]">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                            </section>

                            {/* ── Order Summary Card ── */}
                            <section className="bg-white border border-[#c6c6cd] rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-[#f6f3f5] border-b border-[#c6c6cd] flex items-center gap-3">
                                    <span className="material-symbols-outlined text-black text-[20px]">receipt_long</span>
                                    <h3 className="text-lg font-bold text-black" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Order Summary</h3>
                                </div>
                                <div className="px-6 py-5 space-y-3">
                                    <div className="flex justify-between items-center text-sm text-[#45464d]">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-black">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm text-[#45464d]">
                                        <span className="flex items-center gap-1.5">
                                            Shipping
                                            <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">FREE</span>
                                        </span>
                                        <span className="font-semibold text-black">₹0.00</span>
                                    </div>
                                    <div className="pt-3 border-t border-[#c6c6cd] flex justify-between items-center">
                                        <span className="text-base font-bold text-black" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Total Amount</span>
                                        <span className="text-2xl font-black text-black" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                                            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    {orderItems.length === 0 && (
                                        <p className="text-xs text-center text-[#76777d] pt-1">Add products to see the total</p>
                                    )}
                                </div>
                            </section>

                            {/* ── CTA buttons ── */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleFinalize}
                                    disabled={isSubmitting}
                                    className={`flex-1 px-8 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[48px] ${
                                        submitState === 'success' ? 'bg-green-500 text-white' :
                                        submitState === 'error'   ? 'bg-red-500 text-white' :
                                        'bg-black text-white hover:opacity-85'
                                    }`}
                                >
                                    {submitState === 'loading' && <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>}
                                    {submitState === 'success' && <span className="material-symbols-outlined text-[20px]">check_circle</span>}
                                    {submitState === 'idle' && 'Finalize Order'}
                                    {submitState === 'loading' && 'Saving...'}
                                    {submitState === 'success' && 'Order Created!'}
                                    {submitState === 'error' && 'Retry'}
                                </button>
                                <button
                                    onClick={handleSaveDraft}
                                    className="px-6 py-4 border border-[#c6c6cd] rounded-xl font-semibold text-[#45464d] hover:bg-[#f6f3f5] transition-colors flex items-center gap-2 text-sm min-h-[48px]"
                                >
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                    Save as Draft
                                </button>
                            </div>
                        </div>

                        {/* ── Right column: Customer + Logistics ── */}
                        <div className="flex flex-col gap-6 lg:col-span-1">

                            {/* Customer section */}
                            <section className="bg-[#f6f3f5]/70 p-6 rounded-xl border border-[#c6c6cd] space-y-5">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#c6c6cd]">
                                    <span className="material-symbols-outlined text-[#45464d] text-[18px]">person</span>
                                    <h4 className="font-semibold text-[#45464d] text-base" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Customer</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#45464d] uppercase tracking-widest block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Select Account</label>
                                        <select
                                            value={selectedCustomer}
                                            onChange={handleCustomerChange}
                                            className="w-full bg-white border border-[#c6c6cd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors min-h-[44px]"
                                        >
                                            <option value="">— Select Customer —</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#45464d] uppercase tracking-widest block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Full Name</label>
                                        <input
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            type="text"
                                            placeholder="Full name"
                                            className="w-full bg-white border border-[#c6c6cd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors min-h-[44px]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#45464d] uppercase tracking-widest block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Email</label>
                                        <input
                                            value={customerEmail}
                                            onChange={e => setCustomerEmail(e.target.value)}
                                            type="email"
                                            placeholder="email@example.com"
                                            className="w-full bg-white border border-[#c6c6cd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors min-h-[44px]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#45464d] uppercase tracking-widest block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Shipping Address</label>
                                        <textarea
                                            value={shippingAddress}
                                            onChange={e => setShippingAddress(e.target.value)}
                                            rows="2"
                                            placeholder="Street, City, State..."
                                            className="w-full bg-white border border-[#c6c6cd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors resize-none min-h-[64px]"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Logistics section */}
                            <section className="bg-[#f6f3f5]/70 p-6 rounded-xl border border-[#c6c6cd] space-y-5">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#c6c6cd]">
                                    <span className="material-symbols-outlined text-[#45464d] text-[18px]">local_shipping</span>
                                    <h4 className="font-semibold text-[#45464d] text-base" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>Logistics</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#45464d] uppercase tracking-widest block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Delivery Date</label>
                                        <input
                                            type="date"
                                            value={deliveryDate}
                                            onChange={e => setDeliveryDate(e.target.value)}
                                            className="w-full bg-white border border-[#c6c6cd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors min-h-[44px]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-[#45464d] uppercase tracking-widest block" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Carrier</label>
                                        <select
                                            value={carrier}
                                            onChange={e => setCarrier(e.target.value)}
                                            className="w-full bg-white border border-[#c6c6cd] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors min-h-[44px]"
                                        >
                                            <option>Standard Freight</option>
                                            <option>Priority Express</option>
                                            <option>Next-Day Air</option>
                                            <option>Direct Dispatch</option>
                                        </select>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* ── Product Picker Overlay ── */}
            {showProductPicker && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowProductPicker(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl min-w-[90vw] md:min-w-[900px] max-h-[85vh] overflow-hidden flex flex-col border border-gray-200" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b bg-white shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-black tracking-tight" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                                    Select a Product
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">{products.length} products available</p>
                            </div>
                            <button onClick={() => setShowProductPicker(false)} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors active:scale-90">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                            {products.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                    <span className="material-symbols-outlined text-5xl mb-3 opacity-30">inventory_2</span>
                                    <p className="text-sm font-medium">No products found</p>
                                    <p className="text-xs mt-1 opacity-70">Add products first from the Products page.</p>
                                </div>
                            ) : products.map(p => {
                                const qty = isNaN(Number(p.quantity)) ? 0 : Number(p.quantity);
                                const isLow = qty > 0 && qty < (p.lowStockThreshold || 20);
                                const isOut = qty <= 0;
                                return (
                                    <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                                        {/* Image */}
                                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                                            {p.image ? (
                                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                                    <span className="material-symbols-outlined text-primary text-[28px]">format_paint</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-black group-hover:text-primary transition-colors truncate">{p.name}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-bold uppercase">{p.category}</span>
                                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                    {isOut ? 'Out of stock' : `${qty} in stock`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price + Add */}
                                        <div className="flex items-center gap-4 shrink-0">
                                            <p className="text-base font-black text-black" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                                                ₹{Number(p.price || 0).toLocaleString('en-IN')}
                                            </p>
                                            <button
                                                onClick={() => addProduct(p)}
                                                className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:opacity-80 active:scale-95 transition-all flex items-center gap-1.5"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">add</span>
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// ─── Main Orders Page ─────────────────────────────────────────────────────────
export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('All Orders');
    const [showNewOrder, setShowNewOrder] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [ordersData, customersData, productsData] = await Promise.all([
                getOrdersFromFirebase(),
                getCustomersFromFirebase(),
                getProductsFromFirebase()
            ]);

            // Enrich orders with customer names
            const enriched = ordersData.map(o => {
                const customer = customersData.find(c => c.id === o.customerId);
                return { ...o, customer: o.customer || customer || { name: 'Unknown' } };
            });
            setOrders(enriched);
            setCustomers(customersData);
            setProducts(productsData);
        } catch (err) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredOrders = orders.filter(o => {
        if (filter === 'All Orders') return true;
        return o.status === filter;
    });

    const outstandingRevenue = orders.filter(o => o.status === 'Pending').reduce((sum, o) => sum + (o.total || 0), 0);
    const completedRevenue   = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders        = orders.length;
    const pendingCount       = orders.filter(o => o.status === 'Pending').length;

    const statusConfig = {
        Completed: 'bg-green-100 text-green-700',
        Pending:   'bg-amber-100 text-amber-700',
        Cancelled: 'bg-red-100 text-red-700',
        Draft:     'bg-gray-100 text-gray-600',
    };

    return (
        <Layout>
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-black tracking-tight" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                        Orders &amp; Billing
                    </h1>
                    <p className="text-sm text-[#45464d] mt-1">Manage transactions, create orders, and track billing.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#c6c6cd] text-[#45464d] text-sm font-semibold rounded-xl hover:bg-[#f6f3f5] transition-all min-h-[44px]">
                        <span className="material-symbols-outlined text-[18px]">file_download</span>
                        Export
                    </button>
                    <button
                        onClick={() => setShowNewOrder(true)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:opacity-80 transition-all shadow-md active:scale-[0.97] min-h-[44px]"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Order
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200 text-sm font-medium">
                    ⚠ {error}
                </div>
            )}

            {/* ── KPI strip ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Orders',       value: totalOrders,  icon: 'receipt_long',       color: 'text-black',         bg: 'bg-black/5' },
                    { label: 'Pending',            value: pendingCount, icon: 'pending_actions',    color: 'text-amber-700',     bg: 'bg-amber-50' },
                    { label: 'Outstanding (₹)',    value: `₹${outstandingRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: 'account_balance_wallet', color: 'text-blue-700', bg: 'bg-blue-50' },
                    { label: 'Completed Revenue',  value: `₹${completedRevenue.toLocaleString('en-IN',  { maximumFractionDigits: 0 })}`, icon: 'payments', color: 'text-green-700', bg: 'bg-green-50' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white border border-[#c6c6cd] rounded-xl p-5 shadow-sm">
                        <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                            <span className={`material-symbols-outlined ${stat.color} text-[20px]`}>{stat.icon}</span>
                        </div>
                        <p className="text-2xl font-bold text-black" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>{stat.value}</p>
                        <p className="text-xs text-[#45464d] mt-1 uppercase tracking-wider font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Filter bar + Table ── */}
            <div className="bg-white border border-[#c6c6cd] rounded-2xl shadow-sm overflow-hidden">
                {/* Filter tabs */}
                <div className="px-4 sm:px-6 py-4 border-b border-[#c6c6cd] flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-[#f6f3f5]/60">
                    <div className="flex bg-white border border-[#c6c6cd] rounded-xl p-1 gap-1 shadow-sm overflow-x-auto scrollbar-none max-w-full">
                        {['All Orders', 'Pending', 'Completed', 'Draft', 'Cancelled'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                                    filter === f
                                        ? 'bg-black text-white shadow-sm'
                                        : 'text-[#45464d] hover:text-black hover:bg-[#eae7e9]'
                                    }`}
                                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-[#45464d]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        <span className="font-bold text-black">{filteredOrders.length}</span> orders
                    </span>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#f6f3f5]/50 border-b border-[#c6c6cd]">
                                {['Order ID', 'Customer', 'Date', 'Amount', 'Status', ''].map(h => (
                                    <th key={h} className={`px-6 py-4 text-[10px] font-bold text-[#45464d] uppercase tracking-widest ${h === '' ? 'text-right' : ''}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#c6c6cd]/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-[#76777d]">
                                            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            <p className="text-sm">Loading orders...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-[#76777d]">
                                            <span className="material-symbols-outlined text-4xl opacity-30">receipt_long</span>
                                            <p className="text-sm font-medium">No {filter === 'All Orders' ? '' : filter.toLowerCase()} orders yet</p>
                                            <button onClick={() => setShowNewOrder(true)} className="mt-2 px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:opacity-80 transition-all">
                                                + Create First Order
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.map(o => {
                                const customerName = o.customer?.name || 'Unknown';
                                const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                                return (
                                    <tr key={o.id || o._id} className="hover:bg-[#f6f3f5]/40 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-black bg-[#e4e2e4] px-2 py-1 rounded-md" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                #{(o.id || o._id || '').substring(0, 6).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-[#dae2fd] text-[#3f465c] flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {customerName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-black">{customerName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-[#45464d]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{dateStr}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-black" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                                            ₹{(o.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusConfig[o.status] || 'bg-gray-100 text-gray-700'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${o.status === 'Completed' ? 'bg-green-500' : o.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-full text-[#76777d] hover:bg-[#eae7e9] hover:text-black transition-all opacity-0 group-hover:opacity-100">
                                                <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-[#c6c6cd]/40">
                    {isLoading ? (
                        <div className="px-6 py-16 text-center text-[#76777d]">
                            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm">Loading orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="px-6 py-16 text-center text-[#76777d]">
                            <span className="material-symbols-outlined text-4xl opacity-30">receipt_long</span>
                            <p className="text-sm font-medium mt-2">No {filter === 'All Orders' ? '' : filter.toLowerCase()} orders yet</p>
                        </div>
                    ) : filteredOrders.map(o => {
                        const customerName = o.customer?.name || 'Unknown';
                        const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                        return (
                            <div key={o.id || o._id} className="p-4 flex flex-col gap-3 hover:bg-[#f6f3f5]/20 transition-colors">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-black bg-[#e4e2e4] px-2 py-1 rounded-md" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                        #{(o.id || o._id || '').substring(0, 6).toUpperCase()}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusConfig[o.status] || 'bg-gray-100 text-gray-700'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${o.status === 'Completed' ? 'bg-green-500' : o.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                        {o.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-[#dae2fd] text-[#3f465c] flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {customerName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-black">{customerName}</p>
                                            <p className="text-xs text-[#45464d]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{dateStr}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-bold text-black" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                                            ₹{(o.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-[#c6c6cd] flex items-center justify-between bg-[#f6f3f5]/40">
                    <span className="text-xs text-[#45464d]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        Showing {filteredOrders.length} of {orders.length}
                    </span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 border border-[#c6c6cd] rounded-lg text-xs font-medium text-[#45464d] opacity-50 cursor-not-allowed">Previous</button>
                        <button className="px-3 py-1.5 border border-[#c6c6cd] rounded-lg text-xs font-medium text-[#45464d] hover:bg-[#eae7e9] transition-colors">Next</button>
                    </div>
                </div>
            </div>

            {/* ── New Order Modal ── */}
            {showNewOrder && (
                <NewOrderModal
                    customers={customers}
                    products={products}
                    onClose={() => setShowNewOrder(false)}
                    onSuccess={fetchData}
                />
            )}
        </Layout>
    );
}