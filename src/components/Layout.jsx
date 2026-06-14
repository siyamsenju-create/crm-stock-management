import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="bg-surface text-on-surface font-body-md min-h-screen overflow-x-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="ml-0 md:ml-64 p-4 md:p-8 min-h-[calc(100vh-64px)] max-w-full">
                {children}
            </main>
            <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50">
                <span className="material-symbols-outlined" data-icon="support_agent">support_agent</span>
            </button>
        </div>
    );
}
