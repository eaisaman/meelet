define(
    ["angular", "jquery", "hammer"],
    function () {
        var inject = ["$http", "$timeout", "$q", "$parse", "$compile", "angularEventTypes", "appService", "uiUtilService", "uiService"];

        return function (appModule, extension, opts) {
            appModule.directive("uiShape", _.union(inject, [function ($http, $timeout, $q, $parse, $compile, angularEventTypes, appService, uiUtilService, uiService) {
                'use strict';

                var boundProperties = {},
                    defaults = {
                        containerClass: "sketchHolder",
                        holderClass: "deviceHolder",
                        widgetClass: "sketchWidget",
                        hoverClass: "widgetHover",
                        elementZIndex: 99
                    },
                    options = _.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({
                        dockAlign: "=",
                        pickedShape: "=",
                        isPlaying: "=",
                        iconLibraryList: "="
                    }, boundProperties),
                    replace: false,
                    templateUrl: "include/_shape.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                scope.$root.$broadcast(angularEventTypes.boundPropertiesEvent, uiUtilService.createDirectiveBoundMap(boundProperties, attrs));

                                options = _.extend(_.clone(options), $parse(attrs['uiShapeOpts'])(scope, {}));
                            },
                            post: function (scope, element, attrs) {
                                var $shapeElement;

                                function addWidgetHandler(event) {
                                    if (scope.pickerPaneShape) {
                                        var $el = $(event.target);

                                        if (event.type === "panstart") {

                                            $shapeElement = $("<div />");

                                            $shapeElement.addClass("pickerPaneShape fs-x-medium-before squarePane").addClass(scope.pickerPaneShape.shapeStyle.classList.join(" ")).css(scope.pickerPaneShape.shapeStyle.style).css("z-index", options.elementZIndex);
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

                                            x = Math.floor(x * 100) / 100, y = Math.floor(y * 100) / 100;

                                            if (!scope.isPlaying && ($to.hasClass(options.holderClass) || $to.hasClass(options.widgetClass))) {
                                                var widgetObj = createWidget($to);

                                                widgetObj.css("left", x + "px");
                                                widgetObj.css("top", y + "px");
                                            }

                                            $shapeElement.remove();
                                            $("." + options.holderClass).find("." + options.hoverClass).removeClass(options.hoverClass);
                                        }
                                    }
                                }

                                function createWidget(containerElement) {
                                    var widgetObj = uiService.createWidget(containerElement);

                                    widgetObj.addClass(scope.pickerPaneShape.shapeStyle.classList.join(" "));
                                    widgetObj.css(scope.pickerPaneShape.shapeStyle.style);
                                    widgetObj.addClass(options.widgetClass);

                                    return widgetObj;
                                }

                                scope.pickShape = function (value) {
                                    scope.pickerPaneShape = null;
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

                                appService.loadIconArtifactList();

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