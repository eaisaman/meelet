define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$rootScope", "$http", "$timeout", "$q", "angularConstants", "angularEventTypes", "appService", "uiUtilService"];

            appModule.directive("uiBackgroundImage", _.union(inject, [function ($rootScope, $http, $timeout, $q, angularConstants, angularEventTypes, appService, uiUtilService) {
                'use strict';

                var boundProperties = {backgroundImage: "="},
                    defaults = {
                        deviation: 10
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_background-image.html",
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
                                            backgroundImage: function (value) {
                                                if (value && scope.hasStyle(value)) {
                                                    scope.pickedBackgroundImageUrl = scope.pickBackgroundImageValue(value);
                                                    //scope.pickedBackgroundPosition = scope.pickBackgroundPositionValue(value);
                                                    scope.pickedBackgroundRepeat = scope.pickBackgroundRepeatValue(value);
                                                    scope.enableControl();
                                                } else {
                                                    scope.disableControl();
                                                }
                                            }
                                        },
                                        {backgroundImage: "uiBackgroundImage"}
                                    )
                                );

                                scope.toggleBackgroundImageControl = function () {
                                    scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                        } else {
                                        }
                                    });
                                }

                                scope.pickBackgroundImageValue = function (styles) {
                                    return scope.pickStyle(styles, scope.pseudo)["background-image"];
                                }

                                scope.pickBackgroundPositionValue = function (styles) {
                                    return scope.pickStyle(styles, scope.pseudo)["background-position"];
                                }

                                scope.pickBackgroundRepeatValue = function (styles) {
                                    return scope.pickStyle(styles, scope.pseudo)["background-repeat"];
                                }

                                scope.pseudo = "";
                                scope.repeatList = [
                                    {name: "No Repeat", value: "no-repeat"},
                                    {name: "Repeat", value: "repeat"},
                                    {name: "Repeat X", value: "repeat-x"},
                                    {name: "Repeat Y", value: "repeat-y"}
                                ];
                                scope.pickedBackgroundPosition = {
                                    unit: "%",
                                    left: "0",
                                    top: "0"
                                };
                            },
                            post: function (scope, element, attrs) {
                                var horizontalMoveMgr, horizontalMoveHandler,
                                    verticalMoveMgr, verticalMoveHandler;

                                function registerHandlers() {
                                    function calculateWidth($e) {
                                        var m = ($e.css("width") || "").match(/([-\d\.]+)px$/),
                                            width;
                                        if (m && m.length == 2)
                                            width = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                        else
                                            width = Math.floor($e.width() * angularConstants.precision) / angularConstants.precision;

                                        return width;
                                    }

                                    function calculateHeight($e) {
                                        var m = ($e.css("height") || "").match(/([-\d\.]+)px$/),
                                            height;
                                        if (m && m.length == 2)
                                            height = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                        else
                                            height = Math.floor($e.height() * angularConstants.precision) / angularConstants.precision;

                                        return height;
                                    }

                                    horizontalMoveHandler = function (event) {
                                        var $u = $(event.target).parent(),
                                            touchX = $u.data("touchX"),
                                            maxWidth = calculateWidth($u.parent()),
                                            markerWidth = maxWidth / 2;

                                        if (event.type === "panstart") {
                                            touchX = event.srcEvent.clientX - $u.parent().offset().left;
                                            $u.data("touchX", touchX);
                                        } else if (event.type === "panmove") {
                                            if (touchX != undefined) {
                                                var moveX = event.srcEvent.clientX - ($u.parent().offset().left + touchX),
                                                    width = calculateWidth($u),
                                                    ftLeft,
                                                    left;

                                                var m = ($u.css("left") || "").match(/([-\d\.]+)px$/);
                                                if (m && m.length == 2)
                                                    ftLeft = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                else
                                                    ftLeft = Math.floor(($u.offset().left - $u.parent().offset().left) * angularConstants.precision) / angularConstants.precision;
                                                left = ftLeft + moveX;

                                                if (left >= -width / 2 && left + width / 2 <= maxWidth) {
                                                    touchX += moveX;

                                                    $u.css("left", left + "px");
                                                    $u.data("touchX", touchX);
                                                    scope.pickedBackgroundPosition.x = Math.floor((left + width / 2) / maxWidth * 100);

                                                    var right = left + width / 2, nearByHorizontalMarkerIndex = Math.round((right / markerWidth) * 10) / 10;

                                                    if (Math.abs(right - nearByHorizontalMarkerIndex * markerWidth) <= options.deviation) {
                                                        if (scope.nearByHorizontalMarkerIndex != nearByHorizontalMarkerIndex) {
                                                            scope.nearByHorizontalMarkerIndex = nearByHorizontalMarkerIndex;
                                                            scope.nearByHorizontalCordIndex = nearByHorizontalMarkerIndex;
                                                        }
                                                    } else {
                                                        if (scope.nearByHorizontalMarkerIndex != null) {
                                                            scope.nearByHorizontalMarkerIndex = null;
                                                            scope.nearByHorizontalCordIndex = null;
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            if (touchX != undefined) {
                                                if (scope.nearByHorizontalMarkerIndex != null) {
                                                    var width = calculateWidth($u),
                                                        right = Math.floor((scope.nearByHorizontalMarkerIndex * markerWidth) * angularConstants.precision) / angularConstants.precision,
                                                        left = right - width / 2;

                                                    $u.css("left", left + "px");
                                                    scope.pickedBackgroundPosition.x = Math.floor((left + width / 2) / maxWidth * 100);
                                                } else {
                                                    scope.nearByHorizontalCordIndex = null;
                                                }

                                                $u.removeData("touchX");
                                                scope.nearByHorizontalMarkerIndex = null;
                                            }
                                        }

                                        scope.$apply();
                                    }

                                    verticalMoveHandler = function (event) {
                                        var $u = $(event.target).parent(),
                                            touchY = $u.data("touchY"),
                                            maxHeight = calculateHeight($u.parent()),
                                            markerHeight = maxHeight / 2;

                                        if (event.type === "panstart") {
                                            touchY = event.srcEvent.clientY - $u.parent().offset().top;
                                            $u.data("touchY", touchY);
                                        } else if (event.type === "panmove") {
                                            if (touchY != undefined) {
                                                var moveY = event.srcEvent.clientY - ($u.parent().offset().top + touchY),
                                                    height = calculateHeight($u),
                                                    ftTop,
                                                    top;

                                                var m = ($u.css("top") || "").match(/([-\d\.]+)px$/);
                                                if (m && m.length == 2)
                                                    ftTop = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                else
                                                    ftTop = Math.floor(($u.offset().top - $u.parent().offset().top) * angularConstants.precision) / angularConstants.precision;
                                                top = ftTop + moveY;

                                                if (top >= -height / 2 && top + height / 2 <= maxHeight) {
                                                    touchY += moveY;

                                                    $u.css("top", top + "px");
                                                    $u.data("touchY", touchY);
                                                    scope.pickedBackgroundPosition.y = Math.floor((top + height / 2) / maxHeight * 100);

                                                    var bottom = top + height / 2, nearByVerticalMarkerIndex = Math.round((bottom / markerHeight) * 10) / 10;
                                                    if (Math.abs(bottom - nearByVerticalMarkerIndex * markerHeight) <= options.deviation) {
                                                        if (scope.nearByVerticalMarkerIndex != nearByVerticalMarkerIndex) {
                                                            scope.nearByVerticalMarkerIndex = nearByVerticalMarkerIndex;
                                                            scope.nearByVerticalCordIndex = nearByVerticalMarkerIndex;
                                                        }
                                                    } else {
                                                        if (scope.nearByVerticalMarkerIndex != null) {
                                                            scope.nearByVerticalMarkerIndex = null;
                                                            scope.nearByVerticalCordIndex = null;
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            if (touchY != undefined) {
                                                if (scope.nearByVerticalMarkerIndex != null) {
                                                    var height = calculateHeight($u),
                                                        bottom = Math.floor((scope.nearByVerticalMarkerIndex * markerHeight) * angularConstants.precision) / angularConstants.precision,
                                                        top = bottom - height / 2;

                                                    $u.css("top", top + "px");
                                                    scope.pickedBackgroundPosition.y = Math.floor((top + height / 2) / maxHeight * 100);
                                                } else {
                                                    scope.nearByVerticalCordIndex = null;
                                                }

                                                $u.removeData("touchY");
                                                scope.nearByVerticalMarkerIndex = null;
                                            }
                                        }

                                        scope.$apply();
                                    }

                                    horizontalMoveMgr = new Hammer.Manager(element.find(".horizontalMoveControl")[0]);
                                    horizontalMoveMgr.add(new Hammer.Pan({threshold: 5, pointers: 0}));
                                    horizontalMoveMgr.on("panstart panmove panend", horizontalMoveHandler);

                                    verticalMoveMgr = new Hammer.Manager(element.find(".verticalMoveControl")[0]);
                                    verticalMoveMgr.add(new Hammer.Pan({threshold: 5, pointers: 0}));
                                    verticalMoveMgr.on("panstart panmove panend", verticalMoveHandler);
                                }

                                function unregisterHandlers() {
                                    if (horizontalMoveMgr) {
                                        horizontalMoveMgr.off("panstart panmove panend", horizontalMoveHandler);
                                        horizontalMoveMgr = null;
                                    }
                                    if (verticalMoveMgr) {
                                        verticalMoveMgr.off("panstart panmove panend", verticalMoveHandler);
                                        verticalMoveMgr = null;
                                    }
                                }

                                scope.togglePalette = function (event) {
                                    event && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if ($wrapper.hasClass("expanded")) {
                                        scope.toggleDisplay($panel).then(function () {
                                            return scope.toggleExpand($wrapper).then(function () {
                                                var defer = $q.defer();

                                                $timeout(function () {
                                                    scope.watchBackgroundImageValue(false);
                                                    scope.watchBackgroundPositionValue(false);
                                                    scope.watchBackgroundRepeatValue(false);

                                                    defer.resolve();
                                                });

                                                return defer.promise;
                                            });
                                        });
                                    } else {
                                        scope.toggleExpand($wrapper).then(function () {
                                            return scope.toggleDisplay($panel).then(function () {
                                                var defer = $q.defer();

                                                $timeout(function () {
                                                    scope.watchBackgroundImageValue(true);
                                                    scope.watchBackgroundPositionValue(true);
                                                    scope.watchBackgroundRepeatValue(true);

                                                    defer.resolve();
                                                });

                                                return defer.promise;
                                            });
                                        });
                                    }
                                }

                                scope.onUploadSuccess = function ($file, $message) {
                                    if ($message) {
                                        var ret = JSON.parse($message);
                                        if (ret.result && ret.result === "OK") {
                                            var finalName = ret.resultValue;
                                            scope.setBackgroundImageUrl("project/{0}/images/{1}".format($rootScope.loadedProject.projectRecord._id, finalName));
                                        }
                                    }

                                    $file.cancel();
                                }

                                scope.clearBackgroundImageUrl = function (event) {
                                    event && event.stopPropagation();

                                    if (scope.pickedBackgroundImageUrl) {
                                        appService.removeProjectImage($rootScope.loadedProject.projectRecord._id, scope.pickedBackgroundImageUrl).then(function (ret) {
                                            if (ret && ret.data.result === "OK") {
                                                scope.setBackgroundImageUrl("");
                                            }
                                        });
                                    }
                                }

                                scope.setBackgroundImageUrl = function (value) {
                                    var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.backgroundImage[pseudoStylePrefix] = scope.backgroundImage[pseudoStylePrefix] || {};
                                    var pseudoStyle = scope.backgroundImage[pseudoStylePrefix];

                                    if (pseudoStyle['background-image'] != value) {
                                        pseudoStyle['background-image'] = value;

                                        //Trigger watcher on sketchWidgetSetting.backgroundImage to apply style to widget
                                        scope.backgroundImage = angular.copy(scope.backgroundImage);

                                        scope.pickedBackgroundImageUrl = value;
                                    }
                                }

                                scope.setBackgroundPosition = function (x, y, unit) {
                                    var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.backgroundImage[pseudoStylePrefix] = scope.backgroundImage[pseudoStylePrefix] || {};
                                    var pseudoStyle = scope.backgroundImage[pseudoStylePrefix];
                                    pseudoStyle['background-position'] = pseudoStyle['background-position'] || {};
                                    pseudoStyle['background-position'].x = x + unit;
                                    pseudoStyle['background-position'].y = y + unit;

                                    //Trigger watcher on sketchWidgetSetting.backgroundImage to apply style to widget
                                    scope.backgroundImage = angular.copy(scope.backgroundImage);

                                    if (scope.pickedBackgroundPosition.x != x) scope.pickedBackgroundPosition.x = x;
                                    if (scope.pickedBackgroundPosition.y != y) scope.pickedBackgroundPosition.y = y;
                                    if (scope.pickedBackgroundPosition.unit != unit) scope.pickedBackgroundPosition.unit = unit;
                                }

                                scope.setBackgroundRepeatValue = function (value) {
                                    if (value) {
                                        var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                        pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                        scope.backgroundImage[pseudoStylePrefix] = scope.backgroundImage[pseudoStylePrefix] || {};
                                        var pseudoStyle = scope.backgroundImage[pseudoStylePrefix];

                                        if (pseudoStyle['background-repeat'] != value) {
                                            pseudoStyle['background-repeat'] = value;

                                            //Trigger watcher on sketchWidgetSetting.backgroundImage to apply style to widget
                                            scope.backgroundImage = angular.copy(scope.backgroundImage);

                                            scope.pickBackgroundRepeatValue = value;
                                        }
                                    }
                                }

                                scope.watchBackgroundImageValue = function (state) {
                                    if (state) {
                                        if (!scope.deregisterUrlWatch) {
                                            scope.deregisterUrlWatch = scope.$watch("pickedBackgroundImageUrl", function (to) {
                                                to && scope.setBackgroundImageUrl(to);
                                            });
                                        }
                                    } else {
                                        scope.deregisterUrlWatch && scope.deregisterUrlWatch();
                                        scope.deregisterUrlWatch = null;
                                    }
                                }

                                scope.watchBackgroundPositionValue = function (state) {
                                    if (state) {
                                        if (!scope.deregisterPositionXWatch) {
                                            scope.deregisterPositionXWatch = scope.$watch("pickedBackgroundPosition.x", function (to) {
                                                if (to != null && !Number.isNaN(to)) {
                                                    var $u = element.find(".horizontalLocator"),
                                                        m = ($u.css("left") || "").match(/([-\d\.]+)px$/),
                                                        left,
                                                        width;

                                                    if (m && m.length == 2)
                                                        left = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                    else
                                                        left = Math.floor(($u.offset().left - $u.parent().offset().left) * angularConstants.precision) / angularConstants.precision;

                                                    m = ($u.css("width") || "").match(/([-\d\.]+)px$/);
                                                    width = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;

                                                    var maxWidth;
                                                    m = ($u.parent().css("width") || "").match(/([-\d\.]+)px$/);
                                                    if (m && m.length == 2)
                                                        maxWidth = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                    else
                                                        maxWidth = Math.floor($u.parent().width() * angularConstants.precision) / angularConstants.precision;

                                                    $u.css("left", (Math.floor((maxWidth * to / 100) * angularConstants.precision) / angularConstants.precision - width / 2) + "px");

                                                    scope.setBackgroundPosition(to, scope.pickedBackgroundPosition.y, scope.pickedBackgroundPosition.unit);
                                                }
                                            });
                                            scope.deregisterPositionYWatch = scope.$watch("pickedBackgroundPosition.y", function (to) {
                                                if (to != null && !Number.isNaN(to)) {
                                                    var $u = element.find(".verticalLocator"),
                                                        m = ($u.css("top") || "").match(/([-\d\.]+)px$/),
                                                        top,
                                                        height;

                                                    if (m && m.length == 2)
                                                        top = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                    else
                                                        top = Math.floor(($u.offset().top - $u.parent().offset().top) * angularConstants.precision) / angularConstants.precision;

                                                    m = ($u.css("height") || "").match(/([-\d\.]+)px$/);
                                                    height = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;

                                                    var maxHeight;
                                                    m = ($u.parent().css("height") || "").match(/([-\d\.]+)px$/);
                                                    if (m && m.length == 2)
                                                        maxHeight = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                    else
                                                        maxHeight = Math.floor($u.parent().height() * angularConstants.precision) / angularConstants.precision;

                                                    $u.css("top", (Math.floor((maxHeight * to / 100) * angularConstants.precision) / angularConstants.precision - height / 2) + "px");

                                                    scope.setBackgroundPosition(scope.pickedBackgroundPosition.x, to, scope.pickedBackgroundPosition.unit);
                                                }
                                            });
                                            scope.deregisterPositionUnitWatch = scope.$watch("pickedBackgroundPosition.unit", function (to) {
                                                to && scope.setBackgroundPosition(0, 0, to);
                                            });
                                        }
                                    } else {
                                        scope.deregisterPositionXWatch && scope.deregisterPositionXWatch();
                                        scope.deregisterPositionYWatch && scope.deregisterPositionYWatch();
                                        scope.deregisterPositionUnitWatch && scope.deregisterPositionUnitWatch();
                                        scope.deregisterPositionXWatch = null;
                                        scope.deregisterPositionYWatch = null;
                                        scope.deregisterPositionUnitWatch = null;
                                    }
                                }

                                scope.watchBackgroundRepeatValue = function (state) {
                                    if (state) {
                                        if (!scope.deregisterRepeatWatch) {
                                            scope.deregisterRepeatWatch = scope.$watch("pickBackgroundRepeatValue", function (to) {
                                                to && scope.setBackgroundRepeatValue(to);
                                            });
                                        }
                                    } else {
                                        scope.deregisterRepeatWatch && scope.deregisterRepeatWatch();
                                        scope.deregisterRepeatWatch = null;
                                    }
                                }

                                $timeout(function () {
                                    registerHandlers();
                                });

                                scope.$on('$destroy', function () {
                                    unregisterHandlers();
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);