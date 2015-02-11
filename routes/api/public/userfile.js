var path = require('path');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
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

UserFileController.prototype.getProjectDetail = function (projectFilter, success, fail) {
    var self = this;

    projectFilter = (projectFilter && JSON.parse(projectFilter)) || {};
    if (projectFilter._id) {
        projectFilter._id = new self.db.Types.ObjectId(projectFilter._id);
    }
    if (projectFilter.userId) {
        projectFilter.userId = new self.db.Types.ObjectId(projectFilter.userId);
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.UserProject.find(projectFilter, function (err, data) {
                    var arr = [];
                    data && data.forEach(function (d) {
                        arr.push({_id: d._id, artifactList: []});
                    });
                    next(err, arr);
                })
            },
            function (projectList, next) {
                if (projectList.length) {
                    async.each(projectList, function (project, pCallback) {
                        async.waterfall([
                            function (pNext) {
                                self.schema.UserArtifactXref.find({projectId: project._id}, function (err, data) {
                                    pNext(err, data);
                                });
                            },
                            function (xrefList, pNext) {
                                if (xrefList.length) {
                                    async.each(xrefList, function (xref, xCallback) {
                                        self.schema.RepoArtifact.find({
                                            _id: xref.artifactId,
                                            forbidden: false,
                                            "versionList.name": xref.version
                                        }, function (err, data) {
                                            if (!err) {
                                                data && data.length && project.artifactList.push(_.extend({}, data[0].toObject(), {version: xref.version}));
                                            }
                                            xCallback(err);
                                        });
                                    }, function (err) {
                                        pNext(err);
                                    })
                                } else {
                                    pNext();
                                }
                            }
                        ], function (err) {
                            pCallback(err);
                        });
                    }, function (err) {
                        next(err, projectList);
                    })
                } else {
                    next();
                }
            }
        ], function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
}

UserFileController.prototype.postProject = function (project, success, fail) {
    var self = this;

    project = (project && JSON.parse(project)) || {};
    if (project.userId) {
        project.userId = new self.db.Types.ObjectId(project.userId);
    }
    if (!project.createTime) {
        project.updateTime = project.createTime = new Date();
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.UserProject.create(project, function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    })
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

    project = (project && JSON.parse(project)) || {};
    if (project.userId) {
        project.userId = new self.db.Types.ObjectId(project.userId);
    }
    project.updateTime = new Date();

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.UserProject.update(projectFilter, {$set: _.omit(project, "_id")}, function (err) {
        if (!err) {
            success();
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.UserProject.find(projectFilter, function (err, data) {
                next(err, data);
            })
        },
        function (projectList, next) {
            self.schema.UserProject.remove(projectFilter, function (err) {
                next(err, projectList);
            })
        },
        function (projectList, next) {
            if (projectList.length) {
                async.each(projectList, function (p, pCallback) {
                    self.schema.UserArtifactXref.remove({projectId: p._id}, function (err) {
                        pCallback(err);
                    });
                }, function (err) {
                    next(err);
                })
            } else {
                next();
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

UserFileController.prototype.postUserArtifactXref = function (artifactList, projectFilter, success, fail) {
    var self = this,
        now = new Date();

    artifactList = (artifactList && JSON.parse(artifactList)) || [];
    artifactList.forEach(function (a) {
        a._id = new self.db.Types.ObjectId(a._id);
    });

    projectFilter = (projectFilter && JSON.parse(projectFilter)) || {};
    if (projectFilter._id) {
        projectFilter._id = new self.db.Types.ObjectId(projectFilter._id);
    }
    if (projectFilter.userId) {
        projectFilter.userId = new self.db.Types.ObjectId(projectFilter.userId);
    }
    for (var key in projectFilter) {
        var value = projectFilter[key];
        if (value != null && typeof value === "string" && value.match(/^\/.+\/$/)) {
            projectFilter[key] = new RegExp(value.substr(1, value.length - 2));
        }
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.UserProject.find(projectFilter, function (err, data) {
                next(err, data);
            })
        },
        function (projectList, next) {
            if (projectList.length) {
                async.each(projectList, function (project, eCallback) {
                    async.parallel(
                        {
                            xrefList: function (pCallback) {
                                self.schema.UserArtifactXref.find({
                                    projectId: project._id
                                }, function (err, data) {
                                    pCallback(err, data);
                                });
                            },
                            artifactList: function (pCallback) {
                                var arr = [];
                                async.each(artifactList, function (artifact, aCallback) {
                                    self.schema.RepoArtifact.find({
                                        _id: artifact._id,
                                        "versionList.name": artifact.version
                                    }, function (err, data) {
                                        data && data.length && arr.push(artifact);

                                        aCallback(err);
                                    })
                                }, function (err) {
                                    pCallback(err, arr);
                                });
                            }
                        }, function (err, selectionDetail) {
                            if (!err) {
                                var arr = [];
                                if (selectionDetail.artifactList.length) {
                                    selectionDetail.artifactList.forEach(function (a) {
                                        if (selectionDetail.xrefList.every(function (xref) {
                                                return !xref.artifactId.equals(a._id);
                                            })) {
                                            arr.push(a);
                                        }
                                    });
                                } else {
                                    arr = selectionDetail.artifactList;
                                }

                                if (arr.length) {
                                    async.each(arr, function (artifact, aCallback) {
                                        self.schema.UserArtifactXref.create({
                                            userId: project.userId,
                                            projectId: project._id,
                                            artifactId: artifact._id,
                                            createTime: now,
                                            updateTime: now,
                                            version: artifact.version
                                        }, function (err) {
                                            aCallback(err);
                                        });
                                    }, function (err) {
                                        eCallback(err);
                                    })
                                } else {
                                    eCallback();
                                }
                            } else {
                                eCallback(err);
                            }
                        }
                    );
                }, function (err) {
                    next(err);
                })
            } else {
                next();
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

UserFileController.prototype.deleteUserArtifactXref = function (artifactIds, projectFilter, success, fail) {
    var self = this,
        artifactIdArr = [];

    artifactIds = (artifactIds && JSON.parse(artifactIds)) || null;
    if (artifactIds) {
        if (typeof artifactIds === "string") {
            artifactIdArr.push(artifactIds);
        } else if (toString.call(artifactIds) === '[object Array]') {
            artifactIds && artifactIds.forEach(function (id) {
                artifactIdArr.push(new self.db.Types.ObjectId(id));
            });
        }
    }

    projectFilter = (projectFilter && JSON.parse(projectFilter)) || {};
    if (projectFilter._id) {
        projectFilter._id = new self.db.Types.ObjectId(projectFilter._id);
    }
    if (projectFilter.userId) {
        projectFilter.userId = new self.db.Types.ObjectId(projectFilter.userId);
    }
    for (var key in projectFilter) {
        var value = projectFilter[key];
        if (value != null && typeof value === "string" && value.match(/^\/.+\/$/)) {
            projectFilter[key] = new RegExp(value.substr(1, value.length - 2));
        }
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.UserProject.find(projectFilter, function (err, data) {
                next(err, data);
            })
        },
        function (projectList, next) {
            if (projectList.length) {
                async.each(artifactIdArr, function (artifactId, eCallback) {
                    commons.batchLimit(projectList, 10, 2, function (arr, callback) {
                            self.schema.UserArtifactXref.remove({
                                artifactId: artifactId,
                                projectId: {$in: _.pluck(arr, "_id")}
                            }, function (err) {
                                callback(err);
                            });
                        },
                        function (err) {
                            eCallback(err);
                        }
                    )
                }, function (err) {
                    next(err);
                })
            } else {
                next();
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

module.exports = UserFileController;
