/**
 * @description
 *
 * Generate 20 accounts randomly.
 *
 */

var request = require("request");
var should = require("should");
var async = require('async');
var Chance = require('chance'), chance = new Chance();
var _ = require('underscore');

var scheme = process.env['mocha.scheme'];
var server = process.env['mocha.server'];
var port = process.env['mocha.port'];
var url = scheme + "://" + server + ":" + port + "/";

var userList = [];
describe('User', function () {
    before("Prepare 20 randomly created user objects", function (done) {
        for (var i = 0; i < 20; i++) {
            var name = chance.name();

            userList.push({
                plainPassword: "*",
                loginName: name.replace(/(^[\w]+).+/, "$1").toLowerCase(),
                name: name,
                sex: chance.gender().substr(0, 1),
                tel: chance.phone({country: "us", mobile: true})
            });
        }

        done();
    });

    it("Create account", function (done) {
        async.each(userList, function (userObj, callback) {
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
                        } else {
                            err = ret.reason;
                        }
                    }
                }
                callback(err);
            });
        }, function (err) {
            should.not.exist(err);

            done();
        });
    });
});