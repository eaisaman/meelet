define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "uiUtilService"];

            appModule.directive("uiDock", _.union(inject, [function ($timeout, $q, uiUtilService) {
                'use strict';

                var defaults = {
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                    },
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_dock.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {element: element, scope: scope}));
                            },
                            post: function (scope, element, attrs) {
                                element.find(".showButton, .hideButton").on("click", function(event) {
                                    scope.toggleDisplay(element);
                                });

                                $timeout(function () {
                                    scope.selectTab(
                                        element.find(".dockContent"),
                                        element.find("div[tab-sel^=tab-head-control-group]").get(0),
                                        null,
                                        "control-group"
                                    );
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);