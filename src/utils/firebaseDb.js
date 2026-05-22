import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

// ==========================================
// --- Product Database Operations ---
// ==========================================

export const saveProductToFirebase = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      name: productData.name,
      price: Number(productData.price),
      quantity: Number(productData.quantity),
      category: productData.category,
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
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading products from Firebase:", error);
    throw error;
  }
};

export const updateProductInFirebase = async (productId, updateData) => {
  try {
    const productRef = doc(db, "products", productId);
    const cleanedUpdates = {};
    if (updateData.name !== undefined) cleanedUpdates.name = updateData.name;
    if (updateData.price !== undefined) cleanedUpdates.price = Number(updateData.price);
    if (updateData.quantity !== undefined) cleanedUpdates.quantity = Number(updateData.quantity);
    if (updateData.category !== undefined) cleanedUpdates.category = updateData.category;
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
  try {
    const querySnapshot = await getDocs(collection(db, "customers"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading customers from Firebase:", error);
    throw error;
  }
};

export const updateCustomerInFirebase = async (customerId, updateData) => {
  try {
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
    const docRef = await addDoc(collection(db, "orders"), {
      customerId: orderData.customerId,
      total: Number(orderData.total),
      status: orderData.status || "Pending",
      items: orderData.items.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price)
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving order to Firebase:", error);
    throw error;
  }
};

export const getOrdersFromFirebase = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "orders"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  try {
    const querySnapshot = await getDocs(collection(db, "transactions"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error loading transactions from Firebase:", error);
    throw error;
  }
};
