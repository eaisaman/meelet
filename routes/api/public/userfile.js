var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var shelljs = require('shelljs');
var async = require('async');
var _ = require('underscore');
var bson = require('bson');
var qr = require('qr-image');
var FFmpeg = require('fluent-ffmpeg');
_.string = require('underscore.string');
_.mixin(_.string.exports());
var zipCtor = function () {
    _.extend(this, require('archiver')('zip'));

    delete this.directory;
};
zipCtor.prototype.directory = function (dirpath, destpath, data) {
    if (this._state.finalize || this._state.aborted) {
        this.emit('error', new Error('directory: queue closed'));
        return this;
    }

    if (typeof dirpath !== 'string' || dirpath.length === 0) {
        this.emit('error', new Error('directory: dirpath must be a non-empty string value'));
        return this;
    }

    this._pending++;

    if (destpath === false) {
        destpath = '';
    } else if (typeof destpath !== 'string') {
        destpath = dirpath;
    }

    if (typeof data !== 'object') {
        data = {};
    }

    var self = this;

    commons.walkdir(dirpath, function (err, results) {
        if (err) {
            self.emit('error', err);
        } else {
            results.forEach(function (file) {
                var entryData = _.extend({}, data);
                entryData.name = path.join(destpath, file.relative).replace(/\\/g, '/').replace(/:/g, '').replace(/^(\.\.\/|\.\/|\/)+/, '');
                entryData.stats = file.stats;

                self._append(file.path, entryData);
            });
        }

        self._pending--;
        self._maybeFinalize();
    }, _.pick(self.options, ["ignoreHidden", "ignorePaths"]));

    return this;
};
var commons = require('../../../commons');

var UserFileController = function (fields) {
    var self = this;

    if (typeof fields == "object") {
        for (var fieldName in fields) {
            var field = fields[fieldName];
            if (field) {
                self[fieldName] = field;
            }
        }
    }

    self.config = require('../../../config');
    self.__ = self.config.i18n.__;
    self.config.on(self.config.ApplicationDBConnectedEvent, function (resource) {
        self.db = resource.instance;
        self.schema = resource.schema;
        self.isDBReady = true;
    });
};

/**
 * @description
 *
 * Save sketch project and its json content. Parameter stagingContent contains field widgetList and removeWidgetList.
 * When user adds a configurable widget to his page, a record will be added to staging widget list. When he removes a
 * configurable widget, record will be removed from staging widget list and added to removing widget list. The final
 * staging widget list stores widgets used in page, removing list stores those not used. The server side folder stores
 * file links to those files generated for each newly created configurable widget. If the widget is still in staging
 * list, it is kept in page, only its file links need to be removed. If the widget is in removing list, it is no longer
 * used, in addition to removing links, those targeted generated files need to be removed as well. All remaining links
 * point to files of orphanage widgets, i.e. widgets have been removed from page but its links still exist due to some
 * uncertain reason. These links and their targeted files need to removed.
 *
 * @param projectId {string}
 * @param sketchWorks {object}
 * @param stagingContent {object}
 * @param request {object}
 * @param success {function}
 * @param fail {function}
 */
UserFileController.prototype.postSketch = function (projectId, sketchWorks, stagingContent, request, success, fail) {
    var self = this;

    //FIXME JSON.parse may throw error.
    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
            cssPath = path.join(projectPath, "stylesheets"),
            sassPath = path.join(cssPath, "repo"),
            stagingProjectPath = path.join(self.config.userFile.stagingFolder, projectId);

        stagingContent = (stagingContent && JSON.parse(stagingContent)) || {};

        async.waterfall(
            [
                function (next) {
                    fs.mkdir(projectPath, 0777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            var filePath = path.join(projectPath, "meelet.json"),
                                out = fs.createWriteStream(filePath);

                            out.on('finish', function () {
                                next(null);
                            });

                            out.on('error', function (err) {
                                next(err);
                            });

                            out.write(sketchWorks);
                            out.end();
                        } else {
                            next(fsError);
                        }
                    });
                },
                function (next) {
                    var pendingWidgetList = stagingContent.widgetList || [],
                        removeWidgetList = stagingContent.removeWidgetList || [];

                    async.waterfall(
                        [
                            function (wCallback) {
                                async.each(Array.prototype.concat.apply(Array.prototype, [pendingWidgetList, removeWidgetList]), function (widgetItem, callback) {
                                    var widgetId = widgetItem.widgetId,
                                        widgetConfigurationPath = path.join(stagingProjectPath, _.string.sprintf("_configuration-%s.scss", widgetId)),
                                        widgetScssPath = path.join(stagingProjectPath, _.string.sprintf("configurable-widget-%s.scss", widgetId)),
                                        widgetCssPath = path.join(stagingProjectPath, _.string.sprintf("configurable-widget-%s.css", widgetId));

                                    async.each([widgetConfigurationPath, widgetScssPath, widgetCssPath],
                                        function (pathItem, cb) {
                                            fs.unlink(pathItem, function (err) {
                                                if (err) {
                                                    if (err.code !== "ENOENT") //Not Found
                                                    {
                                                        self.config.logger.error(err);
                                                        cb(err);
                                                    }
                                                    else {
                                                        self.config.logger.warn(err);
                                                        cb(null);
                                                    }
                                                } else {
                                                    cb(null);
                                                }
                                            });
                                        }, function (err) {
                                            callback(err);
                                        }
                                    );
                                }, function (err) {
                                    wCallback(err);
                                });
                            },
                            function (wCallback) {
                                //Remove files of deleted widgets
                                var removeFileList = [];

                                _.each(stagingContent.removeWidgetList, function (widgetItem) {
                                    var artifactId = widgetItem.artifactId,
                                        widgetId = widgetItem.widgetId,
                                        configPath = path.join(sassPath, artifactId),
                                        widgetConfigPath = path.join(configPath, _.string.sprintf("_configuration-%s.scss", widgetId)),
                                        widgetScssPath = path.join(configPath, _.string.sprintf("configurable-widget-%s.scss", widgetId)),
                                        widgetCssPath = path.join(cssPath, _.string.sprintf("configurable-widget-%s.css", widgetId));

                                    removeFileList.push(widgetConfigPath);
                                    removeFileList.push(widgetScssPath);
                                    removeFileList.push(widgetCssPath);
                                });

                                async.each(removeFileList, function (pathItem, callback) {
                                    fs.unlink(pathItem, function (err) {
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
                                }, function (err) {
                                    wCallback(err);
                                });
                            },
                            function (wCallback) {
                                //Read remaining links in staging folder
                                fs.readdir(stagingProjectPath, function (err, fileNames) {
                                    if (err) {
                                        wCallback(err);
                                    } else {
                                        var orphanLinkList = [];

                                        _.each(fileNames, function (fileName) {
                                            var pathItem = path.join(stagingProjectPath, fileName);
                                            if (fs.lstatSync(pathItem).isSymbolicLink()) {
                                                orphanLinkList.push(pathItem);
                                            }
                                        });

                                        wCallback(null, orphanLinkList);
                                    }
                                });
                            },
                            function (orphanLinkList, wCallback) {
                                //Get staging links' targeted files.
                                var arr = [];
                                _.each(orphanLinkList, function (linkItem) {
                                    arr.push(function (cb) {
                                        fs.readlink(linkItem, function (err, resolvedPath) {
                                            if (err) {
                                                self.config.logger.warn(err);
                                            }

                                            cb(null, resolvedPath);
                                        });
                                    });
                                });

                                async.parallel(arr, function (err, results) {
                                    if (err) {
                                        self.config.logger.warn(err);
                                    }

                                    var orphanFileList = [];
                                    _.each(results, function (result) {
                                        result && orphanFileList.push(result);
                                    });
                                    orphanFileList = Array.prototype.concat.apply(Array.prototype, [orphanFileList, orphanLinkList]);

                                    wCallback(null, orphanFileList);
                                });
                            },
                            function (orphanFileList, wCallback) {
                                //Remove orphan files
                                async.each(orphanFileList, function (pathItem, callback) {
                                    fs.unlink(pathItem, function (err) {
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
                                }, function (err) {
                                    wCallback(err);
                                });
                            }
                        ], function (err) {
                            next(err);
                        }
                    );
                }
            ], function (err) {
                if (!err) {
                    success();
                } else {
                    fail(err);
                }
            }
        );
    } else {
        fail("Empty project id");
    }
};

/**
 * @description
 *
 * Save flow project and its json content.
 *
 * @param projectId
 * @param flowWorks
 * @param request
 * @param success
 * @param fail
 */
UserFileController.prototype.postFlow = function (projectId, flowWorks, request, success, fail) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

        async.waterfall(
            [
                function (next) {
                    fs.mkdir(projectPath, 0777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            var filePath = path.join(projectPath, "flow.json"),
                                out = fs.createWriteStream(filePath);

                            out.on('finish', function () {
                                next(null);
                            });

                            out.on('error', function (err) {
                                next(err);
                            });

                            out.write(flowWorks);
                            out.end();
                        } else {
                            next(fsError);
                        }
                    });
                }
            ], function (err) {
                if (!err) {
                    success();
                } else {
                    fail(err);
                }
            }
        );
    } else {
        fail("Empty project id");
    }
};

/**
 * @description
 *
 * Add new configurable widget to project. Return its css name.
 *
 *
 * @param projectId
 * @param widgetId
 * @param libraryName
 * @param artifactId
 * @param type
 * @param version
 * @param success
 * @param fail
 */
UserFileController.prototype.postConfigurableArtifact = function (projectId, widgetId, libraryName, artifactId, type, version, success, fail) {
    if (projectId) {
        commons.addConfigurableArtifact(projectId, widgetId, libraryName, artifactId, type, version, function (err, cssName) {
            if (!err) {
                success({css: cssName});
            } else {
                fail(err);
            }
        })
    } else {
        fail("Empty project id");
    }
};

/**
 * @description
 *
 * Remove configurable widget from project.
 *
 * @param projectId
 * @param widgetId
 * @param artifactId
 * @param success
 * @param fail
 */
UserFileController.prototype.deleteConfigurableArtifact = function (projectId, widgetId, artifactId, success, fail) {
    if (projectId) {
        commons.removeConfigurableArtifact(projectId, widgetId, artifactId, function (err) {
            if (!err) {
                success();
            } else {
                fail(err);
            }
        })
    } else {
        fail("Empty project id");
    }
};

/**
 * @description
 *
 * Modify configuration of configurable widget.
 *
 * @param projectId
 * @param widgetId
 * @param artifactId
 * @param configuration
 * @param success
 * @param fail
 */
UserFileController.prototype.putConfigurableArtifact = function (projectId, widgetId, artifactId, configuration, success, fail) {
    if (projectId) {
        configuration = (configuration && JSON.parse(configuration)) || {};
        commons.updateConfigurableArtifact(projectId, widgetId, artifactId, configuration, function (err, cssName) {
            if (!err) {
                success({css: cssName, updateTime: new Date().getTime()});
            } else {
                fail(err);
            }
        })
    } else {
        fail("Empty project id");
    }
};

/**
 * @description
 *
 * Return sketch project's json content.
 *
 *
 * @param projectId
 * @param success
 * @param fail
 */
UserFileController.prototype.getSketch = function (projectId, success, fail) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

        fs.mkdir(projectPath, 0777, function (fsError) {
            if (!fsError || fsError.code === "EEXIST") {
                var filePath = path.join(projectPath, "meelet.json"),
                    rs = fs.createReadStream(filePath),
                    ms = require('memorystream').createWriteStream();

                rs.on('end', function () {
                    var ret = ms.toString();
                    ms.destroy();
                    success(ret);
                });

                rs.on('error', function (err) {
                    ms.destroy();
                    fail(err);
                });

                rs.pipe(ms);
            } else {
                fail(fsError);
            }
        });
    } else {
        fail("Empty project id");
    }
};

/**
 * @description
 *
 * Return flow project's json content.
 *
 * @param projectId
 * @param success
 * @param fail
 */
UserFileController.prototype.getFlow = function (projectId, success, fail) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

        fs.mkdir(projectPath, 0777, function (fsError) {
            if (!fsError || fsError.code === "EEXIST") {
                var filePath = path.join(projectPath, "flow.json"),
                    rs = fs.createReadStream(filePath),
                    ms = require('memorystream').createWriteStream();

                rs.on('end', function () {
                    var ret = ms.toString();
                    ms.destroy();
                    success(ret);
                });

                rs.on('error', function (err) {
                    ms.destroy();
                    fail(err);
                });

                rs.pipe(ms);
            } else {
                fail(fsError);
            }
        });
    } else {
        fail("Empty project id");
    }
};

/**
 * @description
 *
 * Get project's json content of external file information.
 *
 * @param projectId
 * @param success
 * @param fail
 */
UserFileController.prototype.getExternal = function (projectId, success, fail) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

        async.waterfall([
            function (next) {
                fs.mkdir(projectPath, 0777, function (fsError) {
                    if (!fsError || fsError.code === "EEXIST") {
                        next(null);
                    } else {
                        next(fsError);
                    }
                });
            },
            function (next) {
                var filePath = path.join(projectPath, "external.json");

                if (fs.existsSync(filePath)) {
                    var rs = fs.createReadStream(filePath),
                        ms = require('memorystream').createWriteStream();

                    rs.on('end', function () {
                        var ret = ms.toString();
                        ms.destroy();
                        next(null, ret);
                    });

                    rs.on('error', function (err) {
                        ms.destroy();
                        next(err);
                    });

                    rs.pipe(ms);
                } else {
                    fs.writeFile(filePath, "[]", function (err) {
                        next(err, "[]");
                    });
                }
            }
        ], function (err, result) {
            err && fail(err) || success(result);
        });
    } else {
        fail("Empty project id");
    }
};

/**
 * @description
 *
 * Download project's image by chunks.
 *
 * @param request
 * @param projectId
 * @param flowChunkNumber
 * @param flowFilename
 * @param success
 * @param fail
 */
UserFileController.prototype.getProjectImageChunk = function (request, projectId, flowChunkNumber, flowFilename, success, fail) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

        async.waterfall(
            [
                function (next) {
                    fs.mkdir(projectPath, 0777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            next(null);
                        } else {
                            next(fsError);
                        }
                    });
                },
                function (next) {
                    fs.mkdir(path.join(projectPath, "images"), 0777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            next(null);
                        } else {
                            next(fsError);
                        }
                    });
                }
            ], function (err) {
                if (!err) {
                    fail("", {statusCode: 404});
                } else {
                    fail(err, {statusCode: 500});
                }
            }
        );
    } else {
        fail(new Error(self.__('Empty Project Id')), {statusCode: 500});
    }
};

/**
 * @description
 *
 * Upload project's image by chunks.
 *
 * @param request
 * @param projectId
 * @param flowFilename
 * @param flowChunkNumber
 * @param flowTotalChunks
 * @param flowCurrentChunkSize
 * @param flowTotalSize
 * @param success
 * @param fail
 */
UserFileController.prototype.postProjectImageChunk = function (request, projectId, flowFilename, flowChunkNumber, flowTotalChunks, flowCurrentChunkSize, flowTotalSize, success, fail) {
    var self = this;

    if (toString.call(projectId) === '[object Array]' && projectId.length) projectId = projectId[0];
    if (toString.call(flowFilename) === '[object Array]' && flowFilename.length) flowFilename = flowFilename[0];
    if (toString.call(flowChunkNumber) === '[object Array]' && flowChunkNumber.length) flowChunkNumber = flowChunkNumber[0];
    if (toString.call(flowTotalChunks) === '[object Array]' && flowTotalChunks.length) flowTotalChunks = flowTotalChunks[0];
    if (toString.call(flowCurrentChunkSize) === '[object Array]' && flowCurrentChunkSize.length) flowCurrentChunkSize = flowCurrentChunkSize[0];
    if (toString.call(flowTotalSize) === '[object Array]' && flowTotalSize.length) flowTotalSize = flowTotalSize[0];

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

        async.waterfall(
            [
                function (next) {
                    fs.mkdir(projectPath, 0777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            next(null);
                        } else {
                            next(fsError);
                        }
                    });
                },
                function (next) {
                    fs.mkdir(path.join(projectPath, "images"), 0777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            next(null);
                        } else {
                            next(fsError);
                        }
                    });
                },
                function (next) {
                    self.fileController.postFile(request, path.join(projectPath, "images"), function (result) {
                        if (result && result.length) {
                            var folder = path.join(projectPath, "images"),
                                partName = flowFilename + ".part" + flowChunkNumber;

                            fs.rename(result[0], path.join(folder, partName), function (err) {
                                next(err, partName);
                            })
                        } else {
                            next("No files uploaded.");
                        }
                    }, next);
                }
            ], function (err, result) {
                if (!err) {
                    if (flowChunkNumber == flowTotalChunks) {
                        var folder = path.join(projectPath, "images"),
                            finalPath = path.join(folder, flowFilename);

                        async.waterfall(
                            [
                                function (next) {
                                    fs.unlink(finalPath, function (err) {
                                        if (err) {
                                            if (err.code !== "ENOENT") //Not Found
                                            {
                                                self.config.logger.error(err);
                                                next(err);
                                            }
                                            else {
                                                self.config.logger.warn(err);
                                                next(null);
                                            }
                                        } else {
                                            next(null);
                                        }
                                    });
                                },
                                function (next) {
                                    var startNumber = 0;

                                    async.whilst(
                                        function () {
                                            return startNumber < flowTotalChunks;
                                        },
                                        function (wCallback) {
                                            var partName = flowFilename + ".part" + (++startNumber),
                                                filePath = path.join(folder, partName);

                                            var raw = fs.createReadStream(filePath),
                                                dest = fs.createWriteStream(finalPath, {flags: "a"});

                                            dest.on('finish', function () {
                                                wCallback(null);
                                            });

                                            raw.on('error', function (err) {
                                                wCallback(err);
                                            });

                                            dest.on('error', function (err) {
                                                wCallback(err);
                                            });

                                            raw.pipe(dest);
                                        },
                                        function (err) {
                                            next(err);
                                        }
                                    );
                                },
                                function (next) {
                                    var startNumber = 0;

                                    async.whilst(
                                        function () {
                                            return startNumber < flowTotalChunks;
                                        },
                                        function (wCallback) {
                                            var partName = flowFilename + ".part" + (++startNumber),
                                                filePath = path.join(folder, partName);

                                            fs.unlink(filePath, function (err) {
                                                if (err) {
                                                    if (err.code !== "ENOENT") //Not Found
                                                    {
                                                        self.config.logger.error(err);
                                                        wCallback(err);
                                                    }
                                                    else {
                                                        self.config.logger.warn(err);
                                                        wCallback(null);
                                                    }
                                                } else {
                                                    wCallback(null);
                                                }
                                            });
                                        },
                                        function (err) {
                                            next(err);
                                        }
                                    );
                                },
                                function (next) {
                                    var renameTo = "" + _.now() + path.extname(flowFilename),
                                        renamePath = path.join(folder, renameTo);

                                    fs.rename(finalPath, renamePath, function (err) {
                                        next(err, renameTo);
                                    })
                                }
                            ],
                            function (err, result) {
                                if (!err) {
                                    success(result);
                                } else {
                                    fail(err, {statusCode: 500});
                                }
                            }
                        );
                    } else {
                        success(result);
                    }
                } else {
                    fail(err, {statusCode: 500});
                }
            }
        );
    } else {
        fail("Empty project id", {statusCode: 500});
    }
};

/**
 * @description
 *
 * @param projectId
 * @param fileName
 * @param success
 * @param fail
 */
UserFileController.prototype.deleteProjectImage = function (projectId, fileName, success, fail) {
    var self = this;

    if (projectId && fileName) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
            filePath = path.join(projectPath, "images", fileName);

        fs.unlink(filePath, function (err) {
            if (err && err.code !== "ENOENT") //Not Found
                fail(err);
            else
                success();
        })
    } else {
        fail("Empty project id or file name", {statusCode: 500});
    }
};

/**
 * @description
 *
 * Get json contetn listing project's resources.
 *
 * @param projectId
 * @param success
 * @param fail
 */
UserFileController.prototype.getProjectResource = function (projectId, success, fail) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
            resourceAllPath = path.join(projectPath, "resource");

        async.waterfall(
            [
                function (next) {
                    fs.mkdir(resourceAllPath, 0777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            next(null);
                        } else {
                            next(fsError);
                        }
                    });
                },
                function (next) {
                    fs.readdir(resourceAllPath, function (err, fileNames) {
                        if (err) {
                            next(err);
                        } else {
                            var folderList = [];

                            _.each(fileNames, function (fileName) {
                                var pathItem = path.join(resourceAllPath, fileName);
                                if (fs.lstatSync(pathItem).isDirectory()) {
                                    folderList.push(pathItem);
                                }
                            });

                            next(null, folderList);
                        }
                    });
                },
                function (folderList, next) {
                    var resources = {};

                    async.each(folderList, function (folder, callback) {
                        var resourceType = path.basename(folder);

                        resources[resourceType] = [];
                        fs.readdir(folder, function (err, fileNames) {
                            if (err) {
                                callback(err);
                            } else {
                                if (resourceType === "external") {
                                    _.each(fileNames, function (fileName) {
                                        var pathItem = path.join(folder, fileName);
                                        if (!/^\./.test(fileName)) {
                                            resources[resourceType].push(fileName);
                                        }
                                    });
                                } else {
                                    _.each(fileNames, function (fileName) {
                                        var pathItem = path.join(folder, fileName);
                                        if (!/^\./.test(fileName) && fs.lstatSync(pathItem).isFile()) {
                                            resources[resourceType].push(fileName);
                                        }
                                    });
                                }
                                callback(null);
                            }
                        });
                    }, function (err) {
                        next(err, resources);
                    });
                }
            ],
            function (err, result) {
                if (err) {
                    fail(err);
                } else {
                    success(result);
                }
            }
        );
    } else {
        fail("Empty project id", {statusCode: 500});
    }
};

/**
 * @description
 *
 * Upload project's resource in chunks.
 *
 * @param request
 * @param projectId
 * @param resourceType
 * @param flowFilename
 * @param flowChunkNumber
 * @param flowTotalChunks
 * @param flowCurrentChunkSize
 * @param flowTotalSize
 * @param success
 * @param fail
 */
UserFileController.prototype.postProjectResourceChunk = function (request, projectId, resourceType, flowFilename, flowChunkNumber, flowTotalChunks, flowCurrentChunkSize, flowTotalSize, success, fail) {
    var self = this;

    if (toString.call(projectId) === '[object Array]' && projectId.length) projectId = projectId[0];
    if (toString.call(resourceType) === '[object Array]' && resourceType.length) resourceType = resourceType[0];
    if (toString.call(flowFilename) === '[object Array]' && flowFilename.length) flowFilename = flowFilename[0];
    if (toString.call(flowChunkNumber) === '[object Array]' && flowChunkNumber.length) flowChunkNumber = flowChunkNumber[0];
    if (toString.call(flowTotalChunks) === '[object Array]' && flowTotalChunks.length) flowTotalChunks = flowTotalChunks[0];
    if (toString.call(flowCurrentChunkSize) === '[object Array]' && flowCurrentChunkSize.length) flowCurrentChunkSize = flowCurrentChunkSize[0];
    if (toString.call(flowTotalSize) === '[object Array]' && flowTotalSize.length) flowTotalSize = flowTotalSize[0];

    //FIXME How to forbid multiple uploads of the same resource up to the same project
    if (projectId && resourceType) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
            externalJsonPath = path.join(projectPath, "external.json"),
            resourceAllPath = path.join(projectPath, "resource"),
            resourcePath = path.join(resourceAllPath, resourceType);

        async.waterfall(
            [
                function (next) {
                    fs.mkdir(projectPath, 0777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            next(null);
                        } else {
                            next(fsError);
                        }
                    });
                },
                function (next) {
                    fs.mkdir(resourceAllPath, 0777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            next(null);
                        } else {
                            next(fsError);
                        }
                    });
                },
                function (next) {
                    fs.mkdir(resourcePath, 0777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            next(null);
                        } else {
                            next(fsError);
                        }
                    });
                },
                function (next) {
                    self.fileController.postFile(request, resourcePath, function (result) {
                        if (result && result.length) {
                            var partName = flowFilename + ".part" + flowChunkNumber;

                            fs.rename(result[0], path.join(resourcePath, partName), function (err) {
                                next(err);
                            })
                        } else {
                            next("No files uploaded.");
                        }
                    }, next);
                }
            ], function (err) {
                if (!err) {
                    if (flowChunkNumber == flowTotalChunks) {
                        var finalPath = path.join(resourcePath, flowFilename),
                            arr = [
                                function (next) {
                                    fs.unlink(finalPath, function (err) {
                                        if (err) {
                                            if (err.code !== "ENOENT") //Not Found
                                            {
                                                self.config.logger.error(err);
                                                next(err);
                                            }
                                            else {
                                                next(null);
                                            }
                                        } else {
                                            next(null);
                                        }
                                    });
                                },
                                function (next) {
                                    var startNumber = 0;

                                    async.whilst(
                                        function () {
                                            return startNumber < flowTotalChunks;
                                        },
                                        function (wCallback) {
                                            var partName = flowFilename + ".part" + (++startNumber),
                                                filePath = path.join(resourcePath, partName);

                                            var raw = fs.createReadStream(filePath),
                                                dest = fs.createWriteStream(finalPath, {flags: "a"});

                                            dest.on('finish', function () {
                                                wCallback(null);
                                            });

                                            raw.on('error', function (err) {
                                                wCallback(err);
                                            });

                                            dest.on('error', function (err) {
                                                wCallback(err);
                                            });

                                            raw.pipe(dest);
                                        },
                                        function (err) {
                                            next(err);
                                        }
                                    );
                                },
                                function (next) {
                                    var startNumber = 0;

                                    async.whilst(
                                        function () {
                                            return startNumber < flowTotalChunks;
                                        },
                                        function (wCallback) {
                                            var partName = flowFilename + ".part" + (++startNumber),
                                                filePath = path.join(resourcePath, partName);

                                            fs.unlink(filePath, function (err) {
                                                if (err) {
                                                    if (err.code !== "ENOENT") //Not Found
                                                    {
                                                        self.config.logger.error(err);
                                                        wCallback(err);
                                                    }
                                                    else {
                                                        wCallback(null);
                                                    }
                                                } else {
                                                    wCallback(null);
                                                }
                                            });
                                        },
                                        function (err) {
                                            next(err, flowFilename);
                                        }
                                    );
                                }
                            ];

                        if (resourceType === "audio") {
                            arr.push(
                                function (name, next) {
                                    var ext = path.extname(finalPath),
                                        basename = path.basename(finalPath);

                                    if (ext.toLowerCase() === ".mp3") {
                                        next(null, null, name);
                                    } else {
                                        var fileName = basename.replace(new RegExp(ext + "$", "i"), "");
                                        if (path.extname(fileName).toLowerCase() !== ".mp3") {
                                            fileName = fileName + ".mp3";
                                        }
                                        var mp3FilePath = path.join(path.dirname(finalPath), fileName);

                                        new FFmpeg({source: finalPath})
                                            .on('error', function (err) {
                                                next(err);
                                            })
                                            .on('end', function () {
                                                next(null, finalPath, fileName);
                                            })
                                            .withAudioCodec('libmp3lame')
                                            .saveToFile(mp3FilePath);
                                    }
                                });
                            arr.push(
                                function (wavFilePath, savedFileName, next) {
                                    if (wavFilePath) {
                                        fs.unlink(wavFilePath, function (err) {
                                            if (err) {
                                                if (err.code !== "ENOENT") //Not Found
                                                {
                                                    self.config.logger.error(err);
                                                    next(err);
                                                }
                                                else {
                                                    next(null, savedFileName);
                                                }
                                            } else {
                                                next(null, savedFileName);
                                            }
                                        });
                                    } else {
                                        next(null, savedFileName);
                                    }
                                });
                        } else if (resourceType === "external") {
                            var ext = path.extname(flowFilename),
                                filename = path.basename(flowFilename).replace(new RegExp(_.sprintf("\%s$", ext)), ''),
                                tmpFileName = path.join(self.config.userFile.tmpFolder, flowFilename),
                                tmpUnzipFolder = path.join(self.config.userFile.tmpFolder, filename),
                                targetFolder = path.join(resourcePath, filename),
                                resourceJsonPath = path.join(targetFolder, "external.json");

                            if (ext.toLowerCase() === ".zip") {
                                //Move to tmp folder and unzip there, move the unzipped folder back, remove processed file in tmp folder.
                                arr.push(
                                    function (name, next) {
                                        shelljs.exec(_.sprintf("mv %s %s", finalPath, tmpFileName), {silent: true}, function (code, output) {
                                            if (code) {
                                                next(output);
                                            } else {
                                                next(null, filename);
                                            }
                                        });
                                    }
                                );

                                arr.push(
                                    function (name, next) {
                                        rimraf(tmpUnzipFolder, function (err) {
                                            if (err && err.code !== "ENOENT") //Not Found
                                                next(err);
                                            else
                                                next(null, name);
                                        });
                                    }
                                );

                                arr.push(
                                    function (name, next) {
                                        shelljs.exec(_.sprintf("unzip -n %s -d %s", tmpFileName, self.config.userFile.tmpFolder), {silent: true}, function (code, output) {
                                            if (code) {
                                                next(output);
                                            } else {
                                                next(null, name);
                                            }
                                        });
                                    }
                                );

                                arr.push(
                                    function (name, next) {
                                        shelljs.exec(_.sprintf("rm %s", tmpFileName), {silent: true}, function (code, output) {
                                            if (code) {
                                                next(output);
                                            } else {
                                                next(null, name);
                                            }
                                        });
                                    }
                                );

                                arr.push(
                                    function (name, next) {
                                        shelljs.exec(_.sprintf("mv %s %s", tmpUnzipFolder, resourcePath), {silent: true}, function (code, output) {
                                            if (code) {
                                                next(output);
                                            } else {
                                                next(null, name);
                                            }
                                        });
                                    }
                                );

                                //Add resource reference into external.json
                                arr.push(function (name, next) {
                                    var rs = fs.createReadStream(externalJsonPath),
                                        ms = require('memorystream').createWriteStream();

                                    rs.on('end', function () {
                                        var str = ms.toString();
                                        ms.destroy();
                                        next(null, name, JSON.parse(str));
                                    });

                                    rs.on('error', function (err) {
                                        ms.destroy();
                                        if (err) {
                                            if (err.code !== "ENOENT") //Not Found
                                            {
                                                self.config.logger.error(err);
                                                next(err);
                                            }
                                            else {
                                                next(null, name, []);
                                            }
                                        } else {
                                            next(null, name, []);
                                        }
                                    });

                                    rs.pipe(ms);
                                });

                                arr.push(function (name, externalArr, next) {
                                    try {
                                        fs.statSync(resourceJsonPath);

                                        var rs = fs.createReadStream(resourceJsonPath),
                                            ms = require('memorystream').createWriteStream();

                                        rs.on('end', function () {
                                            var str = ms.toString();
                                            ms.destroy();

                                            var resourceItem = JSON.parse(str),
                                                foundItem = _.findWhere(externalArr, {name: resourceItem.name});
                                            foundItem && _.extend(foundItem, resourceItem) || externalArr.push(resourceItem);

                                            next(null, name, externalArr);
                                        });

                                        rs.on('error', function (err) {
                                            ms.destroy();
                                            next(err);
                                        });

                                        rs.pipe(ms);
                                    } catch (err) {
                                        next(err);
                                    }
                                });

                                arr.push(function (name, externalArr, next) {
                                    var out = fs.createWriteStream(externalJsonPath);

                                    out.on('finish', function () {
                                        next(null, name);
                                    });

                                    out.on('error', function (err) {
                                        next(err);
                                    });

                                    out.write(JSON.stringify(externalArr));
                                    out.end();
                                });
                            }
                        }

                        async.waterfall(
                            arr,
                            function (err, savedFileName) {
                                if (!err) {
                                    success(savedFileName);
                                } else {
                                    fail(err, {statusCode: 500});
                                }
                            }
                        );
                    } else {
                        success(resourceType === "external" ? path.basename(flowFilename) : flowFilename);
                    }
                } else {
                    fail(err, {statusCode: 500});
                }
            }
        );
    } else {
        fail("Empty project id or resource type", {statusCode: 500});
    }
};

/**
 * @description
 *
 * @param projectId
 * @param resourceType
 * @param fileName
 * @param success
 * @param fail
 */
UserFileController.prototype.deleteProjectResource = function (projectId, resourceType, fileName, success, fail) {
    var self = this;

    if (projectId && resourceType && fileName) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
            resourceAllPath = path.join(projectPath, "resource"),
            resourcePath = path.join(resourceAllPath, resourceType),
            filePath = path.join(resourcePath, fileName);

        if (fs.existsSync(filePath)) {
            var arr = [];

            if (resourceType === "external") {
                var externalJsonPath = path.join(projectPath, "external.json"),
                    targetFolder = path.join(resourcePath, fileName),
                    resourceJsonPath = path.join(targetFolder, "external.json");

                //Remove resource reference from external.json
                arr.push(function (next) {
                    try {
                        fs.statSync(externalJsonPath);
                        fs.statSync(resourceJsonPath);

                        var rs = fs.createReadStream(externalJsonPath),
                            ms = require('memorystream').createWriteStream();

                        rs.on('end', function () {
                            var str = ms.toString(),
                                externalArr;
                            ms.destroy();

                            try {
                                externalArr = JSON.parse(str);
                            } catch (err) {
                                self.config.logger.error(err);
                            }

                            next(null, externalArr);
                        });

                        rs.on('error', function (err) {
                            ms.destroy();
                            next(err);
                        });

                        rs.pipe(ms);
                    } catch (err) {
                        next(err);
                    }
                });

                arr.push(function (externalArr, next) {
                    if (externalArr && externalArr.length) {
                        var rs = fs.createReadStream(resourceJsonPath),
                            ms = require('memorystream').createWriteStream();

                        rs.on('end', function () {
                            var str = ms.toString();
                            ms.destroy();

                            var resourceItem = JSON.parse(str);
                            if (resourceItem) {
                                externalArr = _.reject(externalArr, function (item) {
                                    return item.name === resourceItem.name
                                });
                                next(null, externalArr);
                            } else {
                                next(null, externalArr);
                            }
                        });

                        rs.on('error', function (err) {
                            ms.destroy();
                            next(err);
                        });

                        rs.pipe(ms);
                    } else {
                        next(null, null);
                    }
                });

                arr.push(function (externalArr, next) {
                    if (externalArr) {
                        var out = fs.createWriteStream(externalJsonPath);

                        out.on('finish', function () {
                            next(null);
                        });

                        out.on('error', function (err) {
                            next(err);
                        });

                        out.write(JSON.stringify(externalArr));
                        out.end();
                    } else {
                        next(null);
                    }
                });
            }

            if (fs.lstatSync(filePath).isFile()) {
                arr.push(function (next) {
                    fs.unlink(filePath, function (err) {
                        if (err && err.code !== "ENOENT") //Not Found
                            next(err);
                        else
                            next(null);
                    })
                });
            } else if (fs.lstatSync(filePath).isDirectory()) {
                arr.push(function (next) {
                    rimraf(filePath, function (err) {
                        if (err && err.code !== "ENOENT") //Not Found
                            next(err);
                        else
                            next(null);
                    });
                });
            }

            async.waterfall(arr, function (err) {
                if (err) {
                    fail(err);
                } else {
                    success();
                }
            })
        } else {
            fail("Cannot find path.", {statusCode: 500});
        }
    } else {
        fail("Empty project id or resource type or file name", {statusCode: 500});
    }
};

/**
 * @description
 *
 * @param libraryFilter
 * @param success
 * @param fail
 */
UserFileController.prototype.getRepoLibrary = function (libraryFilter, success, fail) {
    var self = this;

    libraryFilter = (libraryFilter && JSON.parse(libraryFilter)) || {};
    if (libraryFilter._id) {
        libraryFilter._id = new self.db.Types.ObjectId(libraryFilter._id);
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.RepoLibrary.find(libraryFilter, function (err, data) {
                    next(err, data);
                })
            }
        ], function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
};

/**
 * @description
 *
 * @param artifactFilter
 * @param success
 * @param fail
 */
UserFileController.prototype.getRepoArtifact = function (artifactFilter, success, fail) {
    var self = this;

    artifactFilter = (artifactFilter && JSON.parse(artifactFilter)) || {};
    if (artifactFilter._id) {
        artifactFilter._id = new self.db.Types.ObjectId(artifactFilter._id);
    }
    if (artifactFilter.library) {
        artifactFilter.library = new self.db.Types.ObjectId(artifactFilter.library);
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.RepoArtifact.find(artifactFilter, function (err, data) {
                    next(err, data);
                })
            }
        ], function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
};

/**
 * @description
 *
 * @param projectFilter
 * @param success
 * @param fail
 */
UserFileController.prototype.getProject = function (projectFilter, success, fail) {
    var self = this;

    projectFilter = (projectFilter && JSON.parse(projectFilter)) || {};
    if (projectFilter._id) {
        projectFilter._id = new self.db.Types.ObjectId(projectFilter._id);
    }
    if (projectFilter.userId) {
        projectFilter.userId = new self.db.Types.ObjectId(projectFilter.userId);
    }
    if (projectFilter.lockUser) {
        projectFilter.lockUser = new self.db.Types.ObjectId(projectFilter.lockUser);
    }
    for (var key in projectFilter) {
        var value = projectFilter[key];
        if (value != null && typeof value === "string" && value.match(/^\/.+\/$/)) {
            projectFilter[key] = new RegExp(value.substr(1, value.length - 2));
        }
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.UserProject.find(projectFilter, function (err, data) {
                    next(err, data);
                })
            }
        ], function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
};

/**
 * @description
 *
 * Create new project and save its sketch json content. Generate qr svg file for the project.
 * Create project folder and its staging folder.
 *
 *
 * @param project
 * @param sketchWorks
 * @param success
 * @param fail
 */
UserFileController.prototype.postProject = function (project, sketchWorks, success, fail) {
    var self = this,
        now = new Date();

    project = (project && JSON.parse(project)) || {};
    if (project.userId) {
        project.userId = new self.db.Types.ObjectId(project.userId);
    }
    if (!project.createTime) {
        project.updateTime = project.createTime = now.getTime();
    }
    project.lock = false;
    project.lockUser = null;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.UserProject.create(project, function (err, data) {
                    if (!err) {
                        next(null, data);
                    } else {
                        next(err);
                    }
                })
            },
            function (data, next) {
                var projectId = data._id.toString(),
                    projectPath = path.join(self.config.userFile.sketchFolder, projectId),
                    stagingProjectPath = path.join(self.config.userFile.stagingFolder, projectId);

                async.each([projectPath, stagingProjectPath], function (pathItem, callback) {
                    fs.mkdir(pathItem, 0777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            callback(null);
                        } else {
                            callback(fsError);
                        }
                    });
                }, function (err) {
                    if (!err) {
                        var filePath = path.join(projectPath, "meelet.json"),
                            out = fs.createWriteStream(filePath);

                        out.on('finish', function () {
                            next(null, data);
                        });

                        out.on('error', function (err) {
                            next(err);
                        });

                        out.write(sketchWorks);
                        out.end();
                    } else {
                        next(err);
                    }
                });
            },
            function (data, next) {
                var projectId = data._id.toString(),
                    projectPath = path.join(self.config.userFile.sketchFolder, projectId);

                async.parallel([
                    function (cb) {
                        var filePath = path.join(projectPath, "qrcode.svg");

                        try {
                            var out = fs.createWriteStream(filePath),
                                qr_svg = qr.image("Id:" + projectId, {type: 'svg'});

                            out.on('finish', function () {
                                cb(null);
                            });

                            out.on('error', function (err) {
                                cb(err);
                            });

                            qr_svg.pipe(out);
                        } catch (err2) {
                            cb(err2);
                        }
                    },
                    function (cb) {
                        var filePath = path.join(projectPath, "qrcode.png");

                        try {
                            var out = fs.createWriteStream(filePath),
                                qr_png = qr.image("Id:" + projectId, {type: 'png'});

                            out.on('finish', function () {
                                cb(null);
                            });

                            out.on('error', function (err) {
                                cb(err);
                            });

                            qr_png.pipe(out);
                        } catch (err2) {
                            cb(err2);
                        }
                    }
                ], function (err) {
                    next(err, data);
                });
            }
        ], function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
};

/**
 * @description
 *
 * Update project record in db.
 *
 * @param projectFilter
 * @param project
 * @param success
 * @param fail
 */
UserFileController.prototype.putProject = function (projectFilter, project, success, fail) {
    var self = this,
        now = new Date();

    projectFilter = (projectFilter && JSON.parse(projectFilter)) || {};
    if (projectFilter._id) {
        projectFilter._id = new self.db.Types.ObjectId(projectFilter._id);
    }
    if (projectFilter.userId) {
        projectFilter.userId = new self.db.Types.ObjectId(projectFilter.userId);
    }
    if (projectFilter.lockUser) {
        projectFilter.lockUser = new self.db.Types.ObjectId(projectFilter.lockUser);
    }
    for (var key in projectFilter) {
        var value = projectFilter[key];
        if (value != null && typeof value === "string" && value.match(/^\/.+\/$/)) {
            projectFilter[key] = new RegExp(value.substr(1, value.length - 2));
        }
    }

    project = (project && JSON.parse(project)) || {};
    if (project.userId) {
        project.userId = new self.db.Types.ObjectId(project.userId);
    }
    if (project.lockUser) {
        project.lockUser = new self.db.Types.ObjectId(project.lockUser);
    }
    project.updateTime = now.getTime();

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.UserProject.findOneAndUpdate(projectFilter, {$set: _.omit(project, "_id")}, {multi: true}, function (err, data) {
        if (!err) {
            success({updateTime: now.getTime()});
        } else {
            fail(err);
        }
    });
};

/**
 * @description
 *
 * Delete project's record and its folder.
 *
 * @param projectFilter
 * @param success
 * @param fail
 */
UserFileController.prototype.deleteProject = function (projectFilter, success, fail) {
    var self = this;

    projectFilter = (projectFilter && JSON.parse(projectFilter)) || {};
    delete projectFilter.lock;//Only unlocked project can be deleted. The field should appears in filter param since it is always true.

    if (projectFilter._id) {
        projectFilter._id = new self.db.Types.ObjectId(projectFilter._id);
    }
    if (projectFilter.userId) {
        projectFilter.userId = new self.db.Types.ObjectId(projectFilter.userId);
    }
    if (projectFilter.lockUser) {
        projectFilter.lockUser = new self.db.Types.ObjectId(projectFilter.lockUser);
    }
    for (var key in projectFilter) {
        var value = projectFilter[key];
        if (value != null && typeof value === "string" && value.match(/^\/.+\/$/)) {
            projectFilter[key] = new RegExp(value.substr(1, value.length - 2));
        }
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.UserProject.find(projectFilter, function (err, data) {
                    next(err, data);
                });
            },
            function (data, next) {
                if (data && data.length) {
                    if (!data.every(function (item) {
                            return !item.lock;
                        })) {
                        fail(self.__('Delete Locked Project'));
                    } else {
                        self.schema.UserProject.remove(projectFilter, function (err) {
                            next(err, data);
                        });
                    }
                } else {
                    next(null, null);
                }
            },
            function (data, next) {
                if (data && data.length) {
                    async.each(data, function (item, callback) {
                        self.schema.ProjectArtifactXref.remove({projectId: item._id}, function (err) {
                            callback(err);
                        });
                    }, function (err) {
                        next(err, data);
                    });
                } else {
                    next(null, data);
                }
            },
            function (data, next) {
                if (data && data.length) {
                    async.each(data, function (item, callback) {
                        var projectId = item._id.toString(),
                            projectPath = path.join(self.config.userFile.sketchFolder, projectId),
                            stagingProjectPath = path.join(self.config.userFile.stagingFolder, projectId);

                        async.waterfall(
                            [
                                function (wCallback) {
                                    rimraf(projectPath, function (err) {
                                        if (err) {
                                            if (err.code !== "ENOENT") //Not Found
                                            {
                                                self.config.logger.error(err);
                                                wCallback(err);
                                            }
                                            else {
                                                self.config.logger.warn(err);
                                                wCallback(null);
                                            }
                                        } else {
                                            wCallback(null);
                                        }
                                    });
                                },
                                function (wCallback) {
                                    rimraf(stagingProjectPath, function (err) {
                                        if (err) {
                                            if (err.code !== "ENOENT") //Not Found
                                            {
                                                self.config.logger.error(err);
                                                wCallback(err);
                                            }
                                            else {
                                                self.config.logger.warn(err);
                                                wCallback(null);
                                            }
                                        } else {
                                            wCallback(null);
                                        }
                                    });
                                }
                            ],
                            function (err) {
                                callback(err);
                            }
                        );
                    }, function (err) {
                        next(err, data);
                    });
                } else {
                    next(null, data);
                }
            }
        ], function (err, data) {
            if (!err) {
                if (data && data.length) {
                    success(data);
                } else {
                    fail("Cannot find project to be deleted.");
                }
            } else {
                fail(err);
            }
        }
    );
};

/**
 * @description
 *
 * @param xrefFilter
 * @param success
 * @param fail
 */
UserFileController.prototype.getProjectArtifactXref = function (xrefFilter, success, fail) {
    var self = this;

    xrefFilter = (xrefFilter && JSON.parse(xrefFilter)) || {};
    if (xrefFilter.projectId) {
        xrefFilter.projectId = new self.db.Types.ObjectId(xrefFilter.projectId);
    }
    if (xrefFilter.libraryId) {
        xrefFilter.libraryId = new self.db.Types.ObjectId(xrefFilter.libraryId);
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.ProjectArtifactXref.find(xrefFilter, function (err, data) {
                    next(err, data);
                })
            }
        ], function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
};

/**
 * @description
 *
 * @param projectId
 * @param libraryId
 * @param artifactList
 * @param success
 * @param fail
 */
UserFileController.prototype.postProjectArtifactXref = function (projectId, libraryId, artifactList, success, fail) {
    var self = this,
        now = new Date();

    projectId = new self.db.Types.ObjectId(projectId);
    libraryId = new self.db.Types.ObjectId(libraryId);
    artifactList = (artifactList && JSON.parse(artifactList)) || [];
    artifactList = _.filter(artifactList, function (a) {
        return a && a.version && bson.ObjectId.isValid(a.artifactId) && (a.artifactId = new self.db.Types.ObjectId(a.artifactId));
    });

    //TODO artifactList(artifactId,version) needs to be checked against RepoArtifact collection.

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            async.parallel(
                {
                    project: function (pCallback) {
                        self.schema.UserProject.find({_id: projectId}, function (err, data) {
                            pCallback(err, data);
                        })
                    },
                    library: function (pCallback) {
                        self.schema.RepoLibrary.find({
                            _id: libraryId
                        }, function (err, data) {
                            pCallback(err, data);
                        })
                    },
                    xref: function (pCallback) {
                        self.schema.ProjectArtifactXref.find({
                            libraryId: libraryId,
                            projectId: projectId
                        }, function (err, data) {
                            pCallback(err, data);
                        })
                    }
                },
                function (err, selectionDetail) {
                    if (!err) {
                        if (!selectionDetail.project.length) {
                            next(new Error(self.__('Cannot Find Project', projectId)));
                        } else if (!selectionDetail.library.length) {
                            next(new Error(self.__('Cannot Find Repo', libraryId)));
                        } else {
                            next(null, selectionDetail.xref, selectionDetail.library);
                        }
                    } else {
                        next(err);
                    }
                }
            );
        },
        function (xref, library, next) {
            if (xref.length) {
                self.schema.ProjectArtifactXref.update({
                    libraryId: libraryId,
                    projectId: projectId
                }, {$set: {artifactList: artifactList, updateTime: now}}, {multi: true}, function (err) {
                    next(err);
                });
            } else {
                self.schema.ProjectArtifactXref.create({
                    projectId: projectId,
                    libraryId: libraryId,
                    libraryName: library[0].name,
                    type: library[0].type,
                    artifactList: artifactList,
                    createTime: now.getTime(),
                    updateTime: now.getTime()
                }, function (err) {
                    next(err);
                });
            }
        }
    ], function (err) {
        if (!err) {
            success();
        } else {
            fail(err);
        }
    });
};

/**
 * @description
 *
 * @param xrefFilter
 * @param success
 * @param fail
 */
UserFileController.prototype.deleteProjectArtifactXref = function (xrefFilter, success, fail) {
    var self = this;

    xrefFilter = (xrefFilter && JSON.parse(xrefFilter)) || {};
    if (xrefFilter.projectId) {
        xrefFilter.projectId = new self.db.Types.ObjectId(xrefFilter.projectId);
    }
    if (xrefFilter.libraryId) {
        xrefFilter.libraryId = new self.db.Types.ObjectId(xrefFilter.libraryId);
    }
    //Cannot delete record with refCount greater than 0
    xrefFilter["artifactList.refCount"] = {$not: {$gt: 0}}

        (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.ProjectArtifactXref.remove(xrefFilter, function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
};

/**
 * @description
 *
 * Generate html content for locked project.
 *
 * @param userId
 * @param projectId
 * @param success
 * @param fail
 */
UserFileController.prototype.postConvertToHtml = function (userId, projectId, success, fail) {
    var self = this;

    if (projectId) {
        (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
            [
                function (wCallback) {
                    self.schema.UserProject.find({
                        _id: new self.db.Types.ObjectId(projectId),
                        lock: true,
                        lockUser: new self.db.Types.ObjectId(userId)
                    }, function (err, data) {
                        if (err) {
                            wCallback(err);
                        } else {
                            if (data && data.length) {
                                wCallback(null, data[0]);
                            } else {
                                wCallback(self.__('Cannot Find Project', projectId));
                            }
                        }
                    });
                },
                function (projectObj, wCallback) {
                    self.schema.ProjectArtifactXref.find({projectId: new self.db.Types.ObjectId(projectId)}, function (err, data) {
                        if (err) {
                            wCallback(err);
                        } else {
                            var artifactList = [];
                            data && data.forEach(function (xref) {
                                xref.artifactList && xref.artifactList.forEach(function (artifact) {
                                    artifactList.push({
                                        type: xref.type,
                                        libraryName: xref.libraryName,
                                        artifactId: artifact.artifactId.toString(),
                                        version: artifact.version
                                    });
                                });
                            });

                            wCallback(null, projectObj.type, artifactList);
                        }
                    });
                },
                function (projectType, artifactList, wCallback) {
                    var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

                    commons.convertToHtml(projectType, projectPath, artifactList, function (err, htmlPath) {
                        if (err) {
                            wCallback(err);
                        } else {
                            wCallback(null, htmlPath);
                        }
                    })
                }
            ],
            function (err, htmlPath) {
                err && fail(err) || success({htmlPath: htmlPath});
            }
        );
    } else {
        fail("Empty project id");
    }
};

/**
 * @description
 *
 * Download project zipped content. If the project json content is newer than zipped file, recreate the zipped file.
 *
 * @param projectId
 * @param request
 * @param success
 * @param fail
 */
UserFileController.prototype.getProjectFile = function (projectId, request, success, fail) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
            meeletPath = path.join(projectPath, self.config.settings.meeletFile),
            zipPath = path.join(self.config.settings.download.folder, projectId + ".zip");

        if (fs.existsSync(projectPath)) {
            async.waterfall(
                [
                    function (next) {
                        var pObj = {
                            meeletTime: function (pCallback) {
                                fs.stat(meeletPath, function (err, stat) {
                                    if (err) {
                                        pCallback(err);
                                    } else {
                                        pCallback(null, stat.mtime.getTime());
                                    }
                                });
                            },
                            projectObj: function (pCallback) {
                                self.schema.UserProject.find({_id: new self.db.Types.ObjectId(projectId)}, function (err, data) {
                                    pCallback(err, data[0]);
                                });
                            }
                        };

                        pObj.zipFileTime = function (pCallback) {
                            fs.stat(zipPath, function (err, stat) {
                                if (err) {
                                    if (err.code !== "ENOENT") //Not Found
                                        pCallback(err);
                                    else
                                        pCallback(null, 0);
                                } else {
                                    pCallback(null, stat.mtime.getTime());
                                }
                            });
                        };

                        async.parallel(pObj, function (err, results) {
                            if (err) next(err);

                            next(null, results.meeletTime > results.zipFileTime && results.projectObj);
                        })
                    },
                    function (projectObj, next) {
                        if (projectObj) {
                            var tmpPath = path.join(self.config.userFile.tmpFolder, _.string.sprintf("%s-%d.zip", projectId, _.now())),
                                out = fs.createWriteStream(tmpPath),
                                cZip = new zipCtor();

                            _.extend(cZip.options, {
                                ignoreHidden: true,
                                ignorePaths: ["stylesheets/sass", "stylesheets/repo", /app\/repo\/.+\/stylesheets\/sass$/g]
                            });

                            out.on('finish', function () {
                                next(null, tmpPath);
                            });

                            cZip.on('error', function (err) {
                                next(err);
                            });

                            out.on('error', function (err) {
                                next(err);
                            });

                            cZip.pipe(out);
                            cZip.directory(projectPath, false);

                            cZip.finalize();
                        } else {
                            next(null, null);
                        }
                    },
                    function (tmpPath, next) {
                        var fileName = path.basename(zipPath);

                        if (tmpPath) {
                            var src = fs.createReadStream(tmpPath),
                                dest = fs.createWriteStream(zipPath);

                            dest.on('finish', function () {
                                next(null, fileName);
                            });

                            src.on('error', function (err) {
                                next(err);
                            });

                            dest.on('error', function (err) {
                                next(err);
                            });

                            src.pipe(dest);
                        } else {
                            next(null, fileName);
                        }
                    }
                ],
                function (err, fileName) {
                    if (err) {
                        fail(err);
                    } else {
                        self.fileController.getFile(fileName, request.headers, success, fail);
                    }
                }
            );
        } else {
            fail("Project does not exist");
        }
    } else {
        fail("Empty project id");
    }
};

/**
 * @description
 *
 * Compare the mtime of module zip file and module source folder. If the former older, regenerate zip file.
 * Then download the result zip file if it's newer than the date set in 'if-modified-since' header.
 *
 * @param request
 * @param success
 * @param fail
 */
UserFileController.prototype.getModuleFile = function (request, success, fail) {
    var self = this,
        projectModulePath = self.config.userFile.projectModuleFolder,
        zipPath = path.join(self.config.settings.download.folder, "modules.zip");

    //FIXME Generate zip file and copy to download folder should be synchronized.
    async.waterfall(
        [
            function (next) {
                var mObj = {
                    moduleTime: function (pCallback) {
                        fs.stat(projectModulePath, function (err, stat) {
                            if (err) {
                                pCallback(err);
                            } else {
                                pCallback(null, stat.mtime.getTime());
                            }
                        });
                    },
                    zipFileTime: function (pCallback) {
                        fs.stat(zipPath, function (err, stat) {
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
                };

                async.parallel(mObj, function (err, results) {
                    if (err) next(err);

                    next(null, results.moduleTime > results.zipFileTime);
                });
            },
            function (isNew, next) {
                if (isNew) {
                    var tmpPath = path.join(self.config.userFile.tmpFolder, _.string.sprintf("modules-%d.zip", _.now())),
                        out = fs.createWriteStream(tmpPath),
                        cZip = new zipCtor();

                    out.on('finish', function () {
                        next(null, tmpPath);
                    });

                    cZip.on('error', function (err) {
                        next(err);
                    });

                    out.on('error', function (err) {
                        next(err);
                    });

                    cZip.pipe(out);
                    cZip.directory(projectModulePath, false);

                    cZip.finalize();
                } else {
                    next(null, null);
                }
            },
            function (tmpPath, next) {
                var fileName = path.basename(zipPath);

                if (tmpPath) {
                    var src = fs.createReadStream(tmpPath),
                        dest = fs.createWriteStream(zipPath);

                    dest.on('finish', function () {
                        next(null, fileName);
                    });

                    src.on('error', function (err) {
                        next(err);
                    });

                    dest.on('error', function (err) {
                        next(err);
                    });

                    src.pipe(dest);
                } else {
                    next(null, fileName);
                }
            }
        ],
        function (err, fileName) {
            if (err) {
                fail(err);
            } else {
                self.fileController.getFile(fileName, request.headers, success, fail);
            }
        }
    );
};

module.exports = UserFileController;
