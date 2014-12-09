define(
    ["angular", "jquery", "hammer", "ng.ui.hammer-gestures", "ng.ui.extension"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiGradientEditor", _.union(inject, [function ($timeout, $q, angularEventTypes, uiUtilService) {
                'use strict';

                var boundProperties = {gradientColor: "="},
                    defaults = {
                        angleStep: 5
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_gradient-editor.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {

                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                scope.$root.$broadcast(
                                    angularEventTypes.boundPropertiesEvent,
                                    uiUtilService.createDirectiveBoundMap(boundProperties, attrs,
                                        {
                                            gradientColor: function (value) {
                                                if (value && scope.hasStyle(value)) {
                                                    scope.pickedGradientColor = scope.pickGradientColorValue(value);
                                                    scope.enableControl();
                                                } else {
                                                    scope.disableControl();
                                                }
                                            }
                                        },
                                        {
                                            gradientColor: "uiGradientEditor"
                                        }
                                    )
                                );

                                scope.pickGradientColorValue = function (styles) {
                                    var styleValue = scope.pickStyle(styles, scope.pseudo)["linearGradientColor"];

                                    if (styleValue && !_.isEmpty(styleValue)) {
                                        return styleValue;
                                    } else {
                                        var color = scope.colors && scope.colors.length && scope.colors[0] || "#000000";

                                        return {
                                            angle: 0, colorStopList: [
                                                {
                                                    percent: 0,
                                                    color: color,
                                                    minPercent: 0,
                                                    maxPercent: 100,
                                                    backgroundColor: uiUtilService.contrastColor(color) === "#ffffff" ? uiUtilService.lighterColor(color, 0.5) : uiUtilService.lighterColor(color, -0.5)
                                                }
                                            ]
                                        };
                                    }
                                }

                                scope.Math = Math;
                                scope.pseudo = "";
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
                                }

                                scope.toggleGradientControl = function () {
                                    scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            scope.setGradientColor(scope.pickGradientColorValue(scope.gradientColor))
                                        } else {
                                            scope.gradientColor = {};
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

                                    //Trigger watcher on sketchWidgetSetting.gradientColor to apply style to widget
                                    scope.setGradientColor(scope.pickedGradientColor);
                                }

                                scope.decrementAngle = function (event, step) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    step = step || options.angleStep;
                                    var angle = scope.pickedGradientColor.angle;
                                    angle -= step;
                                    angle += 360;
                                    angle %= 360;
                                    scope.pickedGradientColor.angle = angle;

                                    //Trigger watcher on sketchWidgetSetting.gradientColor to apply style to widget
                                    scope.setGradientColor(scope.pickedGradientColor);
                                }

                                scope.toggleEditor = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if ($wrapper.hasClass("expanded")) {
                                        if (scope.hasClass(".editorPalette", "show")) {
                                            scope.toggleDisplay(".editorPalette").then(function () {
                                                return scope.toggleDisplay($panel);
                                            }).then(function () {
                                                $wrapper.removeClass("expanded");
                                            });
                                        } else {
                                            scope.toggleDisplay($panel).then(function () {
                                                $wrapper.removeClass("expanded");
                                            });
                                        }
                                    } else {
                                        $wrapper.addClass("expanded");
                                        scope.toggleDisplay($panel);
                                    }

                                    element.find(".circular-menu .circle").removeClass("show");
                                    element.find(".editorPalette").removeClass("show");
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
                                        scope.toggleDisplay(".colorStop[color-order=" + index + "] .circular-menu .circle", event);
                                    }
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

                                        //Trigger watcher on sketchWidgetSetting.gradientColor to apply style to widget
                                        scope.setGradientColor(scope.pickedGradientColor);
                                    }
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

                                                    //Trigger watcher on sketchWidgetSetting.gradientColor to apply style to widget
                                                    scope.setGradientColor(scope.pickedGradientColor);
                                                }
                                            );
                                        }
                                    }
                                }

                                scope.setColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (index < scope.pickedGradientColor.colorStopList.length) {
                                        scope.selectedStopColor = scope.pickedGradientColor.colorStopList[index].color;
                                        scope.selectedColorStopIndex = index;

                                        scope.togglePalette();
                                    }
                                }

                                scope.copyColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (index < scope.pickedGradientColor.colorStopList.length) {
                                        scope.copiedColor = scope.pickedGradientColor.colorStopList[index].color;
                                    }
                                }

                                scope.pasteColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (scope.copiedColor && index < scope.pickedGradientColor.colorStopList.length) {
                                        var colorStop = scope.pickedGradientColor.colorStopList[index];

                                        if (scope.copiedColor !== colorStop.color) {
                                            scope.setStopColor(index, scope.copiedColor);
                                        }
                                    }
                                }

                                scope.setStopColor = function (index, hex, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (index < scope.pickedGradientColor.colorStopList.length) {
                                        var colorStop = scope.pickedGradientColor.colorStopList[index];

                                        if (hex !== colorStop.color) {
                                            colorStop.color = "";

                                            $timeout(function () {
                                                colorStop.color = hex;
                                                colorStop.backgroundColor = uiUtilService.contrastColor(hex) === "#ffffff" ? uiUtilService.lighterColor(hex, 0.5) : uiUtilService.lighterColor(hex, -0.5);

                                                //Trigger watcher on sketchWidgetSetting.gradientColor to apply style to widget
                                                scope.setGradientColor(scope.pickedGradientColor);
                                            }).then($timeout(function () {
                                                var $colorStop = element.find(".colorStop[color-order=" + index + "]");

                                                uiUtilService.onAnimationEnd($colorStop).then(
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
                                    scope.pickedGradientColor = value;

                                    var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.gradientColor[pseudoStylePrefix] = scope.gradientColor[pseudoStylePrefix] || {};
                                    var pseudoGradientStyle = scope.gradientColor[pseudoStylePrefix];
                                    pseudoGradientStyle['linearGradientColor'] = value;

                                    //Trigger watcher on sketchWidgetSetting.gradientColor to apply style to widget
                                    scope.gradientColor = angular.copy(scope.gradientColor);
                                };
                            }
                        }
                    }
                }
            }]));
        }
    }
);