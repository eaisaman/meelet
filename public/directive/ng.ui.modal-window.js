define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiModalWindow", _.union(inject, [function ($http, $timeout, $q, angularEventTypes, uiUtilService) {
                'use strict';

                var defaults = {},
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {dockAlign: "="},
                    replace: false,
                    transclude: true,
                    templateUrl: "include/.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));
                            },
                            post: function (scope, element, attrs) {
                            }
                        }
                    }
                }
            }]));
        }
    }
);