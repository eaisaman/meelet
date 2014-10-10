define(
    ["angular", "jquery", "hammer"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "uiService", "uiUtilService"];

            appModule.directive("uiToolbar", _.union(inject, [function ($timeout, $q, uiService, uiUtilService) {
                'use strict';

                var boundProperties = {pickedWidget: "="},
                    defaults = {
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "=", treeNodeIdPrefix: "="}, boundProperties),
                    replace: true,
                    templateUrl: "include/_toolbar.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {element: element, scope: scope}));
                            },
                            post: function (scope, element, attrs) {
                                scope.expandWidget = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.pickedWidget;

                                    if (widgetObj && widgetObj.isElement && !widgetObj.isTemporary) {
                                    }
                                }

                                scope.locateWidget = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.pickedWidget;

                                    if (widgetObj && widgetObj.isElement) {
                                        var nodeScope = angular.element($("#" + scope.treeNodeIdPrefix + widgetObj.id)).scope();
                                        nodeScope.selected = true;
                                    }
                                }

                                scope.duplicateWidget = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.pickedWidget;

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

                                    var widgetObj = scope.pickedWidget;

                                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                                        widgetObj.alignLeft && widgetObj.alignLeft();
                                    }
                                }

                                scope.alignCenter = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.pickedWidget;

                                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                                        widgetObj.alignCenter && widgetObj.alignCenter();
                                    }
                                }

                                scope.alignRight = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.pickedWidget;

                                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                                        widgetObj.alignRight && widgetObj.alignRight();
                                    }
                                }

                                scope.groupWidget = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.pickedWidget;

                                    if (widgetObj && widgetObj.isElement && widgetObj.isTemporary) {
                                        widgetObj.setTemporary(false);
                                    }
                                }

                                scope.ungroupWidget = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var widgetObj = scope.pickedWidget;

                                    if (widgetObj && widgetObj.isElement) {
                                        widgetObj.disassemble();
                                    }
                                }

                            }
                        }
                    }
                }
            }]));
        }
    }
);