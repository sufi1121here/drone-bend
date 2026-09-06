const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const auth = require('../middleware/auth');
const droneSimulation = require('../services/droneSimulation');

// GET all requests (Protected for Admins only)
router.get('/', auth, async (req, res) => {
  const requests = await Request.find();
  res.json(requests);
});

// POST new request
router.post('/', async (req, res) => {
  const { userName, mobileNumber, longitude, latitude, category} = req.body;

  const newRequest = new Request({ userName, mobileNumber, longitude, latitude, category });
  await newRequest.save();
  res.status(201).json(newRequest);
});

// PUT update status (accept/decline)
router.put('/:id', async (req, res) => {
  const { status, longitude, latitude } = req.body;

  try {
    const originalRequest = await Request.findById(req.params.id);
    if (!originalRequest) return res.status(404).json({ error: 'Request not found' });

    const updatingValues = {}
    if (status) {updatingValues.status=status}
    if (longitude && latitude ) {
      updatingValues.longitude=longitude
      updatingValues.latitude=latitude
    }
    const updated = await Request.findByIdAndUpdate(
      req.params.id,
      { ...updatingValues },
      { new: true }
    );

    // Trigger drone dispatch if request is accepted
    if (status === 'accepted') {
      const drone = droneSimulation.dispatchDrone(
        updated._id,
        updated.latitude,
        updated.longitude
      );
      if (!drone) {
        console.warn('No drones available for dispatch!');
      }
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;





