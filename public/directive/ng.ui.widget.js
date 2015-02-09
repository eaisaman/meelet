define(
    ["angular", "jquery", "hammer"],
    function () {
        var inject = ["$http", "$timeout", "$q", "$parse", "$compile", "angularConstants", "angularEventTypes", "appService", "uiUtilService", "uiService"];

        return function (appModule, extension, opts) {
            appModule.directive("uiWidget", _.union(inject, [function ($http, $timeout, $q, $parse, $compile, angularConstants, angularEventTypes, appService, uiUtilService, uiService) {
                'use strict';

                var defaults = {
                        elementZIndex: 99
                    },
                    options = _.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                        dockAlign: "=",
                        isPlaying: "=",
                        widgetLibraryList: "=",
                        pickedArtifact: "=",
                        pickedLibrary: "=",
                        project: "=",
                        showDemo: "&"
                    },
                    replace: false,
                    templateUrl: "include/_widget.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                options = _.extend(_.clone(options), $parse(attrs['uiWidgetOpts'])(scope, {}));
                                options.containerClass = angularConstants.widgetClasses.containerClass;
                                options.holderClass = angularConstants.widgetClasses.holderClass;
                                options.widgetClass = angularConstants.widgetClasses.widgetClass;
                                options.hoverClass = angularConstants.widgetClasses.hoverClass;
                            },
                            post: function (scope, element, attrs) {
                                var $widgetElement;

                                function addWidgetHandler(event) {
                                    if (scope.pickerPaneWidget) {
                                        var $container = $("." + options.containerClass);

                                        if (event.type === "panstart") {
                                            $widgetElement = $("<div />");

                                            $widgetElement.text(scope.pickerPaneWidget.name);
                                            $widgetElement.addClass("pickerPaneWidget fs-x-medium").css("z-index", options.elementZIndex);
                                            $widgetElement.css("left", event.srcEvent.clientX - $container.offset().left);
                                            $widgetElement.css("top", event.srcEvent.clientY - $container.offset().top);
                                            $widgetElement.appendTo($container);
                                        } else if (event.type === "panmove") {
                                            var $to = $(event.srcEvent.toElement);

                                            $widgetElement.css("left", event.srcEvent.clientX - $container.offset().left);
                                            $widgetElement.css("top", event.srcEvent.clientY - $container.offset().top);

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
                                                x = event.srcEvent.clientX - $to.offset().left,
                                                y = event.srcEvent.clientY - $to.offset().top;

                                            x = Math.floor(x * angularConstants.precision) / angularConstants.precision;
                                            y = Math.floor(y * angularConstants.precision) / angularConstants.precision;

                                            if (!scope.isPlaying && ($to.hasClass(options.holderClass) || $to.hasClass(options.widgetClass))) {
                                                var version = scope.pickedArtifact.versionList[scope.pickedArtifact.versionList.length - 1].name;

                                                appService.loadRepoArtifact(scope.pickedArtifact, scope.pickedLibrary.name, version).then(function (widgetSpec) {
                                                    uiService.createRepoWidget($to, scope.project._id, widgetSpec);
                                                });
                                            }

                                            $widgetElement.remove();
                                            $("." + options.holderClass).find("." + options.hoverClass).removeClass(options.hoverClass);
                                        }
                                    }
                                }

                                scope.pickWidget = function (artifact, widgetLibrary, event) {
                                    event && event.stopPropagation();

                                    scope.pickerPaneWidget = null;
                                    scope.pickedPane = artifact;
                                    scope.pickedArtifact = artifact;
                                    scope.pickedLibrary = widgetLibrary;
                                    $timeout(function () {
                                        scope.pickerPaneWidget = scope.pickedPane;
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

                                scope.showArtifactDemo = function (artifact, widgetLibrary, event) {
                                    event && event.stopPropagation();

                                    scope.pickWidget(artifact, widgetLibrary);
                                    $timeout(function () {
                                        scope.showDemo && scope.showDemo();
                                    });

                                    return true;
                                }

                                appService.loadWidgetArtifactList();

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