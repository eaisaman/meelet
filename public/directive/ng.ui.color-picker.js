define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "$interval", "$exceptionHandler", "angularEventTypes", "angularConstants", "utilService"];

            appModule.directive("uiColorPicker", _.union(inject, [function ($http, $timeout, $q, $interval, $exceptionHandler, angularEventTypes, angularConstants, utilService) {
                'use strict';

                var boundProperties = {color: "="},
                    defaults = {
                        color: {color: "#000000", alpha: 1}
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "=", pseudo: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_color-picker.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    "$timeout": $timeout,
                                    "$interval": $interval,
                                    "$q": $q,
                                    "angularConstants": angularConstants,
                                    "utilService": utilService,
                                    element: element,
                                    scope: scope
                                }));

                                utilService.broadcast(scope,
                                    angularEventTypes.boundPropertiesEvent,
                                    utilService.createDirectiveBoundMap(
                                        boundProperties,
                                        attrs,
                                        {
                                            color: function (value) {
                                                scope.color = value;
                                                scope.pickedColor = scope.pickColorValue(null, false);

                                                if (scope.pickedColor) {
                                                    scope.colorIsSet = false;

                                                    if (scope.pickedColor.alpha < 1 && !scope.pickedColor.alphaColor) {
                                                        scope.pickedColor.alphaColor = utilService.rgba(scope.pickedColor);
                                                    }
                                                    scope.pickerPaneBackgroundColor = scope.pickedColor.alphaColor || scope.pickedColor.color;
                                                    scope.pickerPaneColor = utilService.contrastColor(scope.pickedColor.color);
                                                    scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#ffffff" ? utilService.lighterColor(scope.pickedColor.color, 0.5) : utilService.lighterColor(scope.pickedColor.color, -0.5);
                                                    $timeout(function () {
                                                        scope.colorIsSet = true;
                                                        scope.enableControl();
                                                        scope.togglePalette(true);
                                                    });
                                                } else {
                                                    scope.disableControl();
                                                    scope.togglePalette(false);
                                                }
                                            }
                                        },
                                        {color: "uiColorPicker"}
                                    )
                                );

                                scope.pickColorValue = function (pseudo, useDefault) {
                                    useDefault = useDefault == null || useDefault;
                                    return scope.color && scope.pickStyle(scope.color, pseudo != null ? pseudo : scope.pseudo)["color"] || (useDefault && angular.copy(options.color) || null);
                                }

                                scope.setColor = function (value) {
                                    if (value.color) {
                                        if (value.alpha < 1 && !value.alphaColor) {
                                            value.alphaColor = utilService.rgba(value);
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
                                            scope.pickerPaneColor = utilService.contrastColor(value.color);
                                            scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#ffffff" ? utilService.lighterColor(value.color, 0.5) : utilService.lighterColor(value.color, -0.5);
                                            return $timeout(function () {
                                                scope.colorIsSet = true;
                                            });
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                };

                                scope.toggleColorControl = function () {
                                    return scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            return utilService.whilst(
                                                function () {
                                                    return !scope.color;
                                                },
                                                function (err) {
                                                    err || scope.setColor(angular.copy(options.color)).then(function () {
                                                        return scope.togglePalette(true);
                                                    });
                                                },
                                                angularConstants.checkInterval,
                                                "ui-color-picker-toggleColorControl",
                                                angularConstants.renderTimeout
                                            );
                                        } else {
                                            if (scope.color) {
                                                scope.color = angular.copy(scope.unsetStyle(scope.color, scope.pseudo));
                                            }

                                            return scope.togglePalette(false);
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
                            },
                            post: function (scope, element, attrs) {
                                scope.togglePalette = function (state) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel"),
                                        $palette = element.find("#colorPickerPalette > :first-child"),
                                        paletteScope = angular.element($palette).scope();

                                    if (state == null || $wrapper.hasClass("expanded") ^ state) {
                                        if ($wrapper.hasClass("expanded")) {
                                            return paletteScope.closePalette().then(function () {
                                                return scope.toggleDisplay($panel);
                                            }).then(function () {
                                                scope.watchColor(false);

                                                return scope.toggleExpand($wrapper);
                                            });
                                        } else {
                                            return scope.toggleExpand($wrapper).then(function () {
                                                return scope.toggleDisplay($panel);
                                            }).then(function () {
                                                scope.watchColor(true);

                                                return paletteScope.openPalette();
                                            });
                                        }
                                    }
                                }

                                scope.pseudoChangeWatcher = scope.$on(angularEventTypes.widgetPseudoChangeEvent, function (event, pseudo) {
                                    scope.colorIsSet = false;
                                    $timeout(function () {
                                        scope.colorIsSet = true;

                                        scope.pickedColor = scope.pickColorValue(pseudo, false);
                                        if (scope.pickedColor) {
                                            scope.enableControl();

                                            if (scope.pickedColor.alpha < 1 && !scope.pickedColor.alphaColor) {
                                                scope.pickedColor.alphaColor = utilService.rgba(scope.pickedColor);
                                            }
                                            scope.pickerPaneBackgroundColor = scope.pickedColor.alphaColor || scope.pickedColor.color;
                                            scope.pickerPaneColor = utilService.contrastColor(scope.pickedColor.color);
                                            scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#ffffff" ? utilService.lighterColor(scope.pickedColor.color, 0.5) : utilService.lighterColor(scope.pickedColor.color, -0.5);
                                        } else {
                                            scope.disableControl();
                                        }
                                    });
                                });

                                scope.$on('$destroy', function () {
                                    if (scope.pseudoChangeWatcher) {
                                        scope.pseudoChangeWatcher();
                                        scope.pseudoChangeWatcher = null;
                                    }
                                });

                            }
                        }
                    }
                }
            }]));
        }
    }
);