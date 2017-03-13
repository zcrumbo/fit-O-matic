'use strict';

const Router = require('express').Router;
const jsonParser = require('body-parser').json();
const debug = require('debug')('fit-O-matic:auth-route');

const User = require('../model/user.js');

const basicAuth = require('../lib/basic-auth-middleware.js');

const authRouter = module.exports = Router();

authRouter.post('/api/signup', jsonParser, function(req, res, next){
  debug('POST /api/signup');
  let password = req.body.password;
  delete req.body.password;

  let user = new User(req.body);

  user.generatePasswordHash(password)
  .then( user => user.save())
  .then( user => user.generateToken())
  .then( token => res.send(token))
  .catch(next);
});

authRouter.get('/api/signin', basicAuth, function(req, res, next){
  debug('GET: /api/signin');

  User.findOne({username: req.auth.username})
  .then( user => user.comparePasswordHash(req.auth.password))
  .then( user => user.generateToken())
  .then( token => res.send(token))
  .catch(next);
});

authRouter.put('/api/newPassword', basicAuth, jsonParser, function(req, res, next){
  debug('PUT: /api/newPassword');
  req.body.password;
  delete req.body.password;

  User.findOne({username: req.auth.username})
  .then( user => user.comparePasswordHash(req.auth.password))
  .then( user => User.findByIdAndUpdate(user._id, user, {$new: true} ))
  .then( user => {
    if(!user){
      return next(createError(404, 'user not found'))
    }
    res.send('password updated');
  })
  .catch(next);
});