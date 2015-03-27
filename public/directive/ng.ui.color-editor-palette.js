define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$http", "$timeout", "$q", "$exceptionHandler", "angularConstants", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiColorEditorPalette", _.union(inject, [function ($parse, $http, $timeout, $q, $exceptionHandler, angularConstants, angularEventTypes, uiUtilService) {
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
                    scope: {
                        selectedColor: "=",
                        onColorSelect: '&'
                    },
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

                                        scope.selectedColorObj.color && scope.colors && scope.colors.every(function (c) {
                                            return c != scope.selectedColorObj.color;
                                        }) && scope.colors.splice(0, 0, scope.selectedColorObj.color);
                                    });
                                } else {
                                    scope.colors = scope.options.colors || [];
                                }

                                scope.util = uiUtilService;
                                scope.Math = Math;
                                scope.selectedColorObj = scope.selectedColorObj || {alpha: 1};
                            },
                            post: function (scope, element, attrs) {
                                function adjustScrollMeterPosition(color) {
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

                                    element.find(".rValuePane .scrollMeter").css("top", colorValuePercent(color.rValue, "R"));
                                    element.find(".gValuePane .scrollMeter").css("top", colorValuePercent(color.gValue, "G"));
                                    element.find(".bValuePane .scrollMeter").css("top", colorValuePercent(color.bValue, "B"));

                                    element.find(".hueValuePane .scrollMeter").css("top", colorValuePercent(color.hueValue, "Hue"));
                                    element.find(".saturationValuePane .scrollMeter").css("top", colorValuePercent(color.saturationValue, "Saturation"));
                                    element.find(".lightValuePane .scrollMeter").css("top", colorValuePercent(color.lightValue, "Light"));
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

                                scope.updateSelectedColor = function (to) {
                                    function changeSelectedColor(value) {
                                        var defer = $q.defer();

                                        $timeout(function () {
                                            //FIXME value.color conflicts with its rValue/gValue/bValue, we recalculate color hex value as workaround here.
                                            if (value.rValue && value.gValue && value.bValue) {
                                                value.color = uiUtilService.rgbToHex(value.rValue, value.gValue, value.bValue);
                                            }
                                            value.alphaColor = uiUtilService.rgba(value);
                                            scope.selectedColor = _.pick(value, ["color", "alpha", "alphaColor"]);
                                            scope.onColorSelect && $timeout(function () {
                                                scope.onColorSelect();
                                            });
                                            defer.resolve();
                                        });

                                        return defer.promise;
                                    }

                                    changeSelectedColor.onceId = "color-editor-palette.changeSelectedColor";

                                    uiUtilService.latestOnce(changeSelectedColor, null, angularConstants.actionDelay)(to);
                                }

                                scope.watchSelectedColor = function (state) {
                                    if (state) {
                                        if (!scope.deregisterWatch) {
                                            scope.deregisterWatch = scope.$watch("selectedColor", function (to) {
                                                if (to != undefined) {
                                                    if (to) {
                                                        scope.colors && scope.colors.every(function (c) {
                                                            return c != to.color;
                                                        }) && scope.colors.splice(0, 0, to.color);

                                                        (scope.selectedColorObj.color !== to.color || scope.selectedColorObj.alpha !== to.alpha) && scope.pickColor(to);
                                                    } else {
                                                        if (scope.colors && scope.colors.length) {
                                                            scope.pickColor({color: scope.colors[0], alpha: 1});
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

                                scope.incrementColor = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $u = $(event.target).siblings(".scrollBar").find(".scrollMeter"),
                                        range = parseInt($u.attr("color-range")),
                                        step = parseInt($u.attr("color-value-step")) || (range / 20),
                                        valueName = $u.attr("color-value-name");

                                    if (range && valueName) {
                                        var color = angular.extend({}, scope.selectedColorObj),
                                            value = scope.selectedColorObj[valueName] + step;
                                        if (value > range)
                                            value = range;
                                        color[valueName] = value;
                                        color.color = null;

                                        if (valueName === "rValue" || valueName === "gValue" || valueName === "bValue") {
                                            delete color.hueValue, delete color.saturationValue, delete color.lightValue;
                                        }

                                        if (valueName === "hueValue" || valueName === "saturationValue" || valueName === "lightValue") {
                                            delete color.rValue, delete color.gValue, delete color.bValue;
                                        }

                                        scope.pickColor(color);
                                    }
                                }

                                scope.decrementColor = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $u = $(event.target).siblings(".scrollBar").find(".scrollMeter"),
                                        range = parseInt($u.attr("color-range")),
                                        step = parseInt($u.attr("color-value-step")) || (range / 20),
                                        valueName = $u.attr("color-value-name");

                                    if (range && valueName) {
                                        var color = angular.extend({}, scope.selectedColorObj),
                                            value = scope.selectedColorObj[valueName] - step;
                                        if (value < 0)
                                            value = 0;
                                        color[valueName] = value;
                                        color.color = null;

                                        if (valueName === "rValue" || valueName === "gValue" || valueName === "bValue") {
                                            delete color.hueValue, delete color.saturationValue, delete color.lightValue;
                                        }

                                        if (valueName === "hueValue" || valueName === "saturationValue" || valueName === "lightValue") {
                                            delete color.rValue, delete color.gValue, delete color.bValue;
                                        }

                                        scope.pickColor(color);
                                    }
                                }

                                scope.pickColor = function (colorObj, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (colorObj.color == null) {
                                        if (colorObj.hueValue != null) {
                                            colorObj.hueValue = Math.round(colorObj.hueValue * 100) / 100;
                                            colorObj.hueDegreeValue = Math.floor(colorObj.hueValue * 359);
                                        }
                                        if (colorObj.saturationValue != null) {
                                            colorObj.saturationValue = Math.round(colorObj.saturationValue * 100) / 100;
                                        }
                                        if (colorObj.lightValue != null) {
                                            colorObj.lightValue = Math.round(colorObj.lightValue * 100) / 100;
                                        }

                                        if (colorObj.rValue != null && colorObj.gValue != null && colorObj.bValue != null) {
                                            colorObj.color = uiUtilService.rgbToHex(colorObj.rValue, colorObj.gValue, colorObj.bValue);
                                        } else if (colorObj.hueValue != null && colorObj.saturationValue != null && colorObj.lightValue != null) {
                                            colorObj.color = uiUtilService.hslToHex(colorObj.hueValue, colorObj.saturationValue, colorObj.lightValue);
                                        }
                                    }

                                    if (colorObj.color) {
                                        if (colorObj.rValue == null || colorObj.gValue == null || colorObj.bValue == null) {
                                            var rgb = uiUtilService.hexTorgb(colorObj.color);
                                            colorObj.rValue = rgb[0];
                                            colorObj.gValue = rgb[1];
                                            colorObj.bValue = rgb[2];
                                        }

                                        if ((colorObj.hueValue == null || colorObj.saturationValue == null) || colorObj.lightValue == null) {
                                            var hsl = uiUtilService.hexTohsl(colorObj.color);
                                            colorObj.hueValue = Math.round(hsl[0] * 100) / 100;
                                            colorObj.hueDegreeValue = Math.floor(colorObj.hueValue * 359);
                                            colorObj.saturationValue = Math.round(hsl[1] * 100) / 100;
                                            colorObj.lightValue = Math.round(hsl[2] * 100) / 100;
                                        }
                                    }

                                    if (colorObj.alpha == null)
                                        colorObj.alpha = scope.selectedColorObj.alpha;
                                    if (colorObj.alpha == 1)
                                        delete colorObj.alphaColor;
                                    else
                                        colorObj.alphaColor = uiUtilService.rgba(colorObj, colorObj.alpha);

                                    adjustScrollMeterPosition(colorObj);
                                    scope.selectedColorObj = colorObj;
                                    scope.updateSelectedColor(colorObj);

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

                                function colorObjHandler() {
                                    scope.pickColor(scope.selectedColorObj);

                                    return uiUtilService.getResolveDefer();
                                }

                                scope.onColorInputChange = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $el = $(event.target),
                                        value = parseFloat($el.val()),
                                        valueName = $el.attr("color-value-name"),
                                        max = parseFloat($el.attr("max")),
                                        min = parseFloat($el.attr("min"));

                                    if (value > max) {
                                        scope.selectedColorObj[valueName] = max;
                                    } else if (value < min) {
                                        scope.selectedColorObj[valueName] = min;
                                    }

                                    if (valueName === "rValue" || valueName === "gValue" || valueName === "bValue") {
                                        delete scope.selectedColorObj.hueValue, delete scope.selectedColorObj.hueDegreeValue, delete scope.selectedColorObj.saturationValue, delete scope.selectedColorObj.lightValue;
                                    }

                                    if (valueName === "hueValue" || valueName === "saturationValue" || valueName === "lightValue") {
                                        delete scope.selectedColorObj.rValue, delete scope.selectedColorObj.gValue, delete scope.selectedColorObj.bValue;
                                    }
                                    scope.selectedColorObj.color = null;

                                    uiUtilService.latestOnce(colorObjHandler, null, angularConstants.actionDelay, "color-editor-palette.colorObjHandler")();
                                }

                                scope.incrementAlpha = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.selectedColorObj.alpha += 0.1;
                                    scope.selectedColorObj.alpha = Math.round(scope.selectedColorObj.alpha * 10) / 10;
                                    if (scope.selectedColorObj.alpha > 1)
                                        scope.selectedColorObj.alpha = 1;

                                    uiUtilService.latestOnce(colorObjHandler, null, angularConstants.actionDelay, "color-editor-palette.colorObjHandler")();
                                }

                                scope.decrementAlpha = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.selectedColorObj.alpha -= 0.1;
                                    scope.selectedColorObj.alpha = Math.round(scope.selectedColorObj.alpha * 10) / 10;
                                    if (scope.selectedColorObj.alpha < 0)
                                        scope.selectedColorObj.alpha = 0;

                                    uiUtilService.latestOnce(colorObjHandler, null, angularConstants.actionDelay, "color-editor-palette.colorObjHandler")();
                                }

                                scope.observeColorValueScrollMeter = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();


                                    var $u = $(event.currentTarget),
                                        top = uiUtilService.calculateTop($u),
                                        height = uiUtilService.calculateHeight($u),
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
                                            color.hueDegreeValue = Math.floor(color.hueValue * 359);
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

                                                return scope.toggleDisplay(element);
                                            }
                                        );
                                    } else {
                                        var defer = $q.defer();

                                        $timeout(function () {
                                            defer.resolve();
                                        });

                                        return defer.promise;
                                    }
                                }

                                scope.openPalette = function () {
                                    if (!element.hasClass("show")) {
                                        return scope.toggleDisplay(element).then(
                                            function () {
                                                scope.watchSelectedColor(true);

                                                return scope.showInitialTab();
                                            }
                                        );
                                    } else {
                                        var defer = $q.defer();

                                        $timeout(function () {
                                            defer.resolve();
                                        });

                                        return defer.promise;
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