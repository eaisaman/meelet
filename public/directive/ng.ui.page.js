define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "$interval", "$exceptionHandler", "$parse", "$rootScope", "angularEventTypes", "angularConstants", "utilService", "uiService", "appService"];

            appModule.directive("uiPage", _.union(inject, [function ($timeout, $q, $interval, $exceptionHandler, $parse, $rootScope, angularEventTypes, angularConstants, utilService, uiService, appService) {
                'use strict';

                var defaults = {},
                    options = _.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {dockAlign: "=", treeNodeIdPrefix: "="},
                    replace: false,
                    templateUrl: "include/_page.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    "$timeout": $timeout,
                                    "$interval": $interval,
                                    "$q": $q,
                                    "angularConstants": angularConstants,
                                    "utilService": utilService,
                                    element: element,
                                    scope: scope
                                }));

                                options = _.extend(_.clone(options), $parse(attrs['uiPageOpts'])(scope, {}));

                                scope.pickEffectArtifact = function (artifactId) {
                                    scope.effectList.splice(0);

                                    scope.filterEffectLibraryList.every(function (library) {
                                        return library.artifactList.every(function (artifact) {
                                            if (artifact._id === artifactId) {
                                                if (!$rootScope.loadedProject.sketchWorks.pageTransition.artifactSpec || $rootScope.loadedProject.sketchWorks.pageTransition.artifactSpec.artifactId !== artifact._id) {
                                                    $rootScope.loadedProject.sketchWorks.pageTransition.artifactSpec = {
                                                        type: artifact.type,
                                                        directiveName: artifact.directiveName,
                                                        libraryName: library.name,
                                                        artifactName: artifact.name,
                                                        artifactId: artifact._id,
                                                        version: artifact._version || (artifact.versionList.length && artifact.versionList[artifact.versionList.length - 1].name) || ""
                                                    };
                                                }

                                                var arr = artifact.json.slice(0, artifact.json.length);
                                                arr.splice(0, 0, 0, 0);
                                                Array.prototype.splice.apply(scope.effectList, arr);

                                                return false;
                                            }

                                            return true;
                                        });

                                    });
                                }

                                scope.createEffectObj = function (effectValue) {
                                    return {
                                        name: effectValue.replace(/\+.+$/g, ''),
                                        type: effectValue.replace(/^.+\+/g, ''),
                                        options: {}
                                    };
                                }

                                scope.filterLibraryList = function (libraryList, xrefList) {
                                    return utilService.filterSelection(libraryList, xrefList, [{
                                        target: '_id',
                                        source: 'libraryId'
                                    }]);
                                }

                                scope.filterArtifactList = function (effectLibrary, xrefList) {
                                    var artifactList = (_.findWhere(xrefList, {libraryId: effectLibrary._id}) || {}).artifactList;

                                    return utilService.filterSelection(effectLibrary.artifactList, artifactList, [{
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

                                scope.markArtifactSelection = function (effectLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: effectLibrary._id}) || {},
                                        artifactList = xref.artifactList;

                                    return utilService.markSelection(effectLibrary.artifactList, artifactList, [{
                                        target: '_id',
                                        source: 'artifactId'
                                    }]);
                                }

                                scope.isPartialSelection = function (effectLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: effectLibrary._id}),
                                        artifactList = effectLibrary.artifactList;

                                    return xref && artifactList && artifactList.length > xref.artifactList.length;
                                }
                            },
                            post: function (scope, element, attrs) {
                                scope.togglePage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel"),
                                        $el = $(event.target);

                                    $el.toggleClass("select");

                                    if ($wrapper.hasClass("expanded")) {
                                        return scope.selectTab(element, element.find("div[tab-sel^='tab-head']:nth-child(1)")).then(function () {
                                            return scope.toggleDisplay($panel)
                                        }).then(function () {
                                            $wrapper.toggleClass("expanded");

                                            return utilService.getResolveDefer();
                                        });
                                    } else {
                                        $wrapper.toggleClass("expanded");
                                        return scope.toggleDisplay($panel).then(function () {
                                            return scope.selectTab(element, element.find("div[tab-sel^='tab-head']:nth-child(1)"));
                                        });
                                    }
                                }

                                scope.selectPageTab = function (event) {
                                    return scope.selectTab(event.currentTarget.parentNode, event.target, event);
                                }

                                scope.togglePageSettings = function () {
                                    event && event.stopPropagation && event.stopPropagation();

                                }

                                scope.insertPage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if ($rootScope.loadedProject) {
                                        utilService.broadcast(scope,
                                            angularEventTypes.beforeWidgetCreationEvent,
                                            function (name) {
                                                if (name) {
                                                    var pageObj = uiService.createPage();
                                                    pageObj.name = name;
                                                    $rootScope.loadedProject.sketchWorks.pages.push(pageObj);

                                                    var prev = $rootScope.loadedProject.sketchWorks.pages[$rootScope.loadedProject.sketchWorks.pages.length - 1];
                                                    if (prev) {
                                                        prev.nextSibling = pageObj;
                                                        pageObj.prevSibling = prev;
                                                    }

                                                    uiService.loadPage($rootScope.sketchObject.pickedPage, pageObj).then(function () {
                                                        uiService.setCurrentPage(pageObj);
                                                    });
                                                }
                                            }
                                        );
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.removePage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if ($rootScope.loadedProject) {
                                        if ($rootScope.loadedProject.sketchWorks.pages.length > 1) {
                                            var i = parseInt($(".pageList select").val());

                                            var pageObj = $rootScope.loadedProject.sketchWorks.pages[i],
                                                j = (i + 1) == $rootScope.loadedProject.sketchWorks.pages.length ? 0 : i;

                                            $rootScope.loadedProject.sketchWorks.pages[i].dispose();
                                            $rootScope.loadedProject.sketchWorks.pages.splice(i, 1);
                                            if (pageObj == $rootScope.sketchObject.pickedPage) {
                                                $rootScope.sketchObject.pickedPage = $rootScope.loadedProject.sketchWorks.pages[j];
                                            }

                                            var prev = pageObj.prevSibling,
                                                next = pageObj.nextSibling;

                                            if (prev) {
                                                prev.nextSibling = next;
                                            }
                                            if (next) {
                                                next.prevSibling = prev;
                                            }
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.copyPage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if ($rootScope.loadedProject) {
                                        utilService.broadcast(scope,
                                            angularEventTypes.beforeWidgetCreationEvent,
                                            function (name) {
                                                if (name) {
                                                    var pageObj = $rootScope.loadedProject.sketchWorks.pages[scope.pickedPageIndex],
                                                        cloneObj = uiService.copyPage(pageObj);

                                                    cloneObj.name = name;
                                                    $rootScope.loadedProject.sketchWorks.pages.splice(scope.pickedPageIndex + 1, 0, cloneObj);

                                                    var next = pageObj.nextSibling;
                                                    pageObj.nextSibling = cloneObj;
                                                    cloneObj.prevSibling = pageObj;

                                                    if (next) {
                                                        next.prevSibling = cloneObj;
                                                        cloneObj.nextSibling = next;
                                                    }

                                                    uiService.loadPage($rootScope.sketchObject.pickedPage, cloneObj).then(function () {
                                                        uiService.setCurrentPage(cloneObj);
                                                        scope.pickedPageIndex++;
                                                    });
                                                }
                                            }
                                        );
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.toggleSelectState = function (item, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (item != null && item != scope.stateTreeNodeItem) {
                                        scope.stateTreeNodeItem = null;

                                        return $timeout(function () {
                                            scope.stateTreeNodeItem = item;

                                            if (item.stateOptions.length) {
                                                return utilService.whilst(
                                                    function () {
                                                        return !angular.element(element.find("#widgetStateDropdown > div")).scope();
                                                    },
                                                    function (err) {
                                                        if (!err) {
                                                            var $dropdown = element.find("#widgetStateDropdown");

                                                            if (event) {
                                                                var $el = $(event.target),
                                                                    offset = $el.offset();

                                                                var m = ($el.css("height") || "").match(/([-\d\.]+)px$/);
                                                                if (m && m.length == 2)
                                                                    offset.top += parseFloat(m[1]) * 1.5;
                                                                offset.left = Math.floor(offset.left * angularConstants.precision) / angularConstants.precision;
                                                                offset.top = Math.floor(offset.top * angularConstants.precision) / angularConstants.precision;

                                                                $dropdown.offset(offset);
                                                            }

                                                            scope.toggleSelect($dropdown).then(
                                                                function ($dropdown) {
                                                                    if ($dropdown.hasClass("select")) {
                                                                        angular.element(element.find("#widgetStateDropdown > div")).scope().open();
                                                                    }
                                                                }
                                                            );
                                                        }
                                                    },
                                                    angularConstants.checkInterval,
                                                    "ui-page.toggleSelectState",
                                                    angularConstants.renderTimeout
                                                );
                                            } else {
                                                return utilService.getResolveDefer();
                                            }
                                        });
                                    } else {
                                        return scope.toggleSelect(element.find("#widgetStateDropdown"), null, false).then(function () {
                                            scope.stateTreeNodeItem = null;

                                            return utilService.getResolveDefer();
                                        });
                                    }
                                }

                                scope.toggleSelectLibraryList = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    return scope.toggleSelect(".effectLibraryList").then(function () {
                                        if (element.find(".effectLibraryList").hasClass("select")) {
                                            element.find(".effectLibraryList").siblings("div").css("opacity", 0);
                                        } else {
                                            element.find(".effectLibraryList").siblings("div").css("opacity", 1);
                                        }

                                        return utilService.getResolveDefer();
                                    });
                                }

                                scope.toggleArtifactSelection = function (repoArtifact, effectLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    repoArtifact._version = (repoArtifact.versionList.length && repoArtifact.versionList[repoArtifact.versionList.length - 1].name || "");

                                    if (repoArtifact._version) {
                                        var xref = _.findWhere($rootScope.loadedProject.xrefRecord, {libraryId: effectLibrary._id});

                                        if (xref) {
                                            var artifact = _.findWhere(xref.artifactList, {artifactId: repoArtifact._id});
                                            if (artifact) {
                                                var result = $rootScope.loadedProject.unselectArtifact(effectLibrary._id, repoArtifact._id);
                                                if (result.artifactUnselect) {
                                                    delete repoArtifact._selected;
                                                    delete repoArtifact._version;
                                                }
                                                if (result.libraryUnselect) {
                                                    delete effectLibrary._selected;

                                                    var index;
                                                    if (!scope.filterEffectLibraryList.every(function (lib, i) {
                                                            if (lib._id === effectLibrary._id) {
                                                                index = i;
                                                                return false;
                                                            }

                                                            return true;
                                                        })) {
                                                        scope.filterEffectLibraryList.splice(index, 1);
                                                    }
                                                }
                                            } else {
                                                if ($rootScope.loadedProject.selectArtifact(effectLibrary._id, repoArtifact._id, repoArtifact.name, repoArtifact._version)) {
                                                    repoArtifact._selected = true;
                                                }
                                            }
                                        } else {
                                            if (effectLibrary.uiControl === "uiPage") {
                                                $rootScope.loadedProject.addLibrary(
                                                    effectLibrary._id,
                                                    effectLibrary.name,
                                                    effectLibrary.type,
                                                    [
                                                        {
                                                            artifactId: repoArtifact._id,
                                                            name: repoArtifact.name,
                                                            version: repoArtifact._version
                                                        }
                                                    ]
                                                );

                                                repoArtifact._selected = true;

                                                if (scope.filterEffectLibraryList.every(function (lib) {
                                                        return lib._id !== effectLibrary._id;
                                                    })) {
                                                    scope.filterEffectLibraryList.push(effectLibrary);
                                                }
                                            }

                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.toggleLibrarySelection = function (effectLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var library = _.findWhere($rootScope.loadedProject.xrefRecord, {libraryId: effectLibrary._id});
                                    if (library) {
                                        if ($rootScope.loadedProject.removeLibrary(effectLibrary._id)) {
                                            delete effectLibrary._selected;

                                            var index;
                                            if (!scope.filterEffectLibraryList.every(function (lib, i) {
                                                    if (lib._id === effectLibrary._id) {
                                                        index = i;
                                                        return false;
                                                    }

                                                    return true;
                                                })) {
                                                scope.filterEffectLibraryList.splice(index, 1);
                                            }
                                        }
                                    } else if (effectLibrary.uiControl === "uiPage") {
                                        var artifactList = [];
                                        effectLibrary.artifactList.forEach(function (artifact) {
                                            var version = artifact.versionList.length && artifact.versionList[artifact.versionList.length - 1].name || "";

                                            version && artifactList.push({
                                                artifactId: artifact._id,
                                                name: artifact.name,
                                                version: version
                                            });
                                        });

                                        if (artifactList.length && $rootScope.loadedProject.addLibrary(effectLibrary._id, effectLibrary.name, effectLibrary.type, artifactList)) {
                                            effectLibrary._selected = true;

                                            if (scope.filterEffectLibraryList.every(function (lib) {
                                                    return lib._id !== effectLibrary._id;
                                                })) {
                                                scope.filterEffectLibraryList.push(effectLibrary);
                                            }
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.onPickedPage = function (i) {
                                    var pageObj = $rootScope.loadedProject.sketchWorks.pages[i];

                                    uiService.loadPage($rootScope.sketchObject.pickedPage, pageObj).then(function () {
                                        uiService.setCurrentPage(pageObj);
                                        scope.$broadcast("collapseAll");
                                    });
                                }

                                scope.effectList = [];
                                scope.effectLibraryList = $rootScope.effectLibraryList;
                                scope.filterEffectLibraryList = [];
                                scope.pickedPageIndex = 0;

                                function initEffectList(pageTransition) {
                                    scope.effectList.splice();

                                    if (pageTransition.artifactSpec && pageTransition.artifactSpec.artifactId) {
                                        var artifactId = pageTransition.artifactSpec.artifactId;

                                        scope.filterEffectLibraryList.every(function (library) {
                                            return library.artifactList.every(function (artifact) {
                                                if (artifact._id === artifactId) {
                                                    var arr = utilService.listOmit(artifact.json, "$$hashkey");
                                                    arr.splice(0, 0, 0, 0);
                                                    Array.prototype.splice.apply(scope.effectList, arr);

                                                    return false;
                                                }

                                                return true;
                                            });

                                        });
                                    }
                                }

                                function refreshArtifactList(project) {
                                    utilService.latestOnce(
                                        function () {
                                            return $timeout(
                                                function () {
                                                    appService.loadEffectArtifactList().then(function () {
                                                        var arr = scope.filterLibraryList(_.where(scope.effectLibraryList, {uiControl: "uiPage"}), project.xrefRecord);
                                                        arr.splice(0, 0, 0, 0);
                                                        scope.filterEffectLibraryList.splice(0);
                                                        Array.prototype.splice.apply(scope.filterEffectLibraryList, arr);

                                                        initEffectList(project.sketchWorks.pageTransition);
                                                    });
                                                }
                                            );
                                        },
                                        null,
                                        null,
                                        angularConstants.unresponsiveInterval,
                                        "ui-page.compile.pre.refreshArtifactList"
                                    )();
                                }

                                scope.switchProjectWatcher = scope.$on(angularEventTypes.switchProjectEvent, function (event, project) {
                                    refreshArtifactList(project);
                                });

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