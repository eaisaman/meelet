var chathost = process.env['mocha.chathost'];
var chatport = process.env['mocha.chatport'];
var chatroute = process.env['mocha.chatroute'];
var chattransport = process.env['mocha.chattransport'];
var pomeloclient;

if (chattransport === "websocket") {
    global.WebSocket = require('ws');
    pomeloclient = require('../pomelo-websocket-client').pomelo;
} else if (chattransport === "sio") {
    global.io = require("socket.io-client");
    pomeloclient = require('../pomeloclient').pomelo;
}

var request = require("request");
var should = require("should");
var async = require('async');
var mongo = require('mongodb');
var _ = require('underscore');
var uuid = require('node-uuid');

var scheme = process.env['mocha.scheme'];
var server = process.env['mocha.server'];
var port = process.env['mocha.port'];
var url = scheme + "://" + server + ":" + port + "/";

var mongohost = process.env['mocha.mongohost'];
var mongoport = process.env['mocha.mongoport'];
var mongouser = process.env['mocha.mongouser'];
var mongopwd = process.env['mocha.mongopwd'];
var mongodb = process.env['mocha.mongodb'];

var userHostObj = {
    deviceId: uuid.v4(),
    plainPassword: "*",
    loginName: "13341692882",
    name: "王强",
    sex: "M",
    tel: "13341692882",
    emitter: new (require('events').EventEmitter)(),
    pomelo: new pomeloclient()
};
var userGuest1Obj = {
    deviceId: uuid.v4(),
    plainPassword: "*",
    loginName: "13988781193",
    name: "张思懿",
    sex: "M",
    tel: "13988781193",
    emitter: new (require('events').EventEmitter)(),
    pomelo: new pomeloclient()
};
var userGuest2Obj = {
    deviceId: uuid.v4(),
    plainPassword: "*",
    loginName: "18041552870",
    name: "赵明扬",
    sex: "M",
    tel: "18041552870",
    emitter: new (require('events').EventEmitter)(),
    pomelo: new pomeloclient()
};
var groupObj = {
    name: "Mocha Fake Group"
};
var pomeloSignal = {
    'inviteSignal': 901,
    'messageSignal': 902,
    'acceptSignal': 903,

    'chatInviteSignal': 1001,
    'chatConnectSignal': 1002,
    'chatDisconnectSignal': 1003,
    'chatPauseSignal': 1004,
    'chatResumeSignal': 1005,
    'chatMessageSignal': 1006,
    'chatAcceptSignal': 1007,
    'chatCloseSignal': 1008,

    'topicInviteSignal': 2001,
    'topicPauseSignal': 2002,
    'topicResumeSignal': 2003,
    'topicMessageSignal': 2004,
    'topicCloseSignal': 2005,
    'topicDisconnectSignal': 2006
}
var conversationType = {
    "TextConversation": 1,
    "ImageConversation": 2,
    "VideoConversation": 3,
    "LocationConversation": 4,
    "VoiceConversation": 5,
    "FileConversation": 6
}

function onEvent(emitter) {
    return function (data) {
        var signal = data.signal,
            eventType;

        switch (signal) {
            case pomeloSignal.inviteSignal:
                eventType = "invite";
                break;
            case pomeloSignal.messageSignal:
                eventType = "message";
                break;
            case pomeloSignal.acceptSignal:
                eventType = "accept";
                break;
            case pomeloSignal.chatInviteSignal:
                eventType = "chatInvite";
                break;
            case pomeloSignal.chatConnectSignal:
                eventType = "chatConnect";
                break;
            case pomeloSignal.chatDisconnectSignal:
                eventType = "chatDisconnect";
                break;
            case pomeloSignal.chatPauseSignal:
                eventType = "chatPause";
                break;
            case pomeloSignal.chatResumeSignal:
                eventType = "chatResume";
                break;
            case pomeloSignal.chatMessageSignal:
                eventType = "chatMessage";
                break;
            case pomeloSignal.chatAcceptSignal:
                eventType = "chatAccept";
                break;
            case pomeloSignal.chatCloseSignal:
                eventType = "chatClose";
                break;
            case pomeloSignal.topicInviteSignal:
                eventType = "topicInvite";
                break;
            case pomeloSignal.topicPauseSignal:
                eventType = "topicPause";
                break;
            case pomeloSignal.topicResumeSignal:
                eventType = "topicResume";
                break;
            case pomeloSignal.topicMessageSignal:
                eventType = "topicMessage";
                break;
            case pomeloSignal.topicCloseSignal:
                eventType = "topicClose";
                break;
            case pomeloSignal.topicDisconnectSignal:
                eventType = "topicDisconnect";
                break;
        }

        emitter.emit(eventType, data);
    }
}

describe('Chat', function () {
    var MongoClient = mongo.MongoClient;
    var dbUrl = 'mongodb://' + mongouser + ':' + mongopwd + '@' + mongohost + ':' + mongoport + '/' + mongodb;

    before("Clean all left testing data", function (done) {
        MongoClient.connect(dbUrl, function (err, db) {
            should.not.exist(err);

            async.parallel([
                function (next) {
                    db.collection('User').remove({}, {multi: true}, next);
                },
                function (next) {
                    db.collection('UserGroup').remove({}, {multi: true}, next);
                },
                function (next) {
                    db.collection('UserGroupXref').remove({}, {multi: true}, next);
                },
                function (next) {
                    db.collection('Chat').remove({}, {multi: true}, next);
                },
                function (next) {
                    db.collection('Topic').remove({}, {multi: true}, next);
                },
                function (next) {
                    db.collection('Conversation').remove({}, {multi: true}, next);
                },
                function (next) {
                    db.collection('Invitation').remove({}, {multi: true}, next);
                },
                function (next) {
                    db.collection('ChatInvitation').remove({}, {multi: true}, next);
                },
                function (next) {
                    db.collection('TopicInvitation').remove({}, {multi: true}, next);
                }
            ], function (err) {
                try {
                    db.close();
                } catch (e) {
                }

                should.not.exist(err);

                done();
            });
        });
    });

    before("Create user & user group", function (done) {
        async.waterfall([
            function (next) {
                async.each([userHostObj, userGuest1Obj, userGuest2Obj], function (userObj, cb) {
                    var formData = {
                        userObj: JSON.stringify(userObj)
                    };

                    request.post({
                        url: url + "api/public/user",
                        formData: formData
                    }, function (err, httpResponse, body) {
                        if (!err) {
                            if (httpResponse.statusCode !== 200) err = body;
                            else {
                                var ret = JSON.parse(body);
                                if (ret.result === "OK") {
                                    ret.resultValue.should.have.enumerables(['_id', 'forbidden', 'loginName', 'name', 'loginChannel', 'sex', 'tel', 'friendGroupId']);
                                    _.extend(userObj, ret.resultValue);
                                } else {
                                    err = ret.reason;
                                }
                            }
                        }
                        cb(err);
                    });
                }, function (err) {
                    next(err);
                });
            },
            function (next) {
                groupObj.creatorId = userHostObj._id;
                var uids = [userHostObj._id];

                request.post({
                    url: url + "api/private/userGroup",
                    formData: {
                        groupObj: JSON.stringify(groupObj),
                        uids: JSON.stringify(uids)
                    }
                }, function (err, httpResponse, body) {
                    if (!err) {
                        if (httpResponse.statusCode !== 200) err = body;
                        else {
                            var ret = JSON.parse(body);
                            if (ret.result === "OK") {
                                ret.resultValue.should.have.enumerables(['_id', 'forbidden', 'name', 'creatorId', 'type']);
                                _.extend(groupObj, ret.resultValue);
                            } else {
                                err = ret.reason;
                            }
                        }
                    }
                    next(err);
                }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
            }
        ], function (err) {
            should.not.exist(err);

            done();
        })
    });

    before("Log in", function (done) {
        async.waterfall([
            function (next) {
                async.each([userHostObj, userGuest1Obj, userGuest2Obj], function (userObj, cb) {
                    userObj.pomelo.init({host: chathost, port: chatport,
                            deviceId: userObj.deviceId,
                            reconnect: true}, function () {
                        userObj.pomelo.on(chatroute, onEvent(userObj.emitter));

                        cb(null);
                    }, function (err) {
                        cb(err);
                    });
                }, function (err) {
                    next(err);
                });
            },
            function (next) {
                async.each([userHostObj, userGuest1Obj, userGuest2Obj], function (userObj, cb) {
                    userObj.pomelo.request("chat.chatHandler.connect", {
                        userId: userObj._id,
                        deviceId: userObj.deviceId,
                        loginChannel: userObj.loginChannel
                    }, function (data) {
                        switch (data.code) {
                            case 500:
                                cb(data.msg);
                                break;
                            case 200:
                                cb(null);
                                break;
                        }
                    });
                }, function (err) {
                    next(err);
                });
            }
        ], function (err) {
            should.not.exist(err);

            done();
        })
    });

    it("Make friends", function (done) {
        async.parallel([
            function (next) {
                var arr = [];

                [userGuest1Obj, userGuest2Obj].forEach(function (userObj) {
                    arr.push(function (callback) {
                        async.waterfall([
                            function (cb) {
                                var formData = {
                                    userId: userHostObj._id,
                                    inviteeList: JSON.stringify([{
                                        _id: userObj._id,
                                        loginChannel: userObj.loginChannel
                                    }])
                                };

                                request.post({
                                    url: url + "api/private/invitation",
                                    formData: formData
                                }, function (err, httpResponse, body) {
                                    if (!err) {
                                        if (httpResponse.statusCode !== 200) err = body;
                                        else {
                                            var ret = JSON.parse(body);
                                            if (ret.result !== "OK") {
                                                err = ret.reason;
                                            }
                                        }
                                    }
                                    cb(err);
                                }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
                            },
                            function (cb) {
                                function onAccept(data) {
                                    if (data.userId === userObj._id) {
                                        userHostObj.emitter.removeListener("accept", onAccept);
                                        cb(null);
                                    }
                                }

                                userHostObj.emitter.addListener("accept", onAccept);
                            }
                        ], function (err) {
                            callback(err);
                        });
                    });
                });

                async.parallel(arr, function (err) {
                    next(err);
                })
            },
            function (next) {
                var arr = [];

                [userGuest1Obj, userGuest2Obj].forEach(function (userObj) {
                    arr.push(function (callback) {
                        async.waterfall([
                            function (cb) {
                                function onInvite(data) {
                                    if (data.userId === userHostObj._id) {
                                        userObj.emitter.removeListener("invite", onInvite);
                                        cb(null);
                                    }
                                }

                                userObj.emitter.addListener("invite", onInvite);
                            },
                            function (cb) {
                                var formData = {
                                    creatorId: userHostObj._id,
                                    inviteeId: userObj._id
                                };

                                request.put({
                                    url: url + "api/private/acceptInvitation",
                                    formData: formData
                                }, function (err, httpResponse, body) {
                                    if (!err) {
                                        if (httpResponse.statusCode !== 200) err = body;
                                        else {
                                            var ret = JSON.parse(body);
                                            if (ret.result !== "OK") {
                                                err = ret.reason;
                                            }
                                        }
                                    }
                                    cb(err);
                                }).auth(userObj.loginName, userObj.plainPassword, true);
                            }
                        ], function (err) {
                            callback(err);
                        });
                    });
                });

                async.parallel(arr, function (err) {
                    next(err);
                })
            }
        ], function (err) {
            should.not.exist(err);

            done();
        });
    });

    it("Single Chat with friend", function (done) {
        var msg = "Hello, friend.", uids = [], arr = [];

        [userGuest1Obj, userGuest2Obj].forEach(function (userObj) {
            uids.push({_id: userObj._id, loginChannel: userObj.loginChannel});
        });

        arr.push(function (callback) {
            var formData = {
                userId: userHostObj._id,
                uids: JSON.stringify(uids),
                type: conversationType.TextConversation,
                message: msg,
                route: chatroute
            };

            request.post({
                url: url + "api/private/singleConversation",
                formData: formData
            }, function (err, httpResponse, body) {
                if (!err) {
                    if (httpResponse.statusCode !== 200) err = body;
                    else {
                        var ret = JSON.parse(body);
                        if (ret.result !== "OK") {
                            err = ret.reason;
                        }
                    }
                }
                callback(err);
            }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
        });

        [userGuest1Obj, userGuest2Obj].forEach(function (userObj) {
            arr.push(function (callback) {
                function onMessage(data) {
                    if (data.userId === userHostObj._id && data.signal === pomeloSignal.messageSignal && data.payload.type === conversationType.TextConversation && data.payload.message === msg) {
                        userObj.emitter.removeListener("message", onMessage);
                        callback(null);
                    }
                }

                userObj.emitter.addListener("message", onMessage);
            });
        });

        async.parallel(arr, function (err) {
            should.not.exist(err);

            done();
        });
    });

    it("Chat with friends", function (done) {
        var uids = [];

        [userGuest1Obj, userGuest2Obj].forEach(function (userObj) {
            uids.push({_id: userObj._id, loginChannel: userObj.loginChannel});
        });

        async.waterfall([
            function (next) {
                async.parallel([
                    function (callback) {
                        async.each([userGuest1Obj, userGuest2Obj], function (userObj, eCallback) {
                            function onChatAccept(data) {
                                if (data.userId === userObj._id) {
                                    userHostObj.emitter.removeListener("chatAccept", onChatAccept);
                                    eCallback(null);
                                }
                            }

                            userHostObj.emitter.addListener("chatAccept", onChatAccept);
                        }, function (err) {
                            callback(err);
                        });
                    },
                    function (callback) {
                        async.waterfall([
                            function (cb) {
                                async.parallel([
                                    function (pCallback) {
                                        //Create chat
                                        var formData = {
                                            userId: userHostObj._id,
                                            deviceId: userHostObj.deviceId,
                                            name: "Test Chat",
                                            uids: JSON.stringify(uids),
                                            route: chatroute
                                        };

                                        request.post({
                                            url: url + "api/private/chat",
                                            formData: formData
                                        }, function (err, httpResponse, body) {
                                            if (!err) {
                                                if (httpResponse.statusCode !== 200) err = body;
                                                else {
                                                    var ret = JSON.parse(body);
                                                    if (ret.result === "OK") {
                                                        should(ret.resultValue).have.enumerables(['_id', 'updateTime', 'route', 'payload', 'thumbnail', 'creatorId', 'state', 'active']);

                                                        userHostObj.chatId = ret.resultValue._id;
                                                    } else {
                                                        err = ret.reason;
                                                    }
                                                }
                                            }
                                            pCallback(err);
                                        }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
                                    },
                                    function (pCallback) {
                                        async.each([userGuest1Obj, userGuest2Obj], function (userObj, eCallback) {
                                            function onChatInvite(data) {
                                                if (data.userId === userHostObj._id) {
                                                    userObj.emitter.removeListener("chatInvite", onChatInvite);
                                                    eCallback(null);
                                                }
                                            }

                                            userObj.emitter.addListener("chatInvite", onChatInvite);
                                        }, function (err) {
                                            pCallback(err);
                                        });
                                    }
                                ], function (err) {
                                    cb(err);
                                });
                            },
                            function (cb) {
                                //Accept chat invitation
                                async.each([userGuest1Obj, userGuest2Obj], function (userObj, eCallback) {
                                    var formData = {
                                        chatId: userHostObj.chatId,
                                        userId: userObj._id,
                                        deviceId: userObj.deviceId,
                                        route: chatroute
                                    };

                                    request.put({
                                        url: url + "api/private/acceptChatInvitation",
                                        formData: formData
                                    }, function (err, httpResponse, body) {
                                        if (!err) {
                                            if (httpResponse.statusCode !== 200) err = body;
                                            else {
                                                var ret = JSON.parse(body);
                                                if (ret.result !== "OK") {
                                                    err = ret.reason;
                                                }
                                            }
                                        }
                                        eCallback(err);
                                    }).auth(userObj.loginName, userObj.plainPassword, true);
                                }, function (err) {
                                    cb(err);
                                });
                            },
                            function (cb) {
                                //Connect chat
                                async.each([userGuest1Obj, userGuest2Obj], function (userObj, eCallback) {
                                    userObj.pomelo.request("chat.chatHandler.connectChat", {
                                        userId: userObj._id,
                                        deviceId: userObj.deviceId,
                                        chatId: userHostObj.chatId,
                                        route: chatroute
                                    }, function (data) {
                                        switch (data.code) {
                                            case 500:
                                                eCallback(data.msg);
                                                break;
                                            case 200:
                                                eCallback(null);
                                                break;
                                        }
                                    });
                                }, function (err) {
                                    cb(err);
                                });
                            }
                        ], function (err) {
                            callback(err);
                        })
                    }
                ], function (err) {
                    next(err);
                });
            },
            function (next) {
                var msg = "Hello, Chat friends";

                async.parallel([
                    function (callback) {
                        var formData = {
                            userId: userHostObj._id,
                            chatId: userHostObj.chatId,
                            type: conversationType.TextConversation,
                            message: msg,
                            route: chatroute
                        };

                        request.post({
                            url: url + "api/private/conversation",
                            formData: formData
                        }, function (err, httpResponse, body) {
                            if (!err) {
                                if (httpResponse.statusCode !== 200) err = body;
                                else {
                                    var ret = JSON.parse(body);
                                    if (ret.result !== "OK") {
                                        err = ret.reason;
                                    }
                                }
                            }
                            callback(err);
                        }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
                    },
                    function (callback) {
                        async.each([userGuest1Obj, userGuest2Obj], function (userObj, eCallback) {
                            function onChatMessage(data) {
                                if (data.userId === userHostObj._id && data.chatId === userHostObj.chatId && data.payload.message === msg) {
                                    userObj.emitter.removeListener("chatMessage", onChatMessage);
                                    eCallback(null);
                                }
                            }

                            userObj.emitter.addListener("chatMessage", onChatMessage);
                        }, function (err) {
                            callback(err);
                        });
                    }
                ], function (err) {
                    next(err);
                });
            }
        ], function (err) {
            should.not.exist(err);

            done();
        });
    });

    it("Pause chat", function (done) {
        var arr = [];

        arr.push(function (pCallback) {
            var formData = {
                userId: userHostObj._id,
                chatId: userHostObj.chatId,
                route: chatroute
            };

            request.put({
                url: url + "api/private/pauseChat",
                formData: formData
            }, function (err, httpResponse, body) {
                if (!err) {
                    if (httpResponse.statusCode !== 200) err = body;
                    else {
                        var ret = JSON.parse(body);
                        if (ret.result !== "OK") {
                            err = ret.reason;
                        }
                    }
                }
                pCallback(err);
            }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
        });

        [userGuest1Obj, userGuest2Obj].forEach(function (userObj) {
            arr.push(function (pCallback) {
                function onChatPause(data) {
                    if (data.userId === userHostObj._id && data.chatId === userHostObj.chatId) {
                        userObj.emitter.removeListener("chatPause", onChatPause);
                        pCallback(null);
                    }
                }

                userObj.emitter.addListener("chatPause", onChatPause);
            });
        });

        async.parallel(arr, function (err) {
            should.not.exist(err);

            done();
        })
    });

    it("Resume chat", function (done) {
        var arr = [];

        arr.push(function (pCallback) {
            var formData = {
                userId: userHostObj._id,
                chatId: userHostObj.chatId,
                route: chatroute
            };

            request.put({
                url: url + "api/private/resumeChat",
                formData: formData
            }, function (err, httpResponse, body) {
                if (!err) {
                    if (httpResponse.statusCode !== 200) err = body;
                    else {
                        var ret = JSON.parse(body);
                        if (ret.result !== "OK") {
                            err = ret.reason;
                        }
                    }
                }
                pCallback(err);
            }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
        });

        [userGuest1Obj, userGuest2Obj].forEach(function (userObj) {
            arr.push(function (pCallback) {
                function onChatResume(data) {
                    if (data.userId === userHostObj._id && data.chatId === userHostObj.chatId) {
                        userObj.emitter.removeListener("chatResume", onChatResume);
                        pCallback(null);
                    }
                }

                userObj.emitter.addListener("chatResume", onChatResume);
            });
        });

        async.parallel(arr, function (err) {
            should.not.exist(err);

            done();
        })
    });

    it("Start a topic", function (done) {
        async.waterfall([
            function (next) {
                async.parallel([
                    function (pCallback) {
                        //Create topic
                        var formData = {
                            chatId: userHostObj.chatId,
                            deviceId: userHostObj.deviceId,
                            topicObj: JSON.stringify({
                                name: "Test Topic",
                                payload: {},
                                thumbnail: ""
                            }),
                            route: chatroute
                        };

                        request.post({
                            url: url + "api/private/topic",
                            formData: formData
                        }, function (err, httpResponse, body) {
                            if (!err) {
                                if (httpResponse.statusCode !== 200) err = body;
                                else {
                                    var ret = JSON.parse(body);
                                    if (ret.result === "OK") {
                                        should(ret.resultValue).have.enumerables(['_id', 'updateTime', 'route', 'payload', 'thumbnail', 'creatorId', 'state', 'active']);

                                        userHostObj.topicId = ret.resultValue._id;
                                    } else {
                                        err = ret.reason;
                                    }
                                }
                            }
                            pCallback(err);
                        }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
                    },
                    function (pCallback) {
                        async.each([userGuest1Obj, userGuest2Obj], function (userObj, eCallback) {
                            function onTopicInvite(data) {
                                if (data.userId === userHostObj._id && data.chatId === userHostObj.chatId) {
                                    userObj.emitter.removeListener("topicInvite", onTopicInvite);
                                    eCallback(null);
                                }
                            }

                            userObj.emitter.addListener("topicInvite", onTopicInvite);
                        }, function (err) {
                            pCallback(err);
                        });
                    }
                ], function (err) {
                    next(err);
                });
            },
            function (next) {
                //Accept chat invitation
                async.each([userGuest1Obj, userGuest2Obj], function (userObj, eCallback) {
                    var formData = {
                        topicId: userHostObj.topicId,
                        inviteeId: userObj._id
                    };

                    request.put({
                        url: url + "api/private/acceptTopicInvitation",
                        formData: formData
                    }, function (err, httpResponse, body) {
                        if (!err) {
                            if (httpResponse.statusCode !== 200) err = body;
                            else {
                                var ret = JSON.parse(body);
                                if (ret.result !== "OK") {
                                    err = ret.reason;
                                }
                            }
                        }
                        eCallback(err);
                    }).auth(userObj.loginName, userObj.plainPassword, true);
                }, function (err) {
                    next(err);
                });
            }
        ], function (err) {
            should.not.exist(err);

            done();
        })
    });

    it('Send message to topic', function (done) {
        var msg = "Let's vote against greenhouse air emission";

        async.parallel([
            function (next) {
                async.each([userGuest1Obj, userGuest2Obj], function (userObj, callback) {
                    function onTopicMessage(data) {
                        if (data.userId === userObj._id && data.payload.message === msg && data.chatId === userHostObj.chatId && data.topicId === userHostObj.topicId) {
                            userObj.emitter.removeListener("topicMessage", onTopicMessage);
                            callback(null);
                        }
                    }

                    userHostObj.emitter.addListener("topicMessage", onTopicMessage);
                }, function (err) {
                    next(err);
                });
            },
            function (next) {
                async.each([userGuest1Obj, userGuest2Obj], function (userObj, callback) {
                    var formData = {
                        userId: userObj._id,
                        chatId: userHostObj.chatId,
                        topicId:userHostObj.topicId,
                        type: conversationType.TextConversation,
                        message: msg,
                        route: chatroute
                    };

                    request.post({
                        url: url + "api/private/topicConversation",
                        formData: formData
                    }, function (err, httpResponse, body) {
                        if (!err) {
                            if (httpResponse.statusCode !== 200) err = body;
                            else {
                                var ret = JSON.parse(body);
                                if (ret.result !== "OK") {
                                    err = ret.reason;
                                }
                            }
                        }
                        callback(err);
                    }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
                }, function (err) {
                    next(err);
                });
            }
        ], function (err) {
            should.not.exist(err);

            done();
        })
    });

    it("Pause topic", function (done) {
        var arr = [];

        arr.push(function (pCallback) {
            var formData = {
                topicFilter: JSON.stringify({_id: userHostObj.topicId}),
                route: chatroute
            };

            request.put({
                url: url + "api/private/pauseTopic",
                formData: formData
            }, function (err, httpResponse, body) {
                if (!err) {
                    if (httpResponse.statusCode !== 200) err = body;
                    else {
                        var ret = JSON.parse(body);
                        if (ret.result !== "OK") {
                            err = ret.reason;
                        }
                    }
                }
                pCallback(err);
            }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
        });

        [userGuest1Obj, userGuest2Obj].forEach(function (userObj) {
            arr.push(function (pCallback) {
                function onTopicPause(data) {
                    if (data.userId === userHostObj._id && data.chatId === userHostObj.chatId && data.topicId === userHostObj.topicId) {
                        userObj.emitter.removeListener("topicPause", onTopicPause);
                        pCallback(null);
                    }
                }

                userObj.emitter.addListener("topicPause", onTopicPause);
            });
        });

        async.parallel(arr, function (err) {
            should.not.exist(err);

            done();
        })
    });

    it("Resume topic", function (done) {
        var arr = [];

        arr.push(function (pCallback) {
            var formData = {
                topicFilter: JSON.stringify({_id: userHostObj.topicId}),
                route: chatroute
            };

            request.put({
                url: url + "api/private/resumeTopic",
                formData: formData
            }, function (err, httpResponse, body) {
                if (!err) {
                    if (httpResponse.statusCode !== 200) err = body;
                    else {
                        var ret = JSON.parse(body);
                        if (ret.result !== "OK") {
                            err = ret.reason;
                        }
                    }
                }
                pCallback(err);
            }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
        });

        [userGuest1Obj, userGuest2Obj].forEach(function (userObj) {
            arr.push(function (pCallback) {
                function onTopicResume(data) {
                    if (data.userId === userHostObj._id && data.chatId === userHostObj.chatId && data.topicId === userHostObj.topicId) {
                        userObj.emitter.removeListener("topicResume", onTopicResume);
                        pCallback(null);
                    }
                }

                userObj.emitter.addListener("topicResume", onTopicResume);
            });
        });

        async.parallel(arr, function (err) {
            should.not.exist(err);

            done();
        })
    });

    it("End topic", function (done) {
        var arr = [];

        arr.push(function (pCallback) {
            var formData = {
                topicId: userHostObj.topicId,
                route: chatroute
            };

            request.put({
                url: url + "api/private/closeTopic",
                formData: formData
            }, function (err, httpResponse, body) {
                if (!err) {
                    if (httpResponse.statusCode !== 200) err = body;
                    else {
                        var ret = JSON.parse(body);
                        if (ret.result !== "OK") {
                            err = ret.reason;
                        }
                    }
                }
                pCallback(err);
            }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
        });

        [userGuest1Obj, userGuest2Obj].forEach(function (userObj) {
            arr.push(function (pCallback) {
                function onTopicClose(data) {
                    if (data.userId === userHostObj._id && data.chatId === userHostObj.chatId && data.topicId === userHostObj.topicId) {
                        userObj.emitter.removeListener("topicClose", onTopicClose);
                        pCallback(null);
                    }
                }

                userObj.emitter.addListener("topicClose", onTopicClose);
            });
        });

        async.parallel(arr, function (err) {
            should.not.exist(err);

            done();
        })
    });

    it("End chat", function (done) {
        var arr = [];

        arr.push(function (pCallback) {
            var formData = {
                userId: userHostObj._id,
                chatId: userHostObj.chatId,
                route: chatroute
            };

            request.put({
                url: url + "api/private/closeChat",
                formData: formData
            }, function (err, httpResponse, body) {
                if (!err) {
                    if (httpResponse.statusCode !== 200) err = body;
                    else {
                        var ret = JSON.parse(body);
                        if (ret.result !== "OK") {
                            err = ret.reason;
                        }
                    }
                }
                pCallback(err);
            }).auth(userHostObj.loginName, userHostObj.plainPassword, true);
        });

        [userGuest1Obj, userGuest2Obj].forEach(function (userObj) {
            arr.push(function (pCallback) {
                function onChatClose(data) {
                    if (data.userId === userHostObj._id && data.chatId === userHostObj.chatId) {
                        userObj.emitter.removeListener("chatClose", onChatClose);
                        pCallback(null);
                    }
                }

                userObj.emitter.addListener("chatClose", onChatClose);
            });
        });

        async.parallel(arr, function (err) {
            should.not.exist(err);

            done();
        })
    });

    after("Log out", function (done) {
        async.waterfall([
            function (next) {
                async.each([userHostObj, userGuest1Obj, userGuest2Obj], function (userObj, cb) {
                    userObj.pomelo.request("chat.chatHandler.disconnect", {
                        userId: userObj._id,
                        deviceId: userObj.deviceId,
                        chatId: userObj.chatId
                    }, function (data) {
                        switch (data.code) {
                            case 500:
                                cb(data.msg);
                                break;
                            case 200:
                                cb(null);
                                break;
                        }
                    });
                }, function (err) {
                    next(err);
                });
            },
            function (next) {
                async.each([userHostObj, userGuest1Obj, userGuest2Obj], function (userObj, cb) {
                    try {
                        userObj.pomelo.disconnect();
                        cb(null);
                    } catch (err) {
                        cb(err);
                    }
                }, function (err) {
                    next(err);
                });
            }
        ], function (err) {
            should.not.exist(err);

            done();
        })
    });

    after("Clean user & group", function (done) {
        async.waterfall([
            function (next) {
                //Purge first so that each user won't have any operation record left, otherwise user record
                //will be marked forbidden instead of inactive.
                MongoClient.connect(dbUrl, function (err, db) {
                    if (err) {
                        next(err);
                        return;
                    }

                    async.parallel([
                        function (cb) {
                            db.collection('Chat').remove({}, {multi: true}, cb);
                        },
                        function (cb) {
                            db.collection('Topic').remove({}, {multi: true}, cb);
                        },
                        function (cb) {
                            db.collection('Conversation').remove({}, {multi: true}, cb);
                        },
                        function (cb) {
                            db.collection('Invitation').remove({}, {multi: true}, cb);
                        },
                        function (cb) {
                            db.collection('ChatInvitation').remove({}, {multi: true}, cb);
                        },
                        function (cb) {
                            db.collection('TopicInvitation').remove({}, {multi: true}, cb);
                        }
                    ], function (err) {
                        try {
                            db.close();
                        } catch (e) {
                        }

                        next(err);
                    });
                });
            },
            function (next) {
                async.waterfall(
                    [
                        function (callback) {
                            request.put({
                                    url: url + "api/private/inactivateUserGroup",
                                    formData: {
                                        groupFilter: JSON.stringify({_id: groupObj._id})
                                    }
                                }, function (err, httpResponse, body) {
                                    if (!err) {
                                        if (httpResponse.statusCode !== 200) err = body;
                                        else {
                                            var ret = JSON.parse(body);
                                            if (ret.result !== "OK") {
                                                err = ret.reason;
                                            }
                                        }
                                    }
                                    callback(err);
                                }
                            ).auth(userHostObj.loginName, userHostObj.plainPassword, true);
                        },
                        function (callback) {
                            request.del({
                                    url: url + "api/private/userGroup",
                                    formData: {
                                        groupFilter: JSON.stringify({_id: groupObj._id})
                                    }
                                }, function (err, httpResponse, body) {
                                    if (!err) {
                                        if (httpResponse.statusCode !== 200) err = body;
                                        else {
                                            var ret = JSON.parse(body);
                                            if (ret.result !== "OK") {
                                                err = ret.reason;
                                            }
                                        }
                                    }
                                    callback(err);
                                }
                            ).auth(userHostObj.loginName, userHostObj.plainPassword, true);
                        }
                    ], function (err) {
                        next(err);
                    }
                );
            },
            function (next) {
                async.each([userHostObj, userGuest1Obj, userGuest2Obj], function (userObj, callback) {
                    async.waterfall(
                        [
                            function (cb) {
                                request.put({
                                        url: url + "api/private/inactivateUser",
                                        formData: {
                                            userFilter: JSON.stringify({_id: userObj._id})
                                        }
                                    }, function (err, httpResponse, body) {
                                        if (!err) {
                                            if (httpResponse.statusCode !== 200) err = body;
                                            else {
                                                var ret = JSON.parse(body);
                                                if (ret.result !== "OK") {
                                                    err = ret.reason;
                                                }
                                            }
                                        }
                                        cb(err);
                                    }
                                ).auth(userObj.loginName, userObj.plainPassword, true);
                            },
                            function (cb) {
                                request.del({
                                        url: url + "api/private/user",
                                        formData: {
                                            userFilter: JSON.stringify({_id: userObj._id})
                                        }
                                    }, function (err, httpResponse, body) {
                                        if (!err) {
                                            if (httpResponse.statusCode !== 200) err = body;
                                            else {
                                                var ret = JSON.parse(body);
                                                if (ret.result !== "OK") {
                                                    err = ret.reason;
                                                }
                                            }
                                        }
                                        cb(err);
                                    }
                                ).auth(userObj.loginName, userObj.plainPassword, true);
                            }
                        ], function (err) {
                            callback(err);
                        }
                    );
                }, function (err) {
                    next(err);
                });
            }
        ], function (err) {
            should.not.exist(err);

            done();
        });
    });
});

