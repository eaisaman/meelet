var express = require('express');
var router = express.Router();
var RouteHandler = require('../../../routeHandler'),
    handler = new RouteHandler(router);
var fileController = require('../common/file'),
    userController = require('./user'),
    userFileController = require('./userfile');

handler.routeOnFunctionName(new userController({fileController: new fileController()}));
handler.routeOnFunctionName(new userFileController({fileController: new fileController()}));

module.exports = router;
