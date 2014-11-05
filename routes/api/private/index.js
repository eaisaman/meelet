var express = require('express');
var router = express.Router();
var RouteHandler = require('../../../routeHandler'),
    handler = new RouteHandler(router);

module.exports = router;
