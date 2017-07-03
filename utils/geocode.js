const axios = require('axios');

const geocodeAddress = async (address) => {
  // turn address string into encoded string
  const encodedAddress = encodeURIComponent(address)
  try {
    const res = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}`);
    const { formatted_address, geometry } = res.data.results[0];
    return { formatted_address, lat: geometry.location.lat, long: geometry.location.lng };
  } catch(e) {
    throw new Error(e);
  }
}

module.exports = { geocodeAddress };