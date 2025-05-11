const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

// GET all requests
router.get('/', async (req, res) => {
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
  const { status, longitude, latitude  } = req.body;

  try {
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

    if (!updated) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;





