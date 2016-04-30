"use strict";

var express = require('express');
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
var co = require("co");

class UserController {
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

    postUser(request, userObj, success, fail) {
        let self = this,
            now = new Date();

        userObj = (userObj && JSON.parse(userObj)) || {};
        if (userObj.plainPassword) {
            userObj.password = commons.encryptPassword(userObj.plainPassword);
            userObj = _.omit(userObj, "plainPassword");
        }

        if (_.isEmpty(userObj)) {
            fail(self.__('Empty User'));
            return;
        }

        (!self.isDBReady && fail(new Error('DB not initialized'))) || co.wrap(function*(userObj) {
            //DB operations
            yield co(function*() {
                yield new Promise(function (userObj, resolve, reject) {
                    self.schema.User.find({loginName: userObj.loginName}, function (err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            if (data && data.length) {
                                reject(new Error(self._('Account Used')));
                            } else {
                                resolve();
                            }
                        }
                    });
                }.bind(self, userObj));

                userObj.loginChannel = commons.findLoginChannel(userObj.loginName);

                yield new Promise(function (userObj, resolve, reject) {
                    self.schema.User.create(
                        _.extend(userObj, {
                            updateTime: now.getTime(),
                            createTime: now.getTime(),
                            forbidden: 0,
                            active: 1
                        }),
                        function (err, data) {
                            if (err) {
                                reject(err);
                            } else {
                                Object.assign(userObj, _.pick(data, _.without(self.schema.User.fields, "password", "createTime")));

                                resolve(data);
                            }
                        }
                    );
                }.bind(self, userObj));

                let createdGroupObj = yield new Promise(function (userObj, resolve, reject) {
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
                            if (err) {
                                reject(err);
                            } else {
                                resolve(data);
                            }
                        }
                    );
                }.bind(self, userObj));

                userObj.friendGroupId = createdGroupObj._id;

                yield new Promise(function (userObj, resolve, reject) {
                    self.schema.User.update({_id: userObj._id}, {"$set": {friendGroupId: userObj.friendGroupId}}, function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }.bind(self, userObj));
            });

            //File operations
            yield co(function*() {
                let userContentPath = yield new Promise(function (userObj, resolve, reject) {
                    var userContentPath = path.join(self.config.userFile.userContentPath, userObj._id.toString());

                    mkdirp(userContentPath, 0o755, function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(userContentPath);
                        }
                    });
                }.bind(self, userObj));

                //image, audio, video, file sub folder
                yield Promise.all(
                    [
                        path.join(userContentPath, "image"),
                        path.join(userContentPath, "audio"),
                        path.join(userContentPath, "video"),
                        path.join(userContentPath, "file")
                    ].map(function (folder) {
                        return new Promise(function (resolve, reject) {
                            mkdirp(folder, 0o755, function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    })
                );

                //Convert avatar to png of specific size.
                yield co(function*() {
                    let fileResult = yield new Promise(function (request, resolve, reject) {
                        self.fileController.postFile(request, userContentPath, function (result) {
                            if (result && result.length) {
                                var ext = path.extname(result[0]),
                                    base = path.basename(result[0]);

                                if (ext === '.jpg' || ext === '.png') {
                                    var name = base.substr(0, base.length - 4),
                                        filePath = result[0];

                                    if (name !== 'avatar') {
                                        filePath = path.join(userContentPath, "avatar" + ext);

                                        try {
                                            fs.renameSync(result[0], filePath);
                                            resolve({filePath, ext});
                                        } catch (err) {
                                            reject(err);
                                        }
                                    } else {
                                        resolve({filePath, ext});
                                    }
                                } else {
                                    reject(self._('Wrong format Avatar'));
                                }
                            } else {
                                resolve({});
                            }
                        }, function (err) {
                            reject(err);
                        });
                    }.bind(self, request));

                    let filePath = fileResult.filePath, ext = fileResult.ext;
                    if (filePath && ext) {
                        yield new Promise(function (resolve, reject) {
                            if (ext === '.png') {
                                //Convert to jpg
                                gm(filePath).write(filePath.replace('.png', '.jpg'), function (err) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve();
                                    }
                                });
                            } else if (ext === '.jpg') {
                                //Convert to png
                                gm(filePath).write(filePath.replace('.jpg', '.png'), function (err) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve();
                                    }
                                });
                            }
                        });
                    }
                });

                //Upload user qrcode png and svg files.
                yield Promise.all(
                    [
                        new Promise(function (userObj, resolve, reject) {
                            var filePath = path.join(userContentPath, "qrcode.svg");

                            try {
                                var out = fs.createWriteStream(filePath),
                                    qr_svg = qr.image("Id:" + userObj._id.toString(), {type: 'svg'});

                                out.on('finish', function () {
                                    resolve();
                                });

                                out.on('error', function (err) {
                                    reject(err);
                                });

                                qr_svg.pipe(out);
                            } catch (err2) {
                                reject(err2);
                            }
                        }.bind(self, userObj)),
                        new Promise(function (userObj, resolve, reject) {
                            var filePath = path.join(userContentPath, "qrcode.png");

                            try {
                                var out = fs.createWriteStream(filePath),
                                    qr_png = qr.image("Id:" + userObj._id.toString(), {type: 'png'});

                                out.on('finish', function () {
                                    resolve();
                                });

                                out.on('error', function (err) {
                                    reject(err);
                                });

                                qr_png.pipe(out);
                            } catch (err2) {
                                reject(err2);
                            }
                        }.bind(self, userObj))
                    ]
                );
            })

        })(userObj).then(
            function () {
                success(_.pick(userObj, _.without(self.schema.User.fields, "password", "createTime")));
            }, function (err) {
                fail(err);
            }
        );
    }

    getAccountQr(userId, isStatic, success, fail) {
        let self = this,
            userContentPath = path.join(self.config.userFile.userContentPath, userId),
            dir = path.join(userContentPath, "qrcode.png");

        if (isStatic == null) {
            isStatic = true;
        }

        fs.exists(dir, function (exists) {
            if (exists) {
                if (isStatic) {
                    success(function (req, res) {
                        send(req, dir)
                            .pipe(res);
                    });
                } else {
                    success(function (req, res) {
                        res.setHeader("Content-type", mime.lookup(dir));
                        res.download(dir);
                    });
                }
            } else {
                fail(self.__('File Not Exist', dir));
            }
        });
    }

    getAvatar(userId, ext, isStatic, success, fail) {
        let self = this,
            userContentPath = path.join(self.config.userFile.userContentPath, userId);

        if (isStatic == null) {
            isStatic = true;
        }
        ext = ext || ".png";
        let dir = path.join(userContentPath, "avatar" + ext);

        fs.exists(dir, function (exists) {
            if (exists) {
                if (isStatic) {
                    success(function (req, res) {
                        send(req, dir)
                            .pipe(res);
                    });
                } else {
                    success(function (req, res) {
                        res.setHeader("Content-type", mime.lookup(dir));
                        res.download(dir);
                    });
                }
            } else {
                fail(self.__('File Not Exist', dir));
            }
        });
    }

    getThumbnail(userId, fileName, size, isStatic, success, fail) {
        var self = this,
            scale = commons.getScale(size),
            dir = path.join(self.config.userFile.userContentPath, userId, "image", fileName.replace(/([^\.]+)(\.)?(\w*)$/, "$1@" + scale + "$2$3"));

        if (isStatic == null) {
            isStatic = true;
        }

        fs.exists(dir, function (exists) {
            if (exists) {
                if (isStatic) {
                    success(function (req, res) {
                        send(req, dir)
                            .pipe(res);
                    });
                } else {
                    success(function (req, res) {
                        res.setHeader("Content-type", mime.lookup(dir));
                        res.download(dir);
                    });
                }
            } else {
                fail(self.__('File Not Exist', dir));
            }
        });
    }
}

module.exports = UserController;