define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiTextShadowEditor", _.union(inject, [function ($http, $timeout, $q, angularEventTypes, uiUtilService) {
                'use strict';

                var boundProperties = {textShadow: "="},
                    defaults = {},
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_text-shadow.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                scope.$root.$broadcast(
                                    angularEventTypes.boundPropertiesEvent,
                                    uiUtilService.createDirectiveBoundMap(
                                        boundProperties,
                                        attrs,
                                        {})
                                );

                                if (options.colorJson) {
                                    $http.get(options.colorJson).then(function (result) {
                                        scope.colors = result.data;

                                        if (scope.pickedColor) {
                                            var value = scope.pickedColor;

                                            scope.colors.every(function (c) {
                                                return c != value;
                                            }) && scope.colors.splice(0, 0, value);
                                        }
                                    });
                                } else {
                                    scope.colors = options.colors || [];

                                    if (scope.pickedColor) {
                                        var value = scope.pickedColor;

                                        scope.colors.every(function (c) {
                                            return c != value;
                                        }) && scope.colors.splice(0, 0, value);
                                    }
                                }
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