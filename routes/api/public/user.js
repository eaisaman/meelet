var express = require('express');
var async = require('async');
var _ = require('underscore');
_.string = require('underscore.string');
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
    self.__ = self.config.i18n;
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
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.User.find({loginName: userObj.loginName}, function (err, data) {
                    if (!err && data && data.length) {
                        err = new Error(self.__('Account Used'));
                    }
                    next(err);
                });
            },
            function (next) {
                self.schema.User.create(
                    _.extend(userObj, {
                        updateTime: now,
                        createTime: now,
                        forbidden: false,
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
                        updateTime: now,
                        createTime: now,
                        name: "Friend Group",
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
                self.schema.UserGroupXref.create(
                    {
                        updateTime: now,
                        createTime: now,
                        userId: userObj._id,
                        groupId: userObj.friendGroupId,
                        active: 1
                    },
                    function (err) {
                        next(err, userObj);
                    }
                );
            },
            function (userObj, next) {
                //Make user content folder
                var userContentPath = path.join(self.config.userFile.userContentPath, userObj._id.toString());
                async.waterfall(
                    [
                        function (cb) {
                            mkdirp(userContentPath, 0755, function (err) {
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
                                            mkdirp(folder, 0755, function (err) {
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
                self.fileController.postFile(request, userContentPath, function (result) {
                    if (result && result.length) {
                        fs.rename(result[0], path.join(userContentPath, "avatar.png"), function (err) {
                            next(null, userObj);
                        })
                    } else {
                        next(null, userObj);
                    }
                }, function () {
                    next(null, userObj);
                });
            }
        ], function (err, data) {
            if (!err) {
                delete data.password;

                success(data);
            } else {
                fail(err);
            }
        }
    );
}

UserController.prototype.getSameGroupUsers = function (userId, success, fail) {
    var self = this;

    userId = new self.db.Types.ObjectId(userId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
            function (next) {
                try {
                    self.schema.UserGroupXref.find({userId: userId}, function (err, data) {
                        if (!err) {
                            next(null, _.pluck(data, "groupId"));
                        } else {
                            next(err);
                        }
                    });
                } catch (e) {
                    next(e);
                }
            },
            function (groupIdList, next) {
                if (groupIdList && groupIdList.length) {
                    self.schema.UserGroupXref.find({groupId: {"$in": groupIdList}}, function (err, data) {
                        if (!err) {
                            var arr = _.pluck(data, "userId").map(function (oid) {
                                return oid.toString();
                            });

                            arr = _.without(_.uniq(arr), userId.toString()).map(function (strId) {
                                return new self.db.Types.ObjectId(strId);
                            })
                        }

                        next(err, arr);
                    });
                } else {
                    next(null);
                }
            },
            function (userIdList, next) {
                if (userIdList && userIdList.length) {
                    self.schema.User.find({_id: {"$in": userIdList}}, function (err, data) {
                        if (!err) {
                            data.forEach(function (item) {
                                delete item.password;
                                delete item.plainPassword;
                            });
                            next(null, data);
                        } else {
                            next(err);
                        }
                    })
                } else {
                    next(null);
                }
            }
        ], function (err, result) {
            if (err) {
                self.config.logger.error(err);
                fail(err);
            } else {
                success(result);
            }
        }
    );
};

/**
 * @description
 *
 * Return avatar file if exists, or 500 status code if not.
 *
 * @param userId
 * @param success
 * @param fail
 */
UserController.prototype.getAvatar = function (userId, success, fail) {
    var self = this,
        userContentPath = path.join(self.config.userFile.userContentPath, userId),
        dir = path.join(userContentPath, "avatar.png");

    fs.exists(dir, function (exists) {
        if (exists) {
            success(express.static(dir));
        } else {
            fail(self.__('File Not Exist', dir), {statusCode: 500});
        }
    });
}

/**
 * Return thumbnail of user's picture if exists, or 500 status code if not.
 *
 * @param {string} userId
 * @param {string} fileName
 * @param {number} size Larger value of thumbnail's width and height. Compared to value of tiny, small, medium, large scale size(16, 32, 48, 128).
 * @param success
 * @param fail
 */
UserController.prototype.getThumbnail = function (userId, fileName, size, success, fail) {
    var self = this,
        scale = commons.getScale(size),
        dir = path.join(self.config.userFile.userContentPath, userId, "image", fileName.replace(/([^\.]+)(\.)?(\w*)$/, "$1@" + scale + "$2$3"));

    fs.exists(dir, function (exists) {
        if (exists) {
            success(express.static(dir));
        } else {
            fail(self.__('File Not Exist', dir), {statusCode: 500});
        }
    });
}

module.exports = UserController;