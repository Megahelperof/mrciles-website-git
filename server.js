const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public'), {
  dotfiles: 'ignore',
  index: false
}));

if (!admin.apps.length) {
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('🔥 Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

app.get('/api/status', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/api/products', async (req, res, next) => {
  try {
    const snapshot = await db.collection('products')
      .orderBy('created_at', 'desc')
      .get();
    
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate()?.toISOString(),
        imageSrc: data.image?.data 
          ? `data:${data.image.contentType};base64,${data.image.data}`
          : null
      };
    });
    
    res.json(products);
  } catch (err) {
    next(err);
  }
});

app.post('/api/products/bulk', async (req, res, next) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Products array required' });
    }

    const batch = db.batch();
    const addedIds = [];
    
    for (const product of products) {
      if (!product?.name || !product?.price || !product?.link || !product?.image) {
        continue;
      }

      const docRef = db.collection('products').doc();
      batch.set(docRef, {
        name: product.name,
        price: product.price,
        link: product.link,
        mainCategory: product.mainCategory || 'MISC',
        subCategory: product.subCategory || null,
        image: {
          data: product.image.data,
          contentType: product.image.contentType || 'image/jpeg',
          name: product.image.name || `product-${Date.now()}.jpg`
        },
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      addedIds.push(docRef.id);
    }

    await batch.commit();
    res.json({ success: true, addedIds });
    
  } catch (err) {
    next(err);
  }
});

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});