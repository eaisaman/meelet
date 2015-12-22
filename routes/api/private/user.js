require('useful-date');
var async = require('async');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var _ = require('underscore');
var commons = require('../../../commons');
var chatCommons = require('../../../chatCommons');
commons.mixin(commons, chatCommons);

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
 * Query user collection.
 *
 * @param userFilter
 * @param success
 * @param fail
 */
UserController.prototype.getUser = function (userFilter, success, fail) {
    var self = this;

    userFilter = (userFilter && JSON.parse(userFilter)) || {};
    if (userFilter._id) {
        userFilter._id = new self.db.Types.ObjectId(userFilter._id);
    }
    if (userFilter.plainPassword) {
        delete userFilter.plainPassword;
    }

    for (var key in userFilter) {
        var value = userFilter[key];
        if (value != null && typeof value === "string" && value.match(/^\/.+\/$/)) {
            userFilter[key] = new RegExp(value.substr(1, value.length - 2));
        }
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.User.find(userFilter, function (err, data) {
                    if (!err) {
                        next(null, commons.arrayPick(data, _.without(self.schema.User.fields, "password", "createTime")));
                    } else {
                        next(err);
                    }
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
 * Query list of group restricted by filter, or the user belongs to.
 *
 * @param {string} groupFilter
 * @param {string} sort
 * @param {string} userId To query the user groups user belongs to.
 * @param {string} updateTime Compare with group record's updateTime to filter most recent change.
 * @param success
 * @param fail
 *
 * @return {Void}
 *
 **/
UserController.prototype.getUserGroup = function (groupFilter, sort, userId, updateTime, success, fail) {
    var self = this;

    groupFilter = (groupFilter && JSON.parse(groupFilter)) || {};
    if (groupFilter._id) {
        groupFilter._id = new self.db.Types.ObjectId(groupFilter._id);
    }
    if (userId) {
        userId = new self.db.Types.ObjectId(userId);
    }
    if (updateTime) {
        groupFilter.updateTime = {$gt: updateTime};
    }
    for (var key in groupFilter) {
        var value = groupFilter[key];
        if (value != null && typeof value === "string" && value.match(/^\/.+\/$/)) {
            groupFilter[key] = new RegExp(value.substr(1, value.length - 2));
        }
    }
    sort = (sort && JSON.parse(sort)) || {};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                var xrefFilter = null;
                if (userId) {
                    xrefFilter = {userId: userId, active: 1};
                    if (groupFilter.updateTime)
                        xrefFilter.groupUpdateTime = groupFilter.updateTime;
                }

                if (xrefFilter) {
                    self.schema.UserGroupXref.find(xrefFilter, function (err, data) {
                        if (!err) {
                            next(null, data);
                        } else {
                            next(err);
                        }
                    });
                } else {
                    next(null);
                }
            },
            function (xrefList, next) {
                if (!xrefList || xrefList.length) {
                    if (xrefList) {
                        groupFilter._id = {$in: _.pluck(xrefList, "groupId")};
                    }
                    self.schema.UserGroup.find(groupFilter).sort(sort).exec(function (err, data) {
                        if (!err) {
                            next(null, data);
                        } else {
                            next(err);
                        }
                    });
                } else {
                    next(null);
                }
            }
        ], function (err, data) {
            if (!err) {
                success(commons.arrayPick(data, _.without(self.schema.UserGroup.fields, "createTime")));
            } else {
                fail(err);
            }
        }
    );
};

/**
 * Query group's user list, providing user's id.
 *
 * @param {string} userId To query the user groups user belongs to.
 * @param {number} userUpdateTime Compare with xref record's updateTime to filter most recent change. The updateTime will be
 * renewed if associated user record is modified, or the user leaves group and active set 0 on xref.
 *
 * @return {Void}
 *
 **/
UserController.prototype.getGroupUser = function (userId, userUpdateTime, success, fail) {
    var self = this;

    userId = new self.db.Types.ObjectId(userId);

    if (userUpdateTime) {
        userUpdateTime = {$gt: userUpdateTime};
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                var xrefFilter = {userId: userId, active: 1};

                self.schema.UserGroupXref.find(xrefFilter, function (err, data) {
                    next(err, data);
                });
            },
            function (xrefList, next) {
                if (xrefList && xrefList.length) {
                    var xrefFilter = {groupId: {$in: _.pluck(xrefList, "groupId")}};
                    if (userUpdateTime) {
                        xrefFilter.updateTime = userUpdateTime;
                    }

                    self.schema.UserGroupXref.find(xrefFilter, function (err, data) {
                        next(err, data);
                    });
                } else {
                    next(null);
                }
            },
            function (xrefList, next) {
                if (xrefList && xrefList.length) {
                    var map = {}, refreshUserMap = {};
                    xrefList.forEach(function (xref) {
                        var groupItem = (map[xref.groupId] = map[xref.groupId] || {_id: xref.groupId, userList: []});
                        if (xref.active) {
                            groupItem.userList.push(refreshUserMap[xref.userId] = refreshUserMap[xref.userId] || {
                                    _id: xref.userId,
                                    active: xref.active,
                                    updateTime: xref.updateTime
                                });
                        } else {
                            groupItem.userList.push({_id: xref.userId, active: 0});
                        }
                    });
                    next(null, _.values(map), _.values(refreshUserMap));
                } else {
                    next(null, null, null);
                }
            },
            function (groupList, refreshUserList, next) {
                if (refreshUserList && refreshUserList.length) {
                    async.each(refreshUserList, function (userItem, cb) {
                        self.schema.User.find({_id: userItem._id}, function (err, data) {
                            if (data && data.length) {
                                _.extend(userItem, _.pick(data[0], "updateTime", "forbidden", "name", "sex", "tel", "active"));
                            }

                            cb(err);
                        })
                    }, function (err) {
                        next(err, groupList);
                    });
                } else {
                    next(null);
                }
            }
        ],
        function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        }
    );
}

/**
 * @description
 *
 * Query user and project created by him.
 *
 * @param {userFilter} userFilter
 * @param success
 * @param fail
 *
 * @return {Void}
 *
 **/
UserController.prototype.getUserProjectDetail = function (userFilter, success, fail) {
    var self = this;

    userFilter = (userFilter && JSON.parse(userFilter)) || {};
    if (userFilter._id) {
        userFilter._id = new self.db.Types.ObjectId(userFilter._id);
    }
    if (userFilter.plainPassword) {
        delete userFilter.plainPassword;
    }
    if (userFilter.updateTime && typeof userFilter.updateTime === "number") {
        userFilter.updateTime = userFilter.updateTime;
    }
    for (var key in userFilter) {
        var value = userFilter[key];
        if (value != null && typeof value === "string" && value.match(/^\/.+\/$/)) {
            userFilter[key] = new RegExp(value.substr(1, value.length - 2));
        }
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.User.find(userFilter, function (err, data) {
                var arr = [];
                data && data.forEach(function (d) {
                    arr.push(_.pick(d, "_id"));
                });
                next(err, arr);
            });
        },
        function (userList, next) {
            async.concat(userList, function (user, callback) {
                async.parallel(
                    {
                        projectList: function (pCallback) {
                            self.schema.UserProject.find({
                                userId: user._id
                            }, function (err, data) {
                                pCallback(err, commons.arrayPick(data, _.without(self.schema.UserProject.fields, "createTime")));
                            });
                        }
                    }, function (err, userDetail) {
                        if (!err) {
                            _.extend(user, userDetail);
                            callback(null, user);
                        } else {
                            callback(err);
                        }
                    })
            }, function (err, userDetailList) {
                if (!err) {
                    next(null, userDetailList);
                } else {
                    next(err);
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
};

/**
 * @description
 *
 * Create user group record. The cross reference between group and its creator is saved. Add cross references
 * if other group member's id given.
 *
 * Group type: 0. Normal Group, 1. Friend Group
 *
 * @param groupObj
 * @param uids
 * @param success
 * @param fail
 */
UserController.prototype.postUserGroup = function (groupObj, uids, success, fail) {
    var self = this,
        now = new Date();

    groupObj = (groupObj && JSON.parse(groupObj)) || {};

    if (_.isEmpty(groupObj)) {
        fail(self.__('Empty UserGroup'));
        return;
    }
    if (groupObj.creatorId == null) {
        fail(self.__('Provide Creator'));
        return;
    }
    uids = JSON.parse(uids) || [];
    if (uids.every(function (userId) {
            return userId !== groupObj.creatorId;
        })) {
        uids.push(groupObj.creatorId);
    }

    groupObj.type = 0;
    groupObj.forbidden = 0;
    groupObj.creatorId = new self.db.Types.ObjectId(groupObj.creatorId);
    uids = uids.map(function (userId) {
        return new self.db.Types.ObjectId(userId);
    });

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.UserGroup.find({creatorId: groupObj.creatorId, name: groupObj.name}, function (err, data) {
                if (!err && data && data.length) {
                    err = new Error(self.__('Group Exists'));
                }
                next(err);
            });
        },
        function (next) {
            self.schema.UserGroup.create(
                _.extend(groupObj, {
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
        function (groupObj, next) {
            if (uids && uids.length) {
                async.each(uids, function (userId, cb) {
                    self.schema.UserGroupXref.create(
                        {
                            updateTime: now.getTime(),
                            createTime: now.getTime(),
                            userId: userId,
                            groupId: groupObj._id,
                            groupType: 0,
                            active: 1
                        },
                        function (err) {
                            cb(err);
                        }
                    );
                }, function (err) {
                    next(err, groupObj);
                })
            } else {
                next(null, groupObj)
            }
        }
    ], function (err, data) {
        if (!err) {
            success(_.pick(data, _.without(self.schema.UserGroup.fields, "createTime")));
        } else {
            fail(err);
        }
    });
}

UserController.prototype.putAvatar = function (userId, request, success, fail) {
    var self = this,
        now = new Date();

    if (toString.call(userId) === '[object Array]') {
        userId = userId[0];
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.parallel([
        function (next) {
            var userContentPath = path.join(self.config.userFile.userContentPath, userId);

            self.fileController.postFile(request, userContentPath, function (result) {
                if (result && result.length && path.basename(result[0]) !== "avatar.jpg") {
                    fs.rename(result[0], path.join(userContentPath, "avatar.jpg"), function (err) {
                        next(err);
                    });
                } else {
                    next(null);
                }
            }, function (err) {
                next(err);
            });
        },
        function (next) {
            self.schema.User.update({_id: new self.db.Types.ObjectId(userId)}, {"$set": {updateTime: now.getTime()}}, function (err) {
                next(err);
            });
        },
        function (next) {
            self.schema.UserGroupXref.update({userId: new self.db.Types.ObjectId(userId)}, {"$set": {updateTime: now.getTime()}}, {multi: true}, function (err) {
                next(err);
            });
        }
    ], function (err) {
        if (!err) {
            success();
        } else {
            fail(err);
        }
    });
}

/**
 * @description
 *
 * Mark user record inactive. If the user information needs to be removed, his record
 * will be marked inactive(active=0) first, so that other app clients refresh the change and update locally.
 * The final deletion will be performed in a periodical job which examines records older than recordTTL value.
 *
 * @param userFilter
 * @param success
 * @param fail
 */
UserController.prototype.putInactivateUser = function (userFilter, success, fail) {
    var self = this,
        now = new Date();

    userFilter = (userFilter && JSON.parse(userFilter)) || {};
    if (_.isEmpty(userFilter)) {
        fail(self.__('Empty Filter'));
        return;
    }
    if (userFilter._id) {
        userFilter._id = new self.db.Types.ObjectId(userFilter._id);
    }
    if (userFilter.updateTime && typeof userFilter.updateTime === "number") {
        userFilter.updateTime = {$gt: userFilter.updateTime};
    }
    userFilter.active = 1;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.User.find(userFilter, function (err, data) {
                next(err, data);
            });
        },
        function (userList, next) {
            if (userList && userList.length) {
                async.each(userList, function (userObj, callback) {
                    async.waterfall([
                        function (cb) {
                            //Check if user has created some items
                            async.parallel(
                                [
                                    function (pCallback) {
                                        self.schema.UserProject.find({userId: userObj._id}, function (err, data) {
                                            pCallback(err, data);
                                        });
                                    },
                                    function (pCallback) {
                                        self.schema.Chat.find({
                                            creatorId: userObj._id,
                                            active: 1
                                        }, function (err, data) {
                                            pCallback(err, data);
                                        });
                                    },
                                    function (pCallback) {
                                        self.schema.UserGroupXref.find({
                                            userId: userObj._id,
                                            active: 1,
                                            groupType: 0
                                        }, function (err, data) {
                                            pCallback(err, data);
                                        });
                                    }
                                ],
                                function (err, results) {
                                    if (!err) {
                                        var markForbidden = !results.every(function (result) {
                                            if (result && result.length) {
                                                return false;
                                            }
                                            return true;
                                        });
                                        cb(null, markForbidden);
                                    } else {
                                        cb(err);
                                    }
                                }
                            );
                        },
                        function (markForbidden, cb) {
                            var setObj = {updateTime: now.getTime()},
                                arr = [];

                            //The user has left some operation records, make his info forbidden instead of inactive.
                            if (markForbidden) {
                                setObj.forbidden = 1;

                                //Forbid friend group
                                arr.push(function (pCallback) {
                                    self.schema.UserGroup.update({_id: userObj.friendGroupId}, {
                                        forbidden: 1,
                                        updateTime: now.getTime()
                                    }, function (err) {
                                        pCallback(err);
                                    });
                                });
                                arr.push(function (pCallback) {
                                    self.schema.UserGroupXref.update({groupId: userObj.friendGroupId}, {
                                        groupUpdateTime: now.getTime()
                                    }, {multi: true}, function (err) {
                                        pCallback(err);
                                    });
                                });

                                arr.push(function (pCallback) {
                                    self.schema.UserGroupXref.update({userId: userObj._id}, {updateTime: now.getTime()}, {multi: true}, function (err) {
                                        pCallback(err);
                                    });
                                });
                            } else {
                                setObj.active = 0;

                                //Inactivate friend group
                                arr.push(function (pCallback) {
                                    self.schema.UserGroup.update({_id: userObj.friendGroupId}, {
                                        active: 0,
                                        updateTime: now.getTime()
                                    }, function (err) {
                                        pCallback(err);
                                    });
                                });
                                arr.push(function (pCallback) {
                                    self.schema.UserGroupXref.update({groupId: userObj.friendGroupId}, {
                                        active: 0,
                                        groupUpdateTime: now.getTime(),
                                        updateTime: now.getTime()
                                    }, {multi: true}, function (err) {
                                        pCallback(err);
                                    });
                                });

                                arr.push(function (pCallback) {
                                    self.schema.UserGroupXref.update({userId: userObj._id}, {
                                        active: 0,
                                        updateTime: now.getTime()
                                    }, {multi: true}, function (err) {
                                        pCallback(err);
                                    });
                                });
                            }
                            arr.push(function (pCallback) {
                                self.schema.User.update({_id: userObj._id}, {"$set": setObj}, function (err) {
                                    pCallback(err);
                                });
                            });

                            async.parallel(arr, function (err) {
                                cb(err);
                            })
                        }
                    ], function (err) {
                        callback(err);
                    });
                }, function (err) {
                    next(err);
                })
            } else {
                next(null);
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

/**
 * @description
 *
 * Delete user record and his content folder.
 *
 * @param userFilter
 * @param success
 * @param fail
 */
UserController.prototype.deleteUser = function (userFilter, success, fail) {
    var self = this;

    userFilter = (userFilter && JSON.parse(userFilter)) || {};
    if (_.isEmpty(userFilter)) {
        fail(self.__('Empty Filter'));
        return;
    }
    if (userFilter._id) {
        userFilter._id = new self.db.Types.ObjectId(userFilter._id);
    }
    if (userFilter.updateTime && typeof userFilter.updateTime === "number") {
        userFilter.updateTime = {$gt: userFilter.updateTime};
    }
    userFilter.active = 0;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.User.find(userFilter, function (err, data) {
                next(err, data);
            });
        },
        function (userList, next) {
            if (userList && userList.length) {
                async.each(userList, function (userObj, callback) {
                    async.waterfall([
                        function (cb) {
                            self.schema.UserGroupXref.remove({groupId: userObj.friendGroupId}, function (err) {
                                cb(err)
                            });
                        },
                        function (cb) {
                            self.schema.UserGroup.remove({_id: userObj.friendGroupId}, function (err) {
                                cb(err)
                            });
                        },
                        function (cb) {
                            self.schema.User.remove({_id: userObj._id}, function (err) {
                                cb(err)
                            });
                        },
                        function (cb) {
                            var userContentPath = path.join(self.config.userFile.userContentPath, userObj._id.toString());

                            rimraf(userContentPath, function (err) {
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
                        }
                    ], function (err) {
                        callback(err);
                    });
                }, function (err) {
                    next(err);
                })
            } else {
                next(null);
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

/**
 * @description
 *
 * Mark user group record inactive. This function excludes friend group. If the group information needs to be removed,
 * group record will be marked inactive(active=0) first, so that other app clients refresh the change and update locally.
 * The final deletion will be performed in a periodical job which examines records older than recordTTL value.
 *
 * @param groupFilter
 * @param success
 * @param fail
 */
UserController.prototype.putInactivateUserGroup = function (groupFilter, success, fail) {
    var self = this,
        now = new Date();

    groupFilter = (groupFilter && JSON.parse(groupFilter)) || {};
    if (_.isEmpty(groupFilter)) {
        fail(self.__('Empty Filter'));
        return;
    }
    if (groupFilter._id) {
        groupFilter._id = new self.db.Types.ObjectId(groupFilter._id);
    }
    if (groupFilter.updateTime && typeof groupFilter.updateTime === "number") {
        groupFilter.updateTime = {$gt: groupFilter.updateTime};
    }
    groupFilter.active = 1;
    groupFilter.type = 0;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.UserGroup.find(groupFilter, function (err, data) {
                next(err, data);
            });
        },
        function (groupList, next) {
            if (groupList && groupList.length) {
                async.parallel(
                    [
                        function (pCallback) {
                            self.schema.UserGroup.update(groupFilter, {
                                active: 0,
                                updateTime: now.getTime()
                            }, {multi: true}, function (err) {
                                pCallback(err);
                            });
                        },
                        function (pCallback) {
                            async.each(groupList, function (groupObj, callback) {
                                self.schema.UserGroupXref.update({groupId: groupObj._id}, {
                                    active: 0,
                                    groupUpdateTime: now.getTime(),
                                    updateTime: now.getTime()
                                }, {multi: true}, function (err) {
                                    callback(err);
                                });
                            }, function (err) {
                                pCallback(err);
                            });
                        }
                    ], function (err) {
                        next(err);
                    }
                );
            } else {
                next(null);
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

/**
 * @description
 *
 * Delete user group record and cross reference records marked inactive.
 *
 * @param groupFilter
 * @param success
 * @param fail
 */
UserController.prototype.deleteUserGroup = function (groupFilter, success, fail) {
    var self = this;

    groupFilter = (groupFilter && JSON.parse(groupFilter)) || {};
    if (_.isEmpty(groupFilter)) {
        fail(self.__('Empty Filter'));
        return;
    }
    if (groupFilter._id) {
        groupFilter._id = new self.db.Types.ObjectId(groupFilter._id);
    }
    if (groupFilter.updateTime && typeof groupFilter.updateTime === "number") {
        groupFilter.updateTime = {$gt: groupFilter.updateTime};
    }
    groupFilter.active = 0;
    groupFilter.type = 0;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.UserGroup.find(groupFilter, function (err, data) {
                next(err, data);
            });
        },
        function (groupList, next) {
            if (groupList && groupList.length) {
                async.parallel(
                    [
                        function (pCallback) {
                            self.schema.UserGroup.remove(groupFilter, function (err) {
                                pCallback(err);
                            });
                        },
                        function (pCallback) {
                            async.each(groupList, function (groupObj, callback) {
                                self.schema.UserGroupXref.remove({groupId: groupObj._id, active: 0}, function (err) {
                                    callback(err);
                                });
                            }, function (err) {
                                pCallback(err);
                            });
                        }
                    ], function (err) {
                        next(err);
                    }
                );
            } else {
                next(null);
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

UserController.prototype.postConfirmAddFriends = function (userId, friendIdList, success, fail) {
}

UserController.prototype.postRequestJoinGroup = function (userId, groupId, success, fail) {
}

UserController.prototype.getDiscussGroups = function (userId, success, fail) {
}

UserController.prototype.postDiscussGroup = function (userId, groupName, memberIdList, memberGroupIdList, success, fail) {
}

UserController.prototype.getFavorites = function (userId, success, fail) {
}

UserController.prototype.deleteFavorites = function (userId, favoriteIdList, success, fail) {
}

UserController.prototype.getFavorites = function (userId, success, fail) {
}

module.exports = UserController;