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

var Commons = function () {
    var self = this;

    self.config = require('./config');
}, c = new Commons();

Commons.prototype.mkdirsSync = function (dirpath) {
    try {
        dirpath.split(path.sep).reduce(function (parts, part) {
            parts += part + '/';
            var subpath = path.resolve(parts);
            if (!fs.existsSync(subpath)) {
                fs.mkdirSync(subpath, 0777);
            }
            return parts;
        }, '');
    } catch (err) {
        return err;
    }
}

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
}

Commons.prototype.arrayOmit = function (objects) {
    var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1)),
        arr = [];

    objects && objects.forEach(function (obj) {
        arr.push(_.omit(obj, keys));
    });

    return arr;
}

Commons.prototype.arrayPick = function (objects) {
    var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1)),
        arr = [];

    objects && objects.forEach(function (obj) {
        arr.push(_.pick(obj, keys));
    });

    return arr;
}

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

}

Commons.prototype.allowXDomain = function () {
    return function addXDomainHeaders(req, res, next) {
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            res.setHeader("Access-Control-Allow-Origin", "http://localhost");
            res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE");
            res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            res.setHeader("Access-Control-Allow-Credentials", true);
        }

        next();
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
}

Commons.prototype.encryptPassword = function (plain, salt) {
    var self = this;

    salt = salt || self.config.settings.salt;
    return crypto.createHmac('sha1', salt).update(plain).digest('hex');
}

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
                            initPassport.collection.findOne({loginName: username}, function (err, data) {
                                return done(err, !err && data && checkPassword(password, data.password, data.salt || options.salt || self.config.settings.salt) && data);
                            });
                        }));

                        passport.use(new httpStrategies.DigestStrategy(function (username, password, done) {
                            initPassport.collection.findOne({loginName: username}, function (err, data) {
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
}

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

        fs.exists(widgetCssPath, function (exist) {
            if (exist) {
                callback(null, path.basename(widgetCssPath));
            } else {
                async.waterfall(
                    [
                        function (next) {
                            async.parallel(
                                [
                                    function (callback) {
                                        fs.exists(ejsPath, function (exist) {
                                            if (exist) {
                                                callback(null);
                                            } else {
                                                callback(new Error(_.string.sprintf("Path %s not exist.", ejsPath)));
                                            }
                                        });
                                    },
                                    function (callback) {
                                        var err = self.mkdirsSync(configPath);

                                        process.nextTick(function () {
                                            callback(err);
                                        });
                                    },
                                ],
                                function (err) {
                                    next(err);
                                }
                            );
                        },
                        function (next) {
                            fs.symlink(artifactSassPath, path.join(configPath, "sass"), function (fsError) {
                                if (!fsError || fsError.code === "EEXIST") {
                                    next(null);
                                } else {
                                    next(fsError);
                                }
                            });
                        },
                        function (next) {
                            //save empty configuration file _configuration-<widget id>.scss
                            fs.writeFile(
                                widgetConfigurationPath,
                                _.string.sprintf("$configuration-%s: ();", widgetId),
                                function (err) {
                                    next(err);
                                });
                        },
                        function (next) {
                            //ejs render
                            try {
                                var templateStr = fs.readFileSync(path.join(configPath, "sass", "configurable-widget.ejs"), "utf8"),
                                    options = {debug: false, client: true},
                                    ejsCompileCacheKey = path.join(self.config.userFile.repoFolder, type, libraryName, artifactId, version);

                                self.config.cache.wrap(ejsCompileCacheKey, function (cacheCb) {
                                    try {
                                        var fn = ejs.compile(templateStr, options);
                                        cacheCb(null, fn);
                                    } catch (compileErr) {
                                        cacheCb(compileErr);
                                    }
                                }, function (err, fn) {
                                    if (err) {
                                        next(err);
                                    } else {
                                        try {
                                            var scssContent = fn({configuration: null, widgetId: [widgetId]});
                                            fs.writeFile(
                                                widgetScssPath,
                                                scssContent,
                                                function (err) {
                                                    next(err);
                                                }
                                            );
                                        } catch (renderErr) {
                                            next(renderErr);
                                        }
                                    }
                                });
                            } catch (err) {
                                next(err);
                            }
                        },
                        function (next) {
                            //compass compile
                            var basePath = configPath,
                                specify = widgetScssPath;

                            self.spawn("compass",
                                ["compile", basePath, specify, "--css-dir", cssPath, "--sass-dir", configPath],
                                {},
                                function (err, result, code) {
                                    next(err);
                                }
                            );
                        },
                        function (next) {
                            //Save links of generated files to project staging folder
                            async.each([widgetConfigurationPath, widgetScssPath, widgetCssPath], function (pathItem, callback) {
                                fs.symlink(pathItem, path.join(stagingProjectPath, path.basename(pathItem)), function (fsError) {
                                    if (!fsError || fsError.code === "EEXIST") {
                                        callback(null);
                                    } else {
                                        callback(fsError);
                                    }
                                });
                            }, function (err) {
                                next(err);
                            });
                        }
                    ], function (err) {
                        callback(err, path.basename(widgetCssPath));
                    }
                );
            }
        });
    } else {
        callback(new Error("Empty project id"));
    }
}

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

        async.waterfall([
            function (next) {
                async.parallel([
                    function (callback) {
                        fs.unlink(widgetConfigPath, function (err) {
                            if (err) {
                                if (err.code !== "ENOENT") //Not Found
                                {
                                    self.config.logger.error(err);
                                    callback(err);
                                }
                                else {
                                    self.config.logger.warn(err);
                                    callback(null);
                                }
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        fs.unlink(widgetScssPath, function (err) {
                            if (err) {
                                if (err.code !== "ENOENT") //Not Found
                                {
                                    self.config.logger.error(err);
                                    callback(err);
                                }
                                else {
                                    self.config.logger.warn(err);
                                    callback(null);
                                }
                            } else {
                                callback(null);
                            }
                        });
                    },
                    function (callback) {
                        fs.unlink(widgetCssPath, function (err) {
                            if (err) {
                                if (err.code !== "ENOENT") //Not Found
                                {
                                    self.config.logger.error(err);
                                    callback(err);
                                }
                                else {
                                    self.config.logger.warn(err);
                                    callback(null);
                                }
                            } else {
                                callback(null);
                            }
                        });
                    }
                ], function (errs) {
                    if (errs && errs.length) {
                        var msg = new Buffer(_.string.sprintf("Total Errors %d%s", errs.length, path.sep));
                        errs.forEach(function (e) {
                            msg.write(e.message, msg.length);
                            msg.write(path.sep);
                        });
                        next(msg.toString());
                    } else {
                        next(null);
                    }
                });

            },
            function (next) {
                glob("*.scss", {cwd: configPath}, function (err, files) {
                    next(err, files);
                });
            },
            function (files, next) {
                if (files && files.length) {
                    next(null);
                } else {
                    //Artifact is used not any more.
                    rimraf(configPath, function (err) {
                        next(err);
                    });
                }
            }
        ], function (err) {
            callback(err);
        });
    }
}

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

        async.waterfall(
            [
                function (next) {
                    async.parallel(
                        [
                            function (callback) {
                                fs.exists(widgetConfigPath, function (exist) {
                                    if (exist) {
                                        callback(null);
                                    } else {
                                        callback(new Error(_.string.sprintf("Path %s not exist.", widgetConfigPath)));
                                    }
                                });
                            },
                            function (callback) {
                                fs.exists(widgetScssPath, function (exist) {
                                    if (exist) {
                                        callback(null);
                                    } else {
                                        callback(new Error(_.string.sprintf("Path %s not exist.", widgetScssPath)));
                                    }
                                });
                            }
                        ],
                        function (errs) {
                            if (errs && errs.length) {
                                var msg = new Buffer(_.string.sprintf("Total Errors %d%s", errs.length, path.sep));
                                errs.forEach(function (e) {
                                    msg.write(e.message, msg.length);
                                    msg.write(path.sep);
                                });
                                next(msg.toString());
                            } else {
                                next(null);
                            }
                        }
                    );
                },
                function (next) {
                    //save configuration file _configuration-<widget id>.scss
                    var configArr = [];
                    _.each(configuration, function (value, key) {
                        configArr.push(key + ":" + value);
                    });
                    fs.writeFile(
                        path.join(configPath, _.string.sprintf("_configuration-%s.scss", widgetId)),
                        _.string.sprintf("$configuration-%s: (%s);", widgetId, configArr.join(",")),
                        function (err) {
                            next(err);
                        });
                },
                function (next) {
                    //compass compile
                    var basePath = configPath,
                        specify = widgetScssPath;

                    self.spawn("compass",
                        ["compile", basePath, specify, "--css-dir", cssPath, "--sass-dir", configPath],
                        {},
                        function (err, result, code) {
                            next(err);
                        }
                    );
                }
            ],
            function (err) {
                callback(err, path.basename(widgetCssPath));
            }
        );
    }
}

Commons.prototype.convertToHtml = function (projectType, projectPath, artifactList, callback) {
    var self = this,
        skeletonModuleFolder = "javascripts",
        skeletonHtml = "meelet.skeleton.html",
        skeletonPath = path.join(self.config.userFile.skeletonFolder, projectType),
        skeletonModulePath = path.join(skeletonPath, skeletonModuleFolder),
        projectModulePath = self.config.userFile.projectModuleFolder,
        skeletonHtmlPath = path.join(skeletonPath, skeletonHtml),
        skeletonLibLoadTimeout = self.config.settings.skeletonLibLoadTimeout,
        meeletPath = path.join(projectPath, self.config.settings.meeletFile);

    var nonExistentPath = (!fs.existsSync(projectPath) && projectPath)
        || (!fs.existsSync(skeletonPath) && skeletonPath)
        || (!fs.existsSync(skeletonHtmlPath) && skeletonHtmlPath)
        || (!fs.existsSync(meeletPath) && meeletPath)
        || (!fs.existsSync(skeletonModulePath) && skeletonModulePath);

    if (nonExistentPath) {
        callback(_.string.sprintf("Path %s not found", nonExistentPath));
    } else {
        async.waterfall(
            [
                function (next) {
                    //Building jdom for skeleton html
                    var skeletonDomCacheKey = skeletonHtmlPath,
                        amdModules = [];

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
                        next(err, window);
                    });
                },
                function (window, next) {
                    //Copy referenced javascript libraries
                    var fnArr = [];
                    //Copy require.js to project path if not exist
                    fnArr.push(function (cb) {
                        var target = path.join(projectPath, "javascripts", "require"),
                            err = self.mkdirsSync(target);

                        if (err) {
                            cb(err);
                        } else {
                            ncp(path.join(skeletonPath, "javascripts", "require"), target, {
                                clobber: false,
                                stopOnErr: true,
                                dereference: true
                            }, function (err) {
                                cb(err);
                            });
                        }
                    });

                    //Copy modules to project module path if not exist
                    window.amdModules && window.amdModules.forEach(function (pathname) {
                        var relative = _.string.trim(path.relative(skeletonPath, path.dirname(pathname)));
                        if (relative) {
                            var moduleRelative = _.string.trim(path.relative(skeletonModulePath, path.dirname(pathname)));
                            //if folder is not in module path, for example app/main.js, directive/main.js
                            if (/^\.\.\//g.test(moduleRelative)) {
                                fnArr.push(function (cb) {
                                    var target = path.join(projectPath, relative);

                                    ncp(path.dirname(pathname), target, {
                                        clobber: false,
                                        stopOnErr: true,
                                        dereference: true
                                    }, function (err) {
                                        cb(err);
                                    });
                                });
                            } else {
                                fnArr.push(function (cb) {
                                    var target = path.join(projectModulePath, moduleRelative);

                                    if (!fs.existsSync(target)) {
                                        var err = self.mkdirsSync(target);

                                        if (!err) {
                                            ncp(path.dirname(pathname), target, {
                                                clobber: false,
                                                stopOnErr: true,
                                                dereference: true
                                            }, function (err) {
                                                cb(err);
                                            });
                                        } else {
                                            cb(err);
                                        }
                                    } else {
                                        cb(null);
                                    }
                                });
                            }
                        } else {
                            fnArr.push(function (cb) {
                                var target = path.join(projectPath, path.basename(pathname));

                                ncp(pathname, target, {
                                    clobber: false,
                                    stopOnErr: true
                                }, function (err) {
                                    cb(err);
                                });
                            });
                        }
                    });

                    if (fnArr.length) {
                        async.waterfall(fnArr, function (err) {
                            next(err);
                        });
                    } else {
                        next(null);
                    }
                },
                function (next) {
                    //Parse page JSON object

                    async.waterfall([
                            function (cb) {
                                fs.readFile(meeletPath, "utf8", function (err, str) {
                                    if (err) cb(err);

                                    try {
                                        var obj = JSON.parse(str),
                                            pages = [];

                                        obj.pages.forEach(function (pageObj) {
                                            pages.push(classes.fromObject(pageObj));
                                        });

                                        cb(null, pages, {
                                            artifacts: [],
                                            locations: [],
                                            pageTransition: obj.pageTransition || {}
                                        });
                                    } catch (err2) {
                                        cb(err2);
                                    }
                                });
                            },
                            function (pages, meta, cb) {
                                //Compare mtime of meelet json file and page html file, if it's new regenerate html files.

                                if (pages && pages.length) {
                                    var pObj = {
                                        meeletTime: function (pCallback) {
                                            fs.stat(meeletPath, function (err, stat) {
                                                if (err) {
                                                    pCallback(err);
                                                } else {
                                                    pCallback(null, stat.mtime.getTime());
                                                }
                                            });
                                        }
                                    };

                                    pages.forEach(function (page) {
                                        var pageHtml = path.join(projectPath, _.string.sprintf("page-%s.html", page.id));
                                        pObj[page.id] = function (pCallback) {
                                            fs.stat(pageHtml, function (err, stat) {
                                                if (err) {
                                                    if (err.code !== "ENOENT") //Not Found
                                                        pCallback(err);
                                                    else
                                                        pCallback(null, 0);
                                                } else {
                                                    pCallback(null, stat.mtime.getTime());
                                                }
                                            });
                                        }
                                    });

                                    async.parallel(pObj, function (err, results) {
                                        if (err) cb(err);

                                        var meeletTime = results.meeletTime,
                                            mtimes = _.values(_.omit(results, "meeletTime"));

                                        if (!mtimes.every(function (mtime) {
                                                return mtime > meeletTime;
                                            })) {
                                            cb(null, pages, meta);
                                        } else {
                                            cb(null, null, meta);
                                        }
                                    })
                                } else {
                                    cb(null, pages, meta);
                                }
                            }
                        ],
                        function (err, pages, meta) {
                            if (err) {
                                next(err);
                            } else {
                                next(null, pages, meta);
                            }
                        }
                    );
                },
                function (pages, meta, next) {
                    //Generate html files

                    if (pages && pages.length) {
                        var fnArr = [];

                        //Copy skeleton html file to project path if not exists;
                        fnArr.push(function (cb) {
                            ncp(skeletonHtmlPath, path.join(projectPath, "index.html"), {
                                clobber: true,
                                stopOnErr: true
                            }, function (err) {
                                cb(err);
                            });
                        });

                        //Regenerate scrap html for each page json object
                        pages.forEach(function (page) {
                            fnArr.push(function (cb) {
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
                                                        cb(null);
                                                    });

                                                    out.on('error', function (err) {
                                                        cb(err);
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
                                                    cb(err2);
                                                }
                                                ;
                                            } else {
                                                window.close();
                                                cb(errors[0]);
                                            }
                                        }
                                    }
                                );
                            });
                        });

                        if (fnArr.length) {
                            async.waterfall(fnArr, function (err) {
                                if (err) {
                                    next(err);
                                } else {
                                    //Write app/route.json
                                    meta.locations = _.pluck(pages, "id");
                                    for (var i = 0; i < meta.locations.length; i++) {
                                        meta.locations[i] = _.string.sprintf("page-%s", meta.locations[i]);
                                    }
                                    next(null, pages, meta);
                                }
                            });
                        } else {
                            next(null, pages, meta);
                        }
                    } else {
                        next(null, pages, meta);
                    }
                },
                function (pages, meta, next) {
                    //Copy artifact modules

                    if (pages && pages.length) {
                        meta.artifacts = artifactList;

                        if (artifactList.length) {
                            var fnArr = [],
                                repoBase = path.join(projectPath, "app", "repo");

                            //Copy module link to project repo path
                            artifactList.forEach(function (artifact) {
                                fnArr.push(function (cb) {
                                    var src = path.join(self.config.userFile.repoFolder, artifact.type, artifact.libraryName, artifact.artifactId, artifact.version),
                                        target = path.join(repoBase, artifact.type, artifact.libraryName, artifact.artifactId, artifact.version);

                                    var err = self.mkdirsSync(path.dirname(target));

                                    if (err) {
                                        cb(err);
                                    } else {
                                        fs.symlink(src, target, function (fsError) {
                                            if (!fsError || fsError.code === "EEXIST") {
                                                cb(null);
                                            } else {
                                                cb(fsError);
                                            }
                                        });

                                    }
                                });
                            });

                            async.waterfall(fnArr, function (err) {
                                next(err, pages, meta);
                            });
                        } else {
                            next(null, pages, meta);
                        }
                    } else {
                        next(null, pages, meta);
                    }
                },
                function (pages, meta, next) {
                    //Generate controller code

                    if (pages && pages.length) {
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
                                    next(err);
                                } else {
                                    try {
                                        var jsContent = fn({pages: pages});
                                        jsContent = jsContent.replace(/&quot;/g, "\"");
                                        fs.writeFile(
                                            controllerPath,
                                            jsContent,
                                            function (err) {
                                                next(err, pages, meta);
                                            }
                                        );
                                    } catch (renderErr) {
                                        next(renderErr);
                                    }
                                }
                            });
                        } catch (err) {
                            next(err);
                        }
                    } else {
                        next(null, pages, meta);
                    }
                },
                function (pages, meta, next) {
                    //Write meta.json

                    if (pages && pages.length) {
                        var metaFile = path.join(projectPath, "app", self.config.settings.meeletMetaFile);

                        try {
                            var out = fs.createWriteStream(metaFile);

                            out.on('finish', function () {
                                next(null, pages);
                            });

                            out.on('error', function (err) {
                                next(err);
                            });

                            out.write(JSON.stringify(meta));
                            out.end();
                        } catch (err2) {
                            next(err2);
                        }
                    } else {
                        next(null, pages);
                    }
                },
                function (pages, next) {
                    //Regenerate scss for each page json object

                    if (pages && pages.length) {
                        var fnArr = [];

                        //Copy folder stylesheets to project path if not exist
                        fnArr.push(function (cb) {
                            var cssPath = path.join(skeletonPath, "stylesheets"),
                                target = path.join(projectPath, "stylesheets");

                            ncp(cssPath, target, {
                                clobber: true,
                                stopOnErr: true,
                                dereference: true
                            }, function (err) {
                                cb(err);
                            });
                        });

                        //Copy folder fonts to project path if not exist
                        fnArr.push(function (cb) {
                            var fontPath = path.join(skeletonPath, "fonts"),
                                target = path.join(projectPath, "fonts");

                            ncp(fontPath, target, {
                                clobber: true,
                                stopOnErr: true,
                                dereference: true
                            }, function (err) {
                                cb(err);
                            });
                        });

                        pages.forEach(function (page) {
                            fnArr.push(function (cb) {
                                try {
                                    var basePath = path.join(projectPath, "stylesheets", "sass"),
                                        pageScssPath = path.join(basePath, _.string.sprintf("page-%s.scss", page.id)),
                                        out = fs.createWriteStream(pageScssPath);

                                    out.on('finish', function () {
                                        page.scssGenerated = true;
                                        cb(null);
                                    });

                                    out.on('error', function (err) {
                                        cb(err);
                                    });

                                    out.write("@import \"compass/css3\";");
                                    page.writeScss(out);
                                    out.end();
                                } catch (err2) {
                                    cb(err2);
                                }
                            });
                        });

                        async.waterfall(fnArr, function (err) {
                            next(err, err || _.where(pages, {scssGenerated: true}));
                        });
                    } else {
                        next(null, pages);
                    }
                },
                function (pages, next) {
                    //compass compile

                    if (pages && pages.length) {
                        var basePath = path.join(projectPath, "stylesheets", "sass"),
                            cssPath = path.join(projectPath, "stylesheets"),
                            sassPath = path.join(projectPath, "stylesheets", "sass");

                        async.waterfall([
                            function (cb) {
                                var err = self.mkdirsSync(sassPath);

                                process.nextTick(function () {
                                    cb(err);
                                });
                            },
                            function (cb) {
                                self.spawn("compass",
                                    ["compile", basePath, "--css-dir", cssPath, "--sass-dir", sassPath],
                                    {},
                                    function (err, result, code) {
                                        cb(err);
                                    }
                                );
                            }
                        ], function (err) {
                            next(err);
                        });
                    } else {
                        next(null);
                    }
                }
            ],
            function (err) {
                callback(err);
            }
        );
    }
}

module.exports = c;
