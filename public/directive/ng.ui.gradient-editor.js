define(
    ["jquery", "jquery-ui"],
    function () {
        return function (appModule, util, common, opts) {
            appModule.directive("uiGradientEditor", ["$http", "$timeout", function ($http, $timeout) {
                'use strict';

                var defaults = {
                        angleStep: 5,
                        colorJson: "",
                        colors: ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e",
                            "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50",
                            "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6",
                            "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d"
                        ]
                    },
                    options = angular.extend(defaults, opts);

                return {
                    restrict: "A",
                    scope: {
                        gradientColor: "="
                    },
                    replace: false,
                    templateUrl: "include/_gradient_editor.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                for (var name in common) {
                                    var fn = common[name];
                                    if (typeof fn === "function") {
                                        var m = name.match(/(\w+)Service$/);
                                        if (m && m.length == 2) {
                                            var argNames = util.formalParameterList(fn),
                                                args = []

                                            argNames.forEach(function (argName) {
                                                if (argName === "element") {
                                                    args.push(element);
                                                }
                                                if (argName === "scope") {
                                                    args.push(scope);
                                                }
                                                if (argName === "$timeout") {
                                                    args.push($timeout);
                                                }
                                            });
                                            scope[m[1]] = fn.apply(null, args);
                                        } else {
                                            scope[name] = fn;
                                        }
                                    }
                                }

                                if (options.colorJson) {
                                    $http.get(options.colorJson).then(function (result) {
                                        scope.colors = result.data;
                                    });
                                } else {
                                    scope.colors = options.colors || [];
                                }

                                scope.colorStopList = [
                                    {percent: 0, color: "#1abc9c", backgroundColor: util.contrastColor("#1abc9c") === "#fff" ? util.lighterColor("#1abc9c", 0.5) : util.lighterColor("#1abc9c", -0.5)},
                                    {percent: 50, color: "#2ecc71", backgroundColor: util.contrastColor("#2ecc71") === "#fff" ? util.lighterColor("#2ecc71", 0.5) : util.lighterColor("#2ecc71", -0.5)},
                                    {percent: 100, color: "#3498db", backgroundColor: util.contrastColor("#3498db") === "#fff" ? util.lighterColor("#3498db", 0.5) : util.lighterColor("#3498db", -0.5)}
                                ];
                                scope.angle = 0;
                                scope.selectedColor = {color: "#0", rValue: 0, gValue: 0, bValue: 0, hueValue: 0, saturationValue: 0, lightValue: 0};
                                scope.Math = Math;
                                scope.jQuery = jQuery;
                                scope.classie = classie;
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
                                        color.color = util.rgbToHex(color.rValue, color.gValue, color.bValue);
                                    } else if (scope.selectedColor.hueValue != color.hueValue || scope.selectedColor.saturationValue != color.saturationValue || scope.selectedColor.lightValue != color.lightValue) {
                                        color.color = util.hslToHex(color.hueValue, color.saturationValue, color.lightValue);
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

                                scope.$watch("selectedColor.rValue", function () {
                                    scope.selectedColor.color = util.rgbToHex(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue)
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "G");
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "B");
                                });
                                scope.$watch("selectedColor.gValue", function () {
                                    scope.selectedColor.color = util.rgbToHex(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue)
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "R");
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "B");
                                });
                                scope.$watch("selectedColor.bValue", function () {
                                    scope.selectedColor.color = util.rgbToHex(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue)
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "R");
                                    scope.rgbLinearGradient(scope.selectedColor.rValue, scope.selectedColor.gValue, scope.selectedColor.bValue, "G");
                                });
                                scope.$watch("selectedColor.hueValue", function () {
                                    scope.selectedColor.color = util.hslToHex(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue)
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Saturation");
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Light");
                                });
                                scope.$watch("selectedColor.saturationValue", function () {
                                    scope.selectedColor.color = util.hslToHex(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue)
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Hue");
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Light");
                                });
                                scope.$watch("selectedColor.lightValue", function () {
                                    scope.selectedColor.color = util.hslToHex(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue)
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Hue");
                                    scope.hslLinearGradient(scope.selectedColor.hueValue, scope.selectedColor.saturationValue, scope.selectedColor.lightValue, "Saturation");
                                });

                                scope.incrementAngle = function (event, step) {
                                    event && event.stopPropagation();

                                    step = step || options.angleStep;
                                    scope.angle += step;
                                    scope.angle %= 360;
                                }

                                scope.decrementAngle = function (event, step) {
                                    event && event.stopPropagation();

                                    step = step || options.angleStep;
                                    scope.angle -= step;
                                    scope.angle += 360;
                                    scope.angle %= 360;
                                }

                                scope.incrementColor = function (event) {
                                    event && event.stopPropagation();

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
                                    event && event.stopPropagation();

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
                                    event && event.stopPropagation();

                                    element.toggleClass("expanded");
                                    element.find(".circular-menu .circle").removeClass("show");
                                    element.find(".editorPalette").removeClass("show");
                                }

                                scope.togglePalette = function (event) {
                                    //toggleDisplayService is bought from common object
                                    event && event.stopPropagation();

                                    if (scope.hasClass(".editorPalette", "show")) {
                                        scope.setStopColor(scope.selectedColorStopIndex, scope.selectedColor.color);
                                    } else {
                                        util.onAnimationEnd(element.find(".editorPalette"), function () {
                                            scope.selectTab(this, $(this).find("div[tab-sel^='tab-head']").get(0));
                                        })
                                    }

                                    scope.toggleDisplay(".editorPalette", event);
                                }

                                scope.toggleColorStopMenu = function (index, event) {
                                    //toggleDisplayService is bought from common object
                                    event && event.stopPropagation();

                                    if (!element.find('.editorColorStopList .editorPalette').hasClass('show')) {
                                        scope.toggleDisplay(".colorStop[color-order=" + index + "] .circular-menu .circle", event);
                                    }
                                }

                                scope.insertColorStop = function (index, event) {
                                    event && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (index < scope.colorStopList.length) {
                                        scope.colorStopList.splice(index + 1, 0, angular.extend({}, scope.colorStopList[index]));
                                    }
                                }

                                scope.removeColorStop = function (index, event) {
                                    event && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    index < scope.colorStopList.length && scope.colorStopList.splice(index, 1);
                                }

                                scope.setColorStop = function (index, event) {
                                    event && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (index < scope.colorStopList.length) {
                                        var color = scope.colorStopList[index].color,
                                            rgb = util.hexTorgb(color),
                                            hsl = util.hexTohsl(color);

                                        setSelectedColor({color: color, rValue: rgb[0], gValue: rgb[1], bValue: rgb[2], hueValue: hsl[0], saturationValue: hsl[1], lightValue: hsl[2]});
                                        scope.selectedColorStopIndex = index;

                                        scope.togglePalette(event);
                                    }
                                }

                                scope.copyColorStop = function (index, event) {
                                    event && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (index < scope.colorStopList.length) {
                                        scope.copiedColor = scope.colorStopList[index].color;
                                    }
                                }

                                scope.pasteColorStop = function (index, event) {
                                    event && event.stopPropagation();

                                    scope.toggleColorStopMenu(index, event);

                                    if (scope.copiedColor && index < scope.colorStopList.length) {
                                        var colorStop = scope.colorStopList[index];

                                        if (scope.copiedColor !== colorStop.color) {
                                            scope.setStopColor(index, scope.copiedColor);
                                        }
                                    }
                                }

                                scope.setStopColor = function (index, hex, event) {
                                    event && event.stopPropagation();

                                    if (index < scope.colorStopList.length) {
                                        var colorStop = scope.colorStopList[index];

                                        if (hex !== colorStop.color) {
                                            colorStop.color = "";

                                            $timeout(function () {
                                                colorStop.color = hex;
                                                colorStop.backgroundColor = util.contrastColor(hex) === "#fff" ? util.lighterColor(hex, 0.5) : util.lighterColor(hex, -0.5);
                                            }).then($timeout(function () {
                                                var $colorStop = element.find(".colorStop[color-order=" + index + "]");

                                                util.onAnimationEnd($colorStop, function () {
                                                    $colorStop.removeClass("animate");
                                                })
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
                                        var colorStop = util.rgbToHex.apply(util, rgb);
                                        webkitStops.push("color-stop({1}%, {0})".format(colorStop, Math.floor((i / stopCount) * 100)));
                                        stops.push("{0} {1}%".format(colorStop, Math.floor((i / stopCount) * 100)));
                                    }

                                    var $scrollBar = element.find(scrollBarSelector);
                                    $scrollBar.css("background", "-webkit-gradient(linear, 50% 0%, 50% 100%, {0})".format(webkitStops.join(",")));
                                    util.prefixedStyleValue("{0}linear-gradient(top, {1})", stops.join(",")).forEach(function (gradientStyleValue) {
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
                                        var colorStop = util.hslToHex.apply(util, hsl);
                                        webkitStops.push("color-stop({1}%, {0})".format(colorStop, Math.floor((i / stopCount) * 100)));
                                        stops.push("{0} {1}%".format(colorStop, Math.floor((i / stopCount) * 100)));
                                    }

                                    var $scrollBar = element.find(scrollBarSelector);
                                    $scrollBar.css("background", "-webkit-gradient(linear, 50% 0%, 50% 100%, {0})".format(webkitStops.join(",")));
                                    util.prefixedStyleValue("{0}linear-gradient(top, {1})", stops.join(",")).forEach(function (gradientStyleValue) {
                                        $scrollBar.css("background", gradientStyleValue);
                                    });
                                }

                                scope.pickColor = function (colorObj, event) {
                                    event && event.stopPropagation();

                                    if ((!colorObj.rValue && colorObj.rValue != 0) ||
                                        (!colorObj.gValue && colorObj.gValue != 0) ||
                                        (!colorObj.bValue && colorObj.bValue != 0)) {
                                        var rgb = util.hexTorgb(colorObj.color);
                                        colorObj.rValue = rgb[0];
                                        colorObj.gValue = rgb[1];
                                        colorObj.bValue = rgb[2];
                                    }

                                    if ((!colorObj.hueValue && colorObj.hueValue != 0) ||
                                        (!colorObj.saturationValue && colorObj.saturationValue != 0) ||
                                        (!colorObj.lightValue && colorObj.lightValue != 0)) {
                                        var hsl = util.hexTohsl(colorObj.color);
                                        colorObj.hueValue = hsl[0];
                                        colorObj.saturationValue = hsl[1];
                                        colorObj.lightValue = hsl[2];
                                    }

                                    scope.selectedColor = colorObj;

                                    element.find(".colorSticker").css("background-color", colorObj.color).attr("picked-color", colorObj.color);

                                    return true;
                                }

                                scope.copyPickedColor = function (fromElement, toElement, event) {
                                    event && event.stopPropagation();

                                    var from = (typeof fromElement === "string") && element.find(fromElement) || $(fromElement),
                                        to = (typeof toElement === "string") && element.find(toElement) || $(toElement),
                                        fromColor = from.attr("picked-color");

                                    if (fromColor) {
                                        to.css("background", fromColor);
                                        to.attr("picked-color", fromColor);
                                    }

                                    return true;
                                }

                                scope.switchPercentSpinner = function (event) {
                                    event && event.stopPropagation();

                                    var $percentLabel = $(event.currentTarget);

                                    if ($percentLabel.hasClass("select")) {
                                        util.onAnimationEnd($percentLabel.find(".percentContent"), function () {
                                            $percentLabel.toggleClass("select");
                                            $(this).removeClass("slideDown");
                                        })

                                        $percentLabel.find(".percentContent").addClass("slideDown");
                                    } else {
                                        util.onAnimationEnd($percentLabel.find(".percentContent"), function () {
                                            $percentLabel.toggleClass("select");
                                            $(this).removeClass("slideUp");
                                        })

                                        $percentLabel.find(".percentContent").addClass("slideUp");
                                    }
                                }

                                scope.switchColurValueInput = function (event) {
                                    event && event.stopPropagation();

                                    var $percentLabel = $(event.currentTarget);

                                    if ($percentLabel.hasClass("select")) {
                                        util.onAnimationEnd($percentLabel.find(".percentContent"), function () {
                                            $percentLabel.toggleClass("select");
                                            $(this).removeClass("slideRight");
                                        })

                                        $percentLabel.find(".percentContent").addClass("slideRight");
                                    } else {
                                        util.onAnimationEnd($percentLabel.find(".percentContent"), function () {
                                            $percentLabel.toggleClass("select");
                                            $(this).removeClass("slideLeft");
                                        })

                                        $percentLabel.find(".percentContent").addClass("slideLeft");
                                    }
                                }

                                element.find(".scrollMeter").draggable({
                                    containment: "parent",
                                    axis: "y",
                                    start: function (event, ui) {
                                    },
                                    stop: function (event, ui) {
                                    },
                                    drag: function (event, ui) {
                                        var $u = $(this),
                                            range = parseInt($u.attr("color-range")),
                                            valueName = $u.attr("color-value-name"),
                                            moveY = $u.offset().top - $u.parent().offset().top,
                                            distance = $u.parent().height();

                                        if (range && valueName) {
                                            moveY = Math.floor(moveY * 100) / 100;
                                            if (moveY) {
                                                var value = range * moveY / distance,
                                                    color = {};

                                                if (valueName === "rValue" || valueName === "gValue" || valueName === "bValue") {
                                                    value = Math.floor(value);
                                                    color.rValue = scope.selectedColor.rValue;
                                                    color.gValue = scope.selectedColor.gValue;
                                                    color.bValue = scope.selectedColor.bValue;
                                                    color[valueName] = value;
                                                    color.color = util.rgbToHex(color.rValue, color.gValue, color.bValue);
                                                } else if (valueName === "hueValue" || valueName === "saturationValue" || valueName === "lightValue") {
                                                    value = Math.floor(value * 100) / 100;
                                                    color.hueValue = scope.selectedColor.hueValue;
                                                    color.saturationValue = scope.selectedColor.saturationValue;
                                                    color.lightValue = scope.selectedColor.lightValue;
                                                    color[valueName] = value;
                                                    color.color = util.hslToHex(color.hueValue, color.saturationValue, color.lightValue);
                                                }

                                                scope.pickColor(color);
                                                scope.$apply();
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }
                }
            }]);
        }
    }
);