var async = require('async');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mime = require('mime');
var _ = require('underscore');
_.string = require('underscore.string');
var gm = require('gm');
var commons = require('../../../commons');

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
    self.chatConstants = self.config.settings.chatConstants;
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
        if (value != null && typeof value === "string") {
            var match = value.match(/^\/(.+)\/([igm]?)$/);
            if (match) {
                userFilter[key] = new RegExp(match[1], match[2]);
            }
        }
    }
    userFilter.active = 1;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.User.find(userFilter, function (err, data) {
        if (!err) {
            success(commons.arrayPick(data, _.without(self.schema.User.fields, "password", "createTime")));
        } else {
            fail(err);
        }
    });
};

/**
 * @description
 *
 * Return file in user content if exists, or 500 status code if not.
 *
 * @param userId
 * @param fileName
 * @param success
 * @param fail
 */
UserController.prototype.getUserContent = function (userId, fileName, success, fail) {
    var self = this,
        userContentPath = path.join(self.config.userFile.userContentPath, userId),
        dir = path.join(userContentPath, fileName);

    if (fs.existsSync(dir)) {
        success(function (req, res) {
            res.setHeader("Content-type", mime.lookup(dir));
            res.download(dir);
        });
    } else {
        fail(self.__('File Not Exist', dir), {
            statusCode: 404
        });
    }
}

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
        if (value != null && typeof value === "string") {
            var match = value.match(/^\/(.+)\/([igm]?)$/);
            if (match) {
                groupFilter[key] = new RegExp(match[1], match[2]);
            }
        }
    }
    groupFilter.active = 1;
    sort = (sort && JSON.parse(sort)) || {};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        var xrefFilter = null;
        if (userId) {
            xrefFilter = {userId: userId, active: 1};
            if (groupFilter.updateTime)
                xrefFilter.groupUpdateTime = groupFilter.updateTime;
        }

        let xrefList = null;
        if (xrefFilter) {
            xrefList = yield new Promise(function (resolve, reject) {
                self.schema.UserGroupXref.find(xrefFilter, function (err, data) {
                    if (!err) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            });
        }

        if (!xrefList || xrefList.length) {
            if (xrefList) {
                groupFilter._id = {$in: _.pluck(xrefList, "groupId")};
            }

            yield new Promise(function (groupFilter, sort, resolve, reject) {
                self.schema.UserGroup.find(groupFilter).sort(sort).exec(function (err, data) {
                    if (!err) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }.bind(self, groupFilter, sort));
        }
    }).then(function (data) {
        success(commons.arrayPick(data, _.without(self.schema.UserGroup.fields, "createTime")));
    }, function (err) {
        fail(err);
    });
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
UserController.prototype.getGroupUser = function (userId, userUpdateTime, isFriend, success, fail) {
    var self = this;

    userId = new self.db.Types.ObjectId(userId);
    userUpdateTime = userUpdateTime && {$gt: userUpdateTime} || {$gt: 0};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let xrefFilter = {userId: userId, active: 1, groupType: 0};
        let xrefList = null;

        if (isFriend != null) {
            if (isFriend) {
                //Find user's friends
                xrefList = yield new Promise(function (userId, resolve, reject) {
                    self.schema.User.find({_id: userId, active: 1}, function (err, data) {
                        if (!err) {
                            if (data && data.length) {
                                resolve([{groupId: data[0].friendGroupId}]);
                            } else {
                                reject(self.__('Account Not Found'));
                            }
                        } else {
                            reject(err);
                        }
                    });
                }.bind(self, userId));
            } else {
                //Find members belonging to groups other than friend group
                xrefList = yield new Promise(function (resolve, reject) {
                    self.schema.UserGroupXref.find(xrefFilter, function (err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data);
                        }
                    });
                });
            }
        } else {
            //Find user's friends and members belonging to groups other than friend group
            let xrefList = yield Promise.all(
                [
                    new Promise(function (userId, resolve, reject) {
                        self.schema.User.find({_id: userId, active: 1}, function (err, data) {
                            var xrefList = null;
                            if (!err) {
                                if (data && data.length) {
                                    resolve([{groupId: data[0].friendGroupId}]);
                                } else {
                                    reject(self.__('Account Not Found'));
                                }
                            } else {
                                reject(err);
                            }
                        });
                    }.bind(self, userId)),
                    new Promise(function (resolve, reject) {
                        self.schema.UserGroupXref.find(xrefFilter, function (err, data) {
                            err && reject(err) || resolve(data || []);
                        });
                    })
                ]
            ).then(
                function (results) {
                    return Promise.resolve(Array.prototype.concat.apply(Array.prototype, results));
                },
                function (err) {
                    return Promise.reject(err);
                }
            );
        }

        if (xrefList && xrefList.length) {
            xrefList = yield new Promise(function (userUpdateTime, resolve, reject) {
                var xrefFilter = {groupId: {$in: _.pluck(xrefList, "groupId")}, updateTime: userUpdateTime};

                self.schema.UserGroupXref.find(xrefFilter, function (err, data) {
                    err && reject(err) || resolve(data || []);
                });
            }.bind(self, userUpdateTime));

            if (xrefList && xrefList.length) {
                let groupMap = {}, refreshUserMap = {};
                xrefList.forEach(function (xref) {
                    var groupItem = (groupMap[xref.groupId] = groupMap[xref.groupId] || {
                            _id: xref.groupId,
                            userList: []
                        });
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
                let refreshUserList = _.values(refreshUserMap),
                    groupList = _.values(groupMap);

                if (refreshUserList && refreshUserList.length) {
                    yield Promise.all(
                        refreshUserList.map(function (userItem) {
                            return new Promise(function (userItem, resolve, reject) {
                                self.schema.User.find({_id: userItem._id, active: 1}, function (err, data) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        if (data && data.length) {
                                            _.extend(userItem, _.pick(data[0], _.without(self.schema.User.fields, "password", "createTime")));
                                        }
                                        resolve();
                                    }
                                })
                            }.bind(self, userItem));
                        })
                    );
                }

                yield Promise.resolve(groupList);
            } else {
                yield Promise.resolve([]);
            }
        } else {
            yield Promise.resolve([]);
        }
    }).then(function (result) {
        success(result);
    }, function (err) {
        fail(err);
    });
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
        if (value != null && typeof value === "string") {
            var match = value.match(/^\/(.+)\/([igm]?)$/);
            if (match) {
                userFilter[key] = new RegExp(match[1], match[2]);
            }
        }
    }
    userFilter.active = 1;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let userList = yield new Promise(function (userFilter, resolve, reject) {
            self.schema.User.find(userFilter, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    var arr = [];
                    data && data.forEach(function (d) {
                        arr.push(_.pick(d, "_id"));
                    });
                    resolve(data);
                }
            });
        }.bind(self, userFilter));

        if (userList.length) {
            yield Promise.all(
                userList.map(function (user) {
                    return new Promise(function (user, resolve, reject) {
                        self.schema.UserProject.find({
                            userId: user._id
                        }, function (err, data) {
                            if (err) {
                                reject(err);
                            } else {
                                user.projectList = commons.arrayPick(data, _.without(self.schema.UserProject.fields, "createTime"))
                                resolve();
                            }
                        });

                    }.bind(self, user));
                })
            );
        }

        yield userList;
    }).then(function (result) {
        success(result);
    }, function (err) {
        fail(err);
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

    groupObj = (groupObj && JSON.parse(commons.getFormString(groupObj))) || {};

    if (_.isEmpty(groupObj)) {
        fail(self.__('Empty UserGroup'));
        return;
    }
    if (groupObj.creatorId == null) {
        fail(self.__('Provide Creator'));
        return;
    }
    uids = uids && JSON.parse(uids) || [];
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        yield new Promise(function (groupObj, resolve, reject) {
            self.schema.UserGroup.find({creatorId: groupObj.creatorId, name: groupObj.name}, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    if (data && data.length) {
                        reject(self.__('Group Exists'));
                    } else {
                        resolve();
                    }
                }
            });
        }.bind(self, groupObj));

        yield new Promise(function (groupObj, resolve, reject) {
            self.schema.UserGroup.create(
                _.extend(groupObj, {
                    updateTime: now.getTime(),
                    createTime: now.getTime(),
                    forbidden: 0,
                    active: 1
                }),
                function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        Object.assign(groupObj, _.without(self.schema.UserGroup.fields, "createTime"));
                        resolve();
                    }
                }
            );
        }.bind(self, groupObj));

        if (uids && uids.length) {
            yield Promise.all(
                uids.map(function (userId) {
                    return new Promise(function (groupObj, resolve, reject) {
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
                                err && reject(err) || resolve();
                            }
                        );
                    }.bind(self, groupObj));
                })
            );
        }

        yield groupObj;
    }).then(function (result) {
        success(result);
    }, function (err) {
        fail(err);
    });
}

/**
 * @description
 *
 * Send friend invitation to invitees. Invitation will be persisted first and sent as message to invitees' connected
 * client app or browser. If invitation already sent and marked inactive or rejected previously, update the record.
 *
 * @param userId{string}
 * @param inviteeList{array} Array of object containing _id&loginChannel
 * @param route{string}
 * @param success{function}
 * @param fail{function}
 */
UserController.prototype.postInvitation = function (userId, inviteeList, route, success, fail) {
    var self = this,
        now = new Date();

    userId = new self.db.Types.ObjectId(commons.getFormString(userId));
    inviteeList = (inviteeList && JSON.parse(inviteeList)) || [];
    route = commons.getFormString(route) || self.chatConstants.chatRoute;

    if (inviteeList.length) {
        (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
            let creatorObj = yield new Promise(function (userId, resolve, reject) {
                self.schema.User.find({_id: userId, active: 1}, function (err, data) {
                    if (!err) {
                        if (!data || !data.length) {
                            reject(self.__('Account Not Found'));
                        } else {
                            resolve(data[0]);
                        }
                    } else {
                        reject(err);
                    }
                });
            }.bind(self, userId));

            let invitationArr = yield Promise.all(
                inviteeList.map(function (invitee) {
                    return co.wrap(function*(creatorObj, userId, route) {
                        let inviteeId = new self.db.Types.ObjectId(invitee._id);

                        yield new Promise(function (resolve, reject) {
                            var expires = now.adjust(Date.DAY, self.chatConstants.recordTTL);

                            self.schema.Invitation.update(
                                {
                                    inviteeId: inviteeId,
                                    creatorId: userId
                                },
                                {
                                    $set: {
                                        updateTime: now.getTime(),
                                        createTime: now.getTime(),
                                        creatorId: userId,
                                        creatorName: creatorObj.name,
                                        inviteeId: inviteeId,
                                        route: route,
                                        accepted: 0,
                                        processed: 0,
                                        expires: expires,
                                        active: 1
                                    }
                                },
                                {upsert: true},
                                function (err) {
                                    err && reject(err) || resolve();
                                }
                            );
                        });

                        yield new Promise(function (resolve, reject) {
                            self.schema.Invitation.find({
                                inviteeId: inviteeId,
                                creatorId: userId,
                                accepted: 0,
                                processed: 0,
                                active: 1
                            }, function (err, data) {
                                if (err) {
                                    reject(err);
                                } else {
                                    if (!data || !data.length) {
                                        reject(self.__("Invitation Not Created"));
                                    } else {
                                        resolve(data[0]);
                                    }
                                }
                            });
                        });
                    })(creatorObj, userId, route);
                })
            );

            let uids = inviteeList.map(function (invitee) {
                return {uid: invitee._id, loginChannel: invitee.loginChannel}
            });
            yield new Promise(function (resolve, reject) {
                commons.sendInvitation(userId.toString(), uids, route, function (err) {
                    err && reject(err) || resolve();
                });
            });

            yield commons.arrayPick(invitationArr, _.without(self.schema.Invitation.fields, "createTime"));
        }).then(function (result) {
            success(result);
        }, function (err) {
            fail(err);
        });
    } else {
        success();
    }
}

/**
 * @description
 *
 * Accept 'Become Friend' invitation from the invitation creator. Will update invitation record, send invitation accept
 * message to creator, and add xref records for both creator and invitee if not exist.
 *
 * @param creatorId{string}
 * @param inviteeId{string}
 * @param route{string}
 * @param accepted{number}
 * @param success{function}
 * @param fail{function}
 */
UserController.prototype.putAcceptInvitation = function (creatorId, inviteeId, route, accepted, success, fail) {
    var self = this,
        now = new Date();

    creatorId = new self.db.Types.ObjectId(commons.getFormString(creatorId));
    inviteeId = new self.db.Types.ObjectId(commons.getFormString(inviteeId));
    route = commons.getFormString(route) || self.chatConstants.chatRoute;
    accepted = commons.getFormInt(accepted, 1);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let creatorObj = yield new Promise(function (creatorId, resolve, reject) {
            self.schema.User.find({_id: creatorId, active: 1}, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    if (!data || !data.length) {
                        reject(self.__('Account Not Found'));
                    } else {
                        resolve(data[0]);
                    }
                }
            });
        }.bind(self, creatorId));

        yield new Promise(function (creatorId, inviteeId, resolve, reject) {
            self.schema.Invitation.update({
                creatorId: creatorId,
                inviteeId: inviteeId,
                active: 1
            }, {accepted: accepted, processed: 1, updateTime: now.getTime()}, {multi: true}, function (err) {
                err && reject(err) || resolve();
            });
        }.bind(self, creatorId, inviteeId));

        if (accepted) {
            yield Promise.all(
                new Promise(function (creatorId, inviteeId, creatorObj, route, resolve, reject) {
                    commons.acceptInvitation(creatorId.toString(), creatorObj.loginChannel, inviteeId.toString(), route, function (err) {
                        //Although fail to send accept signal on socket, new friend info can still be fetched by db query
                        if (err) {
                            self.config.logger.error(err);
                        }

                        resolve();
                    });
                }.bind(self, creatorId, inviteeId, creatorObj, route)),
                new Promise(function (creatorObj, resolve, reject) {
                    self.schema.UserGroup.update({_id: creatorObj.friendGroupId}, {
                            updateTime: now.getTime()
                        },
                        function (err) {
                            cb(err);
                        });
                }.bind(self, creatorObj)),
                new Promise(function (creatorObj, inviteeId, resolve, reject) {
                    self.schema.UserGroupXref.update(
                        {
                            groupId: creatorObj.friendGroupId,
                            userId: inviteeId
                        },
                        {
                            $set: {
                                groupUpdateTime: now.getTime(),
                                updateTime: now.getTime(),
                                createTime: now.getTime(),
                                userId: inviteeId,
                                groupId: creatorObj.friendGroupId,
                                groupType: 1,
                                active: 1
                            }
                        },
                        {upsert: true},
                        function (err) {
                            err && reject(err) || resolve();
                        }
                    );
                }.bind(self, creatorObj, inviteeId)),
                co.wrap(function*(inviteeId, creatorId) {
                    let userObj = yield new Promise(function (resolve, reject) {
                        self.schema.User.find({_id: inviteeId, active: 1}, function (err, data) {
                            if (err) {
                                reject(err);
                            } else {
                                if (data && data.length) {
                                    resolve(data[0]);
                                } else {
                                    reject(self.__('Account Not Found'));
                                }
                            }
                        });
                    });

                    yield new Promise(function (resolve, reject) {
                        self.schema.UserGroup.update({_id: userObj.friendGroupId}, {
                                updateTime: now.getTime()
                            },
                            function (err) {
                                err && reject(err) || resolve();
                            });
                    });

                    yield new Promise(function (resolve, reject) {
                        self.schema.UserGroupXref.update(
                            {
                                groupId: userObj.friendGroupId,
                                userId: creatorId
                            },
                            {
                                $set: {
                                    groupUpdateTime: now.getTime(),
                                    updateTime: now.getTime(),
                                    createTime: now.getTime(),
                                    userId: creatorId,
                                    groupId: userObj.friendGroupId,
                                    groupType: 1,
                                    active: 1
                                }
                            },
                            {upsert: true},
                            function (err) {
                                err && reject(err) || resolve();
                            }
                        );
                    });
                })(inviteeId, creatorId)
            );
        }
    }).then(function () {
        success({updateTime: now.getTime()});
    }, function (err) {
        fail(err);
    });
}

UserController.prototype.putAvatar = function (userId, request, success, fail) {
    var self = this,
        now = new Date();

    userId = commons.getFormString(userId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        var userContentPath = path.join(self.config.userFile.userContentPath, userId);

        let fileObj = yield new Promise(function (resolve, reject) {
            self.fileController.postFile(request, userContentPath, function (result) {
                if (result && result.length) {
                    var ext = path.extname(result[0]),
                        base = path.basename(result[0]);

                    if (ext === '.jpg' || ext === '.png') {
                        var name = base.substr(0, base.length - 4),
                            filePath = result[0];

                        if (name !== 'avatar') {
                            filePath = path.join(userContentPath, "avatar" + ext);
                            fs.renameSync(result[0], filePath);
                        }
                        resolve({filePath, ext});
                    } else {
                        reject(self.__('Wrong format Avatar'));
                    }
                } else {
                    reject("No files uploaded.");
                }
            }, function (err) {
                reject(err);
            });
        }.bind(self, request));

        //Keep avatar pics of two formats
        if (fileObj.ext === '.png') {
            //Convert to jpg
            yield new Promise(function (resolve, reject) {
                gm(fileObj.filePath).write(fileObj.filePath.replace('.png', '.jpg'), function (err) {
                    err && reject(err) || resolve();
                });
            });
        } else if (ext === '.jpg') {
            //Convert to png
            yield new Promise(function (resolve, reject) {
                gm(fileObj.filePath).write(fileObj.filePath.replace('.jpg', '.png'), function (err) {
                    err && reject(err) || resolve();
                });
            });
        }

        yield Promise.all(
            [
                new Promise(function (userId, resolve, reject) {
                    self.schema.User.update({_id: new self.db.Types.ObjectId(userId)}, {"$set": {updateTime: now.getTime()}}, function (err) {
                        err && reject(err) || resolve();
                    });
                }.bind(self, userId)),
                new Promise(function (userId, resolve, reject) {
                    self.schema.UserGroupXref.update({userId: new self.db.Types.ObjectId(userId)}, {"$set": {updateTime: now.getTime()}}, {multi: true}, function (err) {
                        err && reject(err) || resolve();
                    });
                }.bind(self, userId))
            ]
        );
    }).then(function () {
        success({updateTime: now.getTime()});
    }, function (err) {
        fail(err);
    });
}

/**
 * @description
 *
 * Update user information, except for 'active' field.
 *
 * @param userFilter
 * @param userObj
 * @param success
 * @param fail
 */
UserController.prototype.putUser = function (userFilter, userObj, success, fail) {
    var self = this,
        now = new Date();

    userFilter = (userFilter && JSON.parse(userFilter)) || {};
    userObj = (userObj && JSON.parse(userObj)) || {};
    //putInactivateUser is defined for updating 'active' field
    delete userObj.active;

    if (_.isEmpty(userFilter)) {
        fail(self.__('Empty Filter'));
        return;
    }
    if (_.isEmpty(userObj)) {
        fail(self.__('Empty User'));
        return;
    }
    if (userFilter._id) {
        userFilter._id = new self.db.Types.ObjectId(userFilter._id);
    }
    if (userFilter.updateTime && typeof userFilter.updateTime === "number") {
        userFilter.updateTime = {$gt: userFilter.updateTime};
    }
    userFilter.active = 1;
    userObj.updateTime = now.getTime();

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let userList = yield new Promise(function (userFilter, resolve, reject) {
            self.schema.User.find(userFilter, function (err, data) {
                err && reject(err) || resolve(data);
            });
        }.bind(self, userFilter));

        if (userList && userList.length) {
            var userIdList = _.pluck(userList, "_id");

            yield Promise.all(
                [
                    new Promise(function (resolve, reject) {
                        self.schema.UserGroupXref.update({
                            userId: {"$in": userIdList},
                            active: 1
                        }, {$set: {updateTime: now.getTime()}}, {multi: true}, function (err) {
                            err && reject(err) || resolve(data);
                        });
                    }),
                    new Promise(function (userFilter, userObj, resolve, reject) {
                        self.schema.User.update(userFilter, userObj, {multi: true}, function (err) {
                            err && reject(err) || resolve(data);
                        });
                    }.bind(self, userFilter, userObj))
                ]
            );
        }
    }).then(function () {
        success({updateTime: now.getTime()});
    }, function (err) {
        fail(err);
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

    userFilter = (userFilter && JSON.parse(commons.getFormString(userFilter))) || {};
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let userList = yield new Promise(function (userFilter, resolve, reject) {
            self.schema.User.find(userFilter, function (err, data) {
                err && reject(err) || resolve(data);
            });
        }.bind(self, userFilter));

        if (userList && userList.length) {
            yield Promise.all(
                userList.map(function (userObj) {
                    return co(function*() {
                        //Check if user has created some items
                        let leftOver = yield Promise.all(
                            new Promise(function (resolve, reject) {
                                self.schema.UserProject.find({userId: userObj._id}, function (err, data) {
                                    err && reject(err) || resolve(data || []);
                                });
                            }),
                            new Promise(function (resolve, reject) {
                                self.schema.Chat.find({
                                    creatorId: userObj._id,
                                    active: 1
                                }, function (err, data) {
                                    err && reject(err) || resolve(data || []);
                                });
                            }),
                            new Promise(function (resolve, reject) {
                                self.schema.UserGroupXref.find({
                                    userId: userObj._id,
                                    active: 1,
                                    groupType: 0
                                }, function (err, data) {
                                    err && reject(err) || resolve(data || []);
                                });
                            })
                        );
                        leftOver = Array.prototype.concat.apply(Array.prototype, leftOver);

                        //The user has left some operation records, make his info forbidden instead of inactive.
                        let setObj = {updateTime: now.getTime()};
                        if (leftOver.length) {
                            setObj.forbidden = 1;

                            //Forbid friend group
                            yield Promise.all(
                                new Promise(function(userObj, resolve, reject) {
                                    self.schema.UserGroup.update({_id: userObj.friendGroupId}, {
                                        forbidden: 1,
                                        updateTime: now.getTime()
                                    }, function (err) {
                                        err && reject(err) || resolve();
                                    });
                                }.bind(self, userObj)),
                                new Promise(function(userObj, resolve, reject) {
                                    self.schema.UserGroupXref.update({groupId: userObj.friendGroupId}, {
                                        groupUpdateTime: now.getTime()
                                    }, {multi: true}, function (err) {
                                        err && reject(err) || resolve();
                                    });
                                }.bind(self, userObj)),
                                new Promise(function(userObj, resolve, reject) {
                                    self.schema.UserGroupXref.update({userId: userObj._id}, {updateTime: now.getTime()}, {multi: true}, function (err) {
                                        err && reject(err) || resolve();
                                    });
                                }.bind(self, userObj))
                            );
                        } else {
                            setObj.active = 0;

                            //Inactivate friend group
                            yield Promise.all(
                                new Promise(function(userObj, resolve, reject) {
                                    self.schema.UserGroup.update({_id: userObj.friendGroupId}, {
                                        active: 0,
                                        updateTime: now.getTime()
                                    }, function (err) {
                                        err && reject(err) || resolve();
                                    });
                                }.bind(self, userObj)),
                                new Promise(function(userObj, resolve, reject) {
                                    self.schema.UserGroupXref.update({groupId: userObj.friendGroupId}, {
                                        active: 0,
                                        groupUpdateTime: now.getTime(),
                                        updateTime: now.getTime()
                                    }, {multi: true}, function (err) {
                                        err && reject(err) || resolve();
                                    });
                                }.bind(self, userObj)),
                                new Promise(function(userObj, resolve, reject) {
                                    self.schema.UserGroupXref.update({userId: userObj._id}, {
                                        active: 0,
                                        updateTime: now.getTime()
                                    }, {multi: true}, function (err) {
                                        err && reject(err) || resolve();
                                    });
                                }.bind(self, userObj))
                            );
                        }

                        yield new Promise(function(userObj, resolve, reject) {
                            self.schema.User.update({_id: userObj._id}, {"$set": setObj}, function (err) {
                                err && reject(err) || resolve();
                            });
                        }.bind(self, userObj));
                    });
                })
            );
        }
    }).then(function () {
        success({updateTime: now.getTime()});
    }, function (err) {
        fail(err);
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

    userFilter = (userFilter && JSON.parse(commons.getFormString(userFilter))) || {};
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function* () {
        let userList = yield new Promise(function(userFilter, resolve, reject) {
            self.schema.User.find(userFilter, function (err, data) {
                err && reject(err) || resolve(data);
            });
        }.bind(self, userFilter));

        if (userList && userList.length) {
            yield Promise.all(
                userList.map(function (userObj) {
                    return co(function*() {
                        yield new Promise(function(userObj, resolve, reject) {
                            var userContentPath = path.join(self.config.userFile.userContentPath, userObj._id.toString());

                            rimraf(userContentPath, function (err) {
                                if (err) {
                                    if (err.code !== "ENOENT") //Not Found
                                    {
                                        self.config.logger.error(err);
                                        reject(err);
                                    }
                                    else {
                                        self.config.logger.warn(err);
                                        resolve();
                                    }
                                } else {
                                    resolve();
                                }
                            });
                        }.bind(self, userObj));

                        yield Promise.all(
                            new Promise(function(userObj, resolve, reject) {
                                self.schema.UserGroupXref.remove({groupId: userObj.friendGroupId}, function (err) {
                                    err && reject(err) || resolve();
                                });
                            }.bind(self, userObj)),
                            new Promise(function(userObj, resolve, reject) {
                                self.schema.UserGroup.remove({_id: userObj.friendGroupId}, function (err) {
                                    err && reject(err) || resolve();
                                });
                            }.bind(self, userObj)),
                            new Promise(function(userObj, resolve, reject) {
                                self.schema.User.remove({_id: userObj._id}, function (err) {
                                    err && reject(err) || resolve();
                                });
                            }.bind(self, userObj))
                        );
                    });
                })
            );
        }
    }).then(function () {
        success();
    }, function (err) {
        fail(err);
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

    groupFilter = (groupFilter && JSON.parse(commons.getFormString(groupFilter))) || {};
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function* () {
        let groupList = yield new Promise(function(resolve, reject) {
            self.schema.UserGroup.find(groupFilter, function (err, data) {
                err && reject(err) || resolve(data);
            });
        });

        if (groupList && groupList.length) {
            yield new Promise(function(groupFilter, resolve, reject) {
                self.schema.UserGroup.update(groupFilter, {
                    active: 0,
                    updateTime: now.getTime()
                }, {multi: true}, function (err) {
                    err && reject(err) || resolve();
                });
            }.bind(self, groupFilter));

            yield Promise.all(
                groupList.map(function (groupObj) {
                    return new Promise(function(resolve, reject) {
                        self.schema.UserGroupXref.update({groupId: groupObj._id}, {
                            active: 0,
                            groupUpdateTime: now.getTime(),
                            updateTime: now.getTime()
                        }, {multi: true}, function (err) {
                            err && reject(err) || resolve();
                        });
                    });
                })
            );
        }
    }).then(function () {
        success({updateTime: now.getTime()});
    }, function (err) {
        fail(err);
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

    groupFilter = (groupFilter && JSON.parse(commons.getFormString(groupFilter))) || {};
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function* () {
        let groupList = yield new Promise(function(resolve, reject) {
            self.schema.UserGroup.find(groupFilter, function (err, data) {
                err && reject(err) || resolve(data);
            });
        });

        if (groupList && groupList.length) {
            yield new Promise(function(groupFilter, resolve, reject) {
                self.schema.UserGroup.remove(groupFilter, function (err) {
                    err && reject(err) || resolve();
                });
            }.bind(self, groupFilter));

            yield Promise.all(
                groupList.map(function (groupObj) {
                    return new Promise(function(resolve, reject) {
                        self.schema.UserGroupXref.remove({groupId: groupObj._id, active: 0}, function (err) {
                            err && reject(err) || resolve();
                        });
                    });
                })
            );
        }
    }).then(function () {
        success();
    }, function (err) {
        fail(err);
    });
}

module.exports = UserController;