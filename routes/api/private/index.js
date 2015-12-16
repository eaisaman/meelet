var express = require('express');
var router = express.Router();
var RouteHandler = require('../../../routeHandler'),
    handler = new RouteHandler(router);
var userController = require('./user');
var chatController = require('./chat');

handler.routeOnFunctionName(new userController({chatController: new chatController()}));
handler.routeOnFunctionName(new chatController());

module.exports = router;
