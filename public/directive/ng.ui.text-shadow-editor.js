define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$rootScope", "$http", "$timeout", "$interval", "$q", "$exceptionHandler", "angularConstants", "angularEventTypes", "utilService", "appService"];

            appModule.directive("uiTextShadowEditor", _.union(inject, [function ($parse, $rootScope, $http, $timeout, $interval, $q, $exceptionHandler, angularConstants, angularEventTypes, utilService, appService) {
                'use strict';

                var boundProperties = {textShadow: "="},
                    defaults = {
                        textShadow: []
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "=", pseudo: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_text-shadow.html",
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

                                utilService.broadcast(scope,
                                    angularEventTypes.boundPropertiesEvent,
                                    utilService.createDirectiveBoundMap(
                                        boundProperties,
                                        attrs,
                                        {
                                            textShadow: function (value) {
                                                scope.textShadow = value;
                                                scope.pickedTextShadow = scope.pickTextShadowValue(null, false);

                                                if (scope.pickedTextShadow) {
                                                    scope.enableControl();
                                                    scope.togglePalette(true);
                                                } else {
                                                    scope.disableControl();
                                                    scope.togglePalette(false);
                                                }
                                            }
                                        },
                                        {textShadow: "uiTextShadowEditor"})
                                );

                                scope.pickTextShadowValue = function (pseudo, useDefault) {
                                    useDefault = useDefault == null || useDefault;
                                    return scope.textShadow && scope.pickStyle(scope.textShadow, pseudo != null ? pseudo : scope.pseudo)["text-shadow"] || (useDefault && angular.copy(options.textShadow) || null);
                                }

                                function createTextShadowStopValueInputAssign(name) {
                                    var fn = $parse("shadowStop['" + name + "']"),
                                        assign = fn.assign;

                                    if (!fn.assign.customized) {
                                        fn.assign = function ($scope, value) {
                                            function shadowStopHandler() {
                                                var defer = $q.defer();

                                                $timeout(function () {
                                                    //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                                    scope.setTextShadow(scope.pickedTextShadow);

                                                    defer.resolve();
                                                });

                                                return defer.promise;
                                            }

                                            shadowStopHandler.onceId = "uiTextShadowEditor.createTextShadowStopValueInputAssign.shadowStopHandler";

                                            if (value) {
                                                var args = Array.prototype.slice.call(arguments),
                                                    result = assign.apply(fn, args);

                                                utilService.once(shadowStopHandler, null, angularConstants.unresponsiveInterval)(value);

                                                return result;
                                            }
                                        }

                                        fn.assign.customized = true;
                                    }
                                    return fn;
                                }

                                createTextShadowStopValueInputAssign("h-shadow");
                                createTextShadowStopValueInputAssign("v-shadow");
                                createTextShadowStopValueInputAssign("blur");


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
                                scope.toggleTextShadowControl = function () {
                                    return scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            return utilService.whilst(
                                                function () {
                                                    return !scope.textShadow;
                                                },
                                                function (err) {
                                                    if (!err) {
                                                        scope.setTextShadow(angular.copy(options.textShadow));
                                                        scope.togglePalette(true);
                                                    }
                                                },
                                                angularConstants.checkInterval,
                                                "ui-text-shadow-editor.toggleTextShadowControl",
                                                angularConstants.renderTimeout
                                            );
                                        } else {
                                            if (scope.textShadow) {
                                                scope.textShadow = angular.copy(scope.unsetStyle(scope.textShadow, scope.pseudo));
                                            }

                                            return scope.togglePalette(false);
                                        }
                                    });
                                }

                                scope.selectTextShadowTab = function (event) {
                                    return scope.selectTab(event.currentTarget, event.target, event);
                                }

                                scope.togglePalette = function (state) {
                                    //toggleDisplayService is bought from extension object
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if (state == null || $wrapper.hasClass("expanded") ^ state) {
                                        if ($wrapper.hasClass("expanded")) {
                                            return scope.selectTab($panel, $panel.find("div[tab-sel^='tab-head-text-shadow-value']:nth-child(1)")).then(
                                                function () {
                                                    return scope.toggleDisplay($panel);
                                                }
                                            ).then(function () {
                                                    return scope.toggleExpand($wrapper);
                                                });
                                        } else {
                                            return scope.toggleExpand($wrapper).then(function () {
                                                return scope.toggleDisplay($panel);
                                            }).then(
                                                function () {
                                                    return scope.selectTab($panel, $panel.find("div[tab-sel^='tab-head-text-shadow-value']:nth-child(1)"));
                                                }
                                            );
                                        }
                                    }
                                }

                                scope.toggleShadowStopColorPalette = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $palette = element.find(".shadowStopColorPalette"),
                                        paletteScope = angular.element($palette.find("> :first-child")).scope();

                                    if (scope.hasClass(".shadowStopColorPalette", "show")) {
                                        return paletteScope.closePalette().then(function () {
                                            scope.watchSelectedShadowStopColor(false);

                                            return utilService.getResolveDefer();
                                        });
                                    } else {
                                        var top = element.find(".shadowStop[shadow-order=" + scope.selectedShadowStopIndex + "]").offset().top,
                                            paletteOffset = $palette.offset();
                                        paletteOffset.top = top;
                                        $palette.offset(paletteOffset);

                                        return paletteScope.openPalette().then(function () {
                                            scope.watchSelectedShadowStopColor(true);

                                            return utilService.getResolveDefer();
                                        });
                                    }
                                }

                                scope.watchSelectedShadowStopColor = function (state) {
                                    if (state) {
                                        if (!scope.deregisterWatch) {
                                            scope.deregisterWatch = scope.$watch("selectedShadowStopColor", function (to) {
                                                to && scope.setStopColor(scope.selectedShadowStopIndex, to);
                                            });
                                        }
                                    } else {
                                        scope.deregisterWatch && scope.deregisterWatch();
                                        scope.deregisterWatch = null;
                                    }
                                }

                                scope.pickTextShadow = function (value, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (value) {
                                        scope.pickedTextShadowName = value.name;
                                        scope.pickedTextShadow = [];
                                        return $timeout(function () {
                                            scope.setTextShadow(angular.copy(value.style["text-shadow"]));
                                        });
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.toggleShadowStopMenu = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    return scope.toggleDisplay(".shadowStop[shadow-order=" + index + "] .circular-menu .circle", event);
                                }

                                scope.insertShadowStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    var shadowStop = angular.extend({}, scope.pickedTextShadow[index]);
                                    scope.pickedTextShadow.splice(index + 1, 0, shadowStop);

                                    //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                    scope.setTextShadow(scope.pickedTextShadow);

                                    return utilService.getResolveDefer();
                                }
                                scope.removeShadowStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    if (scope.pickedTextShadow.length > 1 && index < scope.pickedTextShadow.length) {
                                        scope.pickedTextShadow.splice(index, 1);

                                        //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                        scope.setTextShadow(scope.pickedTextShadow);
                                    }
                                    return utilService.getResolveDefer();

                                }
                                scope.setShadowStopColor = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    if (index < scope.pickedTextShadow.length) {
                                        scope.selectedShadowStopColor = scope.pickedTextShadow[index].color;
                                        scope.selectedShadowStopIndex = index;

                                        scope.toggleShadowStopColorPalette();
                                    }
                                    return utilService.getResolveDefer();

                                }
                                scope.copyShadowStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    if (index < scope.pickedTextShadow.length) {
                                        scope.copiedShadowStopColor = scope.pickedTextShadow[index].color;
                                    }

                                    return utilService.getResolveDefer();
                                }
                                scope.pasteShadowStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    if (scope.copiedShadowStopColor && index < scope.pickedTextShadow.length) {
                                        var shadowStop = scope.pickedTextShadow[index];

                                        if (scope.copiedShadowStopColor !== shadowStop.color) {
                                            scope.setStopColor(index, scope.copiedShadowStopColor);
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.setStopColor = function (index, value, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (value.color && index < scope.pickedTextShadow.length) {
                                        if (value.alpha < 1 && !value.alphaColor) {
                                            value.alphaColor = utilService.rgba(value);
                                        }

                                        var shadowStop = scope.pickedTextShadow[index];

                                        if (shadowStop.color != value) {
                                            shadowStop.color = null;

                                            $timeout(function () {
                                                shadowStop.color = _.pick(value, ["color", "alpha", "alphaColor"]);

                                                //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                                scope.setTextShadow(scope.pickedTextShadow);
                                            }).then($timeout(function () {
                                                var $shadowStop = element.find(".shadowStop[shadow-order=" + index + "]");

                                                utilService.onAnimationEnd($shadowStop).then(
                                                    function () {
                                                        $shadowStop.removeClass("animate");
                                                    }
                                                );
                                                $shadowStop.addClass("animate");
                                            }));
                                        }
                                    }

                                    return true;
                                }

                                scope.setTextShadow = function (value) {
                                    if (value) {
                                        value.forEach(function (shadowStop) {
                                            if (typeof shadowStop.color === "string") {
                                                shadowStop.color = {color: shadowStop.color, alpha: 1};
                                            } else if (typeof shadowStop.color === "object") {
                                                shadowStop.color = _.pick(shadowStop.color, ["color", "alpha", "alphaColor"]);
                                                if (shadowStop.color.alpha < 1 && !shadowStop.color.alphaColor) {
                                                    shadowStop.color.alphaColor = utilService.rgba(shadowStop.color);
                                                }
                                            }
                                        });

                                        scope.pickedTextShadow = value;

                                        var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                        pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                        scope.textShadow[pseudoStylePrefix] = scope.textShadow[pseudoStylePrefix] || {};
                                        var pseudoShadowStyle = scope.textShadow[pseudoStylePrefix];
                                        pseudoShadowStyle['text-shadow'] = value;

                                        //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                        scope.textShadow = angular.copy(scope.textShadow);
                                    }
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
                                            if (effectLibrary.uiControl === "uiTextShadowEditor") {
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
                                    } else if (effectLibrary.uiControl === "uiTextShadowEditor") {
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

                                scope.effectList = [];
                                scope.effectLibraryList = $rootScope.effectLibraryList;
                                scope.filterEffectLibraryList = [];

                                function refreshArtifactList(project) {
                                    utilService.latestOnce(
                                        function () {
                                            return $timeout(function () {
                                                appService.loadEffectArtifactList().then(function () {
                                                    var arr = scope.filterLibraryList(_.where(scope.effectLibraryList, {uiControl: "uiTextShadowEditor"}), project.xrefRecord);
                                                    arr.splice(0, 0, 0, 0);
                                                    scope.filterEffectLibraryList.splice(0);
                                                    Array.prototype.splice.apply(scope.filterEffectLibraryList, arr);
                                                });
                                            });
                                        },
                                        null,
                                        null,
                                        angularConstants.unresponsiveInterval,
                                        "ui-text-shadow-editor.compile.post.refreshArtifactList"
                                    )();
                                }

                                scope.switchProjectWatcher = scope.$on(angularEventTypes.switchProjectEvent, function (event, project) {
                                    refreshArtifactList(project);
                                });

                                scope.pseudoChangeWatcher = scope.$on(angularEventTypes.widgetPseudoChangeEvent, function (event, pseudo) {
                                    scope.pickedTextShadow = scope.pickTextShadowValue(pseudo, false);

                                    if (scope.pickedTextShadow) {
                                        scope.enableControl();
                                    } else {
                                        scope.disableControl();
                                    }
                                });

                                if ($rootScope.loadedProject.projectRecord && $rootScope.loadedProject.projectRecord._id) {
                                    refreshArtifactList($rootScope.loadedProject);
                                }

                                scope.$on('$destroy', function () {
                                    if (scope.switchProjectWatcher) {
                                        scope.switchProjectWatcher();
                                        scope.switchProjectWatcher = null;
                                    }
                                    if (scope.pseudoChangeWatcher) {
                                        scope.pseudoChangeWatcher();
                                        scope.pseudoChangeWatcher = null;
                                    }
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);