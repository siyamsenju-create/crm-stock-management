import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';


// Lazy-load every page so each becomes its own chunk
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Customers    = lazy(() => import('./pages/Customers'));
const Products     = lazy(() => import('./pages/Products'));
const AddProduct   = lazy(() => import('./pages/AddProduct'));
const Inventory    = lazy(() => import('./pages/Inventory'));
const Orders       = lazy(() => import('./pages/Orders'));
const Analytics    = lazy(() => import('./pages/Analytics'));
const Settings     = lazy(() => import('./pages/Settings'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Login        = lazy(() => import('./pages/Login'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, isSessionLoading }) => {
  const { isAuthenticated } = useStore();
  if (isSessionLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AuthRoute = ({ children, isSessionLoading }) => {
  const { isAuthenticated } = useStore();
  // While session check is in progress, render children (Login page with
  // its own googleLoading state) so the redirect result can be processed
  if (isSessionLoading) return children;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

let isAppRedirectHandled = false;

function App() {
  const { validateSession } = useStore();
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    // Only validate if a token already exists in storage.
    // If coming back from a Google redirect, the popup handler in Login.jsx
    // stores the token before this runs on the next page load.
    const token = localStorage.getItem('token');
    if (token) {
      validateSession().finally(() => setIsSessionLoading(false));
    } else {
      setIsSessionLoading(false);
    }
  }, [validateSession]);

  return (
    <>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login"         element={<AuthRoute isSessionLoading={isSessionLoading}><Login /></AuthRoute>} />
            <Route path="/"              element={<ProtectedRoute isSessionLoading={isSessionLoading}><Dashboard /></ProtectedRoute>} />
            <Route path="/customers"     element={<ProtectedRoute isSessionLoading={isSessionLoading}><Customers /></ProtectedRoute>} />
            <Route path="/products"      element={<ProtectedRoute isSessionLoading={isSessionLoading}><Products /></ProtectedRoute>} />
            <Route path="/products/add"  element={<ProtectedRoute isSessionLoading={isSessionLoading}><AddProduct /></ProtectedRoute>} />
            <Route path="/products/edit/:id" element={<ProtectedRoute isSessionLoading={isSessionLoading}><AddProduct /></ProtectedRoute>} />
            <Route path="/inventory"     element={<ProtectedRoute isSessionLoading={isSessionLoading}><Inventory /></ProtectedRoute>} />
            <Route path="/orders"        element={<ProtectedRoute isSessionLoading={isSessionLoading}><Orders /></ProtectedRoute>} />
            <Route path="/transactions"  element={<ProtectedRoute isSessionLoading={isSessionLoading}><Transactions /></ProtectedRoute>} />
            <Route path="/analytics"     element={<ProtectedRoute isSessionLoading={isSessionLoading}><Analytics /></ProtectedRoute>} />
            <Route path="/settings"      element={<ProtectedRoute isSessionLoading={isSessionLoading}><Settings /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}

export default App;
