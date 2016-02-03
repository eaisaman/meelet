var express = require('express');
var router = express.Router();
var RouteHandler = require('../../../routeHandler'),
    handler = new RouteHandler(router);
var fileController = require('../common/file'),
    userController = require('./user'),
    chatController = require('./chat');

handler.routeOnFunctionName(new userController({
    chatController: new chatController(),
    fileController: new fileController()
}));
handler.routeOnFunctionName(new chatController());

module.exports = router;
