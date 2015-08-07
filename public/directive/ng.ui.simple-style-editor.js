define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "$exceptionHandler", "angularEventTypes", "angularConstants", "uiUtilService"];

            appModule.directive("uiSimpleStyleEditor", _.union(inject, [function ($http, $timeout, $q, $exceptionHandler, angularEventTypes, angularConstants, uiUtilService) {
                'use strict';

                var boundProperties = {simpleStyle: "="},
                    defaults = {
                        fontSize: "10px",
                        opacity: 1,
                        left: "0px",
                        top: "0px"
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "=", pseudo: "="}, boundProperties),
                    replace: false,
                    transclude: false,
                    templateUrl: "include/_simple-style-editor.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                scope.pickFontSizeValue = function (pseudo) {
                                    return scope.simpleStyle && scope.pickStyle(scope.simpleStyle, pseudo != null ? pseudo : scope.pseudo)["font-size"] || options.fontSize;
                                }

                                scope.pickOpacityValue = function (pseudo) {
                                    if (scope.simpleStyle) {
                                        var value = scope.pickStyle(scope.simpleStyle, pseudo != null ? pseudo : scope.pseudo)["opacity"];
                                        if (value != null)
                                            return value;
                                    }

                                    return options.opacity;
                                }

                                scope.pickPseudoLeftValue = function (pseudo) {
                                    return scope.simpleStyle && scope.pickStyle(scope.simpleStyle, pseudo != null ? pseudo : scope.pseudo)["left"] || options.left;
                                }

                                scope.pickPseudoTopValue = function (pseudo) {
                                    return scope.simpleStyle && scope.pickStyle(scope.simpleStyle, pseudo != null ? pseudo : scope.pseudo)["top"] || options.top;
                                }

                                scope.setFontSize = function (value) {
                                    var m = (value || "").match(/([-\d\.]+)px$/);
                                    if (m && m.length == 2) {
                                        var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                        pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                        scope.simpleStyle[pseudoStylePrefix] = scope.simpleStyle[pseudoStylePrefix] || {};
                                        var pseudoStyle = scope.simpleStyle[pseudoStylePrefix];

                                        if (pseudoStyle['font-size'] == null || pseudoStyle['font-size'] != value) {
                                            pseudoStyle['font-size'] = value;

                                            //Trigger watcher on sketchWidgetSetting.simpleStyle to apply style to widget
                                            scope.simpleStyle = angular.copy(scope.simpleStyle);

                                            if (scope.pickedFontSize !== value) scope.pickedFontSize = value;
                                        }
                                    }
                                }

                                scope.setOpacity = function (value) {
                                    if (value != null) {
                                        value = Number.parseFloat(value);

                                        if (!Number.isNaN(value)) {
                                            var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                            pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                            scope.simpleStyle[pseudoStylePrefix] = scope.simpleStyle[pseudoStylePrefix] || {};
                                            var pseudoStyle = scope.simpleStyle[pseudoStylePrefix];

                                            if (pseudoStyle['opacity'] == null || pseudoStyle['opacity'] != value) {
                                                pseudoStyle['opacity'] = value;

                                                //Trigger watcher on sketchWidgetSetting.simpleStyle to apply style to widget
                                                scope.simpleStyle = angular.copy(scope.simpleStyle);

                                                if (scope.pickedOpacity !== value) scope.pickedOpacity = value;
                                            }
                                        }
                                    }
                                }

                                scope.setLeft = function (value) {
                                    //Only pseudo element's left can be configured here
                                    if (scope.pseudo) {
                                        var m = (value || "").match(/([-\d\.]+)px$/);
                                        if (m && m.length == 2) {
                                            var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                            pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                            scope.simpleStyle[pseudoStylePrefix] = scope.simpleStyle[pseudoStylePrefix] || {};
                                            var pseudoStyle = scope.simpleStyle[pseudoStylePrefix];

                                            if (pseudoStyle['left'] == null || pseudoStyle['left'] != value) {
                                                pseudoStyle['left'] = value;

                                                //Trigger watcher on sketchWidgetSetting.simpleStyle to apply style to widget
                                                scope.simpleStyle = angular.copy(scope.simpleStyle);

                                                if (scope.pickedLeft !== value) scope.pickedLeft = value;
                                            }
                                        }
                                    }
                                }

                                scope.setTop = function (value) {
                                    //Only pseudo element's top can be configured here
                                    if (scope.pseudo) {
                                        var m = (value || "").match(/([-\d\.]+)px$/);
                                        if (m && m.length == 2) {
                                            var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                            pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                            scope.simpleStyle[pseudoStylePrefix] = scope.simpleStyle[pseudoStylePrefix] || {};
                                            var pseudoStyle = scope.simpleStyle[pseudoStylePrefix];

                                            if (pseudoStyle['top'] == null || pseudoStyle['top'] != value) {
                                                pseudoStyle['top'] = value;

                                                //Trigger watcher on sketchWidgetSetting.simpleStyle to apply style to widget
                                                scope.simpleStyle = angular.copy(scope.simpleStyle);

                                                if (scope.pickedTop !== value) scope.pickedTop = value;
                                            }
                                        }
                                    }
                                }

                                uiUtilService.broadcast(scope,
                                    angularEventTypes.boundPropertiesEvent,
                                    uiUtilService.createDirectiveBoundMap(
                                        boundProperties,
                                        attrs,
                                        {
                                            simpleStyle: function (value) {
                                                scope.pickedFontSize = scope.pickFontSizeValue();
                                                scope.pickedOpacity = scope.pickOpacityValue();
                                                scope.pickedLeft = scope.pickPseudoLeftValue();
                                                scope.pickedTop = scope.pickPseudoTopValue();
                                            }
                                        },
                                        {simpleStyle: "uiSimpleStyleEditor"}
                                    )
                                );

                                scope.styleIsSet = true;
                            },
                            post: function (scope, element, attrs) {
                                scope.pseudoChangeWatcher = scope.$on(angularEventTypes.widgetPseudoChangeEvent, function (event, pseudo) {
                                    scope.styleIsSet = false;
                                    $timeout(function () {
                                        scope.styleIsSet = true;
                                        scope.pickedFontSize = scope.pickFontSizeValue(pseudo);
                                        scope.pickedOpacity = scope.pickOpacityValue(pseudo);
                                        scope.pickedLeft = scope.pickPseudoLeftValue(pseudo);
                                        scope.pickedTop = scope.pickPseudoTopValue(pseudo);
                                    });
                                });

                                scope.$on('$destroy', function () {
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