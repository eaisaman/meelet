define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$http", "$timeout", "$q", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiBoxShadowEditor", _.union(inject, [function ($parse, $http, $timeout, $q, angularEventTypes, uiUtilService) {
                'use strict';

                var boundProperties = {boxShadow: "="},
                    defaults = {
                        boxShadowJson: ""
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_box-shadow.html",
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
                                            boxShadow: function (value) {
                                                if (value && scope.hasStyle(value)) {
                                                    scope.pickedBoxShadow = value;
                                                    scope.enableControl();
                                                } else {
                                                    scope.disableControl();
                                                }
                                            }
                                        },
                                        {boxShadow: "uiBoxShadowEditor"})
                                );

                                if (options.boxShadowJson) {
                                    $http.get(options.boxShadowJson).then(function (result) {
                                        scope.boxShadowList = result.data;
                                    });
                                }

                                scope.styleNames = ['left', 'top', 'right', 'bottom', 'width', 'height'];

                                function createBoxShadowValueInputAssign(name) {
                                    var fn = $parse(name),
                                        assign = fn.assign;

                                    if (!fn.assign.customized) {
                                        fn.assign = function ($scope, value) {
                                            function shadowHandler() {
                                                var defer = $q.defer();

                                                $timeout(function () {
                                                    //Trigger watcher on sketchWidgetSetting.boxShadow to apply style to widget
                                                    scope.setBoxShadow(scope.pickedBoxShadow);
                                                });

                                                return defer.promise;
                                            }

                                            shadowHandler.onceId = "uiTextShadowEditor.createBoxShadowValueInputAssign.shadowHandler";

                                            if (value) {
                                                var args = Array.prototype.slice.call(arguments),
                                                    result = assign.apply(fn, args);

                                                uiUtilService.once(shadowHandler, null, 20)(value);

                                                return result;
                                            }
                                        }

                                        fn.assign.customized = true;
                                    }
                                    return fn;
                                }

                                createBoxShadowValueInputAssign("shadowStop['h-shadow']");
                                createBoxShadowValueInputAssign("shadowStop['v-shadow']");
                                createBoxShadowValueInputAssign("shadowStop['blur']");
                                createBoxShadowValueInputAssign("shadowStop['spread']");

                                createBoxShadowValueInputAssign("pickedBoxShadow.beforeStyle[shadowStyle]");
                                createBoxShadowValueInputAssign("pickedBoxShadow.afterStyle[shadowStyle]");
                            },
                            post: function (scope, element, attrs) {
                                scope.toggleBoxShadowControl = function () {
                                    scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            scope.setBoxShadow({
                                                style: {},
                                                beforeStyle: {},
                                                afterStyle: {}
                                            });
                                        } else {
                                            scope.boxShadow = {}
                                        }
                                    });
                                }

                                scope.togglePalette = function (event) {
                                    //toggleDisplayService is bought from extension object
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if ($wrapper.hasClass("expanded")) {
                                        scope.selectTab($panel, $panel.find("div[tab-sel^='tab-head-box-shadow-value']:nth-child(1)")).then(
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
                                                scope.selectTab($panel, $panel.find("div[tab-sel^='tab-head-box-shadow-value']:nth-child(1)"));
                                            }
                                        );
                                    }
                                }

                                scope.toggleShadowStopColorPalette = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $palette = element.find(".shadowStopColorPalette"),
                                        paletteScope = angular.element($palette.find("> :first-child")).scope();

                                    if (scope.hasClass(".shadowStopColorPalette", "show")) {
                                        paletteScope.showInitialTab().then(
                                            function () {
                                                scope.watchSelectedShadowStopColor(false);

                                                return scope.toggleDisplay(".shadowStopColorPalette");
                                            }
                                        );
                                    } else {
                                        var top = element.find(".shadowStopGroup[pseudo='" + scope.selectedShadowPseudo + "'] .shadowStop[shadow-order=" + scope.selectedShadowStopIndex + "]").offset().top,
                                            paletteOffset = $palette.offset();
                                        paletteOffset.top = top;
                                        $palette.offset(paletteOffset);

                                        scope.toggleDisplay(".shadowStopColorPalette").then(
                                            function () {
                                                scope.watchSelectedShadowStopColor(true);

                                                paletteScope.showInitialTab();
                                            }
                                        );
                                    }
                                }

                                scope.watchSelectedShadowStopColor = function (state) {
                                    if (state) {
                                        if (!scope.deregisterWatch) {
                                            scope.deregisterWatch = scope.$watch("selectedShadowStopColor", function (to) {
                                                to && scope.setStopColor(scope.selectedShadowPseudo, scope.selectedShadowStopIndex, to);
                                            });
                                        }
                                    } else {
                                        scope.deregisterWatch && scope.deregisterWatch();
                                        scope.deregisterWatch = null;
                                    }
                                }

                                scope.pickBoxShadow = function (value, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (value) {
                                        scope.pickedBoxShadow = null;
                                        scope.pickedBoxShadowName = value.name;
                                        $timeout(function () {
                                            var styles = {style: {}, beforeStyle: {}, afterStyle: {}};
                                            ["style", "beforeStyle", "afterStyle"].forEach(function (pseudoStylePrefix) {
                                                _.each(value[pseudoStylePrefix], function (styleValue, key) {
                                                    styles[pseudoStylePrefix][key] = angular.copy(styleValue);
                                                })
                                            });
                                            scope.setBoxShadow(styles);
                                        });
                                    }
                                }

                                scope.toggleShadowStopMenu = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleDisplay(".shadowStopGroup[pseudo='" + pseudo + "'] .shadowStop[shadow-order=" + index + "] .circular-menu .circle", event);
                                }

                                scope.insertShadowStop = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(pseudo, index, event);

                                    var pseudoStylePrefix = (pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix],
                                        shadowStop = angular.extend({}, pseudoShadowStyle['box-shadow'][index]);
                                    pseudoShadowStyle['box-shadow'].splice(index + 1, 0, shadowStop);

                                    //Trigger watcher on sketchWidgetSetting.boxShadow to apply style to widget
                                    scope.setBoxShadow(scope.pickedBoxShadow);
                                }
                                scope.removeShadowStop = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(pseudo, index, event);

                                    var pseudoStylePrefix = (pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix];
                                    if (pseudoShadowStyle['box-shadow'].length > 1 && index < pseudoShadowStyle['box-shadow'].length) {
                                        pseudoShadowStyle['box-shadow'].splice(index, 1);

                                        //Trigger watcher on sketchWidgetSetting.boxShadow to apply style to widget
                                        scope.setBoxShadow(scope.pickedBoxShadow);
                                    }
                                }
                                scope.setShadowStopColor = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(pseudo, index, event);

                                    var pseudoStylePrefix = (pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix];
                                    if (index < pseudoShadowStyle['box-shadow'].length) {
                                        scope.selectedShadowStopColor = pseudoShadowStyle['box-shadow'][index].color;
                                        scope.selectedShadowPseudo = pseudo;
                                        scope.selectedShadowStopIndex = index;

                                        scope.toggleShadowStopColorPalette();
                                    }
                                }
                                scope.copyShadowStop = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(pseudo, index, event);

                                    var pseudoStylePrefix = (pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix];
                                    if (index < pseudoShadowStyle['box-shadow'].length) {
                                        scope.copiedShadowStopColor = pseudoShadowStyle['box-shadow'][index].color;
                                    }
                                }
                                scope.pasteShadowStop = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(pseudo, index, event);

                                    var pseudoStylePrefix = (pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix];
                                    if (scope.copiedShadowStopColor && index < pseudoShadowStyle['box-shadow'].length) {
                                        var shadowStop = pseudoShadowStyle['box-shadow'][index];

                                        if (scope.copiedShadowStopColor !== shadowStop.color) {
                                            scope.setStopColor(pseudo, index, scope.copiedShadowStopColor);
                                        }
                                    }
                                }

                                scope.setStopColor = function (pseudo, index, hex, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var pseudoStylePrefix = (pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix];
                                    if (index < pseudoShadowStyle['box-shadow'].length) {
                                        var shadowStop = pseudoShadowStyle['box-shadow'][index];

                                        if (hex !== shadowStop.color) {
                                            shadowStop.color = "";

                                            $timeout(function () {
                                                shadowStop.color = hex;

                                                //Trigger watcher on sketchWidgetSetting.boxShadow to apply style to widget
                                                scope.setBoxShadow(scope.pickedBoxShadow);
                                            }).then($timeout(function () {
                                                var $shadowStop = element.find(".shadowStopGroup[pseudo='" + pseudo + "'] .shadowStop[shadow-order=" + index + "]");

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

                                scope.setBoxShadow = function (value) {
                                    value.source = "uiBoxShadowEditor";
                                    scope.pickedBoxShadow = value;
                                    //Trigger watcher on sketchWidgetSetting.boxShadow to apply style to widget
                                    scope.boxShadow = angular.copy(value);
                                }
                            }
                        }
                    }
                }
            }]));
        }
    }
);