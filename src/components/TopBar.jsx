import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export default function TopBar() {
    const { user, logout } = useStore();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && search.trim()) {
            navigate('/products', { state: { search: search.trim() } });
            setSearch('');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="flex justify-between items-center px-8 sticky top-0 z-40 ml-64 w-[calc(100%-16rem)] h-16 bg-white/90 backdrop-blur-md shadow-sm border-b border-outline-variant">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-lg">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                        placeholder="Search products, customers... (press Enter)"
                        type="text"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4 ml-4">
                <button className="relative text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border border-white"/>
                </button>
                <button onClick={() => navigate('/settings')} className="text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">settings</span>
                </button>
                
                {/* Profile Dropdown Container */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                        className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-bold text-sm flex items-center justify-center ring-2 ring-outline-variant hover:ring-primary transition-all"
                    >
                        {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden py-1 z-50">
                            <div className="px-4 py-3 border-b border-outline-variant">
                                <p className="text-sm font-label-md text-on-surface truncate">{user?.name || 'Admin'}</p>
                                <p className="text-xs font-body-sm text-on-surface-variant truncate">{user?.email || 'admin@example.com'}</p>
                            </div>
                            <button
                                onClick={() => { setIsDropdownOpen(false); navigate('/settings'); }}
                                className="w-full text-left px-4 py-2 text-sm font-body-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">person</span>
                                Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm font-body-md text-error hover:bg-error-container/20 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
