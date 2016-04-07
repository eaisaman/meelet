"use strict";

var _ = require('underscore');
_.string = require('underscore.string');
_.mixin(_.string.exports());

var RouteHandler = function (router) {
    this.router = router;
};

RouteHandler.prototype.functionMap = {};


RouteHandler.prototype.routeOnFunctionName = function (holder) {
    function formalParameterList(fn) {
        var FN_ARGS = /^\w+\s*[^\(]*\(\s*([^\)]*)\)/m;
        var FN_ARG_SPLIT = /,/;
        var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

        var fnText, argDecl;
        var args = [];
        fnText = fn.toString().replace(STRIP_COMMENTS, '');
        argDecl = fnText.match(FN_ARGS);

        var r = argDecl[1].split(FN_ARG_SPLIT);
        for (let arg of r) {
            arg.replace(FN_ARG, function (all, underscore, name) {
                args.push(name);
            });
        }
        return args;
    }

    for (let key of _.without(Object.getOwnPropertyNames(holder.__proto__), "constructor")) {
        var member = holder[key];

        if ("function" === typeof member) {
            var parameterList = formalParameterList(member),
                _key = _(key),
                method = "";

            if (parameterList.length < 2 || parameterList[parameterList.length - 2] != "success" || parameterList[parameterList.length - 1] != "fail") {
                continue;
            }
            parameterList.splice(parameterList.length - 2, 2);

            if (_key.startsWith("get")) {
                method = "get";
            } else if (_key.startsWith("post")) {
                method = "post";
            } else if (_key.startsWith("put")) {
                method = "put";
            } else if (_key.startsWith("delete")) {
                method = "delete";
            }
            key = key.replace(new RegExp(method + "(.+)"), "$1");
            key = key.charAt(0).toLowerCase() + key.substr(1);

            RouteHandler.prototype.functionMap[method] = RouteHandler.prototype.functionMap[method] || {};
            RouteHandler.prototype.functionMap[method]['/' + key] = {
                holder: holder,
                fn: member,
                parameterList: parameterList
            };

            if (method) {
                this.router[method]('/' + key, function (req, res) {
                    var fnItem = RouteHandler.prototype.functionMap[req.method.toLowerCase()][req._parsedUrl.pathname];

                    if (fnItem) {
                        var args = [];

                        fnItem.parameterList.forEach(function (p) {
                            if (p == "requestHeader") {
                                args.push(req.headers);
                            } else if (p == "request") {
                                args.push(req);
                            } else {
                                args.push(req.body[p] || req.query[p]);
                            }
                        });

                        //TODO count service invoke times and duration, monitor whether there is any ongoing call
                        //so that the administrator knows the time to apply update
                        fnItem.fn.apply(fnItem.holder, args.concat(function (result) {
                            if ('function' == typeof result) {
                                result(req, res);
                            } else {
                                var ret = {result: "OK", resultValue: result, reason: ""};
                                switch (req.method.toLowerCase()) {
                                    case "get":
                                        res.json(ret);
                                        break;
                                    case "post":
                                        res.send(ret);
                                    case "put":
                                        res.send(ret);
                                    case "delete":
                                        res.send(ret);
                                        break;
                                }
                            }
                        }, function (error, header) {
                            var ret = {result: "ERROR", resultValue: "", reason: error.toString()};

                            if (header && header.statusCode) {
                                res.writeHead(header.statusCode, JSON.stringify(error.toString()), header.headers);
                                res.end();
                            } else {
                                if (header) {
                                    for (var name in header) {
                                        res.setHeader(name, header[name]);
                                    }
                                }

                                switch (req.method.toLowerCase()) {
                                    case "get":
                                        res.json(ret);
                                        break;
                                    case "post":
                                        res.send(ret);
                                    case "put":
                                        res.send(ret);
                                    case "delete":
                                        res.send(ret);
                                        break;
                                }
                            }
                        }));
                    }
                });
            }
        }
    }
}

module.exports = RouteHandler;
