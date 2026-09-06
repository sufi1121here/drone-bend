const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const droneSimulation = require('../services/droneSimulation');

// GET all drones and their real-time locations (Protected for Admins)
router.get('/', auth, (req, res) => {
  const drones = droneSimulation.getDrones();
  res.json(drones);
});

module.exports = router;
