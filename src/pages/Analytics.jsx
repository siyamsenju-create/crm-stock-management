import { useState } from 'react';
import Layout from '../components/Layout';
import { useStore } from '../store';

const WEEKLY = [
    { day: 'Mon', sales: 12400, orders: 4 },
    { day: 'Tue', sales: 8800, orders: 3 },
    { day: 'Wed', sales: 18500, orders: 7 },
    { day: 'Thu', sales: 9200, orders: 3 },
    { day: 'Fri', sales: 21000, orders: 8 },
    { day: 'Sat', sales: 29800, orders: 11 },
    { day: 'Sun', sales: 5400, orders: 2 },
];
const MONTHLY = [
    { day: 'Week 1', sales: 85000, orders: 32 },
    { day: 'Week 2', sales: 112000, orders: 45 },
    { day: 'Week 3', sales: 97500, orders: 38 },
    { day: 'Week 4', sales: 134000, orders: 51 },
];
const YEARLY = [
    { day: 'Jan', sales: 320000, orders: 120 },
    { day: 'Feb', sales: 280000, orders: 105 },
    { day: 'Mar', sales: 410000, orders: 158 },
    { day: 'Apr', sales: 390000, orders: 142 },
    { day: 'May', sales: 450000, orders: 175 },
    { day: 'Jun', sales: 520000, orders: 201 },
    { day: 'Jul', sales: 480000, orders: 188 },
    { day: 'Aug', sales: 550000, orders: 215 },
    { day: 'Sep', sales: 430000, orders: 165 },
    { day: 'Oct', sales: 610000, orders: 230 },
    { day: 'Nov', sales: 680000, orders: 258 },
    { day: 'Dec', sales: 820000, orders: 310 },
];

export default function Analytics() {
    const { products, customers, orders } = useStore();
    const [period, setPeriod] = useState('Weekly');

    const data = period === 'Weekly' ? WEEKLY : period === 'Monthly' ? MONTHLY : YEARLY;
    const totalSales = data.reduce((s, d) => s + d.sales, 0);
    const totalOrders = data.reduce((s, d) => s + d.orders, 0);
    const maxSales = Math.max(...data.map(d => d.sales));
    const avgOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    const tabs = ['Weekly', 'Monthly', 'Yearly'];

    return (
        <Layout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-on-surface">Analytics & Reports</h1>
                    <p className="text-on-surface-variant mt-1">JJ Painting & Hardwares — Sales performance overview.</p>
                </div>
                {/* Period selector */}
                <div className="flex bg-surface-container-low rounded-xl p-1 gap-1">
                    {tabs.map(t => (
                        <button key={t} onClick={() => setPeriod(t)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${period === t ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}>{t}</button>
                    ))}
                </div>
            </div>

            {/* Status chips */}
            <div className="flex gap-3 mb-6 flex-wrap">
                {tabs.map(t => (
                    <span key={t} onClick={() => setPeriod(t)} className={`cursor-pointer px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${period === t ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary'}`}>
                        {t} Report {period === t ? '✓ Active' : ''}
                    </span>
                ))}
            </div>

            {/* KPI Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: `${period} Revenue`, value: `₹${totalSales.toLocaleString('en-IN')}`, icon: 'currency_rupee', color: 'text-primary', bg: 'bg-primary/10', change: '+14.2%' },
                    { label: `${period} Orders`, value: totalOrders, icon: 'receipt_long', color: 'text-green-700', bg: 'bg-green-50', change: '+8.7%' },
                    { label: 'Avg Order Value', value: `₹${avgOrder.toLocaleString('en-IN')}`, icon: 'trending_up', color: 'text-secondary', bg: 'bg-secondary/10', change: '+5.1%' },
                    { label: 'Total Products', value: products.length, icon: 'format_paint', color: 'text-purple-700', bg: 'bg-purple-50', change: '' },
                ].map(card => (
                    <div key={card.label} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                                <span className={`material-symbols-outlined ${card.color}`}>{card.icon}</span>
                            </div>
                            {card.change && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{card.change}</span>}
                        </div>
                        <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                        <div className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-on-surface">{period} Sales — JJ Painting & Hardwares</h2>
                    <span className="text-xs text-on-surface-variant">₹ in INR</span>
                </div>
                <div className="flex items-end gap-2 h-48">
                    {data.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <div className="relative group w-full">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    ₹{d.sales.toLocaleString('en-IN')}
                                </div>
                                <div
                                    className="w-full bg-primary rounded-t-lg hover:bg-primary/80 transition-colors"
                                    style={{ height: `${Math.round((d.sales / maxSales) * 160)}px` }}
                                />
                            </div>
                            <span className="text-[11px] text-on-surface-variant font-medium">{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-on-surface mb-4">Top Product Categories</h2>
                <div className="space-y-3">
                    {[
                        { cat: 'Exterior Paints', pct: 38 },
                        { cat: 'Interior Paints', pct: 28 },
                        { cat: 'Brushes & Rollers', pct: 16 },
                        { cat: 'Surface Preparation', pct: 11 },
                        { cat: 'Adhesives & Sealants', pct: 7 },
                    ].map(({ cat, pct }) => (
                        <div key={cat}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-on-surface font-medium">{cat}</span>
                                <span className="text-on-surface-variant">{pct}%</span>
                            </div>
                            <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }}/>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
