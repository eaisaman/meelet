define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "$parse", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiSideBar", _.union(inject, [function ($http, $timeout, $q, $parse, angularEventTypes, uiUtilService) {
                'use strict';

                var defaults = {transition: "slideInOnTop", side: "leftSide", overlay: false, barContentWidth: "100px"},
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {transition: "@", side: "@"},
                    replace: true,
                    transclude: true,
                    templateUrl: "include/_sidebar.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs, ctrl) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                options = angular.extend(defaults, $parse(attrs['uiSideBarOpts'])(scope, {}))

                                scope.transition = scope.transition || options.transition;
                                scope.side = scope.side || options.side;
                                scope.overlay = scope.overlay || options.overlay;
                                scope.barContentWidth = scope.barContentWidth || options.barContentWidth;
                            },
                            post: function (scope, element, attrs) {
                                scope.toggleSideBar = function (state, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleSelect(".sideBarContainer");
                                }
                            }
                        }
                    }
                }
            }]));
        }
    }
);