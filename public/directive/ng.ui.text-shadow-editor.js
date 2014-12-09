define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$http", "$timeout", "$q", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiTextShadowEditor", _.union(inject, [function ($parse, $http, $timeout, $q, angularEventTypes, uiUtilService) {
                'use strict';

                var boundProperties = {textShadow: "="},
                    defaults = {
                        textShadowJson: ""
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_text-shadow.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                scope.$root.$broadcast(
                                    angularEventTypes.boundPropertiesEvent,
                                    uiUtilService.createDirectiveBoundMap(
                                        boundProperties,
                                        attrs,
                                        {
                                            textShadow: function (value) {
                                                if (value && scope.hasStyle(value)) {
                                                    scope.pickedTextShadow = scope.pickTextShadowValue(value);
                                                    scope.enableControl();
                                                } else {
                                                    scope.disableControl();
                                                }
                                            }
                                        },
                                        {textShadow: "uiTextShadowEditor"})
                                );

                                if (options.textShadowJson) {
                                    $http.get(options.textShadowJson).then(function (result) {
                                        scope.textShadowList = result.data;
                                    });
                                }

                                scope.pseudo = "";

                                scope.pickTextShadowValue = function (styles) {
                                    return scope.pickStyle(styles, scope.pseudo)["text-shadow"] || [];
                                }

                                function createTextShadowStopValueInputAssign(name) {
                                    var fn = $parse("shadowStop['" + name + "']"),
                                        assign = fn.assign;

                                    if (!fn.assign.customized) {
                                        fn.assign = function ($scope, value) {
                                            function shadowStopHandler() {
                                                var defer = $q.defer();

                                                $timeout(function () {
                                                    //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                                    scope.setTextShadow(scope.pickedTextShadow);

                                                    defer.resolve();
                                                });

                                                return defer.promise;
                                            }

                                            shadowStopHandler.onceId = "uiTextShadowEditor.createTextShadowStopValueInputAssign.shadowStopHandler";

                                            if (value) {
                                                var args = Array.prototype.slice.call(arguments),
                                                    result = assign.apply(fn, args);

                                                uiUtilService.once(shadowStopHandler, null, 20)(value);

                                                return result;
                                            }
                                        }

                                        fn.assign.customized = true;
                                    }
                                    return fn;
                                }

                                createTextShadowStopValueInputAssign("h-shadow");
                                createTextShadowStopValueInputAssign("v-shadow");
                                createTextShadowStopValueInputAssign("blur");
                            },
                            post: function (scope, element, attrs) {
                                scope.toggleTextShadowControl = function () {
                                    scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            scope.setTextShadow(scope.pickTextShadowValue(scope.textShadow));
                                        } else {
                                            scope.textShadow = {};
                                        }
                                    });
                                }

                                scope.togglePalette = function (event) {
                                    //toggleDisplayService is bought from extension object
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if ($wrapper.hasClass("expanded")) {
                                        scope.selectTab($panel, $panel.find("div[tab-sel^='tab-head-text-shadow-value']:nth-child(1)")).then(
                                            function () {
                                                return scope.toggleDisplay($panel);
                                            }
                                        ).then(function () {
                                                return scope.toggleExpand($wrapper);
                                            });
                                    } else {
                                        scope.toggleExpand($wrapper).then(function () {
                                            return scope.toggleDisplay($panel);
                                        }).then(
                                            function () {
                                                scope.selectTab($panel, $panel.find("div[tab-sel^='tab-head-text-shadow-value']:nth-child(1)"));
                                            }
                                        );
                                    }
                                }

                                scope.toggleShadowStopColorPalette = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $palette = element.find(".shadowStopColorPalette"),
                                        paletteScope = angular.element($palette.find("> :first-child")).scope();

                                    if (scope.hasClass(".shadowStopColorPalette", "show")) {
                                        paletteScope.closePalette().then(function () {
                                            scope.watchSelectedShadowStopColor(false);
                                        });
                                    } else {
                                        var top = element.find(".shadowStop[shadow-order=" + scope.selectedShadowStopIndex + "]").offset().top,
                                            paletteOffset = $palette.offset();
                                        paletteOffset.top = top;
                                        $palette.offset(paletteOffset);

                                        paletteScope.openPalette().then(function () {
                                            scope.watchSelectedShadowStopColor(true);
                                        });
                                    }
                                }

                                scope.watchSelectedShadowStopColor = function (state) {
                                    if (state) {
                                        if (!scope.deregisterWatch) {
                                            scope.deregisterWatch = scope.$watch("selectedShadowStopColor", function (to) {
                                                to && scope.setStopColor(scope.selectedShadowStopIndex, to);
                                            });
                                        }
                                    } else {
                                        scope.deregisterWatch && scope.deregisterWatch();
                                        scope.deregisterWatch = null;
                                    }
                                }

                                scope.pickTextShadow = function (value, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (value) {
                                        scope.pickedTextShadowName = value.name;
                                        scope.pickedTextShadow = [];
                                        $timeout(function () {
                                            scope.setTextShadow(angular.copy(value.style["text-shadow"]));
                                        });
                                    }
                                }

                                scope.toggleShadowStopMenu = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleDisplay(".shadowStop[shadow-order=" + index + "] .circular-menu .circle", event);
                                }

                                scope.insertShadowStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    var shadowStop = angular.extend({}, scope.pickedTextShadow[index]);
                                    scope.pickedTextShadow.splice(index + 1, 0, shadowStop);

                                    //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                    scope.setTextShadow(scope.pickedTextShadow);
                                }
                                scope.removeShadowStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    if (scope.pickedTextShadow.length > 1 && index < scope.pickedTextShadow.length) {
                                        scope.pickedTextShadow.splice(index, 1);

                                        //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                        scope.setTextShadow(scope.pickedTextShadow);
                                    }
                                }
                                scope.setShadowStopColor = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    if (index < scope.pickedTextShadow.length) {
                                        scope.selectedShadowStopColor = scope.pickedTextShadow[index].color;
                                        scope.selectedShadowStopIndex = index;

                                        scope.toggleShadowStopColorPalette();
                                    }
                                }
                                scope.copyShadowStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    if (index < scope.pickedTextShadow.length) {
                                        scope.copiedShadowStopColor = scope.pickedTextShadow[index].color;
                                    }
                                }
                                scope.pasteShadowStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    if (scope.copiedShadowStopColor && index < scope.pickedTextShadow.length) {
                                        var shadowStop = scope.pickedTextShadow[index];

                                        if (scope.copiedShadowStopColor !== shadowStop.color) {
                                            scope.setStopColor(index, scope.copiedShadowStopColor);
                                        }
                                    }
                                }

                                scope.setStopColor = function (index, hex, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (index < scope.pickedTextShadow.length) {
                                        var shadowStop = scope.pickedTextShadow[index];

                                        if (hex !== shadowStop.color) {
                                            shadowStop.color = "";

                                            $timeout(function () {
                                                shadowStop.color = hex;

                                                //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                                scope.setTextShadow(scope.pickedTextShadow);
                                            }).then($timeout(function () {
                                                var $shadowStop = element.find(".shadowStop[shadow-order=" + index + "]");

                                                uiUtilService.onAnimationEnd($shadowStop).then(
                                                    function () {
                                                        $shadowStop.removeClass("animate");
                                                    }
                                                );
                                                $shadowStop.addClass("animate");
                                            }));
                                        }
                                    }

                                    return true;
                                }

                                scope.setTextShadow = function (value) {
                                    scope.pickedTextShadow = value;

                                    var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.textShadow[pseudoStylePrefix] = scope.textShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.textShadow[pseudoStylePrefix];
                                    pseudoShadowStyle['text-shadow'] = value;

                                    //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                    scope.textShadow = angular.copy(scope.textShadow);
                                }
                            }
                        }
                    }
                }
            }]));
        }
    }
);