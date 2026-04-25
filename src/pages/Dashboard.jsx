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
        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: 'currency_rupee', change: '+12.5%', positive: true, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Active Customers', value: customers.filter(c => c.status === 'Active').length, icon: 'groups', change: '+4 this month', positive: true, color: 'text-green-700', bg: 'bg-green-50' },
        { label: 'Products in Stock', value: products.filter(p => p.stock > 0).length, icon: 'format_paint', change: `${lowStock} low stock`, positive: lowStock === 0, color: 'text-secondary', bg: 'bg-secondary/10' },
        { label: 'Pending Orders', value: pendingOrders, icon: 'receipt_long', change: 'Needs attention', positive: pendingOrders === 0, color: 'text-orange-700', bg: 'bg-orange-50' },
    ];

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-on-surface">Dashboard Overview</h1>
                    <p className="text-on-surface-variant mt-1">Welcome back! Here's what's happening at JJ Painting & Hardwares today.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span> Last 30 Days
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-md hover:brightness-110">
                        <span className="material-symbols-outlined text-[18px]">download</span> Download Report
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map(card => (
                    <div key={card.label} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                                <span className={`material-symbols-outlined ${card.color}`}>{card.icon}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${card.positive ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                {card.change}
                            </span>
                        </div>
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">{card.label}</p>
                        <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-12 gap-6">
                {/* Recent Orders */}
                <div className="col-span-12 lg:col-span-8">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-semibold text-lg text-on-surface">Recent Orders</h2>
                            <a href="/orders" className="text-primary text-sm font-medium hover:underline">View all</a>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-gray-100">
                                    <th className="px-6 py-3">Order ID</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.slice(0, 5).map(o => (
                                    <tr key={o.id} className="hover:bg-gray-50/60">
                                        <td className="px-6 py-3 text-sm font-medium text-on-surface">#{o.id}</td>
                                        <td className="px-6 py-3 text-sm text-on-surface">{o.customer}</td>
                                        <td className="px-6 py-3 text-sm font-semibold">₹{Number(o.total).toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${o.status === 'Completed' ? 'bg-green-100 text-green-700' : o.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                {o.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    {/* Low stock alert */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-semibold text-lg text-on-surface">Low Stock Alert</h2>
                            <span className="material-symbols-outlined text-yellow-500">warning</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {products.filter(p => p.stock < 20).slice(0, 4).map(p => (
                                <div key={p.id} className="px-6 py-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-on-surface truncate max-w-[160px]">{p.name}</p>
                                        <p className="text-xs text-on-surface-variant">{p.sku}</p>
                                    </div>
                                    <span className={`text-sm font-bold ${p.stock <= 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                                        {p.stock} left
                                    </span>
                                </div>
                            ))}
                            {products.filter(p => p.stock < 20).length === 0 && (
                                <p className="px-6 py-4 text-sm text-green-600 font-medium">✓ All items well stocked</p>
                            )}
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h2 className="font-semibold text-lg text-on-surface mb-4">Inventory Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-on-surface-variant">Total Product Lines</span>
                                <span className="font-bold">{products.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-on-surface-variant">Total Units</span>
                                <span className="font-bold">{totalItems.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-on-surface-variant">Inventory Value</span>
                                <span className="font-bold text-primary">₹{products.reduce((s, p) => s + p.price * p.stock, 0).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}