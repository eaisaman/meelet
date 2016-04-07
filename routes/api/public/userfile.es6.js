var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var shelljs = require('shelljs');
var _ = require('underscore');
var bson = require('bson');
var qr = require('qr-image');
var FFmpeg = require('fluent-ffmpeg');
_.string = require('underscore.string');
_.mixin(_.string.exports());
var commons = require('../../../commons');
var mkdirp = require("mkdirp");
var co = require("co");

class zipCtor {
    constructor() {
        _.extend(this, require('archiver')('zip'));

        delete this.directory;
    }

    directory(dirpath, destpath, data) {
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
    }
}

class UserFileController {
    constructor(fields) {
        let self = this;

        if (typeof fields == "object") {
            Object.assign(this, fields);
        }

        self.config = require('../../../config');
        self.__ = self.config.i18n.__;
        self.config.on(self.config.ApplicationDBConnectedEvent, function (resource) {

            self.db = resource.instance;
            self.schema = resource.schema;
            self.isDBReady = true;
        });

    }

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
    postSketch(projectId, sketchWorks, stagingContent, request, success, fail) {
        var self = this;

        if (projectId) {
            stagingContent = (stagingContent && JSON.parse(stagingContent)) || {};

            co.wrap(function*(projectId, sketchWorks, stagingContent) {
                var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
                    cssPath = path.join(projectPath, "stylesheets"),
                    sassPath = path.join(cssPath, "repo"),
                    stagingProjectPath = path.join(self.config.userFile.stagingFolder, projectId);

                yield new Promise(function (resolve, reject) {
                    fs.mkdir(projectPath, 0o777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            var filePath = path.join(projectPath, "meelet.json"),
                                out = fs.createWriteStream(filePath);

                            out.on('finish', function () {
                                resolve();
                            });

                            out.on('error', function (err) {
                                reject(err);
                            });

                            out.write(sketchWorks);
                            out.end();
                        } else {
                            reject(fsError);
                        }
                    });
                });

                var pendingWidgetList = stagingContent.widgetList || [],
                    removeWidgetList = stagingContent.removeWidgetList || [];

                if (pendingWidgetList.length || removeWidgetList.length) {
                    yield Promise.all(
                        Array.prototype.concat.apply(Array.prototype,
                            Array.prototype.concat.apply(Array.prototype, [pendingWidgetList, removeWidgetList]).map(
                                function (widgetItem) {
                                    var widgetId = widgetItem.widgetId,
                                        widgetConfigurationPath = path.join(stagingProjectPath, _.string.sprintf("_configuration-%s.scss", widgetId)),
                                        widgetScssPath = path.join(stagingProjectPath, _.string.sprintf("configurable-widget-%s.scss", widgetId)),
                                        widgetCssPath = path.join(stagingProjectPath, _.string.sprintf("configurable-widget-%s.css", widgetId));

                                    return [widgetConfigurationPath, widgetScssPath, widgetCssPath];
                                }
                            )).map(function (pathItem) {
                                return new Promise(
                                    function (resolve, reject) {
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
                                    }
                                );
                            }
                        ));
                }

                //Remove files of deleted widgets
                if (stagingContent.removeWidgetList.length) {
                    yield Promise.all(
                        Array.prototype.concat.apply(Array.prototype, stagingContent.removeWidgetList.map(function (widgetItem) {
                            var artifactId = widgetItem.artifactId,
                                widgetId = widgetItem.widgetId,
                                configPath = path.join(sassPath, artifactId),
                                widgetConfigPath = path.join(configPath, _.string.sprintf("_configuration-%s.scss", widgetId)),
                                widgetScssPath = path.join(configPath, _.string.sprintf("configurable-widget-%s.scss", widgetId)),
                                widgetCssPath = path.join(cssPath, _.string.sprintf("configurable-widget-%s.css", widgetId));

                            return [widgetConfigPath, widgetScssPath, widgetCssPath];
                        })).map(function (pathItem) {
                                return new Promise(function (resovle, reject) {
                                    fs.unlink(pathItem, function (err) {
                                        if (err) {
                                            if (err.code !== "ENOENT") //Not Found
                                            {
                                                self.config.logger.error(err);
                                                reject(err);
                                            }
                                            else {
                                                self.config.logger.warn(err);
                                                resovle();
                                            }
                                        } else {
                                            resovle();
                                        }
                                    });
                                });
                            }
                        ));
                }

                //Read remaining links in staging folder
                let orphanLinkList = yield new Promise(function (resolve, reject) {
                    fs.readdir(stagingProjectPath, function (err, fileNames) {
                        if (err) {
                            reject(err);
                        } else {
                            var orphanLinkList = [];

                            _.each(fileNames, function (fileName) {
                                var pathItem = path.join(stagingProjectPath, fileName);
                                if (fs.lstatSync(pathItem).isSymbolicLink()) {
                                    orphanLinkList.push(pathItem);
                                }
                            });

                            resolve(orphanLinkList);
                        }
                    });
                });

                //Get staging links' targeted files.
                if (orphanLinkList.length) {
                    let orphanFileList = yield Promise.all(orphanLinkList.map(
                        function (linkItem) {
                            return new Promise(function (resolve, reject) {
                                fs.readlink(linkItem, function (err, resolvedPath) {
                                    if (err) {
                                        self.config.logger.warn(err);
                                    }

                                    resolve(resolvedPath);
                                });
                            });
                        }
                    ));

                    //Remove orphan files
                    yield Promise.all(
                        Array.prototype.concat.apply(Array.prototype, [orphanFileList, orphanLinkList]).map(
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
                }
            })(projectId, sketchWorks, stagingContent).then(
                function () {
                    success();
                }, function (err) {
                    fail(err);
                }
            );
        } else {
            fail(self._("Empty Project Id"));
        }
    }

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
    postFlow(projectId, flowWorks, request, success, fail) {
        var self = this;

        if (projectId) {
            var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

            fs.mkdir(projectPath, 0o777, function (fsError) {
                if (!fsError || fsError.code === "EEXIST") {
                    var filePath = path.join(projectPath, "flow.json"),
                        out = fs.createWriteStream(filePath);

                    out.on('finish', function () {
                        success(null);
                    });

                    out.on('error', function (err) {
                        fail(err);
                    });

                    out.write(flowWorks);
                    out.end();
                } else {
                    fail(fsError);
                }
            });
        } else {
            fail(self._("Empty Project Id"));
        }
    }

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
    postConfigurableArtifact(projectId, widgetId, libraryName, artifactId, type, version, success, fail) {
        var self = this;

        if (projectId) {
            commons.addConfigurableArtifact(projectId, widgetId, libraryName, artifactId, type, version, function (err, cssName) {
                if (!err) {
                    success({css: cssName});
                } else {
                    fail(err);
                }
            })
        } else {
            fail(self._("Empty Project Id"));
        }
    }

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
    deleteConfigurableArtifact(projectId, widgetId, artifactId, success, fail) {
        var self = this;

        if (projectId) {
            commons.removeConfigurableArtifact(projectId, widgetId, artifactId, function (err) {
                if (!err) {
                    success();
                } else {
                    fail(err);
                }
            })
        } else {
            fail(self._("Empty Project Id"));
        }
    }

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
    putConfigurableArtifact(projectId, widgetId, artifactId, configuration, success, fail) {
        var self = this;

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
            fail(self._("Empty Project Id"));
        }
    }

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
    getSketch(projectId, success, fail) {
        var self = this;

        if (projectId) {
            var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

            fs.mkdir(projectPath, 0o777, function (fsError) {
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
            fail(self._("Empty Project Id"));
        }
    }

    /**
     * @description
     *
     * Return flow project's json content.
     *
     * @param projectId
     * @param success
     * @param fail
     */
    getFlow(projectId, success, fail) {
        var self = this;

        if (projectId) {
            var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

            fs.mkdir(projectPath, 0o777, function (fsError) {
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
            fail(self._("Empty Project Id"));
        }
    }

    /**
     * @description
     *
     * Get project's json content of external file information.
     *
     * @param projectId
     * @param success
     * @param fail
     */
    getExternal(projectId, success, fail) {
        var self = this;

        if (projectId) {
            var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

            fs.mkdir(projectPath, 0o777, function (fsError) {
                if (!fsError || fsError.code === "EEXIST") {
                    var filePath = path.join(projectPath, "external.json");

                    if (fs.existsSync(filePath)) {
                        var rs = fs.createReadStream(filePath),
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
                        fs.writeFile(filePath, "[]", function (err) {
                            if (err) {
                                fail(err);
                            } else {
                                success("[]");
                            }
                        });
                    }
                } else {
                    fail(fsError);
                }
            });
        } else {
            fail("Empty Project Id");
        }
    }

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
    postProjectImageChunk(request, projectId, flowFilename, flowChunkNumber, flowTotalChunks, flowCurrentChunkSize, flowTotalSize, success, fail) {
        var self = this;

        projectId = commons.getFormString(projectId);
        flowFilename = commons.getFormString(flowFilename);
        flowChunkNumber = commons.getFormInt(flowChunkNumber);
        flowTotalChunks = commons.getFormInt(flowTotalChunks);
        flowCurrentChunkSize = commons.getFormInt(flowCurrentChunkSize);
        flowTotalSize = commons.getFormInt(flowTotalSize);

        if (projectId) {
            var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

            co(function*() {
                yield new Promise(function (resolve, reject) {
                    mkdirp(path.join(projectPath, "images"), 0o755, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            resolve();
                        } else {
                            reject(fsError);
                        }
                    });
                });

                yield new Promise(function (resolve, reject) {
                    self.fileController.postFile(request, path.join(projectPath, "images"), function (result) {
                        if (result && result.length) {
                            var folder = path.join(projectPath, "images"),
                                partName = flowFilename + ".part" + flowChunkNumber;

                            fs.rename(result[0], path.join(folder, partName), function (err) {
                                err && reject(err) || resolve();
                            })
                        } else {
                            reject("No files uploaded.");
                        }
                    }, reject);
                });

                if (flowChunkNumber == flowTotalChunks) {
                    var folder = path.join(projectPath, "images"),
                        finalPath = path.join(folder, flowFilename);

                    yield new Promise(function (resolve, reject) {
                        fs.unlink(finalPath, function (err) {
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

                    var chunkFiles = [];
                    for (var startNumber = 0; startNumber < flowTotalChunks; startNumber++) {
                        var partName = flowFilename + ".part" + startNumber,
                            filePath = path.join(folder, partName);

                        chunkFiles.push(filePath);
                        yield new Promise(function (resolve, reject) {
                            var raw = fs.createReadStream(filePath),
                                dest = fs.createWriteStream(finalPath, {flags: "a"});

                            dest.on('finish', function () {
                                resolve();
                            });

                            raw.on('error', function (err) {
                                reject(err);
                            });

                            dest.on('error', function (err) {
                                reject(err);
                            });

                            raw.pipe(dest);
                        });
                    }

                    yield Promise.all(chunkFiles.map(function (filePath) {
                        return new Promise(function (resolve, reject) {
                            fs.unlink(filePath, function (err) {
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
                    }));
                }
            }).then(
                function () {
                    success();
                }, function (err) {
                    fail(err, {statusCode: 500});
                }
            );
        } else {
            fail(self._("Empty Project Id"), {statusCode: 500});
        }
    }

    /**
     * @description
     *
     * @param projectId
     * @param fileName
     * @param success
     * @param fail
     */
    deleteProjectImage(projectId, fileName, success, fail) {
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
            fail("Empty Project Id or file name", {statusCode: 500});
        }
    }

    /**
     * @description
     *
     * Get json contetn listing project's resources.
     *
     * @param projectId
     * @param success
     * @param fail
     */
    getProjectResource(projectId, success, fail) {
        if (projectId) {
            var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
                resourceAllPath = path.join(projectPath, "resource");

            co(function*() {
                yield new Promise(function (resolve, reject) {
                    fs.mkdir(resourceAllPath, 0o777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            resolve();
                        } else {
                            reject(fsError);
                        }
                    });
                });

                let folderList = yield new Promise(function (resolve, reject) {
                    fs.readdir(resourceAllPath, function (err, fileNames) {
                        if (!err) {
                            var folderList = [];

                            _.each(fileNames, function (fileName) {
                                var pathItem = path.join(resourceAllPath, fileName);
                                if (fs.lstatSync(pathItem).isDirectory()) {
                                    folderList.push(pathItem);
                                }
                            });

                            resolve(folderList);
                        } else {
                            reject(err);
                        }
                    });
                });

                var resources = {};
                folderList.forEach(function (folder) {
                    var resourceType = path.basename(folder);

                    if (resourceType === "external") {
                        resources[resourceType] = new Promise(function (resolve, reject) {
                            fs.readdir(folder, function (err, fileNames) {
                                if (err) {
                                    reject(err);
                                } else {
                                    var files = [];
                                    _.each(fileNames, function (fileName) {
                                        var pathItem = path.join(folder, fileName);
                                        if (!/^\./.test(fileName)) {
                                            files.push(fileName);
                                        }
                                    });
                                    resolve(files);
                                }
                            });
                        });
                    } else {
                        resources[resourceType] = new Promise(function (resolve, reject) {
                            fs.readdir(folder, function (err, fileNames) {
                                if (err) {
                                    reject(err);
                                } else {
                                    var files = [];
                                    _.each(fileNames, function (fileName) {
                                        var pathItem = path.join(folder, fileName);
                                        if (!/^\./.test(fileName) && fs.lstatSync(pathItem).isFile()) {
                                            files.push(fileName);
                                        }
                                    });
                                    resolve(files);
                                }
                            });
                        });
                    }
                });

                yield resources;
            }).then(function (result) {
                success(result);
            }, function (err) {
                fail(err);
            });
        } else {
            fail(self._("Empty Project Id"), {statusCode: 500});
        }
    }

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
    postProjectResourceChunk(request, projectId, resourceType, flowFilename, flowChunkNumber, flowTotalChunks, flowCurrentChunkSize, flowTotalSize, success, fail) {
        //FIXME How to forbid multiple uploads of the same resource up to the same project

        var self = this;

        projectId = commons.getFormString(projectId);
        resourceType = commons.getFormString(resourceType);
        flowFilename = commons.getFormString(flowFilename);
        flowChunkNumber = commons.getFormInt(flowChunkNumber);
        flowTotalChunks = commons.getFormInt(flowTotalChunks);
        flowCurrentChunkSize = commons.getFormInt(flowCurrentChunkSize);
        flowTotalSize = commons.getFormInt(flowTotalSize);

        if (projectId && resourceType) {
            var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
                resourcePath = path.join(projectPath, "resource", resourceType);

            co(function*() {
                yield new Promise(function (resolve, reject) {
                    mkdirp(resourcePath, 0o755, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            resolve();
                        } else {
                            reject(fsError);
                        }
                    });
                });

                yield new Promise(function (resolve, reject) {
                    self.fileController.postFile(request, resourcePath, function (result) {
                        if (result && result.length) {
                            var partName = flowFilename + ".part" + flowChunkNumber;

                            fs.rename(result[0], path.join(resourcePath, partName), function (err) {
                                err && reject(err) || resolve();
                            })
                        } else {
                            reject("No files uploaded.");
                        }
                    }, reject);
                });

                if (flowChunkNumber == flowTotalChunks) {
                    var finalPath = path.join(resourcePath, flowFilename);

                    yield new Promise(function (resolve, reject) {
                        fs.unlink(finalPath, function (err) {
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

                    var chunkFiles = [];
                    for (var startNumber = 0; startNumber < flowTotalChunks; startNumber++) {
                        var partName = flowFilename + ".part" + startNumber,
                            filePath = path.join(resourcePath, partName);

                        chunkFiles.push(filePath);
                        yield new Promise(function (resolve, reject) {
                            var raw = fs.createReadStream(filePath),
                                dest = fs.createWriteStream(finalPath, {flags: "a"});

                            dest.on('finish', function () {
                                resolve();
                            });

                            raw.on('error', function (err) {
                                reject(err);
                            });

                            dest.on('error', function (err) {
                                reject(err);
                            });

                            raw.pipe(dest);
                        });
                    }

                    yield Promise.all(chunkFiles.map(function (filePath) {
                        return new Promise(function (resolve, reject) {
                            fs.unlink(filePath, function (err) {
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
                    }));

                    if (resourceType === "audio") {
                        var ext = path.extname(finalPath),
                            basename = path.basename(finalPath);

                        if (ext.toLowerCase() !== ".mp3") {
                            var fileName = basename.replace(new RegExp(ext + "$", "i"), "");
                            if (path.extname(fileName).toLowerCase() !== ".mp3") {
                                fileName = fileName + ".mp3";
                            }
                            var mp3FilePath = path.join(path.dirname(finalPath), fileName);

                            yield new Promise(function (resolve, reject) {
                                new FFmpeg({source: finalPath})
                                    .on('error', function (err) {
                                        reject(err);
                                    })
                                    .on('end', function () {
                                        resolve();
                                    })
                                    .withAudioCodec('libmp3lame')
                                    .saveToFile(mp3FilePath);
                            });

                            yield new Promise(function (resolve, reject) {
                                fs.unlink(finalPath, function (err) {
                                    if (err) {
                                        if (err.code !== "ENOENT") //Not Found
                                        {
                                            self.config.logger.error(err);
                                            reject(err);
                                        }
                                        else {
                                            resolve();
                                        }
                                    } else {
                                        resolve();
                                    }
                                });
                            });
                        }
                    } else if (resourceType === "external") {
                        var ext = path.extname(flowFilename),
                            filename = path.basename(flowFilename).replace(new RegExp(_.sprintf("\%s$", ext)), ''),
                            tmpFileName = path.join(self.config.userFile.tmpFolder, flowFilename),
                            tmpUnzipFolder = path.join(self.config.userFile.tmpFolder, filename),
                            targetFolder = path.join(resourcePath, filename),
                            resourceJsonPath = path.join(targetFolder, "external.json");

                        if (ext.toLowerCase() === ".zip") {
                            //Move to tmp folder and unzip there, move the unzipped folder back, remove processed file in tmp folder.
                            yield new Promise(function (resolve, reject) {
                                shelljs.exec(_.sprintf("mv %s %s", finalPath, tmpFileName), {silent: true}, function (code, output) {
                                    if (code) {
                                        reject(output);
                                    } else {
                                        resolve();
                                    }
                                });
                            });

                            yield new Promise(function (resolve, reject) {
                                rimraf(tmpUnzipFolder, function (err) {
                                    if (err && err.code !== "ENOENT") //Not Found
                                        reject(err);
                                    else
                                        resolve();
                                });
                            });

                            yield new Promise(function (resolve, reject) {
                                shelljs.exec(_.sprintf("unzip -n %s -d %s", tmpFileName, self.config.userFile.tmpFolder), {silent: true}, function (code, output) {
                                    if (code) {
                                        reject(output);
                                    } else {
                                        resolve();
                                    }
                                });
                            });

                            yield new Promise(function (resolve, reject) {
                                shelljs.exec(_.sprintf("rm %s", tmpFileName), {silent: true}, function (code, output) {
                                    if (code) {
                                        reject(output);
                                    } else {
                                        resolve();
                                    }
                                });
                            });

                            yield new Promise(function (resolve, reject) {
                                shelljs.exec(_.sprintf("mv %s %s", tmpUnzipFolder, resourcePath), {silent: true}, function (code, output) {
                                    if (code) {
                                        reject(output);
                                    } else {
                                        resolve();
                                    }
                                });
                            });

                            //Add resource reference into external.json
                            var externalJsonPath = path.join(projectPath, "external.json");
                            let externalArr = yield new Promise(function (resolve, reject) {
                                var rs = fs.createReadStream(externalJsonPath),
                                    ms = require('memorystream').createWriteStream();

                                rs.on('end', function () {
                                    var str = ms.toString();
                                    ms.destroy();
                                    resolve(JSON.parse(str));
                                });

                                rs.on('error', function (err) {
                                    ms.destroy();
                                    if (err) {
                                        if (err.code !== "ENOENT") //Not Found
                                        {
                                            self.config.logger.error(err);
                                            reject(err);
                                        }
                                        else {
                                            resolve([]);
                                        }
                                    } else {
                                        resolve([]);
                                    }
                                });

                                rs.pipe(ms);
                            });

                            let unzippedExternalItem = yield new Promise(function (resolve, reject) {
                                try {
                                    fs.statSync(resourceJsonPath);

                                    var rs = fs.createReadStream(resourceJsonPath),
                                        ms = require('memorystream').createWriteStream();

                                    rs.on('end', function () {
                                        var str = ms.toString();
                                        ms.destroy();

                                        var resourceItem = JSON.parse(str),
                                            foundItem = _.findWhere(externalArr, {name: resourceItem.name});
                                        if (foundItem) {
                                            Object.assign(foundItem, resourceItem);
                                            resolve();
                                        } else {
                                            resolve(resourceItem);
                                        }
                                    });

                                    rs.on('error', function (err) {
                                        ms.destroy();
                                        reject(err);
                                    });

                                    rs.pipe(ms);
                                } catch (err) {
                                    reject(err);
                                }
                            });
                            if (unzippedExternalItem) externalArr.push(unzippedExternalItem);

                            yield new Promise(function (resolve, reject) {
                                var out = fs.createWriteStream(externalJsonPath);

                                out.on('finish', function () {
                                    resolve();
                                });

                                out.on('error', function (err) {
                                    reject(err);
                                });

                                out.write(JSON.stringify(externalArr));
                                out.end();
                            });
                        }
                    }
                }
            }).then(function () {
                success(resourceType === "external" ? path.basename(flowFilename) : flowFilename);
            }, function (err) {
                fail(err, {statusCode: 500});
            });
        } else {
            fail("Empty Project Id or resource type", {statusCode: 500});
        }
    }

    /**
     * @description
     *
     * @param projectId
     * @param resourceType
     * @param fileName
     * @param success
     * @param fail
     */
    deleteProjectResource(projectId, resourceType, fileName, success, fail) {
        var self = this;

        if (projectId && resourceType && fileName) {
            var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
                resourceAllPath = path.join(projectPath, "resource"),
                resourcePath = path.join(resourceAllPath, resourceType),
                filePath = path.join(resourcePath, fileName);

            if (fs.existsSync(filePath)) {
                co(function*() {
                    if (resourceType === "external") {
                        var externalJsonPath = path.join(projectPath, "external.json"),
                            targetFolder = path.join(resourcePath, fileName),
                            resourceJsonPath = path.join(targetFolder, "external.json");

                        //Remove resource reference from external.json
                        let externalArr = yield new Promise(function (resolve, reject) {
                            try {
                                fs.statSync(externalJsonPath);
                                fs.statSync(resourceJsonPath);

                                var rs = fs.createReadStream(externalJsonPath),
                                    ms = require('memorystream').createWriteStream();

                                rs.on('end', function () {
                                    var str = ms.toString(),
                                        arr;
                                    ms.destroy();

                                    try {
                                        arr = JSON.parse(str);
                                    } catch (err) {
                                        self.config.logger.error(err);
                                    }

                                    resolve(arr);
                                });

                                rs.on('error', function (err) {
                                    ms.destroy();
                                    reject(err);
                                });

                                rs.pipe(ms);
                            } catch (err) {
                                reject(err);
                            }
                        });

                        if (externalArr && externalArr.length) {
                            yield new Promise(function (externalArr, resolve, reject) {
                                var rs = fs.createReadStream(resourceJsonPath),
                                    ms = require('memorystream').createWriteStream();

                                rs.on('end', function () {
                                    var str = ms.toString();
                                    ms.destroy();

                                    var resourceItem = JSON.parse(str);
                                    if (resourceItem) {
                                        var index;
                                        if (!externalArr.every(function (item, i) {
                                                if (item.name === resourceItem.name) {
                                                    index = i;
                                                    return false;
                                                }
                                                return true;
                                            })) {
                                            externalArr.splice(index, 1);
                                        }
                                        resolve();
                                    } else {
                                        resolve();
                                    }
                                });

                                rs.on('error', function (err) {
                                    ms.destroy();
                                    reject(err);
                                });

                                rs.pipe(ms);
                            }.bind(self, externalArr));

                            yield new Promise(function (resolve, reject) {
                                var out = fs.createWriteStream(externalJsonPath);

                                out.on('finish', function () {
                                    resolve();
                                });

                                out.on('error', function (err) {
                                    reject(err);
                                });

                                out.write(JSON.stringify(externalArr));
                                out.end();
                            });
                        }
                    }

                    if (fs.lstatSync(filePath).isFile()) {
                        yield new Promise(function (resolve, reject) {
                            fs.unlink(filePath, function (err) {
                                if (err && err.code !== "ENOENT") //Not Found
                                    reject(err);
                                else
                                    resolve();
                            })
                        });
                    } else if (fs.lstatSync(filePath).isDirectory()) {
                        yield new Promise(function (resolve, reject) {
                            rimraf(filePath, function (err) {
                                if (err && err.code !== "ENOENT") //Not Found
                                    reject();
                                else
                                    resolve();
                            });
                        });
                    }
                }).then(function () {
                    success();
                }, function (err) {
                    fail(err);
                });
            } else {
                fail("Cannot find path.", {statusCode: 500});
            }
        } else {
            fail("Empty Project Id or resource type or file name", {statusCode: 500});
        }
    }

    /**
     * @description
     *
     * @param libraryFilter
     * @param success
     * @param fail
     */
    getRepoLibrary(libraryFilter, success, fail) {
        var self = this;

        libraryFilter = (libraryFilter && JSON.parse(libraryFilter)) || {};
        if (libraryFilter._id) {
            libraryFilter._id = new self.db.Types.ObjectId(libraryFilter._id);
        }

        (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.RepoLibrary.find(libraryFilter, function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        })
    }

    /**
     * @description
     *
     * @param artifactFilter
     * @param success
     * @param fail
     */
    getRepoArtifact(artifactFilter, success, fail) {
        var self = this;

        artifactFilter = (artifactFilter && JSON.parse(artifactFilter)) || {};
        if (artifactFilter._id) {
            artifactFilter._id = new self.db.Types.ObjectId(artifactFilter._id);
        }
        if (artifactFilter.library) {
            artifactFilter.library = new self.db.Types.ObjectId(artifactFilter.library);
        }

        (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.RepoArtifact.find(artifactFilter, function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        })
    }

    /**
     * @description
     *
     * @param projectFilter
     * @param success
     * @param fail
     */
    getProject(projectFilter, success, fail) {
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
            if (value != null && typeof value === "string") {
                var match = value.match(/^\/(.+)\/([igm]?)$/);
                if (match) {
                    projectFilter[key] = new RegExp(match[1], match[2]);
                }
            }
        }

        (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.UserProject.find(projectFilter, function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
    }

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
    postProject(project, sketchWorks, success, fail) {
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
        project.forbidden = false;
        project.active = 1;

        (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
            yield new Promise(function (resolve, reject) {
                self.schema.UserProject.create(project, function (project, err, data) {
                    if (!err) {
                        Object.assign(project, _.pick(data, _.without(self.schema.UserProject.fields, "createTime")));
                        resolve();
                    } else {
                        reject(err);
                    }
                })
            }.bind(self, project));

            var projectId = project._id.toString(),
                projectPath = path.join(self.config.userFile.sketchFolder, projectId),
                stagingProjectPath = path.join(self.config.userFile.stagingFolder, projectId);

            yield Promise.all([projectPath, stagingProjectPath].map(function (pathItem) {
                return new Promise(function (resolve, reject) {
                    fs.mkdir(pathItem, 0o777, function (fsError) {
                        if (!fsError || fsError.code === "EEXIST") {
                            resolve();
                        } else {
                            reject(fsError);
                        }
                    });
                });
            }));

            yield new Promise(function (resolve, reject) {
                var filePath = path.join(projectPath, "meelet.json"),
                    out = fs.createWriteStream(filePath);

                out.on('finish', function () {
                    resolve();
                });

                out.on('error', function (err) {
                    reject(err);
                });

                out.write(sketchWorks);
                out.end();
            });

            yield Promise.all(
                [
                    new Promise(function (resolve, reject) {
                        var filePath = path.join(projectPath, "qrcode.svg");

                        try {
                            var out = fs.createWriteStream(filePath),
                                qr_svg = qr.image("Id:" + projectId, {type: 'svg'});

                            out.on('finish', function () {
                                resolve();
                            });

                            out.on('error', function (err) {
                                reject(err);
                            });

                            qr_svg.pipe(out);
                        } catch (err) {
                            reject(err);
                        }
                    }),
                    new Promise(function (resolve, reject) {
                        var filePath = path.join(projectPath, "qrcode.png");

                        try {
                            var out = fs.createWriteStream(filePath),
                                qr_png = qr.image("Id:" + projectId, {type: 'png'});

                            out.on('finish', function () {
                                resolve();
                            });

                            out.on('error', function (err) {
                                reject(err);
                            });

                            qr_png.pipe(out);
                        } catch (err) {
                            reject(err);
                        }
                    })
                ]
            );

            yield project;
        }).then(function (result) {
            success(result);
        }, function (err) {
            fail(err);
        });
    }

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
    putProject(projectFilter, project, success, fail) {
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
            if (value != null && typeof value === "string") {
                var match = value.match(/^\/(.+)\/([igm]?)$/);
                if (match) {
                    projectFilter[key] = new RegExp(match[1], match[2]);
                }
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
    }

    /**
     * @description
     *
     * Delete project's record and its folder.
     *
     * @param projectFilter
     * @param success
     * @param fail
     */
    deleteProject(projectFilter, success, fail) {
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
            if (value != null && typeof value === "string") {
                var match = value.match(/^\/(.+)\/([igm]?)$/);
                if (match) {
                    projectFilter[key] = new RegExp(match[1], match[2]);
                }
            }
        }

        (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
            let projectList = yield new Promise(function (resolve, reject) {
                self.schema.UserProject.find(projectFilter, function (err, data) {
                    if (!err) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            });

            if (projectList && projectList.length) {
                if (_.findWhere(projectList, {lock: true})) {
                    yield Promise.reject(self.__('Delete Locked Project'));
                } else {
                    yield Promise.all(projectList.map(function (item) {
                        return new Promise(function (resolve, reject) {
                            self.schema.ProjectArtifactXref.remove({projectId: item._id}, function (err) {
                                err && reject(err) || resolve();
                            });
                        });
                    }));

                    let pathList = Array.prototype.concat.apply(Array.prototype, projectList.map(function (item) {
                        var projectId = item._id.toString(),
                            projectPath = path.join(self.config.userFile.sketchFolder, projectId),
                            stagingProjectPath = path.join(self.config.userFile.stagingFolder, projectId);

                        return [projectPath, stagingProjectPath];
                    }));
                    yield Promise.all(pathList.map(function (pathItem) {
                        return new Promise(function (resolve, reject) {
                            rimraf(pathItem, function (err) {
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
                    }));

                    yield new Promise(function (resolve, reject) {
                        self.schema.UserProject.remove(projectFilter, function (err) {
                            if (!err) {
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                }
            }
        }).then(function () {
            success();
        }, function (err) {
            fail(err);
        });
    }

    /**
     * @description
     *
     * @param xrefFilter
     * @param success
     * @param fail
     */
    getProjectArtifactXref(xrefFilter, success, fail) {
        var self = this;

        xrefFilter = (xrefFilter && JSON.parse(xrefFilter)) || {};
        if (xrefFilter.projectId) {
            xrefFilter.projectId = new self.db.Types.ObjectId(xrefFilter.projectId);
        }
        if (xrefFilter.libraryId) {
            xrefFilter.libraryId = new self.db.Types.ObjectId(xrefFilter.libraryId);
        }

        (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.ProjectArtifactXref.find(xrefFilter, function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
    }

    /**
     * @description
     *
     * @param projectId
     * @param libraryId
     * @param artifactList
     * @param success
     * @param fail
     */
    postProjectArtifactXref(projectId, libraryId, artifactList, success, fail) {
        //FIXME artifactList(artifactId,version) needs to be checked against RepoArtifact collection.

        var self = this,
            now = new Date();

        projectId = new self.db.Types.ObjectId(projectId);
        libraryId = new self.db.Types.ObjectId(libraryId);
        artifactList = (artifactList && JSON.parse(artifactList)) || [];
        artifactList = _.filter(artifactList, function (a) {
            return a && a.version && bson.ObjectId.isValid(a.artifactId) && (a.artifactId = new self.db.Types.ObjectId(a.artifactId));
        });

        (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
            let selectionDetail = yield {
                project: new Promise(function (resolve, reject) {
                    self.schema.UserProject.find({_id: projectId}, function (err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            if (data && data.length) {
                                resolve(data[0]);
                            } else {
                                reject(self.__('Cannot Find Project', projectId));
                            }
                        }
                    });
                }),
                library: new Promise(function (resolve, reject) {
                    self.schema.RepoLibrary.find({_id: libraryId}, function (err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            if (data && data.length) {
                                resolve(data[0]);
                            } else {
                                reject(self.__('Cannot Find Repo', libraryId));
                            }
                        }
                    });
                })
            };

            yield new Promise(function (resolve, reject) {
                self.schema.ProjectArtifactXref.update(
                    {
                        projectId: projectId,
                        libraryId: libraryId,
                    },
                    {
                        $set: {
                            updateTime: now.getTime(),
                            createTime: now.getTime(),
                            projectId: projectId,
                            libraryId: libraryId,
                            libraryName: selectionDetail.library.name,
                            type: selectionDetail.library.type,
                            artifactList: artifactList
                        }
                    },
                    {upsert: true},
                    function (err) {
                        err && reject(err) || resolve();
                    }
                );
            });
        }).then(function () {
            success();
        }, function (err) {
            fail(err);
        });
    }

    /**
     * @description
     *
     * @param xrefFilter
     * @param success
     * @param fail
     */
    deleteProjectArtifactXref(xrefFilter, success, fail) {
        var self = this;

        xrefFilter = (xrefFilter && JSON.parse(xrefFilter)) || {};
        if (xrefFilter.projectId) {
            xrefFilter.projectId = new self.db.Types.ObjectId(xrefFilter.projectId);
        }
        if (xrefFilter.libraryId) {
            xrefFilter.libraryId = new self.db.Types.ObjectId(xrefFilter.libraryId);
        }
        //Cannot delete record with refCount greater than 0
        xrefFilter["artifactList.refCount"] = {$not: {$gt: 0}};

        (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.ProjectArtifactXref.remove(xrefFilter, function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
    }

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
    postConvertToHtml(userId, projectId, success, fail) {
        var self = this;

        if (projectId) {
            (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
                let projectObj = yield new Promise(function (resolve, reject) {
                    self.schema.UserProject.find({
                        _id: new self.db.Types.ObjectId(projectId),
                        lock: true,
                        lockUser: new self.db.Types.ObjectId(userId)
                    }, function (err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            if (data && data.length) {
                                resolve(data[0]);
                            } else {
                                reject(self.__('Cannot Find Project', projectId));
                            }
                        }
                    });
                });

                let artifactList = yield new Promise(function (resolve, reject) {
                    self.schema.ProjectArtifactXref.find({projectId: new self.db.Types.ObjectId(projectId)}, function (err, data) {
                        if (err) {
                            reject(err);
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

                            resolve(artifactList);
                        }
                    });
                });

                yield new Promise(function (resolve, reject) {
                    var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

                    commons.convertToHtml(projectObj.type, projectPath, artifactList, function (err, htmlPath) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(htmlPath);
                        }
                    })
                });
            }).then(function () {
                success();
            }, function (err) {
                fail(err);
            });
        } else {
            fail(self._("Empty Project Id"));
        }
    }

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
    getProjectFile(projectId, request, success, fail) {
        var self = this;

        if (projectId) {
            var projectPath = path.join(self.config.userFile.sketchFolder, projectId),
                meeletPath = path.join(projectPath, self.config.settings.meeletFile),
                zipPath = path.join(self.config.settings.download.folder, projectId + ".zip");

            if (fs.existsSync(projectPath)) {
                co(function*() {
                    let pObj = yield {
                        meeletTime: new Promise(function (resolve, reject) {
                            fs.stat(meeletPath, function (err, stat) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(stat.mtime.getTime());
                                }
                            });
                        }),
                        projectObj: new Promise(function (resolve, reject) {
                            self.schema.UserProject.find({_id: new self.db.Types.ObjectId(projectId)}, function (err, data) {
                                if (err) {
                                    reject(err);
                                } else {
                                    if (data && data.length) {
                                        resolve(data[0]);
                                    } else {
                                        reject(self.__('Cannot Find Project', projectId));
                                    }
                                }
                            });
                        }),
                        zipFileTime: new Promise(function (resolve, reject) {
                            fs.stat(zipPath, function (err, stat) {
                                if (err) {
                                    if (err.code !== "ENOENT") //Not Found
                                        reject(err);
                                    else
                                        resolve(0);
                                } else {
                                    resolve(stat.mtime.getTime());
                                }
                            });
                        })
                    };

                    if (pObj.meeletTime > pObj.zipFileTime) {
                        let tmpZipPath = yield new Promise(function (resolve, reject) {
                            var tmpPath = path.join(self.config.userFile.tmpFolder, _.string.sprintf("%s-%d.zip", projectId, _.now())),
                                out = fs.createWriteStream(tmpPath),
                                cZip = new zipCtor();

                            _.extend(cZip.options, {
                                ignoreHidden: true,
                                ignorePaths: ["stylesheets/sass", "stylesheets/repo", /app\/repo\/.+\/stylesheets\/sass$/g]
                            });

                            out.on('finish', function () {
                                resolve(tmpPath);
                            });

                            cZip.on('error', function (err) {
                                reject(err);
                            });

                            out.on('error', function (err) {
                                reject(err);
                            });

                            cZip.pipe(out);
                            cZip.directory(projectPath, false);

                            cZip.finalize();
                        });

                        yield new Promise(function (resolve, reject) {
                            shelljs.exec(_.sprintf("cp %s %s", tmpZipPath, zipPath), {silent: true}, function (code, output) {
                                if (code) {
                                    reject(output);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    }
                }).then(function () {
                    self.fileController.getFile(path.basename(zipPath), request.headers, success, fail);
                }, function (err) {
                    fail(err);
                });
            } else {
                fail("Project does not exist");
            }
        } else {
            fail(self._("Empty Project Id"));
        }
    }

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
    getModuleFile(request, success, fail) {
        //FIXME Generate zip file and copy to download folder should be synchronized.
        var self = this,
            projectModulePath = self.config.userFile.projectModuleFolder,
            zipPath = path.join(self.config.settings.download.folder, "modules.zip");

        co(function*() {
            let mObj = yield {
                moduleTime: new Promise(function (resolve, reject) {
                    fs.stat(projectModulePath, function (err, stat) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(stat.mtime.getTime());
                        }
                    });
                }),
                zipFileTime: new Promise(function (resolve, reject) {
                    fs.stat(zipPath, function (err, stat) {
                        if (err) {
                            if (err.code !== "ENOENT") //Not Found
                                reject(err);
                            else
                                resolve(0);
                        } else {
                            resolve(stat.mtime.getTime());
                        }
                    });
                })
            };

            if (mObj.moduleTime > mObj.zipFileTime) {
                let tmpZipPath = yield new Promise(function (resolve, reject) {
                    var tmpPath = path.join(self.config.userFile.tmpFolder, _.string.sprintf("modules-%d.zip", _.now())),
                        out = fs.createWriteStream(tmpPath),
                        cZip = new zipCtor();

                    out.on('finish', function () {
                        resolve(tmpPath);
                    });

                    cZip.on('error', function (err) {
                        reject(err);
                    });

                    out.on('error', function (err) {
                        reject(err);
                    });

                    cZip.pipe(out);
                    cZip.directory(projectModulePath, false);

                    cZip.finalize();
                });

                yield new Promise(function (resolve, reject) {
                    shelljs.exec(_.sprintf("cp %s %s", tmpZipPath, zipPath), {silent: true}, function (code, output) {
                        if (code) {
                            reject(output);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        }).then(function () {
            self.fileController.getFile(path.basename(zipPath), request.headers, success, fail);
        }, function (err) {
            fail(err);
        });
    }
}

module.exports = UserFileController;
