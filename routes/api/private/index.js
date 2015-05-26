var express = require('express');
var router = express.Router();
var RouteHandler = require('../../../routeHandler'),
    handler = new RouteHandler(router);
var userController = require('./user');

handler.routeOnFunctionName(new userController());

module.exports = router;
