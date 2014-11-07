define(
    ["angular", "jquery", "hammer"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "angularEventTypes", "uiService", "uiUtilService", "appService"];

            appModule.directive("uiToolbar", _.union(inject, [function ($timeout, $q, angularEventTypes, uiService, uiUtilService, appService) {
                'use strict';

                var boundProperties = {scale: "="},
                    defaults = {},
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({
                        dockAlign: "=",
                        sketchObject: "=",
                        treeNodeIdPrefix: "=",
                        isPlaying: "="
                    }, boundProperties),
                    replace: true,
                    templateUrl: "include/_toolbar.html",
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
                                        attrs)
                                );
                            },
                            post: function (scope, element, attrs) {
                                scope.zoomWidget = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.sketchObject.pickedPage && scope.sketchObject.pickedPage.$element) {
                                        var id = scope.zoomId,
                                            widgetObj;

                                        if (id) {
                                            widgetObj = $("#" + id).data("widgetObject");

                                            widgetObj && widgetObj.zoomOut && widgetObj.zoomOut();
                                            scope.scale = undefined;
                                            scope.zoomId = null;
                                        } else {
                                            widgetObj = scope.sketchObject.pickedWidget;

                                            if (widgetObj && widgetObj.isElement && !widgetObj.isTemporary) {
                                                scope.scale = widgetObj.zoomIn(scope.sketchObject.pickedPage.$element);
                                                scope.zoomId = widgetObj.id;
                                            }
                                        }
                                    }
                                }

                                scope.locateWidget = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.sketchObject.pickedWidget;

                                    if (widgetObj && widgetObj.isElement && !widgetObj.isTemporary) {
                                        var nodeScope = angular.element($("#" + scope.treeNodeIdPrefix + widgetObj.id)).scope();
                                        if (nodeScope) {
                                            nodeScope.exclusiveSelect && nodeScope.exclusiveSelect();
                                            nodeScope.expandVisible && nodeScope.expandVisible();
                                        }
                                    }
                                }

                                scope.duplicateWidget = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.sketchObject.pickedWidget;

                                    if (widgetObj && widgetObj.isElement) {
                                        var $parent = widgetObj.$element.parent();
                                        if ($parent.length) {
                                            var cloneObj = uiService.copyWidget(widgetObj, $parent),
                                                left = ($parent.width() - cloneObj.$element.width()) / 2,
                                                top = ($parent.height() - cloneObj.$element.height()) / 2;

                                            left = Math.floor(left * 100) / 100, top = Math.floor(top * 100) / 100;

                                            cloneObj.css("left", left + "px");
                                            cloneObj.css("top", top + "px");

                                            $timeout(function () {
                                                var manager = cloneObj.$element.data("hammer"),
                                                    element = cloneObj.$element.get(0);

                                                manager.emit("tap", {target: element, srcEvent: {target: element}});
                                            });
                                        }
                                    }
                                }

                                scope.alignLeft = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.sketchObject.pickedWidget;

                                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                                        widgetObj.alignLeft && widgetObj.alignLeft();
                                    }
                                }

                                scope.alignCenter = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.sketchObject.pickedWidget;

                                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                                        widgetObj.alignCenter && widgetObj.alignCenter();
                                    }
                                }

                                scope.alignRight = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.sketchObject.pickedWidget;

                                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                                        widgetObj.alignRight && widgetObj.alignRight();
                                    }
                                }

                                scope.groupWidget = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.sketchObject.pickedWidget;

                                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                                        widgetObj.setTemporary(false);
                                    }
                                }

                                scope.ungroupWidget = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.sketchObject.pickedWidget;

                                    if (widgetObj && widgetObj.isElement) {
                                        widgetObj.disassemble();
                                    }
                                }

                                scope.togglePlayWidget = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.isPlaying = !scope.isPlaying;
                                }

                                scope.saveSketch = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    return appService.saveSketch(scope.sketchObject.sketchWorks);
                                }

                                scope.loadSketch = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    return appService.loadSketch(scope.sketchObject.sketchWorks);
                                }
                            }
                        }
                    }
                }
            }]));
        }
    }
);