define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiColorPicker", _.union(inject, [function ($http, $timeout, $q, angularEventTypes, uiUtilService) {
                'use strict';

                var boundProperties = {pickedColor: "="},
                    defaults = {
                        colorJson: "",
                        colors: [
                            "#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e",
                            "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50",
                            "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6",
                            "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d"
                        ]
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_color-picker.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                scope.$root.$broadcast(
                                    angularEventTypes.boundPropertiesEvent,
                                    uiUtilService.createDirectiveBoundMap(
                                        boundProperties,
                                        attrs,
                                        {
                                            pickedColor: function (value) {
                                                if (value) {
                                                    var value = uiUtilService.formalizeHex(value);
                                                    if (value != scope.pickedColor)
                                                        scope.pickedColor = value;

                                                    scope.colors && scope.colors.every(function (c) {
                                                        return c != value;
                                                    }) && scope.colors.splice(0, 0, value);

                                                    scope.pickerPaneColor = "";
                                                    $timeout(function () {
                                                        scope.pickerPaneBackgroundColor = value;
                                                        scope.pickerPaneColor = uiUtilService.contrastColor(value);
                                                        scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#ffffff" ? uiUtilService.lighterColor(value, 0.5) : uiUtilService.lighterColor(value, -0.5);
                                                    });
                                                } else {
                                                    scope.disableControl();
                                                }
                                            }
                                        })
                                );

                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {element: element, scope: scope}));

                                scope.pickColor = function (value) {
                                    if (value) {
                                        scope.pickerPaneColor = "";
                                        scope.pickedColor = value;
                                        $timeout(function () {
                                            scope.pickerPaneBackgroundColor = value;
                                            scope.pickerPaneColor = uiUtilService.contrastColor(value);
                                            scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#ffffff" ? uiUtilService.lighterColor(value, 0.5) : uiUtilService.lighterColor(value, -0.5);
                                        });
                                    }
                                };

                                if (options.colorJson) {
                                    $http.get(options.colorJson).then(function (result) {
                                        scope.colors = result.data;

                                        if (scope.pickedColor) {
                                            var value = scope.pickedColor;

                                            scope.colors.every(function (c) {
                                                return c != value;
                                            }) && scope.colors.splice(0, 0, value);
                                        }

                                        if (scope.colors && scope.colors.length) {
                                            if (!scope.pickedColor)
                                                scope.pickColor(scope.colors && scope.colors.length && scope.colors[0] || "");
                                        } else {
                                            scope.disableControl();
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

                                    if (scope.colors && scope.colors.length) {
                                        if (!scope.pickedColor)
                                            scope.pickColor(scope.colors && scope.colors.length && scope.colors[0] || "");
                                    } else {
                                        scope.disableControl();
                                    }
                                }
                            },
                            post: function (scope, element, attrs) {
                                scope.toggleColorControl = function () {
                                    scope.colors && scope.colors.length && scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            scope.pickColor(scope.colors && scope.colors.length && scope.colors[0] || "");
                                        } else {
                                            scope.pickedColor = null;
                                            scope.pickerPaneColor = "";
                                        }
                                    });
                                }

                                scope.togglePalette = function (event) {
                                    event && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if ($wrapper.hasClass("expanded")) {
                                        scope.toggleDisplay($panel).then(function () {
                                            return scope.toggleExpand($wrapper);
                                        });
                                    } else {
                                        scope.toggleExpand($wrapper).then(function () {
                                            return scope.toggleDisplay($panel);
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }]));
        }
    }
);