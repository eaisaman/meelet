define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiColorPicker", _.union(inject, [function ($http, $timeout, $q, angularEventTypes, uiUtilService) {
                'use strict';

                var boundProperties = {color: "="},
                    defaults = {},
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

                                scope.$root.$broadcast(
                                    angularEventTypes.boundPropertiesEvent,
                                    uiUtilService.createDirectiveBoundMap(
                                        boundProperties,
                                        attrs,
                                        {
                                            color: function (value) {
                                                if (value && scope.hasStyle(value)) {
                                                    scope.pickedColor = uiUtilService.formalizeHex(scope.pickColorValue(value));
                                                    $timeout(function () {
                                                        scope.pickerPaneBackgroundColor = scope.pickedColor;
                                                        scope.pickerPaneColor = uiUtilService.contrastColor(scope.pickedColor);
                                                        scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#ffffff" ? uiUtilService.lighterColor(scope.pickedColor, 0.5) : uiUtilService.lighterColor(scope.pickedColor, -0.5);
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
                                    return scope.pickStyle(styles, scope.pseudo)["color"] || "#000000";
                                }

                                scope.setColor = function (value) {
                                    var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.color[pseudoStylePrefix] = scope.color[pseudoStylePrefix] || {};
                                    var pseudoColorStyle = scope.color[pseudoStylePrefix];
                                    if (pseudoColorStyle['color'] != value) {
                                        pseudoColorStyle['color'] = value;

                                        //Trigger watcher on sketchWidgetSetting.color to apply style to widget
                                        scope.color = angular.copy(scope.color);
                                    }

                                    scope.pickerPaneColor = "";
                                    scope.pickedColor = value;
                                    $timeout(function () {
                                        scope.pickerPaneBackgroundColor = value;
                                        scope.pickerPaneColor = uiUtilService.contrastColor(value);
                                        scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#ffffff" ? uiUtilService.lighterColor(value, 0.5) : uiUtilService.lighterColor(value, -0.5);
                                    });
                                };

                                scope.toggleColorControl = function () {
                                    scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            scope.setColor(scope.pickColorValue(scope.color));
                                        } else {
                                            scope.color = {};
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
                                    event && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel"),
                                        $palette = element.find("#colorPickerPalette > :first-child"),
                                        paletteScope = angular.element($palette).scope();

                                    if ($wrapper.hasClass("expanded")) {
                                        paletteScope.showInitialTab().then(function () {
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
                                            return paletteScope.showInitialTab();
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