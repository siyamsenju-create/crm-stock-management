import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';

export default function Sidebar() {
    const { profile } = useStore();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    const linkCls = (path) => isActive(path)
        ? 'flex items-center gap-3 px-4 py-3 text-primary font-semibold bg-primary/10 border-r-2 border-primary rounded-l-lg transition-all duration-200'
        : 'flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-l-lg transition-all duration-200';

    const navItems = [
        { path: '/', icon: 'dashboard', label: 'Dashboard' },
        { path: '/customers', icon: 'groups', label: 'Customers' },
        { path: '/products', icon: 'format_paint', label: 'Products' },
        { path: '/inventory', icon: 'warehouse', label: 'Inventory' },
        { path: '/orders', icon: 'receipt_long', label: 'Orders & Sales' },
        { path: '/analytics', icon: 'bar_chart', label: 'Analytics' },
        { path: '/settings', icon: 'settings', label: 'Settings' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full flex flex-col py-6 px-0 w-64 border-r border-outline-variant bg-surface-container-lowest font-['Inter'] text-sm antialiased z-50">
            {/* Brand */}
            <div className="mb-8 px-6">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[18px]">format_paint</span>
                    </div>
                    <span className="text-base font-black tracking-tight text-primary leading-tight">{profile.company}</span>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-outline ml-10">Hardware & Paints</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 px-2">
                {navItems.map(({ path, icon, label }) => (
                    <Link key={path} to={path} className={linkCls(path)}>
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                        <span>{label}</span>
                    </Link>
                ))}
            </nav>

            {/* Profile */}
            <div className="pt-4 border-t border-outline-variant mt-4 px-6">
                <Link to="/settings" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-sm">
                        {profile.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-on-surface text-sm truncate">{profile.name}</p>
                        <p className="text-xs text-outline">Admin Access</p>
                    </div>
                </Link>
            </div>
        </aside>
    );
}
