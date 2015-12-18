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
 * Get projects created by user, chat created by user, and chat invitation to user.
 *
 * @param userId
 * @param success
 * @param fail
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
 * Get recent change to invitation.
 *
 * @param {string} invitationFilter The filter contains query conditions on Invitation collection's fields,
 *
 * @return {Void}
 */
ChatController.prototype.getInvitation = function (invitationFilter, success, fail) {
    var self = this;

    invitationFilter = (invitationFilter && JSON.parse(invitationFilter)) || {};
    if (invitationFilter.creatorId) {
        invitationFilter.creatorId = new self.db.Types.ObjectId(invitationFilter.creatorId);
    }
    if (invitationFilter.updateTime) {
        invitationFilter.updateTime = {$gt: new Date(invitationFilter.updateTime)};
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Invitation.find(invitationFilter, function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
    ;
}

/**
 * @description
 *
 * Get recent change to chat and its relevant topic, topic invitation, conversation.
 *
 * @param chatHistoryFilter
 * @param success
 * @param fail
 */
ChatController.prototype.getChatHistory = function (chatHistoryFilter, success, fail) {
    var self = this;

    chatHistoryFilter = (chatHistoryFilter && JSON.parse(chatHistoryFilter)) || {};
    if (chatHistoryFilter.userId) {
        chatHistoryFilter.userId = new self.db.Types.ObjectId(chatHistoryFilter.userId);
    }
    if (chatHistoryFilter.chatTime) {
        chatHistoryFilter.chatTime = {$gt: new Date(chatHistoryFilter.chatTime)};
    }
    if (chatHistoryFilter.chatInvitationTime) {
        chatHistoryFilter.chatInvitationTime = {$gt: new Date(chatHistoryFilter.chatInvitationTime)};
    }
    if (chatHistoryFilter.conversationTime) {
        chatHistoryFilter.conversationTime = {$gt: new Date(chatHistoryFilter.conversationTime)};
    }
    if (chatHistoryFilter.topicTime) {
        chatHistoryFilter.topicTime = {$gt: new Date(chatHistoryFilter.topicTime)};
    }
    if (chatHistoryFilter.topicInvitationTime) {
        chatHistoryFilter.topicInvitationTime = {$gt: new Date(chatHistoryFilter.topicInvitationTime)};
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                async.parallel(
                    {
                        chat: function (callback) {
                            var chatFilter = {
                                creatorId: chatHistoryFilter.userId,
                                updateTime: chatHistoryFilter.chatTime
                            };

                            self.schema.Chat.find(chatFilter, function (err, data) {
                                if (!err) {
                                    callback(null, data);
                                } else {
                                    callback(err);
                                }
                            });
                        },
                        inviteChat: function (callback) {
                            async.waterfall(
                                [
                                    function (cb) {
                                        var chatInvitationFilter = {
                                            inviteeId: chatHistoryFilter.userId,
                                            accepted: 1,
                                            chatUpdateTime: chatHistoryFilter.chatInvitationTime
                                        };

                                        self.schema.ChatInvitation.find(chatInvitationFilter, function (err, data) {
                                            cb(err, _.pluck(data, "chatId"));
                                        });
                                    },
                                    function (chatIdList, cb) {
                                        if (chatIdList && chatIdList.length) {
                                            self.schema.Chat.find({"_id": {"$in": chatIdList}}, function (err, data) {
                                                cb(err, data);
                                            });
                                        } else {
                                            cb(null);
                                        }
                                    }
                                ],
                                function (err, chatList) {
                                    callback(err, chatList);
                                }
                            );
                        }
                    }, function (err, results) {
                        if (!err) {
                            var chatList = Array.prototype.concat.apply(Array.prototype, [results.chat || [], results.inviteChat || []]);
                            next(err, chatList);
                        } else {
                            next(err);
                        }
                    });
            },
            function (chatList, next) {
                if (chatList && chatList.length) {
                    async.each(chatList, function (chatItem, cb) {
                        var chatInvitationFilter = {
                            chatId: chatItem._id,
                            updateTime: chatHistoryFilter.chatInvitationTime
                        };
                        var conversationFilter = {chatId: chatItem._id, updateTime: chatHistoryFilter.conversationTime};
                        var topicFilter = {chatId: chatItem._id, updateTime: chatHistoryFilter.topicTime};
                        var topicInvitationFilter = {
                            chatId: chatItem._id,
                            updateTime: chatHistoryFilter.topicInvitationTime
                        };

                        //If user is not the creator of chat, he only needs to care the new joiners of chat and topic.
                        if (chatItem.creatorId.toString() !== chatHistoryFilter.userId.toString()) {
                            chatInvitationFilter.accepted = 1;
                            topicInvitationFilter.accepted = 1;
                        }

                        async.parallel(
                            {
                                chatInvitation: function (callback) {
                                    self.schema.ChatInvitation.find(chatInvitationFilter, function (err, data) {
                                        if (!err) {
                                            var activeInvitationList = _.where(data, {active: 1}),
                                                inactiveInvitationList = _.where(data, {active: 0});

                                            inactiveInvitationList && inactiveInvitationList.forEach(function (chatInvitation) {
                                                chatInvitation.chatUser = {_id: chatInvitation.inviteeId};
                                                chatInvitation.chatUser.chatId = chatInvitation.chatId;
                                                chatInvitation.chatUser.active = 0;
                                            });

                                            if (activeInvitationList && activeInvitationList.length) {
                                                async.each(activeInvitationList, function (chatInvitation, eCallback) {
                                                    self.schema.User.find({_id: chatInvitation.inviteeId}, function (err, data) {
                                                        if (!err) {
                                                            var user = data[0];
                                                            chatInvitation.chatUser = _.pick(user, "_id", "name", "sex", "avatar", "tel");
                                                            chatInvitation.chatUser.chatId = chatInvitation.chatId;
                                                            chatInvitation.chatUser.active = 1;
                                                            chatInvitation.chatUser.updateTime = chatInvitation.updateTime;
                                                        }

                                                        eCallback(err);
                                                    });
                                                }, function (err) {
                                                    callback(err, data);
                                                });
                                            } else {
                                                callback(err, data);
                                            }
                                        } else {
                                            callback(err);
                                        }
                                    });
                                },
                                conversation: function (callback) {
                                    self.schema.Conversation.find(conversationFilter, function (err, data) {
                                        callback(err, data);
                                    });
                                },
                                topic: function (callback) {
                                    self.schema.Topic.find(topicFilter, function (err, data) {
                                        callback(err, data);
                                    });
                                },
                                topicInvitation: function (callback) {
                                    self.schema.TopicInvitation.find(topicInvitationFilter, function (err, data) {
                                        callback(err, data);
                                    });
                                }
                            }, function (err, results) {
                                if (!err) {
                                    chatItem.chatUser = commons.arrayPick(chatItem.chatInvitation, "chatUser");
                                    chatItem.chatInvitation = results.chatInvitation;
                                    chatItem.conversation = results.conversation;
                                    chatItem.topic = results.topic;
                                    chatItem.topicInvitation = results.topicInvitation;

                                    commons.arrayPurge(chatItem.chatInvitation, "chatUser");
                                }
                                cb(err);
                            }
                        );
                    }, function (err) {
                        next(err, chatList);
                    })
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
 * Get recent change to user list in chat.
 *
 * @param {string} chatId
 * @param {Date} chatUserTime
 *
 * @return {Void}
 */
ChatController.prototype.getChatUser = function (chatId, chatUserTime, succcess, fail) {
    var self = this;

    chatId = new self.db.Types.ObjectId(chatId);

    if (chatUserTime != null)
        chatUserTime = {$gt: new Date(chatUserTime)};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.ChatInvitation.find({
        chatId: chatId,
        updateTime: chatUserTime
    }, function (err, data) {
        if (!err) {
            var activeInvitationList = _.where(data, {active: 1}),
                inactiveInvitationList = _.where(data, {active: 0});

            inactiveInvitationList && inactiveInvitationList.forEach(function (chatInvitation) {
                chatInvitation.chatUser = {_id: chatInvitation.inviteeId};
                chatInvitation.chatUser.chatId = chatInvitation.chatId;
                chatInvitation.chatUser.active = 0;
            });

            if (activeInvitationList && activeInvitationList.length) {
                async.each(activeInvitationList, function (chatInvitation, eCallback) {
                    self.schema.User.find({_id: chatInvitation.inviteeId}, function (err, data) {
                        if (!err) {
                            var user = data[0];
                            chatInvitation.chatUser = _.pick(user, "_id", "name", "sex", "avatar", "tel");
                            chatInvitation.chatUser.chatId = chatInvitation.chatId;
                            chatInvitation.chatUser.active = 1;
                            chatInvitation.chatUser.updateTime = chatInvitation.updateTime;
                        }

                        eCallback(err);
                    });
                }, function (err) {
                    if (!err) {
                        success(data);
                    } else {
                        fail(err);
                    }
                });
            } else {
                success(data);
            }
        } else {
            fail(err);
        }
    });
}

/**
 * Get recent change to free conversation(not belonging to any chat).
 * Conversation Type: 1:text, 2:image, 3:video, 4:location, 5:voice, 6:file
 *
 * @param {string} conversationFilter The filter contains userId(sender or receiver's id),
 * updateTime(last update time of conversation set).
 *
 * @return {Void}
 */
ChatController.prototype.getConversation = function (conversationFilter, success, fail) {
    var self = this;

    conversationFilter = (conversationFilter && JSON.parse(conversationFilter)) || {};
    if (conversationFilter.userId) {
        var userId = new self.db.Types.ObjectId(conversationFilter.userId);
        conversationFilter.$or = [{
            senderId: userId,
            receiverId: userId
        }];
        delete conversationFilter.userId;
    }
    if (conversationFilter.updateTime != null)
        conversationFilter.updateTime = {$gt: new Date(conversationFilter.updateTime)};
    conversationFilter.chatId = {$exists: false};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Conversation.find(conversationFilter, function (err, data) {
        if (!err) {
            success(data);
        } else {
            fail(err);
        }
    });
}

/**
 * @description
 *
 * Send friend invitation to invitees. Invitation will be persisted first and sent as message to invitees' connected
 * client app or browser. If invitation already sent and marked inactive or rejected previously, update the record.
 *
 * @param userId
 * @param inviteeIdList
 * @param success
 * @param fail
 */
ChatController.prototype.postInvitation = function (userId, inviteeIdList, success, fail) {
    var self = this,
        now = new Date(),
        arr = [];

    userId = new self.db.Types.ObjectId(userId);
    inviteeIdList = (inviteeIdList && JSON.parse(inviteeIdList)) || {};

    inviteeIdList.forEach(function (inviteeId) {
        inviteeId = new self.db.Types.ObjectId(inviteeId);

        arr.push(
            function (cb) {
                async.waterfall(
                    [
                        function (next) {
                            self.schema.Invitation.find({
                                inviteeId: inviteeId,
                                creatorId: userId
                            }, function (err, data) {
                                next(err, data && data.length && data[0]);
                            });
                        },
                        function (invitation, next) {
                            var expires = now.adjust(Date.DAY, self.chatConstants.recordTTL);

                            if (invitation) {
                                _.extend(invitation, {
                                    updateTime: now,
                                    route: self.chatConstants.chatRoute,
                                    accepted: 0,
                                    processed: 0,
                                    expires: expires,
                                    active: 1
                                });

                                self.schema.Invitation.update(
                                    {
                                        _id: invitation._id
                                    },
                                    {
                                        "$set": _.pick(invitation, ["updateTime", "route", "accepted", "processed", "expires", "active"])
                                    }, function (err) {
                                        next(err, invitation);
                                    }
                                );
                            } else {
                                self.schema.Invitation.create(
                                    {
                                        updateTime: now,
                                        createTime: now,
                                        creatorId: userId,
                                        inviteeId: inviteeId,
                                        route: self.chatConstants.chatRoute,
                                        accepted: 0,
                                        processed: 0,
                                        expires: expires,
                                        active: 1
                                    }, function (err, data) {
                                        next(err, data);
                                    }
                                );
                            }
                        },
                        function (invitation, next) {
                            commons.sendInvitation(userId, inviteeId, function (err) {
                                next(err, invitation);
                            });
                        }
                    ],
                    function (err, data) {
                        cb(err, data);
                    }
                );
            }
        );
    });

    if (arr.length) {
        (!self.isDBReady && fail(new Error('DB not initialized'))) || async.parallel(arr, function (err, results) {
            if (!err) {
                success(results);
            } else {
                fail(err);
            }
        });
    } else {
        success();
    }
}

/**
 * @description
 *
 * Create new chat. Send chat invitation to invitees. Unclosed chat will be regarded as close if its
 * expect end time lags behind now.
 *
 * Chat state:0. created, 1:open, 2:pause, 3:destroy or closed
 *
 * @param {string} userId The chat creator id.
 * @param {string} name Chat name.
 * @param {Array} uids The members' id list.
 * @param {string} route
 * @param {Object} payload The content shared among members.
 * @param success
 * @param fail
 *
 * @return {Void}
 *
 **/
ChatController.prototype.postChat = function (userId, name, uids, route, payload, success, fail) {
    var self = this,
        now = new Date();

    userId = new self.db.Types.ObjectId(userId);
    route = route || self.chatConstants.chatRoute;
    payload = JSON.parse(payload) || {};

    uids = JSON.parse(uids) || [];
    uids = uids.map(function (userId) {
        return new self.db.Types.ObjectId(userId);
    });

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.User.find({_id: userId}, function (err, data) {
                if (!err) {
                    if (data && data.length) {
                        next(null);
                    } else {
                        next(self.__('Account Not Found'));
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
                "expectEndTime": null,
                "route": route,
                "payload": payload,
                "thumbnail": "",
                "creatorId": userId,
                "state": self.chatConstants.chatCreateState,
                "active": 1
            }, function (err, data) {
                if (!err) {
                    next(null, data);
                } else {
                    next(err);
                }
            });
        },
        function (chatObj, next) {
            if (uids.length) {
                async.each(uids, function (inviteeId, cb) {
                    commons.sendChatInvitation(chatObj._id, userId, inviteeId, cb);
                }, function (err) {
                    next(err, chatObj);
                });
            } else {
                next(null, chatObj);
            }
        }
    ], function (err, data) {
        if (!err) {
            success(data._id);
        } else {
            fail(err);
        }
    });
}

/**
 * @description
 *
 * Change chat state. Send state change message to users accepting chat invitation.
 *
 * @param chatId
 * @param state
 * @param success
 * @param fail
 */
ChatController.prototype.putChangeChatState = function (chatId, state, success, fail) {
    var self = this,
        now = new Date();

    if (typeof chatId === "string")
        chatId = new self.db.Types.ObjectId(chatId);

    var arr = [],
        setObj = {
            "state": state,
            "updateTime": now
        };

    if (state === self.chatConstants.chatOpenState) {
        arr.push(function (callback) {
            self.schema.Chat.find({_id: chatId}, function (err, data) {
                if (!err) {
                    if (data && data.length) {
                        if (data[0].startTime == null) {
                            setObj.startTime = now;
                            setObj.expectEndTime = now.clone().adjust(Date.DAY, self.chatConstants.expectEndInterval);
                        }

                        callback(null, data[0]);
                    } else {
                        callback(self.__('Chat Not Found'));
                    }
                } else {
                    callback(err);
                }
            });
        });
    } else if (state === self.chatConstants.chatCloseState) {
        setObj.endTime = now;
    }

    arr.push(
        function (callback) {
            self.schema.Chat.update(
                {_id: chatId}, {
                    "$set": setObj
                }, function (err) {
                    callback(err);
                });
        }
    );
    arr.push(function (callback) {
        self.schema.ChatInvitation.update(
            {chatId: chatId}, {
                "$set": {
                    "chatUpdateTime": now
                }
            }, {multi: true}, function (err) {
                callback(err);
            });
    });
    arr.push(function (callback) {
        self.schema.ChatInvitation.find(
            {chatId: chatId, accepted: 1}, function (err, data) {
                callback(err, _.pluck(data, "inviteeId"));
            });
    });
    arr.push(function (inviteeIdList, callback) {
        if (inviteeIdList && inviteeIdList.length) {
            async.each(inviteeIdList, function (inviteeId, cb) {
                commons.notifyChatState(chatId, inviteeId, state, cb);
            }, function (err) {
                callback(err);
            });
        } else {
            callback(null);
        }
    });

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(arr, function (err) {
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
 * @param chatId
 * @param success
 * @param fail
 */
ChatController.prototype.putStartChat = function (chatId, success, fail) {
    var self = this;

    self.putChangeChatState(chatId, self.chatConstants.chatOpenState, success, fail);
}

/**
 * @description
 *
 * @param chatId
 * @param success
 * @param fail
 */
ChatController.prototype.putPauseChat = function (chatId, success, fail) {
    var self = this;

    self.putChangeChatState(chatId, self.chatConstants.chatPauseState, success, fail);
}

/**
 * @description
 *
 * @param chatId
 * @param success
 * @param fail
 */
ChatController.prototype.putResumeChat = function (chatId, success, fail) {
    var self = this;

    self.putChangeChatState(chatId, self.chatConstants.chatOpenState, success, fail);
}

/**
 * @description
 *
 * Close chat, close contained topic, remove unaccepted chat invitation and topic invitation so that user
 * won't see them before they expire and get removed.
 *
 * @param chatId
 * @param success
 * @param fail
 */
ChatController.prototype.putCloseChat = function (chatId, success, fail) {
    var self = this;

    chatId = new self.db.Types.ObjectId(chatId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.parallel(
        [
            function (callback) {
                self.putChangeChatState(chatId, self.chatConstants.chatCloseState, function () {
                        callback(null);
                    }, function (err) {
                        callback(err);
                    }
                );
            },
            function (callback) {
                self.putChangeTopicState({chatId: chatId}, self.chatConstants.topicCloseState, function () {
                        callback(null);
                    }, function (err) {
                        callback(err);
                    }
                );
            },
            function (callback) {
                self.schema.ChatInvitation.remove(
                    {chatId: chatId, "accepted": 0}, function (err) {
                        callback(err);
                    });
            },
            function (callback) {
                self.schema.TopicInvitation.remove(
                    {chatId: chatId, "accepted": 0}, function (err) {
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

/**
 * @description
 *
 * Create new chat invitation for invitees who rejected or did not receive previously, and send it to them.
 *
 * @param {string} userId
 * @param {string} userId
 * @param {Array} uids
 * @param {string} route
 * @param success
 * @param fail
 *
 * @return {Void}
 *
 **/
ChatController.prototype.postChatInvitation = function (userId, chatId, uids, route, success, fail) {
    var self = this,
        now = new Date();

    chatId = new self.db.Types.ObjectId(chatId);
    uids = JSON.parse(uids) || [];
    if (!uids.length) {
        success();
    }
    uids = uids.map(function (userId) {
        return new self.db.Types.ObjectId(userId);
    });
    route = route || self.chatConstants.chatRoute;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.Chat.find({
                    _id: chatId,
                    state: {$ne: self.chatConstants.chatCloseState},
                    endTime: null,
                    expectEndTime: {$lt: now}
                }, function (err, data) {
                    if (!err) {
                        if (data && data.length) {
                            next(null, data[0]);
                        } else {
                            next(self.__('Chat Not Found'));
                        }
                    } else {
                        next(err);
                    }
                })
            },
            function (chatObj, next) {
                //Won't send chat invitation if already accepted
                self.schema.ChatInvitation.find({
                    chatId: chatId,
                    accepted: 1,
                    inviteeId: {$in: uids}
                }, function (err, data) {
                    if (!err) {
                        var inviteeIdList = uids;
                        if (data && data.length) {
                            inviteeIdList = _.filter(uids, function (userId) {
                                var index;
                                if (!data.every(function (item, i) {
                                        if (item.inviteeId.toString() === userId.toString()) {
                                            index = i;
                                            return false;
                                        }

                                        return true;
                                    })) {
                                    data.splice(index, 1);
                                }

                                return index == null;
                            })
                        }

                        next(null, inviteeIdList, chatObj);
                    } else {
                        next(err);
                    }
                });
            },
            function (inviteeIdList, chatObj, next) {
                if (inviteeIdList && inviteeIdList.length) {
                    var expires = now.clone().adjust(Date.DAY, self.chatConstants.recordTTL);

                    async.each(inviteeIdList, function (inviteeId, callback) {
                        async.waterfall(
                            [
                                function (cb) {
                                    self.schema.ChatInvitation.update(
                                        {
                                            chatId: chatObj._id,
                                            inviteeId: inviteeId,
                                        },
                                        {
                                            $set: {
                                                chatUpdateTime: chatObj.updateTime,
                                                updateTime: now,
                                                createTime: now,
                                                chatId: chatId,
                                                userId: userId,
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
                                            cb(err);
                                        }
                                    );
                                },
                                function (cb) {
                                    commons.sendChatInvitation(chatId, userId, inviteeId, cb);
                                }
                            ],
                            function (err) {
                                callback(err);
                            }
                        );
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

/**
 * @description
 *
 * Accept chat invitation. Modify 'chatUpdateTime' of other chat invitation in the same chat. Send message
 * to users in the chat.
 *
 * @param inviteeId
 * @param chatId
 * @param success
 * @param fail
 */
ChatController.prototype.putAcceptChatInvitation = function (inviteeId, chatId, success, fail) {
    var self = this,
        now = new Date();

    inviteeId = new self.db.Types.ObjectId(inviteeId);
    chatId = new self.db.Types.ObjectId(chatId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.ChatInvitation.update({
                inviteeId: inviteeId,
                chatId: chatId,
                active: 1
            }, {"$set": {updateTime: now, accepted: 1}, "$unset": {expires: 1}}, {multi: true}, function (err) {
                next(err);
            });
        },
        function (next) {
            self.schema.ChatInvitation.update({
                chatId: chatId,
                active: 1
            }, {"$set": {chatUpdateTime: now}}, {multi: true}, function (err) {
                next(err);
            });
        },
        function (next) {
            commons.acceptChatInvitation(chatId, inviteeId, next);
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
 * Create new topic in the chat. Send topic invitation to users in the chat. Only the chat creator is allowed to.
 *
 * Topic state:0. created, 11:open, 12:pause, 13:destroy
 *
 * @param chatId
 * @param topicObj
 * @param success
 * @param fail
 */
ChatController.prototype.postTopic = function (chatId, topicObj, success, fail) {
    var self = this,
        now = new Date();

    chatId = new self.db.Types.ObjectId(chatId);
    topicObj = JSON.parse(topicObj) || {};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.Chat.find({_id: chatId}, function (err, data) {
                if (!err) {
                    if (data && data.length) {
                        next(null, data[0]);
                    } else {
                        next(self.__('Chat Not Found'));
                    }
                } else {
                    next(err);
                }
            })
        },
        function (chatObj, next) {
            _.extend(topicObj, {
                "createTime": now,
                "updateTime": now,
                "startTime": now,
                "endTime": null,
                "chatId": chatId,
                "creatorId": chatObj.creatorId,
                "route": chatObj.route,
                "state": self.chatConstants.topicOpenState,
                "active": 1
            });

            self.schema.Topic.create(topicObj, function (err, data) {
                if (!err) {
                    next(null, data);
                } else {
                    next(err);
                }
            });
        }, function (topicObj, next) {
            self.schema.ChatInvitation.find({chatId: topicObj.chatId, accepted: 1}, function (err, data) {
                next(err, topicObj, _.pluck(data, "inviteeId"));
            });
        }, function (topicObj, inviteeIdList, next) {
            if (inviteeIdList && inviteeIdList.length) {
                async.each(inviteeIdList, function (inviteeId, cb) {
                    commons.sendTopicInvitation(topicObj.chatId, topicObj._id, topicObj.creatorId, inviteeId, cb);
                }, function (err) {
                    next(err, topicObj);
                });
            } else {
                next(null, topicObj);
            }
        }
    ], function (err, data) {
        if (!err) {
            success(data._id);
        } else {
            fail(err);
        }
    });
}

/**
 * @description
 *
 * Create new topic invitation for invitees who rejected or did not receive previously, and send it to them.
 *
 * @param topicId
 * @param uids
 * @param success
 * @param fail
 */
ChatController.prototype.postTopicInvitation = function (topicId, uids, success, fail) {
    var self = this;

    topicId = new self.db.Types.ObjectId(topicId);
    uids = JSON.parse(uids) || [];
    if (!uids.length) {
        success();
    }
    uids = uids.map(function (userId) {
        return new self.db.Types.ObjectId(userId);
    });

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.Topic.find({
                    _id: topicId,
                    state: {$ne: self.chatConstants.topicCloseState},
                    endTime: null
                }, function (err, data) {
                    if (!err) {
                        if (data && data.length) {
                            next(null, data[0]);
                        } else {
                            next(self.__('Topic Not Found'));
                        }
                    } else {
                        next(err);
                    }
                })
            },
            function (topicObj, next) {
                //Won't send topic invitation if already accepted
                self.schema.TopicInvitation.find({
                    topicId: topicObj._id,
                    accepted: 1,
                    inviteeId: {$in: uids}
                }, function (err, data) {
                    if (!err) {
                        var inviteeIdList = uids;
                        if (data && data.length) {
                            inviteeIdList = _.filter(uids, function (userId) {
                                var index;
                                if (!data.every(function (item, i) {
                                        if (item.inviteeId.toString() === userId.toString()) {
                                            index = i;
                                            return false;
                                        }

                                        return true;
                                    })) {
                                    data.splice(index, 1);
                                }

                                return index == null;
                            })
                        }

                        next(null, inviteeIdList, topicObj);
                    } else {
                        next(err);
                    }
                });
            },
            function (inviteeIdList, topicObj, next) {
                if (inviteeIdList && inviteeIdList.length) {
                    var now = new Date(),
                        expires = now.clone().adjust(Date.DAY, self.chatConstants.recordTTL);

                    async.each(inviteeIdList, function (inviteeId, callback) {
                        async.waterfall(
                            [
                                function (cb) {
                                    self.schema.TopicInvitation.update(
                                        {
                                            topicId: topicObj._id,
                                            inviteeId: inviteeId
                                        },
                                        {
                                            $set: {
                                                updateTime: now,
                                                createTime: now,
                                                route: topicObj.route,
                                                chatId: topicObj.chatId,
                                                topicId: topicObj._id,
                                                userId: topicObj.creatorId,
                                                inviteeId: inviteeId,
                                                accepted: 0,
                                                processed: 0,
                                                expires: expires,
                                                active: 1
                                            }
                                        },
                                        {upsert: true},
                                        function (err) {
                                            cb(err);
                                        }
                                    );
                                },
                                function (cb) {
                                    commons.sendTopicInvitation(chatId, topicObj._id, topicObj.creatorId, inviteeId, cb);
                                }
                            ],
                            function (err) {
                                callback(err);
                            }
                        );
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

/**
 * @description
 *
 * Accept topic invitation. Send message to the topic creator.
 *
 * @param inviteeId
 * @param topicId
 * @param success
 * @param fail
 */
ChatController.prototype.putAcceptTopicInvitation = function (inviteeId, topicId, success, fail) {
    var self = this,
        now = new Date();

    inviteeId = new self.db.Types.ObjectId(inviteeId);
    topicId = new self.db.Types.ObjectId(topicId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.Topic.find({
                _id: topicId,
                state: {$ne: self.chatConstants.topicCloseState},
                endTime: null
            }, function (err, data) {
                if (!err) {
                    if (data && data.length) {
                        next(null, data[0]);
                    } else {
                        next(self.__('Topic Not Found'));
                    }
                } else {
                    next(err);
                }
            });
        },
        function (topicObj, next) {
            self.schema.TopicInvitation.update({
                inviteeId: inviteeId,
                topicId: topicId,
                active: 1
            }, {"$set": {updateTime: now, accepted: 1}, "$unset": {expires: 1}}, {multi: true}, function (err) {
                next(err, topicObj);
            });
        },
        function (topicObj, next) {
            commons.acceptTopicInvitation(topicObj.chatId, topicId, inviteeId, next);
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
 * Change topic state. Send state change message to users accepting topic invitation.
 *
 * @param topicFilter
 * @param success
 * @param fail
 */
ChatController.prototype.putChangeTopicState = function (topicFilter, state, success, fail) {
    var self = this,
        now = new Date();

    if (topicFilter && typeof topicFilter === "string") {
        topicFilter = JSON.parse(topicFilter);
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
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
            function (next) {
                self.schema.Topic.find(topicFilter, function (err, data) {
                    if (!err) {
                        next(null, data);
                    } else {
                        next(err);
                    }
                });
            },
            function (topicList, next) {
                if (topicList && topicList.length) {
                    async.each(topicList, function (topicObj, cb) {
                        var setObj = {
                            "state": state,
                            "updateTime": now
                        };

                        if (state === self.chatConstants.topicOpenState && topicObj.startTime == null) {
                            setObj.startTime = now;
                        } else if (state === self.chatConstants.topicCloseState) {
                            setObj.endTime = now;
                        }

                        async.parallel([
                            function (callback) {
                                self.schema.Topic.update({
                                    _id: topicObj._id
                                }, {"$set": setObj}, function (err) {
                                    callback(err);
                                });
                            },
                            function (callback) {
                                async.waterfall([
                                    function (cb) {
                                        self.schema.TopicInvitation.find(
                                            {topicId: topicObj._id, accepted: 1}, function (err, data) {
                                                cb(err, _.pluck(data, "inviteeId"));
                                            });

                                    },
                                    function (inviteeIdList, cb) {
                                        if (inviteeIdList && inviteeIdList.length) {
                                            async.each(inviteeIdList, function (inviteeId, eCallback) {
                                                commons.notifyTopicState(topicObj.chatId, topicObj._id, inviteeId, state, eCallback);
                                            }, function (err) {
                                                cb(err);
                                            });
                                        } else {
                                            cb(null);
                                        }
                                    }
                                ], function (err) {
                                    callback(err);
                                });
                            }
                        ], function (err) {
                            cb(err);
                        });
                    }, function (err) {
                        next(err);
                    });
                } else {
                    next(null);
                }
            }
        ],
        function (err) {
            if (!err) {
                success();
            } else {
                fail(err);
            }
        }
    );
}

/**
 * @description
 *
 * @param topicFilter
 * @param success
 * @param fail
 */
ChatController.prototype.putPauseTopic = function (topicFilter, success, fail) {
    var self = this;

    self.putChangeTopicState(topicFilter, self.chatConstants.topicPauseState, success, fail);
}

/**
 * @description
 *
 * @param topicFilter
 * @param success
 * @param fail
 */
ChatController.prototype.putResumeTopic = function (userId, topicFilter, success, fail) {
    var self = this;

    self.putChangeTopicState(topicFilter, self.chatConstants.topicOpenState, success, fail);
}

/**
 * @description
 *
 * Close topic, remove unaccepted topic invitaion so that user won't see them before they expire and get removed.
 *
 * @param topicId
 * @param success
 * @param fail
 */
ChatController.prototype.putCloseTopic = function (topicId, success, fail) {
    var self = this;

    topicId = new self.db.Types.ObjectId(topicId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.parallel(
        [
            function (callback) {
                self.putChangeTopicState({topicId: topicId}, self.chatConstants.topicCloseState, function () {
                        callback(null);
                    }, function (err) {
                        callback(err);
                    }
                );
            },
            function (callback) {
                self.schema.TopicInvitation.remove(
                    {topicId: topicId, "accepted": 0}, function (err) {
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
