import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Secure Env Variable Loader ---
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
  console.log("✅ Successfully loaded environment variables from .env");
} else {
  console.warn("⚠️ .env file not found at " + envPath);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Error: Firebase configuration environment variables are missing!");
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Mock Data Set ---
const mockProducts = [
  { name: "Royal Velvet Red Paint (5L)", price: 45.99, quantity: 45, category: "Paints", lowStockThreshold: 15 },
  { name: "Ocean Breeze Blue Paint (5L)", price: 42.50, quantity: 8, category: "Paints", lowStockThreshold: 10 }, // Triggers low-stock!
  { name: "Premium Nylon Wall Brush 3\"", price: 12.99, quantity: 150, category: "Tools", lowStockThreshold: 20 },
  { name: "Heavy-Duty Pro Paint Roller 9\"", price: 15.50, quantity: 18, category: "Tools", lowStockThreshold: 15 },
  { name: "Mineral Spirit Solvent 1L", price: 19.20, quantity: 60, category: "Solvents", lowStockThreshold: 12 },
  { name: "Quick-Dry Wood Primer 5L", price: 34.00, quantity: 5, category: "Primers", lowStockThreshold: 10 } // Triggers low-stock!
];

const mockCustomers = [
  { name: "John Doe", email: "john.doe@gmail.com", phone: "+1-555-0199", location: "South District", status: "Active", ordersCount: 5, totalSpent: 250.00 },
  { name: "Alice Smith", email: "alice.smith@yahoo.com", phone: "+1-555-0245", location: "West Boulevard", status: "Active", ordersCount: 12, totalSpent: 840.50 },
  { name: "JJ Painting Contractors", email: "contractors@jjpainting.com", phone: "+1-555-0789", location: "Central Avenue", status: "Active", ordersCount: 35, totalSpent: 4520.00 },
  { name: "Bob Johnson", email: "bob.j@outlook.com", phone: "+1-555-0322", location: "North Estate", status: "Inactive", ordersCount: 1, totalSpent: 45.99 }
];

async function seedDatabase() {
  try {
    console.log("\n🚀 Starting Firebase Database Seeding Process...");

    // 1. Seed Products
    console.log("\n📦 Seeding 'products' collection...");
    const productIds = [];
    for (const prod of mockProducts) {
      const docRef = await addDoc(collection(db, "products"), {
        ...prod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      productIds.push(docRef.id);
      console.log(`   + Added product: "${prod.name}" (ID: ${docRef.id})`);
    }

    // 2. Seed Customers
    console.log("\n👥 Seeding 'customers' collection...");
    const customerIds = [];
    for (const cust of mockCustomers) {
      const docRef = await addDoc(collection(db, "customers"), {
        ...cust,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      customerIds.push(docRef.id);
      console.log(`   + Added customer: "${cust.name}" (ID: ${docRef.id})`);
    }

    // 3. Seed Transactions
    console.log("\n📈 Seeding 'transactions' collection...");
    const sampleTransactions = [
      { productId: productIds[0], type: "IN", quantity: 50, reference: "Initial Stocking Purchase" },
      { productId: productIds[0], type: "OUT", quantity: 5, reference: "Retail Customer Sale" },
      { productId: productIds[1], type: "IN", quantity: 10, reference: "Factory Delivery" },
      { productId: productIds[1], type: "OUT", quantity: 2, reference: "Contractor Order #4902" },
      { productId: productIds[5], type: "IN", quantity: 5, reference: "Supplier Pre-Order" }
    ];

    for (const tx of sampleTransactions) {
      const docRef = await addDoc(collection(db, "transactions"), {
        ...tx,
        createdAt: new Date().toISOString()
      });
      console.log(`   + Added transaction type ${tx.type} for qty ${tx.quantity} (ID: ${docRef.id})`);
    }

    console.log("\n🎉 Firebase Database successfully seeded with rich mock data! 🚀");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding error:", error);
    process.exit(1);
  }
}

seedDatabase();
