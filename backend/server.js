require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Create a .env file from .env.example.');
  process.exit(1);
}

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later' }
});

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.orgId = payload.orgId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// AUTH ROUTES
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { email, password, organizationName } = req.body;
    if (!email || !password || !organizationName) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const org = await prisma.organization.create({ data: { name: organizationName } });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, organizationId: org.id }
    });
    const token = jwt.sign({ userId: user.id, orgId: org.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user.id, orgId: org.id });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email or organization name already exists' });
    }
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, orgId: user.organizationId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user.id, orgId: user.organizationId });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// PRODUCT ROUTES (protected — JWT verified, org ownership enforced)
app.get('/api/products', authenticate, async (req, res) => {
  try {
    const products = await prisma.product.findMany({ where: { organizationId: req.orgId } });
    res.json(products);
  } catch {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', authenticate, async (req, res) => {
  try {
    const { name, sku, description, quantityOnHand, costPrice, sellingPrice, lowStockThreshold } = req.body;
    if (!name || !sku) return res.status(400).json({ error: 'Name and SKU are required' });
    const product = await prisma.product.create({
      data: {
        organizationId: req.orgId, name, sku, description,
        quantityOnHand: parseInt(quantityOnHand) || 0,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : null
      }
    });
    res.json(product);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'SKU already exists in your organization' });
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', authenticate, async (req, res) => {
  try {
    const { name, sku, description, quantityOnHand, costPrice, sellingPrice, lowStockThreshold } = req.body;
    const existing = await prisma.product.findFirst({
      where: { id: parseInt(req.params.id), organizationId: req.orgId }
    });
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name, sku, description,
        quantityOnHand: parseInt(quantityOnHand) || 0,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : null
      }
    });
    res.json(product);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'SKU already exists in your organization' });
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', authenticate, async (req, res) => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: parseInt(req.params.id), organizationId: req.orgId }
    });
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Product deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// SETTINGS ROUTES (protected)
app.get('/api/settings', authenticate, async (req, res) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { organizationId: req.orgId } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { organizationId: req.orgId } });
    }
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', authenticate, async (req, res) => {
  try {
    const { defaultLowStockThreshold } = req.body;
    const threshold = parseInt(defaultLowStockThreshold);
    if (isNaN(threshold) || threshold < 0) {
      return res.status(400).json({ error: 'Invalid threshold value' });
    }
    const settings = await prisma.settings.upsert({
      where: { organizationId: req.orgId },
      update: { defaultLowStockThreshold: threshold },
      create: { organizationId: req.orgId, defaultLowStockThreshold: threshold }
    });
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'API is healthy' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
