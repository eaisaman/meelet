var async = require('async');
var _ = require('underscore');
_.string = require('underscore.string');
var express = require('express');
var url = require('url');
var path = require('path');
var crypto = require('crypto');
var multiparty = require('multiparty');
var mongo = require('mongodb');
var session = require('express-session');
var passport = require('passport');
var httpStrategies = require('passport-http');

var Commons = function () {
}, c = new Commons();

Commons.prototype.batchLimit = function (arr, batchSize, concurrentLimit, iterator, final) {
    async.eachLimit(
        _.toArray(_.groupBy(arr, function (value, index) {
            return Math.floor(index / batchSize);
        })),
        concurrentLimit,
        function (items, callback) {
            iterator(items, callback);
        },
        final
    );
}

Commons.prototype.multipart = function () {
    function checkMultipart(req) {
        var contentType = req.headers['content-type'] || '',
            contentLength = req.headers['content-length'] || '';

        return contentType.match(/^\W*multipart\/form-data;.*boundary=.+/i) &&
            parseInt(contentLength);
    }

    return function multipartParser(req, res, next) {
        if (req._multipart) return next();
        req.body = req.body || {};

        if (!checkMultipart(req)) return next();

        // flag as parsed
        req._multipart = true;

        try {
            var form = new multiparty.Form();

            form.parse(req, function (err, fields, files) {
                if (err) {
                    return next(err);
                } else {
                    req.body = _.extend(req.body, fields);
                    for (var name in files) {
                        var file = files[name],
                            rangeStr = file[0].headers && file[0].headers['range'] || "",
                            arr = rangeStr.match(/\d+-\d+\/\d+/g);

                        if (arr) {
                            arr = arr[0].split(/[-|\/]/);
                            if (arr.length == 3) {
                                file[0].range = {start: parseInt(arr[0]), end: parseInt(arr[1]), total: parseInt(arr[2])};
                            }
                        }
                    }
                    req.files = files;
                    next();
                }
            });
        } catch (e) {
            return next(e);
        }
    }

}

Commons.prototype.static = function (options) {
    var folder = options.localFolder,
        _folder = _(folder);
    if (!_folder.startsWith(path.sep) && !_folder.include(":")) {
        folder = path.join(__dirname, folder);
    }
    return express.static(folder);
}

Commons.prototype.filter = function (options) {
    var paths = options.paths || [];

    return function (req, res, next) {
        var originalUrl = url.parse(req.originalUrl),
            _url = _(originalUrl.pathname),
            matched = paths.length && !paths.every(function (p) {
                return !_url.startsWith(p);
        });

        if (matched) {
            next();
        } else {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        }
    }
}

Commons.prototype.instantiateMongooseDb = function (options, resourceName, callback) {
    var mongoose = require('mongoose'),
        db = mongoose.connect(options.url, {}, function (err) {
            var resource = null;

            if (!err) {
                resource = {name: resourceName, instance: db, schema: {}};

                if (options.dbSchema) {
                    var raw = require(options.dbSchema);
                    for (var collection in raw) {
                        resource.schema[collection] = mongoose.model(collection, new mongoose.Schema(raw[collection], {versionKey: ""}), collection);
                    }
                }
            }

            callback(err, resource);
        });
}

Commons.prototype.instantiateMongoDb = function (options, resourceName, callback) {
    var defaultOptions = {host: '127.0.0.1',
        port: 27017,
        auto_reconnect: false,
        ssl: false,
        w: 1
    };

    if (options.url) {
        var db_url = require('url').parse(options.url);

        if (db_url.port) {
            options.port = parseInt(db_url.port);
        }

        if (db_url.pathname != undefined) {
            var pathname = db_url.pathname.split('/');

            if (pathname.length >= 2 && pathname[1]) {
                options.db = pathname[1];
            }

            if (pathname.length >= 3 && pathname[2]) {
                options.collection = pathname[2];
            }
        }

        if (db_url.hostname != undefined) {
            options.host = db_url.hostname;
        }

        if (db_url.auth != undefined) {
            var auth = db_url.auth.split(':');

            if (auth.length >= 1) {
                options.username = auth[0];
            }

            if (auth.length >= 2) {
                options.password = auth[1];
            }
        }
    }

    var serverOptions = options.server || {};
    serverOptions.auto_reconnect = serverOptions.auto_reconnect || options.auto_reconnect || defaultOptions.auto_reconnect;
    serverOptions.ssl = serverOptions.ssl || options.ssl || defaultOptions.ssl;

    var db = new mongo.Db(options.db,
            new mongo.Server(options.host || defaultOptions.host,
                    options.port || defaultOptions.port,
                serverOptions),
            { w: options.w || defaultOptions.w }),
        resource = {name: resourceName, instance: db, schema: {}};

    db.open(function (err) {
        if (!err && options.username && options.password) {
            db.authenticate(options.username, options.password, function (err) {
                callback(err, resource);
            });
        } else {
            callback(err, resource);
        }
    });
}

/**
 * Initialize session's MongoStore with the given `options`.
 * Session collection must be initialized before:
 *
 * db.getCollection("sessions").ensureIndex({
 *     "expires": 1,
 *     "expireAfterSeconds": 0
 * },[
 * ]);
 *
 * @param {Object} options
 * @api public
 */
Commons.prototype.session = function (options) {
    if (options.store) {
        var self = this,
            config = require('./config');

        self.sessionOptions = options;

        config.on(config.ResourceReadyEvent, function (resource) {
            //instance is of type mongo db
            if (resource.name == options.store.resource && resource.instance) {
                var MongoStore = require('connect-mongo')(session);
                self.sessionOptions.store = new MongoStore({db: resource.instance});
                self.sessionOnDbStore = session(self.sessionOptions);
            }
        });

        return function (req, res, next) {
            self.sessionOnDbStore && self.sessionOnDbStore(req, res, next) || session(req, res, next);
        }
    } else {
        return session(options);
    }
}

Commons.prototype.encryptPassword = function (plain, salt) {
    var config = require('./config');

    salt = salt || config.settings.salt;
    return crypto.createHmac('sha1', salt).update(plain).digest('hex');
}

Commons.prototype.authenticate = function (options) {
    var commonsSelf = this;

    function checkPassword(plain, enc, salt) {
        var enc2 = crypto.createHmac('sha1', salt).update(plain).digest('hex');
        return enc2 == enc;
    }

    (function () {
        var self = this,
            config = require('./config');

        config.on(config.ResourceReadyEvent, function (resource) {
            //instance is of type mongo db
            if (resource.name == options.resource && resource.instance && resource.schema) {
                self.db = resource.instance;

                self.db.collection(options.collectionName, function (err, collection) {
                    if (err) {
                        if (config.logger) {
                            config.logger.error(err);
                        } else {
                            throw err;
                        }
                    } else {
                        self.collection = collection;

                        passport.use(new httpStrategies.BasicStrategy(function (username, password, done) {
                            self.collection.findOne({loginName: username}, function (err, data) {
                                return done(err, !err && data && checkPassword(password, data.password, data.salt || options.salt || config.settings.salt) && data);
                            });
                        }));

                        passport.use(new httpStrategies.DigestStrategy(function (username, password, done) {
                            self.collection.findOne({loginName: username}, function (err, data) {
                                return done(err, !err && data != null && checkPassword(password, data.password, data.salt || options.salt || config.settings.salt) && data);
                            });
                        }));

                        passport.serializeUser(function (user, done) {
                            done(null, user._id);
                        });

                        passport.deserializeUser(function (id, done) {
                            done(err, id);
                        });
                    }
                });
            }
        });
    })();

    return function (req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            passport.authenticate(['basic', 'digest'])(req, res, function (err) {
                if (!err) {
                    //res.cookie("XXX", encodeURIComponent(JSON.stringify(obj)), commonsSelf.sessionOptions.cookie || {});
                }
                next(err);
            });
        }
    };
}

module.exports = c;
