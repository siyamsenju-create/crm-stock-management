const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

let db;
if (process.env.NODE_ENV !== 'test') {
  if (!admin.apps.length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const path = require('path');
      const fs = require('fs');
      const resolvedPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
      if (fs.existsSync(resolvedPath)) {
        admin.initializeApp({
          credential: admin.credential.cert(require(resolvedPath)),
          projectId: process.env.FIREBASE_PROJECT_ID || 'crm-project-management-f21f3'
        });
      } else {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID || 'crm-project-management-f21f3'
        });
      }
    } else {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'crm-project-management-f21f3'
      });
    }
  }
  db = admin.firestore();
}

// Global In-Memory Store for Testing
const memoryDB = new Map();

function matchFilter(doc, filter) {
  for (const [key, filterVal] of Object.entries(filter)) {
    if (key === '$expr') {
      const lteExpr = filterVal.$lte;
      if (lteExpr && Array.isArray(lteExpr)) {
        const val1 = resolveField(doc, lteExpr[0]);
        const val2 = resolveField(doc, lteExpr[1]);
        if (!(val1 <= val2)) return false;
      }
      continue;
    }
    
    const docVal = doc[key];
    
    if (filterVal && typeof filterVal === 'object' && !Array.isArray(filterVal)) {
      if (filterVal.$regex !== undefined) {
        const regex = new RegExp(filterVal.$regex, filterVal.$options || '');
        if (!regex.test(String(docVal || ''))) return false;
      }
      if (filterVal.$gt !== undefined && !(docVal > filterVal.$gt)) return false;
      if (filterVal.$gte !== undefined && !(docVal >= filterVal.$gte)) return false;
      if (filterVal.$lt !== undefined && !(docVal < filterVal.$lt)) return false;
      if (filterVal.$lte !== undefined && !(docVal <= filterVal.$lte)) return false;
      if (filterVal.$in !== undefined && Array.isArray(filterVal.$in)) {
        if (!filterVal.$in.includes(docVal)) return false;
      }
    } else {
      if (String(docVal) !== String(filterVal)) return false;
    }
  }
  return true;
}

function resolveField(doc, expr) {
  if (typeof expr === 'string' && expr.startsWith('$')) {
    return doc[expr.substring(1)];
  }
  return expr;
}

function filterFields(obj, selectStr) {
  const fields = selectStr.split(' ').filter(f => f);
  const result = { _id: obj._id, id: obj.id };
  fields.forEach(f => {
    // If selecting specific fields
    if (f.startsWith('+')) {
      const actualField = f.substring(1);
      result[actualField] = obj[actualField];
    } else if (f.startsWith('-')) {
      // Exclude field handled elsewhere
    } else {
      result[f] = obj[f];
    }
  });
  return result;
}

function wrapDoc(doc, collection) {
  if (!doc) return null;
  
  const defaults = collection.defaults || {};
  for (const [key, val] of Object.entries(defaults)) {
    if (doc[key] === undefined) {
      doc[key] = val;
    }
  }
  
  const docId = doc._id || doc.id;
  doc._id = docId;
  doc.id = docId;

  // Add deleteOne method
  doc.deleteOne = async function() {
    await collection.deleteOne(docId);
  };

  // Add save method
  doc.save = async function() {
    if (collection.collectionName === 'users' && this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
    
    const dataToSave = { ...this };
    delete dataToSave.save;
    delete dataToSave.deleteOne;
    delete dataToSave.matchPassword;
    
    dataToSave.updatedAt = new Date().toISOString();
    
    await collection.updateRawDoc(docId, dataToSave);
  };

  if (collection.collectionName === 'users') {
    doc.matchPassword = async function(enteredPassword) {
      if (!this.password) return false;
      return await bcrypt.compare(enteredPassword, this.password);
    };
  }

  return doc;
}

class FirestoreQuery {
  constructor(collection, filter = {}) {
    this.collection = collection;
    this.filter = filter;
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._populate = null;
    this._select = null;
    this._findOne = false;
  }

  findOne() {
    this._findOne = true;
    return this;
  }

  sort(sortBy) {
    this._sort = sortBy;
    return this;
  }

  skip(skipVal) {
    this._skip = skipVal;
    return this;
  }

  limit(limitVal) {
    this._limit = limitVal;
    return this;
  }

  populate(options) {
    this._populate = options;
    return this;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  // Thenable interface so it can be awaited directly
  async then(resolve, reject) {
    try {
      const results = await this.execute();
      resolve(results);
    } catch (err) {
      reject(err);
    }
  }

  async execute() {
    let docs = await this.collection.getRawDocs(this.filter);

    // Apply sorting
    if (this._sort) {
      const isDesc = this._sort.startsWith('-');
      const field = isDesc ? this._sort.substring(1) : this._sort;
      docs.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });
    }

    // Apply skip and limit
    if (this._skip) {
      docs = docs.slice(this._skip);
    }
    if (this._limit) {
      docs = docs.slice(0, this._limit);
    }

    // Strip password from users unless select('+password') is requested
    if (this.collection.collectionName === 'users') {
      const includePassword = this._select && this._select.includes('password');
      docs.forEach(doc => {
        if (!includePassword) {
          delete doc.password;
        }
      });
    }

    // Apply populate
    if (this._populate) {
      const path = typeof this._populate === 'string' ? this._populate : this._populate.path;
      const select = typeof this._populate === 'object' ? this._populate.select : null;

      for (const doc of docs) {
        if (path === 'customer' && doc.customer) {
          const customerCol = process.env.NODE_ENV === 'test' ? new InMemoryCollection('customers', this.collection.defaults) : new FirestoreCollection('customers', this.collection.defaults);
          const customerDoc = await customerCol.findById(doc.customer);
          if (customerDoc) {
            doc.customer = select ? filterFields(customerDoc, select) : customerDoc;
          }
        } else if (path === 'productId' && doc.productId) {
          const productCol = process.env.NODE_ENV === 'test' ? new InMemoryCollection('products', this.collection.defaults) : new FirestoreCollection('products', this.collection.defaults);
          const productDoc = await productCol.findById(doc.productId);
          if (productDoc) {
            doc.productId = select ? filterFields(productDoc, select) : productDoc;
          }
        } else if (path === 'items.product' && doc.items) {
          const productCol = process.env.NODE_ENV === 'test' ? new InMemoryCollection('products', this.collection.defaults) : new FirestoreCollection('products', this.collection.defaults);
          for (const item of doc.items) {
            if (item.product) {
              const productDoc = await productCol.findById(item.product);
              if (productDoc) {
                item.product = select ? filterFields(productDoc, select) : productDoc;
              }
            }
          }
        }
      }
    }

    if (this._findOne) {
      return docs.length > 0 ? wrapDoc(docs[0], this.collection) : null;
    }

    // Wrap all returned docs
    return docs.map(d => wrapDoc(d, this.collection));
  }
}

class InMemoryCollection {
  constructor(name, defaults = {}) {
    this.collectionName = name;
    this.defaults = defaults;
    if (!memoryDB.has(name)) {
      memoryDB.set(name, new Map());
    }
  }

  get store() {
    return memoryDB.get(this.collectionName);
  }

  async getRawDocs(filter) {
    const docs = Array.from(this.store.values()).map(d => ({ ...d }));
    return docs.filter(d => matchFilter(d, filter));
  }

  async findById(id) {
    const doc = this.store.get(String(id));
    return doc ? { ...doc } : null;
  }

  async updateRawDoc(id, data) {
    this.store.set(String(id), { ...data, _id: String(id), id: String(id) });
  }

  async deleteOne(id) {
    this.store.delete(String(id));
  }

  async deleteMany(filter) {
    const toDelete = [];
    for (const [id, doc] of this.store.entries()) {
      if (matchFilter(doc, filter)) {
        toDelete.push(id);
      }
    }
    toDelete.forEach(id => this.store.delete(id));
    return { deletedCount: toDelete.length };
  }

  async create(data) {
    const mergedData = { ...this.defaults, ...data };
    const id = mergedData._id || mergedData.id || crypto.randomUUID();
    const doc = {
      ...mergedData,
      _id: id,
      id: id,
      createdAt: mergedData.createdAt || new Date().toISOString(),
      updatedAt: mergedData.updatedAt || new Date().toISOString(),
    };
    
    if (this.collectionName === 'users' && doc.password) {
      if (!doc.password.startsWith('$2a$') && !doc.password.startsWith('$2b$')) {
        doc.password = await bcrypt.hash(doc.password, 12);
      }
    }

    this.store.set(id, doc);
    return doc;
  }
}

class FirestoreCollection {
  constructor(name, defaults = {}) {
    this.collectionName = name;
    this.defaults = defaults;
  }

  get col() {
    return db.collection(this.collectionName);
  }

  async getRawDocs(filter) {
    let queryRef = this.col;
    for (const [key, value] of Object.entries(filter)) {
      if (key === '_id' || key === 'id') {
        queryRef = queryRef.where(admin.firestore.FieldPath.documentId(), '==', String(value));
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Operator, filter in JS
      } else if (key === '$expr') {
        // Expression, filter in JS
      } else {
        queryRef = queryRef.where(key, '==', value);
      }
    }
    const snapshot = await queryRef.get();
    const docs = snapshot.docs.map(doc => ({ id: doc.id, _id: doc.id, ...doc.data() }));
    return docs.filter(d => matchFilter(d, filter));
  }

  async findById(id) {
    if (!id) return null;
    const docSnap = await this.col.doc(String(id)).get();
    if (!docSnap.exists) return null;
    const data = docSnap.data();
    return { id: docSnap.id, _id: docSnap.id, ...data };
  }

  async updateRawDoc(id, data) {
    await this.col.doc(String(id)).set(data, { merge: true });
  }

  async deleteOne(id) {
    await this.col.doc(String(id)).delete();
  }

  async deleteMany(filter) {
    const docs = await this.getRawDocs(filter);
    const batch = db.batch();
    docs.forEach(doc => {
      batch.delete(this.col.doc(String(doc.id)));
    });
    await batch.commit();
    return { deletedCount: docs.length };
  }

  async create(data) {
    let dataToSave = { ...this.defaults, ...data };
    if (this.collectionName === 'users' && dataToSave.password) {
      if (!dataToSave.password.startsWith('$2a$') && !dataToSave.password.startsWith('$2b$')) {
        dataToSave.password = await bcrypt.hash(dataToSave.password, 12);
      }
    }
    
    const docRef = this.col.doc();
    const id = docRef.id;
    dataToSave._id = id;
    dataToSave.id = id;
    dataToSave.createdAt = dataToSave.createdAt || new Date().toISOString();
    dataToSave.updatedAt = dataToSave.updatedAt || new Date().toISOString();
    
    await docRef.set(dataToSave);
    return dataToSave;
  }
}

class FirestoreModel {
  constructor(name, defaults = {}) {
    this.name = name;
    this.defaults = defaults;
  }

  get impl() {
    return process.env.NODE_ENV === 'test'
      ? new InMemoryCollection(this.name, this.defaults)
      : new FirestoreCollection(this.name, this.defaults);
  }

  async create(data) {
    const doc = await this.impl.create(data);
    return wrapDoc(doc, this.impl);
  }

  findById(id) {
    return new FirestoreQuery(this.impl, { _id: String(id) }).findOne();
  }

  findOne(filter) {
    return new FirestoreQuery(this.impl, filter).findOne();
  }

  find(filter) {
    return new FirestoreQuery(this.impl, filter);
  }

  async findByIdAndUpdate(id, update, options) {
    const doc = await this.impl.findById(id);
    if (!doc) return null;
    
    const wrapped = wrapDoc(doc, this.impl);
    
    if (update.$inc) {
      for (const [key, val] of Object.entries(update.$inc)) {
        wrapped[key] = (wrapped[key] || 0) + val;
      }
    }
    if (update.$set) {
      for (const [key, val] of Object.entries(update.$set)) {
        wrapped[key] = val;
      }
    }
    
    const cleanUpdate = { ...update };
    delete cleanUpdate.$inc;
    delete cleanUpdate.$set;
    Object.assign(wrapped, cleanUpdate);
    
    await wrapped.save();
    return wrapped;
  }

  async findByIdAndDelete(id) {
    const doc = await this.impl.findById(id);
    if (!doc) return null;
    await this.impl.deleteOne(id);
    return doc;
  }

  async deleteMany(filter) {
    return await this.impl.deleteMany(filter);
  }

  async countDocuments(filter) {
    const docs = await this.impl.getRawDocs(filter);
    return docs.length;
  }

  async aggregate(pipeline) {
    const docs = await this.impl.getRawDocs({});
    
    if (pipeline.length === 1 && pipeline[0].$group && pipeline[0].$group._id === null) {
      const group = pipeline[0].$group;
      let totalInventoryValue = 0;
      let totalStockQuantity = 0;
      
      docs.forEach(d => {
        if (group.totalInventoryValue) {
          totalInventoryValue += (d.price || 0) * (d.quantity || 0);
        }
        if (group.totalStockQuantity) {
          totalStockQuantity += (d.quantity || 0);
        }
      });
      return [{ _id: null, totalInventoryValue, totalStockQuantity }];
    }

    if (pipeline.length === 1 && pipeline[0].$group && pipeline[0].$group._id === '$type') {
      const counts = {};
      docs.forEach(d => {
        const type = d.type;
        counts[type] = (counts[type] || 0) + (d.quantity || 0);
      });
      return Object.entries(counts).map(([type, totalQuantity]) => ({
        _id: type,
        totalQuantity
      }));
    }

    if (pipeline.length === 2 && pipeline[0].$match && pipeline[1].$group) {
      const matchStatus = pipeline[0].$match.status;
      const filtered = docs.filter(d => d.status === matchStatus);
      let totalRevenue = 0;
      filtered.forEach(d => {
        totalRevenue += (d.total || 0);
      });
      return [{ _id: null, totalRevenue }];
    }

    return [];
  }
}

module.exports = FirestoreModel;
