import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
    persist(
        (set) => ({
            profile: { name: 'Arokiya Jegan', company: 'JJ Painting & Hardwares', email: 'arokiya@jjpainting.com', phone: '+91 98765 43210', address: 'No. 12, Market Road, Coimbatore - 641001' },
            updateProfile: (updates) => set((state) => ({ profile: { ...state.profile, ...updates } })),

            customers: [
                { id: 'CUST-001', name: 'Rajan Construction Co.', email: 'rajan@rajanconstruction.com', location: 'Coimbatore, TN', orders: 14, spent: 48500, status: 'Active', date: '2026-01-15' },
                { id: 'CUST-002', name: 'Murugan Contractors', email: 'murugan@mgcontractors.com', location: 'Tirupur, TN', orders: 9, spent: 22750, status: 'Active', date: '2026-02-20' },
                { id: 'CUST-003', name: 'Senthil Hardware Depot', email: 'senthil@shardware.com', location: 'Salem, TN', orders: 5, spent: 8300, status: 'Active', date: '2026-04-10' },
                { id: 'CUST-004', name: 'Priya Home Decor', email: 'priya@priyadecor.in', location: 'Erode, TN', orders: 3, spent: 6100, status: 'Inactive', date: '2026-03-05' },
            ],

            products: [
                { id: 'PRD-001', name: 'Asian Paints Apex Emulsion (20L)', sku: 'AP-APEX-20L', category: 'Exterior Paints', price: 3850, stock: 42, status: 'In Stock', image: null, lowStockAlert: 10 },
                { id: 'PRD-002', name: 'Berger WeatherCoat (1L)', sku: 'BG-WC-1L', category: 'Exterior Paints', price: 480, stock: 18, status: 'Low Stock', image: null, lowStockAlert: 20 },
                { id: 'PRD-003', name: 'Nerolac Interior Emulsion (4L)', sku: 'NL-INT-4L', category: 'Interior Paints', price: 1250, stock: 0, status: 'Out of Stock', image: null, lowStockAlert: 10 },
                { id: 'PRD-004', name: '4-Inch Paint Brush (Professional)', sku: 'TOOL-BRSH-4IN', category: 'Brushes & Rollers', price: 185, stock: 95, status: 'In Stock', image: null, lowStockAlert: 20 },
                { id: 'PRD-005', name: '9-Inch Roller Set with Tray', sku: 'TOOL-ROLL-9IN', category: 'Brushes & Rollers', price: 320, stock: 60, status: 'In Stock', image: null, lowStockAlert: 15 },
                { id: 'PRD-006', name: 'Fevicol SH Adhesive (1kg)', sku: 'ADH-FEV-1KG', category: 'Adhesives & Sealants', price: 220, stock: 8, status: 'Low Stock', image: null, lowStockAlert: 10 },
                { id: 'PRD-007', name: 'Sandpaper Sheet P120 Grit (Pack of 10)', sku: 'PREP-SAND-P120', category: 'Surface Preparation', price: 95, stock: 200, status: 'In Stock', image: null, lowStockAlert: 50 },
                { id: 'PRD-008', name: 'Masking Tape 2-inch (Pack of 5)', sku: 'PREP-MASK-2IN', category: 'Surface Preparation', price: 145, stock: 110, status: 'In Stock', image: null, lowStockAlert: 30 },
            ],

            orders: [
                { id: 'ORD-5042', customer: 'Rajan Construction Co.', date: '2026-04-24', total: 18500, status: 'Completed', initial: 'RC', bg: 'bg-primary-container text-on-primary-container' },
                { id: 'ORD-5041', customer: 'Murugan Contractors', date: '2026-04-23', total: 7250, status: 'Pending', initial: 'MC', bg: 'bg-secondary-container text-on-secondary-container' },
                { id: 'ORD-5040', customer: 'Senthil Hardware Depot', date: '2026-04-22', total: 3800, status: 'Completed', initial: 'SH', bg: 'bg-tertiary-container text-on-tertiary-container' },
                { id: 'ORD-5039', customer: 'Priya Home Decor', date: '2026-04-20', total: 1950, status: 'Cancelled', initial: 'PH', bg: 'bg-surface-dim text-on-surface' },
                { id: 'ORD-5038', customer: 'Rajan Construction Co.', date: '2026-04-19', total: 29000, status: 'Completed', initial: 'RC', bg: 'bg-primary-container text-on-primary-container' },
            ],

            // Actions
            addCustomer: (customer) => set((state) => ({
                customers: [...state.customers, { id: `CUST-${Math.floor(1000 + Math.random()*9000)}`, date: new Date().toISOString().split('T')[0], orders: 0, spent: 0, status: 'Active', ...customer }]
            })),
            addProduct: (product) => set((state) => ({
                products: [...state.products, { id: `PRD-${Math.floor(1000 + Math.random()*9000)}`, status: Number(product.stock) <= 0 ? 'Out of Stock' : (Number(product.stock) < 20 ? 'Low Stock' : 'In Stock'), ...product }]
            })),
            importProducts: (newProducts) => set((state) => ({
                products: [...state.products, ...newProducts.map(p => ({ id: `PRD-${Math.floor(1000 + Math.random()*9000)}`, ...p }))]
            })),
            updateProductStock: (id, amount) => set((state) => ({
                products: state.products.map(p => {
                    if (p.id === id) {
                        const newStock = p.stock + Number(amount);
                        return { ...p, stock: newStock, status: newStock <= 0 ? 'Out of Stock' : (newStock < 20 ? 'Low Stock' : 'In Stock') };
                    }
                    return p;
                })
            }))
        }),
        { name: 'jj-painting-storage' }
    )
);
