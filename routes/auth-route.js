'use strict';

const Router = require('express').Router;
const createError = require('http-errors');
const jsonParser = require('body-parser').json();
const debug = require('debug')('fit-O-matic:auth-route');

const User = require('../model/user.js');

const basicAuth = require('../lib/basic-auth-middleware.js');

const authRouter = module.exports = Router();

authRouter.post('/api/signup', jsonParser, function(req, res, next){
  debug('POST /api/signup');
  if (!req.body.username) return next(createError(400, 'need username'));
  if (!req.body.admin) return next(createError(400, 'need admin'));
  if (!req.body.email) return next(createError(400, 'need an email'));
  if (!req.body.password) return next(createError(400, 'need a password'));

  let password = req.body.password;
  delete req.body.password;
  let user = new User(req.body);

  user.generatePasswordHash(password)
  .then( user => user.save())
  .then( user => {
    return user.generateToken();
  })
  .then( token => res.send(token))
  .catch(next);
});


//  want to test for wrong username but am getting pushed to error middleware not sure what to do next
//  think I need to handle it in the catch block and put next at the end... maybe...????
authRouter.get('/api/signin', basicAuth, function(req, res, next){
  debug('GET: /api/signin');
  debug('user--------------------', req.auth.username);
  User.findOne({username: req.auth.username})
  .then( user => {
    if (!user) {
      return next(createError(400, 'user not found'));
    }
    return user.comparePasswordHash(req.auth.password)
  })
  .then( user => {
    if (!user) {
      return next(createError(400, 'user not found'));
    }
    return user.generateToken()
  })
  .then( token => {
    if (!token) {
      return next(createError(400, 'token not found'));
    }
    return res.send(token)
  })
  .catch(next);
});

authRouter.put('/api/newUserName', basicAuth, jsonParser, function(req, res, next){
  debug('PUT: /api/newUserName');
  let password = req.auth.password;
  delete req.auth.password;
  debug('the body', req.body);
  User.findOne({username: req.auth.username})
  .then( user => user.comparePasswordHash(password))
  .then( user => User.findByIdAndUpdate(user._id, req.body, {new: true} ))
  .then( user => {
    if(!user){
      return next(createError(404, 'user not found'))
    }
    debug('inside put', user);
    res.json(user);
  })
  .catch(next);
});
