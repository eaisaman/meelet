define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$http", "$timeout", "$q", "$exceptionHandler", "angularEventTypes", "angularConstants", "uiUtilService"];

            appModule.directive("uiBorderEditor", _.union(inject, [function ($parse, $http, $timeout, $q, $exceptionHandler, angularEventTypes, angularConstants, uiUtilService) {
                'use strict';

                var boundProperties = {border: "="},
                    defaults = {
                        borderJson: "",
                        borderColor: {color: "#000000", alpha: 1},
                        borderWidth: "0px",
                        borderStyle: "solid",
                        borderRadius: "0px"
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_border-editor.html",
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
                                            border: function (value) {
                                                if (value && scope.hasStyle(value)) {
                                                    scope.pickedBorderColor = scope.pickBorderColorValue(value);
                                                    scope.pickedBorderWidth = scope.pickBorderWidthValue(value);
                                                    scope.pickedBorderStyle = scope.pickBorderStyleValue(value);
                                                    scope.pickedBorderRadius = scope.pickBorderRadiusValue(value);
                                                    scope.enableControl();
                                                } else {
                                                    scope.disableControl();
                                                }
                                            }
                                        },
                                        {
                                            border: "uiBorderEditor"
                                        })
                                );

                                if (options.borderJson) {
                                    $http.get(options.borderJson).then(function (result) {
                                        scope.borderList = result.data;

                                        if (scope.borderList && scope.borderList.length) {
                                            scope.borderWidthList = scope.borderList[0].borderWidthList;
                                            scope.borderStyleList = scope.borderList[0].borderStyleList;
                                        }
                                    });
                                }

                                scope.pickBorderColorValue = function (styles) {
                                    return scope.pickStyle(styles, scope.pseudo)["border-color"] || angular.copy(options.borderColor);
                                }

                                scope.pickBorderWidthValue = function (styles) {
                                    var value = scope.pickStyle(styles, scope.pseudo)["border-width"] || options.borderWidth;
                                    if (!value.match(/px$/)) value += "px";
                                    return value;
                                }

                                scope.pickBorderStyleValue = function (styles) {
                                    return scope.pickStyle(styles, scope.pseudo)["border-style"] || options.borderStyle;
                                }

                                scope.pickBorderRadiusValue = function (styles) {
                                    var value = scope.pickStyle(styles, scope.pseudo)["border-radius"] || options.borderRadius;
                                    if (!value.match(/px$/)) value += "px";
                                    return value;
                                }

                                scope.Math = Math;
                                scope.borderIsSet = true;
                                scope.borderColorPaneColor = "";
                                scope.borderColorPaneBackgroundColor = "";
                                scope.pseudo = "";

                                function createBorderValueInputAssign(name, boundName) {
                                    var fn = $parse(name),
                                        assign = fn.assign;

                                    if (!fn.assign.customized) {
                                        fn.assign = function ($scope, value) {
                                            function borderInputHandler(value) {
                                                var defer = $q.defer();

                                                $timeout(function () {
                                                    var setterName = "set" + boundName.charAt(0).toUpperCase() + boundName.substr(1);
                                                    var setter = scope[setterName];
                                                    setter && setter.apply(scope, [value]);

                                                    defer.resolve();
                                                });

                                                return defer.promise;
                                            }

                                            borderInputHandler.onceId = "uiBorderEditor.createBorderValueInputAssign.borderInputHandler";

                                            if (value) {
                                                var args = Array.prototype.slice.call(arguments),
                                                    result = assign.apply(fn, args);

                                                uiUtilService.once(borderInputHandler, null, 20)(value);

                                                return result;
                                            }
                                        }

                                        fn.assign.customized = true;
                                    }
                                    return fn;
                                }

                                createBorderValueInputAssign("pickedBorderWidth", "borderWidth");
                                createBorderValueInputAssign("pickedBorderRadius", "borderRadius");
                            },
                            post: function (scope, element, attrs) {
                                scope.toggleBorderControl = function () {
                                    scope.borderList && scope.borderList.length && scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            uiUtilService.whilst(
                                                function () {
                                                    return !scope.border;
                                                },
                                                function (callback) {
                                                    callback();
                                                },
                                                function (err) {
                                                    scope.setBorderColor(angular.copy(options.borderColor));
                                                    scope.setBorderWidth(options.borderWidth);
                                                    scope.setBorderStyle(options.borderStyle);
                                                    scope.setBorderRadius(options.borderRadius);

                                                    return uiUtilService.getResolveDefer();
                                                },
                                                angularConstants.checkInterval,
                                                "ui-border-editor.toggleBorderControl",
                                                angularConstants.renderTimeout
                                            );
                                        } else {
                                            if (scope.border) {
                                                scope.border = angular.copy(scope.unsetStyle(scope.border, scope.pseudo));
                                            }
                                        }
                                    });
                                }

                                scope.togglePalette = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

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

                                scope.toggleSelectBorderColorPane = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $borderColorPane = element.find(".borderColorPane"),
                                        $palette = $borderColorPane.find(".borderColorPalette"),
                                        paletteScope = angular.element($palette.find("> :first-child")).scope();

                                    if ($borderColorPane.hasClass("select")) {
                                        paletteScope.closePalette().then(function () {
                                            return scope.toggleSelect($borderColorPane);
                                        }).then(function () {
                                            scope.watchBorderColor(false);
                                        });
                                    } else {
                                        scope.toggleSelect($borderColorPane).then(function () {
                                            return paletteScope.openPalette();
                                        }).then(function () {
                                            scope.watchBorderColor(true);
                                        });
                                    }
                                }

                                scope.watchBorderColor = function (state) {
                                    if (state) {
                                        if (!scope.deregisterWatch) {
                                            scope.deregisterWatch = scope.$watch("pickedBorderColor", function (to) {
                                                to && scope.setBorderColor(to);
                                            });
                                        }
                                    } else {
                                        scope.deregisterWatch && scope.deregisterWatch();
                                        scope.deregisterWatch = null;
                                    }
                                }

                                scope.setBorderColor = function (value) {
                                    if (value && value.color) {
                                        if (value.alpha < 1 && !value.alphaColor) {
                                            value.alphaColor = uiUtilService.rgba(value);
                                        }

                                        var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                        pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                        scope.border[pseudoStylePrefix] = scope.border[pseudoStylePrefix] || {};
                                        var pseudoBorderStyle = scope.border[pseudoStylePrefix];

                                        if (pseudoBorderStyle['border-color'] == null || pseudoBorderStyle['border-color'].color != value.color || pseudoBorderStyle['border-color'].alpha != value.alpha) {
                                            pseudoBorderStyle['border-color'] = _.pick(value, ["color", "alpha", "alphaColor"]);

                                            //Trigger watcher on sketchWidgetSetting.borderColor to apply style to widget
                                            scope.border = angular.copy(scope.border);

                                            scope.borderIsSet = false;
                                            scope.pickedBorderColor = value;
                                            scope.borderColorPaneBackgroundColor = "";
                                            scope.borderColorPaneColor = uiUtilService.contrastColor(value.color);
                                            $timeout(function () {
                                                scope.borderColorPaneBackgroundColor = value.alphaColor || value.color;
                                                scope.borderIsSet = true;
                                            });
                                        }
                                    }
                                }

                                scope.setBorderWidth = function (value) {
                                    if (value) {
                                        var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                        pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                        scope.border[pseudoStylePrefix] = scope.border[pseudoStylePrefix] || {};
                                        var pseudoBorderStyle = scope.border[pseudoStylePrefix];

                                        if (pseudoBorderStyle['border-width'] != value) {
                                            pseudoBorderStyle['border-width'] = value;

                                            //Trigger watcher on sketchWidgetSetting.borderWidth to apply style to widget
                                            scope.border = angular.copy(scope.border);

                                            scope.borderIsSet = false;
                                            scope.pickedBorderWidth = value;
                                            $timeout(function () {
                                                scope.borderIsSet = true;
                                            });
                                        }
                                    }
                                }

                                scope.setBorderStyle = function (value) {
                                    if (value) {
                                        var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                        pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                        scope.border[pseudoStylePrefix] = scope.border[pseudoStylePrefix] || {};
                                        var pseudoBorderStyle = scope.border[pseudoStylePrefix];

                                        if (pseudoBorderStyle['border-style'] != value) {
                                            pseudoBorderStyle['border-style'] = value;

                                            //Trigger watcher on sketchWidgetSetting.borderStyle to apply style to widget
                                            scope.border = angular.copy(scope.border);

                                            scope.borderIsSet = false;
                                            scope.pickedBorderStyle = value;
                                            $timeout(function () {
                                                scope.borderIsSet = true;
                                            });
                                        }
                                    }
                                }

                                scope.setBorderRadius = function (value) {
                                    if (value) {
                                        var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                        pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                        scope.border[pseudoStylePrefix] = scope.border[pseudoStylePrefix] || {};
                                        var pseudoBorderStyle = scope.border[pseudoStylePrefix];

                                        if (pseudoBorderStyle['border-radius'] != value) {
                                            pseudoBorderStyle['border-radius'] = value;

                                            //Trigger watcher on sketchWidgetSetting.borderRadius to apply style to widget
                                            scope.border = angular.copy(scope.border);

                                            scope.borderIsSet = false;
                                            scope.pickedBorderRadius = value;
                                            $timeout(function () {
                                                scope.borderIsSet = true;
                                            });
                                        }
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