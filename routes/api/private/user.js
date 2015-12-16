require('useful-date');
var async = require('async');
var _ = require('underscore');
var commons = require('../../../commons');
var chatCommons = require('../../../chatCommons');
commons.mixin(commons, chatCommons);

var UserController = function () {
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
                        commons.arrayPurge(data, "password");
                        next(null, data);
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
 * Query group list, return group user list as well.
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
        groupFilter.updateTime = {$gt: new Date(updateTime)};
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
                success(data);
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

    if (userUpdateTime) {
        userUpdateTime = {$gt: new Date(userUpdateTime)};
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
                    var xrefFilter = {_id: {$in: _.pluck(xrefList, "groupId")}};
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
                    next(null);
                }
            },
            function (groupList, refreshUserList, next) {
                if (refreshUserList && refreshUserList.length) {
                    async.each(refreshUserList, function (userItem, cb) {
                        self.schema.User.find({_id: userItem._id}, function (err, data) {
                            if (data && data.length) {
                                _.extend(userItem, _.pick(data[0], "name", "sex", "avatar", "tel"));
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
        userFilter.updateTime = new Date(userFilter.updateTime);
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
                                pCallback(err, data);
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

UserController.prototype.postAvatar = function (userId, request, success, fail) {
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