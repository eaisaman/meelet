define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "$exceptionHandler", "angularEventTypes", "angularConstants", "uiUtilService"];

            appModule.directive("uiColorPicker", _.union(inject, [function ($http, $timeout, $q, $exceptionHandler, angularEventTypes, angularConstants, uiUtilService) {
                'use strict';

                var boundProperties = {color: "="},
                    defaults = {
                        color: {color: "#000000", alpha: 1}
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
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                uiUtilService.broadcast(scope,
                                    angularEventTypes.boundPropertiesEvent,
                                    uiUtilService.createDirectiveBoundMap(
                                        boundProperties,
                                        attrs,
                                        {
                                            color: function (value) {
                                                if (value && scope.hasStyle(value)) {
                                                    scope.pickedColor = scope.pickColorValue(value);
                                                    scope.colorIsSet = false;
                                                    if (scope.pickedColor.alpha < 1 && !scope.pickedColor.alphaColor) {
                                                        scope.pickedColor.alphaColor = uiUtilService.rgba(scope.pickedColor);
                                                    }
                                                    scope.pickerPaneBackgroundColor = scope.pickedColor.alphaColor || scope.pickedColor.color;
                                                    scope.pickerPaneColor = uiUtilService.contrastColor(scope.pickedColor.color);
                                                    scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#ffffff" ? uiUtilService.lighterColor(scope.pickedColor.color, 0.5) : uiUtilService.lighterColor(scope.pickedColor.color, -0.5);
                                                    $timeout(function () {
                                                        scope.colorIsSet = true;
                                                    });
                                                    $timeout(function () {
                                                        scope.enableControl();
                                                    });
                                                } else {
                                                    scope.disableControl();
                                                }
                                            }
                                        },
                                        {color: "uiColorPicker"}
                                    )
                                );

                                scope.pickColorValue = function (styles) {
                                    return scope.pickStyle(styles, scope.pseudo)["color"] || angular.copy(options.color);
                                }

                                scope.setColor = function (value) {
                                    if (value.color) {
                                        if (value.alpha < 1 && !value.alphaColor) {
                                            value.alphaColor = uiUtilService.rgba(value);
                                        }

                                        var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                        pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                        scope.color[pseudoStylePrefix] = scope.color[pseudoStylePrefix] || {};
                                        var pseudoColorStyle = scope.color[pseudoStylePrefix];
                                        if (pseudoColorStyle['color'] == null || pseudoColorStyle['color'].color != value.color || pseudoColorStyle['color'].alpha != value.alpha) {
                                            pseudoColorStyle['color'] = _.pick(value, ["color", "alpha", "alphaColor"]);

                                            //Trigger watcher on sketchWidgetSetting.color to apply style to widget
                                            scope.color = angular.copy(scope.color);

                                            scope.colorIsSet = false;
                                            scope.pickedColor = value;
                                            scope.pickerPaneBackgroundColor = scope.pickedColor.alphaColor || scope.pickedColor.color;
                                            scope.pickerPaneColor = uiUtilService.contrastColor(value.color);
                                            scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#ffffff" ? uiUtilService.lighterColor(value.color, 0.5) : uiUtilService.lighterColor(value.color, -0.5);
                                            $timeout(function () {
                                                scope.colorIsSet = true;
                                            });
                                        }
                                    }
                                };

                                scope.toggleColorControl = function () {
                                    scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            uiUtilService.whilst(
                                                function () {
                                                    return !scope.color;
                                                },
                                                function (callback) {
                                                    callback();
                                                },
                                                function (err) {
                                                    scope.setColor(angular.copy(options.color));

                                                    return uiUtilService.getResolveDefer();
                                                },
                                                angularConstants.checkInterval,
                                                "ui-color-picker-toggleColorControl",
                                                angularConstants.renderTimeout
                                            );
                                        } else {
                                            if (scope.color) {
                                                scope.color = angular.copy(scope.unsetStyle(scope.color, scope.pseudo));
                                            }
                                        }
                                    });
                                }

                                scope.watchColor = function (state) {
                                    if (state) {
                                        if (!scope.deregisterWatch) {
                                            scope.deregisterWatch = scope.$watch("pickedColor", function (to) {
                                                to && scope.setColor(to);
                                            });
                                        }
                                    } else {
                                        scope.deregisterWatch && scope.deregisterWatch();
                                        scope.deregisterWatch = null;
                                    }
                                }


                                scope.pseudo = "";
                            },
                            post: function (scope, element, attrs) {
                                scope.togglePalette = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel"),
                                        $palette = element.find("#colorPickerPalette > :first-child"),
                                        paletteScope = angular.element($palette).scope();

                                    if ($wrapper.hasClass("expanded")) {
                                        paletteScope.closePalette().then(function () {
                                            return scope.toggleDisplay($panel);
                                        }).then(function () {
                                            scope.watchColor(false);

                                            return scope.toggleExpand($wrapper);
                                        });
                                    } else {
                                        scope.toggleExpand($wrapper).then(function () {
                                            return scope.toggleDisplay($panel);
                                        }).then(function () {
                                            scope.watchColor(true);

                                            return paletteScope.openPalette();
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