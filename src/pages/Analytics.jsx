import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getProductsFromFirebase, getOrdersFromFirebase, getCustomersFromFirebase } from '../utils/firebaseDb';

export default function Analytics() {
    const [period, setPeriod] = useState('Monthly');
    const [isLoading, setIsLoading] = useState(true);
    
    // Core Data
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [p, o, c] = await Promise.all([
                    getProductsFromFirebase(),
                    getOrdersFromFirebase(),
                    getCustomersFromFirebase()
                ]);
                setProducts(p);
                setOrders(o);
                setCustomers(c);
            } catch (err) {
                console.error("Error fetching analytics data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived Metrics
    const totalRevenue = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    
    // Cost of Goods Sold (Mocking 60% of revenue as cost for profit margin calculation)
    const costOfGoodsSold = totalRevenue * 0.6;
    const grossProfit = totalRevenue - costOfGoodsSold;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // LTV (Lifetime Value)
    const activeCustomers = customers.length;
    const ltv = activeCustomers > 0 ? totalRevenue / activeCustomers : 0;

    // Inventory Turnover Ratio (ITR)
    const avgInventoryValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
    const itr = avgInventoryValue > 0 ? costOfGoodsSold / avgInventoryValue : 0;

    // Linear Regression for Sales Projection (Next 3 Months)
    // Using a simple mathematical model based on dummy historical monthly data
    const historicalSales = [85000, 112000, 97500, 134000, 142000, 175000]; // last 6 months
    const n = historicalSales.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    historicalSales.forEach((y, x) => {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const nextMonthProjection = slope * n + intercept;

    const handleExportCSV = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Total Revenue', totalRevenue],
            ['Total Orders', totalOrders],
            ['Average Order Value', avgOrderValue],
            ['Gross Profit', grossProfit],
            ['Profit Margin (%)', profitMargin.toFixed(2)],
            ['Lifetime Value', ltv],
            ['Inventory Turnover Ratio', itr.toFixed(2)],
            ['Next Month Projection', nextMonthProjection.toFixed(2)]
        ];

        const csvContent = "data:text/csv;charset=utf-8," 
            + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "JJ_Painting_Analytics_Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[500px]">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-on-surface-variant font-medium">Compiling Analytics...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const tabs = ['Weekly', 'Monthly', 'Yearly'];

    return (
        <Layout>
            <div className="relative mb-8 pb-8 border-b border-outline-variant/50">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-50"></div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10 w-full">
                    <div className="flex-1 min-w-0 pr-4">
                        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 pb-1">
                            Business Intelligence
                        </h1>
                        <p className="text-on-surface-variant mt-2 text-sm md:text-base font-medium">
                            Advanced mathematical models and analytics for JJ Painting & Hardwares.
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0 items-center">
                        <div className="flex bg-surface-container-lowest border border-outline-variant rounded-xl p-1 shadow-sm">
                            {tabs.map(t => (
                                <button key={t} onClick={() => setPeriod(t)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === t ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'}`}>{t}</button>
                            ))}
                        </div>
                        <button onClick={handleExportCSV} className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-800 to-black text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                            <span className="material-symbols-outlined text-[18px]">download</span> 
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Advanced Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: 'account_balance', trend: '+12.5%', isPositive: true },
                    { label: 'Avg Order Value (AOV)', value: `₹${Math.round(avgOrderValue).toLocaleString('en-IN')}`, icon: 'shopping_cart', trend: '+4.2%', isPositive: true },
                    { label: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`, icon: 'pie_chart', trend: '+1.5%', isPositive: true },
                    { label: 'Customer LTV', value: `₹${Math.round(ltv).toLocaleString('en-IN')}`, icon: 'diamond', trend: '+8.4%', isPositive: true },
                ].map(metric => (
                    <div key={metric.label} className="bg-white/80 backdrop-blur-xl border border-gray-200/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                <span className="material-symbols-outlined">{metric.icon}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${metric.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {metric.trend}
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">{metric.label}</h3>
                        <p className="text-3xl font-extrabold text-on-surface tracking-tight">{metric.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Mathematical Projection Chart */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-sm p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-bold text-lg text-on-surface">Sales Projection Model</h2>
                            <p className="text-sm text-on-surface-variant">Linear Regression forecasting based on historical data</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-on-surface-variant">Next Month Est.</p>
                            <p className="text-2xl font-black text-secondary">₹{Math.round(nextMonthProjection).toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                    
                    {/* SVG Line Chart for Projection */}
                    <div className="flex-1 relative min-h-[250px] w-full flex items-end">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#2563eb" />
                                    <stop offset="70%" stopColor="#2563eb" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                                <linearGradient id="gradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            
                            {/* Grid lines */}
                            {[0, 50, 100, 150, 200].map(y => (
                                <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                            ))}

                            {/* Data points mapping for SVG */}
                            <path 
                                d="M0,150 L100,110 L200,125 L300,80 L400,60 L500,40" 
                                fill="none" 
                                stroke="url(#gradientLine)" 
                                strokeWidth="4" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                            />
                            <path 
                                d="M0,200 L0,150 L100,110 L200,125 L300,80 L400,60 L500,40 L500,200 Z" 
                                fill="url(#gradientArea)" 
                            />
                            
                            {/* Projection Line (Dashed) */}
                            <path 
                                d="M500,40 L600,10" 
                                fill="none" 
                                stroke="#10b981" 
                                strokeWidth="4" 
                                strokeDasharray="8 8" 
                            />

                            {/* Data Points */}
                            {[[0,150], [100,110], [200,125], [300,80], [400,60], [500,40], [600,10]].map((p, i) => (
                                <circle key={i} cx={p[0]} cy={p[1]} r="6" fill="white" stroke={i === 6 ? '#10b981' : '#2563eb'} strokeWidth="3" />
                            ))}
                        </svg>
                        
                        <div className="absolute -bottom-6 left-0 w-full flex justify-between text-xs font-bold text-on-surface-variant">
                            <span>M-5</span>
                            <span>M-4</span>
                            <span>M-3</span>
                            <span>M-2</span>
                            <span>M-1</span>
                            <span>Current</span>
                            <span className="text-secondary">Projection</span>
                        </div>
                    </div>
                </div>

                {/* Efficiency Gauges */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-sm p-6">
                        <h2 className="font-bold text-lg text-on-surface mb-6">Efficiency Indices</h2>
                        
                        <div className="mb-8">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-bold text-on-surface-variant">Inventory Turnover (ITR)</span>
                                <span className="font-black text-primary">{itr.toFixed(2)}x</span>
                            </div>
                            <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${Math.min((itr/5)*100, 100)}%` }}></div>
                            </div>
                            <p className="text-[10px] text-on-surface-variant mt-1 text-right">Target: 4.0x - 6.0x</p>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-bold text-on-surface-variant">Gross Margin</span>
                                <span className="font-black text-secondary">{profitMargin.toFixed(1)}%</span>
                            </div>
                            <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: `${Math.min(profitMargin, 100)}%` }}></div>
                            </div>
                            <p className="text-[10px] text-on-surface-variant mt-1 text-right">Target: &gt; 35%</p>
                        </div>
                    </div>

                    {/* Donut Chart Mockup via CSS */}
                    <div className="bg-gradient-to-br from-surface-container to-white rounded-2xl border border-outline-variant/30 shadow-sm p-6 relative overflow-hidden flex flex-col items-center justify-center">
                        <h3 className="w-full font-bold text-lg text-on-surface mb-6">Sales by Category</h3>
                        <div className="relative w-32 h-32 rounded-full flex items-center justify-center border-[16px] border-primary" style={{ borderRightColor: '#10b981', borderBottomColor: '#f59e0b' }}>
                            <div className="absolute inset-0 bg-white rounded-full m-1 flex items-center justify-center flex-col shadow-inner">
                                <span className="text-xs text-on-surface-variant font-bold uppercase">Top Cat.</span>
                                <span className="text-xl font-black text-primary">45%</span>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-6 text-xs font-bold text-on-surface-variant w-full justify-center">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary"></div> Paints</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Hardware</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Tools</span>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
