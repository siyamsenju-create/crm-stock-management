import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useStore } from '../store';

export default function Settings() {
    const navigate = useNavigate();
    const { user } = useStore();
    const [localProfile, setLocalProfile] = useState({
        name: user?.name || 'Admin',
        email: user?.email || 'admin@example.com',
        company: 'JJ Painting'
    });

    const handleSaveProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5005/api/v1/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    name: localProfile.name,
                    email: localProfile.email,
                    company: localProfile.company
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to save profile');
            }

            alert('Profile saved successfully!');
            // Ideally, we'd update global state here, but simple reload or alert is fine for now
            // window.location.reload(); 
        } catch (error) {
            console.error('Error saving profile:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleReset = async () => {
        if(window.confirm('Are you sure you want to completely clear all application data (including backend database)? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                await fetch('http://localhost:5005/api/v1/settings/factory-reset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });
            } catch (error) {
                console.error('Failed to reset backend data:', error);
            }
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="bg-surface text-on-surface min-h-screen font-body-md md:bg-transparent">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-white/80 backdrop-blur-md shadow-sm border-b border-outline-variant">
                <div className="flex items-center gap-md">
                    <button onClick={() => navigate('/')} className="p-sm text-on-surface-variant hover:bg-surface-container rounded-lg">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <span className="text-lg font-bold text-primary tracking-tight">Settings</span>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
                    {localProfile.name.substring(0, 2).toUpperCase()}
                </div>
            </header>

            {/* Desktop Wrapper */}
            <div className="hidden md:block">
                <Layout>
                    <div className="flex">
                        {/* Settings Sidebar */}
                        <aside className="w-64 border-r border-outline-variant bg-surface-container-lowest flex flex-col p-md gap-y-xs h-[calc(100vh-64px)] sticky top-16">
                            <div className="px-md py-sm">
                                <h3 className="font-h3 text-primary text-sm uppercase tracking-widest opacity-70">General</h3>
                            </div>
                            <nav className="flex flex-col gap-xs">
                                <a href="#profile" className="flex items-center gap-sm px-md py-sm bg-primary-fixed text-primary rounded-lg font-label-md">
                                    <span className="material-symbols-outlined">person</span> Profile
                                </a>
                                <a href="#organization" className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-variant rounded-lg font-label-md transition-colors">
                                    <span className="material-symbols-outlined">corporate_fare</span> Organization
                                </a>
                                <a href="#danger" className="flex items-center gap-sm px-md py-sm text-error hover:bg-error-container/20 rounded-lg font-label-md transition-colors mt-auto">
                                    <span className="material-symbols-outlined">delete_forever</span> Factory Reset
                                </a>
                            </nav>
                        </aside>
                        
                        {/* Settings Main Content (Desktop) */}
                        <main className="flex-1 p-xl max-w-5xl w-full space-y-3xl">
                            <header className="mb-lg">
                                <h1 className="font-h1 text-on-surface">Account Settings</h1>
                                <p className="font-body-md text-on-surface-variant mt-xs">Manage your personal preferences and organization-wide configurations.</p>
                            </header>

                            {/* Profile Section */}
                            <section id="profile" className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                                <div className="p-lg border-b border-outline-variant flex items-center justify-between">
                                    <div>
                                        <h2 className="font-h2 text-on-surface">Profile Settings</h2>
                                        <p className="font-body-sm text-on-surface-variant">Update your personal information.</p>
                                    </div>
                                </div>
                                <div className="p-lg space-y-lg">
                                    <div className="flex items-center gap-xl">
                                        <div className="h-24 w-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-2xl font-bold ring-4 ring-surface-variant">
                                            {localProfile.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 space-y-md">
                                            <div className="grid md:grid-cols-2 gap-md">
                                                <div className="flex flex-col gap-xs">
                                                    <label className="font-label-sm text-on-surface-variant">Full Name</label>
                                                    <input value={localProfile.name} onChange={e => setLocalProfile({...localProfile, name: e.target.value})} className="rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none px-md py-sm" type="text" />
                                                </div>
                                                <div className="flex flex-col gap-xs">
                                                    <label className="font-label-sm text-on-surface-variant">Email Address</label>
                                                    <input value={localProfile.email} onChange={e => setLocalProfile({...localProfile, email: e.target.value})} className="rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none px-md py-sm" type="email" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-md bg-surface-container-low flex justify-end gap-md">
                                    <button onClick={handleSaveProfile} className="px-lg py-sm bg-primary text-white font-label-md rounded-lg shadow-sm hover:opacity-90">Save Profile</button>
                                </div>
                            </section>

                            {/* Organization Section */}
                            <section id="organization" className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                                <div className="p-lg border-b border-outline-variant">
                                    <h2 className="font-h2 text-on-surface">Organization Settings</h2>
                                </div>
                                <div className="p-lg grid md:grid-cols-2 gap-xl">
                                    <div className="space-y-md">
                                        <div className="flex flex-col gap-xs">
                                            <label className="font-label-sm text-on-surface-variant">Business Name</label>
                                            <input value={localProfile.company} onChange={e => setLocalProfile({...localProfile, company: e.target.value})} className="rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary outline-none px-md py-sm" type="text" />
                                        </div>
                                        <button onClick={handleSaveProfile} className="px-lg py-sm bg-primary text-white font-label-md rounded-lg shadow-sm hover:opacity-90">Save Organization</button>
                                    </div>
                                </div>
                            </section>

                            <section id="danger" className="bg-error-container/10 border border-error/20 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-lg">
                                    <h2 className="font-h2 text-error">Danger Zone</h2>
                                    <p className="font-body-sm text-on-surface-variant mb-4">Resetting application data will delete all customers, products, and inventory items permanently.</p>
                                    <button onClick={handleReset} className="px-lg py-sm bg-error text-white font-label-md rounded-lg shadow-sm hover:opacity-90">Factory Reset Data</button>
                                </div>
                            </section>
                        </main>
                    </div>
                </Layout>
            </div>

            {/* Mobile Main Content Wrapper */}
            <main className="md:hidden pt-24 pb-32 px-md space-y-lg max-w-md mx-auto">
                <section className="space-y-md">
                    <h2 className="font-h2 text-h2 text-on-surface px-xs">Profile Settings</h2>
                    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm space-y-md">
                        <div className="flex flex-col items-center gap-md mb-lg">
                            <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-2xl font-bold border-2 border-primary-container">
                                {localProfile.name.substring(0, 2).toUpperCase()}
                            </div>
                        </div>
                        <div>
                            <label className="block font-label-sm text-label-sm text-outline mb-xs">FULL NAME</label>
                            <input value={localProfile.name} onChange={e => setLocalProfile({...localProfile, name: e.target.value})} className="w-full bg-surface-container border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none" type="text" />
                        </div>
                        <div>
                            <label className="block font-label-sm text-label-sm text-outline mb-xs">EMAIL ADDRESS</label>
                            <input value={localProfile.email} onChange={e => setLocalProfile({...localProfile, email: e.target.value})} className="w-full bg-surface-container border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none" type="email" />
                        </div>
                        <button onClick={handleSaveProfile} className="w-full py-sm bg-primary text-white rounded-lg font-label-md mt-sm">Save Profile</button>
                    </div>
                </section>

                <section className="space-y-md">
                    <h2 className="font-h2 text-h2 text-on-surface px-xs">Organization</h2>
                    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm space-y-md">
                        <div>
                            <label className="block font-label-sm text-label-sm text-outline mb-xs">BUSINESS NAME</label>
                            <input value={localProfile.company} onChange={e => setLocalProfile({...localProfile, company: e.target.value})} className="w-full bg-surface-container border border-outline-variant rounded-lg px-md py-sm focus:ring-2 focus:ring-primary outline-none" type="text" />
                        </div>
                        <button onClick={handleSaveProfile} className="w-full py-sm bg-primary text-white rounded-lg font-label-md mt-sm">Save Organization</button>
                    </div>
                </section>

                <div className="pt-lg pb-md">
                    <button onClick={handleReset} className="w-full py-md flex items-center justify-center gap-sm text-error bg-error-container/20 rounded-xl border border-error/20 font-label-md hover:bg-error-container/40 transition-colors">
                        <span className="material-symbols-outlined">delete_forever</span> Factory Reset
                    </button>
                </div>
            </main>
        </div>
    );
}
