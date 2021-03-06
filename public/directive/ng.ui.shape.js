define(
    ["angular-lib", "jquery-lib", "hammer-lib"],
    function () {
        var inject = ["$rootScope", "$http", "$timeout", "$q", "$exceptionHandler", "$parse", "$compile", "angularConstants", "angularEventTypes", "appService", "utilService", "uiService"];

        return function (appModule, extension, opts) {
            appModule.directive("uiShape", _.union(inject, [function ($rootScope, $http, $timeout, $q, $exceptionHandler, $parse, $compile, angularConstants, angularEventTypes, appService, utilService, uiService) {
                'use strict';

                var defaults = {},
                    options = _.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                        dockAlign: "="
                    },
                    replace: false,
                    templateUrl: "include/_shape.html",
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

                                options = _.extend(_.clone(options), $parse(attrs['uiShapeOpts'])(scope, {}));
                                options.containerClass = angularConstants.widgetClasses.containerClass;
                                options.holderClass = angularConstants.widgetClasses.holderClass;
                                options.widgetClass = angularConstants.widgetClasses.widgetClass;
                                options.hoverClass = angularConstants.widgetClasses.hoverClass;
                                options.anchorAttr = angularConstants.anchorAttr;
                                options.elementZIndex = angularConstants.draggingShapeZIndex;

                                scope.filterLibraryList = function (libraryList, xrefList) {
                                    return utilService.filterSelection(libraryList, xrefList, [{
                                        target: '_id',
                                        source: 'libraryId'
                                    }]);
                                }

                                scope.filterArtifactList = function (iconLibrary, xrefList) {
                                    var artifactList = (_.findWhere(xrefList, {libraryId: iconLibrary._id}) || {}).artifactList;

                                    return utilService.filterSelection(iconLibrary.artifactList, artifactList, [{
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

                                scope.markArtifactSelection = function (iconLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: iconLibrary._id}) || {},
                                        artifactList = xref.artifactList;

                                    return utilService.markSelection(iconLibrary.artifactList, artifactList, [{
                                        target: '_id',
                                        source: 'artifactId'
                                    }]);
                                }

                                scope.isPartialSelection = function (iconLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: iconLibrary._id}),
                                        artifactList = iconLibrary.artifactList;

                                    return xref && artifactList && artifactList.length > xref.artifactList.length;
                                }

                                scope._ = _;
                            },
                            post: function (scope, element, attrs) {
                                var $shapeElement, mc;

                                function addWidgetHandler(event) {
                                    if (scope.pickerPaneShape) {
                                        var $container = $("." + options.containerClass),
                                            touchX = $shapeElement && $shapeElement.data("touchX") || 0,
                                            touchY = $shapeElement && $shapeElement.data("touchY") || 0;

                                        if (event.type === "panstart") {
                                            var $el = $(event.srcEvent.target);

                                            $shapeElement = $("<div />");

                                            $shapeElement.addClass("pickerPaneShape fs-x-medium-before squarePane")
                                                .addClass(scope.getIconClassList(scope.pickerPaneShape.iconLibrary.name, scope.pickerPaneShape.artifact.name, scope.pickerPaneShape.icon, 'before').join(" "))
                                                .css({opacity: 0, "z-index": options.elementZIndex});
                                            $shapeElement.appendTo($("." + options.containerClass));

                                            touchX = event.srcEvent.offsetX - $shapeElement.width();
                                            touchY = event.srcEvent.offsetY;
                                            $shapeElement.data("touchX", touchX);
                                            $shapeElement.data("touchY", touchY);
                                        } else if ($shapeElement && event.type === "panmove") {
                                            var left = event.srcEvent.clientX - $shapeElement.parent().offset().left + touchX,
                                                top = event.srcEvent.clientY - $shapeElement.parent().offset().top + touchY;

                                            $shapeElement.css("left", left + "px");
                                            $shapeElement.css("top", top + "px");
                                            $shapeElement.css({opacity: 1, left: left + "px", top: top + "px"});

                                            var $to = $(event.srcEvent.toElement);

                                            if ($to.hasClass(options.widgetClass)) {
                                                if (!$to.hasClass(options.hoverClass)) {
                                                    $("." + options.holderClass).find("." + options.hoverClass).removeClass(options.hoverClass);
                                                    $to.addClass(options.hoverClass);
                                                }
                                            } else if ($to.hasClass(options.holderClass)) {
                                                $("." + options.holderClass).find("." + options.hoverClass).removeClass(options.hoverClass);
                                            }
                                        } else if ($shapeElement && event.type === "panend") {
                                            $shapeElement.remove();
                                            $shapeElement = null;
                                            $("." + options.holderClass).find("." + options.hoverClass).removeClass(options.hoverClass);

                                            var $to = $(event.srcEvent.toElement);

                                            if (!$rootScope.sketchWidgetSetting.isPlaying && ($to.hasClass(options.widgetClass) || $to.hasClass(options.holderClass) || $to.attr(options.anchorAttr))) {
                                                var x = event.srcEvent.clientX - $to.offset().left,
                                                    y = event.srcEvent.clientY - $to.offset().top;

                                                x = Math.floor(x * angularConstants.precision) / angularConstants.precision;
                                                y = Math.floor(y * angularConstants.precision) / angularConstants.precision;

                                                if (!$rootScope.sketchWidgetSetting.isPlaying) {
                                                    utilService.broadcast(scope,
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

                                scope.pickShape = function (iconLibrary, artifact, icon, event) {
                                    event && event.stopPropagation && event.stopPropagation();
                                    scope.pickerPaneShape = null;
                                    scope.pickedPane = {iconLibrary: iconLibrary, artifact: artifact, icon: icon};
                                    return $timeout(function () {
                                        scope.pickerPaneShape = scope.pickedPane;
                                    });
                                };

                                scope.toggleSelectLibraryList = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    return scope.toggleSelect(".iconLibraryList");
                                }

                                scope.toggleIconSelection = function (repoArtifact, iconLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    repoArtifact._version = (repoArtifact.versionList.length && repoArtifact.versionList[repoArtifact.versionList.length - 1].name || "");

                                    if (repoArtifact._version) {
                                        var xref = _.findWhere($rootScope.loadedProject.xrefRecord, {libraryId: iconLibrary._id});

                                        if (xref) {
                                            var artifact = _.findWhere(xref.artifactList, {artifactId: repoArtifact._id});
                                            if (artifact) {
                                                var result = $rootScope.loadedProject.unselectArtifact(iconLibrary._id, repoArtifact._id);
                                                if (result.artifactUnselect) {
                                                    delete repoArtifact._selected;
                                                    delete repoArtifact._version;
                                                }
                                                if (result.libraryUnselect) {
                                                    delete iconLibrary._selected;

                                                    var index;
                                                    if (!scope.filterIconLibraryList.every(function (lib, i) {
                                                            if (lib._id === iconLibrary._id) {
                                                                index = i;
                                                                return false;
                                                            }

                                                            return true;
                                                        })) {
                                                        scope.filterIconLibraryList.splice(index, 1);
                                                    }
                                                }
                                            } else {
                                                if ($rootScope.loadedProject.selectArtifact(iconLibrary._id, repoArtifact._id, repoArtifact.name, repoArtifact._version)) {
                                                    repoArtifact._selected = true;
                                                }
                                            }
                                        } else {
                                            $rootScope.loadedProject.addLibrary(
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

                                            if (scope.filterIconLibraryList.every(function (lib) {
                                                    return lib._id !== iconLibrary._id;
                                                })) {
                                                scope.filterIconLibraryList.push(iconLibrary);
                                            }
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.toggleLibrarySelection = function (iconLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var library = _.findWhere($rootScope.loadedProject.xrefRecord, {libraryId: iconLibrary._id});
                                    if (library) {
                                        if ($rootScope.loadedProject.removeLibrary(iconLibrary._id)) {
                                            delete iconLibrary._selected;

                                            var index;
                                            if (!scope.filterIconLibraryList.every(function (lib, i) {
                                                    if (lib._id === iconLibrary._id) {
                                                        index = i;
                                                        return false;
                                                    }

                                                    return true;
                                                })) {
                                                scope.filterIconLibraryList.splice(index, 1);
                                            }
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

                                        if (artifactList.length && $rootScope.loadedProject.addLibrary(iconLibrary._id, iconLibrary.name, iconLibrary.type, artifactList)) {
                                            iconLibrary._selected = true;

                                            if (scope.filterIconLibraryList.every(function (lib) {
                                                    return lib._id !== iconLibrary._id;
                                                })) {
                                                scope.filterIconLibraryList.push(iconLibrary);
                                            }
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.iconLibraryList = $rootScope.iconLibraryList;
                                scope.filterIconLibraryList = [];

                                function refreshArtifactList(project) {
                                    utilService.latestOnce(
                                        function () {
                                            return $timeout(function () {
                                                appService.loadIconArtifactList().then(function () {
                                                    var arr = scope.filterLibraryList(scope.iconLibraryList, project.xrefRecord);
                                                    arr.splice(0, 0, 0, 0);
                                                    scope.filterIconLibraryList.splice(0);
                                                    Array.prototype.splice.apply(scope.filterIconLibraryList, arr);
                                                });                                            });
                                        },
                                        null,
                                        null,
                                        angularConstants.unresponsiveInterval,
                                        "ui-shape.compile.post.refreshArtifactList"
                                    )();
                                }

                                scope.switchProjectWatcher = scope.$on(angularEventTypes.switchProjectEvent, function (event, project) {
                                    refreshArtifactList(project);
                                });

                                utilService.latestOnce(
                                    function () {
                                        return $timeout(function () {
                                            var $element = $(element),
                                                $wrapper = $element.find(".ui-control-wrapper"),
                                                $panel = $element.find(".ui-control-panel");

                                            $wrapper.addClass("expanded");
                                            $panel.addClass("show");

                                            var $el = $element.find(".pickerPane");

                                            mc = $el.data("hammer");
                                            if (!mc) {
                                                mc = new Hammer.Manager($element.find(".pickerPane").get(0));
                                                mc.add(new Hammer.Pan());
                                                mc.on("panstart panmove panend", addWidgetHandler);
                                                $el.data("hammer", mc);

                                                scope.$on('$destroy', function () {
                                                    mc.off("panstart panmove panend", addWidgetHandler);
                                                });
                                            }
                                        });
                                    },
                                    null,
                                    null,
                                    angularConstants.unresponsiveInterval,
                                    "ui-shape.compile.post.init"
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