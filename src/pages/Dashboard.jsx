import { useState } from 'react';
import Layout from '../components/Layout';
import { useStore } from '../store';

export default function Dashboard() {
    const { products, customers, orders } = useStore();

    const totalRevenue = orders.filter(o => o.status === 'Completed').reduce((s, o) => s + o.total, 0);
    const totalItems = products.reduce((s, p) => s + p.stock, 0);
    const lowStock = products.filter(p => p.stock < 20 && p.stock > 0).length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;

    const statCards = [
        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: 'account_balance_wallet', change: '+12.5%', positive: true, gradient: 'from-primary/20 to-primary/5', border: 'border-primary/20', text: 'text-primary' },
        { label: 'Active Customers', value: customers.filter(c => c.status === 'Active').length, icon: 'groups', change: '+4 this month', positive: true, gradient: 'from-green-500/20 to-green-500/5', border: 'border-green-500/20', text: 'text-green-600' },
        { label: 'Products in Stock', value: products.filter(p => p.stock > 0).length, icon: 'inventory_2', change: `${lowStock} low stock`, positive: lowStock === 0, gradient: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-600' },
        { label: 'Pending Orders', value: pendingOrders, icon: 'pending_actions', change: 'Needs attention', positive: pendingOrders === 0, gradient: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-600' },
    ];

    return (
        <Layout>
            <div className="relative mb-8 pb-8 border-b border-outline-variant/50">
                {/* Decorative background glow */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-50"></div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10 w-full">
                    <div className="flex-1 min-w-0 pr-4">
                        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 truncate pb-1">
                            Dashboard Overview
                        </h1>
                        <p className="text-on-surface-variant mt-2 text-sm md:text-base font-medium">
                            Welcome back! Here's your real-time snapshot of JJ Painting & Hardwares.
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button className="group flex items-center gap-2 px-5 py-2.5 bg-white/50 backdrop-blur-md border border-outline-variant rounded-xl text-sm font-semibold text-on-surface hover:bg-white hover:shadow-sm transition-all duration-300">
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">calendar_today</span> 
                            Last 30 Days
                        </button>
                        <button onClick={() => window.print()} className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                            <span className="material-symbols-outlined text-[18px]">download</span> 
                            Export Report
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map(card => (
                    <div key={card.label} className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                        {/* Hover Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out`}></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 rounded-xl bg-white border ${card.border} shadow-sm flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500`}>
                                    <span className={`material-symbols-outlined text-2xl ${card.text}`}>{card.icon}</span>
                                </div>
                                <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${card.positive ? 'bg-green-100/80 text-green-700' : 'bg-orange-100/80 text-orange-700'}`}>
                                    <span className="material-symbols-outlined text-[14px]">
                                        {card.positive ? 'trending_up' : 'warning'}
                                    </span>
                                    {card.change}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest mb-1">{card.label}</p>
                            <p className="text-3xl font-extrabold text-on-surface tracking-tight">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders - Spans 2 columns */}
                <div className="lg:col-span-2">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100/80 flex justify-between items-center bg-white/50">
                            <h2 className="font-bold text-lg text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">receipt_long</span>
                                Recent Orders
                            </h2>
                            <a href="/orders" className="text-primary text-sm font-bold hover:text-primary/80 transition-colors flex items-center gap-1 group">
                                View all <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </a>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant/80 border-b border-gray-100/80">
                                        <th className="px-6 py-4">Order ID</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50/80">
                                    {orders.slice(0, 5).map(o => (
                                        <tr key={o.id} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">#{o.id}</span>
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 border border-white shadow-sm">
                                                    {o.customer.substring(0,2).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-on-surface">{o.customer}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-on-surface">₹{Number(o.total).toLocaleString('en-IN')}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                    o.status === 'Completed' ? 'bg-green-100/80 text-green-700 border border-green-200/50' : 
                                                    o.status === 'Pending' ? 'bg-orange-100/80 text-orange-700 border border-orange-200/50' : 
                                                    'bg-red-100/80 text-red-700 border border-red-200/50'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${o.status === 'Completed' ? 'bg-green-500' : o.status === 'Pending' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                                                    {o.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right sidebar - 1 column */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Low stock alert */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-red-100 shadow-lg shadow-red-500/5 overflow-hidden">
                        <div className="px-6 py-5 border-b border-red-100 bg-red-50/50 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-red-700 flex items-center gap-2">
                                <span className="material-symbols-outlined">warning</span>
                                Action Required
                            </h2>
                            <span className="bg-red-100 text-red-700 text-xs font-extrabold px-2 py-1 rounded-md">{products.filter(p => p.stock < 20).length} Items</span>
                        </div>
                        <div className="divide-y divide-gray-50/80 p-2">
                            {products.filter(p => p.stock < 20).slice(0, 4).map(p => (
                                <div key={p.id} className="p-4 flex justify-between items-center hover:bg-red-50/30 rounded-xl transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 mt-2 rounded-full ${p.stock <= 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`}></div>
                                        <div>
                                            <p className="text-sm font-bold text-on-surface line-clamp-1">{p.name}</p>
                                            <p className="text-xs text-on-surface-variant mt-0.5">{p.sku}</p>
                                        </div>
                                    </div>
                                    <div className="text-right pl-3">
                                        <span className={`block text-lg font-black ${p.stock <= 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                            {p.stock}
                                        </span>
                                        <span className="text-[10px] uppercase font-bold text-gray-400">Left</span>
                                    </div>
                                </div>
                            ))}
                            {products.filter(p => p.stock < 20).length === 0 && (
                                <div className="p-8 text-center flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-on-surface">Inventory Healthy</p>
                                        <p className="text-xs text-on-surface-variant mt-1">All products are well stocked.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick stats summary */}
                    <div className="bg-gradient-to-br from-surface-container to-white rounded-2xl border border-outline-variant/30 shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 opacity-5">
                            <span className="material-symbols-outlined text-[150px]">inventory</span>
                        </div>
                        <h2 className="font-bold text-lg text-on-surface mb-6 relative z-10">Inventory Summary</h2>
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center p-3 rounded-xl bg-white/60 border border-gray-100">
                                <span className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">category</span> Product Lines
                                </span>
                                <span className="text-sm font-black text-on-surface bg-gray-100 px-2.5 py-1 rounded-md">{products.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-white/60 border border-gray-100">
                                <span className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">boxes</span> Total Units
                                </span>
                                <span className="text-sm font-black text-on-surface bg-gray-100 px-2.5 py-1 rounded-md">{totalItems.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-xl bg-primary/5 border border-primary/10 mt-2">
                                <span className="text-sm font-bold text-primary flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">account_balance</span> Total Value
                                </span>
                                <span className="text-lg font-black text-primary">₹{products.reduce((s, p) => s + p.price * p.stock, 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}