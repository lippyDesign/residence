const axios = require('axios');

const geocodeAddress = async (address) => {
  // turn address string into encoded string
  const encodedAddress = encodeURIComponent(address)
  try {
    const res = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}`);
    // const address = body.results[0].formatted_address,
    // const latitude = body.results[0].geometry.location.lat,
    // const longitude = body.results[0].geometry.location.lng
    // console.log(address)
    // console.log(latitude)
    // console.log(longitude)
    const { formatted_address, geometry } = res.data.results[0];
    return { formatted_address, lat: geometry.location.lat, long: geometry.location.lng };
  } catch(e) {
    throw new Error(e);
  }
  // request({
  //   url: `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}`,
  //   json: true
  // }, (error, response, body) => {
  //   if (error) {
  //     callback('Unable to connect to google servers');
  //   } else if (response.status === 'ZERO_RESULTS') {
  //     callback('Unable to find that address');
  //   } else if (body.status === 'OK') {
  //     callback(null, {
  //       address: body.results[0].formatted_address,
  //       latitude: body.results[0].geometry.location.lat,
  //       longitude: body.results[0].geometry.location.lng
  //     });
  //   } else {
  //     callback('something went wrong');
  //   }
  // });
}

module.exports = { geocodeAddress };