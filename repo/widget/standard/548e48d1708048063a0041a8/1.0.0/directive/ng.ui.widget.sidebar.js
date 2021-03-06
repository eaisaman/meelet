define(
    ["angular", "jquery"],
    function () {
        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            var inject = ["$http", "$timeout", "$q", "$parse", "angularConstants", "angularEventTypes", "utilService"],
                name = "uiWidgetSideBar",
                version = "1.0.0",
                directive = name + version.replace(/\./g, ""),
                directiveService = name + version.replace(/\./g, "") + "Directive";

            if (!$injector.has(directiveService)) {
                $compileProvider.directive(directive, _.union(inject, [function ($http, $timeout, $q, $parse, angularConstants, angularEventTypes, utilService) {
                    'use strict';

                    var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                    return {
                        restrict: "A",
                        scope: {
                            /**
                             * Valid states include '*', 'select'.
                             */
                            state: "@",
                            isPlaying: "=?",
                            /* Valid transitions include 'slideInOnTop', 'reveal', 'slideAlong', 'reverseSlideOut', 'scaleDownPusher',
                             * 'scaleUp', 'scaleRotatePusher', 'openDoor', 'fallDown', 'rotatePusher', 'rotateIn3D', 'rotateOut3D', 'delayed3DRotate'
                             * */
                            transition: "=?",
                            side: "=?",//Support 'leftSide', 'rightSide'
                            overlay: "=?"//Support 'overlay', ''. Whether add overlay shadow when the side bar is open.
                        },
                        replace: true,
                        transclude: true,
                        templateUrl: (directiveUrl || "") + "/include/_widget_sidebar.html",
                        compile: function (element, attrs) {
                            return {
                                pre: function (scope, element, attrs, ctrl) {
                                    extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                        element: element,
                                        scope: scope
                                    }));

                                    function checkState() {
                                        scope.deregisterWatchState && scope.deregisterWatchState();
                                        scope.deregisterWatchState = null;

                                        var defer = $q.defer();

                                        $timeout(function () {
                                            if (element.find("> ._widget_sideBarContainer").hasClass("select")) {
                                                scope.state = "select";
                                            } else {
                                                scope.state = "*";
                                            }
                                            var $container = element.closest("." + angularConstants.widgetClasses.widgetContainerClass),
                                                $widget = $container.parent(),
                                                widgetObj = $widget.data("widgetObject");

                                            widgetObj && widgetObj.setState && widgetObj.setState(scope.state);

                                            scope.deregisterWatchState = createStateWatch();
                                            defer.resolve();
                                        });

                                        return defer.promise;
                                    }

                                    function createStateWatch() {
                                        return scope.$watch("state", function (value) {
                                            if (value != null) {
                                                scope.toggleSelect("> ._widget_sideBarContainer", null, value === "select");
                                            }
                                        });
                                    }

                                    scope.toggleSideBar = function (event) {
                                        function toggleHandler() {
                                            return scope.toggleSelect("> ._widget_sideBarContainer", event).then(function () {
                                                return checkState();
                                            });
                                        }

                                        if (scope.isPlaying == null || scope.isPlaying) {
                                            var widgetObj = $(event.target).data("widgetObject") || element.closest(".widgetContainer").parent().data("widgetObject");

                                            if (widgetObj) {
                                                return $timeout(function () {
                                                    widgetObj.handleEventOnce(toggleHandler)();
                                                });
                                            } else {
                                                return toggleHandler();
                                            }
                                        }
                                    }

                                    scope.hideSideBar = function (event) {
                                        function hideHandler() {
                                            return scope.toggleSelect("> ._widget_sideBarContainer", event, false).then(function () {
                                                return checkState();
                                            });
                                        }

                                        if (scope.isPlaying == null || scope.isPlaying) {
                                            var widgetObj = $(event.target).data("widgetObject") || element.closest(".widgetContainer").parent().data("widgetObject");

                                            if (widgetObj) {
                                                return $timeout(function () {
                                                    widgetObj.handleEventOnce(hideHandler)();
                                                });
                                            } else {
                                                return hideHandler();
                                            }
                                        }
                                    }

                                    scope.transition = scope.transition || "slideInOnTop";
                                    scope.side = scope.side || "leftSide";
                                    scope.overlay = scope.overlay || "overlay";
                                    scope.deregisterWatchState = createStateWatch();

                                    scope.$on('$destroy', function () {
                                        if (scope.deregisterWatchState) {
                                            scope.deregisterWatchState();
                                            scope.deregisterWatchState = null;
                                        }
                                    });
                                },
                                post: function (scope, element, attrs) {
                                    if (element.hasClass(angularConstants.repoWidgetClass)) {
                                        utilService.whilst(function () {
                                                return !(element.closest && element.closest(".widgetContainer").attr("id"));
                                            }, function (err) {
                                                if (!err) {
                                                    //id of widget of RepoSketchWidgetClass type
                                                    scope.widgetId = element.closest(".widgetContainer").parent().attr("id");
                                                    utilService.broadcast(scope, angularConstants.widgetEventPattern.format(angularEventTypes.widgetContentIncludedEvent, scope.widgetId), {
                                                        widgetId: scope.widgetId,
                                                        widgetScope: scope,
                                                        $element: element.closest(".widgetContainer").parent()
                                                    });
                                                }
                                            },
                                            angularConstants.checkInterval,
                                            "ui-widget-sidebar.compile.post" + new Date().getTime()
                                        )
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