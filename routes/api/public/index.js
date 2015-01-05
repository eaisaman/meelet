var express = require('express');
var router = express.Router();
var RouteHandler = require('../../../routeHandler'),
    handler = new RouteHandler(router);
var fileController = require('./file'),
    userFileController = require('./userfile'),
    userController = require('./user');

handler.routeOnFunctionName(new fileController());
handler.routeOnFunctionName(new userFileController({fileController: new fileController()}));
handler.routeOnFunctionName(new userController());

module.exports = router;
