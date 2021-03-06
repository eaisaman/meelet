define(
    ["angular-lib", "jquery-lib", "hammer-lib", "ng.ui.hammer-gestures"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "$exceptionHandler", "angularEventTypes", "angularConstants", "utilService"];

            appModule.directive("uiGradientEditor", _.union(inject, [function ($timeout, $q, $exceptionHandler, angularEventTypes, angularConstants, utilService) {
                'use strict';

                var boundProperties = {linearGradientColor: "="},
                    defaults = {
                        angleStep: 5,
                        linearGradientColor: {
                            angle: 0, colorStopList: [
                                {
                                    percent: 0,
                                    color: {color: "#000000", alpha: 1},
                                    minPercent: 0,
                                    maxPercent: 100,
                                    backgroundColor: utilService.lighterColor("#000000", 0.5)
                                }
                            ]
                        }
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "=", pseudo: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_gradient-editor.html",
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
                                    utilService.createDirectiveBoundMap(boundProperties, attrs,
                                        {
                                            linearGradientColor: function (value) {
                                                scope.linearGradientColor = value;
                                                scope.pickedGradientColor = scope.pickGradientColorValue(null, false);

                                                if (scope.pickedGradientColor) {
                                                    scope.enableControl();
                                                    scope.toggleEditor(true);
                                                } else {
                                                    scope.disableControl();
                                                    scope.toggleEditor(false);
                                                }

                                            }
                                        },
                                        {
                                            linearGradientColor: "uiGradientEditor"
                                        }
                                    )
                                );

                                scope.pickGradientColorValue = function (pseudo, useDefault) {
                                    useDefault = useDefault == null || useDefault;
                                    var styleValue = scope.linearGradientColor && scope.pickStyle(scope.linearGradientColor, pseudo != null ? pseudo : scope.pseudo)["linearGradientColor"];

                                    return !_.isEmpty(styleValue) && styleValue || (useDefault && angular.copy(options.linearGradientColor) || null);
                                }

                                scope.Math = Math;
                            },
                            post: function (scope, element, attrs) {
                                function canInsertColorStop(index) {
                                    if (index < scope.pickedGradientColor.colorStopList.length) {
                                        if (index + 1 < scope.pickedGradientColor.colorStopList.length) {
                                            return scope.pickedGradientColor.colorStopList[index].percent + 1 < scope.pickedGradientColor.colorStopList[index + 1].percent;
                                        } else {
                                            return scope.pickedGradientColor.colorStopList[index].percent < 100;
                                        }
                                    }

                                    return false;
                                }

                                scope.onPercentChange = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $el = $(event.target),
                                        value = parseInt($el.val()),
                                        max = $el.attr("max"),
                                        min = $el.attr("min"),
                                        $stop = $el.closest(".colorStop"),
                                        $prev = $stop.prev(".colorStop"),
                                        $next = $stop.next(".colorStop");

                                    if (angular.isNumber(value) && min <= value && value <= max) {
                                        if ($prev.length) {
                                            $prev.find(".spinValue").attr("max", value - 1);
                                        }
                                        if ($next.length) {
                                            $next.find(".spinValue").attr("min", value + 1);
                                        }
                                    } else {
                                        var scopeEl = angular.element(event.target).scope();

                                        if ($prev.length) {
                                            scopeEl.colorStop.percent = parseInt($prev.attr("max")) + 1;
                                        } else {
                                            scopeEl.colorStop.percent = 0;
                                        }
                                    }

                                    //Trigger watcher on sketchWidgetSetting.linearGradientColor to apply style to widget
                                    scope.setGradientColor(scope.pickedGradientColor);
                                }

                                scope.toggleGradientControl = function () {
                                    return scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            return utilService.whilst(
                                                function () {
                                                    return !scope.linearGradientColor;
                                                },
                                                function (err) {
                                                    if (!err) {
                                                        scope.setGradientColor(angular.copy(options.linearGradientColor));
                                                        scope.toggleEditor(true);
                                                    }
                                                },
                                                angularConstants.checkInterval,
                                                "ui-gradient-editor.toggleGradientControl",
                                                angularConstants.renderTimeout
                                            );
                                        } else {
                                            if (scope.linearGradientColor) {
                                                scope.linearGradientColor = angular.copy(scope.unsetStyle(scope.linearGradientColor, scope.pseudo));
                                            }

                                            return scope.toggleEditor(false);
                                        }
                                    });
                                }

                                scope.incrementAngle = function (event, step) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    step = step || options.angleStep;
                                    var angle = scope.pickedGradientColor.angle;
                                    angle += step;
                                    angle %= 360;
                                    scope.pickedGradientColor.angle = angle;

                                    //Trigger watcher on sketchWidgetSetting.linearGradientColor to apply style to widget
                                    scope.setGradientColor(scope.pickedGradientColor);

                                    return utilService.getResolveDefer();
                                }

                                scope.decrementAngle = function (event, step) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    step = step || options.angleStep;
                                    var angle = scope.pickedGradientColor.angle;
                                    angle -= step;
                                    angle += 360;
                                    angle %= 360;
                                    scope.pickedGradientColor.angle = angle;

                                    //Trigger watcher on sketchWidgetSetting.linearGradientColor to apply style to widget
                                    scope.setGradientColor(scope.pickedGradientColor);

                                    return utilService.getResolveDefer();
                                }

                                scope.toggleEditor = function (state) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if (state == null || $wrapper.hasClass("expanded") ^ state) {
                                        if ($wrapper.hasClass("expanded")) {
                                            element.find(".circular-menu .circle").removeClass("show");

                                            if (scope.hasClass(".editorPalette", "show")) {
                                                return scope.toggleDisplay(".editorPalette").then(function () {
                                                    return scope.toggleDisplay($panel);
                                                }).then(function () {
                                                    $wrapper.removeClass("expanded");

                                                    return utilService.getResolveDefer();
                                                });
                                            } else {
                                                element.find(".editorPalette").removeClass("show");

                                                return scope.toggleDisplay($panel).then(function () {
                                                    $wrapper.removeClass("expanded");

                                                    return utilService.getResolveDefer();
                                                });
                                            }
                                        } else {
                                            element.find(".circular-menu .circle").removeClass("show");
                                            element.find(".editorPalette").removeClass("show");

                                            $wrapper.addClass("expanded");
                                            return scope.toggleDisplay($panel);
                                        }
                                    }
                                }

                                scope.togglePalette = function (event) {
                                    //toggleDisplayService is bought from extension object
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $palette = element.find(".editorPalette"),
                                        paletteScope = angular.element($palette.find("> :first-child")).scope();

                                    if (scope.hasClass(".editorPalette", "show")) {
                                        paletteScope.closePalette().then(function () {
                                            scope.watchSelectedStopColor(false);
                                        });
                                    } else {
                                        var top = element.find(".colorStop[color-order=" + scope.selectedColorStopIndex + "]").offset().top,
                                            paletteOffset = $palette.offset();
                                        paletteOffset.top = top;
                                        $palette.offset(paletteOffset);

                                        paletteScope.openPalette().then(function () {
                                            scope.watchSelectedStopColor(true);
                                        });
                                    }
                                }

                                scope.watchSelectedStopColor = function (state) {
                                    if (state) {
                                        if (!scope.deregisterWatch) {
                                            scope.deregisterWatch = scope.$watch("selectedStopColor", function (to) {
                                                to && scope.setStopColor(scope.selectedColorStopIndex, to);
                                            });
                                        }
                                    } else {
                                        scope.deregisterWatch && scope.deregisterWatch();
                                        scope.deregisterWatch = null;
                                    }
                                }

                                scope.toggleColorStopMenu = function (index, event) {
                                    //toggleDisplayService is bought from extension object
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (!element.find('.editorColorStopList .editorPalette').hasClass('show')) {
                                        return scope.toggleDisplay(".colorStop[color-order=" + index + "] .circular-menu .circle", event);
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.insertColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (canInsertColorStop(index)) {
                                        //Since input max and min threshold are modified, input value cannot be updated to html element immediately
                                        //postUpdateFn will be invoked later after scope is updated.
                                        var colorStop = angular.extend({}, scope.pickedGradientColor.colorStopList[index]);

                                        colorStop.minPercent = scope.pickedGradientColor.colorStopList[index].percent + 1;
                                        if (index + 1 < scope.pickedGradientColor.colorStopList.length) {
                                            colorStop.percent = colorStop.minPercent;
                                            colorStop.maxPercent = scope.pickedGradientColor.colorStopList[index + 1].percent - 1;
                                            scope.pickedGradientColor.colorStopList[index + 1].minPercent = colorStop.percent + 1;
                                        } else {
                                            colorStop.percent = colorStop.maxPercent = 100;
                                        }
                                        scope.pickedGradientColor.colorStopList[index].maxPercent = colorStop.percent - 1;

                                        scope.pickedGradientColor.colorStopList.splice(index + 1, 0, colorStop);

                                        //Trigger watcher on sketchWidgetSetting.linearGradientColor to apply style to widget
                                        scope.setGradientColor(scope.pickedGradientColor);
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.removeColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (scope.pickedGradientColor.colorStopList.length > 1 && index < scope.pickedGradientColor.colorStopList.length) {
                                        if (index >= 1) {
                                            if (index + 1 < scope.pickedGradientColor.colorStopList.length) {
                                                scope.pickedGradientColor.colorStopList[index - 1].maxPercent = scope.pickedGradientColor.colorStopList[index + 1].percent - 1;
                                                scope.pickedGradientColor.colorStopList[index + 1].minPercent = scope.pickedGradientColor.colorStopList[index - 1].percent + 1;
                                            } else {
                                                scope.pickedGradientColor.colorStopList[index - 1].maxPercent = 100;
                                                $timeout(
                                                    function () {
                                                        scope.pickedGradientColor.colorStopList[scope.pickedGradientColor.colorStopList.length - 1].percent = 100;
                                                    }
                                                );
                                            }
                                        } else {
                                            scope.pickedGradientColor.colorStopList[index + 1].minPercent = 0;
                                            if (index + 2 < scope.pickedGradientColor.colorStopList.length) {
                                                scope.pickedGradientColor.colorStopList[index + 2].minPercent = 1;
                                                scope.pickedGradientColor.colorStopList[index + 1].maxPercent = scope.pickedGradientColor.colorStopList[index + 2].percent - 1;
                                            } else {
                                                scope.pickedGradientColor.colorStopList[index + 1].maxPercent = 100;
                                            }

                                            scope.pickedGradientColor.colorStopList.splice(index, 1);

                                            $timeout(
                                                function () {
                                                    scope.pickedGradientColor.colorStopList[0].percent = 0;

                                                    //Trigger watcher on sketchWidgetSetting.linearGradientColor to apply style to widget
                                                    scope.setGradientColor(scope.pickedGradientColor);
                                                }
                                            );
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.setColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (index < scope.pickedGradientColor.colorStopList.length) {
                                        scope.selectedStopColor = scope.pickedGradientColor.colorStopList[index].color;
                                        scope.selectedColorStopIndex = index;

                                        scope.togglePalette();
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.copyColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (index < scope.pickedGradientColor.colorStopList.length) {
                                        scope.copiedColor = angular.copy(scope.pickedGradientColor.colorStopList[index].color);
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.pasteColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (scope.copiedColor && index < scope.pickedGradientColor.colorStopList.length) {
                                        scope.setStopColor(index, scope.copiedColor);
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.setStopColor = function (index, value, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (value.color && index < scope.pickedGradientColor.colorStopList.length) {
                                        if (value.alpha < 1 && !value.alphaColor) {
                                            value.alphaColor = utilService.rgba(value);
                                        }

                                        var colorStop = scope.pickedGradientColor.colorStopList[index];

                                        if (value !== colorStop.color) {
                                            colorStop.color = null;

                                            $timeout(function () {
                                                colorStop.color = value;
                                                colorStop.backgroundColor = utilService.contrastColor(value.color) === "#ffffff" ? utilService.lighterColor(value.color, 0.5) : utilService.lighterColor(value.color, -0.5);

                                                //Trigger watcher on sketchWidgetSetting.linearGradientColor to apply style to widget
                                                scope.setGradientColor(scope.pickedGradientColor);
                                            }).then($timeout(function () {
                                                var $colorStop = element.find(".colorStop[color-order=" + index + "]");

                                                utilService.onAnimationEnd($colorStop).then(
                                                    function () {
                                                        $colorStop.removeClass("animate");
                                                    }
                                                );
                                                $colorStop.addClass("animate");
                                            }));
                                        }
                                    }

                                    return true;
                                }

                                scope.setGradientColor = function (value) {
                                    value.colorStopList.forEach(function (colorStop) {
                                        if (colorStop.color.alpha < 1 && !colorStop.color.alphaColor) {
                                            colorStop.color.alphaColor = utilService.rgba(colorStop.color);
                                        }
                                    });

                                    scope.pickedGradientColor = value;

                                    var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.linearGradientColor[pseudoStylePrefix] = scope.linearGradientColor[pseudoStylePrefix] || {};
                                    var pseudoGradientStyle = scope.linearGradientColor[pseudoStylePrefix];
                                    value.colorStopList.forEach(function (colorStop) {
                                        colorStop.color = _.pick(colorStop.color, ["color", "alpha", "alphaColor"]);
                                    });
                                    pseudoGradientStyle['linearGradientColor'] = value;

                                    //Trigger watcher on sketchWidgetSetting.linearGradientColor to apply style to widget
                                    scope.linearGradientColor = angular.copy(scope.linearGradientColor);
                                };

                                scope.pseudoChangeWatcher = scope.$on(angularEventTypes.widgetPseudoChangeEvent, function (event, pseudo) {
                                    scope.pickedGradientColor = scope.pickGradientColorValue(pseudo, false);

                                    if (scope.pickedGradientColor) {
                                        scope.enableControl();
                                    } else {
                                        scope.disableControl();
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