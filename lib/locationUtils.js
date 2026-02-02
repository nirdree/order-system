export const checkPlaceOfOrder = async (latitude, longitude, accuracy) => {
  // Define the allowed location (e.g., cafe location)
  const allowedLocation = {
    latitude: 40.712776, // Example: Cafe latitude
    longitude: -74.005974 // Example: Cafe longitude
  };
    const allowedRadius = 100; // in meters
    // Calculate distance between two coordinates using Haversine formula
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371e3; // Earth radius in meters
    const φ1 = toRad(allowedLocation.latitude);
    const φ2 = toRad(latitude);
    const Δφ = toRad(latitude - allowedLocation.latitude);
    const Δλ = toRad(longitude - allowedLocation.longitude);
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // in meters
    // Check if distance is within allowed radius plus accuracy
    return distance <= (allowedRadius + accuracy);
}   