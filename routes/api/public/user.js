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
                self.schema.Accounts.find(userFilter, function (err, data) {
                    if (!err) {
                        data.forEach(function (item) {
                            delete item.password;
                            delete item.plainPassword;
                            item.photo = item._id;
                        });
                        next(null, data);
                    } else {
                        next(err);
                    }
                })
            },
            function (userList, next) {
                async.each(userList, function (user, eCallback) {
                    self.schema.Transaction.find({readerId: user._id}, function (err, data) {
                        if (!err) {
                            user.transactionList = data || [];
                        }
                        eCallback(err);
                    });
                }, function (err) {
                    if (!err) {
                        next(null, userList);
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

UserController.prototype.getUserShcools = function (schoolFilter, success, fail) {
    var self = this;

    schoolFilter = (schoolFilter && JSON.parse(schoolFilter)) || {};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Schools.find(schoolFilter, function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
}

UserController.prototype.getUserGroups = function (schoolFilter, sort, success, fail) {
    var self = this;

    schoolFilter = (schoolFilter && JSON.parse(schoolFilter)) || {};
    sort = (sort && JSON.parse(sort)) || {};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Groups.find(schoolFilter).sort(sort).exec(function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
};

UserController.prototype.getSchoolTeachers = function (schoolId, success, fail) {
    var self = this;

    var condition = {schoolId: schoolId, role: 2, isAction: true};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.Accounts.find(condition, function (err, data) {
                    if (!err) {
                        next(null, data);
                    } else {
                        next(err);
                    }
                });
            },
            function (accounts, next) {
                var teacherIdList = [];
                accounts.forEach(function (account) {
                    teacherIdList.push(account._id);
                });
                condition = {teacherId: {$in: teacherIdList}};
                self.schema.TeacherGroups.find(condition, function (err, data) {
                    if (!err) {
                        accounts.forEach(function (account) {
                            account.groupList = [];
                            data.forEach(function (rela) {
                                if (account._id == rela.teacherId) {
                                    account.groupList.push(rela.groupId);
                                }
                            });
                        });
                        success(accounts);
                        next(null);
                    } else {
                        next(err);
                    }
                });
            }
        ],
        function (err) {
            if (err)
                fail(err);
        }
    );
}

UserController.prototype.getGroupStudents = function (groupId, success, fail) {
    var self = this;

    var condition = {groupId: groupId, role: 1, isAction: true};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Accounts.find(condition, function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
}

UserController.prototype.postGroup = function (groupObj, success, fail) {
    var self = this;

    groupObj = (groupObj && JSON.parse(groupObj)) || {};

    var entity = new self.schema.Groups(groupObj);

    entity.increment();

    function saveEntity(entity) {
        entity.save(function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
    }

    function updateEntity(entity) {
        var condition = {"_id": entity._id};
        var changeVal = {};
        changeVal.name = entity.name;
        changeVal.schoolId = entity.schoolId;
        changeVal.enrollYear = entity.enrollYear;
        changeVal.groupNo = entity.groupNo;
        changeVal.status = entity.status;
        changeVal.grade = entity.grade;
        var change = {"$set": changeVal};
        self.schema.Groups.update(condition, change, function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
    }

    if (groupObj._id == null) {
        actionFuc = saveEntity;
    } else {
        actionFuc = updateEntity;
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || actionFuc(entity);
}

UserController.prototype.postRemoveGroup = function (groupId, success, fail) {
    var self = this;

    groupId = new self.db.Types.ObjectId(groupId);
    var condition = {_id: groupId};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Groups.remove(condition, function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
}

UserController.prototype.getTeacherGroups = function (groupId, success, fail) {
    var self = this;

    var condition = {groupId: groupId};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.TeacherGroups.find(condition, function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
}

UserController.prototype.postTeacherGroupRela = function (relaObj, success, fail) {
    var self = this;

    relaObj = (relaObj && JSON.parse(relaObj)) || {};

    var entity = new self.schema.TeacherGroups(relaObj);

    entity.increment();

    (!self.isDBReady && fail(new Error('DB not initialized'))) || entity.save(function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
}


UserController.prototype.postRemoveTeacherGroupRela = function (relaObj, success, fail) {
    var self = this;

    relaObj = (relaObj && JSON.parse(relaObj)) || {};

    var condition = {teacherId: relaObj.teacherId, groupId: relaObj.groupId};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.TeacherGroups.remove(condition, function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
}

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

        async.parallel({directGroupUsers: function (pCallback) {
            async.waterfall([
                    function (next) {
                        try {
                            self.schema.TeacherGroups.find({groupId: gid}, function (err, data) {
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
                                    self.schema.Accounts.find(_.extend({isAction: true, _id: {$in: arr}}, userFilter), function (err, data) {
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
        }}, function (err) {
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
                    self.schema.TeacherGroups.find({groupId: groupId}, function (err, data) {
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
                            self.schema.Accounts.find(_.extend({isAction: true, _id: {$in: arr}}, userFilter), function (err, data) {
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

UserController.prototype.postUserCreation = function (userObj, success, fail) {
    var self = this;
    userObj = (userObj && JSON.parse(userObj)) || {};

    var entity = new self.schema.Accounts(userObj);

    entity.increment();

    if (entity.plainPassword) {
        entity.password = commons.encryptPassword(entity.plainPassword);
    }

    function saveEntity(entity) {
        entity.save(function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
    }

    function updateEntity(entity) {
        var condition = {"_id": entity._id};
        var changeVal = {};
        changeVal.groupId = (entity.groupId) ? entity.groupId : null;
        changeVal.schoolId = entity.schoolId;
        changeVal.isAction = entity.isAction;
        changeVal.loginName = entity.loginName;
        changeVal.name = entity.name;
        changeVal.password = entity.password;
        changeVal.plainPassword = entity.plainPassword;
        changeVal.role = entity.role;
        var change = {"$set": changeVal};
        self.schema.Accounts.update(condition, change, function (err, data) {
            if (!err) {
                success(data);
            } else {
                fail(err);
            }
        });
    }

    if (userObj._id == null) {
        actionFuc = saveEntity;
    } else {
        actionFuc = updateEntity;
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || actionFuc(entity);
};

UserController.prototype.postRemoveUserCreation = function (accountId, success, fail) {
    var self = this;

    accountId = new self.db.Types.ObjectId(accountId);
    var condition = {_id: accountId};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Accounts.remove(condition, function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
};

UserController.prototype.postUserUpdate = function (userFilter, userObj, success, fail) {
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

    userObj = (userObj && JSON.parse(userObj)) || {};
    if (userObj.plainPassword) {
        userObj.password = commons.encryptPassword(userObj.plainPassword);
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Accounts.update(userFilter, {$set: userObj}, function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
};

UserController.prototype.deleteUser = function (userFilter, success, fail) {
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Accounts.remove(userFilter, function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
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
            self.schema.Accounts.find(userFilter, function (err, data) {
                if (!err) {
                    next(null, data);
                } else {
                    next(err);
                }
            });
        },
        function (userList, next) {
            async.concat(userList, function (user, callback) {
                async.parallel(
                    {
                        school: function (pCallback) {
                            self.schema.Schools.findOne({_id: new self.db.Types.ObjectId(user.schoolId)}, function (err, data) {
                                if (!err) {
                                    pCallback(null, data);
                                } else {
                                    pCallback(err);
                                }
                            });
                        },
                        classList: function (pCallback) {
                            async.waterfall(
                                [
                                    function (wCallback) {
                                        self.schema.TeacherGroups.find({teacherId: user._id}, function (err, data) {
                                            if (!err) {
                                                wCallback(null, data);
                                            } else {
                                                wCallback(err);
                                            }
                                        });
                                    },
                                    function (xrefList, wCallback) {
                                        var groupIdList = [];
                                        xrefList && xrefList.forEach(function (xref) {
                                            groupIdList.push(xref.groupId);
                                        });
                                        self.schema.Groups.find({_id: {"$in": groupIdList}}, function (err, groupList) {
                                            if (!err) {
                                                wCallback(null, groupList);
                                            } else {
                                                wCallback(err);
                                            }
                                        });
                                    }
                                ], function (err, classList) {
                                    if (!err) {
                                        pCallback(null, classList);
                                    } else {
                                        pCallback(err);
                                    }
                                }
                            );
                        }
                    }, function (err, userDetail) {
                        if (!err) {
                            userDetail.user = user;
                            userDetail.user.photo = user._id;
                            callback(null, userDetail);
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