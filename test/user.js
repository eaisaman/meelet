require("should");
require("request");

var scheme = process.env['mocha.scheme'];
var server = process.env['mocha.server'];
var port = process.env['mocha.port'];
var url = scheme + "://" + server + ":" + port + "/";

describe('User', function () {
    it('Create user with attached avatar, his friend user group should be created as well.', function () {

    });

    it('Create user group with group members.', function () {

    });

    it('Get user.', function () {

    });

    it('Get user group along with its members.', function () {

    });

    it('Get the members in groups the given user belongs to.', function () {

    });
});
