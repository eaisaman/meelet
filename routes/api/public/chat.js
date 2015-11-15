require('useful-date');
var path = require('path');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
_.string = require('underscore.string');
_.mixin(_.string.exports());
var commons = require('../../../commons');

var ChatController = function () {
    var self = this;

    self.config = require('../../../config');
    self.config.on(self.config.ApplicationDBConnectedEvent, function (resource) {
        self.db = resource.instance;
        self.schema = resource.schema;
        self.isDBReady = true;
    });

};


/**
 * Get projects created by user, chat created by user, and chat invitation to user.
 *
 * @return {Void}
 */
ChatController.prototype.getJoinItems = function (userId, success, fail) {
    var self = this;

    userId = new self.db.Types.ObjectId(userId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (wCallback) {
                async.parallel(
                    {
                        project: function (callback) {
                            self.schema.UserProject.find({userId: userId}).sort({createTime: -1}).exec(function (err, data) {
                                callback(err, data);
                            });
                        },
                        chat: function (callback) {
                            async.waterfall([
                                function (next) {
                                    self.schema.Chat.find({creatorId: userId}).sort({createTime: -1}).exec(function (err, data) {
                                        next(err, data);
                                    });
                                },
                                function (chatList, next) {
                                    if (chatList && chatList.length) {
                                        async.eachLimit(chatList, 2, function (item, cb) {
                                            self.schema.UserProject.find({_id: item.projectId}, function (err, data) {
                                                if (!err) {
                                                    if (data && data.length) {
                                                        item.projectName = data[0].name;
                                                        item.thumbnail = data[0].thumbnail;
                                                    }
                                                } else {
                                                    cb(err);
                                                }
                                            });
                                        }, function (err) {
                                            next(err, _.filter(chatList, function (chat) {
                                                return chat.projectName != null;
                                            }))
                                        });
                                    } else {
                                        next(null, null);
                                    }
                                }
                            ], function (err, data) {
                                callback(err, data);
                            });
                        },
                        invitation: function (callback) {
                            async.waterfall([
                                function (next) {
                                    self.schema.Invitation.find({inviteeId: userId}).sort({createTime: -1}).exec(function (err, data) {
                                        if (!err) {
                                            next(null, data);
                                        } else {
                                            next(err);
                                        }
                                    });
                                },
                                function (invitationList, next) {
                                    var chatIdList = _.pluck(invitationList, "chatId");
                                    if (chatIdList && chatIdList.length) {
                                        var now = new Date();
                                        self.schema.Chat.find({
                                            state: {$ne: 3},
                                            endTime: null,
                                            expectEndTime: {$lt: now},
                                            _id: {$in: chatIdList}
                                        }, function (err, data) {
                                            if (!err) {
                                                next(null, _.filter(invitationList, function (invitation) {
                                                    return !data.every(function (chat) {
                                                        if (chat._id.toString() === invitation.chatId.toString()) {
                                                            invitation.projectId = chat.projectId;
                                                            return false;
                                                        }

                                                        return true;
                                                    });
                                                }));
                                            } else {
                                                next(err);
                                            }
                                        });
                                    } else {
                                        next(null, null);
                                    }
                                },
                                function (invitationList, next) {
                                    if (invitationList && invitationList.length) {
                                        async.eachLimit(invitationList, 2, function (item, cb) {
                                            //Invitation item's projectId is set during checking chat validity before
                                            self.schema.UserProject.find({_id: item.projectId}, function (err, data) {
                                                if (!err) {
                                                    if (data && data.length) {
                                                        item.projectName = data[0].name;
                                                        item.thumbnail = data[0].thumbnail;
                                                    }
                                                } else {
                                                    cb(err);
                                                }
                                            });
                                        }, function (err) {
                                            next(err, _.filter(invitationList, function (invitation) {
                                                return invitation.projectName != null;
                                            }))
                                        });
                                    } else {
                                        next(null, null);
                                    }
                                }
                            ], function (err, data) {
                                callback(err, data);
                            })
                        }
                    }, function (err, results) {
                        if (!err) {
                            var arr = [];

                            if (results.project && results.project.length) {
                                results.project.forEach(function (item) {
                                    arr.push({
                                        projectId: item._id,
                                        projectName: item.name,
                                        time: item.createTime,
                                        userId: item.userId,
                                        joinType: "project",
                                        thumbnail: item.thumbnail
                                    });
                                });
                            }

                            if (results.chat && results.chat.length) {
                                results.chat.forEach(function (item) {
                                    arr.push({
                                        projectId: item.projectId,
                                        projectName: item.projectName,
                                        time: item.createTime,
                                        userId: item.creatorId,
                                        chatId: item.chatId,
                                        joinType: "chat",
                                        route: item.route,
                                        chatState: item.state,
                                        thumbnail: item.thumbnail
                                    });
                                });
                            }

                            if (results.invitation && results.invitation.length) {
                                results.invitation.forEach(function (item) {
                                    arr.push({
                                        projectId: item.projectId,
                                        projectName: item.projectName,
                                        time: item.createTime,
                                        userId: item.userId,
                                        chatId: item.chatId,
                                        joinType: "invitation",
                                        route: item.route,
                                        thumbnail: item.thumbnail
                                    });
                                });
                            }

                            wCallback(null, arr);
                        } else {
                            wCallback(err);
                        }
                    }
                );
            },
            function (itemList, wCallback) {
                if (itemList && itemList.length) {
                    async.eachLimit(itemList, 2, function (item, cb) {
                        self.schema.User.find({_id: item.userId}, function (err, data) {
                            if (!err) {
                                if (data && data.length) {
                                    item.userName = data[0].name;
                                }
                            }

                            cb(err);
                        });
                    }, function (err) {
                        wCallback(err, itemList);
                    });
                } else {
                    wCallback(null);
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
 * Create new chat. Unclosed chat will be regarded as close if its expect end time lags behind now.
 *
 * @return {Void}
 *
 * Chat state:0. created, 1:open, 2:pause, 3:destroy or closed
 **/
ChatController.prototype.postChat = function (userId, projectId, route, success, fail) {
    var self = this,
        now = new Date();

    userId = new self.db.Types.ObjectId(userId);
    projectId = new self.db.Types.ObjectId(projectId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.User.find({_id: userId}, function (err, data) {
                if (!err) {
                    if (data && data.length) {
                        next(null);
                    } else {
                        next("Cannot find user.");
                    }
                } else {
                    next(err);
                }
            })
        },
        function (next) {
            self.schema.UserProject.find({_id: projectId}, function (err, data) {
                if (!err) {
                    if (data && data.length) {
                        next(null);
                    } else {
                        next("Cannot find project.");
                    }
                } else {
                    next(err);
                }
            })
        },
        function (next) {
            self.schema.Chat.create({
                "createTime": now,
                "updateTime": now,
                "startTime": null,
                "endTime": null,
                "expectEndTime": now.clone().adjust(Date.DAY, 1),
                "route": route,
                "projectId": projectId,
                "creatorId": userId,
                "state": 0
            }, function (err, data) {
                if (!err) {
                    next(null, data);
                } else {
                    next(err);
                }
            });
        }
    ], function (err, data) {
        if (!err) {
            success(data._id);
        } else {
            fail(err);
        }
    });
}

ChatController.prototype.putStartChat = function (userId, chatId, success, fail) {
    var self = this,
        now = new Date();

    chatId = new self.db.Types.ObjectId(chatId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Chat.update(
        {_id: chatId}, {"$set": {"state": 1, "startTime": now}}, function (err) {
            if (!err) {
                success();
            } else {
                fail(err);
            }
        });
}

ChatController.prototype.putPauseChat = function (userId, chatId, success, fail) {
    var self = this;

    chatId = new self.db.Types.ObjectId(chatId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Chat.update(
        {_id: chatId}, {"$set": {"state": 2}}, function (err) {
            if (!err) {
                success();
            } else {
                fail(err);
            }
        });
}

ChatController.prototype.putResumeChat = function (userId, chatId, success, fail) {
    var self = this;

    chatId = new self.db.Types.ObjectId(chatId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Chat.update(
        {_id: chatId}, {"$set": {"state": 1}}, function (err) {
            if (!err) {
                success();
            } else {
                fail(err);
            }
        });
}

/**
 * Close chat, close contained topic, remove unaccepted invitation and topic inviation so that user
 * won't see them before they expire and get removed.
 *
 * @return {Void}
 *
 **/
ChatController.prototype.putCloseChat = function (userId, chatId, success, fail) {
    var self = this,
        now = new Date();

    chatId = new self.db.Types.ObjectId(chatId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.parallel(
        [
            function (callback) {
                self.schema.Chat.update(
                    {_id: chatId}, {"$set": {"state": 3, "endTime": now}}, function (err) {
                        callback(err);
                    });
            },
            function (callback) {
                self.schema.Topic.update(
                    {chatId: chatId}, {"$set": {"state": 13, "endTime": now}}, function (err) {
                        callback(err);
                    });
            },
            function (callback) {
                self.schema.Invitation.remove(
                    {chatId: chatId, "accepted": false}, function (err) {
                        callback(err);
                    });
            },
            function (callback) {
                self.schema.TopicInvitation.remove(
                    {chatId: chatId, "accepted": false}, function (err) {
                        callback(err);
                    });
            }
        ], function (err) {
            if (!err) {
                success();
            } else {
                fail(err);
            }
        }
    );
}

ChatController.prototype.putInviteChat = function (userId, chatId, uids, route, success, fail) {
    var self = this;

    chatId = new self.db.Types.ObjectId(chatId);
    uids = JSON.parse(uids) || [];
    if (!uids.length) {
        process.nextTick(function () {
            success();
        });
        return;
    }
    uids = uids.map(function (userId) {
        return new self.db.Types.ObjectId(userId);
    });

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.Chat.find({
                    _id: chatId,
                    state: {$ne: 3},
                    endTime: null,
                    expectEndTime: {$lt: new Date()}
                }, function (err, data) {
                    if (!err) {
                        if (data && data.length) {
                            next(null, data[0]);
                        } else {
                            next("Cannot find chat.");
                        }
                    } else {
                        next(err);
                    }
                })
            },
            function (chatObj, next) {
                //Won't send invitation if already accepted
                self.schema.Invitation.find({
                    chatId: chatObj._id,
                    accepted: true,
                    inviteeId: {$in: uids}
                }, function (err, data) {
                    if (!err) {
                        var inviteeIdList = uids;
                        if (data && data.length) {
                            inviteeIdList = _.reject(uids, function (userId) {
                                return data.every(function (item) {
                                    return item.inviteeId.toString() !== userId.toString();
                                });
                            })
                        }

                        next(null, inviteeIdList);
                    } else {
                        next(err);
                    }
                });
            },
            function (inviteeIdList, next) {
                if (inviteeIdList && inviteeIdList.length) {
                    var now = new Date(),
                        expires = now.clone().adjust(Date.DAY, 1);

                    async.each(inviteeIdList, function (inviteeId, cb) {
                        self.schema.Invitation.create(
                            {
                                updateTime: now,
                                createTime: now,
                                route: route,
                                chatId: chatId,
                                userId: userId,
                                inviteeId: inviteeId,
                                accepted: false,
                                expires: expires
                            },
                            function (err) {
                                cb(err);
                            }
                        );
                    }, function (err) {
                        next(err, inviteeIdList, now);
                    })
                } else {
                    next(null, inviteeIdList);
                }
            },
            function (inviteeIdList, createTime, next) {
                //Remote old invitation for the same invitee
                if (inviteeIdList && inviteeIdList.length) {
                    self.schema.Invitation.remove({
                        _id: {$in: inviteeIdList},
                        createTime: {$lt: createTime}
                    }, function (err) {
                        next(err);
                    });
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

ChatController.prototype.putAcceptInvite = function (inviteeId, chatId, success, fail) {
    var self = this,
        now = new Date();

    inviteeId = new self.db.Types.ObjectId(inviteeId);
    chatId = new self.db.Types.ObjectId(chatId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Invitation.update({
        inviteeId: inviteeId,
        chatId: chatId
    }, {"$set": {updateTime: now, accepted: true}, "$unset": {expires: 1}}, function (err) {
        if (!err) {
            success();
        } else {
            fail(err);
        }
    });
}

//Topic state:0. created, 11:open, 12:pause, 13:destroy
ChatController.prototype.postTopic = function (userId, chatId, route, success, fail) {
    var self = this,
        now = new Date();

    userId = new self.db.Types.ObjectId(userId);
    chatId = new self.db.Types.ObjectId(chatId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.User.find({_id: userId}, function (err, data) {
                if (!err) {
                    if (data && data.length) {
                        next(null);
                    } else {
                        next("Cannot find user.");
                    }
                } else {
                    next(err);
                }
            })
        },
        function (next) {
            self.schema.Chat.find({_id: chatId}, function (err, data) {
                if (!err) {
                    if (data && data.length) {
                        next(null);
                    } else {
                        next("Cannot find chat.");
                    }
                } else {
                    next(err);
                }
            })
        },
        function (next) {
            self.schema.Topic.create({
                "createTime": now,
                "updateTime": now,
                "startTime": null,
                "endTime": null,
                "expectEndTime": now.clone().adjust(Date.DAY, 1),
                "chatId": chatId,
                "creatorId": userId,
                "route": route,
                "state": 11
            }, function (err, data) {
                if (!err) {
                    next(null, data);
                } else {
                    next(err);
                }
            });
        }
    ], function (err, data) {
        if (!err) {
            success(data._id);
        } else {
            fail(err);
        }
    });
}

ChatController.prototype.putInviteTopic = function (userId, topicId, uids, success, fail) {
    var self = this;

    topicId = new self.db.Types.ObjectId(topicId);
    uids = JSON.parse(uids) || [];
    if (!uids.length) {
        process.nextTick(function () {
            success();
        });
        return;
    }
    uids = uids.map(function (userId) {
        return new self.db.Types.ObjectId(userId);
    });

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.Topic.find({
                    _id: topicId,
                    state: {$ne: 13},
                    endTime: null,
                    expectEndTime: {$lt: new Date()}
                }, function (err, data) {
                    if (!err) {
                        if (data && data.length) {
                            next(null, data[0]);
                        } else {
                            next("Cannot find topic.");
                        }
                    } else {
                        next(err);
                    }
                })
            },
            function (topicObj, next) {
                //Won't send invitation if already accepted
                self.schema.TopicInvitation.find({
                    topicId: topicObj._id,
                    accepted: true,
                    inviteeId: {$in: uids}
                }, function (err, data) {
                    if (!err) {
                        var inviteeIdList = uids;
                        if (data && data.length) {
                            inviteeIdList = _.reject(uids, function (userId) {
                                return data.every(function (item) {
                                    return item.inviteeId.toString() !== userId.toString();
                                });
                            })
                        }

                        next(null, topicObj, inviteeIdList);
                    } else {
                        next(err);
                    }
                });
            },
            function (topicObj, inviteeIdList, next) {
                if (inviteeIdList && inviteeIdList.length) {
                    var now = new Date(),
                        expires = now.clone().adjust(Date.DAY, 1);

                    async.each(inviteeIdList, function (inviteeId, cb) {
                        self.schema.Invitation.create(
                            {
                                updateTime: now,
                                createTime: now,
                                route: topicObj.route,
                                chatId: topicObj.chatId,
                                topicId: topicId,
                                userId: userId,
                                inviteeId: inviteeId,
                                accepted: false,
                                expires: expires
                            },
                            function (err) {
                                cb(err);
                            }
                        );
                    }, function (err) {
                        next(err, inviteeIdList, now);
                    })
                } else {
                    next(null, inviteeIdList);
                }
            },
            function (inviteeIdList, createTime, next) {
                //Remote old invitation for the same invitee
                if (inviteeIdList && inviteeIdList.length) {
                    self.schema.TopicInvitation.remove({
                        _id: {$in: inviteeIdList},
                        createTime: {$lt: createTime}
                    }, function (err) {
                        next(err);
                    });
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

ChatController.prototype.putAcceptInviteTopic = function (inviteeId, topicId, success, fail) {
    var self = this,
        now = new Date();

    inviteeId = new self.db.Types.ObjectId(inviteeId);
    topicId = new self.db.Types.ObjectId(topicId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.TopicInvitation.update({
        inviteeId: inviteeId,
        topicId: topicId
    }, {"$set": {updateTime: now, accepted: true}, "$unset": {expires: 1}}, function (err) {
        if (!err) {
            success();
        } else {
            fail(err);
        }
    });
}

ChatController.prototype.putPauseTopic = function (userId, topicFilter, success, fail) {
    var self = this;

    topicFilter = topicFilter && JSON.parse(topicFilter);
    if (topicFilter) {
        if (topicFilter._id) {
            topicFilter._id = new self.db.Types.ObjectId(topicFilter._id);
        }
        if (topicFilter.chatId) {
            topicFilter.chatId = new self.db.Types.ObjectId(topicFilter.chatId);
        }
    } else {
        topicFilter = {"_id": {"$exists": false}};
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Topic.update(
        topicFilter, {"$set": {"state": 12}}, function (err, data) {
            if (!err) {
                success(_.pluck(data, "_id"));
            } else {
                fail(err);
            }
        });
}

ChatController.prototype.putResumeTopic = function (userId, topicFilter, success, fail) {
    var self = this;

    topicFilter = topicFilter && JSON.parse(topicFilter);
    if (topicFilter) {
        if (topicFilter._id) {
            topicFilter._id = new self.db.Types.ObjectId(topicFilter._id);
        }
        if (topicFilter.chatId) {
            topicFilter.chatId = new self.db.Types.ObjectId(topicFilter.chatId);
        }
    } else {
        topicFilter = {"_id": {"$exists": false}};
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Topic.update(
        topicFilter, {"$set": {"state": 11}}, function (err) {
            if (!err) {
                success(_.pluck(data, "id"));
            } else {
                fail(err);
            }
        });
}

/**
 * Close topic, remove unaccepted topic invitaion so that user won't see them before they expire and get removed.
 *
 * @return {Void}
 *
 **/
ChatController.prototype.putCloseTopic = function (userId, topicId, success, fail) {
    var self = this;

    topicId = new self.db.Types.ObjectId(topicId);

    //TODO Update topic's state, set end time, reset expires time.
    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.parallel(
        [
            function (callback) {
                self.schema.Topic.update(
                    {_id: topicId}, {"$set": {"state": 13, "endTime": new Date()}}, function (err) {
                        callback(err);
                    });
            },
            function (callback) {
                self.schema.TopicInvitation.remove(
                    {topicId: topicId, "accepted": false}, function (err) {
                        callback(err);
                    });
            }
        ], function (err) {
            if (!err) {
                success();
            } else {
                fail(err);
            }
        }
    );
}

module.exports = ChatController;
