define(
    ["angular-lib", "jquery-lib", "hammer-lib"],
    function () {
        var inject = ["$rootScope", "$http", "$timeout", "$q", "$exceptionHandler", "$parse", "$compile", "angularConstants", "angularEventTypes", "appService", "utilService", "uiService"];

        return function (appModule, extension, opts) {
            appModule.directive("uiWidget", _.union(inject, [function ($rootScope, $http, $timeout, $q, $exceptionHandler, $parse, $compile, angularConstants, angularEventTypes, appService, utilService, uiService) {
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
                                    "$timeout": $timeout,
                                    "$q": $q,
                                    "angularConstants": angularConstants,
                                    "utilService": utilService,
                                    element: element,
                                    scope: scope
                                }));

                                options = _.extend(_.clone(options), $parse(attrs['uiWidgetOpts'])(scope, {}));
                                options.containerClass = angularConstants.widgetClasses.containerClass;
                                options.holderClass = angularConstants.widgetClasses.holderClass;
                                options.widgetClass = angularConstants.widgetClasses.widgetClass;
                                options.hoverClass = angularConstants.widgetClasses.hoverClass;
                                options.anchorAttr = angularConstants.anchorAttr;

                                scope.filterLibraryList = function (libraryList, xrefList) {
                                    return utilService.filterSelection(libraryList, xrefList, [{
                                        target: '_id',
                                        source: 'libraryId'
                                    }]);
                                }

                                scope.filterArtifactList = function (widgetLibrary, xrefList) {
                                    var artifactList = (_.findWhere(xrefList, {libraryId: widgetLibrary._id}) || {}).artifactList;

                                    return utilService.filterSelection(widgetLibrary.artifactList, artifactList, [{
                                        target: '_id',
                                        source: 'artifactId'
                                    }]);
                                }

                                scope.markLibrarySelection = function (libraryList, xrefList) {
                                    return utilService.markSelection(libraryList, xrefList, [{
                                        target: '_id',
                                        source: 'libraryId'
                                    }]);
                                }

                                scope.markArtifactSelection = function (widgetLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: widgetLibrary._id}) || {},
                                        artifactList = xref.artifactList;

                                    return utilService.markSelection(widgetLibrary.artifactList, artifactList, [{
                                        target: '_id',
                                        source: 'artifactId'
                                    }]);
                                }

                                scope.isPartialSelection = function (widgetLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: widgetLibrary._id});

                                    return xref && widgetLibrary.artifactList && widgetLibrary.artifactList.length > xref.artifactList.length;
                                }

                                scope._ = _;
                            },
                            post: function (scope, element, attrs) {
                                var $widgetElement, mc;

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

                                            if (!$rootScope.sketchWidgetSetting.isPlaying && ($to.hasClass(options.widgetClass) || $to.hasClass(options.holderClass) || $to.attr(options.anchorAttr))) {
                                                utilService.broadcast(scope,
                                                    angularEventTypes.beforeWidgetCreationEvent,
                                                    function (name) {
                                                        if (name) {
                                                            var version = scope.pickedArtifact._version || scope.pickedArtifact.versionList[scope.pickedArtifact.versionList.length - 1].name;

                                                            uiService.createRepoWidget(
                                                                $to,
                                                                {
                                                                    artifactId: scope.pickedArtifact._id,
                                                                    name: scope.pickedArtifact.name,
                                                                    type: scope.pickedArtifact.type,
                                                                    libraryId: scope.pickedLibrary._id,
                                                                    libraryName: scope.pickedLibrary.name,
                                                                    version: version,
                                                                    projectId: $rootScope.loadedProject.projectRecord._id
                                                                }
                                                            ).then(
                                                                function (widgetObj) {
                                                                    if (widgetObj) {
                                                                        widgetObj.name = name;
                                                                        widgetObj.css("left", x + "px");
                                                                        widgetObj.css("top", y + "px");
                                                                    }
                                                                }
                                                            );
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
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.pickerPaneWidget = null;
                                    scope.pickedPane = artifact;
                                    scope.pickedArtifact = artifact;
                                    scope.pickedLibrary = widgetLibrary;
                                    return $timeout(function () {
                                        scope.pickerPaneWidget = scope.pickedPane;
                                    });
                                };

                                scope.togglePalette = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

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
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.pickWidget(artifact, widgetLibrary);
                                    return $timeout(function () {
                                        scope.showDemo && scope.showDemo();
                                    });
                                }

                                scope.toggleSelectLibraryList = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    return scope.toggleSelect(".widgetLibraryList");
                                }

                                scope.toggleWidgetSelection = function (repoArtifact, widgetLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    repoArtifact._version = (repoArtifact.versionList.length && repoArtifact.versionList[repoArtifact.versionList.length - 1].name || "");

                                    if (repoArtifact._version) {
                                        var xref = _.findWhere($rootScope.loadedProject.xrefRecord, {libraryId: widgetLibrary._id});

                                        if (xref) {
                                            var artifact = _.findWhere(xref.artifactList, {artifactId: repoArtifact._id});
                                            if (artifact) {
                                                var result = $rootScope.loadedProject.unselectArtifact(widgetLibrary._id, repoArtifact._id);
                                                if (result.artifactUnselect) {
                                                    delete repoArtifact._selected;
                                                    delete repoArtifact._version;
                                                }
                                                if (result.libraryUnselect) {
                                                    delete widgetLibrary._selected;

                                                    var index;
                                                    if (!scope.filterWidgetLibraryList.every(function (lib, i) {
                                                            if (lib._id === widgetLibrary._id) {
                                                                index = i;
                                                                return false;
                                                            }

                                                            return true;
                                                        })) {
                                                        scope.filterWidgetLibraryList.splice(index, 1);
                                                    }
                                                }
                                            } else {
                                                if ($rootScope.loadedProject.selectArtifact(widgetLibrary._id, repoArtifact._id, repoArtifact.name, repoArtifact._version)) {
                                                    repoArtifact._selected = true;
                                                }
                                            }
                                        } else {
                                            $rootScope.loadedProject.addLibrary(
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

                                            if (scope.filterWidgetLibraryList.every(function (lib) {
                                                    return lib._id !== widgetLibrary._id;
                                                })) {
                                                scope.filterWidgetLibraryList.push(widgetLibrary);
                                            }
                                        }

                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.toggleLibrarySelection = function (widgetLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var library = _.findWhere($rootScope.loadedProject.xrefRecord, {libraryId: widgetLibrary._id});
                                    if (library) {
                                        if ($rootScope.loadedProject.removeLibrary(widgetLibrary._id)) {
                                            delete widgetLibrary._selected;

                                            var index;
                                            if (!scope.filterWidgetLibraryList.every(function (lib, i) {
                                                    if (lib._id === widgetLibrary._id) {
                                                        index = i;
                                                        return false;
                                                    }

                                                    return true;
                                                })) {
                                                scope.filterWidgetLibraryList.splice(index, 1);
                                            }
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

                                        if (artifactList.length && $rootScope.loadedProject.addLibrary(widgetLibrary._id, widgetLibrary.name, widgetLibrary.type, artifactList)) {
                                            widgetLibrary._selected = true;

                                            if (scope.filterWidgetLibraryList.every(function (lib) {
                                                    return lib._id !== widgetLibrary._id;
                                                })) {
                                                scope.filterWidgetLibraryList.push(widgetLibrary);
                                            }
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.widgetLibraryList = $rootScope.widgetLibraryList;
                                scope.filterWidgetLibraryList = [];

                                function refreshArtifactList(project) {
                                    utilService.latestOnce(
                                        function () {
                                            return $timeout(
                                                function () {
                                                    appService.loadWidgetArtifactList().then(function () {
                                                        var arr = scope.filterLibraryList(scope.widgetLibraryList, project.xrefRecord);
                                                        arr.splice(0, 0, 0, 0);
                                                        scope.filterWidgetLibraryList.splice(0);
                                                        Array.prototype.splice.apply(scope.filterWidgetLibraryList, arr);
                                                    });
                                                }
                                            );
                                        },
                                        null,
                                        null,
                                        angularConstants.unresponsiveInterval,
                                        "ui-widget.compile.pre.refreshArtifactList"
                                    )();
                                }

                                scope.switchProjectWatcher = scope.$on(angularEventTypes.switchProjectEvent, function (event, project) {
                                    refreshArtifactList(project);
                                });

                                utilService.latestOnce(
                                    function () {
                                        return $timeout(
                                            function () {
                                                var $element = $(element),
                                                    $wrapper = $element.find(".ui-control-wrapper"),
                                                    $panel = $element.find(".ui-control-panel");

                                                $wrapper.addClass("expanded");
                                                $panel.addClass("show");

                                                var $el = $element.find(".pickerPane");

                                                mc = $el.data("hammer");
                                                if (!mc) {
                                                    mc = new Hammer.Manager($el.get(0));
                                                    mc.add(new Hammer.Pan());
                                                    mc.on("panstart panmove panend", addWidgetHandler);
                                                    $el.data("hammer", mc);

                                                    scope.$on('$destroy', function () {
                                                        mc.off("panstart panmove panend", addWidgetHandler);
                                                    });
                                                }
                                            }
                                        );
                                    },
                                    null,
                                    null,
                                    angularConstants.unresponsiveInterval,
                                    "ui-widget.compile.post.init"
                                )();

                                if ($rootScope.loadedProject.projectRecord && $rootScope.loadedProject.projectRecord._id) {
                                    refreshArtifactList($rootScope.loadedProject);
                                }

                                scope.$on('$destroy', function () {
                                    scope.switchProjectWatcher && scope.switchProjectWatcher();
                                    scope.switchProjectWatcher = null;
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);