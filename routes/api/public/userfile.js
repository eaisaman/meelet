var path = require('path');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
_.string = require('underscore.string');
_.mixin(_.string.exports());

var UserFileController = function (fields) {
    var self = this;

    if (typeof fields == "object") {
        for (var fieldName in fields) {
            var field = fields[fieldName];
            if (field) {
                self[fieldName] = field;
            }
        }
    }

    self.config = require('../../../config');
};

UserFileController.prototype.postSketch = function (sketchWorks, request, success, fail) {
    var self = this;

    var filePath = path.join(self.config.userFile.sketchFolder, "sketchWorks.json"),
        out = fs.createWriteStream(filePath);

    out.on('finish', function () {
        success();
    });

    out.on('error', function (err) {
        fail(err);
    });

    out.write(sketchWorks);
    out.end();
}

UserFileController.prototype.getSketch = function (success, fail) {
    var self = this;

    var filePath = path.join(self.config.userFile.sketchFolder, "sketchWorks.json"),
        rs = fs.createReadStream(filePath),
        ms = require('memorystream').createWriteStream();

    rs.on('end', function () {
        var ret = ms.toString();
        ms.destroy();
        success(ret);
    });

    rs.on('error', function (err) {
        ms.destroy();
        fail(err);
    });

    rs.pipe(ms);
}

module.exports = UserFileController;
