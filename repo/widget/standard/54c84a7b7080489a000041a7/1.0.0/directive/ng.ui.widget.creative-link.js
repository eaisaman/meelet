define(
    ["angular", "jquery"],
    function () {
        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            var inject = ["$http", "$timeout", "$q", "$parse", "$compile", "angularConstants", "angularEventTypes", "uiUtilService"],
                name = "uiWidgetCreativeLink",
                version = "1.0.0",
                directive = name + version.replace(/\./g, ""),
                directiveService = name + version.replace(/\./g, "") + "Directive",
                controllerService = name + version.replace(/\./g, "") + "Controller";

            if (!$injector.has(directiveService)) {
                $controllerProvider.
                    register(controllerService, ['$scope', '$transclude', '$q', '$timeout', 'angularConstants', 'uiUtilService', function ($scope, $transclude, $q, $timeout, angularConstants, uiUtilService) {
                        //This widget need copy of transcluded element to render transition effect.
                        //If the element has widget anchor attribute, the copied one must have anchor different from the original.
                        this.transclude = function (directiveScope, element) {
                            $transclude && $transclude(function (clone) {
                                for (var i = 0; i < clone.length; ++i) {
                                    if (clone[i].nodeType === 1 /* element */ || clone[i].nodeType === 9 /* document */) {
                                        var $el = angular.element(clone[i]);

                                        directiveScope.linkTitle = $el.text();
                                    }
                                }
                            });
                        }
                    }]);

                $compileProvider.directive(directive, _.union(inject, [function ($http, $timeout, $q, $parse, $compile, angularConstants, angularEventTypes, uiUtilService) {
                    'use strict';

                    var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                    return {
                        restrict: "A",
                        controller: controllerService,
                        scope: {
                            /**
                             * Valid states include '*', 'select'.
                             */
                            state: "=?",
                            isPlaying: "=?",
                            linkTitle: "=?",
                            stateGroup: "=?",
                            /**
                             * Valid effect values include 'brackets', 'slideUpLine', 'slideDownLine', 'slideUpSecondLine',
                             * 'translateLine', 'slightTranslateLine', 'reveal', 'switchLine',
                             * 'scaleDown', 'fallDown', 'fadeOut', 'flipUp', 'slightTranslate'
                             */
                            effect: "@"
                        },
                        replace: true,
                        transclude: true,
                        templateUrl: (directiveUrl || "") + "/include/_widget_creative_link.html",
                        compile: function (element, attrs) {
                            return {
                                pre: function (scope, element, attrs, ctrl) {
                                    extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                        element: element,
                                        scope: scope
                                    }));

                                    scope.toggleState = function (event) {
                                        event && event.stopPropagation && event.stopPropagation();

                                        if (scope.isPlaying == null || scope.isPlaying) {
                                            if (scope.configuration.stateGroup || scope.stateGroup && scope.widgetId) {
                                                uiUtilService.broadcast(scope, angularConstants.stateGroupEventPattern.format(scope.configuration.stateGroup || scope.stateGroup), {
                                                    widgetId: scope.widgetId
                                                });
                                            } else {
                                                scope.state = scope.state === scope.activeState && "*" || scope.activeState;
                                            }
                                        }
                                    }

                                    scope.setStateGroup = function (value) {
                                        scope.configuration.stateGroup = scope.stateGroup = value;

                                        if (scope.widgetId) {
                                            scope.stateGroupListener && scope.stateGroupListener();

                                            if (value) {
                                                scope.stateGroupListener = scope.$on(angularConstants.stateGroupEventPattern.format(scope.configuration.stateGroup || scope.stateGroup), function (event, obj) {
                                                    if (obj.widgetId) {
                                                        if (obj.widgetId === scope.widgetId) {
                                                            scope.state = scope.activeState;
                                                        } else {
                                                            scope.state = "*";
                                                        }
                                                    }
                                                });
                                            } else {
                                                scope.stateGroupListener = null;
                                            }
                                        }
                                    }

                                    scope.state = scope.state || "*";
                                    scope.activeState = scope.activeState || "select";
                                    scope.configuration = {};
                                },
                                post: function (scope, element, attrs, ctrl) {
                                    if (element.hasClass(angularConstants.repoWidgetClass)) {
                                        uiUtilService.whilst(function () {
                                                return !(element.closest && element.closest(".widgetContainer").attr("id"));
                                            }, function (callback) {
                                                callback();
                                            }, function (err) {
                                                if (!err) {
                                                    //id of widget of RepoSketchWidgetClass type
                                                    scope.widgetId = element.closest(".widgetContainer").parent().attr("id");
                                                    uiUtilService.broadcast(scope, angularConstants.widgetEventPattern.format(angularEventTypes.widgetContentIncludedEvent, scope.widgetId), {widgetId: scope.widgetId});
                                                }
                                            },
                                            angularConstants.checkInterval,
                                            "ui-widget-creative-link.compile.post" + new Date().getTime()
                                        )
                                    } else {
                                        ctrl.transclude(scope, element);
                                    }
                                }
                            }
                        }
                    }
                }]));
            }
        }
    }
);