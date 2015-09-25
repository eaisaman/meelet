define(
    ["angular-lib", "jquery-lib", "hammer-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "$exceptionHandler", "$log", "angularEventTypes", "angularConstants", "uiService", "utilService", "appService"];

            appModule.directive("uiHorizontalRuler", _.union(inject, [function ($timeout, $q, $exceptionHandler, $log, angularEventTypes, angularConstants, uiService, utilService, appService) {
                'use strict';

                var defaults = {
                        deviation: 10
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                        dockAlign: "=",
                        markerCount: "=",
                        deviceWidth: "=",
                        deviceHeight: "=",
                        pickedWidget: "=",
                        markerWidth: "=",
                        minWidth: "="
                    },
                    replace: false,
                    templateUrl: "include/_horizontal-ruler.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                scope.Math = Math;
                                scope.constants = angularConstants;

                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    "$timeout": $timeout,
                                    "$q": $q,
                                    "angularConstants": angularConstants,
                                    "utilService": utilService,
                                    element: element,
                                    scope: scope
                                }));

                                scope.widgetHorizontalLocation = function (widget) {
                                    if (widget && !widget.isTemporary) {
                                        var $parent = widget.$element.parent(),
                                            parentLeft = $parent.offset().left - element.offset().left;

                                        parentLeft = Math.floor(parentLeft * angularConstants.precision) / angularConstants.precision;
                                        parentLeft = parentLeft + "px";

                                        return {
                                            left: "calc({0} + {1})".format(widget.css("left"), parentLeft),
                                            width: widget.css("width")
                                        };
                                    } else
                                        return {};
                                }
                            },
                            post: function (scope, element, attrs) {
                                var leftResizeMgr, moveMgr, rightResizeMgr,
                                    leftResizeHandler, moveHandler, toggleMoveModeHandler, rightResizeHandler;

                                function registerHandlers() {
                                    leftResizeHandler = function (event) {
                                        var $u = $(event.target).parent(),
                                            touchX = $u.data("touchX"),
                                            $parent = scope.pickedWidget.$element.parent(),
                                            parentLeft = $parent.offset().left - element.offset().left;

                                        parentLeft = Math.floor(parentLeft * angularConstants.precision) / angularConstants.precision;

                                        if (event.type === "panstart") {
                                            touchX = event.srcEvent.clientX - $u.offset().left;
                                            $u.data("touchX", touchX);
                                        } else if (event.type === "panmove") {
                                            if (touchX != undefined) {
                                                var moveX = event.srcEvent.clientX - ($u.offset().left + touchX),
                                                    maxWidth = utilService.calculateWidth($u.parent()),
                                                    width = utilService.calculateWidth($u),
                                                    ftLeft,
                                                    left;

                                                var m = ($u.css("left") || "").match(/([-\d\.]+)px$/);
                                                if (m && m.length == 2)
                                                    ftLeft = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                else
                                                    ftLeft = Math.floor(($u.offset().left - $u.parent().offset().left) * angularConstants.precision) / angularConstants.precision;
                                                left = ftLeft + moveX;

                                                if (left < 0)
                                                    left = 0;
                                                else if (left + width > maxWidth)
                                                    left = maxWidth - width;

                                                width += (ftLeft - left);
                                                if (width > scope.minWidth) {
                                                    $u.css("left", left + "px");
                                                    $u.css("width", width + "px");
                                                    scope.pickedWidget.css("left", (left - parentLeft) + "px");
                                                    scope.pickedWidget.css("width", width + "px");

                                                    var nearByMarkerIndex = Math.round((left / scope.markerWidth) * 10) / 10;
                                                    if (Math.abs(left - nearByMarkerIndex * scope.markerWidth) <= options.deviation) {
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
                                            if (touchX != undefined) {
                                                if (scope.nearByMarkerIndex != null) {
                                                    var width = utilService.calculateWidth($u),
                                                        ftLeft, left;

                                                    var m = ($u.css("left") || "").match(/([-\d\.]+)px$/);
                                                    if (m && m.length == 2)
                                                        ftLeft = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                    else
                                                        ftLeft = Math.floor(($u.offset().left - $u.parent().offset().left) * angularConstants.precision) / angularConstants.precision;

                                                    left = Math.floor((scope.nearByMarkerIndex * scope.markerWidth) * angularConstants.precision) / angularConstants.precision
                                                    width = (width + ftLeft) - left;

                                                    $u.css("left", left + "px");
                                                    $u.css("width", width + "px");
                                                    scope.pickedWidget.css("left", (left - parentLeft) + "px");
                                                    scope.pickedWidget.css("width", width + "px");
                                                }

                                                $u.removeData("touchX");
                                                scope.nearByMarkerIndex = null;
                                            }
                                        }
                                        scope.$apply();
                                    }
                                    moveHandler = function (event) {
                                        var $u = $(event.target).parent(),
                                            touchX = $u.data("touchX"),
                                            $parent = scope.pickedWidget.$element.parent(),
                                            parentLeft = $parent.offset().left - element.offset().left;

                                        if (event.type === "panstart") {
                                            touchX = event.srcEvent.clientX - $u.parent().offset().left;
                                            $u.data("touchX", touchX);
                                        } else if (event.type === "panmove") {
                                            if (touchX != undefined) {
                                                var moveX = event.srcEvent.clientX - ($u.parent().offset().left + touchX),
                                                    maxWidth = utilService.calculateWidth($u.parent()),
                                                    width = utilService.calculateWidth($u),
                                                    ftLeft,
                                                    left;

                                                var m = ($u.css("left") || "").match(/([-\d\.]+)px$/);
                                                if (m && m.length == 2)
                                                    ftLeft = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                else
                                                    ftLeft = Math.floor(($u.offset().left - $u.parent().offset().left) * angularConstants.precision) / angularConstants.precision;
                                                left = ftLeft + moveX;

                                                if (left >= 0 && left + width <= maxWidth) {
                                                    touchX += moveX;

                                                    $u.css("left", left + "px");
                                                    scope.pickedWidget.css("left", (left - parentLeft) + "px");

                                                    $u.data("touchX", touchX);
                                                    $u.data("moveDirection", moveX > 0 ? "right" : "left");

                                                    if (scope.alignCenter) {
                                                        var right = left + width / 2, nearByMarkerIndex = Math.round((right / scope.markerWidth) * 10) / 10;

                                                        if (Math.abs(right - nearByMarkerIndex * scope.markerWidth) <= options.deviation) {
                                                            if (scope.nearByMarkerIndex != nearByMarkerIndex)
                                                                scope.nearByMarkerIndex = nearByMarkerIndex;
                                                        } else {
                                                            if (scope.nearByMarkerIndex != null) {
                                                                scope.nearByMarkerIndex = null;
                                                            }
                                                        }
                                                    } else {
                                                        if (moveX > 0) {
                                                            var right = left + width, nearByMarkerIndex = Math.round((right / scope.markerWidth) * 10) / 10;
                                                            if (Math.abs(right - nearByMarkerIndex * scope.markerWidth) <= options.deviation) {
                                                                if (scope.nearByMarkerIndex != nearByMarkerIndex)
                                                                    scope.nearByMarkerIndex = nearByMarkerIndex;
                                                            } else {
                                                                if (scope.nearByMarkerIndex != null) {
                                                                    scope.nearByMarkerIndex = null;
                                                                }
                                                            }
                                                        } else {
                                                            var nearByMarkerIndex = Math.round((left / scope.markerWidth) * 10) / 10;
                                                            if (Math.abs(left - nearByMarkerIndex * scope.markerWidth) <= options.deviation) {
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
                                            if (touchX != undefined) {
                                                if (scope.alignCenter) {
                                                    if (scope.nearByMarkerIndex != null) {
                                                        var width = utilService.calculateWidth($u),
                                                            right = Math.floor((scope.nearByMarkerIndex * scope.markerWidth) * angularConstants.precision) / angularConstants.precision,
                                                            left = right - width / 2;

                                                        $u.css("left", left + "px");
                                                        scope.pickedWidget.css("left", (left - parentLeft) + "px");
                                                    }
                                                } else {
                                                    var moveDirection = $u.data("moveDirection");

                                                    if (moveDirection === "right") {
                                                        if (scope.nearByMarkerIndex != null) {
                                                            var width = utilService.calculateWidth($u),
                                                                right = Math.floor((scope.nearByMarkerIndex * scope.markerWidth) * angularConstants.precision) / angularConstants.precision,
                                                                left = right - width;

                                                            $u.css("left", left + "px");
                                                            scope.pickedWidget.css("left", (left - parentLeft) + "px");
                                                        }
                                                    } else if (moveDirection === "left") {
                                                        if (scope.nearByMarkerIndex != null) {
                                                            var left = Math.floor((scope.nearByMarkerIndex * scope.markerWidth) * angularConstants.precision) / angularConstants.precision;

                                                            $u.css("left", left + "px");
                                                            scope.pickedWidget.css("left", (left - parentLeft) + "px");
                                                        }
                                                    }
                                                }

                                                $u.removeData("touchX");
                                                $u.removeData("moveDirection");
                                                scope.nearByMarkerIndex = null;
                                            }
                                        }

                                        scope.$apply();
                                    }
                                    rightResizeHandler = function (event) {
                                        var $u = $(event.target).parent(),
                                            touchX = $u.data("touchX");

                                        if (event.type === "panstart") {
                                            touchX = $u.width() - (event.srcEvent.clientX - $u.offset().left);
                                            $u.data("touchX", touchX);
                                        } else if (event.type === "panmove") {
                                            if (touchX != undefined) {
                                                var newWidth = event.srcEvent.clientX - $u.offset().left + touchX,
                                                    maxWidth = utilService.calculateWidth($u.parent()),
                                                    width = utilService.calculateWidth($u),
                                                    ftLeft;

                                                var m = ($u.css("left") || "").match(/([-\d\.]+)px$/);
                                                if (m && m.length == 2)
                                                    ftLeft = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                else
                                                    ftLeft = Math.floor(($u.offset().left - $u.parent().offset().left) * angularConstants.precision) / angularConstants.precision;

                                                if (newWidth > scope.minWidth && ftLeft + newWidth <= maxWidth) {
                                                    $u.css("width", newWidth + "px");
                                                    scope.pickedWidget.css("width", newWidth + "px");

                                                    var right = ftLeft + newWidth, nearByMarkerIndex = Math.round((right / scope.markerWidth) * 10) / 10;
                                                    if (Math.abs(right - nearByMarkerIndex * scope.markerWidth) <= options.deviation) {
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
                                            if (touchX != undefined) {
                                                if (scope.nearByMarkerIndex != null) {
                                                    var width,
                                                        ftLeft, right = Math.floor((scope.nearByMarkerIndex * scope.markerWidth) * angularConstants.precision) / angularConstants.precision;

                                                    var m = ($u.css("left") || "").match(/([-\d\.]+)px$/);
                                                    if (m && m.length == 2)
                                                        ftLeft = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                    else
                                                        ftLeft = Math.floor(($u.offset().left - $u.parent().offset().left) * angularConstants.precision) / angularConstants.precision;

                                                    width = right - ftLeft;

                                                    $u.css("width", width + "px");
                                                    scope.pickedWidget.css("width", width + "px");
                                                }

                                                $u.removeData("touchX");
                                                scope.nearByMarkerIndex = null;
                                            }
                                        }

                                        scope.$apply();
                                    }
                                    toggleMoveModeHandler = function () {
                                        scope.alignCenter = !scope.alignCenter;
                                        scope.$apply();
                                    }

                                    leftResizeMgr = new Hammer.Manager(element.find("#leftResizeControl")[0]);
                                    leftResizeMgr.add(new Hammer.Pan({threshold: 5}));
                                    leftResizeMgr.on("panstart panmove panend", leftResizeHandler);

                                    moveMgr = new Hammer.Manager(element.find("#horizontalMoveControl")[0]);
                                    moveMgr.add(new Hammer.Pan({threshold: 5}));
                                    moveMgr.add(new Hammer.Tap());
                                    moveMgr.on("panstart panmove panend", moveHandler);
                                    moveMgr.on("tap", toggleMoveModeHandler);

                                    rightResizeMgr = new Hammer.Manager(element.find("#rightResizeControl")[0]);
                                    rightResizeMgr.add(new Hammer.Pan({threshold: 5}));
                                    rightResizeMgr.on("panstart panmove panend", rightResizeHandler);
                                }

                                function unregisterHandlers() {
                                    if (leftResizeMgr) {
                                        leftResizeMgr.off("panstart panmove panend", leftResizeHandler);
                                        leftResizeMgr = null;
                                    }
                                    if (moveMgr) {
                                        moveMgr.off("panstart panmove panend", moveHandler);
                                        moveMgr.off("tap", toggleMoveModeHandler);
                                        moveMgr = null;
                                    }
                                    if (rightResizeMgr) {
                                        rightResizeMgr.off("panstart panmove panend", rightResizeHandler);
                                        rightResizeMgr = null;
                                    }
                                }

                                utilService.latestOnce(
                                    function () {
                                        return $timeout(function () {
                                            registerHandlers();
                                        });
                                    },
                                    null,
                                    null,
                                    angularConstants.unresponsiveInterval,
                                    "ui-horizontal-ruler.compile.post.init"
                                )();

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