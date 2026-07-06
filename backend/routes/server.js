const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.get('/health', (req, res) => {
 res.json({ status: 'API is healthy' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
 console.log(`✅ Server running on http://localhost:${PORT}`);
});