define(
    ["angular", "jquery", "hammer"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "$log", "angularEventTypes", "angularConstants", "uiService", "uiUtilService", "appService"];

            appModule.directive("uiVerticalRuler", _.union(inject, [function ($timeout, $q, $log, angularEventTypes, angularConstants, uiService, uiUtilService, appService) {
                'use strict';

                var boundProperties = {},
                    defaults = {
                        deviation: 10
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({
                        dockAlign: "=",
                        sketchObject: "=",
                        isPlaying: "=",
                        scale: "=",
                        markerCount: "=",
                        deviceWidth: "=",
                        deviceHeight: "=",
                        pickedWidget: "=",
                        markerHeight: "=",
                        minHeight: "="
                    }, boundProperties),
                    replace: false,
                    templateUrl: "include/_vertical-ruler.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                scope.Math = Math;
                                scope.constants = angularConstants;

                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                scope.$root.$broadcast(
                                    angularEventTypes.boundPropertiesEvent,
                                    uiUtilService.createDirectiveBoundMap(
                                        boundProperties,
                                        attrs)
                                );

                                scope.widgetVerticalLocation = function (widget) {
                                    return widget && widget.isElement && !widget.isTemporary && {
                                            top: widget.css("top"),
                                            height: widget.css("height")
                                        } || {};
                                }
                            },
                            post: function (scope, element, attrs) {
                                var topResizeMgr, moveMgr, bottomResizeMgr,
                                    topResizeHandler, moveHandler, toggleMoveModeHandler, bottomResizeHandler;

                                function calculateHeight($e) {
                                    var m = ($e.css("height") || "").match(/([-\d\.]+)px$/),
                                        height;
                                    if (m && m.length == 2)
                                        height = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                    else
                                        height = Math.floor($e.height() * angularConstants.precision) / angularConstants.precision;

                                    return height;
                                }

                                function registerHandlers() {
                                    topResizeHandler = function (event) {
                                        var $u = $(event.target).parent(),
                                            touchY = $u.data("touchY");

                                        if (event.type === "panstart") {
                                            touchY = event.srcEvent.clientY - $u.offset().top;
                                            $u.data("touchY", touchY);
                                        } else if (event.type === "panmove") {
                                            if (touchY != undefined) {
                                                var moveY = event.srcEvent.clientY - ($u.offset().top + touchY),
                                                    maxHeight = calculateHeight($u.parent()),
                                                    height = calculateHeight($u),
                                                    ftTop,
                                                    top;

                                                var m = ($u.css("top") || "").match(/([-\d\.]+)px$/);
                                                if (m && m.length == 2)
                                                    ftTop = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                else
                                                    ftTop = Math.floor(($u.offset().top - $u.parent().offset().top) * angularConstants.precision) / angularConstants.precision;
                                                top = ftTop + moveY;

                                                if (top < 0)
                                                    top = 0;
                                                else if (top + height > maxHeight)
                                                    top = maxHeight - height;

                                                height += (ftTop - top);
                                                if (height > scope.minHeight) {
                                                    $u.css("top", top + "px");
                                                    $u.css("height", height + "px");
                                                    scope.pickedWidget.css("top", top + "px");
                                                    scope.pickedWidget.css("height", height + "px");

                                                    var nearByMarkerIndex = Math.round((top / scope.markerHeight) * 10) / 10;
                                                    if (Math.abs(top - nearByMarkerIndex * scope.markerHeight) <= options.deviation) {
                                                        if (scope.nearByMarkerIndex != nearByMarkerIndex)
                                                            scope.nearByMarkerIndex = nearByMarkerIndex;
                                                    } else {
                                                        if (scope.nearByMarkerIndex != null) {
                                                            scope.nearByMarkerIndex = null;
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            if (touchY != undefined) {
                                                if (scope.nearByMarkerIndex != null) {
                                                    var height = calculateHeight($u),
                                                        ftTop, top;

                                                    var m = ($u.css("top") || "").match(/([-\d\.]+)px$/);
                                                    if (m && m.length == 2)
                                                        ftTop = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                    else
                                                        ftTop = Math.floor(($u.offset().top - $u.parent().offset().top) * angularConstants.precision) / angularConstants.precision;

                                                    top = Math.floor((scope.nearByMarkerIndex * scope.markerHeight) * angularConstants.precision) / angularConstants.precision;
                                                    height = (height + ftTop) - top;

                                                    $u.css("top", top + "px");
                                                    $u.css("height", height + "px");
                                                    scope.pickedWidget.css("top", top + "px");
                                                    scope.pickedWidget.css("height", height + "px");
                                                }

                                                $u.removeData("touchY");
                                                scope.nearByMarkerIndex = null;
                                            }
                                        }
                                        scope.$apply();
                                    }
                                    moveHandler = function (event) {
                                        var $u = $(event.target).parent(),
                                            touchY = $u.data("touchY");

                                        if (event.type === "panstart") {
                                            touchY = event.srcEvent.clientY - $u.parent().offset().top;
                                            $u.data("touchY", touchY);
                                        } else if (event.type === "panmove") {
                                            if (touchY != undefined) {
                                                var moveY = event.srcEvent.clientY - ($u.parent().offset().top + touchY),
                                                    maxHeight = calculateHeight($u.parent()),
                                                    height = calculateHeight($u),
                                                    ftTop,
                                                    top;

                                                var m = ($u.css("top") || "").match(/([-\d\.]+)px$/);
                                                if (m && m.length == 2)
                                                    ftTop = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                else
                                                    ftTop = Math.floor(($u.offset().top - $u.parent().offset().top) * angularConstants.precision) / angularConstants.precision;
                                                top = ftTop + moveY;

                                                if (top >= 0 && top + height <= maxHeight) {
                                                    touchY += moveY;

                                                    $u.css("top", top + "px");
                                                    scope.pickedWidget.css("top", top + "px");

                                                    $u.data("touchY", touchY);
                                                    $u.data("moveDirection", moveY > 0 ? "down" : "up");

                                                    if (scope.alignCenter) {
                                                        var bottom = top + height / 2, nearByMarkerIndex = Math.round((bottom / scope.markerHeight) * 10) / 10;
                                                        if (Math.abs(bottom - nearByMarkerIndex * scope.markerHeight) <= options.deviation) {
                                                            if (scope.nearByMarkerIndex != nearByMarkerIndex)
                                                                scope.nearByMarkerIndex = nearByMarkerIndex;
                                                        } else {
                                                            if (scope.nearByMarkerIndex != null) {
                                                                scope.nearByMarkerIndex = null;
                                                            }
                                                        }
                                                    } else {
                                                        if (moveY > 0) {
                                                            var bottom = top + height, nearByMarkerIndex = Math.round((bottom / scope.markerHeight) * 10) / 10;
                                                            if (Math.abs(bottom - nearByMarkerIndex * scope.markerHeight) <= options.deviation) {
                                                                if (scope.nearByMarkerIndex != nearByMarkerIndex)
                                                                    scope.nearByMarkerIndex = nearByMarkerIndex;
                                                            } else {
                                                                if (scope.nearByMarkerIndex != null) {
                                                                    scope.nearByMarkerIndex = null;
                                                                }
                                                            }
                                                        } else {
                                                            var nearByMarkerIndex = Math.round((top / scope.markerHeight) * 10) / 10;
                                                            if (Math.abs(top - nearByMarkerIndex * scope.markerHeight) <= options.deviation) {
                                                                if (scope.nearByMarkerIndex != nearByMarkerIndex)
                                                                    scope.nearByMarkerIndex = nearByMarkerIndex;
                                                            } else {
                                                                if (scope.nearByMarkerIndex != null) {
                                                                    scope.nearByMarkerIndex = null;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            if (touchY != undefined) {
                                                if (scope.alignCenter) {
                                                    if (scope.nearByMarkerIndex != null) {
                                                        var height = calculateHeight($u),
                                                            bottom = Math.floor((scope.nearByMarkerIndex * scope.markerHeight) * angularConstants.precision) / angularConstants.precision,
                                                            top = bottom - height / 2;

                                                        $u.css("top", top + "px");
                                                        scope.pickedWidget.css("top", top + "px");
                                                    }
                                                } else {
                                                    var moveDirection = $u.data("moveDirection");

                                                    if (moveDirection === "down") {
                                                        if (scope.nearByMarkerIndex != null) {
                                                            var height = calculateHeight($u),
                                                                bottom = Math.floor((scope.nearByMarkerIndex * scope.markerHeight) * angularConstants.precision) / angularConstants.precision,
                                                                top = bottom - height;

                                                            $u.css("top", top + "px");
                                                            scope.pickedWidget.css("top", top + "px");
                                                        }
                                                    } else if (moveDirection === "up") {
                                                        if (scope.nearByMarkerIndex != null) {
                                                            var top = Math.floor((scope.nearByMarkerIndex * scope.markerHeight) * angularConstants.precision) / angularConstants.precision;

                                                            $u.css("top", top + "px");
                                                            scope.pickedWidget.css("top", top + "px");
                                                        }
                                                    }
                                                }

                                                $u.removeData("touchY");
                                                $u.removeData("moveDirection");
                                                scope.nearByMarkerIndex = null;
                                            }
                                        }

                                        scope.$apply();
                                    }
                                    bottomResizeHandler = function (event) {
                                        var $u = $(event.target).parent(),
                                            touchY = $u.data("touchY");

                                        if (event.type === "panstart") {
                                            touchY = $u.height() - (event.srcEvent.clientY - $u.offset().top);
                                            $u.data("touchY", touchY);
                                        } else if (event.type === "panmove") {
                                            if (touchY != undefined) {
                                                var newHeight = event.srcEvent.clientY - $u.offset().top + touchY,
                                                    maxHeight = calculateHeight($u.parent()),
                                                    height = calculateHeight($u),
                                                    ftTop;

                                                var m = ($u.css("top") || "").match(/([-\d\.]+)px$/);
                                                if (m && m.length == 2)
                                                    ftTop = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                else
                                                    ftTop = Math.floor(($u.offset().top - $u.parent().offset().top) * angularConstants.precision) / angularConstants.precision;

                                                if (newHeight > scope.minHeight && ftTop + newHeight <= maxHeight) {
                                                    $u.css("height", newHeight + "px");
                                                    scope.pickedWidget.css("height", newHeight + "px");

                                                    var bottom = ftTop + newHeight, nearByMarkerIndex = Math.round((bottom / scope.markerHeight) * 10) / 10;
                                                    if (Math.abs(bottom - nearByMarkerIndex * scope.markerHeight) <= options.deviation) {
                                                        if (scope.nearByMarkerIndex != nearByMarkerIndex)
                                                            scope.nearByMarkerIndex = nearByMarkerIndex;
                                                    } else {
                                                        if (scope.nearByMarkerIndex != null) {
                                                            scope.nearByMarkerIndex = null;
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            if (touchY != undefined) {
                                                if (scope.nearByMarkerIndex != null) {
                                                    var height,
                                                        ftTop, bottom = Math.floor((scope.nearByMarkerIndex * scope.markerHeight) * angularConstants.precision) / angularConstants.precision;

                                                    var m = ($u.css("top") || "").match(/([-\d\.]+)px$/);
                                                    if (m && m.length == 2)
                                                        ftTop = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                    else
                                                        ftTop = Math.floor(($u.offset().top - $u.parent().offset().top) * angularConstants.precision) / angularConstants.precision;

                                                    height = bottom - ftTop;

                                                    $u.css("height", height + "px");
                                                    scope.pickedWidget.css("height", height + "px");
                                                }

                                                $u.removeData("touchY");
                                                scope.nearByMarkerIndex = null;
                                            }
                                        }

                                        scope.$apply();
                                    }
                                    toggleMoveModeHandler = function () {
                                        scope.alignCenter = !scope.alignCenter;
                                        scope.$apply();
                                    }

                                    topResizeMgr = new Hammer.Manager(element.find("#topResizeControl")[0]);
                                    topResizeMgr.add(new Hammer.Pan({threshold: 5, pointers: 0}));
                                    topResizeMgr.on("panstart panmove panend", topResizeHandler);

                                    moveMgr = new Hammer.Manager(element.find("#verticalMoveControl")[0]);
                                    moveMgr.add(new Hammer.Pan({threshold: 5, pointers: 0}));
                                    moveMgr.add(new Hammer.Tap());
                                    moveMgr.on("panstart panmove panend", moveHandler);
                                    moveMgr.on("tap", toggleMoveModeHandler);

                                    bottomResizeMgr = new Hammer.Manager(element.find("#bottomResizeControl")[0]);
                                    bottomResizeMgr.add(new Hammer.Pan({threshold: 5, pointers: 0}));
                                    bottomResizeMgr.on("panstart panmove panend", bottomResizeHandler);
                                }

                                function unregisterHandlers() {
                                    if (topResizeMgr) {
                                        topResizeMgr.off("panstart panmove panend", topResizeHandler);
                                        topResizeMgr = null;
                                    }
                                    if (moveMgr) {
                                        moveMgr.off("panstart panmove panend", moveHandler);
                                        moveMgr.off("tap", toggleMoveModeHandler);
                                        moveMgr = null;
                                    }
                                    if (bottomResizeMgr) {
                                        bottomResizeMgr.off("panstart panmove panend", bottomResizeHandler);
                                        bottomResizeMgr = null;
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