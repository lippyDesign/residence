require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const { ObjectID } = require('mongodb');

const { mongoose } = require('./db/mongoose');

const { Todo } = require('./models/todo');
const { Property } = require('./models/property');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');
const { geocodeAddress } = require('../utils/geocode');

const app = express();

app.use(bodyParser.json());

//////////////////////////////// SERVER ROUTES ///////////////////////////////////

// POST /properties (Create new residence post)
app.post('/properties', authenticate, async (req, res) => {
  try {
    const { title, address, price, beds, baths, sqft, built, lot, description, forRent, forSale } = req.body;
    // format the address and get coordinates
    const location = await geocodeAddress(address);
    // create residence object
    const residence = new Property({ title, price, beds, baths, sqft, built, lot, description, forRent, forSale,
      address: location.formatted_address, lat: location.lat, long: location.long, _creator: req.user._id, postedOn:new Date().getTime() });
    // save residence into the database
    const doc = await residence.save();
    // send the newely created residence back
    res.send(doc);
  } catch(e) {
    res.status(400).send(e);
  }
});

// GET /properties (Find all properties)
app.get('/properties', async (req, res) => {
  try {
    // find all properties
    const properties = await Property.find({});
    // send all properties to the client
    res.send({ properties });
  } catch(e) {
    res.status(400).send(error)
  }
});

// GET /myproperties (Find properties created by logged in user)
app.get('/myproperties', authenticate, async (req, res) => {
  try {
    // find all properties created by the user
    const properties = await Property.find({ _creator: req.user._id});
    // send the user's properties to the client
    res.send({ properties });
  } catch(e) {
    res.status(400).send(error);
  }
});

// GET /properties/:id (Get a particular Property)
app.get('/properties/:id', async (req, res) => {
  // pill property id off the req.params
  const { id } = req.params;
  // early return (not found) if id is not a valid id
  if (!ObjectID.isValid(id)) return res.status(404).send();
  try {
    // find property by the given id
    const property = await Property.findById(id);
    // if property with the given id doesn't exist, send not found
    if (!property) return res.status(404).send();
    // if property was found, send it to the client
    res.send({ property });
  } catch(e) {
    res.status(400).send();
  }
});

// DELETE properties/:id (Delete a property by id)
app.delete('/properties/:id', authenticate, async (req, res) => {
  // pill property id off the req.params
  const { id } = req.params;
  // early return (not found) if id is not a valid id
  if (!ObjectID.isValid(id)) return res.status(404).send();
  try {
    // find property by the given id and the one that was created by the user
    const property = await Property.findOneAndRemove({ _id: id, _creator: req.user._id });
    // if property with the given id doesn't exist, return early and send not found
    if (!property) return res.status(404).send();
    // if property was found, delete it and send it to the client
    res.send({ property });
  } catch(e) {
    res.status(400).send();
  }
});

// PATCH properties/:id (Update a property by id)
app.patch('/properties/:id', authenticate, async (req, res) => {
  // pill property id off the req.params
  const { id } = req.params;
  // early return (not found) if id is not a valid id
  if (!ObjectID.isValid(id)) return res.status(404).send();
  // undersor's pick method takes an object to pick properties off of
  // and an array of properties we need to pick off
  let body = _.pick(req.body, ['title', 'address', 'price', 'beds', 'baths', 'sqft', 'built', 'lot', 'description', 'forRent', 'forSale']);
  // format the address and get coordinates
  const location = await geocodeAddress(body.address);
  // set the formattes address and the coordinates onto the body object
  body.long = location.long;
  body.address = location.formatted_address;
  body.lat = location.lat;
  try {
    // update property by id and created by the logged in user
    const property = await Property.findOneAndUpdate({_id: id, _creator: req.user._id}, { $set: body }, { new: true });
    // if property with the given id doesn't exist, return early and send not found
    if (!property) return res.status(404).send();
    // if property was found, send updated property to the client
    res.send({ property });
  } catch(e) {
    res.status(400).send();
  }
});

// Create a new User
app.post('/users', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);
    await user.save();
    const token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);
  } catch(e) {
    res.status(400).send(e);
  }
});

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user)
});

app.post('/users/login', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = await User.findByCredentials(body.email, body.password);
    const token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);
  } catch(e) {
    res.status(400).send();
  }
});

app.delete('/users/me/token', authenticate, async (req, res) => {
  try {
    await req.user.removeToken(req.token);
    res.status(200).send();
  } catch(e) {
    res.status(400).send();
  }
});

//////////////////////////////// WEBPACK LOGIC ///////////////////////////////////

// Server routes MUST be above webpack logic

// if(process.env.NODE_ENV !== 'test') {
//   // if development
//   if (process.env.NODE_ENV !== 'production') {
//     const webpackMiddleware = require('webpack-dev-middleware');
//     const webpack = require('webpack');
//     const webpackConfig = require('../webpack.config.js');

//     app.use(webpackMiddleware(webpack(webpackConfig)));
//   } else {
//     // if production
//     app.use(express.static('dist'));
//     app.get('*', (req, res) => {
//         res.sendFile(path.join(__dirname, 'dist/index.html'));
//     });
//   }
// }

//////////////////////////////// PORT ///////////////////////////////////

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = { app };