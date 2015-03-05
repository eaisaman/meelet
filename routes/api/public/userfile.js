var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var async = require('async');
var _ = require('underscore');
var bson = require('bson');
_.string = require('underscore.string');
_.mixin(_.string.exports());
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
    self.config.on(self.config.ApplicationDBConnectedEvent, function (resource) {
        self.db = resource.instance;
        self.schema = resource.schema;
        self.isDBReady = true;
    });
};

UserFileController.prototype.postConfiguration = function (projectId, artifactId, widgetId, configuration, success, fail) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

        fs.mkdir(projectPath, 0777, function (fsError) {
            if (!fsError || fsError.code === "EEXIST") {
                var filePath = path.join(projectPath, "meelet.json"),
                    out = fs.createWriteStream(filePath);

                out.on('finish', function () {
                    success();
                });

                out.on('error', function (err) {
                    fail(err);
                });

                out.write(sketchWorks);
                out.end();
            } else {
                fail(fsError);
            }
        });
    } else {
        fail("Empty project id");
    }
}

UserFileController.prototype.postSketch = function (projectId, sketchWorks, request, success, fail) {
    var self = this;

    if (projectId) {
        var projectPath = path.join(self.config.userFile.sketchFolder, projectId);

        fs.mkdir(projectPath, 0777, function (fsError) {
            if (!fsError || fsError.code === "EEXIST") {
                var filePath = path.join(projectPath, "meelet.json"),
                    out = fs.createWriteStream(filePath);

                out.on('finish', function () {
                    success();
                });

                out.on('error', function (err) {
                    fail(err);
                });

                out.write(sketchWorks);
                out.end();
            } else {
                fail(fsError);
            }
        });
    } else {
        fail("Empty project id");
    }
}

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
}

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
}

UserFileController.prototype.putConfigurableArtifact = function (projectId, widgetId, artifactId, configuration, success, fail) {
    if (projectId) {
        configuration = (configuration && JSON.parse(configuration)) || {};
        commons.updateConfigurableArtifact(projectId, widgetId, artifactId, configuration, function (err, cssName) {
            if (!err) {
                success({css: cssName});
            } else {
                fail(err);
            }
        })
    } else {
        fail("Empty project id");
    }
}

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
}

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
        fail(new Error('Empty project id'), {statusCode: 500});
    }
}

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
                                        if (err && err.code !== "ENOENT") //Not Found
                                            next(err);
                                        else
                                            next(null);
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
                                                if (err && err.code !== "ENOENT") //Not Found
                                                    wCallback(err);
                                                else
                                                    wCallback(null);
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
}

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
}

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
}

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
}

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
}

UserFileController.prototype.postProject = function (project, sketchWorks, success, fail) {
    var self = this;

    project = (project && JSON.parse(project)) || {};
    if (project.userId) {
        project.userId = new self.db.Types.ObjectId(project.userId);
    }
    if (!project.createTime) {
        project.updateTime = project.createTime = new Date();
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
                    projectPath = path.join(self.config.userFile.sketchFolder, projectId);

                fs.mkdir(projectPath, 0777, function (fsError) {
                    if (!fsError || fsError.code === "EEXIST") {
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
                        next(fsError);
                    }
                });

            }
        ], function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
}

UserFileController.prototype.putProject = function (projectFilter, project, success, fail) {
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

    project = (project && JSON.parse(project)) || {};
    if (project.userId) {
        project.userId = new self.db.Types.ObjectId(project.userId);
    }
    if (project.lockUser) {
        project.lockUser = new self.db.Types.ObjectId(project.lockUser);
    }
    project.updateTime = new Date();

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.UserProject.findOneAndUpdate(projectFilter, {$set: _.omit(project, "_id")}, function (err, data) {
        if (!err) {
            success(data ? 1 : 0);
        } else {
            fail(err);
        }
    });
}

UserFileController.prototype.deleteProject = function (projectFilter, success, fail) {
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
                });
            },
            function (data, next) {
                if (data && data.length) {
                    async.each(data, function (item, callback) {
                        var projectId = item._id.toString(),
                            projectPath = path.join(self.config.userFile.sketchFolder, projectId);

                        rimraf(projectPath, function (err) {
                            callback(err);
                        });
                    }, function (err) {
                        next(err, data);
                    });
                } else {
                    next(null, 0);
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
                    self.schema.UserProject.remove(projectFilter, function (err, count) {
                        next(err, count);
                    });
                } else {
                    next(null, 0);
                }
            }
        ], function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        }
    );
}

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
}

UserFileController.prototype.postProjectArtifactXref = function (projectId, libraryId, artifactList, success, fail) {
    var self = this,
        now = new Date();

    projectId = new self.db.Types.ObjectId(projectId);
    libraryId = new self.db.Types.ObjectId(libraryId);
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
                            next(new Error(_.string.sprintf("Cannot find project with id %s", projectId)));
                        } else if (!selectionDetail.library.length) {
                            next(new Error(_.string.sprintf("Cannot find repo library with id %s", libraryId)));
                        } else {
                            next(null, selectionDetail.xref);
                        }
                    } else {
                        next(err);
                    }
                }
            );
        },
        function (xref, next) {
            if (xref.length) {
                self.schema.ProjectArtifactXref.update({
                    libraryId: libraryId,
                    projectId: projectId
                }, {$set: {artifactList: artifactList, updateTime: now}}, function (err) {
                    next(err);
                });
            } else {
                self.schema.ProjectArtifactXref.create({
                    projectId: projectId,
                    libraryId: libraryId,
                    artifactList: artifactList,
                    createTime: now,
                    updateTime: now
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
}

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
}

module.exports = UserFileController;
