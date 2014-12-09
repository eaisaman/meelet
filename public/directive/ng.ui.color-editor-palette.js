define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$http", "$timeout", "$q", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiColorEditorPalette", _.union(inject, [function ($parse, $http, $timeout, $q, angularEventTypes, uiUtilService) {
                'use strict';

                var defaults = {
                        colorJson: "",
                        colors: [
                            "#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e",
                            "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50",
                            "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6",
                            "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d"
                        ],
                        enableClose: false
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {selectedColor: "="},
                    replace: false,
                    templateUrl: "include/_color-editor-palette.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                scope.options = _.extend(_.clone(options), $parse(attrs['uiColorEditorPaletteOpts'])(scope, {}));

                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                if (scope.options.colorJson) {
                                    $http.get(options.colorJson).then(function (result) {
                                        scope.colors = result.data;

                                        scope.selectedColorObj && scope.colors && scope.colors.every(function (c) {
                                            return c != scope.selectedColorObj.color;
                                        }) && scope.colors.splice(0, 0, scope.selectedColorObj.color);
                                    });
                                } else {
                                    scope.colors = scope.options.colors || [];
                                }

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

                                    if (scope.selectedColorObj.rValue != color.rValue || scope.selectedColorObj.gValue != color.gValue || scope.selectedColorObj.bValue != color.bValue) {
                                        color.color = uiUtilService.rgbToHex(color.rValue, color.gValue, color.bValue);
                                    } else if (scope.selectedColorObj.hueValue != color.hueValue || scope.selectedColorObj.saturationValue != color.saturationValue || scope.selectedColorObj.lightValue != color.lightValue) {
                                        color.color = uiUtilService.hslToHex(color.hueValue, color.saturationValue, color.lightValue);
                                    }
                                    if (scope.selectedColorObj.rValue != color.rValue) {
                                        element.find(".rValuePane .scrollMeter").css("top", colorValuePercent(color.rValue, "R"));
                                        scope.selectedColorObj.rValue = Math.floor(color.rValue);
                                    }
                                    if (scope.selectedColorObj.gValue != color.gValue) {
                                        element.find(".gValuePane .scrollMeter").css("top", colorValuePercent(color.gValue, "G"));
                                        scope.selectedColorObj.gValue = Math.floor(color.gValue);
                                    }
                                    if (scope.selectedColorObj.bValue != color.bValue) {
                                        element.find(".bValuePane .scrollMeter").css("top", colorValuePercent(color.bValue, "B"));
                                        scope.selectedColorObj.bValue = Math.floor(color.bValue);
                                    }
                                    if (scope.selectedColorObj.hueValue != color.hueValue) {
                                        element.find(".hueValuePane .scrollMeter").css("top", colorValuePercent(color.hueValue, "Hue"));
                                        scope.selectedColorObj.hueValue = color.hueValue;
                                    }
                                    if (scope.selectedColorObj.saturationValue != color.saturationValue) {
                                        element.find(".saturationValuePane .scrollMeter").css("top", colorValuePercent(color.saturationValue, "Saturation"));
                                        scope.selectedColorObj.saturationValue = color.saturationValue;
                                    }
                                    if (scope.selectedColorObj.lightValue != color.lightValue) {
                                        element.find(".lightValuePane .scrollMeter").css("top", colorValuePercent(color.lightValue, "Light"));
                                        scope.selectedColorObj.lightValue = color.lightValue;
                                    }

                                    scope.pickColor(color);
                                }

                                function rgbLinearGradient(r, g, b, colorValueType) {
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

                                function hslLinearGradient(h, s, l, colorValueType) {
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

                                scope.$watch("selectedColorObj.rValue", function (to) {
                                    if (to != null) {
                                        scope.selectedColorObj.color = uiUtilService.rgbToHex(scope.selectedColorObj.rValue, scope.selectedColorObj.gValue, scope.selectedColorObj.bValue)
                                        rgbLinearGradient(scope.selectedColorObj.rValue, scope.selectedColorObj.gValue, scope.selectedColorObj.bValue, "G");
                                        rgbLinearGradient(scope.selectedColorObj.rValue, scope.selectedColorObj.gValue, scope.selectedColorObj.bValue, "B");
                                    }
                                });
                                scope.$watch("selectedColorObj.gValue", function (to) {
                                    if (to != null) {
                                        scope.selectedColorObj.color = uiUtilService.rgbToHex(scope.selectedColorObj.rValue, scope.selectedColorObj.gValue, scope.selectedColorObj.bValue)
                                        rgbLinearGradient(scope.selectedColorObj.rValue, scope.selectedColorObj.gValue, scope.selectedColorObj.bValue, "R");
                                        rgbLinearGradient(scope.selectedColorObj.rValue, scope.selectedColorObj.gValue, scope.selectedColorObj.bValue, "B");
                                    }
                                });
                                scope.$watch("selectedColorObj.bValue", function (to) {
                                    if (to != null) {
                                        scope.selectedColorObj.color = uiUtilService.rgbToHex(scope.selectedColorObj.rValue, scope.selectedColorObj.gValue, scope.selectedColorObj.bValue)
                                        rgbLinearGradient(scope.selectedColorObj.rValue, scope.selectedColorObj.gValue, scope.selectedColorObj.bValue, "R");
                                        rgbLinearGradient(scope.selectedColorObj.rValue, scope.selectedColorObj.gValue, scope.selectedColorObj.bValue, "G");
                                    }
                                });
                                scope.$watch("selectedColorObj.hueValue", function (to) {
                                    if (to != null) {
                                        scope.selectedColorObj.color = uiUtilService.hslToHex(scope.selectedColorObj.hueValue, scope.selectedColorObj.saturationValue, scope.selectedColorObj.lightValue)
                                        hslLinearGradient(scope.selectedColorObj.hueValue, scope.selectedColorObj.saturationValue, scope.selectedColorObj.lightValue, "Saturation");
                                        hslLinearGradient(scope.selectedColorObj.hueValue, scope.selectedColorObj.saturationValue, scope.selectedColorObj.lightValue, "Light");
                                    }
                                });
                                scope.$watch("selectedColorObj.saturationValue", function (to) {
                                    if (to != null) {
                                        scope.selectedColorObj.color = uiUtilService.hslToHex(scope.selectedColorObj.hueValue, scope.selectedColorObj.saturationValue, scope.selectedColorObj.lightValue)
                                        hslLinearGradient(scope.selectedColorObj.hueValue, scope.selectedColorObj.saturationValue, scope.selectedColorObj.lightValue, "Hue");
                                        hslLinearGradient(scope.selectedColorObj.hueValue, scope.selectedColorObj.saturationValue, scope.selectedColorObj.lightValue, "Light");
                                    }
                                });
                                scope.$watch("selectedColorObj.lightValue", function (to) {
                                    if (to != null) {
                                        scope.selectedColorObj.color = uiUtilService.hslToHex(scope.selectedColorObj.hueValue, scope.selectedColorObj.saturationValue, scope.selectedColorObj.lightValue)
                                        hslLinearGradient(scope.selectedColorObj.hueValue, scope.selectedColorObj.saturationValue, scope.selectedColorObj.lightValue, "Hue");
                                        hslLinearGradient(scope.selectedColorObj.hueValue, scope.selectedColorObj.saturationValue, scope.selectedColorObj.lightValue, "Saturation");
                                    }
                                });

                                scope.watchSelectedColorObj = function (state) {
                                    if (state) {
                                        if (!scope.deregisterColorObjWatch) {
                                            scope.deregisterColorObjWatch = scope.$watch("selectedColorObj.color", function (to) {
                                                function changeSelectedColor(value) {
                                                    var defer = $q.defer();

                                                    $timeout(function () {
                                                        scope.selectedColor = value;
                                                        defer.resolve();
                                                    });

                                                    return defer.promise;
                                                }

                                                changeSelectedColor.onceId = "color-editor-palette.changeSelectedColor";

                                                if (to && scope.selectedColor !== to)
                                                    uiUtilService.latestOnce(changeSelectedColor, null, 500)(to);
                                            });
                                        }
                                    } else {
                                        scope.deregisterColorObjWatch && scope.deregisterColorObjWatch();
                                        scope.deregisterColorObjWatch = null;
                                    }
                                }

                                scope.watchSelectedColor = function (state) {
                                    if (state) {
                                        if (!scope.deregisterWatch) {
                                            scope.deregisterWatch = scope.$watch("selectedColor", function (to) {
                                                if (to != undefined) {
                                                    if (to) {
                                                        scope.colors && scope.colors.every(function (c) {
                                                            return c != to;
                                                        }) && scope.colors.splice(0, 0, to);

                                                        (!scope.selectedColorObj || scope.selectedColorObj.color !== to) && scope.pickColor({color: to});
                                                    } else {
                                                        if (scope.colors && scope.colors.length) {
                                                            to = scope.colors[0];
                                                            scope.pickColor({color: to});
                                                        }
                                                    }

                                                    scope.deregisterWatch();
                                                    scope.deregisterWatch = null;
                                                }
                                            });
                                        }
                                    } else {
                                        scope.deregisterWatch && scope.deregisterWatch();
                                        scope.deregisterWatch = null;
                                    }
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

                                scope.incrementColor = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $u = $(event.target).siblings(".scrollBar").find(".scrollMeter"),
                                        range = parseInt($u.attr("color-range")),
                                        step = range / 20,
                                        valueName = $u.attr("color-value-name");

                                    if (range && valueName) {
                                        var color = angular.extend({}, scope.selectedColorObj),
                                            value = scope.selectedColorObj[valueName] + step;
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
                                        var color = angular.extend({}, scope.selectedColorObj),
                                            value = scope.selectedColorObj[valueName] - step;
                                        if (value < 0)
                                            value = 0;
                                        color[valueName] = value;
                                        color.color = null;
                                        setSelectedColor(color);
                                    }
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

                                    scope.selectedColorObj = colorObj;

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
                                            color.rValue = scope.selectedColorObj.rValue;
                                            color.gValue = scope.selectedColorObj.gValue;
                                            color.bValue = scope.selectedColorObj.bValue;
                                            color[valueName] = value;
                                            color.color = uiUtilService.rgbToHex(color.rValue, color.gValue, color.bValue);
                                        } else if (valueName === "hueValue" || valueName === "saturationValue" || valueName === "lightValue") {
                                            value = Math.floor(value * 100) / 100;
                                            color.hueValue = scope.selectedColorObj.hueValue;
                                            color.saturationValue = scope.selectedColorObj.saturationValue;
                                            color.lightValue = scope.selectedColorObj.lightValue;
                                            color[valueName] = value;
                                            color.color = uiUtilService.hslToHex(color.hueValue, color.saturationValue, color.lightValue);
                                        }

                                        scope.pickColor(color);
                                        scope.$apply();
                                    }
                                }

                                scope.closePalette = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (element.hasClass("show")) {
                                        return scope.showInitialTab().then(
                                            function () {
                                                scope.watchSelectedColor(false);
                                                scope.watchSelectedColorObj(false);

                                                return scope.toggleDisplay(element);
                                            }
                                        );
                                    } else {
                                        return angular.noop;
                                    }
                                }

                                scope.openPalette = function () {
                                    if (!element.hasClass("show")) {
                                        return scope.toggleDisplay(element).then(
                                            function () {
                                                scope.watchSelectedColor(true);
                                                scope.watchSelectedColorObj(true);

                                                return scope.showInitialTab();
                                            }
                                        );
                                    } else {
                                        return angular.noop;
                                    }
                                }

                                scope.showInitialTab = function () {
                                    return scope.selectTab(element, element.find("div[tab-sel^='tab-head']:nth-child(1)"));
                                }
                            }
                        }
                    }
                }
            }]));
        }
    }
);