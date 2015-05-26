var async = require('async');
var _ = require('underscore');
var commons = require('../../../commons');

var UserController = function () {
    var self = this;

    self.config = require('../../../config');
    self.config.on(self.config.ApplicationDBConnectedEvent, function (resource) {
        self.db = resource.instance;
        self.schema = resource.schema;
        self.isDBReady = true;
    });
};

UserController.prototype.getUser = function (userFilter, success, fail) {
    var self = this;

    userFilter = (userFilter && JSON.parse(userFilter)) || {};
    if (userFilter._id) {
        userFilter._id = new self.db.Types.ObjectId(userFilter._id);
    }
    if (userFilter.plainPassword) {
        userFilter.password = commons.encryptPassword(userFilter.plainPassword);
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
                        data.forEach(function (item) {
                            delete item.password;
                            delete item.plainPassword;
                        });
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

UserController.prototype.getUserGroups = function (groupFilter, sort, success, fail) {
    var self = this;

    groupFilter = (groupFilter && JSON.parse(groupFilter)) || {};
    if (groupFilter._id) {
        groupFilter._id = new self.db.Types.ObjectId(groupFilter._id);
    }
    for (var key in groupFilter) {
        var value = groupFilter[key];
        if (value != null && typeof value === "string" && value.match(/^\/.+\/$/)) {
            groupFilter[key] = new RegExp(value.substr(1, value.length - 2));
        }
    }
    sort = (sort && JSON.parse(sort)) || {};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.UserGroup.find(groupFilter).sort(sort).exec(function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
};

UserController.prototype.getGroupUsers = function (groupId, userFilter, success, fail) {
    var self = this,
        groupIds = [new self.db.Types.ObjectId(groupId)],
        userList = [];

    userFilter = (userFilter && JSON.parse(userFilter)) || {};
    if (userFilter._id) {
        userFilter._id = new self.db.Types.ObjectId(userFilter._id);
    }
    if (userFilter.plainPassword) {
        userFilter.password = commons.encryptPassword(userFilter.plainPassword);
        delete userFilter.plainPassword;
    }
    for (var key in userFilter) {
        var value = userFilter[key];
        if (value != null && typeof value === "string" && value.match(/^\/.+\/$/)) {
            userFilter[key] = new RegExp(value.substr(1, value.length - 2));
        }
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.whilst(function () {
        return groupIds.length;
    }, function (wCallback) {
        var gid = groupIds.pop();

        async.parallel({
            directGroupUsers: function (pCallback) {
                async.waterfall([
                        function (next) {
                            try {
                                self.schema.UserGroupXref.find({groupId: gid}, function (err, data) {
                                    if (!err) {
                                        var userIdList = [];

                                        data.forEach(function (xref) {
                                            userIdList.push(xref.userId);
                                        });

                                        next(null, userIdList);
                                    } else {
                                        next(err);
                                    }
                                });
                            } catch (e) {
                                next(e);
                            }
                        },
                        function (userIdList, next) {
                            try {
                                //Two concurrent threads to query, 10 ids to include in the query every time.
                                commons.batchLimit(userIdList, 10, 2, function (arr, callback) {
                                        self.schema.User.find(_.extend({
                                            forbidden: false,
                                            _id: {$in: arr}
                                        }, userFilter), function (err, data) {
                                            if (!err) {
                                                userList.push(data);
                                                callback(null);
                                            } else {
                                                callback(err);
                                            }
                                        });
                                    },
                                    function (err) {
                                        if (!err) {
                                            userList = _.flatten(userList);
                                            next(null, userList);
                                        } else {
                                            next(err);
                                        }
                                    }
                                )
                            } catch (e) {
                                next(e);
                            }
                        }], function (err) {
                        pCallback(err);
                    }
                );
            }, childGroups: function (pCallback) {
                try {
                    self.schema.UserGroup.find({parentId: gid}, function (err, data) {
                        if (!err) {
                            data.forEach(function (group) {
                                groupIds.push(group._id);
                            });

                            pCallback(null);
                        } else {
                            pCallback(err);
                        }
                    });
                } catch (e) {
                    pCallback(e);
                }
            }
        }, function (err) {
            wCallback(err);
        });
    }, function (err) {
        if (err) {
            self.config.logger.error(err);
            fail(err);
        } else {
            success(userList);
        }
    });
};

UserController.prototype.getDirectGroupUsers = function (groupId, userFilter, success, fail) {
    var self = this;

    userFilter = (userFilter && JSON.parse(userFilter)) || {};
    if (userFilter._id) {
        userFilter._id = new self.db.Types.ObjectId(userFilter._id);
    }
    if (userFilter.plainPassword) {
        userFilter.password = commons.encryptPassword(userFilter.plainPassword);
        delete userFilter.plainPassword;
    }
    for (var key in userFilter) {
        var value = userFilter[key];
        if (value != null && typeof value === "string" && value.match(/^\/.+\/$/)) {
            userFilter[key] = new RegExp(value.substr(1, value.length - 2));
        }
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
            function (next) {
                try {
                    self.schema.UserGroupXref.find({groupId: new self.db.Types.ObjectId(groupId)}, function (err, data) {
                        if (!err) {
                            var userIdList = [];

                            data.forEach(function (xref) {
                                userIdList.push(xref.userId);
                            });

                            next(null, userIdList);
                        } else {
                            next(err);
                        }
                    });
                } catch (e) {
                    next(e);
                }
            },
            function (userIdList, next) {
                try {
                    var userList = [];

                    //Two concurrent threads to query, 10 ids to include in the query every time.
                    commons.batchLimit(userIdList, 10, 2, function (arr, callback) {
                            self.schema.User.find(_.extend({
                                forbidden: false,
                                _id: {$in: arr}
                            }, userFilter), function (err, data) {
                                if (!err) {
                                    userList.push(data);
                                    callback(null);
                                } else {
                                    callback(err);
                                }
                            });
                        },
                        function (err) {
                            if (!err) {
                                next(null, _.flatten(userList));
                            } else {
                                next(err);
                            }
                        }
                    )
                } catch (e) {
                    next(e);
                }
            }], function (err, result) {
            if (err) {
                self.config.logger.error(err);
                fail(err);
            } else {
                success(result);
            }
        }
    );
};

UserController.prototype.getUserDetail = function (userFilter, success, fail) {
    var self = this;

    userFilter = (userFilter && JSON.parse(userFilter)) || {};
    if (userFilter._id) {
        userFilter._id = new self.db.Types.ObjectId(userFilter._id);
    }
    if (userFilter.plainPassword) {
        userFilter.password = commons.encryptPassword(userFilter.plainPassword);
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

module.exports = UserController;