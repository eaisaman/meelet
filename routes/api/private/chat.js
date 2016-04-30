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
 * Get configuration of chat host, port, transport and isSecure
 *
 * @param name
 * @param success
 * @param fail
 */
ChatController.prototype.getChatConfiguration = function (success, fail) {
    success(commons.chatOptions);
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
    if (invitationFilter.inviteeId) {
        invitationFilter.inviteeId = new self.db.Types.ObjectId(invitationFilter.inviteeId);
    }
    if (invitationFilter.updateTime) {
        invitationFilter.updateTime = {$gt: invitationFilter.updateTime};
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Invitation.find(invitationFilter, function (err, data) {
        if (!err) {
            success(commons.arrayPick(data, _.without(self.schema.Invitation.fields, "createTime")));
        } else {
            fail(err);
        }
    });
}

/**
 * @description Get chat invitation.
 *
 * @param invitationFilter{object} The filter contains query conditions on ChatInvitation collection's fields,
 * @param success{function}
 * @param fail{function}
 */
ChatController.prototype.getChatInvitation = function (invitationFilter, success, fail) {
    var self = this;

    invitationFilter = (invitationFilter && JSON.parse(invitationFilter)) || {};
    if (invitationFilter.userId) {
        invitationFilter.userId = new self.db.Types.ObjectId(invitationFilter.userId);
    }
    if (invitationFilter.inviteeId) {
        invitationFilter.inviteeId = new self.db.Types.ObjectId(invitationFilter.inviteeId);
    }
    if (invitationFilter.chatId) {
        invitationFilter.chatId = new self.db.Types.ObjectId(invitationFilter.chatId);
    }
    if (invitationFilter.chatUpdateTime) {
        invitationFilter.chatUpdateTime = {$gt: invitationFilter.chatUpdateTime};
    }
    if (invitationFilter.updateTime) {
        invitationFilter.updateTime = {$gt: invitationFilter.updateTime};
    }
    invitationFilter.active = 1;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.ChatInvitation.find(invitationFilter, function (err, data) {
        if (!err) {
            success(commons.arrayPick(data, _.without(self.schema.ChatInvitation.fields, "createTime")));
        } else {
            fail(err);
        }
    });
}

/**
 * @description Get chat the user resides in, along with the belonging user list.
 *
 * @param userId{string}
 * @param chatId{string}
 * @param success{function}
 * @param fail{function}
 */
ChatController.prototype.getChat = function (userId, chatId, success, fail) {
    var self = this;

    userId = new self.db.Types.ObjectId(userId);
    if (chatId) {
        chatId = new self.db.Types.ObjectId(chatId);
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.User.find({_id: userId, active: 1}, function (err, data) {
                var userObj;
                if (!err) {
                    if (data && data.length) {
                        userObj = _.pick(data[0], _.without(self.schema.User.fields, "password", "createTime"));
                    }
                }
                if (!userObj) err = self.__('Account Not Found');
                next(err, userObj);
            });
        },
        function (userObj, next) {
            var invitationFilter = {active: 1, accepted: 1, inviteeId: userId};
            if (chatId) {
                invitationFilter.chatId = chatId;
            }

            self.schema.ChatInvitation.find(invitationFilter, function (err, data) {
                next(err, userObj, data);
            });
        },
        function (userObj, invitationList, next) {
            var userMap = {}, arr;

            if (invitationList && invitationList.length) {
                arr = invitationList.map(function (invitationObj) {
                    return function (callback) {
                        self.schema.Chat.find({_id: invitationObj.chatId, active: 1}, function (err, data) {
                            callback(err, data && data.length && data[0]);
                        });
                    }
                });
            }

            async.waterfall([
                function (wCallback) {
                    if (arr) {
                        async.parallel(arr, function (err, results) {
                            //Reject null values in results
                            var resultsArr = [];
                            results && results.forEach(function (result) {
                                if (result) {
                                    result = _.pick(result, _.without(self.schema.Chat.fields, "createTime", "creatorEncryption"));
                                    result.userList = [userObj];
                                    resultsArr.push(result);
                                }
                            });

                            wCallback(err, resultsArr);
                        });
                    } else {
                        wCallback(null, []);
                    }
                },
                function (chatList, wCallback) {
                    self.schema.Chat.find({creatorId: userId, active: 1}, function (err, data) {
                        if (!err) {
                            if (data && data.length) {
                                chatList = Array.prototype.concat.apply(Array.prototype, [chatList, commons.arrayPick(data, _.without(self.schema.Chat.fields, "createTime", "active"))]);
                                chatList.forEach(function (chatObj) {
                                    chatObj.userList = [userObj];
                                });
                            }
                        }

                        wCallback(err, chatList);
                    });
                },
                function (chatList, wCallback) {
                    async.each(chatList, function (chatObj, cb) {
                        self.schema.ChatInvitation.find({
                            chatId: chatObj._id,
                            inviteeId: {$ne: userId},
                            accepted: 1,
                            active: 1
                        }, function (err, data) {
                            if (!err) {
                                _.each(data, function (item) {
                                    chatObj.userList.push(userMap[item.inviteeId] = userMap[item.inviteeId] || {_id: item.inviteeId});
                                })
                            }

                            cb(null);
                        });
                    }, function (err) {
                        wCallback(err, chatList);
                    });
                },
                function (chatList, wCallback) {
                    async.each(_.values(userMap), function (userObj, eCallback) {
                        self.schema.User.find({_id: userObj._id, active: 1}, function (err, data) {
                            if (!err && data && data.length) {
                                _.extend(userObj, _.pick(data[0], _.without(self.schema.User.fields, "password", "createTime")));
                            }
                            eCallback(err, data);
                        })
                    }, function (err) {
                        wCallback(err, chatList);
                    });
                }
            ], function (err, data) {
                next(err, data);
            });
        }
    ], function (err, data) {
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
 * Get recent change to chat and its relevant topic, topic invitation, conversation.
 *
 * 1. Find the chat user created(chat), with chat user joined recently(inviteChat)
 * 2. Find all chat invitations(active and inactive), along with the invitee user object,
 * which can by used by user's client app to determine whether add new chat user or delete
 * 3. Find active conversations in the chat
 * 4. Find all topic(active and inactive) in the chat, which can by used by user's client app
 * to determine whether add new topic or delete
 * 5. Find all topic invitation(active and inactive) in the chat, which can by used by user's client app
 * to determine whether add new topic invitation or delete
 *
 * @param chatHistoryFilter
 * @param success
 * @param fail
 */
ChatController.prototype.getChatHistory = function (chatHistoryFilter, success, fail) {
    var self = this,
        dummyTime = {$gt: 0};

    chatHistoryFilter = (chatHistoryFilter && JSON.parse(chatHistoryFilter)) || {};
    if (chatHistoryFilter.userId) {
        chatHistoryFilter.userId = new self.db.Types.ObjectId(chatHistoryFilter.userId);
    }
    chatHistoryFilter.chatTime = chatHistoryFilter.chatTime && {$gt: chatHistoryFilter.chatTime} || dummyTime;
    chatHistoryFilter.chatInvitationTime = chatHistoryFilter.chatInvitationTime && {$gt: chatHistoryFilter.chatInvitationTime} || dummyTime;
    chatHistoryFilter.conversationTime = chatHistoryFilter.conversationTime && {$gt: chatHistoryFilter.conversationTime} || dummyTime;
    chatHistoryFilter.topicTime = chatHistoryFilter.topicTime && {$gt: chatHistoryFilter.topicTime} || dummyTime;
    chatHistoryFilter.topicInvitationTime = chatHistoryFilter.topicInvitationTime && {$gt: chatHistoryFilter.topicInvitationTime} || dummyTime;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                async.parallel(
                    {
                        chat: function (callback) {
                            var chatFilter = {
                                creatorId: chatHistoryFilter.userId,
                                updateTime: chatHistoryFilter.chatTime,
                                active: 1
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
                                            chatUpdateTime: chatHistoryFilter.chatInvitationTime,
                                            active: 1
                                        };

                                        self.schema.ChatInvitation.find(chatInvitationFilter, function (err, data) {
                                            cb(err, _.pluck(data, "chatId"));
                                        });
                                    },
                                    function (chatIdList, cb) {
                                        if (chatIdList && chatIdList.length) {
                                            self.schema.Chat.find({active: 1, "_id": {"$in": chatIdList}}, function (err, data) {
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
                        var conversationFilter = {
                            chatId: chatItem._id,
                            updateTime: chatHistoryFilter.conversationTime,
                            active: 1
                        };
                        var topicFilter = {chatId: chatItem._id, updateTime: chatHistoryFilter.topicTime};
                        var topicInvitationFilter = {
                            chatId: chatItem._id,
                            updateTime: chatHistoryFilter.topicInvitationTime,
                            active: 1
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
                                                    self.schema.User.find({_id: chatInvitation.inviteeId, active: 1}, function (err, data) {
                                                        if (!err) {
                                                            if (data && data.length) {
                                                            var user = data[0];
                                                            chatInvitation.chatUser = _.pick(user, _.without(self.schema.User.fields, "password", "createTime"));
                                                            chatInvitation.chatUser.chatId = chatInvitation.chatId;
                                                            chatInvitation.chatUser.active = 1;
                                                            chatInvitation.chatUser.updateTime = chatInvitation.updateTime;
                                                        }
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

                                    chatItem.chatInvitation = commons.arrayPick(chatItem.chatInvitation, _.without(self.schema.ChatInvitation.fields, "createTime"));
                                    chatItem.conversation = commons.arrayPick(chatItem.conversation, _.without(self.schema.Conversation.fields, "_id", "createTime"));
                                    chatItem.topic = commons.arrayPick(chatItem.topic, _.without(self.schema.Topic.fields, "createTime"));
                                    chatItem.topicInvitation = commons.arrayPick(chatItem.topicInvitation, _.without(self.schema.TopicInvitation.fields, "createTime", "expires"));
                                }
                                cb(err);
                            }
                        );
                    }, function (err) {
                        next(err, commons.arrayPick(chatList, ["chatUser", "chatInvitation", "conversation", "topic", "topicInvitation"], _.without(self.schema.Chat.fields, "createTime", "creatorEncryption")));
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
    chatUserTime = chatUserTime && {$gt: chatUserTime} || {$gt: 0};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.ChatInvitation.find({
        chatId: chatId,
        updateTime: chatUserTime,
        active: 1
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
                    self.schema.User.find({_id: chatInvitation.inviteeId, active: 1}, function (err, data) {
                        if (!err) {
                            var user = data[0];
                            chatInvitation.chatUser = _.pick(user, _.without(self.schema.User.fields, "password", "createTime"));
                            chatInvitation.chatUser.chatId = chatInvitation.chatId;
                            chatInvitation.chatUser.active = 1;
                            chatInvitation.chatUser.updateTime = chatInvitation.updateTime;
                        }

                        eCallback(err);
                    });
                }, function (err) {
                    if (!err) {
                        success(commons.arrayPick(data, "chatUser"));
                    } else {
                        fail(err);
                    }
                });
            } else {
                success(commons.arrayPick(data, "chatUser"));
            }
        } else {
            fail(err);
        }
    });
}

/**
 * Get recent change to conversation.
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
    var sendFilter = {}, receiveFilter = {};

    if (conversationFilter.userId) {
        var userId = new self.db.Types.ObjectId(conversationFilter.userId);
        sendFilter.senderId = userId;
        receiveFilter.receiverId = userId;
        delete conversationFilter.userId;
    }
    if (conversationFilter.chatUserId) {
        var chatUserId = new self.db.Types.ObjectId(conversationFilter.chatUserId);
        sendFilter.receiverId = chatUserId;
        receiveFilter.senderId = chatUserId;
        delete conversationFilter.chatUserId;
    }
    if (_.isEmpty(sendFilter) && _.isEmpty(receiveFilter)) {
        conversationFilter.$or = [
            sendFilter,
            receiveFilter
        ];
    } else if (_.isEmpty(sendFilter)) {
        _.extend(conversationFilter, sendFilter);
    } else if (_.isEmpty(receiveFilter)) {
        _.extend(conversationFilter, receiveFilter);
    }
    if (conversationFilter.chatId) {
        conversationFilter.chatId = new self.db.Types.ObjectId(conversationFilter.chatId);
    }
    if (conversationFilter.updateTime != null)
        conversationFilter.updateTime = {$gt: conversationFilter.updateTime};
    conversationFilter.active = 1;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || self.schema.Conversation.find(conversationFilter, function (err, data) {
        if (!err) {
            success(commons.arrayPick(data, _.without(self.schema.Conversation.fields, "_id", "createTime")));
        } else {
            fail(err);
        }
    });
}

/**
 * @description
 *
 * Create new chat. If uids is not empty, create chat channel and send chat invitation to invitees, otherwise
 * do nothing. Unclosed chat will be regarded as close if its expect end time lags behind now.
 *
 * Chat state:0. created, 1:open, 2:pause, 3:destroy or closed
 *
 * @param userId{string} The chat creator id.
 * @param deviceId{string}
 * @param name{string} Chat name.
 * @param uids{Array} Array of object containing _id&loginChannel.
 * @param route{string}
 * @param payload{Object} The content shared among members.
 * @param success{function}
 * @param fail{function}
 *
 * @return {Void}
 *
 **/
ChatController.prototype.postChat = function (userId, deviceId, name, uids, route, payload, success, fail) {
    var self = this,
        now = new Date();

    userId = new self.db.Types.ObjectId(commons.getFormString(userId));
    deviceId = commons.getFormString(deviceId);
    name = commons.getFormString(name);
    route = commons.getFormString(route) || self.chatConstants.chatRoute;
    payload = payload && JSON.parse(payload) || {};

    uids = uids && JSON.parse(uids) || [];

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.User.find({_id: userId, active: 1}, function (err, data) {
                if (!err) {
                    if (!data || !data.length) {
                        err = self.__('Account Not Found');
                    }
                }

                next(err, data && data.length && data[0]);
            });
        },
        function (userObj, next) {
            self.schema.Chat.create({
                "createTime": now.getTime(),
                "updateTime": now.getTime(),
                "startTime": null,
                "endTime": null,
                "expectEndTime": null,
                "route": route,
                "payload": payload,
                "thumbnail": "",
                "creatorId": userId,
                "creatorName": userObj.name,
                "name": name,
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
                commons.createChat(userId.toString(), deviceId, chatObj._id.toString(), route, function (err, msg) {
                    if (!err) {
                        _.extend(chatObj, msg);
                        next(null, chatObj, msg.creatorEncryption);
                    } else {
                        next(err);
                    }
                });
            } else {
                next(null, chatObj);
            }
        },
        function (chatObj, creatorEncryption, next) {
            self.schema.Chat.update({_id: chatObj._id}, {$set: {creatorEncryption: creatorEncryption}}, function (err) {
                next(err, chatObj);
            });
        },
        function (chatObj, next) {
            if (uids.length) {
                var expires = now.clone().adjust(Date.DAY, self.chatConstants.recordTTL);

                async.waterfall([
                    function (callback) {
                        commons.sendChatInvitation(userId.toString(),
                            uids.map(function (item) {
                                return {uid: item._id, loginChannel: item.loginChannel}
                            }), chatObj._id.toString(), deviceId, chatObj.creatorEncryption, route, function (err) {
                                if (err) {
                                    self.config.logger.error(err);
                                }

                                callback(null);
                            });
                    },
                    function (callback) {
                        var arr = [];

                        uids.forEach(function (item) {
                            arr.push(function (cb) {
                                var inviteeId = new self.db.Types.ObjectId(item._id);

                                self.schema.ChatInvitation.create(
                                    {
                                        "createTime": now.getTime(),
                                        "updateTime": now.getTime(),
                                        "chatUpdateTime": now.getTime(),
                                        "chatId": chatObj._id,
                                        "userId": userId,
                                        "creatorName": chatObj.creatorName,
                                        "chatName": chatObj.name,
                                        'inviteeId': inviteeId,
                                        'route': route,
                                        "accepted": 0,
                                        "processed": 0,
                                        "expires": expires,
                                        "active": 1
                                    }, function (err, data) {
                                        cb(err, data)
                                    });
                            });
                        });

                        async.parallel(arr, function (err, results) {
                            callback(err, results);
                        })
                    }
                ], function (err, invitationList) {
                    if (!err) {
                        chatObj.invitationList = commons.arrayPick(invitationList, _.without(self.schema.ChatInvitation.fields, "createTime", "expires"));
                    }

                    next(err, chatObj);
                });
            } else {
                next(null, chatObj);
            }
        }
    ], function (err, data) {
        if (!err) {
            success(_.pick(data, "invitationList", _.without(self.schema.Chat.fields, "createTime", "active")));
        } else {
            fail(err);
        }
    });
}

/**
 * @description
 *
 * Create chat channel and send chat invitation to invitees
 *
 * @param userId
 * @param deviceId
 * @param chatId
 * @param uids
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putStartChat = function (userId, deviceId, chatId, uids, route, success, fail) {
    var self = this,
        now = new Date();

    userId = new self.db.Types.ObjectId(commons.getFormString(userId));
    deviceId = commons.getFormString(deviceId);
    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));
    route = commons.getFormString(route) || self.chatConstants.chatRoute;

    uids = uids && JSON.parse(uids) || [];

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            commons.createChat(userId.toString(), deviceId, chatId.toString(), route, function (err) {
                next(err);
            });
        },
        function (next) {
            var expires = now.clone().adjust(Date.DAY, self.chatConstants.recordTTL);

            async.waterfall([
                function (callback) {
                    self.schema.Chat.find({_id: chatId, active: 1}, function (err, data) {
                        if (!err) {
                            if (!data || !data.length) {
                                err = self.__('Chat Not Found');
                            }
                        }

                        callback(err, data && data.length && data[0]);
                    });

                },
                function (chatObj, callback) {
                    self.schema.ChatInvitation.find({
                        chatId: chatId,
                        accepted: 1,
                        active: 1
                    }, function (err, chatInvitationList) {
                        if (!err) {
                            chatInvitationList && chatInvitationList.forEach(function (chatInvitation) {
                                var index;
                                if (!uids.every(function (uid, i) {
                                        if (uid._id === chatInvitation.inviteeId.toString()) {
                                            index = i;
                                            return false;
                                        }

                                        return true;
                                    })) {
                                    uids.splice(index, 1);
                                }
                            });
                        }

                        callback(err, chatObj);
                    });
                },
                function (chatObj, callback) {
                    commons.sendChatInvitation(userId.toString(),
                        uids.map(function (item) {
                            return {uid: item._id, loginChannel: item.loginChannel}
                        }), chatObj._id.toString(), deviceId, chatObj.creatorEncryption, route, function (err) {
                            if (err) {
                                self.config.logger.error(err);
                            }

                            callback(null, chatObj);
                        });
                },
                function (chatObj, callback) {
                    var arr = [];

                    uids.forEach(function (item) {
                        arr.push(function (cb) {
                            var inviteeId = new self.db.Types.ObjectId(item._id);

                            self.schema.ChatInvitation.update(
                                {
                                    chatId: chatId,
                                    userId: userId,
                                    inviteeId: inviteeId
                                },
                                {
                                    $set: {
                                        "createTime": now.getTime(),
                                        "updateTime": now.getTime(),
                                        "chatUpdateTime": now.getTime(),
                                        "chatId": chatId,
                                        "userId": userId,
                                        "chatName": chatObj.name,
                                        "creatorName": chatObj.creatorName,
                                        'inviteeId': inviteeId,
                                        'route': route,
                                        "accepted": 0,
                                        "processed": 0,
                                        "expires": expires,
                                        "active": 1
                                    }
                                },
                                {upsert: true},
                                function (err) {
                                    cb(err)
                                }
                            );
                        });
                    });

                    async.parallel(arr, function (err) {
                        callback(err);
                    })
                }
            ], function (err) {
                next(err);
            });
        }
    ], function (err, data) {
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
 * Change chat state. Send state change message to users accepting chat invitation.
 *
 * @param userId
 * @param chatId
 * @param state
 * @param deviceId
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putChangeChatState = function (userId, chatId, state, deviceId, route, success, fail) {
    var self = this,
        now = new Date();

    userId = commons.getFormString(userId);
    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));
    state = commons.getFormInt(state);
    deviceId = commons.getFormString(deviceId);
    route = commons.getFormString(route) || self.chatConstants.chatRoute;

    var arr = [],
        setObj = {
            "state": state,
            "updateTime": now.getTime()
        };

    if (state === self.chatConstants.chatOpenState) {
        arr.push(function (callback) {
            self.schema.Chat.find({_id: chatId, active: 1}, function (err, data) {
                if (!err) {
                    if (data && data.length) {
                        if (data[0].startTime == null) {
                            setObj.startTime = now.getTime();
                            setObj.expectEndTime = now.clone().adjust(Date.DAY, self.chatConstants.expectEndInterval).getTime();
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
    } else {
        arr.push(function (callback) {
            self.schema.Chat.find({_id: chatId, active: 1}, function (err, data) {
                if (!err) {
                    if (data && data.length) {
                        callback(null, data[0]);
                    } else {
                        callback(self.__('Chat Not Found'));
                    }
                } else {
                    callback(err);
                }
            });
        });
        setObj.endTime = now.getTime();
    }

    arr.push(
        function (chatObj, callback) {
            self.schema.Chat.update(
                {_id: chatId}, {
                    "$set": setObj
                }, function (err) {
                    callback(err, chatObj);
                });
        }
    );
    arr.push(function (chatObj, callback) {
        commons.notifyChatState(userId, chatId.toString(), route, state, deviceId, chatObj.creatorEncryption, callback);
    });
    arr.push(function (callback) {
        self.schema.ChatInvitation.update(
            {chatId: chatId}, {
                "$set": {
                    "chatUpdateTime": now.getTime()
                }
            }, {multi: true}, function (err) {
                callback(err);
            });
    });

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(arr, function (err) {
        if (!err) {
            success({updateTime: now.getTime()});
        } else {
            fail(err);
        }
    });
}

/**
 * @description
 *
 * @param userId
 * @param chatId
 * @param deviceId
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putPauseChat = function (userId, chatId, deviceId, route, success, fail) {
    var self = this;

    self.putChangeChatState(userId, chatId, self.chatConstants.chatPauseState, deviceId, route, success, fail);
}

/**
 * @description
 *
 * @param userId
 * @param chatId
 * @param deviceId
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putResumeChat = function (userId, chatId, deviceId, route, success, fail) {
    var self = this;

    self.putChangeChatState(userId, chatId, self.chatConstants.chatOpenState, deviceId, route, success, fail);
}

/**
 * @description
 *
 * Close chat, close contained topic, remove unaccepted chat invitation and topic invitation so that user
 * won't see them before they expire and get removed.
 *
 * @param userId
 * @param chatId
 * @param deviceId
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putCloseChat = function (userId, chatId, deviceId, route, success, fail) {
    var self = this,
        now = new Date();

    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.parallel(
        [
            function (callback) {
                self.putChangeChatState(userId, chatId.toString(), self.chatConstants.chatCloseState, deviceId, route, function () {
                        callback(null);
                    }, function (err) {
                        callback(err);
                    }
                );
            },
            function (callback) {
                self.putChangeTopicState(chatId.toString(), JSON.stringify({
                        state: {$ne: self.chatConstants.topicCloseState}
                    }), deviceId, self.chatConstants.topicCloseState, route, function () {
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
                success({updateTime: now.getTime()});
            } else {
                fail(err);
            }
        }
    );
}

/**
 * @description
 *
 * Close chat first, then mark chat as inactive for later purging.
 *
 * @param userId
 * @param chatId
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.deleteChat = function (userId, chatId, route, success, fail) {
    var self = this;

    self.putCloseChat(userId, chatId, route, function () {
        var now = new Date();
        chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));

        self.schema.Chat.update({_id: chatId}, {
            $set: {
                state: self.chatConstants.chatDestroyState,
                updateTime: now.getTime(),
                active: 0
            }
        }, function (err) {
            if (!err) {
                success({updateTime: now.getTime()});
            } else {
                fail(err);
            }
        });
    }, fail);
}

/**
 * @description
 *
 * Create new chat invitation for invitees who rejected or did not receive previously, and send it to them.
 *
 * @param {string} userId
 * @param {string} chatId
 * @param {Array} chatInviteeList
 * @param {string} route
 * @param success
 * @param fail
 *
 * @return {Void}
 *
 **/
ChatController.prototype.postChatInvitation = function (userId, chatId, chatInviteeList, route, success, fail) {
    var self = this,
        now = new Date();

    userId = new self.db.Types.ObjectId(commons.getFormString(userId));
    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));
    chatInviteeList = (chatInviteeList && JSON.parse(chatInviteeList)) || [];
    route = commons.getFormString(route) || self.chatConstants.chatRoute;

    if (chatInviteeList.length) {
        (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
            [
                function (next) {
                    self.schema.User.find({_id: userId, active: 1}, function (err, data) {
                        if (!err) {
                            if (!data || !data.length) {
                                err = self.__('Account Not Found');
                            }
                        }

                        next(err, data && data.length && data[0]);
                    });
                },
                function (creatorObj, next) {
                    self.schema.Chat.find({
                        _id: chatId,
                        active: 1,
                        state: {$ne: self.chatConstants.chatCloseState},
                        endTime: null,
                        $or: [{expectEndTime: null}, {expectEndTime: {$lt: now.getTime()}}]
                    }, function (err, data) {
                        var chatObj;
                        if (!err) {
                            if (data && data.length) {
                                chatObj = data[0];
                            } else {
                                err = self.__('Chat Not Found');
                            }
                        }

                        next(err, creatorObj, chatObj);
                    })
                },
                function (creatorObj, chatObj, next) {
                    var arr = [];

                    chatInviteeList.forEach(function (invitee) {
                        var inviteeId = new self.db.Types.ObjectId(invitee._id);

                        arr.push(function (next) {
                            async.waterfall(
                                [
                                    function (callback) {
                                        var expires = now.adjust(Date.DAY, self.chatConstants.recordTTL);

                                        self.schema.ChatInvitation.update(
                                            {
                                                chatId: chatId,
                                                userId: userId,
                                                inviteeId: inviteeId
                                            },
                                            {
                                                $set: {
                                                    updateTime: now.getTime(),
                                                    chatUpdateTime: now.getTime(),
                                                    createTime: now.getTime(),
                                                    creatorName: creatorObj.name,
                                                    chatName: chatObj.name,
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
                                                callback(err);
                                            }
                                        );
                                    },
                                    function (callback) {
                                        self.schema.ChatInvitation.find({
                                            inviteeId: inviteeId,
                                            chatId: chatId,
                                            userId: userId,
                                            accepted: 0,
                                            processed: 0,
                                            active: 1
                                        }, function (err, data) {
                                            if (!err) {
                                                if (!data || !data.length) {
                                                    err = self.__("Chat Invitation Not Created");
                                                }
                                            }

                                            callback(err, data && data.length && data[0]);
                                        });
                                    }
                                ], function (err, chatInvitationObj) {
                                    next(err, chatInvitationObj);
                                }
                            );
                        });
                    });

                    async.parallel(arr, function (err, results) {
                        next(err, chatObj, results);
                    });
                },
                function (chatObj, chatInvitationArr, next) {
                    var uids = chatInviteeList.map(function (invitee) {
                        return {uid: invitee._id, loginChannel: invitee.loginChannel}
                    });

                    commons.sendChatInvitation(userId.toString(), uids, chatId.toString(), deviceId, chatObj.creatorEncryption, route, function (err) {
                        next(err, chatObj, chatInvitationArr);
                    });
                },
                function (chatObj, chatInvitationArr, next) {
                    self.schema.Chat.update({_id: chatObj._id}, {$set: {updateTime: now.getTime()}}, function (err) {
                        next(err, chatInvitationArr);
                    });
                }
            ],
            function (err, data) {
                if (!err) {
                    success(commons.arrayPick(data, _.without(self.schema.ChatInvitation.fields, "createTime", "expires")));
                } else {
                    fail(err);
                }
            }
        );
    } else {
        success();
    }
}

/**
 * @description
 *
 * Accept chat invitation. Modify 'chatUpdateTime' of other chat invitation in the same chat, so that other users may
 * know who else join the chat, or user from different client app know which new chat he has joined.
 * Send message to users in the chat. If unaccepted, update chat invitation and kick user from session.
 *
 * @param userId
 * @param chatId
 * @param deviceId
 * @param accepted
 * @param success
 * @param fail
 */
ChatController.prototype.putAcceptChatInvitation = function (chatId, userId, deviceId, route, accepted, success, fail) {
    var self = this,
        now = new Date();

    userId = new self.db.Types.ObjectId(commons.getFormString(userId));
    deviceId = commons.getFormString(deviceId);
    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));
    route = commons.getFormString(route) || self.chatConstants.chatRoute;
    accepted = commons.getFormInt(accepted, 1);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.Chat.find({
                _id: chatId,
                active: 1
            }, function (err, data) {
                var chatObj;
                if (!err) {
                    if (data && data.length) {
                        chatObj = data[0];
                    } else {
                        err = self.__('Chat Not Found');
                    }
                }

                next(err, chatObj);
            })
        },
        function (chatObj, next) {
            self.schema.ChatInvitation.update({
                inviteeId: userId,
                chatId: chatId,
                active: 1
            }, {
                "$set": {updateTime: now.getTime(), processed: 1, accepted: accepted},
                "$unset": {expires: 1}
            }, {multi: true}, function (err) {
                next(err, chatObj);
            });
        },
        function (chatObj, next) {
            if (accepted) {
                self.schema.ChatInvitation.update({
                    chatId: chatId,
                    active: 1
                }, {"$set": {chatUpdateTime: now.getTime()}}, {multi: true}, function (err) {
                    next(err, chatObj);
                });
            } else {
                next(null, chatObj);
            }
        },
        function (chatObj, next) {
            if (accepted) {
                commons.acceptChatInvitation(userId.toString(), deviceId, chatId.toString(), chatObj.creatorEncryption, route, function (err) {
                    if (err) {
                        self.config.logger.error(err);
                    }

                    next(null);
                });
            } else {
                commons.disconnectChatUser(userId.toString(), deviceId, chatId.toString(), route, function (err) {
                    if (err) {
                        self.config.logger.error(err);
                    }

                next(null);
                });
            }
        },
        function (next) {
            self.schema.Chat.update({_id: chatId}, {$set: {updateTime: now.getTime()}}, function (err) {
                next(err);
            });
        }
    ], function (err) {
        if (!err) {
            success({updateTime: now.getTime()});
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
 * @param deviceId
 * @param topicObj
 * @param creatorEncryption
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.postTopic = function (chatId, deviceId, topicObj, creatorEncryption, route, success, fail) {
    var self = this,
        now = new Date();

    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));
    deviceId = commons.getFormString(deviceId);
    topicObj = topicObj && JSON.parse(commons.getFormString(topicObj)) || {};
    creatorEncryption = commons.getFormString(creatorEncryption);
    route = commons.getFormString(route) || self.chatConstants.chatRoute;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.Chat.find({_id: chatId, active: 1}, function (err, data) {
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
                "createTime": now.getTime(),
                "updateTime": now.getTime(),
                "startTime": now.getTime(),
                "endTime": null,
                "chatId": chatId,
                "creatorId": chatObj.creatorId,
                "creatorName": chatObj.creatorName,
                "route": route,
                "state": self.chatConstants.topicOpenState,
                "active": 1
            });

            self.schema.Topic.create(topicObj, function (err, data) {
                if (!err) {
                    next(null, chatObj, data);
                } else {
                    next(err);
                }
            });
        }, function (chatObj, topicObj, next) {
            commons.createTopic(topicObj.creatorId.toString(), deviceId, topicObj.chatId.toString(), topicObj._id.toString(), creatorEncryption, route, function (err) {
                if (err) {
                    self.config.logger.error(err);
                }

                next(err, topicObj);
            });
        }, function (topicObj, next) {
            self.schema.ChatInvitation.find({chatId: topicObj.chatId, accepted: 1, active: 1}, function (err, data) {
                next(err, topicObj, _.pluck(data, "inviteeId"));
            });
        }, function (topicObj, inviteeIdList, next) {
            if (inviteeIdList && inviteeIdList.length) {
                var expires = now.clone().adjust(Date.DAY, self.chatConstants.recordTTL),
                    arr = [];

                inviteeIdList.forEach(function (inviteeId) {
                    arr.push(function (callback) {
                        self.schema.TopicInvitation.create(
                            {
                                "updateTime": now.getTime(),
                                "createTime": now.getTime(),
                                "chatId": chatId,
                                "topicId": topicObj._id,
                                "userId": topicObj.creatorId,
                                "topicName": topicObj.name,
                                "creatorName": topicObj.creatorName,
                                "route": topicObj.route,
                                "inviteeId": inviteeId,
                                "accepted": 0,
                                "processed": 0,
                                "expires": expires,
                                "active": 1
                            }, function (err, data) {
                                callback(err, data);
                            }
                        );
                    });
                });

                async.parallel(arr, function (err, invitationList) {
                    if (!err) {
                        invitationList = commons.arrayPick(invitationList, _.without(self.schema.TopicInvitation.fields, "createTime", "expires"));
                        topicObj.invitationList = invitationList;
                    }

                    next(null, topicObj);
                });
            } else {
                next(null, topicObj);
            }
        }, function (topicObj, next) {
            commons.sendTopicInvitation(topicObj.creatorId.toString(), topicObj.chatId.toString(), topicObj._id.toString(), deviceId, creatorEncryption, route, function (err) {
                if (err) {
                    self.config.logger.error(err);
                }

                next(null, topicObj);
            });
        }
    ], function (err, data) {
        if (!err) {
            success(_.pick(data, "invitationList", _.without(self.schema.Topic.fields, "createTime")));
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
 * @param deviceId
 * @param creatorEncryption
 * @param success
 * @param fail
 */
ChatController.prototype.postTopicInvitation = function (topicId, uids, deviceId, creatorEncryption, success, fail) {
    var self = this;

    topicId = new self.db.Types.ObjectId(commons.getFormString(topicId));
    deviceId = commons.getFormString(deviceId);
    creatorEncryption = commons.getFormString(creatorEncryption);
    uids = JSON.parse(uids) || [];
    if (!uids.length) {
        success();
    }
    uids = uids.map(function (uid) {
        return new self.db.Types.ObjectId(uid);
    });

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall(
        [
            function (next) {
                self.schema.Topic.find({
                    _id: topicId,
                    state: {$ne: self.chatConstants.topicCloseState},
                    endTime: null,
                    active: 1
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
                    inviteeId: {$in: uids},
                    active: 1
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
                                    commons.sendTopicInvitation(chatId, topicObj._id, topicObj.creatorId, inviteeId, deviceId, creatorEncryption, cb);
                                },
                                function (cb) {
                                    self.schema.TopicInvitation.update(
                                        {
                                            topicId: topicObj._id,
                                            inviteeId: inviteeId
                                        },
                                        {
                                            $set: {
                                                updateTime: now.getTime(),
                                                createTime: now.getTime(),
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
                                }
                            ],
                            function (err) {
                                callback(err);
                            }
                        );
                    }, function (err) {
                        next(err, inviteeIdList);
                    });
                } else {
                    next(null, null);
                }
            },
            function (inviteeIdList, next) {
                if (inviteeIdList && inviteeIdList.length) {
                    self.schema.TopicInvitation.find({
                        topicId: topicId,
                        inviteeId: {"$in": inviteeIdList},
                        active: 1
                    }, function (err, data) {
                        next(err, data);
                    });
                } else {
                    next(null);
                }
            }
        ], function (err, data) {
            if (!err) {
                success(commons.arrayPick(data, _.without(self.schema.TopicInvitation.fields, "createTime", "expires")));
            } else {
                fail(err);
            }
        });
}

/**
 * @description
 *
 * Accept topic invitation.
 *
 * @param inviteeId
 * @param topicId
 * @param accepted
 * @param success
 * @param fail
 */
ChatController.prototype.putAcceptTopicInvitation = function (inviteeId, topicId, accepted, success, fail) {
    var self = this,
        now = new Date();

    inviteeId = new self.db.Types.ObjectId(commons.getFormString(inviteeId));
    topicId = new self.db.Types.ObjectId(commons.getFormString(topicId));
    accepted = commons.getFormInt(accepted, 1);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.Topic.find({
                _id: topicId,
                state: {$ne: self.chatConstants.topicCloseState},
                endTime: null,
                active: 1
            }, function (err, data) {
                if (!err) {
                    if (!data || !data.length) {
                        err = self.__('Topic Not Found');
                    }
                }
                next(err, data && data.length && data[0]);
            });
        },
        function (topicObj, next) {
            self.schema.TopicInvitation.update({
                inviteeId: inviteeId,
                topicId: topicId,
                active: 1
            }, {
                "$set": {updateTime: now.getTime(), processed: 1, accepted: accepted},
                "$unset": {expires: 1}
            }, {multi: true}, function (err) {
                next(err, topicObj);
            });
        }
    ], function (err) {
        if (!err) {
            success({updateTime: now.getTime()});
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
 * @param chatId
 * @param topicFilter
 * @param deviceId
 * @param creatorEncryption
 * @param state
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putChangeTopicState = function (chatId, topicFilter, deviceId, creatorEncryption, state, route, success, fail) {
    var self = this,
        now = new Date();

    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));
    state = commons.getFormInt(state);
    route = commons.getFormString(route) || self.chatConstants.chatRoute;
    deviceId = commons.getFormString(deviceId);
    creatorEncryption = commons.getFormString(creatorEncryption);

    topicFilter = topicFilter && JSON.parse(commons.getFormString(topicFilter));
    if (topicFilter) {
        if (topicFilter._id) {
            topicFilter._id = new self.db.Types.ObjectId(topicFilter._id);
        }
    } else {
        fail(self.__('Empty Filter'));
        return;
    }
    topicFilter.active = 1;

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
                            "updateTime": now.getTime()
                        };

                        if (state === self.chatConstants.topicOpenState && topicObj.startTime == null) {
                            setObj.startTime = now.getTime();
                        } else if (state === self.chatConstants.topicCloseState) {
                            setObj.endTime = now.getTime();
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
                                commons.notifyTopicState(topicObj.creatorId.toString(), chatId.toString(), topicObj._id.toString(), route, state, deviceId, creatorEncryption, callback);
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
                success({updateTime: now.getTime()});
            } else {
                fail(err);
            }
        }
    );
}

/**
 * @description
 *
 * @param chatId
 * @param topicFilter
 * @param deviceId
 * @param creatorEncryption
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putPauseTopic = function (chatId, topicFilter, deviceId, creatorEncryption, route, success, fail) {
    var self = this;

    self.putChangeTopicState(chatId, topicFilter, deviceId, creatorEncryption, self.chatConstants.topicPauseState, route, success, fail);
}

/**
 * @description
 *
 * @param chatId
 * @param topicFilter
 * @param deviceId
 * @param creatorEncryption
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putResumeTopic = function (chatId, topicFilter, deviceId, creatorEncryption, route, success, fail) {
    var self = this;

    self.putChangeTopicState(chatId, topicFilter, deviceId, creatorEncryption, self.chatConstants.topicOpenState, route, success, fail);
}

/**
 * @description
 *
 * Close topic, remove unaccepted topic invitation so that user won't see them before they expire and get removed.
 *
 * @param chatId
 * @param topicId
 * @param deviceId
 * @param creatorEncryption
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putCloseTopic = function (chatId, topicId, deviceId, creatorEncryption, route, success, fail) {
    var self = this,
        now = new Date();

    topicId = commons.getFormString(topicId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.parallel(
        [
            function (callback) {
                self.putChangeTopicState(chatId, JSON.stringify({_id: topicId}), deviceId, creatorEncryption, self.chatConstants.topicCloseState, route, function () {
                        callback(null);
                    }, function (err) {
                        callback(err);
                    }
                );
            },
            function (callback) {
                topicId = new self.db.Types.ObjectId(topicId);

                self.schema.TopicInvitation.remove(
                    {topicId: topicId, "accepted": 0}, function (err) {
                        callback(err);
                    });
            }
        ], function (err) {
            if (!err) {
                success({updateTime: now.getTime()});
            } else {
                fail(err);
            }
        }
    );
}

/**
 * @description
 *
 * Send conversation to specific users, not restricted to chat.
 *
 * @param userId{string}
 * @param uids{array} Array of objects containing _id&loginChannel
 * @param type{number}
 * @param message{string} Contains conversation display text.
 * @param payload{object} Contains payload type&data.
 * @param route{string}
 * @param success{function}
 * @param fail{function}
 */
ChatController.prototype.postSingleConversation = function (userId, uids, type, message, payload, route, success, fail) {
    var self = this,
        now = new Date();

    userId = new self.db.Types.ObjectId(commons.getFormString(userId));
    route = commons.getFormString(route) || self.chatConstants.chatRoute;
    type = commons.getFormInt(type);
    message = commons.getFormString(message);
    payload = payload && JSON.parse(payload) || {};

    if (uids) uids = JSON.parse(uids);

    if (!uids || !uids.length) {
        fail(self.__('Receiver Empty'));
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            var arr = [];

            uids.forEach(function (item) {
                arr.push(function (cb) {
                    self.schema.Conversation.create({
                        updateTime: now.getTime(),
                        createTime: now.getTime(),
                        chatId: null,
                        topicId: null,
                        senderId: userId,
                        receiverId: new self.db.Types.ObjectId(commons.getFormString(item._id)),
                        route: route,
                        type: type,
                        message: message,
                        payload: payload,
                        active: 1
                    }, function (err, data) {
                        cb(err, data);
                    });
                });
            });

            async.parallel(arr, function (err, results) {
                next(err, results);
            });
        },
        function (conversationList, next) {
            commons.pushSingle(userId.toString(),
                uids.map(function (item) {
                    return {uid: item._id, loginChannel: item.loginChannel}
                }), {
                    type: type,
                    message: message,
                    payload: payload,
                    updateTime: now.getTime()
                }, route, function (err) {
                    next(err, conversationList);
                });
        }
    ], function (err, conversationList) {
        if (!err) {
            success(commons.arrayPick(conversationList, _.without(self.schema.Conversation.fields, "_id", "createTime", "chatId", "topicId")));
        } else {
            fail(err);
        }
    })
}

/**
 * @description
 *
 * Send conversation to users in chat if specified, or all users in chat.
 *
 * @param userId{string}
 * @param chatId{string}
 * @param uids{array} Array of objects containing _id&loginChannel
 * @param type{number}
 * @param message{string} Contains conversation display text.
 * @param payload{object} Contains payload type&data.
 * @param route{string}
 * @param success{function}
 * @param fail{function}
 */
ChatController.prototype.postConversation = function (userId, chatId, uids, type, message, payload, route, success, fail) {
    var self = this,
        now = new Date();

    userId = new self.db.Types.ObjectId(commons.getFormString(userId));
    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));
    route = commons.getFormString(route) || self.chatConstants.chatRoute;
    type = commons.getFormInt(type);
    message = commons.getFormString(message);
    payload = payload && JSON.parse(payload) || {};

    if (uids) uids = JSON.parse(uids);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.Conversation.create({
                updateTime: now.getTime(),
                createTime: now.getTime(),
                chatId: chatId,
                topicId: null,
                senderId: userId,
                receiverId: null,
                route: route,
                type: type,
                message: message,
                payload: payload,
                active: 1
            }, function (err, data) {
                next(err, data);
            });
        },
        function (conversationObj, next) {
            commons.push(userId.toString(), chatId.toString(),
                uids && uids.map(function (item) {
                    return {uid: item._id, loginChannel: item.loginChannel}
                }), {
                    type: type,
                    message: message,
                    payload: payload,
                    updateTime: now.getTime()
                }, route, function (err) {
                    next(err, conversationObj);
                });
        }
    ], function (err, conversationObj) {
        if (!err) {
            success(_.pick(conversationObj, _.without(self.schema.Conversation.fields, "_id", "createTime", "topicId", "receiverId")));
        } else {
            fail(err);
        }
    })
}

/**
 * @description
 *
 * Send conversation to topic creator.
 *
 * @param userId{string}
 * @param chatId{string}
 * @param topicId{string}
 * @param type{number}
 * @param message{string} Contains conversation display text.
 * @param payload{object} Contains payload type&data.
 * @param route{string}
 * @param success{function}
 * @param fail{function}
 */
ChatController.prototype.postTopicConversation = function (userId, chatId, topicId, type, message, payload, route, success, fail) {
    var self = this,
        now = new Date();

    userId = new self.db.Types.ObjectId(commons.getFormString(userId));
    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));
    topicId = new self.db.Types.ObjectId(commons.getFormString(topicId));
    route = commons.getFormString(route) || self.chatConstants.chatRoute;
    type = commons.getFormString(type);
    message = commons.getFormString(message);
    payload = payload && JSON.parse(payload) || {};

    (!self.isDBReady && fail(new Error('DB not initialized'))) || async.waterfall([
        function (next) {
            self.schema.Conversation.create({
                updateTime: now.getTime(),
                createTime: now.getTime(),
                chatId: chatId,
                topicId: topicId,
                senderId: userId,
                receiverId: null,
                route: route,
                type: type,
                message: message,
                payload: payload,
                active: 1
            }, function (err, data) {
                next(err, data);
            });
        },
        function (conversationObj, next) {
            commons.pushTopic(userId.toString(), chatId.toString(), topicId.toString(), {
                type: type,
                message: message,
                payload: payload,
                updateTime: now.getTime()
            }, route, function (err) {
                next(err, conversationObj);
            });
        }
    ], function (err, conversationObj) {
        if (!err) {
            success(_.pick(conversationObj, _.without(self.schema.Conversation.fields, "_id", "createTime", "receiverId")));
        } else {
            fail(err);
        }
    })
}

module.exports = ChatController;
