define(
    ["angular", "jquery", "hammer", "ng.ui.hammer-gestures", "ng.ui.extension"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiGradientEditor", _.union(inject, [function ($http, $timeout, $q, angularEventTypes, uiUtilService) {
                'use strict';

                var boundProperties = {gradientColor: "="},
                    defaults = {
                        angleStep: 5,
                        colorJson: "",
                        colors: ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e",
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
                    templateUrl: "include/_gradient-editor.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                function completeColors(arr) {
                                    if (scope.colors && arr) {
                                        arr = _.difference(_.union(arr), scope.colors);
                                        arr.forEach(function (c) {
                                            scope.colors.splice(0, 0, c);
                                        })
                                    }
                                }

                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {element: element, scope: scope}));

                                scope.$root.$broadcast(
                                    angularEventTypes.boundPropertiesEvent,
                                    uiUtilService.createDirectiveBoundMap(boundProperties, attrs,
                                        {
                                            gradientColor: function (value) {
                                                if (value) {
                                                    var colorArr = [];
                                                    scope.colorStopList = [];
                                                    value.colorStopList.forEach(function (colorStop) {
                                                        colorStop.color = uiUtilService.formalizeHex(colorStop.color);
                                                        scope.colorStopList.push(_.extend({}, colorStop));
                                                        colorArr.push(colorStop.color);
                                                    });

                                                    scope.angle = value.angle;
                                                    completeColors(colorArr);
                                                    scope.enableControl();
                                                } else {
                                                    scope.disableControl();
                                                }
                                            }
                                        }
                                    )
                                );

                                if (options.colorJson) {
                                    $http.get(options.colorJson).then(function (result) {
                                        scope.colors = result.data;

                                        if (scope.colorStopList) {
                                            var colorArr = [];
                                            scope.colorStopList.forEach(function (colorStop) {
                                                colorArr.push(colorStop.color);
                                            });

                                            completeColors(colorArr);
                                        }
                                    });
                                } else {
                                    scope.colors = options.colors || [];
                                }

                                var color = scope.colors && scope.colors.length && scope.colors[0] || "#000000";
                                scope.colorStopList = [];
                                scope.angle = 0;
                                scope.selectedColor = {color: "#000000", rValue: 0, gValue: 0, bValue: 0, hueValue: 0, saturationValue: 0, lightValue: 0};
                                scope.Math = Math;
                            },
                            post: function (scope, element, attrs) {
                                function setSelectedColor(color) {
                                    function colorValuePercent(value, colorValueType) {
                                        var range = 0;
                                        if (colorValueType == "R" || colorValueType == "G" || colorValueType == "B") {
                                            range = 255;
                                        }
                                        if (colorValueType == "Hue" || colorValueType == "Saturation" || colorValueType == "Light") {
                                            range = 1;
                                        }

                                        return range && value && (Math.floor(value / range * 100) + "%") || "0%";
                                    }

                                    if (scope.selectedColor.rValue != color.rValue || scope.selectedColor.gValue != color.gValue || scope.selectedColor.bValue != color.bValue) {
                                        color.color = uiUtilService.rgbToHex(color.rValue, color.gValue, color.bValue);
                                    } else if (scope.selectedColor.hueValue != color.hueValue || scope.selectedColor.saturationValue != color.saturationValue || scope.selectedColor.lightValue != color.lightValue) {
                                        color.color = uiUtilService.hslToHex(color.hueValue, color.saturationValue, color.lightValue);
                                    }
                                    if (scope.selectedColor.rValue != color.rValue) {
                                        element.find(".rValuePane .scrollMeter").css("top", colorValuePercent(color.rValue, "R"));
                                        scope.selectedColor.rValue = Math.floor(color.rValue);
                                    }
                                    if (scope.selectedColor.gValue != color.gValue) {
                                        element.find(".gValuePane .scrollMeter").css("top", colorValuePercent(color.gValue, "G"));
                                        scope.selectedColor.gValue = Math.floor(color.gValue);
                                    }
                                    if (scope.selectedColor.bValue != color.bValue) {
                                        element.find(".bValuePane .scrollMeter").css("top", colorValuePercent(color.bValue, "B"));
                                        scope.selectedColor.bValue = Math.floor(color.bValue);
                                    }
                                    if (scope.selectedColor.hueValue != color.hueValue) {
                                        element.find(".hueValuePane .scrollMeter").css("top", colorValuePercent(color.hueValue, "Hue"));
                                        scope.selectedColor.hueValue = color.hueValue;
                                    }
                                    if (scope.selectedColor.saturationValue != color.saturationValue) {
                                        element.find(".saturationValuePane .scrollMeter").css("top", colorValuePercent(color.saturationValue, "Saturation"));
                                        scope.selectedColor.saturationValue = color.saturationValue;
                                    }
                                    if (scope.selectedColor.lightValue != color.lightValue) {
                                        element.find(".lightValuePane .scrollMeter").css("top", colorValuePercent(color.lightValue, "Light"));
                                        scope.selectedColor.lightValue = color.lightValue;
                                    }

                                    scope.pickColor(color);
                                }

                                function canInsertColorStop(index) {
                                    if (index < scope.colorStopList.length) {
                                        if (index + 1 < scope.colorStopList.length) {
                                            return scope.colorStopList[index].percent + 1 < scope.colorStopList[index + 1].percent;
                                        } else {
                                            return scope.colorStopList[index].percent < 100;
                                        }
                                    }

                                    return false;
                                }

                                scope.$watch("selectedColor.rValue", function () {
                                    scope.selectedColor.color = uiUtilService.rgbToHex(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue)
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "G");
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "B");
                                });
                                scope.$watch("selectedColor.gValue", function () {
                                    scope.selectedColor.color = uiUtilService.rgbToHex(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue)
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "R");
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "B");
                                });
                                scope.$watch("selectedColor.bValue", function () {
                                    scope.selectedColor.color = uiUtilService.rgbToHex(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue)
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "R");
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "G");
                                });
                                scope.$watch("selectedColor.hueValue", function () {
                                    scope.selectedColor.color = uiUtilService.hslToHex(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue)
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Saturation");
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Light");
                                });
                                scope.$watch("selectedColor.saturationValue", function () {
                                    scope.selectedColor.color = uiUtilService.hslToHex(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue)
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Hue");
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Light");
                                });
                                scope.$watch("selectedColor.lightValue", function () {
                                    scope.selectedColor.color = uiUtilService.hslToHex(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue)
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Hue");
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Saturation");
                                });
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

                                        $timeout(function () {
                                            scope.gradientColor = {angle: scope.angle, colorStopList: scope.colorStopList};
                                        })
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
                                            scope.angle = 0;
                                            var color = scope.colors && scope.colors.length && scope.colors[0] || "#000000";
                                            scope.colorStopList = [
                                                {percent: 0, color: color, minPercent: 0, maxPercent: 49, backgroundColor: uiUtilService.contrastColor(color) === "#ffffff" ? uiUtilService.lighterColor(color, 0.5) : uiUtilService.lighterColor(color, -0.5)}
                                            ];
                                            scope.gradientColor = {angle: scope.angle, colorStopList: scope.colorStopList};
                                        } else {
                                            scope.gradientColor = null;
                                        }
                                    });
                                }

                                scope.incrementAngle = function (event, step) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    step = step || options.angleStep;
                                    var angle = scope.angle;
                                    angle += step;
                                    angle %= 360;
                                    scope.angle = angle;

                                    scope.gradientColor = {angle: scope.angle, colorStopList: scope.colorStopList};
                                }

                                scope.decrementAngle = function (event, step) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    step = step || options.angleStep;
                                    var angle = scope.angle;
                                    angle -= step;
                                    angle += 360;
                                    angle %= 360;
                                    scope.angle = angle;

                                    scope.gradientColor = {angle: scope.angle, colorStopList: scope.colorStopList};
                                }

                                scope.incrementColor = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $u = $(event.target).siblings(".scrollBar").find(".scrollMeter"),
                                        range = parseInt($u.attr("color-range")),
                                        step = range / 20,
                                        valueName = $u.attr("color-value-name");

                                    if (range && valueName) {
                                        var color = angular.extend({}, scope.selectedColor),
                                            value = scope.selectedColor[valueName] + step;
                                        if (value > range)
                                            value = range;
                                        color[valueName] = value;
                                        color.color = null;
                                        setSelectedColor(color);
                                    }
                                }

                                scope.decrementColor = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $u = $(event.target).siblings(".scrollBar").find(".scrollMeter"),
                                        range = parseInt($u.attr("color-range")),
                                        step = range / 20,
                                        valueName = $u.attr("color-value-name");

                                    if (range && valueName) {
                                        var color = angular.extend({}, scope.selectedColor),
                                            value = scope.selectedColor[valueName] - step;
                                        if (value < 0)
                                            value = 0;
                                        color[valueName] = value;
                                        color.color = null;
                                        setSelectedColor(color);
                                    }
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

                                    var $palette = element.find(".editorPalette");
                                    if (scope.hasClass(".editorPalette", "show")) {
                                        scope.setStopColor(scope.selectedColorStopIndex, scope.selectedColor.color);

                                        scope.selectTab($palette, $palette.find("div[tab-sel^='tab-head']:nth-child(1)")).then(
                                            function () {
                                                return scope.toggleDisplay(".editorPalette");
                                            }
                                        );
                                    } else {
                                        scope.toggleDisplay(".editorPalette").then(
                                            function () {
                                                scope.selectTab($palette, $palette.find("div[tab-sel^='tab-head']:nth-child(1)"));
                                            }
                                        );
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
                                        var colorStop = angular.extend({}, scope.colorStopList[index]);

                                        colorStop.minPercent = scope.colorStopList[index].percent + 1;
                                        if (index + 1 < scope.colorStopList.length) {
                                            colorStop.percent = colorStop.minPercent;
                                            colorStop.maxPercent = scope.colorStopList[index + 1].percent - 1;
                                            scope.colorStopList[index + 1].minPercent = colorStop.percent + 1;
                                        } else {
                                            colorStop.percent = colorStop.maxPercent = 100;
                                        }
                                        scope.colorStopList[index].maxPercent = colorStop.percent - 1;

                                        scope.colorStopList.splice(index + 1, 0, colorStop);
                                        scope.gradientColor = {angle: scope.angle, colorStopList: scope.colorStopList};
                                    }
                                }

                                scope.removeColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (scope.colorStopList.length > 1 && index < scope.colorStopList.length) {
                                        var colorStop = angular.extend({}, scope.colorStopList[index]),
                                            postUpdateFn = null;

                                        if (index >= 1) {
                                            if (index + 1 < scope.colorStopList.length) {
                                                scope.colorStopList[index - 1].maxPercent = scope.colorStopList[index + 1].percent - 1;
                                                scope.colorStopList[index + 1].minPercent = scope.colorStopList[index - 1].percent + 1;
                                            } else {
                                                scope.colorStopList[index - 1].maxPercent = 100;
                                                postUpdateFn = $timeout(
                                                    function () {
                                                        scope.colorStopList[scope.colorStopList.length - 1].percent = 100;
                                                    }
                                                );
                                            }
                                        } else {
                                            scope.colorStopList[index + 1].minPercent = 0;
                                            if (index + 2 < scope.colorStopList.length) {
                                                scope.colorStopList[index + 2].minPercent = 1;
                                                scope.colorStopList[index + 1].maxPercent = scope.colorStopList[index + 2].percent - 1;
                                            } else {
                                                scope.colorStopList[index + 1].maxPercent = 100;
                                            }

                                            postUpdateFn = $timeout(
                                                function () {
                                                    scope.colorStopList[0].percent = 0;
                                                }
                                            );
                                        }

                                        scope.colorStopList.splice(index, 1);

                                        if (postUpdateFn)
                                            postUpdateFn.then(function () {
                                                scope.gradientColor = {angle: scope.angle, colorStopList: scope.colorStopList};
                                            });
                                        else {
                                            scope.gradientColor = {angle: scope.angle, colorStopList: scope.colorStopList};
                                        }
                                    }
                                }

                                scope.setColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (index < scope.colorStopList.length) {
                                        var color = scope.colorStopList[index].color,
                                            rgb = uiUtilService.hexTorgb(color),
                                            hsl = uiUtilService.hexTohsl(color);

                                        setSelectedColor({color: color, rValue: rgb[0], gValue: rgb[1], bValue: rgb[2], hueValue: hsl[0], saturationValue: hsl[1], lightValue: hsl[2]});
                                        scope.selectedColorStopIndex = index;

                                        scope.togglePalette(event);
                                    }
                                }

                                scope.copyColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (index < scope.colorStopList.length) {
                                        scope.copiedColor = scope.colorStopList[index].color;
                                    }
                                }

                                scope.pasteColorStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (scope.copiedColor && index < scope.colorStopList.length) {
                                        var colorStop = scope.colorStopList[index];

                                        if (scope.copiedColor !== colorStop.color) {
                                            scope.setStopColor(index, scope.copiedColor);
                                        }
                                    }
                                }

                                scope.setStopColor = function (index, hex, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (index < scope.colorStopList.length) {
                                        var colorStop = scope.colorStopList[index];

                                        if (hex !== colorStop.color) {
                                            colorStop.color = "";

                                            $timeout(function () {
                                                colorStop.color = hex;
                                                colorStop.backgroundColor = uiUtilService.contrastColor(hex) === "#ffffff" ? uiUtilService.lighterColor(hex, 0.5) : uiUtilService.lighterColor(hex, -0.5);
                                                scope.gradientColor = {angle: scope.angle, colorStopList: scope.colorStopList};
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
                                }

                                scope.rgbLinearGradient = function (r, g, b, colorValueType) {
                                    var range = 255,
                                        stopCount = 20,
                                        step = range / stopCount,
                                        stops = [],
                                        webkitStops = [],
                                        rgb = [r, g, b],
                                        spliceIndex = 0,
                                        scrollBarSelector = "";

                                    if (colorValueType === "R") {
                                        spliceIndex = 0;
                                        scrollBarSelector = ".rValuePane .scrollBar";
                                    } else if (colorValueType === "G") {
                                        spliceIndex = 1;
                                        scrollBarSelector = ".gValuePane .scrollBar";
                                    } else if (colorValueType === "B") {
                                        spliceIndex = 2;
                                        scrollBarSelector = ".bValuePane .scrollBar";
                                    }

                                    for (var i = 0; i < stopCount; i++) {
                                        rgb.splice(spliceIndex, 1, Math.floor(i * step));
                                        var colorStop = uiUtilService.rgbToHex.apply(uiUtilService, rgb);
                                        webkitStops.push("color-stop({1}%, {0})".format(colorStop, Math.floor((i / stopCount) * 100)));
                                        stops.push("{0} {1}%".format(colorStop, Math.floor((i / stopCount) * 100)));
                                    }

                                    var $scrollBar = element.find(scrollBarSelector);
                                    $scrollBar.css("background", "-webkit-gradient(linear, 50% 0%, 50% 100%, {0})".format(webkitStops.join(",")));
                                    uiUtilService.prefixedStyleValue("{0}linear-gradient(top, {1})", stops.join(",")).forEach(function (gradientStyleValue) {
                                        $scrollBar.css("background", gradientStyleValue);
                                    });
                                }

                                scope.hslLinearGradient = function (h, s, l, colorValueType) {
                                    var range = 0,
                                        step,
                                        stopCount = 20,
                                        stops = [],
                                        webkitStops = [],
                                        hsl = [h, s, l],
                                        spliceIndex = 0,
                                        scrollBarSelector = "";

                                    if (colorValueType === "Hue") {
                                        range = 1;
                                        spliceIndex = 0;
                                        scrollBarSelector = ".hueValuePane .scrollBar";
                                    } else if (colorValueType === "Saturation") {
                                        range = 1;
                                        spliceIndex = 1;
                                        scrollBarSelector = ".saturationValuePane .scrollBar";
                                    } else if (colorValueType === "Light") {
                                        range = 1;
                                        spliceIndex = 2;
                                        scrollBarSelector = ".lightValuePane .scrollBar";
                                    }
                                    step = range / stopCount;

                                    for (var i = 0; i < stopCount; i++) {
                                        hsl.splice(spliceIndex, 1, Math.floor(i * step * 100) / 100);
                                        var colorStop = uiUtilService.hslToHex.apply(uiUtilService, hsl);
                                        webkitStops.push("color-stop({1}%, {0})".format(colorStop, Math.floor((i / stopCount) * 100)));
                                        stops.push("{0} {1}%".format(colorStop, Math.floor((i / stopCount) * 100)));
                                    }

                                    var $scrollBar = element.find(scrollBarSelector);
                                    $scrollBar.css("background", "-webkit-gradient(linear, 50% 0%, 50% 100%, {0})".format(webkitStops.join(",")));
                                    uiUtilService.prefixedStyleValue("{0}linear-gradient(top, {1})", stops.join(",")).forEach(function (gradientStyleValue) {
                                        $scrollBar.css("background", gradientStyleValue);
                                    });
                                }

                                scope.pickColor = function (colorObj, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if ((!colorObj.rValue && colorObj.rValue != 0) ||
                                        (!colorObj.gValue && colorObj.gValue != 0) ||
                                        (!colorObj.bValue && colorObj.bValue != 0)) {
                                        var rgb = uiUtilService.hexTorgb(colorObj.color);
                                        colorObj.rValue = rgb[0];
                                        colorObj.gValue = rgb[1];
                                        colorObj.bValue = rgb[2];
                                    }

                                    if ((!colorObj.hueValue && colorObj.hueValue != 0) ||
                                        (!colorObj.saturationValue && colorObj.saturationValue != 0) ||
                                        (!colorObj.lightValue && colorObj.lightValue != 0)) {
                                        var hsl = uiUtilService.hexTohsl(colorObj.color);
                                        colorObj.hueValue = hsl[0];
                                        colorObj.saturationValue = hsl[1];
                                        colorObj.lightValue = hsl[2];
                                    }

                                    scope.selectedColor = colorObj;

                                    element.find(".colorSticker").css("background-color", colorObj.color).attr("picked-color", colorObj.color);

                                    return true;
                                }

                                scope.copyPickedColor = function (fromElement, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $from = fromElement.jquery && fromElement || $(fromElement),
                                        $to = $(event.srcEvent.toElement),
                                        pickedColor = $from.attr("picked-color");

                                    if ($from.hasClass("colorSticker") && $to.hasClass("pickedColorPane")) {
                                        if (pickedColor) {
                                            $to.css("background-color", pickedColor).attr("picked-color", pickedColor);
                                        }
                                    } else if ($from.hasClass("pickedColorPane") && $to.hasClass("colorSticker")) {
                                        if (pickedColor) {
                                            scope.pickColor({color: pickedColor});
                                        }
                                    }

                                    return true;
                                }

                                scope.observeColorValueScrollMeter = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $u = $(event.currentTarget),
                                        top = parseFloat(($u.css("top") || "0px").replace(/px/g, "")),
                                        height = parseFloat(($u.css("height") || "0px").replace(/px/g, "")),
                                        range = parseInt($u.attr("color-range")),
                                        valueName = $u.attr("color-value-name"),
                                        distance = $u.parent().height();

                                    if (range && valueName) {
                                        var value = range * (top + height / 2) / distance,
                                            color = {};

                                        if (valueName === "rValue" || valueName === "gValue" || valueName === "bValue") {
                                            value = Math.floor(value);
                                            color.rValue = scope.selectedColor.rValue;
                                            color.gValue = scope.selectedColor.gValue;
                                            color.bValue = scope.selectedColor.bValue;
                                            color[valueName] = value;
                                            color.color = uiUtilService.rgbToHex(color.rValue, color.gValue, color.bValue);
                                        } else if (valueName === "hueValue" || valueName === "saturationValue" || valueName === "lightValue") {
                                            value = Math.floor(value * 100) / 100;
                                            color.hueValue = scope.selectedColor.hueValue;
                                            color.saturationValue = scope.selectedColor.saturationValue;
                                            color.lightValue = scope.selectedColor.lightValue;
                                            color[valueName] = value;
                                            color.color = uiUtilService.hslToHex(color.hueValue, color.saturationValue, color.lightValue);
                                        }

                                        scope.pickColor(color);
                                        scope.$apply();
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