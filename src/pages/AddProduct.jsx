import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import { saveProductToFirebase, getProductFromFirebase, updateProductInFirebase } from '../utils/firebaseDb';

const CATEGORIES = [
    'Exterior Paints', 'Interior Paints', 'Primers & Undercoats',
    'Distempers & Textures', 'Brushes & Rollers', 'Surface Preparation',
    'Adhesives & Sealants', 'Hardware & Fasteners', 'Safety Equipment', 'Other'
];

export default function AddProduct() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    
    const [imagePreview, setImagePreview] = useState(null);
    const [product, setProduct] = useState({
        name: '', sku: '', category: 'Interior Paints', description: '',
        price: '', discountPrice: '', stock: '', lowStockAlert: 10,
        enableTracking: true, sellWhenOutOfStock: false, image: null
    });

    useEffect(() => {
        if (isEdit) {
            const loadProduct = async () => {
                try {
                    const data = await getProductFromFirebase(id);
                    setProduct({
                        name: data.name || '',
                        sku: data.sku || '',
                        category: data.category || 'Interior Paints',
                        description: data.description || '',
                        price: data.price !== undefined ? String(data.price) : '',
                        discountPrice: data.discountPrice !== undefined ? String(data.discountPrice) : '',
                        stock: data.quantity !== undefined ? String(data.quantity) : '',
                        lowStockAlert: data.lowStockThreshold || 10,
                        enableTracking: data.enableTracking !== undefined ? data.enableTracking : true,
                        sellWhenOutOfStock: data.sellWhenOutOfStock !== undefined ? data.sellWhenOutOfStock : false,
                        image: data.image || null
                    });
                    if (data.image) {
                        setImagePreview(data.image);
                    }
                } catch (err) {
                    alert('Failed to load product details: ' + err.message);
                    navigate('/products');
                }
            };
            loadProduct();
        }
    }, [id, isEdit, navigate]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            setProduct(p => ({ ...p, image: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            setProduct(p => ({ ...p, image: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!product.name) { alert('Product name is required.'); return; }
        try {
            const payload = {
                name: product.name,
                sku: product.sku,
                category: product.category,
                description: product.description,
                price: Number(product.price) || 0,
                quantity: Number(product.stock) || 0,
                lowStockThreshold: Number(product.lowStockAlert) || 10,
                image: product.image
            };
            if (isEdit) {
                await updateProductInFirebase(id, payload);
            } else {
                await saveProductToFirebase(payload);
            }
            navigate('/products');
        } catch (err) {
            alert(err.message || 'Failed to save product');
        }
    };

    const upd = (field, val) => setProduct(p => ({ ...p, [field]: val }));

    return (
        <div className="bg-surface font-body-md text-on-surface min-h-screen">
            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 h-16 flex items-center justify-between border-b border-surface-variant">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/products')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container">
                        <span className="material-symbols-outlined text-on-surface-variant">close</span>
                    </button>
                    <h1 className="font-semibold text-lg text-on-surface">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
                </div>
                <button onClick={handleSave} className="px-4 py-1.5 font-semibold text-primary hover:bg-primary/5 rounded-lg text-sm">Save</button>
            </header>

            {/* Desktop Layout via Layout wrapper */}
            <div className="hidden md:block">
                <Layout>
                    <div className="px-8 py-6 flex items-center justify-between">
                        <div>
                            <button onClick={() => navigate('/products')} className="text-slate-400 hover:text-primary flex items-center gap-1 text-xs font-semibold uppercase mb-1">
                                <span className="material-symbols-outlined text-sm">arrow_back</span> Products
                            </button>
                            <h1 className="text-3xl font-semibold text-on-surface">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => navigate('/products')} className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-low">Discard</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-lg hover:brightness-110 transition-all">{isEdit ? 'Save Changes' : 'Save Product'}</button>
                        </div>
                    </div>

                    <div className="px-8 pb-16 grid grid-cols-12 gap-6">
                        {/* Left column */}
                        <div className="col-span-8 flex flex-col gap-6">
                            {/* Basic Information */}
                            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                                    <h3 className="font-semibold text-lg">Basic Information</h3>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Product Name *</label>
                                        <input value={product.name} onChange={e => upd('name', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. Asian Paints Apex Emulsion 20L"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface-variant mb-1">SKU / Product Code</label>
                                        <input value={product.sku} onChange={e => upd('sku', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="AP-APEX-20L"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Category</label>
                                        <select value={product.category} onChange={e => upd('category', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white">
                                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Description</label>
                                        <textarea value={product.description} onChange={e => upd('description', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none" rows="3" placeholder="Enter product details, specifications, brand info..."/>
                                    </div>
                                </div>
                            </section>

                            {/* Pricing */}
                            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                                    <h3 className="font-semibold text-lg">Pricing & Tax</h3>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Base Price (₹)</label>
                                        <input value={product.price} onChange={e => upd('price', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0.00" type="number"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Discount Price (₹)</label>
                                        <input value={product.discountPrice} onChange={e => upd('discountPrice', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0.00" type="number"/>
                                    </div>
                                </div>
                            </section>

                            {/* Media Upload */}
                            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">image</span>
                                    <h3 className="font-semibold text-lg">Media Upload</h3>
                                </div>
                                <div className="p-6">
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={e => e.preventDefault()}
                                        className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                                        onClick={() => document.getElementById('img-upload').click()}
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="h-40 object-contain rounded-lg"/>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-5xl text-outline group-hover:text-primary mb-3 transition-colors">add_a_photo</span>
                                                <p className="font-medium text-on-surface">Click or drag & drop to upload</p>
                                                <p className="text-sm text-on-surface-variant mt-1">JPG, PNG, WEBP — Max 5MB</p>
                                            </>
                                        )}
                                        <input id="img-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                                    </div>
                                    {imagePreview && (
                                        <button onClick={() => { setImagePreview(null); upd('image', null); }} className="mt-3 text-sm text-error hover:underline">Remove image</button>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right column */}
                        <div className="col-span-4 flex flex-col gap-6">
                            {/* Stock Management */}
                            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">inventory</span>
                                    <h3 className="font-semibold text-lg">Stock Management</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Initial Stock (units)</label>
                                        <input value={product.stock} onChange={e => upd('stock', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" type="number"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Low Stock Alert Threshold</label>
                                        <input value={product.lowStockAlert} onChange={e => upd('lowStockAlert', Number(e.target.value))} className="w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" placeholder="10" type="number"/>
                                    </div>
                                    <div className="pt-2 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-on-surface">Enable Stock Tracking</span>
                                            <button onClick={() => upd('enableTracking', !product.enableTracking)} className={`w-10 h-6 rounded-full relative p-1 transition-colors ${product.enableTracking ? 'bg-primary' : 'bg-outline-variant'}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${product.enableTracking ? 'translate-x-4' : 'translate-x-0'}`}/>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-on-surface">Sell when out of stock</span>
                                            <button onClick={() => upd('sellWhenOutOfStock', !product.sellWhenOutOfStock)} className={`w-10 h-6 rounded-full relative p-1 transition-colors ${product.sellWhenOutOfStock ? 'bg-primary' : 'bg-outline-variant'}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${product.sellWhenOutOfStock ? 'translate-x-4' : 'translate-x-0'}`}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Categorization */}
                            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">category</span>
                                    <h3 className="font-semibold text-lg">Categorization</h3>
                                </div>
                                <div className="p-6">
                                    <label className="block text-sm font-medium text-on-surface-variant mb-2">Primary Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.slice(0, 6).map(c => (
                                            <button key={c} onClick={() => upd('category', c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${product.category === c ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Preview card */}
                            <div className="bg-primary-fixed/30 border border-primary/20 p-6 rounded-xl ring-1 ring-primary/10">
                                <h4 className="font-semibold text-primary text-xs mb-4 uppercase tracking-wider">Publication Preview</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Status</span><span className="font-medium text-green-600">Active</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Category</span><span className="font-medium">{product.category}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Stock</span><span className="font-medium">{product.stock || 0} units</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>
            </div>

            {/* Mobile form */}
            <main className="md:hidden px-4 pt-4 pb-32 space-y-6 max-w-[448px] mx-auto">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">General Information</p>
                    <div className="h-0.5 w-8 bg-primary rounded-full mb-4"/>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Product Name *</label>
                            <input value={product.name} onChange={e => upd('name', e.target.value)} className="w-full h-14 px-4 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. Asian Paints Apex 20L"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">SKU / Barcode</label>
                            <input value={product.sku} onChange={e => upd('sku', e.target.value)} className="w-full h-14 px-4 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="AP-APEX-20L"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Category</label>
                            <select value={product.category} onChange={e => upd('category', e.target.value)} className="w-full h-14 px-4 bg-surface border border-outline-variant rounded-xl outline-none bg-white">
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-on-surface-variant mb-1">Price (₹)</label>
                                <input value={product.price} onChange={e => upd('price', e.target.value)} className="w-full h-14 px-4 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="0.00" type="number"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-on-surface-variant mb-1">Qty</label>
                                <input value={product.stock} onChange={e => upd('stock', e.target.value)} className="w-full h-14 px-4 bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="0" type="number"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile media upload */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Product Image</p>
                    <div className="h-0.5 w-8 bg-primary rounded-full mb-4"/>
                    <div onClick={() => document.getElementById('mob-img-upload').click()} className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors">
                        {imagePreview ? <img src={imagePreview} alt="Preview" className="h-32 object-contain rounded-lg"/> : (
                            <>
                                <span className="material-symbols-outlined text-4xl text-outline mb-2">add_a_photo</span>
                                <p className="text-sm font-medium">Tap to upload photo</p>
                                <p className="text-xs text-on-surface-variant mt-1">JPG, PNG up to 5MB</p>
                            </>
                        )}
                        <input id="mob-img-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                    </div>
                </div>
            </main>

            {/* Mobile sticky footer */}
            <footer className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-surface-variant z-50">
                <button onClick={handleSave} className="w-full h-14 bg-primary text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">save</span> Save Product
                </button>
            </footer>
        </div>
    );
}
