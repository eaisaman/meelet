//TODO Fill test description
/**
 * @description
 *
 *
 */
var path = require('path');
var fs = require('fs');
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

var userObj = {
    plainPassword: "*",
    loginName: "13341692882",
    name: "王强",
    sex: "M",
    tel: "13341692882"
};
var groupObj = {
    name: "Mocha Fake Group"
};
var uids = ["52591a12c763d5e4585563d0", "52591a12c763d5e4585563ce", "52591a12c763d5e4585563cc"];

describe('User', function () {
    before("Clean all left testing data", function (done) {
        var MongoClient = mongo.MongoClient;
        var url = 'mongodb://' + mongouser + ':' + mongopwd + '@' + mongohost + ':' + mongoport + '/' + mongodb;

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

    it('Create user with attached avatar, his friend user group should be created as well.', function (done) {
        var formData = {
            userObj: JSON.stringify(userObj),
            avatar_file: {
                value: fs.createReadStream(path.join(__dirname, "assets/avatar.jpg")),
                options: {
                    filename: 'avatar.jpg',
                    contentType: 'image/jpg'
                }
            }
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
                        ret.resultValue.should.have.enumerables(['_id', 'forbidden', 'loginName', 'name', 'sex', 'tel', 'friendGroupId']);
                        userObj._id = ret.resultValue._id;
                        done();
                    } else {
                        err = ret.reason;
                    }
                }
            }
            should.not.exist(err);
        });
    });

    it('Create user group with group members.', function (done) {
        should.exist(userObj._id);

        groupObj.creatorId = userObj._id;

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
                        groupObj._id = ret.resultValue._id;
                        done();
                    } else {
                        err = ret.reason;
                    }
                }
            }
            should.not.exist(err);
        }).auth(userObj.loginName, userObj.plainPassword, true);
    });

    it("Upload user's avatar.", function (done) {
        should.exist(userObj._id);

        var formData = {
            userId: userObj._id,
            avatar_file: {
                value: fs.createReadStream(path.join(__dirname, "assets/avatar2.jpg")),
                options: {
                    filename: 'avatar.jpg',
                    contentType: 'image/jpg'
                }
            }
        };

        request.put({
            url: url + "api/private/avatar",
            formData: formData
        }, function (err, httpResponse, body) {
            if (!err) {
                if (httpResponse.statusCode !== 200) err = body;
                else {
                    var ret = JSON.parse(body);
                    if (ret.result === "OK") {
                        done();
                    } else {
                        err = ret.reason;
                    }
                }
            }
            should.not.exist(err);
        }).auth(userObj.loginName, userObj.plainPassword, true);
    });

    it('Get user.', function (done) {
        should.exist(userObj._id);

        request.get({
                url: url + "api/private/user",
                qs: {
                    userFilter: JSON.stringify({_id: userObj._id})
                }
            }, function (err, httpResponse, body) {
                if (!err) {
                    if (httpResponse.statusCode !== 200) err = body;
                    else {
                        var ret = JSON.parse(body);
                        if (ret.result === "OK") {
                            should(ret.resultValue).be.instanceof(Array).and.not.empty();
                            done();
                        } else {
                            err = ret.reason;
                        }
                    }
                }
                should.not.exist(err);
            }
        ).auth(userObj.loginName, userObj.plainPassword, true);
    });

    it("Get user's avatar.", function (done) {
        should.exist(userObj._id);

        request.get({
                url: url + "api/public/avatar",
                qs: {
                    userId: userObj._id
                }
            }
        ).on('response', function (response) {
                should(response.statusCode).be.exactly(200);
                should(response.headers['content-type']).be.exactly('image/jpeg');
                should(parseInt(response.headers['content-length'])).be.above(0);
                done();
            }
        ).on('error', function (err) {
                should.not.exist(err);
            }
        )
    });

    it('Get user group along with its members.', function (done) {
        should.exist(userObj._id);

        request.get({
                url: url + "api/private/userGroup",
                qs: {
                    userId: userObj._id
                }
            }, function (err, httpResponse, body) {
                if (!err) {
                    if (httpResponse.statusCode !== 200) err = body;
                    else {
                        var ret = JSON.parse(body);
                        if (ret.result === "OK") {
                            should(ret.resultValue).be.instanceof(Array).and.not.empty();
                            done();
                        } else {
                            err = ret.reason;
                        }
                    }
                }
                should.not.exist(err);
            }
        ).auth(userObj.loginName, userObj.plainPassword, true);
    });

    it('Get the members in groups the given user belongs to.', function (done) {
        should.exist(userObj._id);

        request.get({
                url: url + "api/private/groupUser",
                qs: {
                    userId: userObj._id
                }
            }, function (err, httpResponse, body) {
                if (!err) {
                    if (httpResponse.statusCode !== 200) err = body;
                    else {
                        var ret = JSON.parse(body);
                        if (ret.result === "OK") {
                            should(ret.resultValue).be.instanceof(Array).and.not.empty();

                            ret.resultValue.forEach(function (groupObj) {
                                groupObj.should.have.enumerables(['_id', 'userList']);

                                should(_.pluck(groupObj.userList, "_id")).containEql(userObj._id);
                            });

                            done();
                        } else {
                            err = ret.reason;
                        }
                    }
                }
                should.not.exist(err);
            }
        ).auth(userObj.loginName, userObj.plainPassword, true);
    });

    it("Clean group record", function (done) {
        should.exist(groupObj._id);

        if (groupObj._id) {
            async.waterfall(
                [
                    function (next) {
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
                                next(err);
                            }
                        ).auth(userObj.loginName, userObj.plainPassword, true);
                    },
                    function (next) {
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
                                next(err);
                            }
                        ).auth(userObj.loginName, userObj.plainPassword, true);
                    }
                ], function (err) {
                    should.not.exist(err);

                    done();
                }
            );
        }
    });

    it("Clean user record.", function (done) {
        should.exist(userObj._id);

        if (userObj._id) {
            async.waterfall(
                [
                    function (next) {
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
                                next(err);
                            }
                        ).auth(userObj.loginName, userObj.plainPassword, true);
                    },
                    function (next) {
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
                                next(err);
                            }
                        ).auth(userObj.loginName, userObj.plainPassword, true);
                    }
                ], function (err) {
                    should.not.exist(err);

                    done();
                }
            );
        }
    });

});
