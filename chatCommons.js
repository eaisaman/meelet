var ChatCommons = function () {
    var self = this;

    self.config = require('./config');
    self.__ = self.config.i18n;
    self.chatConstants = self.config.settings.chatConstants;
    self.config.on(self.config.ApplicationDBConnectedEvent, function (resource) {
        self.db = resource.instance;
        self.schema = resource.schema;
        self.isDBReady = true;
    });
}, c = new ChatCommons();

ChatCommons.prototype.sendInvitation = function (userId, inviteeId, next) {
    process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.sendChatInvitation = function (chatId, userId, inviteeId, next) {
    process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.acceptChatInvitation = function (chatId, inviteeId, next) {
    process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.sendTopicInvitation = function (chatId, topicId, userId, inviteeId, next) {
    process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.acceptTopicInvitation = function (chatId, topicId, inviteeId, next) {
    process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.notifyChatState = function (chatId, receiverId, state, next) {
    process.nextTick(function () {
        next();
    });
}

ChatCommons.prototype.notifyTopicState = function (chatId, topicId, receiverId, state, next) {
    process.nextTick(function () {
        next();
    });
}

module.exports = c;
