define(
    ["angular", "jquery"],
    function () {
        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            var inject = ["$http", "$timeout", "$q", "$parse", "angularConstants", "angularEventTypes", "uiUtilService"],
                name = "uiWidgetModalWindow",
                version = "1.0.0",
                directive = name + version.replace(/\./g, ""),
                directiveService = name + version.replace(/\./g, "") + "Directive";

            if (!$injector.has(directiveService)) {
                $compileProvider.directive(directive, _.union(inject, [function ($http, $timeout, $q, $parse, angularConstants, angularEventTypes, uiUtilService) {
                    'use strict';

                    var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                    return {
                        restrict: "A",
                        scope: {
                            /**
                             * Valid states include '*', 'show'.
                             */
                            state: "@",
                            isPlaying: "=",
                            /**
                             * Valid transitions include 'fadeInScaleUp', 'slideFromRight', 'slideFromBottom', 'newspaper', 'fall', 'sideFall',
                             * 'slideStickTop', 'flipHorizontal3D', 'flipVertical3D', 'sign3D', 'superScaled', 'justMe', 'slit3D', 'rotateFromBottom3D',
                             * 'rotateFromLeft3D', 'blur', 'slideFromBottomPerspective', 'slideFromRightPerspective', 'slipFromTopPerspective'
                             */
                            transition: "=?",
                            setPerspective: "=?" //Support true, false. Special modal that will add a perspective class to the html element.
                        },
                        replace: true,
                        transclude: true,
                        templateUrl: (directiveUrl || "") + "/include/_widget_modal_window.html",
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
                                            if (element.find(".md-modal").hasClass("show")) {
                                                scope.state = "show";
                                            } else {
                                                scope.state = "*";
                                            }
                                            var $container = element.closest("." + angularConstants.widgetClasses.widgetContainerClass),
                                                $widget = $container.parent(),
                                                widgetObj = $widget.data("widgetObject");

                                            widgetObj && widgetObj.setState(scope.state);

                                            scope.deregisterWatchState = createStateWatch();
                                            defer.resolve();
                                        });

                                        return defer.promise;
                                    }

                                    function createStateWatch() {
                                        return scope.$watch("state", function (value) {
                                            if (value != null) {
                                                scope.toggleDisplay('.md-modal', null, value === "show");
                                            }
                                        });
                                    }

                                    scope.toggleModalWindow = function (event) {
                                        if ((scope.isPlaying == null || scope.isPlaying) && !event.originalEvent.defaultPrevented) {
                                            scope.toggleDisplay('.md-modal', event).then(function () {
                                                return checkState();
                                            });
                                        }
                                    }

                                    scope.transition = scope.transition || "fadeInScaleUp";
                                    scope.setPerspective = scope.setPerspective || false;
                                    scope.modalContentWidth = scope.modalContentWidth || "50%";
                                    scope.modalContentHeight = scope.modalContentHeight || "50%";
                                    scope.deregisterWatchState = createStateWatch();
                                },
                                post: function (scope, element, attrs) {
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
                                            "ui-widget-modal-window.compile.post" + new Date().getTime()
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