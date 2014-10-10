define(
    ["angular", "jquery", "hammer"],
    function () {
        var inject = ["$http", "$timeout", "$q", "$parse", "$compile", "angularEventTypes", "uiUtilService", "uiService"];

        return function (appModule, extension, opts) {
            appModule.directive("uiShape", _.union(inject, [function ($http, $timeout, $q, $parse, $compile, angularEventTypes, uiUtilService, uiService) {
                'use strict';

                var boundProperties = {pickedShape: "="},
                    defaults = {
                        shapeJson: "",
                        shapes: [
                            {group: "Regular", list: ["circle-shape", "square-shape"]},
                            {group: "Arrows", list: [
                                "arrow-left",
                                "arrow-right",
                                "arrow-up",
                                "arrow-down",
                                "simple-arrow-left",
                                "simple-arrow-right",
                                "simple-arrow-up",
                                "simple-arrow-down",
                                "thick-arrow-left",
                                "thick-arrow-right",
                                "thick-arrow-up",
                                "thick-arrow-down",
                                "inner-arrow-left",
                                "inner-arrow-right",
                                "inner-arrow-up",
                                "inner-arrow-down",
                                "nav-arrow-nw",
                                "nav-arrow-ne",
                                "nav-arrow-se",
                                "nav-arrow-sw",
                                "angle-double-left",
                                "angle-double-right",
                                "angle-double-up",
                                "angle-double-down"
                            ]}
                        ],
                        containerClass: "sketchHolder",
                        holderClass: "deviceHolder",
                        widgetClass: "sketchWidget",
                        hoverClass: "widgetHover",
                        elementZIndex: 99
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    templateUrl: "include/_shape.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                scope.$root.$broadcast(angularEventTypes.boundPropertiesEvent, uiUtilService.createDirectiveBoundMap(boundProperties, attrs));

                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {element: element, scope: scope}));

                                options = angular.extend(options, $parse(attrs['uiShapeOpts'])(scope, {}));
                            },
                            post: function (scope, element, attrs) {
                                var $shapeElement;

                                function addWidgetHandler(event) {
                                    if (scope.pickerPaneShape) {
                                        var $el = $(event.target);

                                        if (event.type === "panstart") {

                                            $shapeElement = $("<div />");

                                            $shapeElement.addClass("pickerPaneShape fs-x-medium-before squarePane icon-shape-before").addClass("icon-shape-" + scope.pickerPaneShape + "-before").css("z-index", options.elementZIndex);
                                            $shapeElement.css("left", event.srcEvent.pageX);
                                            $shapeElement.css("top", event.srcEvent.pageY);
                                            $shapeElement.appendTo($("." + options.containerClass));
                                        } else if (event.type === "panmove") {
                                            var $to = $(event.srcEvent.toElement);

                                            $shapeElement.css("left", event.srcEvent.pageX);
                                            $shapeElement.css("top", event.srcEvent.pageY);

                                            if ($to.hasClass(options.widgetClass)) {
                                                if (!$to.hasClass(options.hoverClass)) {
                                                    $("." + options.holderClass).find("." + options.hoverClass).removeClass(options.hoverClass);
                                                    $to.addClass(options.hoverClass);
                                                }
                                            } else if ($to.hasClass(options.holderClass)) {
                                                $("." + options.holderClass).find("." + options.hoverClass).removeClass(options.hoverClass);
                                            }
                                        } else if (event.type === "panend") {
                                            var $to = $(event.srcEvent.toElement),
                                                x = event.srcEvent.pageX - $to.offset().left,
                                                y = event.srcEvent.pageY - $to.offset().top;

                                            if ($to.hasClass(options.holderClass) || $to.hasClass(options.widgetClass)) {
                                                var widgetObj = createWidget($to);

                                                widgetObj.css("left", x);
                                                widgetObj.css("top", y);
                                            }

                                            $shapeElement.remove();
                                            $("." + options.holderClass).find("." + options.hoverClass).removeClass(options.hoverClass);
                                        }
                                    }
                                }

                                function createWidget(containerElement) {
                                    var widgetObj = uiService.createWidget(containerElement);

                                    if (scope.pickerPaneShape === "circle-shape") {
                                        widgetObj.css({"border-radius": "100%"});
                                    } else if (scope.pickerPaneShape === "square-shape") {
                                    } else {
                                        widgetObj.addClass("fs-x-medium-before squarePane icon-shape-before").addClass("icon-shape-" + scope.pickerPaneShape + "-before").addClass("pseudoShape");
                                    }
                                    widgetObj.addClass(options.widgetClass);

                                    return widgetObj;
                                }

                                scope.pickShape = function (value) {
                                    scope.pickerPaneShape = "";
                                    scope.pickedPane = value;
                                    $timeout(function () {
                                        scope.pickerPaneShape = scope.pickedPane;
                                    });

                                    return true;
                                };

                                scope.togglePalette = function (event) {
                                    event && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if ($wrapper.hasClass("expanded")) {
                                        scope.toggleDisplay($panel).then(function () {
                                            return scope.toggleExpand($wrapper);
                                        });
                                    } else {
                                        scope.toggleExpand($wrapper).then(function () {
                                            return scope.toggleDisplay($panel);
                                        });
                                    }
                                }

                                if (options.shapeJson) {
                                    $http.get(options.shapeJson).then(function (result) {
                                        scope.shapes = result.data;
                                        if (scope.shapes && scope.shapes.length) {
                                            scope.pickShape(scope.shapes[0] && scope.shapes[0].list.length && scope.shapes[0].list[0] || "");
                                        }
                                    });
                                } else {
                                    scope.shapes = options.shapes || [];
                                    if (scope.shapes && scope.shapes.length) {
                                        scope.pickShape(scope.shapes[0] && scope.shapes[0].list.length && scope.shapes[0].list[0] || "");
                                    }
                                }

                                var mc = new Hammer.Manager(element.find(".pickerPane").get(0));
                                mc.add(new Hammer.Pan({threshold: 0, pointers: 0}));
                                mc.on("panstart panmove panend", addWidgetHandler);

                                scope.$on('$destroy', function () {
                                    mc.off("panstart panmove panend", addWidgetHandler);
                                });

                                $timeout(function () {
                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    $wrapper.addClass("expanded");
                                    $panel.addClass("show");
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);