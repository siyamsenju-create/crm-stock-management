import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { getProductsFromFirebase, getOrdersFromFirebase, getCustomersFromFirebase } from '../utils/firebaseDb';

export default function Dashboard() {
    // Split states for performance optimization, skeletons, and retry capabilities
    const [productsState, setProductsState] = useState({ data: [], isLoading: true, error: null });
    const [ordersState, setOrdersState] = useState({ data: [], isLoading: true, error: null });
    const [customersState, setCustomersState] = useState({ data: [], isLoading: true, error: null });

    // Performance tracking
    const mountTimeRef = useRef(performance.now());
    const [performanceMetrics, setPerformanceMetrics] = useState({
        productsTime: null,
        ordersTime: null,
        customersTime: null,
        totalTime: null,
    });

    // Mock states for Operational Dashboard features with localStorage persistence
    const [workingStatus, setWorkingStatus] = useState(() => localStorage.getItem('dashboard_working_status') || 'Active');
    const [assignedTasks, setAssignedTasks] = useState(() => {
        const saved = localStorage.getItem('dashboard_tasks');
        return saved ? JSON.parse(saved) : [
            { id: 1, title: 'Review monthly sales report', completed: false },
            { id: 2, title: 'Approve pending leaves', completed: true },
            { id: 3, title: 'Follow up with supplier A', completed: false }
        ];
    });
    const recruitActivities = [
        { id: 1, name: 'John Doe', role: 'Sales Executive', status: 'Interviewing', date: 'Oct 24' },
        { id: 2, name: 'Jane Smith', role: 'Store Manager', status: 'Offered', date: 'Oct 22' },
        { id: 3, name: 'Mike Ross', role: 'Delivery Agent', status: 'Rejected', date: 'Oct 20' }
    ];

    useEffect(() => {
        localStorage.setItem('dashboard_working_status', workingStatus);
    }, [workingStatus]);

    useEffect(() => {
        localStorage.setItem('dashboard_tasks', JSON.stringify(assignedTasks));
    }, [assignedTasks]);

    const toggleTask = (id) => {
        setAssignedTasks(tasks => tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const fetchProductsData = async () => {
        setProductsState(prev => ({ ...prev, isLoading: true, error: null }));
        const start = performance.now();
        try {
            const products = await getProductsFromFirebase();
            const duration = performance.now() - start;
            setProductsState({ data: products, isLoading: false, error: null });
            setPerformanceMetrics(m => ({ ...m, productsTime: duration }));
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProductsState({ data: [], isLoading: false, error: error.message || 'Failed to load products' });
        }
    };

    const fetchOrdersData = async () => {
        setOrdersState(prev => ({ ...prev, isLoading: true, error: null }));
        const start = performance.now();
        try {
            const orders = await getOrdersFromFirebase();
            const duration = performance.now() - start;
            setOrdersState({ data: orders, isLoading: false, error: null });
            setPerformanceMetrics(m => ({ ...m, ordersTime: duration }));
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            setOrdersState({ data: [], isLoading: false, error: error.message || 'Failed to load orders' });
        }
    };

    const fetchCustomersData = async () => {
        setCustomersState(prev => ({ ...prev, isLoading: true, error: null }));
        const start = performance.now();
        try {
            const customers = await getCustomersFromFirebase();
            const duration = performance.now() - start;
            setCustomersState({ data: customers, isLoading: false, error: null });
            setPerformanceMetrics(m => ({ ...m, customersTime: duration }));
        } catch (error) {
            console.error('Failed to fetch customers:', error);
            setCustomersState({ data: [], isLoading: false, error: error.message || 'Failed to load customers' });
        }
    };

    // Mount loads
    useEffect(() => {
        mountTimeRef.current = performance.now();
        fetchProductsData();
        fetchOrdersData();
        fetchCustomersData();
    }, []);

    // Total page loading metrics
    useEffect(() => {
        if (!productsState.isLoading && !ordersState.isLoading && !customersState.isLoading) {
            const total = performance.now() - mountTimeRef.current;
            setPerformanceMetrics(m => {
                if (m.totalTime === null) {
                    console.log(`[Performance] Dashboard loaded in ${total.toFixed(2)}ms`, {
                        products: `${m.productsTime?.toFixed(2)}ms`,
                        orders: `${m.ordersTime?.toFixed(2)}ms`,
                        customers: `${m.customersTime?.toFixed(2)}ms`,
                    });
                    return { ...m, totalTime: total };
                }
                return m;
            });
        }
    }, [productsState.isLoading, ordersState.isLoading, customersState.isLoading]);

    return (
        <Layout>
            <div className="relative mb-8 pb-8 border-b border-outline-variant/50">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-50"></div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10 w-full">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 pb-1">
                                Dashboard Overview
                            </h1>
                            {performanceMetrics.totalTime !== null && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-xl text-xs font-semibold border border-green-200/50 shadow-sm animate-fade-in-up">
                                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                                    {performanceMetrics.totalTime.toFixed(0)}ms {performanceMetrics.totalTime < 25 ? "(Cached)" : ""}
                                </span>
                            )}
                        </div>
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

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Card 1: Total Revenue */}
                {ordersState.isLoading ? (
                    <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-gray-200/60 shadow-sm animate-pulse h-[154px] flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                        </div>
                        <div>
                            <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="w-28 h-8 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ) : ordersState.error ? (
                    <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-red-200/60 shadow-sm h-[154px] flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-red-600">
                            <span className="material-symbols-outlined">warning</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Error</span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium">Total Revenue</p>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-red-500 font-semibold">Load failed</span>
                            <button 
                                onClick={fetchOrdersData} 
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[14px]">refresh</span> Retry
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden h-[154px] flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"></div>
                        <div className="relative z-10 flex flex-col justify-between h-full w-full">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-xl bg-white border border-primary/20 shadow-sm flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-symbols-outlined text-2xl text-primary">account_balance_wallet</span>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-100/80 text-green-700">
                                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                                    Current
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest mb-1">Total Revenue</p>
                                <p className="text-3xl font-extrabold text-on-surface tracking-tight">
                                    ₹{(ordersState.data.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.total || 0), 0)).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Card 2: Active Customers */}
                {customersState.isLoading ? (
                    <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-gray-200/60 shadow-sm animate-pulse h-[154px] flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                        </div>
                        <div>
                            <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="w-16 h-8 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ) : customersState.error ? (
                    <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-red-200/60 shadow-sm h-[154px] flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-red-600">
                            <span className="material-symbols-outlined">warning</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Error</span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium">Active Customers</p>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-red-500 font-semibold">Load failed</span>
                            <button 
                                onClick={fetchCustomersData} 
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[14px]">refresh</span> Retry
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden h-[154px] flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"></div>
                        <div className="relative z-10 flex flex-col justify-between h-full w-full">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-xl bg-white border border-green-500/20 shadow-sm flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                                    <span className="material-symbols-outlined text-2xl text-green-600">groups</span>
                                </div>
                                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-100/80 text-green-700">
                                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                                    Current
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest mb-1">Active Customers</p>
                                <p className="text-3xl font-extrabold text-on-surface tracking-tight">{customersState.data.length}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Card 3: Products in Stock */}
                {productsState.isLoading ? (
                    <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-gray-200/60 shadow-sm animate-pulse h-[154px] flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                        </div>
                        <div>
                            <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="w-16 h-8 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ) : productsState.error ? (
                    <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-red-200/60 shadow-sm h-[154px] flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-red-600">
                            <span className="material-symbols-outlined">warning</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Error</span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium">Products in Stock</p>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-red-500 font-semibold">Load failed</span>
                            <button 
                                onClick={fetchProductsData} 
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[14px]">refresh</span> Retry
                            </button>
                        </div>
                    </div>
                ) : (() => {
                    const lowStockCount = productsState.data.filter(p => (p.quantity || 0) < (p.lowStockThreshold || 20) && (p.quantity || 0) > 0).length;
                    const isPositive = lowStockCount === 0;
                    return (
                        <div className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden h-[154px] flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"></div>
                            <div className="relative z-10 flex flex-col justify-between h-full w-full">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-blue-500/20 shadow-sm flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                                        <span className="material-symbols-outlined text-2xl text-blue-600">inventory_2</span>
                                    </div>
                                    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isPositive ? 'bg-green-100/80 text-green-700' : 'bg-orange-100/80 text-orange-700'}`}>
                                        <span className="material-symbols-outlined text-[14px]">
                                            {isPositive ? 'trending_up' : 'warning'}
                                        </span>
                                        {isPositive ? 'Healthy' : `${lowStockCount} low stock`}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest mb-1">Products in Stock</p>
                                    <p className="text-3xl font-extrabold text-on-surface tracking-tight">{productsState.data.length}</p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Card 4: Pending Orders */}
                {ordersState.isLoading ? (
                    <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-gray-200/60 shadow-sm animate-pulse h-[154px] flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                        </div>
                        <div>
                            <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="w-16 h-8 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ) : ordersState.error ? (
                    <div className="relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-red-200/60 shadow-sm h-[154px] flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-red-600">
                            <span className="material-symbols-outlined">warning</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Error</span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium">Pending Orders</p>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-red-500 font-semibold">Load failed</span>
                            <button 
                                onClick={fetchOrdersData} 
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[14px]">refresh</span> Retry
                            </button>
                        </div>
                    </div>
                ) : (() => {
                    const pendingCount = ordersState.data.filter(o => o.status === 'Pending').length;
                    const isPositive = pendingCount === 0;
                    return (
                        <div className="group relative bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden h-[154px] flex flex-col justify-between">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"></div>
                            <div className="relative z-10 flex flex-col justify-between h-full w-full">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-orange-500/20 shadow-sm flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                                        <span className="material-symbols-outlined text-2xl text-orange-600">pending_actions</span>
                                    </div>
                                    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isPositive ? 'bg-green-100/80 text-green-700' : 'bg-orange-100/80 text-orange-700'}`}>
                                        <span className="material-symbols-outlined text-[14px]">
                                            {isPositive ? 'trending_up' : 'warning'}
                                        </span>
                                        {isPositive ? 'Clear' : 'Needs attention'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest mb-1">Pending Orders</p>
                                    <p className="text-3xl font-extrabold text-on-surface tracking-tight">{pendingCount}</p>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders Table Component */}
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
                                    {ordersState.isLoading ? (
                                        [...Array(5)].map((_, idx) => (
                                            <tr key={idx} className="animate-pulse border-b border-gray-50/80">
                                                <td className="px-6 py-4">
                                                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                                                </td>
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="w-12 h-4 bg-gray-200 rounded"></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : ordersState.error ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
                                                    <p className="text-sm font-bold text-on-surface">Failed to load recent orders</p>
                                                    <button 
                                                        onClick={fetchOrdersData}
                                                        className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">refresh</span> Retry Loading
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (() => {
                                        const recentOrders = [...ordersState.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
                                        return (
                                            <>
                                                {recentOrders.map(o => {
                                                    const customerName = o.customer?.name || 'Unknown';
                                                    return (
                                                    <tr key={o.id || o._id} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">#{(o.id || o._id || '').substring(0, 6).toUpperCase()}</span>
                                                        </td>
                                                        <td className="px-6 py-4 flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 border border-white shadow-sm">
                                                                {customerName.substring(0,2).toUpperCase()}
                                                            </div>
                                                            <span className="text-sm font-medium text-on-surface">{customerName}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-on-surface">₹{(o.total || 0).toLocaleString('en-IN')}</td>
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
                                                )})}
                                                {recentOrders.length === 0 && (
                                                    <tr><td colSpan="4" className="p-6 text-center text-on-surface-variant">No recent orders</td></tr>
                                                )}
                                            </>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    {/* Action Required Card */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-red-100 shadow-lg shadow-red-500/5 overflow-hidden">
                        <div className="px-6 py-5 border-b border-red-100 bg-red-50/50 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-red-700 flex items-center gap-2">
                                <span className="material-symbols-outlined">warning</span>
                                Action Required
                            </h2>
                            {productsState.isLoading ? (
                                <div className="w-12 h-5 bg-red-100 rounded animate-pulse"></div>
                            ) : productsState.error ? (
                                <span className="bg-red-100 text-red-700 text-xs font-extrabold px-2 py-1 rounded-md">Error</span>
                            ) : (() => {
                                const lowStockProducts = productsState.data.filter(p => (p.quantity || 0) < (p.lowStockThreshold || 20));
                                return (
                                    <span className="bg-red-100 text-red-700 text-xs font-extrabold px-2 py-1 rounded-md">{lowStockProducts.length} Items</span>
                                );
                            })()}
                        </div>
                        <div className="divide-y divide-gray-50/80 p-2">
                            {productsState.isLoading ? (
                                [...Array(3)].map((_, idx) => (
                                    <div key={idx} className="p-4 flex justify-between items-center animate-pulse">
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-gray-200"></div>
                                            <div className="space-y-1.5">
                                                <div className="w-32 h-4 bg-gray-200 rounded"></div>
                                                <div className="w-16 h-3 bg-gray-200 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-6 bg-gray-200 rounded"></div>
                                    </div>
                                ))
                            ) : productsState.error ? (
                                <div className="p-8 text-center flex flex-col items-center gap-2">
                                    <span className="material-symbols-outlined text-red-500 text-2xl">error</span>
                                    <p className="text-xs text-on-surface-variant font-medium">Failed to load low stock items</p>
                                    <button 
                                        onClick={fetchProductsData}
                                        className="mt-1 flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">refresh</span> Retry
                                    </button>
                                </div>
                            ) : (() => {
                                const lowStockProducts = productsState.data.filter(p => (p.quantity || 0) < (p.lowStockThreshold || 20));
                                return (
                                    <>
                                        {lowStockProducts.slice(0, 4).map(p => (
                                            <div key={p.id || p._id} className="p-4 flex justify-between items-center hover:bg-red-50/30 rounded-xl transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 mt-2 rounded-full ${p.quantity <= 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`}></div>
                                                    <div>
                                                        <p className="text-sm font-bold text-on-surface line-clamp-1">{p.name}</p>
                                                        <p className="text-xs text-on-surface-variant mt-0.5">{p.sku}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right pl-3">
                                                    <span className={`block text-lg font-black ${p.quantity <= 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                                        {p.quantity}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-gray-400">Left</span>
                                                </div>
                                            </div>
                                        ))}
                                        {lowStockProducts.length === 0 && (
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
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Inventory Summary Card */}
                    <div className="bg-gradient-to-br from-surface-container to-white rounded-2xl border border-outline-variant/30 shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 opacity-5">
                            <span className="material-symbols-outlined text-[150px]">inventory</span>
                        </div>
                        <h2 className="font-bold text-lg text-on-surface mb-6 relative z-10">Inventory Summary</h2>
                        
                        {productsState.isLoading ? (
                            <div className="space-y-4 animate-pulse relative z-10">
                                <div className="flex justify-between items-center p-3 rounded-xl bg-white/60 border border-gray-100">
                                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                                    <div className="w-8 h-6 bg-gray-200 rounded"></div>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl bg-white/60 border border-gray-100">
                                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                                    <div className="w-12 h-6 bg-gray-200 rounded"></div>
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-xl bg-gray-100/50 mt-2">
                                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                                    <div className="w-20 h-6 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ) : productsState.error ? (
                            <div className="p-8 text-center flex flex-col items-center gap-2 relative z-10">
                                <span className="material-symbols-outlined text-red-500 text-2xl">error</span>
                                <p className="text-xs text-on-surface-variant font-medium">Failed to load inventory stats</p>
                                <button 
                                    onClick={fetchProductsData}
                                    className="mt-1 flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[14px]">refresh</span> Retry
                                </button>
                            </div>
                        ) : (() => {
                            const productLines = productsState.data.length;
                            const totalItems = productsState.data.reduce((sum, p) => sum + (p.quantity || 0), 0);
                            const totalValue = productsState.data.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
                            return (
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/60 border border-gray-100">
                                        <span className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">category</span> Product Lines
                                        </span>
                                        <span className="text-sm font-black text-on-surface bg-gray-100 px-2.5 py-1 rounded-md">{productLines}</span>
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
                                        <span className="text-lg font-black text-primary">₹{totalValue.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Working Status & Assigned Tasks */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Working Status Card */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-sm p-6">
                        <h2 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person_check</span>
                            My Working Status
                        </h2>
                        <div className="flex flex-col gap-3">
                            {['Active', 'In a Meeting', 'On Leave'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setWorkingStatus(status)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                                        workingStatus === status 
                                            ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm' 
                                            : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-variant/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${status === 'Active' ? 'bg-green-500' : status === 'In a Meeting' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                                        {status}
                                    </div>
                                    {workingStatus === status && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assigned Tasks Card */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col h-[350px]">
                        <div className="px-6 py-5 border-b border-gray-100/80 bg-white/50 flex justify-between items-center shrink-0">
                            <h2 className="font-bold text-lg text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">task</span>
                                Assigned Tasks
                            </h2>
                        </div>
                        <div className="p-4 space-y-2 overflow-y-auto flex-1">
                            {assignedTasks.map(task => (
                                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-variant/50 transition-colors group cursor-pointer" onClick={() => toggleTask(task.id)}>
                                    <div className={`flex items-center justify-center w-6 h-6 rounded-md border ${task.completed ? 'bg-primary border-primary text-white' : 'border-outline-variant text-transparent'} transition-colors`}>
                                        <span className="material-symbols-outlined text-[16px]">{task.completed ? 'check' : ''}</span>
                                    </div>
                                    <span className={`text-sm font-medium ${task.completed ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>{task.title}</span>
                                </div>
                            ))}
                            {assignedTasks.length === 0 && (
                                <p className="text-center text-sm text-on-surface-variant mt-4">No pending tasks!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recruit Activities Card */}
                <div className="lg:col-span-2">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100/80 bg-white/50 flex justify-between items-center shrink-0">
                            <h2 className="font-bold text-lg text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">how_to_reg</span>
                                Recruit Activities
                            </h2>
                            <button className="text-primary text-sm font-bold hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                                Add Candidate
                            </button>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant/80 border-b border-gray-100/80">
                                        <th className="px-6 py-4">Candidate</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50/80">
                                    {recruitActivities.map(activity => (
                                        <tr key={activity.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                                                    {activity.name.substring(0,2).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-on-surface">{activity.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-on-surface-variant">{activity.role}</td>
                                            <td className="px-6 py-4 text-sm text-on-surface-variant">{activity.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                    activity.status === 'Offered' ? 'bg-green-100 text-green-700' :
                                                    activity.status === 'Interviewing' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {activity.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}