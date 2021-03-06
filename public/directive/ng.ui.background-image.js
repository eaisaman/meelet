define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$rootScope", "$http", "$timeout", "$q", "$exceptionHandler", "angularConstants", "angularEventTypes", "appService", "utilService"];

            appModule.directive("uiBackgroundImage", _.union(inject, [function ($rootScope, $http, $timeout, $q, $exceptionHandler, angularConstants, angularEventTypes, appService, utilService) {
                'use strict';

                var boundProperties = {backgroundImage: "="},
                    defaults = {
                        deviation: 10,
                        backgroundPosition: {
                            unit: "%",
                            x: 0,
                            y: 0
                        },
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "contain"
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "=", pseudo: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_background-image.html",
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
                                            backgroundImage: function (value) {
                                                scope.backgroundImage = value;
                                                scope.pickedBackgroundImageName = scope.pickBackgroundImageValue(null);
                                                scope.pickedBackgroundPosition = scope.pickBackgroundPositionValue();
                                                scope.pickedBackgroundRepeat = scope.pickBackgroundRepeatValue();
                                                scope.pickedBackgroundSize = scope.pickBackgroundSizeValue();

                                                if (scope.pickedBackgroundImageName) {
                                                    scope.enableControl();
                                                    scope.togglePalette(true);
                                                } else {
                                                    scope.disableControl();
                                                    scope.togglePalette(false);
                                                }
                                            }
                                        },
                                        {backgroundImage: "uiBackgroundImage"}
                                    )
                                );

                                scope.toggleBackgroundImageControl = function () {
                                    return scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            return utilService.whilst(
                                                function () {
                                                    return !scope.backgroundImage;
                                                },
                                                function (err) {
                                                    if (!err) {
                                                        scope.setBackgroundImageUrl("");
                                                        scope.setBackgroundPosition(options.backgroundPosition.x, options.backgroundPosition.y, options.backgroundPosition.unit);
                                                        scope.setBackgroundRepeatValue(options.backgroundRepeat);
                                                        scope.setBackgroundSizeValue(options.backgroundSize);

                                                        scope.togglePalette(true);
                                                    }
                                                },
                                                angularConstants.checkInterval,
                                                "ui-background-image.toggleBackgroundImageControl",
                                                angularConstants.renderTimeout
                                            );
                                        } else {
                                            if (scope.backgroundImage) {
                                                scope.backgroundImage = angular.copy(scope.unsetStyle(scope.backgroundImage, scope.pseudo));
                                            }

                                            return scope.togglePalette(false);
                                        }
                                    });
                                }

                                scope.pickBackgroundImageValue = function (pseudo) {
                                    var imageUrl = scope.backgroundImage && scope.pickStyle(scope.backgroundImage, pseudo != null ? pseudo : scope.pseudo)["background-image"] || null;
                                    if (imageUrl) {
                                        var index = imageUrl.lastIndexOf("/");
                                        if (index != null)
                                            imageUrl = imageUrl.slice(index + 1);
                                    }

                                    return imageUrl;
                                }

                                scope.pickBackgroundPositionValue = function (pseudo, useDefault) {
                                    useDefault = useDefault == null || useDefault;
                                    return scope.backgroundImage && scope.pickStyle(scope.backgroundImage, pseudo != null ? pseudo : scope.pseudo)["background-position"] || (useDefault && _.clone(options.backgroundPosition) || null);
                                }

                                scope.pickBackgroundRepeatValue = function (pseudo, useDefault) {
                                    useDefault = useDefault == null || useDefault;
                                    return scope.backgroundImage && scope.pickStyle(scope.backgroundImage, pseudo != null ? pseudo : scope.pseudo)["background-repeat"] || (useDefault && options.backgroundRepeat || null);
                                }

                                scope.pickBackgroundSizeValue = function (pseudo, useDefault) {
                                    useDefault = useDefault == null || useDefault;
                                    return scope.backgroundImage && scope.pickStyle(scope.backgroundImage, pseudo != null ? pseudo : scope.pseudo)["background-size"] || (useDefault && options.backgroundSize || null);
                                }

                                scope.project = $rootScope.loadedProject;
                                scope.repeatList = [
                                    {name: "No Repeat", value: "no-repeat"},
                                    {name: "Repeat", value: "repeat"},
                                    {name: "Repeat X", value: "repeat-x"},
                                    {name: "Repeat Y", value: "repeat-y"}
                                ];
                                scope.sizeList = [
                                    {name: "Cover", value: "cover"},
                                    {name: "Contain", value: "contain"}
                                ];
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
                                    horizontalMoveMgr.add(new Hammer.Pan({threshold: 5}));
                                    horizontalMoveMgr.on("panstart panmove panend", horizontalMoveHandler);

                                    verticalMoveMgr = new Hammer.Manager(element.find(".verticalMoveControl")[0]);
                                    verticalMoveMgr.add(new Hammer.Pan({threshold: 5}));
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

                                scope.togglePalette = function (state) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if (state == null || $wrapper.hasClass("expanded") ^ state) {
                                        if ($wrapper.hasClass("expanded")) {
                                            return scope.toggleDisplay($panel).then(function () {
                                                return scope.toggleExpand($wrapper).then(function () {
                                                    var defer = $q.defer();

                                                    $timeout(function () {
                                                        //scope.watchBackgroundImageValue(false);
                                                        scope.watchBackgroundPositionValue(false);

                                                        defer.resolve();
                                                    });

                                                    return defer.promise;
                                                });
                                            });
                                        } else {
                                            return scope.toggleExpand($wrapper).then(function () {
                                                return scope.toggleDisplay($panel).then(function () {
                                                    var defer = $q.defer();

                                                    $timeout(function () {
                                                        //scope.watchBackgroundImageValue(true);
                                                        scope.watchBackgroundPositionValue(true);

                                                        defer.resolve();
                                                    });

                                                    return defer.promise;
                                                });
                                            });
                                        }
                                    }
                                }

                                scope.clearBackgroundImageUrl = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.pickedBackgroundImageName) {
                                        scope.setBackgroundImageUrl("");
                                        scope.pickedBackgroundImageName = "";
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.onChangeBackgroundImageName = function () {
                                    scope.setBackgroundImageUrl('project/{0}/resource/image/{1}'.format($rootScope.loadedProject.projectRecord._id, scope.pickedBackgroundImageName));
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
                                    }
                                }

                                scope.setBackgroundPosition = function (x, y, unit) {
                                    var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.backgroundImage[pseudoStylePrefix] = scope.backgroundImage[pseudoStylePrefix] || {};
                                    var pseudoStyle = scope.backgroundImage[pseudoStylePrefix];
                                    pseudoStyle['background-position'] = pseudoStyle['background-position'] || {};
                                    pseudoStyle['background-position'].x = x;
                                    pseudoStyle['background-position'].y = y;
                                    pseudoStyle['background-position'].unit = unit;

                                    //Trigger watcher on sketchWidgetSetting.backgroundImage to apply style to widget
                                    scope.backgroundImage = angular.copy(scope.backgroundImage);

                                    scope.pickedBackgroundPosition = scope.pickedBackgroundPosition || {};
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

                                            scope.pickedBackgroundRepeat = value;
                                        }
                                    }
                                }

                                scope.setBackgroundSizeValue = function (value) {
                                    if (value) {
                                        var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                        pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                        scope.backgroundImage[pseudoStylePrefix] = scope.backgroundImage[pseudoStylePrefix] || {};
                                        var pseudoStyle = scope.backgroundImage[pseudoStylePrefix];

                                        if (pseudoStyle['background-size'] != value) {
                                            pseudoStyle['background-size'] = value;

                                            //Trigger watcher on sketchWidgetSetting.backgroundImage to apply style to widget
                                            scope.backgroundImage = angular.copy(scope.backgroundImage);

                                            scope.pickedBackgroundSize = value;
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

                                                    to = Number.parseInt(to);
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

                                                    to = Number.parseInt(to);
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

                                utilService.latestOnce(
                                    function () {
                                        return $timeout(
                                            function () {
                                                registerHandlers();
                                            }, angularConstants.actionDelay
                                        );
                                    },
                                    null,
                                    null,
                                    angularConstants.unresponsiveInterval,
                                    "ui-background-image.compile.post.init"
                                )();

                                scope.pseudoChangeWatcher = scope.$on(angularEventTypes.widgetPseudoChangeEvent, function (event, pseudo) {
                                    scope.pickedBackgroundImageName = scope.pickBackgroundImageValue(pseudo);

                                    if (scope.pickedBackgroundImageName) {
                                        scope.pickedBackgroundPosition = scope.pickBackgroundPositionValue(pseudo);
                                        scope.pickedBackgroundRepeat = scope.pickBackgroundRepeatValue(pseudo);
                                        scope.pickedBackgroundSize = scope.pickBackgroundSizeValue(pseudo);

                                        scope.enableControl();
                                    } else {
                                        scope.disableControl();
                                    }
                                });

                                scope.$on('$destroy', function () {
                                    unregisterHandlers();

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