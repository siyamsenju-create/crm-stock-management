import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export default function TopBar() {
    const { profile } = useStore();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && search.trim()) {
            // Navigate to products page with search pre-filled via state
            navigate('/products', { state: { search: search.trim() } });
            setSearch('');
        }
    };

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
                <button onClick={() => navigate('/settings')} className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-bold text-sm flex items-center justify-center ring-2 ring-outline-variant hover:ring-primary transition-all">
                    {profile.name.substring(0, 2).toUpperCase()}
                </button>
            </div>
        </header>
    );
}
