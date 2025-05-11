

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const requestRoutes = require('./routes/requestRoutes');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT'],
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// routes
app.use('/api/drone-requests', requestRoutes);

app.listen( process.env.PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${process.env.PORT}`);
});

