var async = require('async');
var _ = require('underscore');
_.string = require('underscore.string');
var express = require('express');
var url = require('url');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var rimraf = require('rimraf');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var multiparty = require('multiparty');
var mongo = require('mongodb');
var session = require('express-session');
var passport = require('passport');
var httpStrategies = require('passport-http');
var ejs = require("ejs");
var jsdom = require('jsdom');
var ncp = require('ncp').ncp;
var classes = require('./meeletClasses');
var chatCommons = require('./chatCommons');
var mkdirp = require("mkdirp");
var co = require("co");

var Commons = function () {
    var self = this;

    self.config = require('./config');
    self.__ = self.config.i18n.__;
}, c = new Commons();

/**
 * @description
 *
 * @param src
 * @param dest
 */
Commons.prototype.mixin = function (src, dest) {
    src.constructor.prototype.__proto__ = dest;
}

/**
 * @description
 *
 * @param dirpath
 * @returns {*}
 */
Commons.prototype.mkdirsSync = function (dirpath) {
    try {
        dirpath.split(path.sep).reduce(function (parts, part) {
            parts += part + '/';
            var subpath = path.resolve(parts);
            if (!fs.existsSync(subpath)) {
                fs.mkdirSync(subpath, 0o777);
            }
            return parts;
        }, '');
    } catch (err) {
        return err;
    }
};

/**
 * @description
 *
 * @param cmd
 * @param args
 * @param opts
 * @param done
 */
Commons.prototype.spawn = function (cmd, args, opts, done) {

    var child = spawn(cmd, args || [], opts);

    var stdout = new Buffer('');
    var stderr = new Buffer('');
    if (child.stdout) {
        child.stdout.on('data', function (buf) {
            stdout = Buffer.concat([stdout, new Buffer(buf)]);
        });
    }
    if (child.stderr) {
        child.stderr.on('data', function (buf) {
            stderr = Buffer.concat([stderr, new Buffer(buf)]);
        });
    }
    child.on('close', function (code) {

        var result = {
            stdout: stdout.toString(),
            stderr: stderr.toString()
        };

        if (code === 0) {
            done(null, result, code);
        }
        else {
            done(new Error(stderr), result, code);
        }
    });

    return child;
};

Commons.prototype.getFormString = function (value) {
    if (typeof value === 'string') {
        return value;
    } else if (typeof value === 'string') {
        return value;
    } else if (toString.call(value) === '[object Array]') {
        return value[0] || "";
    }
    return arguments.length > 1 && arguments[1] || "";
}

Commons.prototype.getFormInt = function (value) {
    if (typeof value === 'number') {
        return value;
    } else if (typeof value === 'string') {
        return parseInt(value);
    } else if (toString.call(value) === '[object Array]') {
        return parseInt(value[0]);
    }
    return arguments.length > 1 && arguments[1] || NaN;
}

/**
 * Get scale type based on given size value. Scale types include tiny, small, medium, large scale size(16, 32, 48, 128),
 * Return medium as default.
 *
 * @param size
 */
Commons.prototype.getScale = function (size) {
    var scale = "medium";

    size = parseInt(size);
    if (size > 0) {
        if (size <= 16) scale = "tiny";
        else if (size <= 32) scale = "small";
        else if (size <= 48) scale = "medium";
        else scale = "large";
    }

    return scale;
}

/**
 * @description
 *
 * Convert date to timestamp for object array.
 *
 * @param objects
 */
Commons.prototype.arrayConvertDate = function (objects) {
    var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));

    objects && objects.forEach(function (obj) {
        for (var key in keys) {
            if (obj[key]) obj[key] = obj[key].getTime();
        }
    });

    return objects;
};

/**
 * @description
 *
 * Convert date to timestamp for object.
 *
 * @param objects
 */
Commons.prototype.convertDate = function (obj) {
    var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));

    for (var key in keys) {
        if (obj[key]) obj[key] = obj[key].getTime();
    }

    return obj;
};

/**
 * @description
 *
 * @param objects
 */
Commons.prototype.arrayOmit = function (objects) {
    var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1)),
        arr = [];

    objects && objects.forEach(function (obj) {
        obj && arr.push(_.omit(obj, keys));
    });

    return arr;
};

/**
 * @description
 *
 * @param objects
 */
Commons.prototype.arrayPick = function (objects) {
    var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1)),
        arr = [];

    objects && objects.forEach(function (obj) {
        obj && arr.push(_.pick(obj, keys));
    });

    return arr;
};

/**
 * @description
 *
 * @param objects
 */
Commons.prototype.arrayPurge = function (objects) {
    var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));

    objects && objects.forEach(function (obj) {
        for (var key in keys) delete obj[key];
    });

    return objects;
};

/**
 * @description
 *
 * @param objects
 */
Commons.prototype.arrayExtend = function (objects) {
    var arr = [],
        values = Array.prototype.slice.call(arguments, 1);

    objects && objects.forEach(function (obj) {
        _.each(values, function (source) {
            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        });

        arr.push(obj);
    });

    return arr;
};

/**
 * @description
 *
 * @param dirpath
 * @param base
 * @param callback
 * @param options
 */
Commons.prototype.walkdir = function (dirpath, base, callback, options) {
    var self = this,
        results = [];

    if (typeof base === 'function') {
        options = callback;
        callback = base;
        base = dirpath;
    }
    options = options || {};

    fs.readdir(dirpath, function (err, list) {
        var i = 0;
        var file;
        var filepath;

        if (err) {
            return callback(err);
        }

        (function next() {
            file = list[i++];

            if (!file) {
                return callback(null, results);
            }

            filepath = path.join(dirpath, file);
            var relative = path.relative(base, filepath);

            if (options.ignoreHidden && /^\./.test(file)) {
                process.nextTick(function () {
                    next();
                });
                return;
            }

            if (options.ignorePaths && options.ignorePaths.length) {
                var matchedIndex;
                if (!options.ignorePaths.every(function (item, i) {
                        matchedIndex = i;
                        if (typeof item === "string") {
                            return item !== relative;
                        } else if (item instanceof RegExp) {
                            return !item.test(relative);
                        }

                        return true;
                    })) {
                    options.ignorePaths.splice(matchedIndex, 1);
                    process.nextTick(function () {
                        next();
                    });
                    return;
                }
            }

            fs.stat(filepath, function (err, stats) {
                results.push({
                    path: filepath,
                    relative: relative.replace(/\\/g, '/'),
                    stats: stats
                });

                if (stats && stats.isDirectory()) {
                    self.walkdir(filepath, base, function (err, res) {
                        results = results.concat(res);
                        next();
                    }, options);
                } else {
                    next();
                }
            });
        })();
    });
};

/**
 * @description
 *
 * @returns {Function}
 */
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
                                file[0].range = {
                                    start: parseInt(arr[0]),
                                    end: parseInt(arr[1]),
                                    total: parseInt(arr[2])
                                };
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

};

/**
 * @description
 *
 * @returns {Function}
 */
Commons.prototype.allowXDomain = function (options) {
    var host = options && options.host;

    if (host) {
        return function addXDomainHeaders(req, res, next) {
            if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
                res.setHeader("Access-Control-Allow-Origin", host);
                res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE");
                res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
                res.setHeader("Access-Control-Allow-Credentials", true);
            }

            next();
        }
    } else {
        return function (req, res, next) {
            next();
        }
    }
};

/**
 * @description
 *
 * @param options
 * @returns {*}
 */
Commons.prototype.static = function (options) {
    var folder = options.localFolder,
        _folder = _(folder);
    if (!_folder.startsWith(path.sep) && !_folder.include(":")) {
        folder = path.join(__dirname, folder);
    }
    return express.static(folder);
};

/**
 * @description
 *
 * @param options
 * @returns {Function}
 */
Commons.prototype.filter = function (options) {
    var paths = options && options.paths || [];

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
};

/**
 * @description
 *
 * @param options
 * @param resourceName
 * @param callback
 */
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

                        //tree[key] map to schema data type
                        var keys = [], tree = resource.schema[collection].schema.tree;
                        for (var key in tree) if (_.has(tree, key) && typeof tree[key] === 'string') keys.push(key);
                        if (keys.indexOf("_id") < 0) keys.push("_id");
                        resource.schema[collection].fields = keys;
                    }
                }
            }

            callback(err, resource);
        });
};

/**
 * @description
 *
 * @param options
 * @param resourceName
 * @param callback
 */
Commons.prototype.instantiateMongoDb = function (options, resourceName, callback) {
    var defaultOptions = {
        host: '127.0.0.1',
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
        {w: options.w || defaultOptions.w}),
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
};

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
        var self = this;

        self.sessionOptions = options;

        self.config.on(self.config.ResourceReadyEvent, function (resource) {
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
};

/**
 * @description
 *
 * @param plain
 * @param salt
 * @returns {*}
 */
Commons.prototype.encryptPassword = function (plain, salt) {
    var self = this;

    salt = salt || self.config.settings.salt;
    return crypto.createHmac('sha1', salt).update(plain).digest('hex');
};

/**
 * @description
 *
 * Generate account authentication handler.
 *
 * @param options
 * @returns {Function}
 */
Commons.prototype.authenticate = function (options) {
    var self = this;

    function checkPassword(plain, enc, salt) {
        var enc2 = crypto.createHmac('sha1', salt).update(plain).digest('hex');
        return enc2 === enc;
    }

    (function () {
        var initPassport = this;

        self.config.on(self.config.ResourceReadyEvent, function (resource) {
            //instance is of type mongo db
            if (resource.name == options.resource && resource.instance && resource.schema) {
                initPassport.db = resource.instance;

                initPassport.db.collection(options.collectionName, function (err, collection) {
                    if (err) {
                        if (self.config.logger) {
                            self.config.logger.error(err);
                        } else {
                            throw err;
                        }
                    } else {
                        initPassport.collection = collection;

                        passport.use(new httpStrategies.BasicStrategy(function (username, password, done) {
                            initPassport.collection.findOne({loginName: username, forbidden: 0}, function (err, data) {
                                return done(err, !err && data && checkPassword(password, data.password, data.salt || options.salt || self.config.settings.salt) && data);
                            });
                        }));

                        passport.use(new httpStrategies.DigestStrategy(function (username, password, done) {
                            initPassport.collection.findOne({loginName: username, forbidden: 0}, function (err, data) {
                                return done(err, !err && data != null && checkPassword(password, data.password, data.salt || options.salt || self.config.settings.salt) && data);
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
                    //res.cookie("XXX", encodeURIComponent(JSON.stringify(obj)), self.sessionOptions.cookie || {});
                }
                next(err);
            });
        }
    };
};

/**
 * @description
 *
 * Add configurable widget to project. The widget's scss file, which is to be compiled to css, and
 * and its empty configuration scss file are generated. The configuration inherits from that of the artifact.
 * All these files' soft links are saved in project's staging folder.
 *
 * The structure of folder saving widget's scss stylesheet content is as follows:
 * stylesheets(compiled widget css)--repo--[widget folder]--[soft link to artifact sass folder]
 *
 * @param projectId
 * @param widgetId
 * @param libraryName
 * @param artifactId
 * @param type
 * @param version
 * @param callback
 */
Commons.prototype.addConfigurableArtifact = function (projectId, widgetId, libraryName, artifactId, type, version, callback) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
            stagingProjectPath = path.join(self.config.userFile.stagingFolder, projectId),
            cssPath = path.join(projectPath, "stylesheets"),
            sassPath = path.join(cssPath, "repo"),
            configPath = path.join(sassPath, artifactId),
            artifactSassPath = path.join(self.config.userFile.repoFolder, type, libraryName, artifactId, version, "stylesheets", "sass"),
            ejsPath = path.join(artifactSassPath, "configurable-widget.ejs"),
            widgetConfigurationPath = path.join(configPath, _.string.sprintf("_configuration-%s.scss", widgetId)),
            widgetScssPath = path.join(configPath, _.string.sprintf("configurable-widget-%s.scss", widgetId)),
            widgetCssPath = path.join(cssPath, _.string.sprintf("configurable-widget-%s.css", widgetId));

        co(function*() {
            let exists = yield new Promise(function (widgetCssPath, resolve, reject) {
                fs.exists(widgetCssPath, function (exist) {
                    resolve(exist);
                });
            }.bind(self, widgetCssPath));

            if (!exists) {
                yield new Promise(function (ejsPath, resolve, reject) {
                    fs.exists(ejsPath, function (exist) {
                        if (exist) {
                            resolve();
                        } else {
                            reject(new Error(self.__('File Not Exist', ejsPath)));
                        }
                    });
                }.bind(self, ejsPath));

                yield new Promise(function (configPath, resolve, reject) {
                    mkdirp(configPath, 0o755, function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }.bind(self, configPath));

                yield new Promise(function (artifactSassPath, configPath, resolve, reject) {
                    fs.symlink(artifactSassPath, path.join(configPath, "sass"), function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            resolve();
                        } else {
                            reject(fsError);
                        }
                    });
                }.bind(self, artifactSassPath, configPath));

                //save empty configuration file _configuration-<widget id>.scss
                yield new Promise(function (widgetConfigurationPath, widgetId, resolve, reject) {
                    fs.writeFile(
                        widgetConfigurationPath,
                        _.string.sprintf("$configuration-%s: ();", widgetId),
                        function (err) {
                            err && reject(err) || resolve();
                        });
                }.bind(self, widgetConfigurationPath, widgetId));

                //ejs render
                yield new Promise(function (type, libraryName, artifactId, version, widgetId, configPath, widgetScssPath, resolve, reject) {
                    try {
                        var ejsCompileCacheKey = path.join(self.config.userFile.repoFolder, type, libraryName, artifactId, version);

                        self.config.cache.wrap(ejsCompileCacheKey, function (cacheCb) {
                            try {
                                var templateStr = fs.readFileSync(path.join(configPath, "sass", "configurable-widget.ejs"), "utf8"),
                                    fn = ejs.compile(templateStr, {debug: false, client: true});
                                cacheCb(null, fn);
                            } catch (compileErr) {
                                cacheCb(compileErr);
                            }
                        }, function (err, fn) {
                            if (err) {
                                reject(err);
                            } else {
                                try {
                                    var scssContent = fn({configuration: null, widgetId: [widgetId]});
                                    fs.writeFile(
                                        widgetScssPath,
                                        scssContent,
                                        function (err) {
                                            err && reject(err) || resolve();
                                        }
                                    );
                                } catch (renderErr) {
                                    reject(renderErr);
                                }
                            }
                        });
                    } catch (err) {
                        reject(err);
                    }
                }.bind(self, type, libraryName, artifactId, version, widgetId, configPath, widgetScssPath));

                //FIXME Too many spawns may exhaust available system processes.
                //compass compile
                yield new Promise(function (configPath, widgetScssPath, cssPath, resolve, reject) {
                    var basePath = configPath,
                        specify = widgetScssPath;

                    self.spawn("compass",
                        ["compile", basePath, specify, "--css-dir", cssPath, "--sass-dir", configPath],
                        {},
                        function (err, result, code) {
                            err && reject(err) || resolve();
                        }
                    );
                }.bind(self, configPath, widgetScssPath, cssPath));

                //Save links of generated files to project staging folder
                yield Promise.all(
                    [widgetConfigurationPath, widgetScssPath, widgetCssPath].map(
                        function (pathItem) {
                            return new Promise(function (stagingProjectPath, resolve, reject) {
                                fs.symlink(pathItem, path.join(stagingProjectPath, path.basename(pathItem)), function (fsError) {
                                    if (!fsError || fsError.code === "EEXIST") {
                                        resolve();
                                    } else {
                                        reject(fsError);
                                    }
                                });

                            }.bind(self, stagingProjectPath));
                        }
                    )
                );
            }

            yield path.basename(widgetCssPath);
        }).then(function (result) {
            callback(null, result);
        }, function (err) {
            callback(err);
        });
    } else {
        callback(new Error("Empty project id"));
    }
};

/**
 * @description
 *
 * Remove configurable widget from project. Remove widget's scss stylesheet folder.
 * Remove widget's css, scss and configuration scss files' soft links from staging folder.
 *
 * @param projectId
 * @param widgetId
 * @param artifactId
 * @param callback
 */
Commons.prototype.removeConfigurableArtifact = function (projectId, widgetId, artifactId, callback) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
            cssPath = path.join(projectPath, "stylesheets"),
            sassPath = path.join(cssPath, "repo"),
            configPath = path.join(sassPath, artifactId),
            widgetConfigPath = path.join(configPath, _.string.sprintf("_configuration-%s.scss", widgetId)),
            widgetScssPath = path.join(configPath, _.string.sprintf("configurable-widget-%s.scss", widgetId)),
            widgetCssPath = path.join(cssPath, _.string.sprintf("configurable-widget-%s.css", widgetId));

        co(function*() {
            yield Promise.all(
                [widgetConfigPath, widgetScssPath, widgetCssPath].map(
                    function (pathItem) {
                        return new Promise(function (resolve, reject) {
                            fs.unlink(pathItem, function (err) {
                                if (err) {
                                    if (err.code !== "ENOENT") //Not Found
                                    {
                                        self.config.logger.error(err);
                                        reject(err);
                                    }
                                    else {
                                        self.config.logger.warn(err);
                                        resolve();
                                    }
                                } else {
                                    resolve();
                                }
                            });
                        });
                    }
                )
            );

            let files = yield new Promise(function (configPath, resolve, reject) {
                glob("*.scss", {cwd: configPath}, function (err, files) {
                    if (!err) {
                        resolve(files);
                    } else {
                        reject(err);
                    }
                });
            }.bind(self, configPath));

            if (!files || !files.length) {
                //Artifact is used not any more.
                yield new Promise(function (configPath, resolve, reject) {
                    rimraf(configPath, function (err) {
                        next(err);
                    });
                }.bind(self, configPath));
            }
        }).then(function () {
            callback();
        }, function (err) {
            callback(err);
        });
    }
};

/**
 *
 * @description
 *
 * Update widget's configuration to its configuration scss file and compile the result to css.
 *
 * @param projectId
 * @param widgetId
 * @param artifactId
 * @param configuration
 * @param callback
 */
Commons.prototype.updateConfigurableArtifact = function (projectId, widgetId, artifactId, configuration, callback) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
            cssPath = path.join(projectPath, "stylesheets"),
            sassPath = path.join(cssPath, "repo"),
            configPath = path.join(sassPath, artifactId),
            widgetConfigPath = path.join(configPath, _.string.sprintf("_configuration-%s.scss", widgetId)),
            widgetScssPath = path.join(configPath, _.string.sprintf("configurable-widget-%s.scss", widgetId)),
            widgetCssPath = path.join(cssPath, _.string.sprintf("configurable-widget-%s.css", widgetId));

        co(function*() {
            yield Promise.all(
                [widgetConfigPath, widgetScssPath].map(
                    function (pathItem) {
                        return new Promise(function (resolve, reject) {
                            fs.exists(pathItem, function (exist) {
                                if (exist) {
                                    resolve();
                                } else {
                                    reject(new Error(_.string.sprintf("Path %s not exist.", pathItem)));
                                }
                            });
                        });
                    }
                )
            );

            //save configuration file _configuration-<widget id>.scss
            var configArr = [];
            _.each(configuration, function (value, key) {
                configArr.push(key + ":" + value);
            });
            yield new Promise(function (configPath, widgetId, resolve, reject) {
                fs.writeFile(
                    path.join(configPath, _.string.sprintf("_configuration-%s.scss", widgetId)),
                    _.string.sprintf("$configuration-%s: (%s);", widgetId, configArr.join(",")),
                    function (err) {
                        err && reject(err) || resolve();
                    });
            }.bind(self, configPath, widgetId));

            //compass compile
            //FIXME Too many spawns may exhaust available system processes.
            yield new Promise(function (configPath, widgetScssPath, resolve, reject) {
                var basePath = configPath,
                    specify = widgetScssPath;

                self.spawn("compass",
                    ["compile", basePath, specify, "--css-dir", cssPath, "--sass-dir", configPath],
                    {},
                    function (err, result, code) {
                        err && reject(err) || resolve();
                    }
                );
            }.bind(self, configPath, widgetScssPath));
        }).then(function () {
            callback(null, path.basename(widgetCssPath));
        }, function (err) {
            callback(err);
        });
    }
};

/**
 * @description
 *
 * Generate html content for project of different types, 'book', 'flow', or 'sketch'. The skeleton files
 * are saved in 'public/skeleton' folder.
 *
 * @param projectType
 * @param projectPath
 * @param artifactList
 * @param callback
 */
Commons.prototype.convertToHtml = function (projectType, projectPath, artifactList, callback) {
    var self = this,
        skeletonModuleFolder = "javascripts",
        skeletonHtml = "meelet.skeleton.html",
        mobileSkeletonHtml = "mobile.skeleton.html",
        mobileSkeletonJs = ["mobile-main.js", "app/mobile-main.js", "common/mobile-main.js"],
        skeletonPath = path.join(self.config.userFile.skeletonFolder, projectType),
        skeletonModulePath = path.join(skeletonPath, skeletonModuleFolder),
        projectModulePath = self.config.userFile.projectModuleFolder,
        skeletonHtmlPath = path.join(skeletonPath, skeletonHtml),
        mobileSkeletonHtmlPath = path.join(skeletonPath, mobileSkeletonHtml),
        meeletPath = path.join(projectPath, self.config.settings.meeletFile);

    var nonExistentPath = (!fs.existsSync(projectPath) && projectPath)
        || (!fs.existsSync(skeletonPath) && skeletonPath)
        || (!fs.existsSync(skeletonHtmlPath) && skeletonHtmlPath)
        || (!fs.existsSync(mobileSkeletonHtmlPath) && mobileSkeletonHtmlPath)
        || (!fs.existsSync(meeletPath) && meeletPath)
        || (!fs.existsSync(skeletonModulePath) && skeletonModulePath);

    if (nonExistentPath) {
        callback(_.string.sprintf("Path %s not found", nonExistentPath));
    } else {
        co(function*() {
            //Building jdom for skeleton html
            let window = yield new Promise(function (skeletonPath, skeletonModuleFolder, skeletonHtmlPath, resolve, reject) {
                var skeletonDomCacheKey = skeletonHtmlPath,
                    amdModules = [],
                    skeletonLibLoadTimeout = self.config.settings.skeletonLibLoadTimeout;

                    self.config.cache.wrap(skeletonDomCacheKey, function (cacheCb) {
                    jsdom.env(
                        {
                            file: skeletonHtmlPath,
                            resourceLoader: function (resource, callback) {
                                var pathname = resource.url.pathname;

                                if (/\/main|cordova\.js$/.test(pathname)) {
                                    amdModules.push(pathname);
                                }
                                self.config.logger.debug(pathname);

                                resource.defaultFetch(callback);
                            },
                            features: {
                                FetchExternalResources: ["script", "css"],
                                ProcessExternalResources: ["script"],
                                SkipExternalResources: false
                            },
                            loaded: function (errors, window) {
                                if (!errors || !errors.length) {
                                    window.requirejs.config({
                                        baseUrl: skeletonPath,
                                        waitSeconds: skeletonLibLoadTimeout
                                    });
                                }
                            },
                            created: function (errors, window) {
                                if (!errors || !errors.length) {
                                    window.amdModules = amdModules;
                                    window.modouleLogger = self.config.logger;
                                    window.codeGenModulePath = skeletonModuleFolder;
                                    window.onModulesLoaded = function () {
                                        cacheCb(null, window);
                                    };
                                }
                            },
                            done: function (errors) {
                                if (errors && errors.length) {
                                    cacheCb(errors[0]);
                                }
                            }
                        }
                    );
                }, function (err, window) {
                    err && reject(err) || resolve(window);
                });
            }.bind(self, skeletonPath, skeletonModuleFolder, skeletonHtmlPath));

            //Copy require.js to project path if not exist
            let targetRequirePath = yield new Promise(function (resolve, reject) {
                var target = path.join(projectPath, "javascripts", "require");
                mkdirp(target, 0o755, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(target);
                    }
                });
            }.bind(self, projectPath));

            yield new Promise(function (skeletonPath, resolve, reject) {
                ncp(path.join(skeletonPath, "javascripts", "require"), targetRequirePath, {
                    clobber: false,
                    stopOnErr: true,
                    dereference: true
                }, function (err) {
                    err && reject(err) || resolve();
                });
            }.bind(self, skeletonPath));

            //Copy referenced javascript libraries
            if (window.amdModules && window.amdModules.length) {
                yield Promise.all(
                    window.amdModules.map(function (pathname) {
                        return co.wrap(function*(projectPath, projectModulePath, skeletonPath, skeletonModulePath, pathname) {
                            var relative = _.string.trim(path.relative(skeletonPath, path.dirname(pathname)));

                            if (relative) {
                                var moduleRelative = _.string.trim(path.relative(skeletonModulePath, path.dirname(pathname)));

                                //if folder is not in module path, for example app/main.js, directive/main.js
                                if (/^\.\.\//g.test(moduleRelative)) {
                                    yield new Promise(function (resolve, reject) {
                                        var target = path.join(projectPath, relative);

                                        ncp(path.dirname(pathname), target, {
                                            clobber: false,
                                            stopOnErr: true,
                                            dereference: true
                                        }, function (err) {
                                            err && reject(err) || resolve();
                                        });
                                    })
                                } else {
                                    let target = path.join(projectModulePath, moduleRelative);

                                    if (!fs.existsSync(target)) {
                                        yield new Promise(function (resolve, reject) {
                                            mkdirp(target, 0o755, function (err) {
                                                if (err) {
                                                    reject(err);
                                                } else {
                                                    resolve();
                                                }
                                            });
                                        });

                                        yield new Promise(function (resolve, reject) {
                                            ncp(path.dirname(pathname), target, {
                                                clobber: false,
                                                stopOnErr: true,
                                                dereference: true
                                            }, function (err) {
                                                err && reject(err) || resolve();
                                            });
                                        });
                                    }
                                }
                            } else {

                            }
                        })(projectPath, projectModulePath, skeletonPath, skeletonModulePath, pathname);
                    })
                );
            }

            //Parse page JSON object
            let pages = yield new Promise(function (meeletPath, resolve, reject) {
                fs.readFile(meeletPath, "utf8", function (err, str) {
                    if (err) reject(err);

                    try {
                        var obj = JSON.parse(str),
                            pages = [];

                        obj.pages.forEach(function (pageObj) {
                            pages.push(classes.fromObject(pageObj));
                        });

                        resolve(pages);
                    } catch (err2) {
                        reject(err2);
                    }
                });
            }.bind(self, meeletPath));
            let meta = {
                artifacts: [],
                locations: [],
                thumbnails: [],
                pageTransition: obj.pageTransition || {}
            };

            //Compare mtime of meelet json file and page html file, if it's new regenerate html files.
            if (pages && pages.length) {
                var pObj = {
                    meeletTime: new Promise(function (meeletPath, resolve, reject) {
                        fs.stat(meeletPath, function (err, stat) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(stat.mtime.getTime());
                            }
                        });
                    }.bind(self, meeletPath))
                };
                pages.forEach(function (page) {
                    var pageHtml = path.join(projectPath, _.string.sprintf("page-%s.html", page.id));
                    pObj[page.id] = new Promise(function (resolve, reject) {
                        fs.stat(pageHtml, function (err, stat) {
                            if (err) {
                                if (err.code !== "ENOENT") //Not Found
                                    reject(err);
                                else
                                    resolve(0);
                            } else {
                                resolve(stat.mtime.getTime());
                            }
                        });
                    });
                });

                let results = yield pObj;
                var meeletTime = results.meeletTime,
                    mtimes = _.values(_.omit(results, "meeletTime"));

                //Generate html files
                if (!mtimes.every(function (mtime) {
                        return mtime > meeletTime;
                    })) {

                    //Copy mobile skeleton html file to project path if not exists;
                    yield new Promise(function (skeletonHtmlPath, projectPath, resolve, reject) {
                        ncp(skeletonHtmlPath, path.join(projectPath, "index.html"), {
                            clobber: true,
                            stopOnErr: true
                        }, function (err) {
                            err && reject(err) || resovle();
                        });
                    }.bind(self, skeletonHtmlPath, projectPath));

                    //Copy mobile skeleton html file to project path if not exists;
                    yield new Promise(function (mobileSkeletonHtmlPath, projectPath, resolve, reject) {
                        ncp(mobileSkeletonHtmlPath, path.join(projectPath, "mobile-index.html"), {
                            clobber: true,
                            stopOnErr: true
                        }, function (err) {
                            err && reject(err) || resolve();
                        });
                    }.bind(self, mobileSkeletonHtmlPath, projectPath));

                    //Copy mobile skeleton js file to project path;
                    yield Promise.all([
                        mobileSkeletonJs.map(function (mobileJs) {
                            return new Promise(function (projectPath, skeletonPath, resolve, reject) {
                                var jsPath = path.join(skeletonPath, mobileJs);

                                if (fs.existsSync(jsPath)) {
                                    var relativeJsFolderPath = mobileJs.replace(/\/?[^\/]+$/, "");

                                    ncp(jsPath, path.join(projectPath, relativeJsFolderPath, path.basename(mobileJs)), {
                                        clobber: true,
                                        stopOnErr: true
                                    }, function (err) {
                                        err && reject(err) || resolve();
                                    });
                                } else {
                                    resolve();
                                }
                            }.bind(self, projectPath, skeletonPath));
                        })
                    ]);

                    //Regenerate scrap html for each page json object
                    yield Promise.all(pages.map(
                        function (page) {
                            return new Promise(function (projectPath, skeletonPath, resolve, reject) {
                                jsdom.env(
                                    {
                                        html: "<div class='deviceHolder'/>",
                                        scripts: [path.join(skeletonPath, "jquery/2.1.1/jquery.min.js")],
                                        done: function (errors, window) {
                                            if (!errors || !errors.length) {
                                                var pageHtml = path.join(projectPath, _.string.sprintf("page-%s.html", page.id)),
                                                    $document = window.$(window.document.documentElement),
                                                    $container = window.$(".deviceHolder");

                                                page.appendTo(window.$, $document, $container);

                                                try {
                                                    var out = fs.createWriteStream(pageHtml);

                                                    out.on('finish', function () {
                                                        window.close();
                                                        resolve();
                                                    });

                                                    out.on('error', function (err) {
                                                        reject(err);
                                                    });

                                                    $document.find("link[type='text/css']").each(function () {
                                                        $container.children(":first-child").prepend(window.$(this).prop('outerHTML'));
                                                    });
                                                    $document.find("script[type='text/ng-template']").each(function () {
                                                        $container.children(":first-child").prepend(window.$(this).prop('outerHTML'));
                                                    });
                                                    out.write($container.html());
                                                    out.end();
                                                } catch (err2) {
                                                    reject(err2);
                                                }
                                            } else {
                                                window.close();
                                                reject(errors[0]);
                                            }
                                        }
                                    }
                                );
                            }.bind(self, projectPath, skeletonPath));
                        }
                    ));

                    meta.locations = _.pluck(pages, "id");
                    meta.displayControlLocations = [];
                    for (var i = 0; i < meta.locations.length; i++) {
                        meta.locations[i] = _.string.sprintf("page-%s", meta.locations[i]);
                        meta.thumbnails.push(pages[i].thumbnail || "");
                        if (pages[i].hasDisplayControl) {
                            meta.displayControlLocations.push(meta.locations[i]);
                        }
                    }

                    //Copy artifact modules
                    meta.artifacts = artifactList;
                    if (artifactList.length) {
                        var repoBase = path.join(projectPath, "app", "repo");

                        //Copy module link to project repo path
                        yield Promise.all(
                            artifactList.map(function (artifact) {
                                return new Promise(function (repoBase, resolve, reject) {
                                    var src = path.join(self.config.userFile.repoFolder, artifact.type, artifact.libraryName, artifact.artifactId, artifact.version),
                                        target = path.join(repoBase, artifact.type, artifact.libraryName, artifact.artifactId, artifact.version);

                                    var err = self.mkdirsSync(path.dirname(target));

                                    if (err) {
                                        reject(err);
                                    } else {
                                        fs.symlink(src, target, function (fsError) {
                                            if (!fsError || fsError.code === "EEXIST") {
                                                resolve();
                                            } else {
                                                reject(fsError);
                                            }
                                        });

                                    }
                                }.bind(self, repoBase));
                            })
                        );

                    }

                    //Read presets in meta.json
                    var metaFile = path.join(skeletonPath, self.config.settings.meeletMetaFile);
                    if (fs.existsSync(metaFile)) {
                        let metaObj = yield new Promise(function (meta, resolve, reject) {
                            var rs = fs.createReadStream(metaFile),
                                ms = require('memorystream').createWriteStream();

                            rs.on('end', function () {
                                var str = ms.toString();
                                ms.destroy();

                                try {
                                    resolve(JSON.parse(str));
                                } catch (err) {
                                    reject(err);
                                }
                            });

                            rs.on('error', function (err) {
                                ms.destroy();
                                reject(err);
                            });

                            rs.pipe(ms);
                        }.bind(self, meta));

                        if (metaObj.locations && metaObj.locations.length) {
                            meta.locations = Array.prototype.concat.apply(Array.prototype, [meta.locations, metaObj.locations]);

                            yield Promise.all(
                                metaObj.locations.map(
                                    function (loc) {
                                        return new Promise(function (skeletonPath, projectPath, resolve, reject) {
                                            ncp(path.join(skeletonPath, loc + ".html"), path.join(projectPath, loc + ".html"), {
                                                clobber: true,
                                                stopOnErr: true,
                                                dereference: true
                                            }, function (err) {
                                                err && reject(err) || resolve();
                                            });
                                        }.bind(self, skeletonPath, projectPath));
                                    }
                                )
                            );
                        }
                    }

                    //Generate controller code
                    yield new Promise(function (skeletonPath, templatePath, projectPath, resolve, reject) {
                        try {
                            var templatePath = path.join(skeletonPath, "app", "controller.ejs"),
                                templateStr = fs.readFileSync(templatePath, "utf8"),
                                options = {debug: false, client: true},
                                ejsCompileCacheKey = templatePath,
                                controllerPath = path.join(projectPath, "app", "controller.js");

                            self.config.cache.wrap(ejsCompileCacheKey, function (cacheCb) {
                                try {
                                    var fn = ejs.compile(templateStr, options);
                                    cacheCb(null, fn);
                                } catch (compileErr) {
                                    cacheCb(compileErr);
                                }
                            }, function (err, fn) {
                                if (err) {
                                    reject(err);
                                } else {
                                    try {
                                        var jsContent = fn({pages: pages, meta: meta});
                                        jsContent = jsContent.replace(/&quot;/g, "\"");
                                        fs.writeFile(
                                            controllerPath,
                                            jsContent,
                                            function (err) {
                                                err && reject(err) || resolve();
                                            }
                                        );
                                    } catch (renderErr) {
                                        reject(renderErr);
                                    }
                                }
                            });
                        } catch (err) {
                            reject(err);
                        }
                    }.bind(self, skeletonPath, templatePath, projectPath));

                    //Write meta.json
                    yield new Promise(function(projectPath, resolve, reject) {
                        var metaFile = path.join(projectPath, self.config.settings.meeletMetaFile);

                        try {
                            var out = fs.createWriteStream(metaFile);

                            out.on('finish', function () {
                                resolve();
                            });

                            out.on('error', function (err) {
                                reject(err);
                            });

                            out.write(JSON.stringify(meta));
                            out.end();
                        } catch (err2) {
                            reject(err2);
                        }
                    }.bind(self, projectPath));

                    //Copy folder stylesheets to project path if not exist
                    yield new Promise(function(skeletonPath, projectPath, resolve, reject) {
                        var cssPath = path.join(skeletonPath, "stylesheets"),
                            target = path.join(projectPath, "stylesheets");

                        ncp(cssPath, target, {
                            clobber: true,
                            stopOnErr: true,
                            dereference: true,
                            filter: /\/[^\.][^\/]+$/
                        }, function (err) {
                            err && reject(err) || resolve();
                        });
                    }.bind(self, skeletonPath, projectPath));

                    //Copy folder fonts to project path if not exist
                    yield new Promise(function(skeletonPath, projectPath, resolve, reject) {
                        var fontPath = path.join(skeletonPath, "fonts"),
                            target = path.join(projectPath, "fonts");

                        ncp(fontPath, target, {
                            clobber: true,
                            stopOnErr: true,
                            dereference: true
                        }, function (err) {
                            err && reject(err) || resolve();
                        });
                    }.bind(self, skeletonPath, projectPath));

                    //Regenerate scss for each page json object
                    yield Promise.all(
                        pages.map(function (page) {
                            return new Promise(function(projectPath, resolve, reject) {
                                try {
                                    var basePath = path.join(projectPath, "stylesheets", "sass"),
                                        pageScssPath = path.join(basePath, _.string.sprintf("page-%s.scss", page.id)),
                                        out = fs.createWriteStream(pageScssPath);

                                    out.on('finish', function () {
                                        page.scssGenerated = true;
                                        resolve();
                                    });

                                    out.on('error', function (err) {
                                        reject(err);
                                    });

                                    out.write("@import \"compass/css3\";");
                                    page.writeScss(out);
                                    out.end();
                                } catch (err2) {
                                    reject(err2);
                                }
                            }.bind(self, projectPath));
                        })
                    );

                    //compass compile
                    yield new Promise(function(projectPath, resolve, reject) {
                        var basePath = path.join(projectPath, "stylesheets", "sass"),
                            cssPath = path.join(projectPath, "stylesheets"),
                            sassPath = path.join(projectPath, "stylesheets", "sass");

                        var err = self.mkdirsSync(sassPath);
                        if (err) {
                            reject(err);
                        } else {
                            self.spawn("compass",
                                ["compile", basePath, "--css-dir", cssPath, "--sass-dir", sassPath],
                                {},
                                function (err, result, code) {
                                    err && reject(err) || resolve();
                                }
                            );
                        }
                    }.bind(self, projectPath));
                }
            }
        }).then(function () {
            callback();
        }, function (err) {
            callback(err);
        });
    }
};

//TODO Use es7 Mixin
c.mixin(c, chatCommons);

module.exports = c;
