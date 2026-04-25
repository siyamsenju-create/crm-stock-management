import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ children }) {
    return (
        <div className="bg-surface text-on-surface font-body-md min-h-screen">
            <Sidebar />
            <TopBar />
            <main className="ml-64 p-8 min-h-[calc(100vh-64px)]">
                {children}
            </main>
            <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50">
                <span className="material-symbols-outlined" data-icon="support_agent">support_agent</span>
            </button>
        </div>
    );
}
