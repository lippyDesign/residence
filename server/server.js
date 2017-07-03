require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const { ObjectID } = require('mongodb');

const { mongoose } = require('./db/mongoose');

const { Todo } = require('./models/todo');
const { Residence } = require('./models/residence');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');
const { geocodeAddress } = require('../utils/geocode');

const app = express();

app.use(bodyParser.json());

//////////////////////////////// SERVER ROUTES ///////////////////////////////////

// POST RESIDENCES (Create new residence post)
app.post('/residences', authenticate, async (req, res) => {
  try {
    const { title, address, price, beds, baths, sqft, built, lot, description, forRent, forSale } = req.body;
    // format the address and get coordinates
    const location = await geocodeAddress(address);
    // create residence object
    const residence = new Residence({ title, price, beds, baths, sqft, built, lot, description, forRent, forSale,
      address: location.formatted_address, lat: location.lat, long: location.long, _creator: req.user._id, postedOn:new Date().getTime() });
    // save residence into the database
    const doc = await residence.save();
    // send the newely created residence back
    res.send(doc);
  } catch(e) {
    res.status(400).send(e);
  }
});

// Get Todo
app.get('/todos', authenticate, (req, res) => {
  Todo.find({ _creator: req.user._id})
    .then(todos => {
      res.send({ todos });
    })
    .catch(error => res.status(400).send(error));
});

// Get a particular Todo item
app.get('/todos/:id', authenticate, (req, res) => {
  const { id } = req.params;
  if (!ObjectID.isValid(id)) return res.status(404).send();
  Todo.findOne({ _id: id, _creator: req.user._id })
    .then(todo => {
      // if id not found
      if (!todo) return res.status(404).send();
      res.send({ todo });
    })
    .catch(() => res.status(400).send());
})

// DELETE todos/:id
app.delete('/todos/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  if (!ObjectID.isValid(id)) return res.status(404).send();

  try {
    const todo = await Todo.findOneAndRemove({ _id: id, _creator: req.user._id });
    if (!todo) return res.status(404).send();
    res.send({ todo });
  } catch(e) {
    res.status(400).send();
  }
});

// Update todo records
app.patch('/todos/:id', authenticate, (req, res) => {
  const { id } = req.params;
  // undersor's pick method takes an object to pick properties off of
  // and an array of properties we need to pick off
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) return resizeBy.send(404).send();

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate({_id: id, _creator: req.user._id}, { $set: body }, { new: true })
    .then(todo => {
      if (!todo) return res.status(404).send();
      res.send({ todo });
    })
    .catch(e => res.status(400).send());
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