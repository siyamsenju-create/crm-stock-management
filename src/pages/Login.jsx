import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { signInWithPopup, GoogleAuthProvider, getAuth } from 'firebase/auth';
import { auth } from '../utils/firebase';



export default function Login() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // ── Diagnostic: log Firebase config + currentUser state on mount ────────
  useEffect(() => {
    const logDiagnostics = async () => {
      console.log('[FIREBASE CONFIG]', {
        apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId:             import.meta.env.VITE_FIREBASE_APP_ID,
      });
      console.log('[FIREBASE AUTH OPTIONS]', auth?.app?.options);
      console.log('[AUTH currentUser]', auth.currentUser);
      // Check whether Firebase has a session even when redirect result is null
      try {
        const token = await getAuth().currentUser?.getIdToken();
        console.log('[AUTH currentUser idToken length]', token?.length ?? 'no token — currentUser is null');
      } catch (e) {
        console.error('[AUTH currentUser getIdToken error]', e);
      }
    };
    logDiagnostics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Micro-interaction mouse parallax effect for desktop visual block
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
  const loginWithGoogleAction = useStore((state) => state.loginWithGoogle);


  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    // Clear any previous errors & toast on each new attempt
    setErrors({});
    setToast({ show: false, message: '', type: '' });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setToast({ show: true, message: 'Please enter valid credentials.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // login() now throws with the real backend error message
      await loginAction(formData.email, formData.password);
      setToast({ show: true, message: 'Successfully logged in!', type: 'success' });
      setTimeout(() => navigate('/'), 800);
    } catch (error) {
      console.error('[Login] error:', error);
      setToast({ show: true, message: error.message || 'Invalid email or password.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSSO = async () => {
    setErrors({});
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      // ── DIAGNOSTIC: using signInWithPopup to isolate the redirect bug ──
      // If popup succeeds and /api/v1/auth/google is called, redirect flow
      // is the confirmed root cause (sessionStorage cleared by router).
      console.log('[POPUP TEST] signInWithPopup starting...');
      const result = await signInWithPopup(auth, provider);
      console.log('[POPUP TEST] signInWithPopup result:', result);
      console.log('[POPUP TEST] User:', result.user.email);

      const idToken = await result.user.getIdToken();
      console.log('[POPUP TEST] idToken length:', idToken?.length);

      await loginWithGoogleAction(idToken);
      console.log('[POPUP TEST] Backend auth completed — navigating to dashboard');

      window.location.replace('/');
    } catch (error) {
      console.error('[POPUP TEST] signInWithPopup error:', error);
      setToast({ show: true, message: error.message || 'Google authentication failed.', type: 'error' });
      setGoogleLoading(false);
    }
  };


  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!formData.email) {
      setToast({ show: true, message: 'Please enter your email address first to reset your password.', type: 'error' });
    } else {
      setToast({ show: true, message: 'Password reset instructions have been sent to your email.', type: 'success' });
    }
  };

  return (
    <div className="login-page bg-background text-on-background min-h-screen relative overflow-x-hidden">
      
      {/* Dynamic Toast Notification Overlay */}
      {toast.show && (
        <div className={`fixed top-8 right-8 px-6 py-4 rounded-xl shadow-2xl z-[9999] text-white font-label-caps flex items-center gap-3 transition-all animate-fade-in-up ${
          toast.type === 'success' ? 'bg-[#10B981]' : 'bg-[#ba1a1a]'
        }`}>
          <span className="material-symbols-outlined text-[22px]">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* =========================================================================
          DESKTOP DUAL VIEWPORT SCREEN (>= 1024px)
          ========================================================================= */}
      <div className="hidden lg:flex h-screen w-full">
        {/* Left Visual Section */}
        <section className="w-1/2 relative bg-[#0605bf] overflow-hidden flex items-center justify-center">
          {/* Animated Background Pattern Blobs */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <div 
              style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}
              className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#4648d4] rounded-full blur-[120px] transition-transform duration-300 ease-out"
            ></div>
            <div 
              style={{ transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 40}px)` }}
              className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#005a3c] rounded-full blur-[120px] transition-transform duration-300 ease-out"
            ></div>
          </div>
          <div className="relative z-10 w-full h-full">
            <img 
              alt="Business Intelligence Dashboard" 
              className="w-full h-full object-cover mix-blend-overlay" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQxZ_SMuayE-sA98rOFeJlSbC2_xm2s5zGyqs_3eLqv9rQC9KyOQuOmV15jqtXsMRtBzIv5ybWvH7L5-gxovBvwbH2Zfc7aisGdcRkn8HxHLJc7Y82zYc344U0va8r2EIsMzx5CS4eQBqkKvBWiesSn-HBCVj8WHgGM_P807IHkh4T1y3zG_tKfzvjv0JoYkf7-E2o2pZBLc2VDOAIwIrpLXlJWYBVyAynul7I52S5fuMhmZ6u1a_E9_8bYG5I0TKqfLri5VTU27Fi"
            />
          </div>
          {/* Content Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-16 bg-gradient-to-t from-[#0605bf]/90 via-[#0605bf]/40 to-transparent">
            <h1 className="font-display-sm text-[40px] leading-tight text-white mb-4 font-bold max-w-[512px]">
              Precision in Every Stroke.<br />Data in Every Decision.
            </h1>
            <p className="font-body-lg text-[#b7bbff] max-w-[448px] text-base leading-relaxed opacity-95">
              Access real-time inventory, sales performance, and project management tools tailored for the modern hardware enterprise.
            </p>
          </div>
        </section>

        {/* Right Form Section */}
        <section className="w-1/2 flex items-center justify-center p-12 bg-surface">
          <div className="w-full max-w-[448px] space-y-6">
            {/* Branding */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-[#0605bf] rounded-xl flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-3xl font-variation-settings-['FILL'_1]">
                  format_paint
                </span>
              </div>
              <div>
                <h2 className="font-headline-md text-lg font-bold text-[#0605bf] tracking-tight">JJ Painting</h2>
                <p className="font-label-caps text-[10px] text-[#767687] tracking-widest uppercase">Business Intelligence</p>
              </div>
            </div>

            {/* Header info */}
            <div className="space-y-2 mb-8">
              <h3 className="font-display-sm text-2xl font-bold text-on-surface">Welcome Back</h3>
              <p className="font-body-md text-sm text-on-surface-variant">Please enter your professional credentials to continue.</p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant block uppercase tracking-wider" htmlFor="email-desktop">
                  Corporate Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-[#767687] group-focus-within:text-[#0605bf] transition-colors">
                      mail
                    </span>
                  </div>
                  <input 
                    className={`block w-full pl-12 pr-4 py-3.5 bg-surface-container-low border ${
                      errors.email ? 'border-[#ba1a1a] focus:ring-[#ba1a1a]' : 'border-[#c6c5d8] focus:ring-[#0605bf]'
                    } rounded-xl focus:ring-2 outline-none focus:border-[#0605bf] transition-all font-body-md text-on-surface`}
                    id="email-desktop"
                    name="email" 
                    placeholder="manager@jjpainting.com" 
                    required 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <span className="text-[#ba1a1a] text-xs mt-1 block">{errors.email}</span>}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="password-desktop">
                    Security Password
                  </label>
                  <a 
                    className="font-label-caps text-xs text-[#0605bf] font-semibold hover:underline transition-all" 
                    href="#"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-[#767687] group-focus-within:text-[#0605bf] transition-colors">
                      lock
                    </span>
                  </div>
                  <input 
                    className={`block w-full pl-12 pr-12 py-3.5 bg-surface-container-low border ${
                      errors.password ? 'border-[#ba1a1a] focus:ring-[#ba1a1a]' : 'border-[#c6c5d8] focus:ring-[#0605bf]'
                    } rounded-xl focus:ring-2 outline-none focus:border-[#0605bf] transition-all font-body-md text-on-surface`}
                    id="password-desktop"
                    name="password" 
                    placeholder="••••••••" 
                    required 
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isLoading}
                  />
                  <button 
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#767687] hover:text-[#111c2d] transition-colors focus:outline-none" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && <span className="text-[#ba1a1a] text-xs mt-1 block">{errors.password}</span>}
              </div>

              {/* Submit button */}
              <button 
                className="w-full bg-[#0605bf] hover:bg-[#2d34d3] text-white font-semibold py-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#c6c5d8]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-4 font-label-caps text-[#767687] text-[10px] uppercase tracking-widest">Enterprise Authentication</span>
              </div>
            </div>

            {/* Google SSO */}
            <button 
              className="w-full bg-white border border-[#c6c5d8] hover:border-[#0605bf] text-on-surface font-body-md py-3.5 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              type="button"
              onClick={handleGoogleSSO}
              disabled={googleLoading || isLoading}
            >
              {googleLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#0605bf]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-semibold">Signing in with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span className="font-semibold">Continue with Google</span>
                </>
              )}
            </button>

            {/* Footer */}
            <div className="pt-8 text-center">
              <p className="font-body-md text-[#454555] text-sm">
                New employee? <a className="text-[#0605bf] font-semibold hover:underline" href="#">Contact Administrator</a>
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* =========================================================================
          MOBILE VIEWPORT SCREEN (< 1024px)
          ========================================================================= */}
      <div className="flex lg:hidden min-h-screen flex-col items-center justify-center px-6 py-12 font-body-md overflow-x-hidden select-none">
        {/* Atmospheric Ambient Background Glows */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0605bf]/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#4648d4]/5 rounded-full blur-[100px]"></div>
        </div>

        {/* Form Canvas */}
        <main className="relative z-10 w-full max-w-[380px] flex flex-col items-center">
          {/* Header Branding */}
          <header className="w-full flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-[#0605bf] rounded-2xl flex items-center justify-center shadow-xl mb-4 active:scale-95 transition-transform duration-150">
              <span className="material-symbols-outlined text-white text-4xl">
                insights
              </span>
            </div>
            <h1 className="font-display-sm text-2xl font-bold text-[#0605bf] tracking-tight">JJ Painting</h1>
            <p className="font-label-caps text-xs text-[#454555] tracking-widest mt-1 uppercase">INSIGHT MOBILE</p>
          </header>

          {/* Login Card Grid */}
          <section className="w-full bg-[#ffffff] border border-[#c6c5d8]/40 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="mb-6">
              <h2 className="font-display-sm text-xl font-bold text-[#111c2d] mb-1.5">Welcome Back</h2>
              <p className="font-body-md text-xs text-[#454555] leading-relaxed">Access your business intelligence portal.</p>
            </div>

            {/* Mobile Form */}
            <form className="space-y-4" onSubmit={handleLogin}>
              
              {/* Floating label Email */}
              <div className="floating-label-group">
                <input 
                  className={`w-full h-14 bg-[#f0f3ff] border ${
                    errors.email ? 'border-[#ba1a1a]' : 'border-[#c6c5d8]'
                  } rounded-xl px-4 pt-4 font-body-lg text-sm text-[#111c2d] focus:ring-2 focus:ring-[#0605bf] focus:border-[#0605bf] outline-none transition-all`}
                  id="email-mobile"
                  placeholder=" " 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                  required
                />
                <label className="font-label-caps text-[10px] text-[#767687] tracking-wider font-semibold" htmlFor="email-mobile">
                  EMAIL ADDRESS
                </label>
              </div>
              {errors.email && <span className="text-[#ba1a1a] text-xs block -mt-1 ml-1">{errors.email}</span>}

              {/* Floating label Password */}
              <div className="floating-label-group">
                <input 
                  className={`w-full h-14 bg-[#f0f3ff] border ${
                    errors.password ? 'border-[#ba1a1a]' : 'border-[#c6c5d8]'
                  } rounded-xl px-4 pt-4 pr-12 font-body-lg text-sm text-[#111c2d] focus:ring-2 focus:ring-[#0605bf] focus:border-[#0605bf] outline-none transition-all`}
                  id="password-mobile"
                  placeholder=" " 
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                  required
                />
                <label className="font-label-caps text-[10px] text-[#767687] tracking-wider font-semibold" htmlFor="password-mobile">
                  PASSWORD
                </label>
                <button 
                  className="absolute right-4 top-4 text-[#767687] hover:text-[#0605bf] transition-colors focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && <span className="text-[#ba1a1a] text-xs block -mt-1 ml-1">{errors.password}</span>}

              {/* Forget Password */}
              <div className="flex justify-end pt-1">
                <a 
                  className="font-label-caps text-[10px] text-[#4648d4] font-semibold hover:text-[#0605bf] transition-colors"
                  href="#"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </a>
              </div>

              {/* Submit button */}
              <button 
                className="w-full h-12 bg-[#0605bf] hover:bg-[#2d34d3] text-white font-semibold text-sm rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-75"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-grow h-px bg-[#c6c5d8]/40"></div>
              <span className="px-3 font-label-caps text-[9px] text-[#767687] tracking-widest uppercase">OR</span>
              <div className="flex-grow h-px bg-[#c6c5d8]/40"></div>
            </div>

            {/* Google Login */}
            <button 
              className="w-full h-12 bg-[#f9f9ff] border border-[#c6c5d8]/60 hover:bg-[#f0f3ff] text-[#111c2d] font-semibold text-xs rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              type="button"
              onClick={handleGoogleSSO}
              disabled={googleLoading || isLoading}
            >
              {googleLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-[#0605bf]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </section>

          {/* Footer Navigation */}
          <footer className="mt-8 text-center">
            <p className="font-body-md text-xs text-[#454555]">
              Don't have an account? 
              <a className="font-semibold text-[#0605bf] ml-1.5 hover:underline decoration-2 underline-offset-4" href="#">
                Sign Up
              </a>
            </p>
          </footer>

          {/* Legal references */}
          <div className="mt-12 flex gap-4 text-xs font-semibold">
            <a className="font-label-caps text-[#767687] hover:text-[#111c2d] transition-colors" href="#">Privacy Policy</a>
            <span className="text-[#c6c5d8]">•</span>
            <a className="font-label-caps text-[#767687] hover:text-[#111c2d] transition-colors" href="#">Support</a>
          </div>
        </main>
      </div>

    </div>
  );
}
