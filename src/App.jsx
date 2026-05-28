import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
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

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useStore();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const { validateSession } = useStore();

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  return (
    <>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login"         element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/"              element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/customers"     element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/products"      element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/products/add"  element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
            <Route path="/products/edit/:id" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
            <Route path="/inventory"     element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/orders"        element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/transactions"  element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/analytics"     element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/settings"      element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}

export default App;
