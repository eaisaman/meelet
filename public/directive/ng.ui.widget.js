define(
    ["angular", "jquery", "hammer"],
    function () {
        var inject = ["$rootScope", "$http", "$timeout", "$q", "$parse", "$compile", "angularConstants", "angularEventTypes", "appService", "uiUtilService", "uiService"];

        return function (appModule, extension, opts) {
            appModule.directive("uiWidget", _.union(inject, [function ($rootScope, $http, $timeout, $q, $parse, $compile, angularConstants, angularEventTypes, appService, uiUtilService, uiService) {
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
                        pickedArtifact: "=",
                        pickedLibrary: "=",
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

                                scope.filterLibraryList = function (libraryList, xrefList) {
                                    return uiUtilService.filterSelection(libraryList, xrefList, [{
                                        target: '_id',
                                        source: 'libraryId'
                                    }]);
                                }

                                scope.filterArtifactList = function (widgetLibrary, xrefList) {
                                    return uiUtilService.filterSelection(widgetLibrary.artifactList, _.findWhere(xrefList, {libraryId: widgetLibrary._id}).artifactList, [{
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

                                scope.markArtifactSelection = function (widgetLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: widgetLibrary._id}) || {},
                                        artifactList = xref.artifactList;

                                    return uiUtilService.markSelection(widgetLibrary.artifactList, artifactList, [{
                                        target: '_id',
                                        source: 'artifactId'
                                    }]);
                                }

                                scope.isPartialSelection = function (widgetLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: widgetLibrary._id});

                                    return xref && widgetLibrary.artifactList && widgetLibrary.artifactList.length > xref.artifactList.length;
                                }

                                scope._ = _;
                                scope.widgetLibraryList = $rootScope.widgetLibraryList;
                                scope.project = $rootScope.loadedProject;
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
                                                uiUtilService.broadcast(scope,
                                                    angularEventTypes.beforeWidgetCreationEvent,
                                                    function (name) {
                                                        if (name) {
                                                            var version = scope.pickedArtifact.versionList[scope.pickedArtifact.versionList.length - 1].name;

                                                            var widgetObj = uiService.createRepoWidget(
                                                                $to,
                                                                {
                                                                    artifactId: scope.pickedArtifact._id,
                                                                    name: scope.pickedArtifact.name,
                                                                    type: scope.pickedArtifact.type,
                                                                    libraryName: scope.pickedLibrary.name,
                                                                    version: version,
                                                                    projectId: $rootScope.loadedProject.projectRecord._id
                                                                }
                                                            );

                                                            widgetObj.name = name;
                                                            widgetObj.css("left", x + "px");
                                                            widgetObj.css("top", y + "px");
                                                        }
                                                    }
                                                );
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

                                scope.toggleSelectLibraryList = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleSelect(".widgetLibraryList").then(function () {
                                        if (element.find(".widgetLibraryList").hasClass("select")) {
                                            element.find(".widgetLibraryList").siblings(".accordianGroup").css("opacity", 0);
                                        } else {
                                            element.find(".widgetLibraryList").siblings(".accordianGroup").css("opacity", 1);
                                        }
                                    });
                                }

                                scope.toggleWidgetSelection = function (repoArtifact, widgetLibrary, event) {
                                    event && event.stopPropagation();

                                    repoArtifact._version = (repoArtifact.versionList.length && repoArtifact.versionList[repoArtifact.versionList.length - 1].name || "");

                                    if (repoArtifact._version) {
                                        var xref = _.findWhere(scope.project.xrefRecord, {libraryId: widgetLibrary._id});

                                        if (xref) {
                                            var artifact = _.findWhere(xref.artifactList, {artifactId: repoArtifact._id});
                                            if (artifact) {
                                                if (scope.project.unselectArtifact(widgetLibrary._id, repoArtifact._id)) {
                                                    delete repoArtifact._selected;
                                                    delete repoArtifact._version;
                                                }
                                            } else {
                                                if (scope.project.selectArtifact(widgetLibrary._id, repoArtifact._id, repoArtifact.name, repoArtifact._version)) {
                                                    repoArtifact._selected = true;
                                                }
                                            }
                                        } else {
                                            scope.project.addLibrary(
                                                widgetLibrary._id,
                                                widgetLibrary.name,
                                                widgetLibrary.type,
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

                                scope.toggleLibrarySelection = function (widgetLibrary, event) {
                                    event && event.stopPropagation();

                                    var library = _.findWhere(scope.project.xrefRecord, {libraryId: widgetLibrary._id});
                                    if (library) {
                                        if (scope.project.removeLibrary(widgetLibrary._id)) {
                                            delete widgetLibrary._selected;
                                        }
                                    } else {
                                        var artifactList = [];
                                        widgetLibrary.artifactList.forEach(function (artifact) {
                                            var version = artifact.versionList.length && artifact.versionList[artifact.versionList.length - 1].name || "";

                                            version && artifactList.push({
                                                artifactId: artifact._id,
                                                name: artifact.name,
                                                version: version
                                            });
                                        });

                                        if (artifactList.length && scope.project.addLibrary(widgetLibrary._id, widgetLibrary.name, widgetLibrary.type, artifactList)) {
                                            widgetLibrary._selected = true;
                                        }
                                    }
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