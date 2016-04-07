"use strict";

var express = require('express');
var router = express.Router();
var RouteHandler = require('../../../routeHandler.es6'),
    handler = new RouteHandler(router);
var fileController = require('../common/file'),
    userController = require('./user.es6'),
    userFileController = require('./userfile.es6');

handler.routeOnFunctionName(new userController({fileController: new fileController()}));
handler.routeOnFunctionName(new userFileController({fileController: new fileController()}));

module.exports = router;
