define(
    ["angular", "underscore"],
    function () {
        return function (appModule) {
            whereFilter.$inject = ['$parse'];
            function whereFilter($parse) {
                return function (list, condition) {
                    return _.where(list, condition);
                };
            }

            appModule.config(["$provide", function ($provide) {
                $provide.factory('whereFilter', whereFilter);
            }]);

            appModule.filter("timeFilter", function () {
                return function (timestamp) {
                    return timestamp == null ? "" : timestamp.toString("HH:mm");
                };
            }).filter("dateFilter", function () {
                return function (timestamp) {
                    return timestamp == null ? "" : timestamp.toString("yyyy-MM-dd");
                };
            }).filter('makeRange', function () {
                return function (input) {
                    var lowBound, highBound;
                    switch (input.length) {
                        case 1:
                            lowBound = 0;
                            highBound = parseInt(input[0]);
                            break;
                        case 2:
                            lowBound = parseInt(input[0]);
                            highBound = parseInt(input[1]);
                            break;
                        default:
                            return input;
                    }
                    var result = [];
                    for (var i = lowBound; i < highBound; i++)
                        result.push(i);
                    return result;
                };
            });
        }
    });