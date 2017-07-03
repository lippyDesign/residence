const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

const { Todo } = require('../../models/todo');
const { Property } = require('../../models/property');
const { User } = require('../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const users = [
  {
    _id: userOneId,
    email: 'vova@vova.com',
    password: 'userOnePass',
    tokens: [{
      access: 'auth',
      token: jwt.sign({ _id: userOneId, access: 'auth' }, process.env.JWT_SECRET).toString()
    }]
  },
  {
    _id: userTwoId,
    email: 'vololipu@gmail.com',
    password: 'userTwoPass',
    tokens: [{
      access: 'auth',
      token: jwt.sign({ _id: userTwoId, access: 'auth' }, process.env.JWT_SECRET).toString()
    }]
  }
];

const todos = [
  { text: 'First text todo', _id: new ObjectID(), _creator: userOneId },
  { text: 'second text todo', _id: new ObjectID(), completed: true, completedAt: 333, _creator: userTwoId }
];

const properties = [
  {
    "title": "Recidence 1",
    "address": "1451 Main St #2 Santa Clara CA 95050",
    "long": 123,
    "lat": 321,
    "price": 3300,
    "beds": 3,
    "baths": 2,
    "sqft": 1050,
    "built": 2005,
    "lot": 1200,
    "description": "nice location",
    "forRent": true,
    "forSale": false,
    _id: new ObjectID(), _creator: userOneId
  },
  {
    "title": "Property 2",
    "address": "24077 Dover Ln Hayward CA 94541",
    "long": 123,
    "lat": 321,
    "price": 2400,
    "beds": 2,
    "baths": 2.5,
    "sqft": 1210,
    "built": 1978,
    "description": "on top of the hill",
    "forRent": true,
    "forSale": false,
    _id: new ObjectID(), _creator: userTwoId
  }
];

const populateProperties = done => {
  Property.remove({})
    .then(() => {
      return Property.insertMany(properties);
    })
    .then(() => done())
    .catch(e => done(e))
}

const populateTodos = done => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
}

const populateUsers = done => {
  User.remove({}).then(() => {
    const userOne = new User(users[0]).save();
    const userTwo = new User(users[1]).save();

    return Promise.all([userOne, userTwo])
  }).then(() => done());
};

module.exports = { properties, todos, users, populateTodos, populateUsers, populateProperties };