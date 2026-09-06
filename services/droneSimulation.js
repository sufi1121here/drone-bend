const Request = require('../models/Request');

const BASE_STATION = { lat: 24.8086, lng: 67.1209 };
const DRONE_SPEED = 0.00015; // Simulated speed (degrees per second)

const drones = [
  { id: 'Alpha-1', status: 'Idle', location: { ...BASE_STATION }, destination: null, targetRequest: null },
  { id: 'Bravo-2', status: 'Idle', location: { ...BASE_STATION }, destination: null, targetRequest: null },
  { id: 'Charlie-3', status: 'Idle', location: { ...BASE_STATION }, destination: null, targetRequest: null }
];

const dispatchDrone = (requestId, destLat, destLng) => {
  const available = drones.find(d => d.status === 'Idle');
  if (available) {
    available.status = 'Deploying';
    available.destination = { lat: destLat, lng: destLng };
    available.targetRequest = requestId;
    return available;
  }
  return null; // All drones busy
};

// Start simulation loop (Runs every 1 second)
setInterval(() => {
  drones.forEach(drone => {
    if (drone.status === 'Deploying' && drone.destination) {
      // Calculate delta
      const dLat = drone.destination.lat - drone.location.lat;
      const dLng = drone.destination.lng - drone.location.lng;
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distance < DRONE_SPEED) {
        // Reached destination! Update status and head back
        drone.location = { ...drone.destination };
        drone.status = 'Returning';
        drone.destination = { ...BASE_STATION };
        
        // Asynchronously update MongoDB request status to completed
        if (drone.targetRequest) {
          Request.findByIdAndUpdate(drone.targetRequest, { status: 'completed' })
            .catch(err => console.error('Error completing request:', err));
        }
      } else {
        // Move towards destination
        const ratio = DRONE_SPEED / distance;
        drone.location.lat += dLat * ratio;
        drone.location.lng += dLng * ratio;
      }
    } else if (drone.status === 'Returning' && drone.destination) {
      // Calculate delta to base station
      const dLat = drone.destination.lat - drone.location.lat;
      const dLng = drone.destination.lng - drone.location.lng;
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distance < DRONE_SPEED) {
        // Reached base station
        drone.location = { ...BASE_STATION };
        drone.status = 'Idle';
        drone.destination = null;
        drone.targetRequest = null;
      } else {
        // Move towards base station
        const ratio = DRONE_SPEED / distance;
        drone.location.lat += dLat * ratio;
        drone.location.lng += dLng * ratio;
      }
    }
  });
}, 1000);

module.exports = {
  getDrones: () => drones,
  dispatchDrone
};
