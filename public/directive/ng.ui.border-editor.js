define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$http", "$timeout", "$q", "$exceptionHandler", "angularEventTypes", "angularConstants", "utilService"];

            appModule.directive("uiBorderEditor", _.union(inject, [function ($parse, $http, $timeout, $q, $exceptionHandler, angularEventTypes, angularConstants, utilService) {
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
                    scope: angular.extend({dockAlign: "=", pseudo: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_border-editor.html",
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

                                utilService.broadcast(scope,
                                    angularEventTypes.boundPropertiesEvent,
                                    utilService.createDirectiveBoundMap(
                                        boundProperties,
                                        attrs,
                                        {
                                            border: function (value) {
                                                scope.border = value;

                                                scope.pickedBorderColor = scope.pickBorderColorValue(null, false);
                                                scope.pickedBorderWidth = scope.pickBorderWidthValue(null, false);
                                                scope.pickedBorderStyle = scope.pickBorderStyleValue(null, false);
                                                scope.pickedBorderRadius = scope.pickBorderRadiusValue(null, false);

                                                if (!scope.pickedBorderColor && !scope.pickedBorderWidth && !scope.pickedBorderStyle && !scope.pickedBorderRadius) {
                                                    scope.disableControl();
                                                    scope.togglePalette(false);
                                                } else {
                                                    scope.pickedBorderColor = scope.pickedBorderColor || angular.copy(options.borderColor);
                                                    scope.pickedBorderWidth = scope.pickedBorderWidth || options.borderWidth;
                                                    scope.pickedBorderStyle = scope.pickedBorderStyle || options.borderStyle;
                                                    scope.pickedBorderRadius = scope.pickedBorderRadius || options.borderRadius;

                                                    scope.borderIsSet = false;
                                                    scope.borderColorPaneBackgroundColor = "";
                                                    scope.borderColorPaneColor = utilService.contrastColor(scope.pickedBorderColor.color);
                                                    $timeout(function () {
                                                        scope.borderColorPaneBackgroundColor = scope.pickedBorderColor && (scope.pickedBorderColor.alphaColor || scope.pickedBorderColor.color) || "";
                                                        scope.borderIsSet = true;
                                                    });
                                                    scope.enableControl();
                                                    scope.togglePalette(true);
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

                                scope.pickBorderColorValue = function (pseudo, useDefault) {
                                    useDefault = useDefault == null || useDefault;
                                    return scope.border && scope.pickStyle(scope.border, pseudo != null ? pseudo : scope.pseudo)["border-color"] || (useDefault && angular.copy(options.borderColor) || null);
                                }

                                scope.pickBorderWidthValue = function (pseudo, useDefault) {
                                    useDefault = useDefault == null || useDefault;
                                    var value = scope.border && scope.pickStyle(scope.border, pseudo != null ? pseudo : scope.pseudo)["border-width"] || (useDefault && options.borderWidth || null);
                                    if (value && !value.match(/px$/)) value += "px";
                                    return value;
                                }

                                scope.pickBorderStyleValue = function (pseudo, useDefault) {
                                    useDefault = useDefault == null || useDefault;
                                    return scope.border && scope.pickStyle(scope.border, pseudo != null ? pseudo : scope.pseudo)["border-style"] || (useDefault && options.borderStyle || null);
                                }

                                scope.pickBorderRadiusValue = function (pseudo, useDefault) {
                                    useDefault = useDefault == null || useDefault;
                                    var value = scope.border && scope.pickStyle(scope.border, pseudo != null ? pseudo : scope.pseudo)["border-radius"] || (useDefault && options.borderRadius || null);
                                    if (value && !value.match(/px$/)) value += "px";
                                    return value;
                                }

                                scope.Math = Math;
                                scope.borderIsSet = true;
                                scope.borderColorPaneColor = "";
                                scope.borderColorPaneBackgroundColor = "";
                            },
                            post: function (scope, element, attrs) {
                                scope.toggleBorderControl = function () {
                                    if (scope.borderList && scope.borderList.length) {
                                        return scope.toggleEnableControl().then(function (enable) {
                                            if (enable) {
                                                return utilService.whilst(
                                                    function () {
                                                        return !scope.border;
                                                    },
                                                    function (err) {
                                                        err || $q.all([
                                                            scope.setBorderColor(angular.copy(options.borderColor)),
                                                            scope.setBorderWidth(options.borderWidth),
                                                            scope.setBorderStyle(options.borderStyle),
                                                            scope.setBorderRadius(options.borderRadius)
                                                        ]).then(function () {
                                                            return scope.togglePalette(true);
                                                        });
                                                    },
                                                    angularConstants.checkInterval,
                                                    "ui-border-editor.toggleBorderControl",
                                                    angularConstants.renderTimeout
                                                );
                                            } else {
                                                if (scope.border) {
                                                    scope.border = angular.copy(scope.unsetStyle(scope.border, scope.pseudo));
                                                }

                                                return scope.togglePalette(false);
                                            }
                                        });
                                    } else {
                                        return utilService.getResolveDefer();
                                    }
                                }

                                scope.togglePalette = function (state) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if (state == null || $wrapper.hasClass("expanded") ^ state) {
                                        if ($wrapper.hasClass("expanded")) {
                                            return scope.toggleDisplay($panel).then(function () {
                                                return scope.toggleExpand($wrapper);
                                            });
                                        } else {
                                            return scope.toggleExpand($wrapper).then(function () {
                                                return scope.toggleDisplay($panel);
                                            });
                                        }
                                    }
                                }

                                scope.toggleSelectBorderColorPane = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $borderColorPane = element.find(".borderColorPane"),
                                        $palette = $borderColorPane.find(".borderColorPalette"),
                                        paletteScope = angular.element($palette.find("> :first-child")).scope();

                                    if ($borderColorPane.hasClass("select")) {
                                        return paletteScope.closePalette().then(function () {
                                            return scope.toggleSelect($borderColorPane);
                                        }).then(function () {
                                            scope.watchBorderColor(false);

                                            return utilService.getResolveDefer();
                                        });
                                    } else {
                                        return scope.toggleSelect($borderColorPane).then(function () {
                                            return paletteScope.openPalette();
                                        }).then(function () {
                                            scope.watchBorderColor(true);

                                            return utilService.getResolveDefer();
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
                                            value.alphaColor = utilService.rgba(value);
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
                                            scope.borderColorPaneColor = utilService.contrastColor(value.color);
                                            return $timeout(function () {
                                                scope.borderColorPaneBackgroundColor = value.alphaColor || value.color;
                                                scope.borderIsSet = true;
                                            });
                                        }
                                    }

                                    return utilService.getResolveDefer();
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
                                            return $timeout(function () {
                                                scope.borderIsSet = true;
                                            });
                                        }
                                    }

                                    return utilService.getResolveDefer();
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
                                            return $timeout(function () {
                                                scope.borderIsSet = true;
                                            });
                                        }
                                    }

                                    return utilService.getResolveDefer();
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
                                            return $timeout(function () {
                                                scope.borderIsSet = true;
                                            });
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.pseudoChangeWatcher = scope.$on(angularEventTypes.widgetPseudoChangeEvent, function (event, pseudo) {
                                    scope.pickedBorderColor = scope.pickBorderColorValue(pseudo, false);
                                    scope.pickedBorderWidth = scope.pickBorderWidthValue(pseudo, false);
                                    scope.pickedBorderStyle = scope.pickBorderStyleValue(pseudo, false);
                                    scope.pickedBorderRadius = scope.pickBorderRadiusValue(pseudo, false);

                                    if (!scope.pickedBorderColor && !scope.pickedBorderWidth && !scope.pickedBorderStyle && !scope.pickedBorderRadius) {
                                        scope.disableControl();
                                    } else {
                                        scope.pickedBorderColor = scope.pickedBorderColor || angular.copy(options.borderColor);
                                        scope.pickedBorderWidth = scope.pickedBorderWidth || options.borderWidth;
                                        scope.pickedBorderStyle = scope.pickedBorderStyle || options.borderStyle;
                                        scope.pickedBorderRadius = scope.pickedBorderRadius || options.borderRadius;

                                        scope.borderIsSet = false;
                                        scope.borderColorPaneBackgroundColor = "";
                                        scope.borderColorPaneColor = utilService.contrastColor(scope.pickedBorderColor.color);
                                        $timeout(function () {
                                            scope.borderColorPaneBackgroundColor = scope.pickedBorderColor && (scope.pickedBorderColor.alphaColor || scope.pickedBorderColor.color) || "";
                                            scope.borderIsSet = true;
                                        });
                                        scope.enableControl();
                                    }
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