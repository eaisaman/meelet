var async = require('async');
var _ = require('underscore');
_.string = require('underscore.string');
var crypto = require('crypto');
global.io = require("socket.io-client");
var pomeloclient = require('./pomeloclient').pomelo;

var ChatCommons = function () {
    var self = this;

    self.config = require('./config');
    self.__ = self.config.i18n.__;
    self.chatConstants = self.config.settings.chatConstants;
    self.config.on(self.config.ChatServerConnectedEvent, function (resource) {
        self.isServerReady = true;
        self.pomelo = resource.instance;
        self.pomelo.on('disconnect', function (reason) {
            self.config.logger.error('Socket disconnect due to ' + reason);
            self.isServerReady = false;
        }).on('connect', function () {
            self.isServerReady = true;
        }).on('reconnect', function (reason) {
            self.isServerReady = true;
        });

    });
}, c = new ChatCommons();

//TODO Create a executor pool for concurrent communication
ChatCommons.prototype.initServer = function (options, resourceName, callback) {
    var defaultOptions = {
        host: '127.0.0.1',
        port: 3010
    };

    _.extend(defaultOptions, options);

    var pomelo = new pomeloclient();
    pomelo.init({host: defaultOptions.host, port: defaultOptions.port}, function () {
        callback(null, {name: resourceName, instance: pomelo});
    }, function (err) {
        self.config.logger.error(err);
        callback(err);
    });
}

ChatCommons.prototype.findLoginChannel = function (loginName) {
    var md5 = crypto.createHash('md5');
    md5.update(loginName);
    var digest = '0x' + md5.digest('hex').substr(0, 10);
    var bucket = parseInt(digest) % this.config.settings.chatConstants.loginChannelBuckets;
    return this.config.settings.chatConstants.loginChannel + "_" + bucket;
}

ChatCommons.prototype.sendInvitation = function (userId, uids, route, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request("chat.chatHandler.invite", {
        userId: userId,
        uids: uids,
        route: route
    }, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

ChatCommons.prototype.acceptInvitation = function (creatorId, creatorLoginChannel, inviteeId, route, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request("chat.chatHandler.acceptInvitation", {
        userId: inviteeId,
        creatorId: creatorId,
        creatorLoginChannel: creatorLoginChannel,
        route: route
    }, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

ChatCommons.prototype.createChat = function (userId, deviceId, chatId, route, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request("chat.chatHandler.createChat", {
        userId: userId,
        deviceId: deviceId,
        chatId: chatId,
        route: route
    }, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

ChatCommons.prototype.sendChatInvitation = function (userId, uids, chatId, route, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request("chat.chatHandler.inviteChat", {
        userId: userId,
        uids: uids,
        chatId: chatId,
        route: route
    }, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

ChatCommons.prototype.acceptChatInvitation = function (userId, deviceId, chatId, route, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request("chat.chatHandler.acceptChatInvitation", {
        chatId: chatId,
        userId: userId,
        deviceId: deviceId,
        route: route
    }, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

ChatCommons.prototype.createTopic = function (userId, deviceId, chatId, topicId, route, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request("chat.chatHandler.createTopic", {
        userId: userId,
        chatId: chatId,
        topicId: topicId,
        deviceId: deviceId,
        route: route
    }, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

ChatCommons.prototype.sendTopicInvitation = function (userId, chatId, topicId, route, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request("chat.chatHandler.inviteTopic", {
        userId: userId,
        chatId: chatId,
        topicId: topicId,
        route: route
    }, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

ChatCommons.prototype.notifyChatState = function (userId, chatId, route, state, next) {
    var self = this,
        requestRoute;

    switch (state) {
        case self.chatConstants.chatOpenState:
            requestRoute = "chat.chatHandler.resumeChat";
            break;
        case self.chatConstants.chatPauseState:
            requestRoute = "chat.chatHandler.pauseChat";
            break;
        case self.chatConstants.chatCloseState:
            requestRoute = "chat.chatHandler.closeChat";
            break;
    }

    if (!requestRoute) {
        next("Cannot find request route for chat state " + state);
        return;
    }

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request(requestRoute, {
        userId: userId,
        chatId: chatId,
        route: route
    }, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

ChatCommons.prototype.notifyTopicState = function (userId, chatId, topicId, route, state, next) {
    var self = this,
        requestRoute;

    switch (state) {
        case self.chatConstants.topicOpenState:
            requestRoute = "chat.chatHandler.resumeTopic";
            break;
        case self.chatConstants.topicPauseState:
            requestRoute = "chat.chatHandler.pauseTopic";
            break;
        case self.chatConstants.topicCloseState:
            requestRoute = "chat.chatHandler.closeTopic";
            break;
    }

    if (!requestRoute) {
        next("Cannot find request route for topic state " + state);
        return;
    }

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request(requestRoute, {
        userId: userId,
        chatId: chatId,
        topicId: topicId,
        route: route
    }, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

ChatCommons.prototype.pushSingle = function (userId, uids, payload, route, next) {
    var self = this,
        msg = {
            userId: userId,
            payload: payload,
            route: route
        };

    if (uids) msg.uids = uids;

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request("chat.chatHandler.pushSingle", msg, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

ChatCommons.prototype.push = function (userId, chatId, uids, payload, route, next) {
    var self = this,
        msg = {
            userId: userId,
            chatId: chatId,
            payload: payload,
            route: route
        };

    if (uids) msg.uids = uids;

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request("chat.chatHandler.push", msg, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

ChatCommons.prototype.pushTopic = function (userId, chatId, topicId, payload, route, next) {
    var self = this,
        msg = {
            userId: userId,
            chatId: chatId,
            topicId: topicId,
            payload: payload,
            route: route
        };

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request("chat.chatHandler.pushTopic", msg, function (data) {
        switch (data.code) {
            case 500:
                next(data.msg);
                break;
            case 200:
                next(null);
                break;
        }
    });
}

module.exports = c;
