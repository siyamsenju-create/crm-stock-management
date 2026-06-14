import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

// ==========================================
// --- Caching Helpers ---
// ==========================================

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms

const getCachedData = (key) => {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch (error) {
    console.warn(`Cache read error for key "${key}":`, error);
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (error) {
    console.warn(`Cache write error for key "${key}":`, error);
  }
};

export const clearAllCaches = () => {
  try {
    sessionStorage.removeItem("crm_cache_products");
    sessionStorage.removeItem("crm_cache_orders");
    sessionStorage.removeItem("crm_cache_customers");
    sessionStorage.removeItem("crm_cache_transactions");
    console.log("[Cache] All CRM caches invalidated");
  } catch (error) {
    console.warn("Failed to clear cache:", error);
  }
};

// ==========================================
// --- Product Database Operations ---
// ==========================================

export const saveProductToFirebase = async (productData) => {
  try {
    clearAllCaches();
    const docRef = await addDoc(collection(db, "products"), {
      name: productData.name,
      price: Number(productData.price),
      quantity: Number(productData.quantity),
      category: productData.category,
      sku: productData.sku || "",
      description: productData.description || "",
      image: productData.image || null,
      lowStockThreshold: Number(productData.lowStockThreshold || 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving product to Firebase:", error);
    throw error;
  }
};

export const getProductsFromFirebase = async () => {
  const cacheKey = "crm_cache_products";
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log("[Cache] Served products from cache");
    return cached;
  }
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error loading products from Firebase:", error);
    throw error;
  }
};

export const getProductFromFirebase = async (productId) => {
  try {
    const productRef = doc(db, "products", productId);
    const docSnap = await getDoc(productRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Product not found");
    }
  } catch (error) {
    console.error("Error loading product from Firebase:", error);
    throw error;
  }
};

export const updateProductInFirebase = async (productId, updateData) => {
  try {
    clearAllCaches();
    const productRef = doc(db, "products", productId);
    const cleanedUpdates = {};
    if (updateData.name !== undefined) cleanedUpdates.name = updateData.name;
    if (updateData.price !== undefined) cleanedUpdates.price = Number(updateData.price);
    if (updateData.quantity !== undefined) cleanedUpdates.quantity = Number(updateData.quantity);
    if (updateData.category !== undefined) cleanedUpdates.category = updateData.category;
    if (updateData.sku !== undefined) cleanedUpdates.sku = updateData.sku;
    if (updateData.description !== undefined) cleanedUpdates.description = updateData.description;
    if (updateData.image !== undefined) cleanedUpdates.image = updateData.image;
    if (updateData.lowStockThreshold !== undefined) cleanedUpdates.lowStockThreshold = Number(updateData.lowStockThreshold);
    cleanedUpdates.updatedAt = new Date().toISOString();

    await updateDoc(productRef, cleanedUpdates);
    return { success: true };
  } catch (error) {
    console.error("Error updating product in Firebase:", error);
    throw error;
  }
};

export const deleteProductFromFirebase = async (productId) => {
  try {
    clearAllCaches();
    const productRef = doc(db, "products", productId);
    await deleteDoc(productRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting product from Firebase:", error);
    throw error;
  }
};

// ==========================================
// --- Customer Database Operations ---
// ==========================================

export const saveCustomerToFirebase = async (customerData) => {
  try {
    clearAllCaches();
    const docRef = await addDoc(collection(db, "customers"), {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone || "",
      location: customerData.location || "",
      status: customerData.status || "Active",
      ordersCount: Number(customerData.ordersCount || 0),
      totalSpent: Number(customerData.totalSpent || 0.0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving customer to Firebase:", error);
    throw error;
  }
};

export const getCustomersFromFirebase = async () => {
  const cacheKey = "crm_cache_customers";
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log("[Cache] Served customers from cache");
    return cached;
  }
  try {
    const querySnapshot = await getDocs(collection(db, "customers"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error loading customers from Firebase:", error);
    throw error;
  }
};

export const updateCustomerInFirebase = async (customerId, updateData) => {
  try {
    clearAllCaches();
    const customerRef = doc(db, "customers", customerId);
    const cleanedUpdates = {};
    if (updateData.name !== undefined) cleanedUpdates.name = updateData.name;
    if (updateData.email !== undefined) cleanedUpdates.email = updateData.email;
    if (updateData.phone !== undefined) cleanedUpdates.phone = updateData.phone;
    if (updateData.location !== undefined) cleanedUpdates.location = updateData.location;
    if (updateData.status !== undefined) cleanedUpdates.status = updateData.status;
    if (updateData.ordersCount !== undefined) cleanedUpdates.ordersCount = Number(updateData.ordersCount);
    if (updateData.totalSpent !== undefined) cleanedUpdates.totalSpent = Number(updateData.totalSpent);
    cleanedUpdates.updatedAt = new Date().toISOString();

    await updateDoc(customerRef, cleanedUpdates);
    return { success: true };
  } catch (error) {
    console.error("Error updating customer in Firebase:", error);
    throw error;
  }
};

// ==========================================
// --- Order Database Operations ---
// ==========================================

export const saveOrderToFirebase = async (orderData) => {
  try {
    clearAllCaches();
    const docRef = await addDoc(collection(db, "orders"), {
      customerId:      orderData.customerId || '',
      customer:        orderData.customer   || {},
      subtotal:        Number(orderData.subtotal || 0),
      tax:             Number(orderData.tax      || 0),
      total:           Number(orderData.total    || 0),
      status:          orderData.status          || "Pending",
      shippingAddress: orderData.shippingAddress || '',
      deliveryDate:    orderData.deliveryDate    || '',
      carrier:         orderData.carrier         || '',
      items: (orderData.items || []).map(item => ({
        productId: item.productId,
        quantity:  Number(item.quantity),
        price:     Number(item.price)
      })),
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving order to Firebase:", error);
    throw error;
  }
};

export const getOrdersFromFirebase = async () => {
  const cacheKey = "crm_cache_orders";
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log("[Cache] Served orders from cache");
    return cached;
  }
  try {
    const querySnapshot = await getDocs(collection(db, "orders"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error loading orders from Firebase:", error);
    throw error;
  }
};

// ==========================================
// --- Inventory Transaction Operations ---
// ==========================================

export const saveTransactionToFirebase = async (txData) => {
  try {
    clearAllCaches();
    const docRef = await addDoc(collection(db, "transactions"), {
      productId: txData.productId,
      type: txData.type, // 'IN' or 'OUT'
      quantity: Number(txData.quantity),
      reference: txData.reference || "",
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving transaction to Firebase:", error);
    throw error;
  }
};

export const getTransactionsFromFirebase = async () => {
  const cacheKey = "crm_cache_transactions";
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log("[Cache] Served transactions from cache");
    return cached;
  }
  try {
    const querySnapshot = await getDocs(collection(db, "transactions"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error loading transactions from Firebase:", error);
    throw error;
  }
};
