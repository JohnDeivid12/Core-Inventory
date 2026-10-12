const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const uploadRoutes = require('./routes/upload.routes');
const productRoutes = require('./routes/product.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const receiptRoutes = require('./routes/receipt.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const transferRoutes = require('./routes/transfer.routes');
const adjustmentRoutes = require('./routes/adjustment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const historyRoutes = require('./routes/history.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CoreInventory API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Synchronize Database
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

sequelize.authenticate() // Solo verifica la conexion; el esquema se gestiona con schema.sql
  .then(() => {
    console.log('✅ Conectado a Supabase (PostgreSQL)');
    app.listen(PORT, () => {
      console.log(`🚀 CoreInventory Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  });
