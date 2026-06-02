require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes         = require('./src/routes/auth');
const userRoutes         = require('./src/routes/users');
const warehouseRoutes    = require('./src/routes/warehouse');
const stockVoucherRoutes = require('./src/routes/stockVouchers');
const masterRoutes       = require('./src/routes/masters');
const voucherRoutes      = require('./src/routes/vouchers');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',           authRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/warehouses',     warehouseRoutes);
app.use('/api/stock-vouchers', stockVoucherRoutes);
app.use('/api/masters',        masterRoutes);
app.use('/api/vouchers',       voucherRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
