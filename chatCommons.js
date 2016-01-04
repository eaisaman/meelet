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
    });
}, c = new ChatCommons();

//TODO Create a executor pool for concurrent communication
ChatCommons.prototype.initServer = function (options, resourceName, callback) {
    var defaultOptions = {
        host: '127.0.0.1',
        port: 3010
    };

    _.extend(defaultOptions, options);

    var self = this;
    self.pomelo = new pomeloclient();

    self.pomelo.init({host: options.host, port: options.port}, function () {
        callback(null, {name: resourceName});
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

ChatCommons.prototype.sendInvitation = function (userId, uids, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || self.pomelo.request("chat.chatHandler.invite", {
        userId: userId,
        uids: uids
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

ChatCommons.prototype.acceptInvitation = function (creatorId, inviteeId, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.sendChatInvitation = function (chatId, userId, inviteeId, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.acceptChatInvitation = function (chatId, inviteeId, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.sendTopicInvitation = function (chatId, topicId, userId, inviteeId, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.acceptTopicInvitation = function (chatId, topicId, inviteeId, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.notifyChatState = function (chatId, receiverId, state, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.notifyTopicState = function (chatId, topicId, receiverId, state, next) {
    var self = this;

    (!self.isServerReady && next(new Error('Server connection not established'))) || process.nextTick(function () {
        next();
    });
}

module.exports = c;
