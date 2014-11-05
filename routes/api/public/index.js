var express = require('express');
var router = express.Router();
var RouteHandler = require('../../../routeHandler'),
    handler = new RouteHandler(router);
var fileController = require('./file');

handler.routeOnFunctionName(new fileController());

module.exports = router;
