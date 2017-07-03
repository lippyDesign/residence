const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('./../server');
const { Todo } = require('../models/todo');
const { Property } = require('../models/property');
const { User } = require('../models/user');
const { todos, users, properties, populateProperties, populateTodos, populateUsers } = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);
beforeEach(populateProperties);

describe('POST /properties', () => {
  const property = {
    title: "Single Property Home",
    address: "455 7th St Oakland Ca",
    price: 5000,
    beds: 5,
    baths: 3,
    sqft: 3000,
    built: 2010,
    lot: 10000,
    description: "Big house",
    forRent: true,
    forSale: false
  };
  it('should create a new property', done => {
    request(app)
      .post('/properties')
      .set('x-auth', users[0].tokens[0].token)
      .send(property)
      .expect(200)
      .expect(res => {
        expect(res.body.title).toBe(property.title)
        expect(res.body.lat).toExist()
        expect(res.body.long).toExist()
        expect(res.body._id).toExist()
      })
      .end((err, res) => {
        if (err) return done(err);

        Property.find({ title: property.title })
          .then(res => {
            expect(res.length).toBe(1);
            expect(res[0].description).toBe(property.description);
            done();
          })
          .catch(e => done(e));
      });
  });

  it(' should not create a new property if user not logged in', done => {
    request(app)
      .post('/properties')
      .send(property)
      .expect(401)
      .expect(res => {
        expect(res.body.title).toNotExist();
      })
      .end((err, res) => {
        if (err) return done(err);

        Property.find({})
          .then(res => {
            expect(res.length).toBe(2);
            done();
          })
          .catch(e => done(e));
      });
  });

  it('should not create a new property if body incomplete', done => {
    property.title = null
    request(app)
      .post('/properties')
      .set('x-auth', users[0].tokens[0].token)
      .send(property)
      .expect(400)
      .expect(res => {
        expect(res.body.title).toNotExist();
      })
      .end((err, res) => {
        if (err) return done(err);

        Property.find({})
          .then(res => {
            expect(res.length).toBe(2);
            done();
          })
          .catch(e => done(e));
      });
  });
});

describe('GET /properties', () => {
  it('should get all properties', done => {
    request(app)
      .get('/properties')
      .expect(200)
      .expect(res => {
        expect(res.body.properties.length).toBe(2);
        expect(res.body.properties[0].title).toBe(properties[0].title);
        expect(res.body.properties[1].description).toBe(properties[1].description);
      })
      .end(done);
  });
});

describe('GET /myproperties', () => {
  it('should get all properties created by the user', done => {
    request(app)
      .get('/myproperties')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.properties.length).toBe(1);
        expect(res.body.properties[0].title).toBe(properties[0].title);
      })
      .end(done);
  });

  it('should not get properties created by someone else', done => {
    request(app)
      .get('/myproperties')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.properties[0].title).toNotBe(properties[1].title);
      })
      .end(done);
  });

  it('should not get own properties if not logged in', done => {
    request(app)
      .get('/myproperties')
      .expect(401)
      .expect(res => {
        expect(res.body.properties).toNotExist();
      })
      .end(done);
  });
});

// describe('GET /todos', () => {
//   it('should get all todos', done => {
//     request(app)
//       .get('/todos')
//       .set('x-auth', users[0].tokens[0].token)
//       .expect(200)
//       .expect(res => {
//         expect(res.body.todos.length).toBe(1)
//       })
//       .end(done);
//   });
// });

describe('GET /todos/:id', () => {

  it('should return a todo doc', done => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should not return a todo doc created by other user', done => {
    request(app)
      .get(`/todos/${todos[1]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return a 404 if todo not found', done => {
    const id = new ObjectID().toHexString();
    request(app)
      .get(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('it should return 404 for invalid object ids', done => {
    request(app)
      .get('/todos/123abc')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

});

describe('DELETE /todos/:id', () => {

  it('should remove a todo', done => {
    const hexId = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toBe(hexId);
      })
      .end((err, res) => {
        if (err) return done(err);
        //atempt to find the deleted item by id
        Todo.findById(hexId)
          .then(todo => {
            expect(todo).toNotExist();
            done();
          })
          .catch(e => done(e));
      });
  });

  it('should not remove a todo created by another user', done => {
    const hexId = todos[0]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end((err, res) => {
        if (err) return done(err);
        //atempt to find the deleted item by id
        Todo.findById(hexId)
          .then(todo => {
            expect(todo).toExist();
            done();
          })
          .catch(e => done(e));
      });
  });

  it('should return 404 if todo not found', done => {
    const hexId = new ObjectID().toHexString();
    request(app)
      .delete(`/todos/${hexId} + 1`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done)
  });

  it('should return 404 if object id is invalid', done => {
    request(app)
      .delete('/todos/123abc')
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

});

describe('PATCH /todos/:id', () => {

  it('should update the todo', done => {
    // grab id of first item
    const hexId = todos[0]._id.toHexString();
    const text = 'Hello New Text';
    // update text and set completed equal true
    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[0].tokens[0].token)
      .send({ completed: true, text })
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(true);
        expect(res.body.todo.completedAt).toBeA('number');
      })
      .end(done)
  })

  it('should not update the todo created by another user', done => {
    // grab id of first item
    const hexId = todos[0]._id.toHexString();
    const text = 'Hello New Text';
    
    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .send({ completed: true, text })
      .expect(404)
      .end(done)
  })

  it('should clear completedAt when todo is not completed', done => {
    const hexId = todos[1]._id.toHexString();
    const obj = { text:'Goodby New Text', completed: false };
    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .send(obj)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(obj.text);
        expect(res.body.todo.completed).toBe(obj.completed);
        expect(res.body.todo.completedAt).toNotExist();
      })
      .end(done)
  })

});

describe('GET /users/me', () => {

  it('should return user if authenticated', done => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });

  it('should return a 401 if not authenticated', done => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });

});

describe('POST /users', () => {
  it('should create a user', done => {
    const email = 'example@example.com';
    const password = '123abc!'
    request(app)
      .post('/users')
      .send({ email, password })
      .expect(200)
      .expect(res => {
        expect(res.headers['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end(err => {
        if (err) return done(err);

        User.findOne({ email })
          .then(user => {
            expect(user).toExist();
            expect(user.password).toNotBe(password);
            done();
          })
          .catch(err => done(err));
      });
  });

  it('should return validation errors if request was invalid', done => {
    request(app)
      .post('/users')
      .send({ email: 'te@te.com', password: '123' })
      .expect(400)
      .expect(res => {
        expect(res.body._id).toNotExist();
      })
      .end(done);
  });

  it('should not create a user if email is in use', done => {
    request(app)
      .post('/users')
      .send({ email: users[0].email, password: '123456' })
      .expect(400)
      .expect(res => {
        expect(res.body.email).toNotExist();
      })
      .end(done)
  });
});

describe('POST /users/login', () => {

  it('should login user and return auth token', done => {
    request(app)
      .post('/users/login')
      .send({ email: users[1].email, password: users[1].password })
      .expect(200)
      .expect(res => {
        expect(res.headers['x-auth']).toExist();
      })
      .end((err, res) => {
        if (err) return done(err);

        User.findById(users[1]._id)
          .then(user => {
            expect(user.tokens[1]).toInclude({ access: 'auth', token: res.headers['x-auth']});
            done();
          })
          .catch(e => done(e));
      })
  });

  it('should reject invalid login', done => {
    request(app)
      .post('/users/login')
      .send({ email: users[1].email, password: users[1].password + '1' })
      .expect(400)
      .expect(res => {
        expect(res.headers['x-auth']).toNotExist();
      })
      .end((err ,res) => {
        if (err) return done(err);

        User.findById(users[1]._id)
          .then(user => {
            expect(user.tokens.length).toBe(1);
            done();
          })
          .catch(e => done(e));
      });
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on log out', done => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        User.findById(users[0]._id)
          .then(user => {
            expect(user.tokens.length).toBe(0);
            done();
          })
          .catch(e => done(e));
      });
  });
});
