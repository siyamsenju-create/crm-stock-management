import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getProductsFromFirebase, getOrdersFromFirebase, getCustomersFromFirebase } from '../utils/firebaseDb';

/* ─── Design Tokens (from stitch reference) ──────────────────────────────── */
const C = {
    primary:       '#0605bf',
    primaryCont:   '#2d34d3',
    secondary:     '#4648d4',
    secondaryCont: '#6063ee',
    tertiary:      '#005a3c',
    tertiaryFixed: '#4edea3',
    surface:       '#f9f9ff',
    surfaceLow:    '#f0f3ff',
    surfaceCont:   '#e7eeff',
    surfaceHigh:   '#dee8ff',
    onSurface:     '#111c2d',
    onSurfaceVar:  '#454555',
    outline:       '#767687',
    outlineVar:    '#c6c5d8',
    error:         '#ba1a1a',
    errorCont:     '#ffdad6',
};

export default function Analytics() {
    const [period, setPeriod]         = useState('Monthly');
    const [isLoading, setIsLoading]   = useState(true);
    const [mobileTab, setMobileTab]   = useState('overview');
    const [products, setProducts]     = useState([]);
    const [orders, setOrders]         = useState([]);
    const [customers, setCustomers]   = useState([]);
    const [inventorySearch, setInventorySearch]   = useState('');
    const [inventoryCategory, setInventoryCategory] = useState('ALL');
    const [customerSearch, setCustomerSearch]     = useState('');
    const [customerFilter, setCustomerFilter]     = useState('All');

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            try {
                const [p, o, c] = await Promise.all([
                    getProductsFromFirebase(),
                    getOrdersFromFirebase(),
                    getCustomersFromFirebase()
                ]);
                setProducts(p); setOrders(o); setCustomers(c);
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        })();
    }, []);

    /* ── Derived Metrics ──────────────────────────────────────────────────── */
    const completedOrders      = orders.filter(o => o.status === 'Completed');
    const totalRevenue         = completedOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const avgOrderValue        = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const cogs                 = totalRevenue * 0.6;
    const grossProfit          = totalRevenue - cogs;
    const profitMargin         = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 28.4;
    const ltv                  = customers.length > 0 ? totalRevenue / customers.length : 0;
    const totalInventoryValue  = products.reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.price) || 0), 0);
    const itr                  = totalInventoryValue > 0 ? cogs / totalInventoryValue : 6.2;
    const grossMarginPct       = 42.8; // display value from reference design
    const fulfillmentDays      = 2.4;

    /* ── Sales Projection (Linear Regression) ────────────────────────────── */
    const baseSales = [85000, 112000, 97500, 134000, 142000, totalRevenue > 0 ? totalRevenue : 175000];
    const n = baseSales.length;
    let sX = 0, sY = 0, sXY = 0, sXX = 0;
    baseSales.forEach((y, x) => { sX += x; sY += y; sXY += x * y; sXX += x * x; });
    const slope      = (n * sXY - sX * sY) / (n * sXX - sX * sX);
    const intercept  = (sY - slope * sX) / n;
    const nextProj   = slope * n + intercept;

    /* ── Bar chart heights ────────────────────────────────────────────────── */
    const chartMonths   = ['APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR'];
    const actualHeights = [40, 55, 48, 65, 72, 85, 78];
    const projHeights   = [82, 90, 88, 95, 84];

    /* ── Category Donut ──────────────────────────────────────────────────── */
    const catTotals = {};
    products.forEach(p => {
        const cat = p.category || 'Other';
        catTotals[cat] = (catTotals[cat] || 0) + (Number(p.quantity) || 0) * (Number(p.price) || 0);
    });
    const catList       = Object.entries(catTotals).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value);
    const totalCatVal   = catList.reduce((s, c) => s + c.value, 0);
    const topCategories = catList.slice(0, 4).map(c => ({
        name: c.name,
        pct:  totalCatVal > 0 ? Math.round((c.value / totalCatVal) * 100) : 0,
    }));
    // Fall back to reference data if no real categories
    const displayCats = topCategories.length > 0 ? topCategories : [
        { name: 'Exterior Paint', pct: 45 },
        { name: 'Hardware',       pct: 30 },
        { name: 'Interior Paint', pct: 15 },
        { name: 'Accessories',    pct: 10 },
    ];
    const catColors    = [C.primary, C.secondary, C.tertiaryFixed, C.surfaceHigh];
    const donutGradient = displayCats.map((c, i) => `${catColors[i] || '#ccc'} 0% ${c.pct}%`).reduce((acc, seg, i) => {
        const prev = displayCats.slice(0, i).reduce((s, c) => s + c.pct, 0);
        return acc + (i > 0 ? ', ' : '') + `${catColors[i] || '#ccc'} ${prev}% ${prev + displayCats[i].pct}%`;
    }, '');

    /* ── Recent Transactions (last 5 orders) ─────────────────────────────── */
    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    /* ── CSV Export ──────────────────────────────────────────────────────── */
    const handleExportCSV = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Total Revenue', `₹${totalRevenue.toFixed(2)}`],
            ['Avg Order Value', `₹${avgOrderValue.toFixed(2)}`],
            ['Profit Margin', `${profitMargin.toFixed(1)}%`],
            ['Customer LTV', `₹${ltv.toFixed(2)}`],
            ['Inventory Turnover', `${itr.toFixed(2)}x`],
            ['Next Month Projection', `₹${nextProj.toFixed(2)}`],
            ['Total SKUs', products.length],
            ['Stock Value', `₹${totalInventoryValue.toFixed(2)}`],
        ];
        const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = encodeURI(csv);
        a.download = 'JJ_BI_Report.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    /* ── Mobile helpers ──────────────────────────────────────────────────── */
    const getProductStatus = (qty, thr = 20) => {
        const q = Number(qty);
        if (q <= 0)  return 'Out of Stock';
        if (q < thr) return 'Low Stock';
        return 'In Stock';
    };
    const statusPill = s => {
        if (s === 'In Stock')     return 'bg-emerald-100 text-emerald-800';
        if (s === 'Low Stock')    return 'bg-amber-100 text-amber-800';
        return 'bg-rose-100 text-rose-700';
    };
    const filteredProducts = products.filter(p => {
        const ok1 = !inventorySearch || p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || (p.sku || '').toLowerCase().includes(inventorySearch.toLowerCase());
        const ok2 = inventoryCategory === 'ALL' || (p.category || 'Other').toUpperCase().includes(inventoryCategory);
        return ok1 && ok2;
    });
    const filteredCustomers = customers.filter(c => {
        const ok1 = !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.email || '').toLowerCase().includes(customerSearch.toLowerCase());
        let ok2 = true;
        if (customerFilter === 'Active')   ok2 = c.status === 'Active';
        if (customerFilter === 'Inactive') ok2 = c.status === 'Inactive';
        return ok1 && ok2;
    });

    if (isLoading) return (
        <Layout>
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.primaryCont, borderTopColor: 'transparent' }} />
                    <p className="text-sm font-medium" style={{ color: C.onSurfaceVar }}>Compiling Business Intelligence…</p>
                </div>
            </div>
        </Layout>
    );

    /* ═══════════════════════════════════════════════════════════════════════ */
    /* DESKTOP VIEW                                                            */
    /* ═══════════════════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen" style={{ background: C.surface, color: C.onSurface, fontFamily: 'Inter, sans-serif' }}>

            {/* ── Ambient glow decorations ── */}
            <div className="fixed top-0 right-0 -z-10 w-96 h-96 rounded-full blur-[120px]" style={{ background: `${C.primary}08` }} />
            <div className="fixed bottom-0 left-64 -z-10 w-64 h-64 rounded-full blur-[100px]" style={{ background: `${C.secondary}08` }} />

            {/* ── DESKTOP ── */}
            <div className="hidden md:block">
                <Layout>

                    {/* ── Page Header ── */}
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: C.onSurface }}>
                                Executive Overview
                            </h1>
                            <p className="text-sm mt-1" style={{ color: C.onSurfaceVar }}>
                                Real-time performance metrics for JJ Painting &amp; Hardware Corp.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Period selector */}
                            <div className="flex p-1 rounded-lg border" style={{ background: C.surfaceLow, borderColor: `${C.outlineVar}50` }}>
                                {['Daily', 'Weekly', 'Monthly'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setPeriod(t)}
                                        className="px-4 py-1.5 rounded-md text-xs font-bold transition-all"
                                        style={period === t
                                            ? { background: '#fff', color: C.primaryCont, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                                            : { color: C.outline }
                                        }
                                    >
                                        {t.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            {/* Date range chip */}
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors hover:opacity-80" style={{ borderColor: C.outlineVar, color: C.onSurface }}>
                                <span className="material-symbols-outlined text-base">calendar_today</span>
                                Oct 12 – Oct 19
                            </button>
                            {/* Export */}
                            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95" style={{ background: C.primaryCont }}>
                                <span className="material-symbols-outlined text-base">download</span>
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* ── 4-Column KPI Grid ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Total Revenue',   value: `₹${totalRevenue > 0 ? totalRevenue.toLocaleString('en-IN') : '1,42,580.00'}`, icon: 'payments',   trend: '+12.4%', up: true,  iconBg: `${C.primary}0D`,       iconColor: C.primary      },
                            { label: 'Avg Order Value', value: `₹${avgOrderValue > 0 ? Math.round(avgOrderValue).toLocaleString('en-IN') : '482.50'}`,            icon: 'shopping_bag', trend: '+3.2%',  up: true,  iconBg: `${C.secondary}0D`,     iconColor: C.secondary    },
                            { label: 'Profit Margin',   value: `${profitMargin.toFixed(1)}%`,                                                 icon: 'analytics',  trend: '-0.5%', up: false, iconBg: `${C.tertiaryFixed}18`, iconColor: C.tertiary     },
                            { label: 'Customer LTV',    value: `₹${ltv > 0 ? Math.round(ltv).toLocaleString('en-IN') : '4,120.00'}`,          icon: 'groups',     trend: '+18.1%',up: true,  iconBg: '#1e293b0D',            iconColor: '#1e293b'      },
                        ].map(m => (
                            <div
                                key={m.label}
                                className="bg-white p-5 rounded-2xl flex flex-col justify-between group cursor-default"
                                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.10)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2.5 rounded-xl transition-colors" style={{ background: m.iconBg }}>
                                        <span className="material-symbols-outlined" style={{ color: m.iconColor, fontSize: 22 }}>{m.icon}</span>
                                    </div>
                                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={m.up
                                        ? { background: `${C.tertiaryFixed}30`, color: C.tertiary }
                                        : { background: C.errorCont,           color: C.error    }
                                    }>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{m.up ? 'trending_up' : 'trending_down'}</span>
                                        {m.trend}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: C.outline }}>{m.label}</span>
                                    <h3 className="text-2xl font-bold mt-1 tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}>{m.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Middle Row: Bar Chart + Efficiency ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                        {/* Sales Projection Bar Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h4 className="font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sales Projection Model</h4>
                                    <p className="text-sm mt-0.5" style={{ color: C.onSurfaceVar }}>Revenue forecast based on historical 24-month cycle</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ background: C.primaryCont }} />
                                        <span className="text-[10px] font-mono" style={{ color: C.outline }}>ACTUAL</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: `${C.primaryCont}60` }} />
                                        <span className="text-[10px] font-mono" style={{ color: C.outline }}>PROJECTED</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bar chart */}
                            <div className="h-64 relative flex items-end justify-between gap-1.5 overflow-hidden px-2">
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none">
                                    {[0,1,2,3].map(i => <div key={i} className="border-t" style={{ borderColor: C.onSurface }} />)}
                                </div>
                                {/* Actual bars */}
                                {actualHeights.map((h, i) => (
                                    <div
                                        key={`a-${i}`}
                                        className="flex-1 rounded-t transition-all duration-300 hover:opacity-80 relative group"
                                        style={{ height: `${h}%`, background: i === 6 ? C.primaryCont : `${C.primaryCont}${Math.round(10 + i * 8).toString(16).padStart(2, '0')}` }}
                                    >
                                        {i === 6 && (
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                ₹{(totalRevenue > 0 ? totalRevenue : 142000).toLocaleString('en-IN')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {/* Projected bars */}
                                {projHeights.map((h, i) => (
                                    <div key={`p-${i}`} className="flex-1 rounded-t border-2 border-dashed" style={{ height: `${h}%`, borderColor: `${C.primaryCont}40` }} />
                                ))}
                            </div>

                            {/* Month labels */}
                            <div className="flex justify-between mt-4 px-2">
                                {chartMonths.map((m, i) => (
                                    <span key={m} className="text-[10px] font-mono" style={{ color: i === 6 ? C.primaryCont : C.outline, fontWeight: i === 6 ? 700 : 500 }}>{m}</span>
                                ))}
                            </div>
                        </div>

                        {/* Efficiency Indices */}
                        <div className="bg-white p-6 rounded-2xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <h4 className="font-bold text-lg mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Efficiency Indices</h4>
                            <div className="space-y-8">

                                {/* Inventory Turnover */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: C.outline }}>Inventory Turnover</p>
                                            <p className="text-xl font-bold mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{itr.toFixed(1)}x</p>
                                        </div>
                                        <span className="text-xs font-bold" style={{ color: C.tertiary }}>+1.2 vs. prev qtr</span>
                                    </div>
                                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: C.surfaceCont }}>
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((itr / 8) * 100, 100)}%`, background: C.primaryCont }} />
                                    </div>
                                    <div className="flex justify-between mt-1.5 text-[10px] font-mono" style={{ color: C.outline }}>
                                        <span>0.0x</span><span>Target: 8.0x</span>
                                    </div>
                                </div>

                                {/* Gross Margin */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: C.outline }}>Gross Margin %</p>
                                            <p className="text-xl font-bold mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{grossMarginPct}%</p>
                                        </div>
                                        <span className="text-xs font-bold" style={{ color: C.error }}>-2.1% target gap</span>
                                    </div>
                                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: C.surfaceCont }}>
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${grossMarginPct}%`, background: C.secondary }} />
                                    </div>
                                    <div className="flex justify-between mt-1.5 text-[10px] font-mono" style={{ color: C.outline }}>
                                        <span>0%</span><span>Target: 45.0%</span>
                                    </div>
                                </div>

                                {/* Fulfillment Time */}
                                <div className="pt-4 border-t" style={{ borderColor: C.surfaceHigh }}>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-14 h-14 shrink-0">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                                                <circle cx="28" cy="28" r="22" fill="none" stroke={C.surfaceCont} strokeWidth="5" />
                                                <circle cx="28" cy="28" r="22" fill="none" stroke={C.primaryCont} strokeWidth="5"
                                                    strokeDasharray={`${(75 / 100) * 138} 138`} strokeLinecap="round" />
                                            </svg>
                                            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold font-mono">75%</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: C.outline }}>Avg Fulfillment Time</p>
                                            <p className="text-base font-semibold mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{fulfillmentDays} Days</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom Row: Donut + Recent Transactions ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Sales by Category Donut */}
                        <div className="bg-white p-6 rounded-2xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <h4 className="font-bold text-lg mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sales by Category</h4>
                            <div className="flex items-center gap-6">
                                {/* Donut */}
                                <div className="relative w-32 h-32 shrink-0">
                                    <div className="w-full h-full rounded-full" style={{
                                        background: `conic-gradient(${displayCats.map((c, i) => {
                                            const start = displayCats.slice(0, i).reduce((s, x) => s + x.pct, 0);
                                            return `${catColors[i] || '#ccc'} ${start}% ${start + c.pct}%`;
                                        }).join(', ')})`
                                    }} />
                                    <div className="absolute inset-[18px] bg-white rounded-full flex items-center justify-center">
                                        <span className="text-xs font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: C.onSurface }}>TOTAL</span>
                                    </div>
                                </div>
                                {/* Legend */}
                                <div className="flex-1 space-y-2.5">
                                    {displayCats.map((c, i) => (
                                        <div key={c.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full" style={{ background: catColors[i] || '#ccc' }} />
                                                <span className="text-xs" style={{ color: C.onSurface }}>{c.name}</span>
                                            </div>
                                            <span className="text-xs font-bold" style={{ color: C.onSurface }}>{c.pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Recent Transactions</h4>
                                <button className="text-sm font-semibold transition-colors hover:underline" style={{ color: C.primaryCont }}>View All</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b" style={{ borderColor: C.surfaceHigh }}>
                                            {['Transaction ID', 'Customer', 'Category', 'Amount', 'Status'].map((h, i) => (
                                                <th key={h} className={`pb-3 text-[10px] font-mono uppercase tracking-wider ${i === 4 ? 'text-right' : ''}`} style={{ color: C.outline }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ borderColor: C.surfaceLow }}>
                                        {recentOrders.length > 0 ? recentOrders.map((o, i) => {
                                            const name    = o.customer?.name || 'Unknown';
                                            const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
                                            const avatarColors = [
                                                { bg: `${C.secondary}18`, color: C.secondary },
                                                { bg: `${C.primary}18`,   color: C.primary   },
                                                { bg: `${C.tertiaryFixed}28`, color: C.tertiary },
                                            ];
                                            const av = avatarColors[i % avatarColors.length];
                                            const statusStyle = o.status === 'Completed'
                                                ? { bg: `${C.tertiaryFixed}30`, color: C.tertiary }
                                                : o.status === 'Pending'
                                                    ? { bg: '#fff3cd', color: '#856404' }
                                                    : o.status === 'Draft'
                                                        ? { bg: C.surfaceLow, color: C.onSurfaceVar }
                                                        : { bg: C.errorCont, color: C.error };
                                            const firstItem = o.items?.[0];
                                            const cat = firstItem ? products.find(p => p.id === firstItem.productId)?.category || '—' : '—';
                                            return (
                                                <tr key={o.id} className="transition-colors" style={{ cursor: 'default' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = C.surface}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <td className="py-4 font-mono text-xs" style={{ color: C.onSurface }}>
                                                        #{(o.id || '').substring(0, 8).toUpperCase()}
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px]" style={{ background: av.bg, color: av.color }}>{initials}</div>
                                                            <span className="text-sm">{name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold" style={{ background: C.surfaceLow }}>{cat}</span>
                                                    </td>
                                                    <td className="py-4 font-bold text-sm">₹{(o.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                    <td className="py-4 text-right">
                                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                                                            {(o.status || 'Pending').toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            // Fallback reference rows when no real orders
                                            [
                                                { id: '#INV-9021', name: 'Bradley Walsh', initials: 'BW', cat: 'Exterior Paint', amount: '₹1,240.00', status: 'COMPLETED', statusStyle: { bg: `${C.tertiaryFixed}30`, color: C.tertiary }, avBg: `${C.secondary}18`, avColor: C.secondary },
                                                { id: '#INV-9022', name: 'Sarah Miller',  initials: 'SM', cat: 'Hardware',       amount: '₹420.50',   status: 'COMPLETED', statusStyle: { bg: `${C.tertiaryFixed}30`, color: C.tertiary }, avBg: `${C.primary}18`,   avColor: C.primary   },
                                                { id: '#INV-9023', name: 'Robert House',  initials: 'RH', cat: 'Interior Paint', amount: '₹2,890.00', status: 'PENDING',   statusStyle: { bg: C.surfaceHigh, color: C.outline },           avBg: `${C.tertiaryFixed}28`, avColor: C.tertiary },
                                            ].map(r => (
                                                <tr key={r.id} className="transition-colors"
                                                    onMouseEnter={e => e.currentTarget.style.background = C.surface}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <td className="py-4 font-mono text-xs">{r.id}</td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px]" style={{ background: r.avBg, color: r.avColor }}>{r.initials}</div>
                                                            <span className="text-sm">{r.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4"><span className="px-2 py-1 rounded-md text-[10px] font-bold" style={{ background: C.surfaceLow }}>{r.cat}</span></td>
                                                    <td className="py-4 font-bold text-sm">{r.amount}</td>
                                                    <td className="py-4 text-right">
                                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold" style={r.statusStyle}>{r.status}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </Layout>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {/* MOBILE VIEW (Insight Mobile)                                          */}
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            <div className="md:hidden flex flex-col pb-24 min-h-screen" style={{ background: C.surface }}>

                {/* Mobile TopAppBar */}
                <header className="fixed top-0 w-full z-50 flex justify-between items-center h-16 px-5 border-b backdrop-blur-md" style={{ background: `${C.surface}CC`, borderColor: `${C.outlineVar}40` }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm" style={{ background: C.primaryCont }}>
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: C.primary }}>Insight Mobile</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[22px]" style={{ color: C.onSurfaceVar }}>notifications</span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border" style={{ background: '#e1e0ff', color: '#07006c', borderColor: C.outlineVar }}>AD</div>
                    </div>
                </header>

                <main className="pt-20 px-5 flex-1 flex flex-col gap-4">

                    {/* ── OVERVIEW TAB ── */}
                    {mobileTab === 'overview' && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Analytics Hub</h2>
                                <p className="text-xs mt-0.5" style={{ color: C.onSurfaceVar }}>Mathematical regression metrics and projections.</p>
                            </div>

                            {/* 2×2 Bento KPIs */}
                            <section className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Revenue',   value: `₹${totalRevenue > 0 ? totalRevenue.toLocaleString('en-IN') : '1,42,580'}`, icon: 'payments',    trend: '+12.5%', iconBg: `${C.primaryCont}18`, iconColor: C.primaryCont  },
                                    { label: 'Avg Order', value: `₹${avgOrderValue > 0 ? Math.round(avgOrderValue).toLocaleString('en-IN') : '482'}`,             icon: 'shopping_cart', trend: '+3.2%',  iconBg: `${C.secondaryCont}18`, iconColor: C.secondaryCont },
                                    { label: 'Profit',    value: `${profitMargin.toFixed(1)}%`,                                               icon: 'trending_up', trend: '+4.1%',  iconBg: '#d1fae510', iconColor: '#059669'          },
                                    { label: 'LTV',       value: `₹${ltv > 0 ? Math.round(ltv).toLocaleString('en-IN') : '4,120'}`,          icon: 'group',       trend: '-1.2%',  iconBg: '#ffe4e110', iconColor: '#e11d48'          },
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-2xl flex flex-col gap-2" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                                        <div className="flex justify-between items-start">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: item.iconBg }}>
                                                <span className="material-symbols-outlined text-[18px]" style={{ color: item.iconColor, fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: '#d1fae5', color: '#059669' }}>{item.trend}</span>
                                        </div>
                                        <div className="mt-1">
                                            <p className="text-lg font-extrabold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans', letterSpacing: '-0.02em' }}>{item.value}</p>
                                            <p className="text-[9px] font-mono uppercase tracking-wider font-bold mt-0.5" style={{ color: C.onSurfaceVar }}>{item.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            {/* Projection Chart (mobile) */}
                            <section className="bg-white p-5 rounded-2xl border flex flex-col gap-4" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderColor: `${C.outlineVar}20` }}>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="text-sm font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sales Projection Model</h3>
                                        <p className="text-[10px] font-mono uppercase tracking-wider mt-0.5" style={{ color: C.onSurfaceVar }}>Historical vs Forecast</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-extrabold" style={{ color: C.primaryCont }}>₹{Math.round(nextProj).toLocaleString('en-IN')}</p>
                                        <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: C.onSurfaceVar }}>Next Month Est.</p>
                                    </div>
                                </div>
                                <div className="relative h-32 w-full mt-2">
                                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="mobGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                                                <stop offset="0%" stopColor={C.primaryCont} stopOpacity="0.15" />
                                                <stop offset="100%" stopColor={C.primaryCont} stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M0,90 Q50,80 100,100 T200,60 T300,70 T400,30" fill="none" stroke={C.primaryCont} strokeWidth="3" strokeLinecap="round" />
                                        <path d="M0,90 Q50,80 100,100 T200,60 T300,70 T400,30 V120 H0 Z" fill="url(#mobGrad)" />
                                        <path d="M400,30 L430,15" stroke={C.secondaryCont} strokeDasharray="4,4" strokeWidth="2" />
                                    </svg>
                                    <div className="absolute -bottom-5 left-0 w-full flex justify-between text-[9px] font-mono" style={{ color: C.outline }}>
                                        {['Jan','Feb','Mar','Apr','May'].map((m, i) => (
                                            <span key={m} style={i === 4 ? { color: C.primaryCont, fontWeight: 700 } : {}}>{m}</span>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Efficiency Bars (mobile) */}
                            <section className="flex flex-col gap-4">
                                <h3 className="text-sm font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Efficiency Indices</h3>
                                {[
                                    { label: 'Inventory Turnover (ITR)', value: `${itr.toFixed(1)}x`, pct: Math.min((itr/6)*100, 100), target: 'Target: 4.0x – 6.0x', badge: 'On Target', badgeBg: '#d1fae5', badgeColor: '#059669', barColor: C.primaryCont },
                                    { label: 'Gross Margin',            value: `${grossMarginPct}%`,  pct: grossMarginPct,            target: 'Target: 38% – 42%',   badge: 'Warning',   badgeBg: C.errorCont, badgeColor: C.error,   barColor: C.primaryCont },
                                ].map(e => (
                                    <div key={e.label} className="bg-white p-4 rounded-2xl flex flex-col gap-3" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold">{e.label}</p>
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: e.badgeBg, color: e.badgeColor }}>{e.badge}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono font-black border shrink-0" style={{ background: C.surfaceLow, color: C.primaryCont, borderColor: `${C.outlineVar}30` }}>{e.value}</div>
                                            <div className="flex-1">
                                                <span className="text-[10px] font-mono block mb-1" style={{ color: C.outline }}>{e.target}</span>
                                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: C.surfaceLow }}>
                                                    <div className="h-full rounded-full" style={{ width: `${e.pct}%`, background: e.barColor }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            {/* Sales by Category donut (mobile) */}
                            <section className="bg-white p-5 rounded-2xl border flex flex-col gap-4" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderColor: `${C.outlineVar}20` }}>
                                <h3 className="text-sm font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sales by Category</h3>
                                <div className="flex items-center gap-6">
                                    <div className="relative w-24 h-24 shrink-0">
                                        <div className="w-full h-full rounded-full" style={{
                                            background: `conic-gradient(${displayCats.map((c, i) => {
                                                const s = displayCats.slice(0, i).reduce((sum, x) => sum + x.pct, 0);
                                                return `${catColors[i] || '#ccc'} ${s}% ${s + c.pct}%`;
                                            }).join(', ')})`
                                        }} />
                                        <div className="absolute inset-[14px] bg-white rounded-full flex items-center justify-center">
                                            <span className="text-[10px] font-bold" style={{ color: C.primaryCont }}>100%</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2">
                                        {displayCats.map((c, i) => (
                                            <div key={c.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: catColors[i] || '#ccc' }} />
                                                    <span className="text-xs truncate max-w-[90px]" style={{ color: C.onSurfaceVar }}>{c.name}</span>
                                                </div>
                                                <span className="text-xs font-bold">{c.pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* ── INVENTORY TAB ── */}
                    {mobileTab === 'inventory' && (
                        <div className="flex flex-col gap-4">
                            <div>
                                <h2 className="text-xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: C.primaryCont }}>Inventory Hub</h2>
                                <p className="text-xs mt-0.5" style={{ color: C.onSurfaceVar }}>Real-time SKU monitoring for catalog products.</p>
                            </div>
                            {/* Search */}
                            <div className="flex items-center gap-2 rounded-xl px-4 py-3 border" style={{ background: C.surfaceLow, borderColor: `${C.outlineVar}40` }}>
                                <span className="material-symbols-outlined text-[20px]" style={{ color: C.outline }}>search</span>
                                <input value={inventorySearch} onChange={e => setInventorySearch(e.target.value)} className="bg-transparent border-none focus:ring-0 w-full text-xs font-medium outline-none" placeholder="Search SKU, name, or category…" style={{ color: C.onSurface }} />
                                {inventorySearch && (
                                    <button onClick={() => setInventorySearch('')}><span className="material-symbols-outlined text-[16px]" style={{ color: C.outline }}>close</span></button>
                                )}
                            </div>
                            {/* Category pills */}
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {['ALL','PAINTS','HARDWARE','TOOLS'].map(cat => (
                                    <button key={cat} onClick={() => setInventoryCategory(cat)}
                                        className="px-4 py-1.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap border transition-all"
                                        style={inventoryCategory === cat
                                            ? { background: C.primaryCont, color: '#fff', borderColor: C.primaryCont }
                                            : { background: 'transparent', color: C.onSurfaceVar, borderColor: C.outlineVar }
                                        }
                                    >{cat}</button>
                                ))}
                            </div>
                            {/* Stock metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: 'inventory_2', iconBg: '#e0e0ff', iconColor: C.primaryCont, badge: `+${products.length}`, value: products.length, label: 'Total SKUs' },
                                    { icon: 'payments',    iconBg: '#c0c1ff', iconColor: C.secondary,   badge: 'Active', value: `₹${(totalInventoryValue/100000).toFixed(1)}L`, label: 'Stock Value' },
                                ].map(m => (
                                    <div key={m.label} className="bg-white p-4 rounded-xl border flex flex-col justify-between" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderColor: `${C.outlineVar}20` }}>
                                        <div className="flex justify-between items-start">
                                            <div className="p-1.5 rounded-lg" style={{ background: m.iconBg }}>
                                                <span className="material-symbols-outlined text-[18px]" style={{ color: m.iconColor }}>{m.icon}</span>
                                            </div>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#d1fae5', color: '#059669' }}>{m.badge}</span>
                                        </div>
                                        <div className="mt-3">
                                            <span className="text-xl font-extrabold">{m.value}</span>
                                            <p className="text-[9px] font-mono uppercase tracking-wider font-bold mt-0.5" style={{ color: C.onSurfaceVar }}>{m.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Product list */}
                            <div className="bg-white rounded-xl border overflow-hidden mb-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderColor: `${C.outlineVar}20` }}>
                                <div className="px-4 py-3 border-b flex justify-between items-center" style={{ background: `${C.surfaceLow}70`, borderColor: `${C.outlineVar}30` }}>
                                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: C.onSurfaceVar }}>Current Inventory</h3>
                                </div>
                                <div className="divide-y" style={{ borderColor: `${C.outlineVar}20` }}>
                                    {filteredProducts.length === 0 ? (
                                        <div className="py-8 text-center text-sm" style={{ color: C.outline }}>No products match your search.</div>
                                    ) : filteredProducts.map(p => {
                                        const st = getProductStatus(p.quantity, p.lowStockThreshold || 20);
                                        return (
                                            <div key={p.id} className="p-4 flex items-center gap-4 transition-colors" onMouseEnter={e => e.currentTarget.style.background = C.surfaceLow} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border" style={{ background: C.surfaceCont, borderColor: `${C.outlineVar}30` }}>
                                                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-[20px]" style={{ color: C.primaryCont }}>format_paint</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate">{p.name}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold" style={{ background: C.surfaceLow, color: C.onSurfaceVar }}>{p.category || 'Other'}</span>
                                                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${statusPill(st)}`}>{st}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-bold">₹{(Number(p.price) || 0).toLocaleString('en-IN')}</p>
                                                    <p className="text-[9px] font-mono mt-0.5" style={{ color: C.outline }}>{Number(p.quantity) || 0} units</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── CUSTOMERS TAB ── */}
                    {mobileTab === 'customers' && (
                        <div className="flex flex-col gap-4">
                            <div>
                                <h2 className="text-xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: C.primaryCont }}>Customer Hub</h2>
                                <p className="text-xs mt-0.5" style={{ color: C.onSurfaceVar }}>{customers.length} accounts tracked.</p>
                            </div>
                            {/* Search */}
                            <div className="flex items-center gap-2 rounded-xl px-4 py-3 border" style={{ background: C.surfaceLow, borderColor: `${C.outlineVar}40` }}>
                                <span className="material-symbols-outlined text-[20px]" style={{ color: C.outline }}>search</span>
                                <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="bg-transparent border-none focus:ring-0 w-full text-xs font-medium outline-none" placeholder="Search customer name or email…" style={{ color: C.onSurface }} />
                            </div>
                            {/* Filter pills */}
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {['All','Active','Inactive','New'].map(f => (
                                    <button key={f} onClick={() => setCustomerFilter(f)}
                                        className="px-4 py-1.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap border transition-all"
                                        style={customerFilter === f
                                            ? { background: C.primaryCont, color: '#fff', borderColor: C.primaryCont }
                                            : { background: 'transparent', color: C.onSurfaceVar, borderColor: C.outlineVar }
                                        }
                                    >{f.toUpperCase()}</button>
                                ))}
                            </div>
                            {/* Customer list */}
                            <div className="bg-white rounded-xl border overflow-hidden mb-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderColor: `${C.outlineVar}20` }}>
                                <div className="divide-y" style={{ borderColor: `${C.outlineVar}20` }}>
                                    {filteredCustomers.length === 0 ? (
                                        <div className="py-8 text-center text-sm" style={{ color: C.outline }}>No customers found.</div>
                                    ) : filteredCustomers.map(c => {
                                        const initials = (c.name || '??').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
                                        const custOrders = orders.filter(o => o.customerId === c.id);
                                        return (
                                            <div key={c.id} className="p-4 flex items-center gap-4" onMouseEnter={e => e.currentTarget.style.background = C.surfaceLow} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: `${C.primaryCont}18`, color: C.primaryCont }}>{initials}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate">{c.name}</p>
                                                    <p className="text-[10px] truncate mt-0.5" style={{ color: C.onSurfaceVar }}>{c.email || '—'}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" style={c.status === 'Active' ? { background: '#d1fae5', color: '#059669' } : { background: C.surfaceLow, color: C.outline }}>{c.status || 'Active'}</span>
                                                    <p className="text-[9px] font-mono mt-1" style={{ color: C.outline }}>{custOrders.length} orders</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* ── Mobile Bottom Nav ── */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 border-t flex justify-around items-center h-16 px-2" style={{ background: `${C.surface}F0`, borderColor: `${C.outlineVar}50`, backdropFilter: 'blur(12px)' }}>
                    {[
                        { id: 'overview',   icon: 'dashboard',  label: 'Overview'  },
                        { id: 'inventory',  icon: 'inventory_2', label: 'Inventory' },
                        { id: 'customers',  icon: 'group',       label: 'Customers' },
                    ].map(tab => {
                        const active = mobileTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setMobileTab(tab.id)} className="flex flex-col items-center gap-1 flex-1 py-2 transition-all active:scale-95">
                                <span className="material-symbols-outlined text-[22px]" style={{ color: active ? C.primaryCont : C.outline, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
                                <span className="text-[10px] font-mono font-bold" style={{ color: active ? C.primaryCont : C.outline }}>{tab.label}</span>
                                {active && <span className="w-1 h-1 rounded-full" style={{ background: C.primaryCont }} />}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
