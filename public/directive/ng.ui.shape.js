define(
    ["angular", "jquery", "hammer"],
    function () {
        var inject = ["$rootScope", "$http", "$timeout", "$q", "$parse", "$compile", "angularConstants", "angularEventTypes", "appService", "uiUtilService", "uiService"];

        return function (appModule, extension, opts) {
            appModule.directive("uiShape", _.union(inject, [function ($rootScope, $http, $timeout, $q, $parse, $compile, angularConstants, angularEventTypes, appService, uiUtilService, uiService) {
                'use strict';

                var defaults = {},
                    options = _.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                        dockAlign: "=",
                        isPlaying: "="
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

                                options = _.extend(_.clone(options), $parse(attrs['uiShapeOpts'])(scope, {}));
                                options.containerClass = angularConstants.widgetClasses.containerClass;
                                options.holderClass = angularConstants.widgetClasses.holderClass;
                                options.widgetClass = angularConstants.widgetClasses.widgetClass;
                                options.hoverClass = angularConstants.widgetClasses.hoverClass;
                                options.elementZIndex = angularConstants.draggingShapeZIndex;

                                scope.filterLibraryList = function (libraryList, xrefList) {
                                    return uiUtilService.filterSelection(libraryList, xrefList, [{
                                        target: '_id',
                                        source: 'libraryId'
                                    }]);
                                }

                                scope.filterArtifactList = function (iconLibrary, xrefList) {
                                    return uiUtilService.filterSelection(iconLibrary.artifactList, _.findWhere(xrefList, {libraryId: iconLibrary._id}).artifactList, [{
                                        target: '_id',
                                        source: 'artifactId'
                                    }]);
                                }

                                scope.markLibrarySelection = function (libraryList, xrefList) {
                                    return uiUtilService.markSelection(libraryList, xrefList, [{
                                        target: '_id',
                                        source: 'libraryId'
                                    }]);
                                }

                                scope.markArtifactSelection = function (iconLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: iconLibrary._id}) || {},
                                        artifactList = xref.artifactList;

                                    return uiUtilService.markSelection(iconLibrary.artifactList, artifactList, [{
                                        target: '_id',
                                        source: 'artifactId'
                                    }]);
                                }

                                scope.isPartialSelection = function (iconLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: iconLibrary._id});

                                    return xref && iconLibrary.artifactList && iconLibrary.artifactList.length > xref.artifactList.length;
                                }

                                scope._ = _;
                                scope.iconLibraryList = $rootScope.iconLibraryList;
                                scope.project = $rootScope.loadedProject;
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
                                                                widgetObj.css("left", x + "px");
                                                                widgetObj.css("top", y + "px");
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

                                scope.toggleSelectLibraryList = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleSelect(".iconLibraryList").then(function () {
                                        if (element.find(".iconLibraryList").hasClass("select")) {
                                            element.find(".iconLibraryList").siblings(".accordianGroup").css("opacity", 0);
                                        } else {
                                            element.find(".iconLibraryList").siblings(".accordianGroup").css("opacity", 1);
                                        }
                                    });
                                }

                                scope.toggleIconSelection = function (repoArtifact, iconLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    repoArtifact._version = (repoArtifact.versionList.length && repoArtifact.versionList[repoArtifact.versionList.length - 1].name || "");

                                    if (repoArtifact._version) {
                                        var xref = _.findWhere(scope.project.xrefRecord, {libraryId: iconLibrary._id});

                                        if (xref) {
                                            var artifact = _.findWhere(xref.artifactList, {artifactId: repoArtifact._id});
                                            if (artifact) {
                                                if (scope.project.unselectArtifact(iconLibrary._id, repoArtifact._id)) {
                                                    delete repoArtifact._selected;
                                                    delete repoArtifact._version;
                                                }
                                            } else {
                                                if (scope.project.selectArtifact(iconLibrary._id, repoArtifact._id, repoArtifact.name, repoArtifact._version)) {
                                                    repoArtifact._selected = true;
                                                }
                                            }
                                        } else {
                                            scope.project.addLibrary(
                                                iconLibrary._id,
                                                iconLibrary.name,
                                                iconLibrary.type,
                                                [
                                                    {
                                                        artifactId: repoArtifact._id,
                                                        name: repoArtifact.name,
                                                        version: repoArtifact._version
                                                    }
                                                ]
                                            );

                                            repoArtifact._selected = true;
                                        }

                                    }
                                }

                                scope.toggleLibrarySelection = function (iconLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var library = _.findWhere(scope.project.xrefRecord, {libraryId: iconLibrary._id});
                                    if (library) {
                                        if (scope.project.removeLibrary(iconLibrary._id)) {
                                            delete iconLibrary._selected;
                                        }
                                    } else {
                                        var artifactList = [];
                                        iconLibrary.artifactList.forEach(function (artifact) {
                                            var version = artifact.versionList.length && artifact.versionList[artifact.versionList.length - 1].name || "";

                                            version && artifactList.push({
                                                artifactId: artifact._id,
                                                name: artifact.name,
                                                version: version
                                            });
                                        });

                                        if (artifactList.length && scope.project.addLibrary(iconLibrary._id, iconLibrary.name, iconLibrary.type, artifactList)) {
                                            iconLibrary._selected = true;
                                        }
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