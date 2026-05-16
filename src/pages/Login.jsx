import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export default function Login() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const loginAction = useStore((state) => state.login);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
    setIsLoading(true);

    try {
      const success = await loginAction(formData.email, formData.password);
      if (success) {
        setToast({ show: true, message: 'Successfully logged in!', type: 'success' });
        setTimeout(() => navigate('/'), 1000);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      setToast({ show: true, message: error.message || 'Failed to login. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-surface relative overflow-hidden">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`absolute top-8 right-8 px-lg py-md rounded-xl shadow-xl z-50 text-white font-label-md flex items-center gap-sm transition-all animate-fade-in-up ${toast.type === 'success' ? 'bg-primary' : 'bg-error'}`}>
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
        </div>
      )}

      {/* Left Form Section */}
      <div className="flex-1 flex flex-col justify-center items-center p-xl lg:p-3xl z-10">
        <div className="w-full max-w-[420px] animate-fade-in-up bg-white p-xl sm:p-2xl rounded-3xl shadow-2xl border border-surface-variant">
          
          <div className="text-center mb-xl">
            <div className="mx-auto w-16 h-16 bg-primary-container text-primary rounded-2xl flex items-center justify-center mb-md shadow-sm">
              <span className="material-symbols-outlined text-3xl">lock_person</span>
            </div>
            <h1 className="font-h1 text-h1 text-on-surface mb-xs tracking-tight">Welcome Back</h1>
            <p className="font-body-md text-on-surface-variant">
              Please enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-lg">
            <div className="space-y-xs">
              <label className="font-label-md text-on-surface-variant block ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  className={`w-full bg-surface-container-lowest border-2 ${errors.email ? 'border-error ring-error' : 'border-surface-variant group-focus-within:border-primary'} rounded-2xl pl-12 pr-4 py-3 font-body-md focus:outline-none transition-all duration-300 shadow-sm`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-error font-body-sm mt-1 ml-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-xs">
              <label className="font-label-md text-on-surface-variant block ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full bg-surface-container-lowest border-2 ${errors.password ? 'border-error ring-error' : 'border-surface-variant group-focus-within:border-primary'} rounded-2xl pl-12 pr-12 py-3 font-body-md focus:outline-none transition-all duration-300 shadow-sm`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="text-error font-body-sm mt-1 ml-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-xs">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-5 w-5 text-primary bg-surface-container border-2 border-outline-variant rounded focus:ring-primary transition-colors cursor-pointer"
                  checked={formData.remember}
                  onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-3 block font-body-sm text-on-surface-variant cursor-pointer select-none">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-label-md text-primary hover:text-primary-fixed-dim transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-md border border-transparent rounded-2xl shadow-lg shadow-primary/30 font-label-md text-on-primary bg-primary hover:bg-surface-tint focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 mt-md"
            >
              {isLoading ? (
                <span className="flex items-center gap-sm">
                  <svg className="animate-spin h-5 w-5 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Visual Section */}
      <div className="hidden lg:flex flex-1 relative bg-primary-container items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-surface-tint to-primary-container opacity-95"></div>
        
        {/* Animated Background Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-fixed rounded-full mix-blend-screen filter blur-[80px] opacity-70 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary-fixed rounded-full mix-blend-screen filter blur-[80px] opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-tertiary-fixed rounded-full mix-blend-screen filter blur-[80px] opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 p-xl max-w-[500px] text-center animate-fade-in-up">
          <div className="mb-lg flex justify-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 flex items-center justify-center transform transition-transform hover:scale-110 duration-500">
              <span className="material-symbols-outlined text-5xl text-white">inventory_2</span>
            </div>
          </div>
          <h2 className="text-display font-display text-white mb-md leading-tight tracking-tight">
            InventoryFlow<br/>Enterprise
          </h2>
          <p className="text-body-lg text-primary-fixed font-body-lg opacity-90">
            A comprehensive CRM and Stock Management solution designed exclusively for modern, fast-growing businesses.
          </p>
        </div>
      </div>
    </div>
  );
}
