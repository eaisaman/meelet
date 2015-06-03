var path = require('path');
var fs = require('fs');
var async = require('async');
var mime = require('mime');
var zlib = require("zlib");
var _ = require('underscore');
_.string = require('underscore.string');
_.mixin(_.string.exports());

var FileController = function () {
    var self = this;

    self.config = require('../../../config');
    self.config.on(self.config.ApplicationDBConnectedEvent, function (resource) {
        self.db = resource.instance;
        self.schema = resource.schema;
        self.isDBReady = true;
    });
};

FileController.prototype.getFile = function (fileName, requestHeader, success, fail) {
    var self = this,
        filePath = (_(fileName).startsWith(path.sep) || _(fileName).include(":")) ?
            fileName : path.join(self.config.download.folder, fileName);

    async.waterfall(
        [
            function (next) {
                fs.exists(filePath, function (exists) {
                    if (exists) {
                        var ifModifiedSince = requestHeader["if-modified-since"];
                        if (ifModifiedSince) {
                            ifModifiedSince = Date.parse(ifModifiedSince);
                            if (isNaN(ifModifiedSince)) {
                                next(new Error("Invalid date string " + requestHeader["if-modified-since"]), {statusCode: 400});
                            } else {
                                fs.stat(filePath, function (err, stat) {
                                    if (err) {
                                        if (err.code !== "ENOENT") {
                                            next(err, {statusCode: 500});
                                        } else {
                                            next(null);
                                        }
                                    } else {
                                        var lastModified = stat.mtime;
                                        if (lastModified.getTime() <= ifModifiedSince) {
                                            next(new Error("Not modified"), {
                                                statusCode: 304,
                                                headers: {"Last-Modified": lastModified}
                                            });
                                        } else {
                                            next(null);
                                        }
                                    }
                                });
                            }
                        } else {
                            next(null);
                        }
                    } else {
                        next(new Error("File " + filePath + " does not exist"), {statusCode: 404});
                    }
                });
            },
            function (next) {
                var acceptEncoding = requestHeader['accept-encoding'] || "";
                if (acceptEncoding.match(/\bgzip\b/)) {
                    var gzipFilePath = filePath + ".gz";
                    fs.exists(gzipFilePath, function (gzipExists) {
                        if (gzipExists) {
                            next(null, gzipFilePath);
                        } else {
                            var raw = fs.createReadStream(filePath),
                                dest = fs.createWriteStream(gzipFilePath);

                            dest.on('finish', function () {
                                next(null, gzipFilePath);
                            });

                            raw.on('error', function (err) {
                                next(err, {statusCode: 500});
                            });

                            dest.on('error', function (err) {
                                next(err, {statusCode: 500});
                            });

                            raw.pipe(zlib.createGzip()).pipe(dest);
                        }
                    });
                } else if (acceptEncoding.match(/\bdeflate\b/)) {
                    var deflateFilePath = filePath + ".zip";
                    fs.exists(deflateFilePath, function (deflateExists) {
                        if (deflateExists) {
                            next(null, deflateFilePath);
                        } else {
                            var raw = fs.createReadStream(filePath),
                                dest = fs.createWriteStream(deflateFilePath);

                            dest.on('finish', function () {
                                next(null, deflateFilePath);
                            });

                            raw.on('error', function (err) {
                                next(err, {statusCode: 500});
                            });

                            dest.on('error', function (err) {
                                next(err, {statusCode: 500});
                            });

                            raw.pipe(zlib.createDeflate()).pipe(dest);
                        }
                    });
                } else {
                    next(null, filePath);
                }
            },
            function (realPath, next) {
                success(function (req, res) {
                    var _realPath = _(realPath);

                    if (_realPath.endsWith("gz")) {
                        res.setHeader("Content-type", "application/x-gzip");
                        res.setHeader("Content-Encoding", "gzip");
                    } else if (_realPath.endsWith("deflate")) {
                        res.setHeader("Content-type", "application/octet-stream");
                        res.setHeader("Content-Encoding", "deflate");
                    } else {
                        res.setHeader("Content-type", mime.lookup(realPath));
                    }
                    res.download(realPath, next);
                });
            }
        ],
        function (err, result) {
            if (err) {
                fail(err, result);
            }
        }
    );
}

FileController.prototype.postFile = function (request, uploadFolder, success, fail) {
    var self = this,
        files = [],
        destFiles = [];

    for (var key in request.files) {
        if (_.isArray(request.files[key]))
            files.push(request.files[key][0]);
        else
            files.push(request.files[key]);
    }

    uploadFolder = uploadFolder || self.config.upload.folder;
    async.each(files, function (file, next) {
        var filePath = path.join(uploadFolder, file.originalFilename);
        try {
            var ws = null,
                rs = fs.createReadStream(file.path);

            if (file.range) {
                if (file.range.start) {
                    ws = fs.createWriteStream(filePath, {flags: 'r+', start: file.range.start});
                }
            }

            ws = ws || fs.createWriteStream(filePath);

            ws.on('finish', function () {
                destFiles.push(filePath);
                next(null);
            });

            rs.on('error', function (err) {
                next(err);
            });

            ws.on('error', function (err) {
                next(err);
            });

            rs.pipe(ws);
        } catch (e) {
            next(e);
        }
    }, function (err) {
        if (err) {
            fail(err, {statusCode: 500});
        } else {
            success(destFiles);
        }
    });
}

module.exports = FileController;
