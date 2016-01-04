var request = require("request");
var should = require("should");
var async = require('async');
var mongo = require('mongodb');
var _ = require('underscore');

var scheme = process.env['mocha.scheme'];
var server = process.env['mocha.server'];
var port = process.env['mocha.port'];
var url = scheme + "://" + server + ":" + port + "/";

var mongohost = process.env['mocha.mongohost'];
var mongoport = process.env['mocha.mongoport'];
var mongouser = process.env['mocha.mongouser'];
var mongopwd = process.env['mocha.mongopwd'];
var mongodb = process.env['mocha.mongodb'];

describe('Chat', function () {
    var MongoClient = mongo.MongoClient;
    var url = 'mongodb://' + mongouser + ':' + mongopwd + '@' + mongohost + ':' + mongoport + '/' + mongodb;

    before("Clean all left testing data", function (done) {
        MongoClient.connect(url, function (err, db) {
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
        done();
    });

    before("Log in", function (done) {
        done();
    });

    it("Make friends", function (done) {
        done();
    });

    it("Single Chat with friend", function (done) {
        done();
    });

    it("Chat with friends", function (done) {
        done();
    });

    it("Pause chat", function (done) {
        done();
    });

    it("Resume chat", function (done) {
        done();
    });

    it("Start a topic", function (done) {
        done();
    });

    it("Pause topic", function (done) {
        done();
    });

    it("Resume topic", function (done) {
        done();
    });

    it("End topic", function (done) {
        done();
    });

    it("End chat", function (done) {
        done();
    });

    after("Log out", function (done) {
        done();
    });

    after("Clean all left testing data", function (done) {
        MongoClient.connect(url, function (err, db) {
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
});

