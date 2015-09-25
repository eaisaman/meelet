define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "$exceptionHandler", "utilService", "angularConstants"];

            appModule.directive("uiDock", _.union(inject, [function ($timeout, $q, $exceptionHandler, utilService, angularConstants) {
                'use strict';

                var defaults = {},
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {visiblePseudoEnabledWidgets: "="},
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_dock.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    "$timeout": $timeout,
                                    "$q": $q,
                                    "angularConstants": angularConstants,
                                    "utilService": utilService,
                                    element: element,
                                    scope: scope
                                }));
                            },
                            post: function (scope, element, attrs) {
                                element.find(".showButton, .hideButton").on("click", function (event) {
                                    scope.toggleDisplay(element);
                                });

                                scope.selectContentTab = function (event) {
                                    return scope.selectTab(event.currentTarget, event.target, event, "control-group");
                                }

                                utilService.latestOnce(
                                    function () {
                                        return $timeout(function () {
                                            scope.selectContentTab(
                                                {
                                                    currentTarget: $(element).find(".dockContent"),
                                                    target: $(element).find("div[tab-sel^=tab-head-control-group]").get(0)
                                                }
                                            );
                                        }, angularConstants.actionDelay);
                                    },
                                    null,
                                    null,
                                    angularConstants.unresponsiveInterval,
                                    "ui-dock.compile.post.init"
                                )();
                            }
                        }
                    }
                }
            }]));
        }
    }
);