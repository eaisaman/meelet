var express = require('express');
var async = require('async');
var path = require('path');
var fs = require('fs');
var mime = require('mime');
var qr = require('qr-image');
var _ = require('underscore');
_.string = require('underscore.string');
var send = require('send');
var gm = require('gm');
var commons = require('../../../commons');
var mkdirp = require("mkdirp");

var UserController = function (fields) {
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
 * Register new user, create his friend group, and the cross reference record. Set up user's content folder
 * (image, video, audio, file). Save avatar if it is uploaded as well. Return persisted user record.
 *
 * @param request
 * @param userObj
 * @param success
 * @param fail
 */
UserController.prototype.postUser = function (request, userObj, success, fail) {
    var self = this,
        now = new Date();

    userObj = (userObj && JSON.parse(userObj)) || {};
    if (userObj.plainPassword) {
        userObj.password = commons.encryptPassword(userObj.plainPassword);
        delete userObj.plainPassword;
    }

    if (_.isEmpty(userObj)) {
        fail(self.__('Empty User'));
        return;
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.User.find({loginName: userObj.loginName}, function (err, data) {
                    if (!err && data && data.length) {
                        err = new Error(self.__('Account Used'));
                        next(err, data && data.length && data[0]);
                    } else {
                        next(err);
                    }
                });
            },
            function (next) {
                userObj.loginChannel = commons.findLoginChannel(userObj.loginName);

                self.schema.User.create(
                    _.extend(userObj, {
                        updateTime: now.getTime(),
                        createTime: now.getTime(),
                        forbidden: 0,
                        active: 1
                    }),
                    function (err, data) {
                        next(err, data);
                    }
                );
            },
            function (userObj, next) {
                self.schema.UserGroup.create(
                    {
                        updateTime: now.getTime(),
                        createTime: now.getTime(),
                        name: "Friend Group",
                        creatorId: userObj._id,
                        forbidden: 0,
                        type: 1,
                        active: 1
                    },
                    function (err, data) {
                        if (!err) {
                            userObj.friendGroupId = data._id;
                        }

                        next(err, userObj);
                    }
                );
            },
            function (userObj, next) {
                self.schema.User.update({_id: userObj._id}, {"$set": {friendGroupId: userObj.friendGroupId}}, function (err) {
                    next(err, userObj);
                });
            },
            function (userObj, next) {
                //Make user content folder
                var userContentPath = path.join(self.config.userFile.userContentPath, userObj._id.toString());
                async.waterfall(
                    [
                        function (cb) {
                            mkdirp(userContentPath, 0x755, function (err) {
                                cb(err);
                            });
                        },
                        function (cb) {
                            //image, audio, video, file sub folder
                            var arr = [];
                            [
                                path.join(userContentPath, "image"),
                                path.join(userContentPath, "audio"),
                                path.join(userContentPath, "video"),
                                path.join(userContentPath, "file")
                            ].forEach(function (folder) {
                                arr.push(
                                    function (pCallback) {
                                        mkdirp(folder, 0x755, function (err) {
                                            pCallback(err);
                                        });
                                    }
                                );
                            });

                            async.parallel(
                                arr, function (err) {
                                    cb(err);
                                }
                            );
                        }
                    ], function (err) {
                        next(err, userObj, userContentPath);
                    }
                );
            },
            function (userObj, userContentPath, next) {
                //Ignore error in uploading avatar file, return created user record anyway.
                async.waterfall([
                    function (cb) {
                        self.fileController.postFile(request, userContentPath, function (result) {
                            if (result && result.length) {
                                var ext = path.extname(result[0]),
                                    base = path.basename(result[0]);

                                if (ext === '.jpg' || ext === '.png') {
                                    var name = base.substr(0, base.length - 4);

                                    if (name !== 'avatar') {
                                        var filePath = path.join(userContentPath, "avatar" + ext);

                                        fs.rename(result[0], filePath, function (err) {
                                            cb(err, filePath, ext);
                                        });
                                    } else {
                                        cb(null, result[0], ext);
                                    }
                                } else {
                                    cb(self.__('Wrong format Avatar'));
                                }
                            } else {
                                cb(null, null, null);
                            }
                        }, function (err) {
                            cb(err);
                        });
                    },
                    function (filePath, ext, cb) {
                        if (filePath) {
                            if (ext === '.png') {
                                //Convert to jpg
                                gm(filePath).write(filePath.replace('.png', '.jpg'), function (err) {
                                    cb(err);
                                });
                            } else if (ext === '.jpg') {
                                //Convert to png
                                gm(filePath).write(filePath.replace('.jpg', '.png'), function (err) {
                                    cb(err);
                                });
                            }
                        } else {
                            cb(null);
                        }
                    }
                ], function (err) {
                    if (err) {
                        self.config.logger.error(err);
                    }

                    next(null, userObj, userContentPath);
                });
            },
            function (userObj, userContentPath, next) {
                async.parallel([
                    function (cb) {
                        var filePath = path.join(userContentPath, "qrcode.svg");

                        try {
                            var out = fs.createWriteStream(filePath),
                                qr_svg = qr.image("Id:" + userObj._id.toString(), {type: 'svg'});

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
                        var filePath = path.join(userContentPath, "qrcode.png");

                        try {
                            var out = fs.createWriteStream(filePath),
                                qr_png = qr.image("Id:" + userObj._id.toString(), {type: 'png'});

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
                    next(err, userObj);
                });
            }
        ], function (err, data) {
            //FIXME Duplicate account should be treated as error
            if (!err || data) {
                success(_.pick(data, _.without(self.schema.User.fields, "password", "createTime")));
            } else {
                fail(err);
            }
        }
    );
}

/**
 * @description
 *
 * Return account qrcode file if exists, or 500 status code if not.
 *
 * @param userId
 * @param isStatic
 * @param success
 * @param fail
 */
UserController.prototype.getAccountQr = function (userId, isStatic, success, fail) {
    var self = this,
        userContentPath = path.join(self.config.userFile.userContentPath, userId),
        dir = path.join(userContentPath, "qrcode.png");

    if (isStatic == null) {
        isStatic = true;
    }

    async.waterfall(
        [
            function (next) {
                fs.exists(dir, function (exists) {
                    if (exists) {
                        next(null, dir);
                    } else {
                        next(self.__('File Not Exist', dir));
                    }
                });
            },
            function (dir, next) {
                if (isStatic) {
                    success(function (req, res) {
                        send(req, dir)
                            .on('error', next)
                            .on('end', next)
                            .pipe(res);
                    });
                } else {
                    success(function (req, res) {
                        res.setHeader("Content-type", mime.lookup(dir));
                        res.download(dir, next);
                    });
                }
            }
        ], function (err, result) {
            if (err) {
                fail(err, result);
            }
        }
    );
}

/**
 * @description
 *
 * Return avatar file if exists, or 500 status code if not.
 *
 * @param userId
 * @param ext
 * @param isStatic
 * @param success
 * @param fail
 */
UserController.prototype.getAvatar = function (userId, ext, isStatic, success, fail) {
    var self = this,
        userContentPath = path.join(self.config.userFile.userContentPath, userId);

    if (isStatic == null) {
        isStatic = true;
    }
    ext = ext || ".png";
    var dir = path.join(userContentPath, "avatar" + ext);

    async.waterfall(
        [
            function (next) {
                fs.exists(dir, function (exists) {
                    if (exists) {
                        next(null, dir);
                    } else {
                        next(self.__('File Not Exist', dir));
                    }
                });
            },
            function (dir, next) {
                if (isStatic) {
                    success(function (req, res) {
                        send(req, dir)
                            .on('error', next)
                            .on('end', next)
                            .pipe(res);
                    });
                } else {
                    success(function (req, res) {
                        res.setHeader("Content-type", mime.lookup(dir));
                        res.download(dir, next);
                    });
                }
            }
        ], function (err, result) {
            if (err) {
                fail(err, result);
            }
        }
    );
}

/**
 * Return thumbnail of user's picture if exists, or 500 status code if not.
 *
 * @param {string} userId
 * @param {string} fileName
 * @param {number} size Larger value of thumbnail's width and height. Compared to value of tiny, small, medium, large scale size(16, 32, 48, 128).
 * @param {string} isStatic Value of "true" or "false", indicates whether accesssing static resource or downloading.
 * @param success
 * @param fail
 */
UserController.prototype.getThumbnail = function (userId, fileName, size, isStatic, success, fail) {
    var self = this,
        scale = commons.getScale(size),
        dir = path.join(self.config.userFile.userContentPath, userId, "image", fileName.replace(/([^\.]+)(\.)?(\w*)$/, "$1@" + scale + "$2$3"));

    if (isStatic == null) {
        isStatic = true;
    }

    async.waterfall(
        [
            function (next) {
                fs.exists(dir, function (exists) {
                    if (exists) {
                        next(null, dir);
                    } else {
                        next(self.__('File Not Exist', dir));
                    }
                });
            },
            function (dir, next) {
                if (isStatic) {
                    success(function (req, res) {
                        send(req, dir)
                            .on('error', next)
                            .on('end', next)
                            .pipe(res);
                    });
                } else {
                    success(function (req, res) {
                        res.setHeader("Content-type", mime.lookup(dir));
                        res.download(dir, next);
                    });
                }
            }
        ], function (err, result) {
            if (err) {
                fail(err, result);
            }
        }
    );
}

module.exports = UserController;