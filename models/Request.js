const mongoose = require('mongoose');
const requestSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  mobileNumber: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
  category:{
      type: String,
  },
  longitude: Number,
  latitude: Number
});
module.exports = mongoose.model('Request', requestSchema);
