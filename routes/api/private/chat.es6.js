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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let userObj = yield new Promise(function (userId, resolve, reject) {
            self.schema.User.find({_id: userId, active: 1}, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    if (!data || !data.length) {
                        reject(self.__('Account Not Found'));
                    } else {
                        resovle(_.pick(data[0], _.without(self.schema.User.fields, "password", "createTime")));
                    }
                }
            });
        }.bind(self, userId));

        let invitationFilter = {active: 1, accepted: 1, inviteeId: userId};
        if (chatId) {
            invitationFilter.chatId = chatId;
        }
        let invitationList = yield new Promise(function (resolve, reject) {
            self.schema.ChatInvitation.find(invitationFilter, function (err, data) {
                err && reject(err) || resolve(data);
            });
        });

        let chatList = [];
        if (invitationList && invitationList.length) {
            chatList = yield Promise.all(
                invitationList.map(function (invitationObj) {
                    return new Promise(function (resolve, reject) {
                        self.schema.Chat.find({_id: invitationObj.chatId, active: 1}, function (err, data) {
                            err && reject(err) || resolve(data && data.length && _.pick(data[0], _.without(self.schema.Chat.fields, "createTime", "active")));
                        });
                    });
                })
            );
            //Reject null values in results
            chatList = _.filter(chatList, chatItem => chatItem);
        }

        chatList = Array.prototype.concat.apply(Array.prototype, [chatList, yield new Promise(function (userId, resolve, reject) {
            self.schema.Chat.find({creatorId: userId, active: 1}, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    if (data && data.length) {
                        resolve(commons.arrayPick(data, _.without(self.schema.Chat.fields, "createTime", "active")));
                    } else {
                        resolve([]);
                    }
                }
            });
        }.bind(self, userId))]);

        chatList.forEach(chatObj => {
            chatObj.userList = [userObj];
        });

        let userMap = {};
        yield Promise.all(
            chatList.map(function (chatObj) {
                return new Promise(function (userMap, chatObj, userId, resolve, reject) {
                    self.schema.ChatInvitation.find({
                        chatId: chatObj._id,
                        inviteeId: {$ne: userId},
                        accepted: 1,
                        active: 1
                    }, function (err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            _.each(data, function (item) {
                                chatObj.userList.push(userMap[item.inviteeId] = userMap[item.inviteeId] || {_id: item.inviteeId});
                            })
                            resolve();
                        }
                    });
                }.bind(self, userMap, chatObj, userId));
            })
        );

        let userList = _.values(userMap);
        if (userList.length) {
            yield Promise.all(userList.map(function (userObj) {
                return new Promise(function (userObj, resolve, reject) {
                    self.schema.User.find({_id: userObj._id, active: 1}, function (err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            Object.assign(userObj, _.pick(data[0], _.without(self.schema.User.fields, "password", "createTime")));
                            resolve();
                        }
                    })
                }.bind(self, userObj));
            }));
        }

        yield chatList;
    }).then(function (result) {
        success(result);
    }, function (err) {
        fail(err);
    });
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let chatResult = yield {
            chat: new Promise(function (chatHistoryFilter, resolve, reject) {
                var chatFilter = {
                    creatorId: chatHistoryFilter.userId,
                    updateTime: chatHistoryFilter.chatTime,
                    active: 1
                };

                self.schema.Chat.find(chatFilter, function (err, data) {
                    err && reject(err) || resolve(data || []);
                });
            }.bind(self, chatHistoryFilter)),
            inviteChat: co.wrap(function*(chatHistoryFilter) {
                let chatIdList = yield new Promise(function (resolve, reject) {
                    var chatInvitationFilter = {
                        inviteeId: chatHistoryFilter.userId,
                        accepted: 1,
                        chatUpdateTime: chatHistoryFilter.chatInvitationTime,
                        active: 1
                    };

                    self.schema.ChatInvitation.find(chatInvitationFilter, function (err, data) {
                        err && reject(err) || resolve(_.pluck(data, "chatId"));
                    });
                });

                if (chatIdList && chatIdList.length) {
                    yield new Promise(function (resolve, reject) {
                        self.schema.Chat.find({
                            active: 1,
                            "_id": {"$in": chatIdList}
                        }, function (err, data) {
                            err && reject(err) || resolve(data || []);
                        });
                    });
                } else {
                    yield [];
                }
            })(chatHistoryFilter)
        };

        let chatList = Array.prototype.concat.apply(Array.prototype, [chatResult.chat, chatResult.inviteChat]);
        if (chatList && chatList.length) {
            yield Promise.all(
                chatList.map(function (chatItem) {
                    return co.wrap(function*(chatHistoryFilter, chatItem) {
                        var chatInvitationFilter = {
                            chatId: chatItem._id,
                            updateTime: chatHistoryFilter.chatInvitationTime,
                            active: 1
                        };
                        var conversationFilter = {chatId: chatItem._id, updateTime: chatHistoryFilter.conversationTime};
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

                        let results = yield {
                            chatInvitation: co(function*() {
                                let invitationList = yield new Promise(function (resolve, reject) {
                                    self.schema.ChatInvitation.find(chatInvitationFilter, function (err, data) {
                                        return err && reject(err) || resolve(data || []);
                                    });
                                });

                                let activeInvitationList = _.where(invitationList, {active: 1}),
                                    inactiveInvitationList = _.where(invitationList, {active: 0});

                                inactiveInvitationList && inactiveInvitationList.forEach(function (chatInvitation) {
                                    chatInvitation.chatUser = {_id: chatInvitation.inviteeId};
                                    chatInvitation.chatUser.chatId = chatInvitation.chatId;
                                    chatInvitation.chatUser.active = 0;
                                });

                                if (activeInvitationList && activeInvitationList.length) {
                                    yield Promise.all(
                                        activeInvitationList.map(function (chatInvitation) {
                                            return new Promise(function (chatInvitation, resolve, reject) {
                                                self.schema.User.find({
                                                    _id: chatInvitation.inviteeId,
                                                    active: 1
                                                }, function (err, data) {
                                                    if (err) {
                                                        reject(err);
                                                    } else {
                                                        var user = data[0];
                                                        chatInvitation.chatUser = _.pick(user, _.without(self.schema.User.fields, "password", "createTime"));
                                                        chatInvitation.chatUser.chatId = chatInvitation.chatId;
                                                        chatInvitation.chatUser.active = 1;
                                                        chatInvitation.chatUser.updateTime = chatInvitation.updateTime;

                                                        resolve();
                                                    }
                                                });
                                            }.bind(self, chatInvitation));
                                        })
                                    );
                                }

                                yield invitationList;
                            }),
                            conversation: new Promise(function (resolve, reject) {
                                self.schema.Conversation.find(conversationFilter, function (err, data) {
                                    return err && reject(err) || resolve(data || []);
                                });
                            }),
                            topic: new Promise(function (resolve, reject) {
                                self.schema.Topic.find(topicFilter, function (err, data) {
                                    err && reject(err) || resolve(data || []);
                                });
                            }),
                            topicInvitation: new Promise(function (resolve, reject) {
                                self.schema.TopicInvitation.find(topicInvitationFilter, function (err, data) {
                                    err && reject(err) || resolve(data || []);
                                });
                            })
                        };

                        chatItem.chatUser = commons.arrayPick(chatItem.chatInvitation, "chatUser");
                        chatItem.chatInvitation = commons.arrayPick(results.chatInvitation, _.without(self.schema.ChatInvitation.fields, "createTime"));
                        chatItem.conversation = commons.arrayPick(results.conversation, _.without(self.schema.Conversation.fields, "_id", "createTime"));
                        chatItem.topic = commons.arrayPick(results.topic, _.without(self.schema.Topic.fields, "createTime"));
                        chatItem.topicInvitation = commons.arrayPick(results.topicInvitation, _.without(self.schema.TopicInvitation.fields, "createTime", "expires"));
                    })(chatHistoryFilter, chatItem);
                })
            );

            yield commons.arrayPick(chatList, ["chatUser", "chatInvitation", "conversation", "topic", "topicInvitation"], _.without(self.schema.Chat.fields, "createTime"));
        } else {
            yield [];
        }
    }).then(function (result) {
        success(result);
    }, function (err) {
        fail(err);
    });
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let invitationList = yield new Promise(function (chatId, chatUserTime, resolve, reject) {
            self.schema.ChatInvitation.find({
                chatId: chatId,
                updateTime: chatUserTime,
                active: 1
            }, function (err, data) {
                return err && reject(err) || resolve(data || []);
            });
        }.bind(self, chatId, chatUserTime));

        var activeInvitationList = _.where(invitationList, {active: 1}),
            inactiveInvitationList = _.where(invitationList, {active: 0});

        inactiveInvitationList && inactiveInvitationList.forEach(function (chatInvitation) {
            chatInvitation.chatUser = {_id: chatInvitation.inviteeId};
            chatInvitation.chatUser.chatId = chatInvitation.chatId;
            chatInvitation.chatUser.active = 0;
        });

        if (activeInvitationList && activeInvitationList.length) {
            yield Promise.all(
                activeInvitationList.map(function (chatInvitation) {
                    return new Promise(function (chatInvitation, resolve, reject) {
                        self.schema.User.find({_id: chatInvitation.inviteeId, active: 1}, function (err, data) {
                            if (err) {
                                reject(err);
                            } else {
                                var user = data[0];
                                chatInvitation.chatUser = _.pick(user, _.without(self.schema.User.fields, "password", "createTime"));
                                chatInvitation.chatUser.chatId = chatInvitation.chatId;
                                chatInvitation.chatUser.active = 1;
                                chatInvitation.chatUser.updateTime = chatInvitation.updateTime;

                                resolve();
                            }
                        });
                    }.bind(self, chatInvitation));
                })
            );
        }

        yield commons.arrayPick(invitationList, "chatUser");
    }).then(function (result) {
        success(result);
    }, function (err) {
        fail(err);
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let userObj = yield new Promise(function (resolve, reject) {
            self.schema.User.find({_id: userId, active: 1}, function (err, data) {
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

        let chatObj = yield new Promise(function (resolve, reject) {
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
                return err && reject(err) || resolve(data);
            });
        });

        if (uids && uids.length) {
            yield new Promise(function (userId, deviceId, route, resolve, reject) {
                commons.createChat(userId.toString(), deviceId, chatObj._id.toString(), route, function (err) {
                    return err && reject(err) || resolve();
                });
            }.bind(self, userId, deviceId, route));

            let expires = now.clone().adjust(Date.DAY, self.chatConstants.recordTTL);

            yield new Promise(function (resolve, reject) {
                commons.sendChatInvitation(userId.toString(),
                    uids.map(function (item) {
                        return {uid: item._id, loginChannel: item.loginChannel}
                    }), chatObj._id.toString(), route, function (err) {
                        if (err) {
                            self.config.logger.error(err);
                        }

                        resolve();
                    });
            });

            let invitationList = yield Promise.all(
                uids.map(function (item) {
                    return new Promise(function (chatObj, route, resolve, reject) {
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
                                return err && reject(err) || resolve(data || []);
                            });
                    }.bind(self, chatObj, route));
                })
            );

            chatObj.invitationList = commons.arrayPick(invitationList, _.without(self.schema.ChatInvitation.fields, "createTime", "expires"));
        }

        yield _.pick(chatObj, "invitationList", _.without(self.schema.Chat.fields, "createTime"));
    }).then(function (result) {
        success(result);
    }, function (err) {
        fail(err);
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        yield new Promise(function (userId, deviceId, chatId, route, resolve, reject) {
            commons.createChat(userId.toString(), deviceId, chatId.toString(), route, function (err) {
                next(err);
            });
        }.bind(self, userId, deviceId, chatId, route));

        var expires = now.clone().adjust(Date.DAY, self.chatConstants.recordTTL);
        let chatObj = yield new Promise(function (chatId, resolve, reject) {
            self.schema.Chat.find({_id: chatId, active: 1}, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    if (data && data.length) {
                        resolve(data[0]);
                    } else {
                        reject(self.__('Chat Not Found'));
                    }
                }
            }.bind(self, chatId));
        });

        yield new Promise(function (uids, chatId, resolve, reject) {
            self.schema.ChatInvitation.find({
                chatId: chatId,
                accepted: 1,
                active: 1
            }, function (err, chatInvitationList) {
                if (!err) {
                    //If already sent chat invitation, skip him
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
        }.bind(self, uids, chatId));

        yield new Promise(function (userId, uids, resolve, reject) {
            commons.sendChatInvitation(userId.toString(),
                uids.map(function (item) {
                    return {uid: item._id, loginChannel: item.loginChannel}
                }), chatObj._id.toString(), route, function (err) {
                    if (err) {
                        self.config.logger.error(err);
                    }

                    resolve();
                });
        }.bind(self, userId, uids));

        yield Promise.all(
            uids.map(function (item) {
                return new Promise(function (chatId, userId, route, resolve, reject) {
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
                            return err && reject(err) || resolve();
                        }
                    );
                }.bind(self, chatId, userId, route));
            })
        );
    }).then(function () {
        success();
    }, function (err) {
        fail(err);
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
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putChangeChatState = function (userId, chatId, state, route, success, fail) {
    var self = this,
        now = new Date();

    userId = commons.getFormString(userId);
    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));
    state = commons.getFormInt(state);
    route = commons.getFormString(route) || self.chatConstants.chatRoute;

    var arr = [],
        setObj = {
            "state": state,
            "updateTime": now.getTime()
        };

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        if (state === self.chatConstants.chatOpenState) {
            yield new Promise(function (chatId, setObj, resolve, reject) {
                self.schema.Chat.find({_id: chatId, active: 1}, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        if (data && data.length) {
                            if (data[0].startTime == null) {
                                setObj.startTime = now.getTime();
                                setObj.expectEndTime = now.clone().adjust(Date.DAY, self.chatConstants.expectEndInterval).getTime();
                            }
                            resolve();
                        } else {
                            reject(self.__('Chat Not Found'));
                        }
                    }
                });
            }.bind(self, chatId, setObj));
        } else {
            setObj.endTime = now.getTime();
        }

        yield new Promise(function (chatId, setObj, resolve, reject) {
            self.schema.Chat.update(
                {_id: chatId}, {
                    "$set": setObj
                }, function (err) {
                    return err && reject(err) || resolve();
                });
        }.bind(self, chatId, setObj));

        yield new Promise(function (chatId, resolve, reject) {
            self.schema.ChatInvitation.update(
                {chatId: chatId}, {
                    "$set": {
                        "chatUpdateTime": now.getTime()
                    }
                }, {multi: true}, function (err) {
                    return err && reject(err) || resolve();
                });
        }.bind(self, chatId));

        yield new Promise(function (resolve, reject) {
            commons.notifyChatState(userId, chatId.toString(), route, state, function (err) {
                return err && reject(err) || resolve();
            });
        });
    }).then(function () {
        success({updateTime: now.getTime()});
    }, function (err) {
        fail(err);
    });
}

/**
 * @description
 *
 * @param userId
 * @param chatId
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putPauseChat = function (userId, chatId, route, success, fail) {
    var self = this;

    self.putChangeChatState(userId, chatId, self.chatConstants.chatPauseState, route, success, fail);
}

/**
 * @description
 *
 * @param userId
 * @param chatId
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putResumeChat = function (userId, chatId, route, success, fail) {
    var self = this;

    self.putChangeChatState(userId, chatId, self.chatConstants.chatOpenState, route, success, fail);
}

/**
 * @description
 *
 * Close chat, close contained topic, remove unaccepted chat invitation and topic invitation so that user
 * won't see them before they expire and get removed.
 *
 * @param userId
 * @param chatId
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putCloseChat = function (userId, chatId, route, success, fail) {
    var self = this,
        now = new Date();

    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));

    (!self.isDBReady && fail(new Error('DB not initialized'))) || Promise.all(
        new Promise(function (resolve, reject) {
            self.putChangeChatState(userId, chatId.toString(), self.chatConstants.chatCloseState, route, resolve, reject);
        }),
        new Promise(function (resolve, reject) {
            self.putChangeTopicState(JSON.stringify({
                chatId: chatId,
                state: {$ne: self.chatConstants.topicCloseState}
            }), self.chatConstants.topicCloseState, route, resolve, reject);
        }),
        new Promise(function (resolve, reject) {
            self.schema.ChatInvitation.remove(
                {chatId: chatId, "accepted": 0}, function (err) {
                    return err && reject(err) || resolve();
                });
        }),
        new Promise(function (resolve, reject) {
            self.schema.TopicInvitation.remove(
                {chatId: chatId, "accepted": 0}, function (err) {
                    return err && reject(err) || resolve();
                });
        })
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

        self.schema.Chat.update({_id: chatId}, {state: self.chatConstants.chatDestroyState, active: 0}, function (err) {
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
        (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
            let creatorObj = yield new Promise(function (resolve, reject) {
                self.schema.User.find({_id: userId, active: 1}, function (err, data) {
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

            let chatObj = yield new Promise(function (chatId, resolve, reject) {
                self.schema.Chat.find({
                    _id: chatId,
                    active: 1,
                    state: {$ne: self.chatConstants.chatCloseState},
                    endTime: null,
                    $or: [{expectEndTime: null}, {expectEndTime: {$lt: now.getTime()}}]
                }, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        if (data && data.length) {
                            resolve(data[0]);
                        } else {
                            reject(self.__('Chat Not Found'));
                        }
                    }
                })
            }.bind(self, chatId));

            if (chatInviteeList && chatInviteeList.length) {
                let chatInvitationArr = yield Promise.all(
                    chatInviteeList.map(
                        function (invitee) {
                            return co.wrap(function*(chatId, userId, route) {
                                var inviteeId = new self.db.Types.ObjectId(invitee._id);

                                yield new Promise(function (resolve, reject) {
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
                                            return err && reject(err) || resolve();
                                        }
                                    );
                                });

                                yield new Promise(function (resolve, reject) {
                                    self.schema.ChatInvitation.find({
                                        inviteeId: inviteeId,
                                        chatId: chatId,
                                        userId: userId,
                                        accepted: 0,
                                        processed: 0,
                                        active: 1
                                    }, function (err, data) {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            if (data && data.length) {
                                                resolve(data[0]);
                                            } else {
                                                reject(self.__("Chat Invitation Not Created"));
                                            }
                                        }
                                    });
                                });
                            })(chatId, userId, route);
                        }
                    )
                );

                var uids = chatInviteeList.map(function (invitee) {
                    return {uid: invitee._id, loginChannel: invitee.loginChannel}
                });

                yield new Promise(function (userId, uids, chatId, route, resolve, reject) {
                    commons.sendChatInvitation(userId.toString(), uids, chatId.toString(), route, function (err) {
                        return err && reject(err) || resolve();
                    });
                }.bind(self, userId, uids, chatId, route));

                yield commons.arrayPick(chatInvitationArr, _.without(self.schema.ChatInvitation.fields, "createTime", "expires"))
            }

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
 * Accept chat invitation. Modify 'chatUpdateTime' of other chat invitation in the same chat. Send message
 * to users in the chat.
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
    accepted = commons.getFormInt(accepted);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || Promise.all(
        new Promise(function (resolve, reject) {
            self.schema.ChatInvitation.update({
                inviteeId: userId,
                chatId: chatId,
                active: 1
            }, {
                "$set": {updateTime: now.getTime(), processed: 1, accepted: accepted},
                "$unset": {expires: 1}
            }, {multi: true}, function (err) {
                return err && reject(err) || resolve();
            });
        }),
        new Promise(function (resolve, reject) {
            if (accepted) {
                self.schema.ChatInvitation.update({
                    chatId: chatId,
                    active: 1
                }, {"$set": {chatUpdateTime: now.getTime()}}, {multi: true}, function (err) {
                    return err && reject(err) || resolve();
                });
            } else {
                resolve();
            }
        }),
        new Promise(function (resolve, reject) {
            if (accepted) {
                commons.acceptChatInvitation(userId.toString(), deviceId, chatId.toString(), route, function (err) {
                    if (err) {
                        self.config.logger.error(err);
                    }

                    resolve();
                });
            } else {
                resolve();
            }
        })
    );
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
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.postTopic = function (chatId, deviceId, topicObj, route, success, fail) {
    var self = this,
        now = new Date();

    chatId = new self.db.Types.ObjectId(commons.getFormString(chatId));
    deviceId = commons.getFormString(deviceId);
    topicObj = topicObj && JSON.parse(commons.getFormString(topicObj)) || {};
    route = commons.getFormString(route) || self.chatConstants.chatRoute;

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let chatObj = yield new Promise(function (chatId, resolve, reject) {
            self.schema.Chat.find({_id: chatId, active: 1}, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    if (data && data.length) {
                        resolve(data[0]);
                    } else {
                        reject(self.__('Chat Not Found'));
                    }
                }
            })
        }.bind(self, chatId));

        Object.assign(topicObj, {
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

        yield new Promise(function (topicObj, resolve, reject) {
            self.schema.Topic.create(topicObj, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    topicObj._id = data._id;
                    resolve();
                }
            });
        }.bind(self, topicObj));

        yield new Promise(function (topicObj, deviceId, route, resolve, reject) {
            commons.createTopic(topicObj.creatorId.toString(), deviceId, topicObj.chatId.toString(), topicObj._id.toString(), route, function (err) {
                if (err) {
                    self.config.logger.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        }.bind(self, topicObj, deviceId, route));

        let inviteeIdList = yield new Promise(function (topicObj, resolve, reject) {
            self.schema.ChatInvitation.find({chatId: topicObj.chatId, accepted: 1, active: 1}, function (err, data) {
                return err && reject(err) || resolve(_.pluck(data, "inviteeId"));
            });
        }.bind(self, topicObj));

        if (inviteeIdList && inviteeIdList.length) {
            let expires = now.clone().adjust(Date.DAY, self.chatConstants.recordTTL);

            let invitationList = yield Promise.all(
                inviteeIdList.map(function (inviteeId) {
                    return new Promise(function (chatId, topicObj, resolve, reject) {
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
                                return err && reject(err) || resolve(data);
                            }
                        );
                    }.bind(self, chatId, topicObj));
                })
            );

            topicObj.invitationList = commons.arrayPick(invitationList, _.without(self.schema.TopicInvitation.fields, "createTime", "expires"));
        }

        yield new Promise(function (topicObj, route, resolve, reject) {
            commons.sendTopicInvitation(topicObj.creatorId.toString(), topicObj.chatId.toString(), topicObj._id.toString(), route, function (err) {
                if (err) {
                    self.config.logger.error(err);
                }

                resolve();
            });
        }.bind(self, topicObj, route));

        yield _.pick(topicObj, "invitationList", _.without(self.schema.Topic.fields, "createTime"));
    }).then(function (result) {
        success(result);
    }, function (err) {
        fail(err);
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

    topicId = new self.db.Types.ObjectId(commons.getFormString(topicId));
    uids = JSON.parse(uids) || [];
    if (!uids.length) {
        success();
    }
    uids = uids.map(function (uid) {
        return new self.db.Types.ObjectId(uid);
    });

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let topicObj = yield new Promise(function (topicId, resolve, reject) {
            self.schema.Topic.find({
                _id: topicId,
                state: {$ne: self.chatConstants.topicCloseState},
                endTime: null
            }, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    if (data && data.length) {
                        resolve(data[0]);
                    } else {
                        reject(self.__('Topic Not Found'));
                    }
                }
            })
        }.bind(self, topicId));

        //Won't send topic invitation if already accepted
        let inviteeIdList = yield new Promise(function (uids, resolve, reject) {
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

                    resolve(inviteeIdList);
                } else {
                    reject(err);
                }
            });
        }.bind(self, uids));

        if (inviteeIdList && inviteeIdList.length) {
            var now = new Date(),
                expires = now.clone().adjust(Date.DAY, self.chatConstants.recordTTL);

            yield Promise.all(
                inviteeIdList.map(function (inviteeId) {
                    return co(function*() {
                        yield new Promise(function (topicObj, resolve, reject) {
                            commons.sendTopicInvitation(topicObj.chatId, topicObj._id, topicObj.creatorId, inviteeId, function (err) {
                                return err && reject(err) || resolve();
                            });
                        }.bind(self, topicObj));

                        yield new Promise(function (topicObj, inviteeId, resolve, reject) {
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
                                    return err && reject(err) || resolve();
                                }
                            );
                        }.bind(self, topicObj, inviteeId));
                    });
                })
            );

            yield new Promise(function (topicId, resolve, reject) {
                self.schema.TopicInvitation.find({
                    topicId: topicId,
                    inviteeId: {"$in": inviteeIdList},
                    active: 1
                }, function (err, data) {
                    return err && reject(err) || resolve(commons.arrayPick(data, _.without(self.schema.TopicInvitation.fields, "createTime", "expires")) || []);
                });
            }.bind(self, topicId));
        } else {
            yield [];
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
    accepted = commons.getFormInt(accepted);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let topicObj = yield new Promise(function (resolve, reject) {
            self.schema.Topic.find({
                _id: topicId,
                state: {$ne: self.chatConstants.topicCloseState},
                endTime: null
            }, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    if (data && data.length) {
                        resolve(data[0]);
                    } else {
                        reject(self.__('Topic Not Found'));
                    }
                }
            });
        });

        yield new Promise(function (inviteeId, topicId, accepted, resolve, reject) {
            self.schema.TopicInvitation.update({
                inviteeId: inviteeId,
                topicId: topicId,
                active: 1
            }, {
                "$set": {updateTime: now.getTime(), processed: 1, accepted: accepted},
                "$unset": {expires: 1}
            }, {multi: true}, function (err) {
                return err && reject(err) || resolve();
            });
        }.bind(self, inviteeId, topicId, accepted));
    }).then(function () {
        success({updateTime: now.getTime()});
    }, function (err) {
        fail(err);
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
ChatController.prototype.putChangeTopicState = function (topicFilter, state, route, success, fail) {
    var self = this,
        now = new Date();

    state = commons.getFormInt(state);
    route = commons.getFormString(route) || self.chatConstants.chatRoute;

    topicFilter = topicFilter && JSON.parse(commons.getFormString(topicFilter));
    if (topicFilter) {
        if (topicFilter._id) {
            topicFilter._id = new self.db.Types.ObjectId(topicFilter._id);
        }
        if (topicFilter.chatId) {
            topicFilter.chatId = new self.db.Types.ObjectId(topicFilter.chatId);
        }
    } else {
        fail(self.__('Empty Filter'));
        return;
    }

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        let topicList = new Promise(function (topicFilter, resolve, reject) {
            self.schema.Topic.find(topicFilter, function (err, data) {
                return err && reject(err) || resolve(data || []);
            });
        }.bind(self, topicFilter));

        if (topicList && topicList.length) {
            yield Promise.all(
                topicList.map(function (topicObj) {
                    return co.wrap(function*(route, state, resolve, reject) {
                        var setObj = {
                            "state": state,
                            "updateTime": now.getTime()
                        };

                        if (state === self.chatConstants.topicOpenState && topicObj.startTime == null) {
                            setObj.startTime = now.getTime();
                        } else if (state === self.chatConstants.topicCloseState) {
                            setObj.endTime = now.getTime();
                        }

                        yield [
                            new Promise(function (topicObj, resolve, reject) {
                                self.schema.Topic.update({
                                    _id: topicObj._id
                                }, {"$set": setObj}, function (err) {
                                    return err && reject(err) || resolve();
                                });
                            }.bind(self, topicObj)),
                            new Promise(function (resolve, reject) {
                                commons.notifyTopicState(topicObj.creatorId.toString(), topicObj.chatId.toString(), topicObj._id.toString(), route, state, function (err) {
                                    return err && reject(err) || resolve();
                                });
                            })
                        ];
                    })(route, state);
                })
            );
        }
    }).then(function (result) {
        success({updateTime: now.getTime()});
    }, function (err) {
        fail(err);
    });
}

/**
 * @description
 *
 * @param topicFilter
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putPauseTopic = function (topicFilter, route, success, fail) {
    var self = this;

    self.putChangeTopicState(topicFilter, self.chatConstants.topicPauseState, route, success, fail);
}

/**
 * @description
 *
 * @param topicFilter
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putResumeTopic = function (topicFilter, route, success, fail) {
    var self = this;

    self.putChangeTopicState(topicFilter, self.chatConstants.topicOpenState, route, success, fail);
}

/**
 * @description
 *
 * Close topic, remove unaccepted topic invitation so that user won't see them before they expire and get removed.
 *
 * @param topicId
 * @param route
 * @param success
 * @param fail
 */
ChatController.prototype.putCloseTopic = function (topicId, route, success, fail) {
    var self = this,
        now = new Date();

    topicId = commons.getFormString(topicId);

    (!self.isDBReady && fail(new Error('DB not initialized'))) || Promise.all(
        new Promise(function (resolve, reject) {
            self.putChangeTopicState(JSON.stringify({_id: topicId}), self.chatConstants.topicCloseState, route, function () {
                    resolve();
                }, function (err) {
                    reject(err);
                }
            );
        }),
        new Promise(function (resolve, reject) {
            self.schema.TopicInvitation.remove(
                {topicId: new self.db.Types.ObjectId(topicId), "accepted": 0}, function (err) {
                    return err && reject(err) || resolve();
                });
        })
    ).then(function () {
        success();
    }, function (err) {
        fail(err);
    });
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        yield new Promise(function (userId, uids, type, message, payload, route, resolve, reject) {
            commons.pushSingle(userId.toString(),
                uids.map(function (item) {
                    return {uid: item._id, loginChannel: item.loginChannel}
                }), {
                    type: type,
                    message: message,
                    payload: payload,
                    updateTime: now.getTime()
                }, route, function (err) {
                    return err && reject(err) || resolve();
                });
        }.bind(self, userId, uids, type, message, payload, route));

        yield Promise.all(
            uids.map(function (item) {
                return new Promise(function (userId, type, message, payload, route, resolve, reject) {
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
                        return err && reject(err) || resolve(data);
                    });
                }.bind(self, userId, type, message, payload, route));
            })
        );
    }).then(function (conversationList) {
        success(commons.arrayPick(conversationList, _.without(self.schema.Conversation.fields, "_id", "createTime", "chatId", "topicId")));
    }, function (err) {
        fail(err);
    });
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        yield new Promise(function (chatId, userId, uids, type, message, payload, route, resolve, reject) {
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
        }.bind(self, chatId, userId, uids, type, message, payload, route));

        yield new Promise(function (chatId, userId, type, message, payload, route, resolve, reject) {
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
                return err && reject(err) || resolve(data);
            });
        }.bind(self, chatId, userId, type, message, payload, route));
    }).then(function (conversationObj) {
        success(_.pick(conversationObj, _.without(self.schema.Conversation.fields, "_id", "createTime", "topicId", "receiverId")));
    }, function (err) {
        fail(err);
    });
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

    (!self.isDBReady && fail(new Error('DB not initialized'))) || co(function*() {
        yield new Promise(function (userId, chatId, topicId, type, message, payload, route, resolve, reject) {
            commons.pushTopic(userId.toString(), chatId.toString(), topicId.toString(), {
                type: type,
                message: message,
                payload: payload,
                updateTime: now.getTime()
            }, route, function (err) {
                return err && reject(err) || resolve();
            });
        }.bind(self, userId, chatId, topicId, type, message, payload, route));

        yield new Promise(function (userId, chatId, topicId, type, message, payload, route, resolve, reject) {
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
                return err && reject(err) || resolve(data);
            });
        }.bind(self, userId, chatId, topicId, type, message, payload, route));
    }).then(function (conversationObj) {
        success(_.pick(conversationObj, _.without(self.schema.Conversation.fields, "_id", "createTime", "receiverId")));
    }, function (err) {
        fail(err);
    });
}

module.exports = ChatController;
