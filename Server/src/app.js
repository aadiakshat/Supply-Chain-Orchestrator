import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import nodeRoutes from './routes/nodeRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import shipmentRoutes from './routes/shipmentRoutes.js';
import rebalanceRoutes from './routes/rebalanceRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

// Connect to database
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running', message: 'Supply Chain Orchestrator API' });
});

// Mounted Routes
app.use('/api/nodes', nodeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/rebalance', rebalanceRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
