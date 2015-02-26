define(
    ["angular", "jquery", "hammer"],
    function () {
        var inject = ["$http", "$timeout", "$q", "$parse", "$compile", "angularConstants", "angularEventTypes", "appService", "uiUtilService", "uiService"];

        return function (appModule, extension, opts) {
            appModule.directive("uiShape", _.union(inject, [function ($http, $timeout, $q, $parse, $compile, angularConstants, angularEventTypes, appService, uiUtilService, uiService) {
                'use strict';

                var defaults = {},
                    options = _.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                        dockAlign: "=",
                        isPlaying: "=",
                        iconLibraryList: "="
                    },
                    replace: false,
                    templateUrl: "include/_shape.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                appService.loadIconArtifactList();

                                options = _.extend(_.clone(options), $parse(attrs['uiShapeOpts'])(scope, {}));
                                options.containerClass = angularConstants.widgetClasses.containerClass;
                                options.holderClass = angularConstants.widgetClasses.holderClass;
                                options.widgetClass = angularConstants.widgetClasses.widgetClass;
                                options.hoverClass = angularConstants.widgetClasses.hoverClass;
                                options.elementZIndex = angularConstants.draggingShapeZIndex;
                            },
                            post: function (scope, element, attrs) {
                                var $shapeElement;

                                function addWidgetHandler(event) {
                                    if (scope.pickerPaneShape) {
                                        var $container = $("." + options.containerClass);

                                        if (event.type === "panstart") {

                                            $shapeElement = $("<div />");

                                            $shapeElement.addClass("pickerPaneShape fs-x-medium-before squarePane")
                                                .addClass(scope.getIconClassList(scope.pickerPaneShape.iconLibrary.name, scope.pickerPaneShape.artifact.name, scope.pickerPaneShape.icon, 'before').join(" "))
                                                .css("z-index", options.elementZIndex);
                                            $shapeElement.css("left", event.srcEvent.clientX - $container.offset().left);
                                            $shapeElement.css("top", event.srcEvent.clientY - $container.offset().top);
                                            $shapeElement.appendTo($("." + options.containerClass));
                                        } else if (event.type === "panmove") {
                                            var $to = $(event.srcEvent.toElement);

                                            $shapeElement.css("left", event.srcEvent.clientX - $container.offset().left);
                                            $shapeElement.css("top", event.srcEvent.clientY - $container.offset().top);

                                            if ($to.hasClass(options.widgetClass)) {
                                                if (!$to.hasClass(options.hoverClass)) {
                                                    $("." + options.holderClass).find("." + options.hoverClass).removeClass(options.hoverClass);
                                                    $to.addClass(options.hoverClass);
                                                }
                                            } else if ($to.hasClass(options.holderClass)) {
                                                $("." + options.holderClass).find("." + options.hoverClass).removeClass(options.hoverClass);
                                            }
                                        } else if (event.type === "panend") {
                                            $shapeElement.remove();
                                            $("." + options.holderClass).find("." + options.hoverClass).removeClass(options.hoverClass);

                                            var $to = $(event.srcEvent.toElement);

                                            if ($to.hasClass(options.widgetClass) || $to.hasClass(options.holderClass)) {
                                                var x = event.srcEvent.clientX - $to.offset().left,
                                                    y = event.srcEvent.clientY - $to.offset().top;

                                                x = Math.floor(x * angularConstants.precision) / angularConstants.precision;
                                                y = Math.floor(y * angularConstants.precision) / angularConstants.precision;

                                                if (!scope.isPlaying) {
                                                    uiUtilService.broadcast(scope,
                                                        angularEventTypes.beforeWidgetCreationEvent,
                                                        function (name) {
                                                            if (name) {
                                                                var widgetObj = createWidget($to);
                                                                widgetObj.name = name;

                                                                if (widgetObj) {
                                                                    widgetObj.css("left", x + "px");
                                                                    widgetObj.css("top", y + "px");
                                                                }
                                                            }
                                                        }
                                                    );
                                                }
                                            }
                                        }
                                    }
                                }

                                function createWidget(containerElement) {
                                    var widgetObj = uiService.createWidget(containerElement);

                                    if (widgetObj) {
                                        widgetObj.addOmniClass("pseudoShape")
                                            .addOmniClass(scope.getIconClassList(scope.pickerPaneShape.iconLibrary.name, scope.pickerPaneShape.artifact.name, scope.pickerPaneShape.icon, 'before').join(" "));
                                    }

                                    return widgetObj;
                                }

                                scope.pickShape = function (iconLibrary, artifact, icon) {
                                    scope.pickerPaneShape = null;
                                    scope.pickedPane = {iconLibrary: iconLibrary, artifact: artifact, icon: icon};
                                    $timeout(function () {
                                        scope.pickerPaneShape = scope.pickedPane;
                                    });

                                    return true;
                                };

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