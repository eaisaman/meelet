var express = require('express');
var path = require('path');
var _ = require('underscore');
_.string = require('underscore.string');
_.mixin(_.string.exports());
var nconf = require('nconf');
var fs = require('fs');

var Configuration = function () {
        this.settings = {};
        this.em = new (require('events').EventEmitter)();
        this.cache = require('cache-manager').caching({store: 'memory', max: 100, ttl: 10/*43200seconds*/});
        this.i18n = require('i18n');
    },
    config = new Configuration();

Configuration.prototype.ApplicationDBConnectedEvent = "applicationDBConnected";
Configuration.prototype.ChatServerConnectedEvent = "chatServerConnected";
Configuration.prototype.ResourceReadyEvent = "resourceReady";

Configuration.prototype.configure = function (app) {
    nconf.file(path.join(__dirname, _.string.sprintf("config-%s.json", process.env.NODE_ENV || 'development')));

    var settings = nconf.get("settings");
    if (settings) {
        for (var key in settings) {
            app.set(key, settings[key]);
        }
        this.settings = settings;
    }

    this.applicationResources = nconf.get("applicationResources");

    var staticResources = nconf.get("staticResources");
    if (staticResources) {
        staticResources.forEach(function (r) {
            for (var urlKey in r) {
                var dir = r[urlKey],
                    _dir = _(dir);
                if (!_dir.startsWith(path.sep) && !_dir.include(":")) {
                    dir = path.join(__dirname, dir);
                }
                app.use(urlKey, express.static(dir));
            }
        });
    }

    var routes = nconf.get("routes");
    if (routes) {
        routes.forEach(function (r) {
            for (var urlKey in r) {
                var moduleInfo = r[urlKey],
                    m = moduleInfo["module"],
                    f = moduleInfo["function"],
                    params = moduleInfo["parameters"];

                if (m) {
                    var mod = require(m),
                        func = mod,
                        context = null;

                    if (f) {
                        func = mod[f];
                        context = mod;
                    }

                    if (!func.handle) {
                        if (params) {
                            func = func.apply(context, params);
                        } else {
                            func = func.apply(context);
                        }
                    }

                    app.use(urlKey, func);
                }
            }
        });
    }

    this.i18n.configure({
        locales: ['en', 'zh'],
        directory: __dirname + '/locales',
        defaultLocale: "zh"
    });

    this.postConfigure();
}

Configuration.prototype.postConfigure = function () {
    var self = this,
        mongoose = require('mongoose');

    if (self.settings["logging"]) {
        var log4js = require('log4js');
        log4js.configure(this.settings["logging"]);
        self.logger = log4js.getLogger();
    }

    if (self.settings["applicationDb"]) {
        self.on(self.ResourceReadyEvent, function (resource) {
            //instance is of type mongodb.db
            if (resource.name == self.settings["applicationDb"] && resource.instance) {
                self.em.emit(self.ApplicationDBConnectedEvent, resource);
            }
        });
    }

    if (self.settings["applicationChatServer"]) {
        self.on(self.ResourceReadyEvent, function (resource) {
            //Chat server connection established
            if (resource.name == self.settings["applicationChatServer"]) {
                self.em.emit(self.ChatServerConnectedEvent);
            }
        });
    }

    if (self.settings["enumType"]) {
        self.enumType = require(self.settings["enumType"]);
    }

    if (self.settings["download"]) {
        var downloadConfig = self.settings["download"],
            folder = downloadConfig.folder,
            _folder = _(folder);
        if (!_folder.startsWith(path.sep) && !_folder.include(":")) {
            folder = path.join(__dirname, folder);
        }
        self.download = {folder: folder};
        fs.exists(self.download.folder, function (exist) {
            if (!exist) {
                fs.mkdir(self.download.folder);
            }
        })
    }

    if (self.settings["upload"]) {
        var uploadConfig = self.settings["upload"],
            folder = uploadConfig.folder,
            _folder = _(folder);
        if (!_folder.startsWith(path.sep) && !_folder.include(":")) {
            folder = path.join(__dirname, folder);
        }
        self.upload = {folder: folder};
        fs.exists(self.upload.folder, function (exist) {
            if (!exist) {
                fs.mkdir(self.upload.folder);
            }
        })
    }

    if (self.settings["userFile"]) {
        var userFileConfig = self.settings["userFile"];

        self.userFile = {};
        for (var folderName in userFileConfig) {
            var folder = userFileConfig[folderName],
                _folder = _(folder);

            if (!_folder.startsWith(path.sep) && !_folder.include(":")) {
                folder = path.join(__dirname, folder);
            }

            self.userFile[folderName] = folder;
        }
    }

    if (self.applicationResources) {
        self.resourceMap = {};

        self.applicationResources.forEach(function (moduleInfo) {
            var m = moduleInfo["module"],
                f = moduleInfo["function"],
                params = moduleInfo["parameters"] || [];

            var func = require(m), owner = null;

            if (f) {
                owner = func;
                func = owner[f];
            }

            func.apply(owner, params.concat(
                [moduleInfo.resource, function (err, resource) {
                    if (err) {
                        self.logger.error(err);
                    } else {
                        self.resourceMap[resource.name] = resource;
                        self.em.emit(self.ResourceReadyEvent, resource);
                    }
                }]
            ));
        });
    }
}

Configuration.prototype.once = function (eventType, listener) {
    if (eventType && listener) {
        this.em.once(eventType, listener);
    }
}

Configuration.prototype.addEventListener = Configuration.prototype.on = function (eventType, listener) {
    if (eventType && listener) {
        this.em.addListener(eventType, listener);
    }
}

Configuration.prototype.removeEventListener = function (eventType, listener) {
    if (eventType) {
        if (listener)
            this.em.removeListener(eventType, listener);
        else
            this.em.removeListener(eventType);
    }
}
module.exports = config;
