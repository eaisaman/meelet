define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$rootScope", "$http", "$timeout", "$q", "angularConstants", "angularEventTypes", "uiUtilService", "appService"];

            appModule.directive("uiTextShadowEditor", _.union(inject, [function ($parse, $rootScope, $http, $timeout, $q, angularConstants, angularEventTypes, uiUtilService, appService) {
                'use strict';

                var boundProperties = {textShadow: "="},
                    defaults = {
                        textShadow: []
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_text-shadow.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                uiUtilService.broadcast(scope,
                                    angularEventTypes.boundPropertiesEvent,
                                    uiUtilService.createDirectiveBoundMap(
                                        boundProperties,
                                        attrs,
                                        {
                                            textShadow: function (value) {
                                                if (value && scope.hasStyle(value)) {
                                                    scope.pickedTextShadow = scope.pickTextShadowValue(value);
                                                    scope.enableControl();
                                                } else {
                                                    scope.disableControl();
                                                }
                                            }
                                        },
                                        {textShadow: "uiTextShadowEditor"})
                                );

                                scope.pickTextShadowValue = function (styles) {
                                    return scope.pickStyle(styles, scope.pseudo)["text-shadow"] || _.clone(options.textShadow);
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

                                                uiUtilService.once(shadowStopHandler, null, 20)(value);

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
                                    return uiUtilService.filterSelection(libraryList, xrefList, [{
                                        target: '_id',
                                        source: 'libraryId'
                                    }]);
                                }

                                scope.filterArtifactList = function (effectLibrary, xrefList) {
                                    var artifactList = (_.findWhere(xrefList, {libraryId: effectLibrary._id}) || {}).artifactList;

                                    return uiUtilService.filterSelection(effectLibrary.artifactList, artifactList, [{
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

                                scope.markArtifactSelection = function (effectLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: effectLibrary._id}) || {},
                                        artifactList = xref.artifactList;

                                    return uiUtilService.markSelection(effectLibrary.artifactList, artifactList, [{
                                        target: '_id',
                                        source: 'artifactId'
                                    }]);
                                }

                                scope.isPartialSelection = function (effectLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: effectLibrary._id}),
                                        artifactList = effectLibrary.artifactList;

                                    return xref && artifactList.length > xref.artifactList.length;
                                }

                                scope.pseudo = "";
                                scope.effectList = [];
                                scope.effectLibraryList = $rootScope.effectLibraryList;
                                scope.filterEffectLibraryList = [];
                                scope.project = $rootScope.loadedProject;
                            },
                            post: function (scope, element, attrs) {
                                scope.toggleTextShadowControl = function () {
                                    scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            scope.setTextShadow(_.clone(options.textShadow));
                                        } else {
                                            scope.textShadow = angular.copy(scope.unsetStyle(scope.textShadow, scope.pseudo));
                                        }
                                    });
                                }

                                scope.togglePalette = function (event) {
                                    //toggleDisplayService is bought from extension object
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if ($wrapper.hasClass("expanded")) {
                                        scope.selectTab($panel, $panel.find("div[tab-sel^='tab-head-text-shadow-value']:nth-child(1)")).then(
                                            function () {
                                                return scope.toggleDisplay($panel);
                                            }
                                        ).then(function () {
                                                return scope.toggleExpand($wrapper);
                                            });
                                    } else {
                                        scope.toggleExpand($wrapper).then(function () {
                                            return scope.toggleDisplay($panel);
                                        }).then(
                                            function () {
                                                scope.selectTab($panel, $panel.find("div[tab-sel^='tab-head-text-shadow-value']:nth-child(1)"));
                                            }
                                        );
                                    }
                                }

                                scope.toggleShadowStopColorPalette = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $palette = element.find(".shadowStopColorPalette"),
                                        paletteScope = angular.element($palette.find("> :first-child")).scope();

                                    if (scope.hasClass(".shadowStopColorPalette", "show")) {
                                        paletteScope.closePalette().then(function () {
                                            scope.watchSelectedShadowStopColor(false);
                                        });
                                    } else {
                                        var top = element.find(".shadowStop[shadow-order=" + scope.selectedShadowStopIndex + "]").offset().top,
                                            paletteOffset = $palette.offset();
                                        paletteOffset.top = top;
                                        $palette.offset(paletteOffset);

                                        paletteScope.openPalette().then(function () {
                                            scope.watchSelectedShadowStopColor(true);
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
                                        $timeout(function () {
                                            scope.setTextShadow(angular.copy(value.style["text-shadow"]));
                                        });
                                    }
                                }

                                scope.toggleShadowStopMenu = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleDisplay(".shadowStop[shadow-order=" + index + "] .circular-menu .circle", event);
                                }

                                scope.insertShadowStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    var shadowStop = angular.extend({}, scope.pickedTextShadow[index]);
                                    scope.pickedTextShadow.splice(index + 1, 0, shadowStop);

                                    //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                    scope.setTextShadow(scope.pickedTextShadow);
                                }
                                scope.removeShadowStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    if (scope.pickedTextShadow.length > 1 && index < scope.pickedTextShadow.length) {
                                        scope.pickedTextShadow.splice(index, 1);

                                        //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                        scope.setTextShadow(scope.pickedTextShadow);
                                    }
                                }
                                scope.setShadowStopColor = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    if (index < scope.pickedTextShadow.length) {
                                        scope.selectedShadowStopColor = scope.pickedTextShadow[index].color;
                                        scope.selectedShadowStopIndex = index;

                                        scope.toggleShadowStopColorPalette();
                                    }
                                }
                                scope.copyShadowStop = function (index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(index, event);

                                    if (index < scope.pickedTextShadow.length) {
                                        scope.copiedShadowStopColor = scope.pickedTextShadow[index].color;
                                    }
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
                                }

                                scope.setStopColor = function (index, hex, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (index < scope.pickedTextShadow.length) {
                                        var shadowStop = scope.pickedTextShadow[index];

                                        if (hex !== shadowStop.color) {
                                            shadowStop.color = "";

                                            $timeout(function () {
                                                shadowStop.color = hex;

                                                //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                                scope.setTextShadow(scope.pickedTextShadow);
                                            }).then($timeout(function () {
                                                var $shadowStop = element.find(".shadowStop[shadow-order=" + index + "]");

                                                uiUtilService.onAnimationEnd($shadowStop).then(
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
                                    scope.pickedTextShadow = value;

                                    var pseudoStylePrefix = (scope.pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.textShadow[pseudoStylePrefix] = scope.textShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.textShadow[pseudoStylePrefix];
                                    pseudoShadowStyle['text-shadow'] = value;

                                    //Trigger watcher on sketchWidgetSetting.textShadow to apply style to widget
                                    scope.textShadow = angular.copy(scope.textShadow);
                                }

                                scope.toggleArtifactSelection = function (repoArtifact, effectLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    repoArtifact._version = (repoArtifact.versionList.length && repoArtifact.versionList[repoArtifact.versionList.length - 1].name || "");

                                    if (repoArtifact._version) {
                                        var xref = _.findWhere(scope.project.xrefRecord, {libraryId: effectLibrary._id});

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
                                                if (scope.project.selectArtifact(effectLibrary._id, repoArtifact._id, repoArtifact.name, repoArtifact._version)) {
                                                    repoArtifact._selected = true;
                                                }
                                            }
                                        } else {
                                            if (effectLibrary.uiControl === "uiTextShadowEditor") {
                                                scope.project.addLibrary(
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
                                }

                                scope.toggleLibrarySelection = function (effectLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var library = _.findWhere(scope.project.xrefRecord, {libraryId: effectLibrary._id});
                                    if (library) {
                                        if (scope.project.removeLibrary(effectLibrary._id)) {
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

                                        if (artifactList.length && scope.project.addLibrary(effectLibrary._id, effectLibrary.name, effectLibrary.type, artifactList)) {
                                            effectLibrary._selected = true;

                                            if (scope.filterEffectLibraryList.every(function (lib) {
                                                    return lib._id !== effectLibrary._id;
                                                })) {
                                                scope.filterEffectLibraryList.push(effectLibrary);
                                            }
                                        }
                                    }
                                }

                                uiUtilService.whilst(
                                    function () {
                                        return !scope.project;
                                    },
                                    function (callback) {
                                        callback();
                                    },
                                    function (err) {
                                        return appService.loadEffectArtifactList().then(function () {
                                            var arr = scope.filterLibraryList(_.where(scope.effectLibraryList, {uiControl: "uiTextShadowEditor"}), scope.project.xrefRecord);
                                            arr.splice(0, 0, 0, 0);
                                            scope.filterEffectLibraryList.splice(0, scope.filterEffectLibraryList.length);
                                            Array.prototype.splice.apply(scope.filterEffectLibraryList, arr);

                                            return uiUtilService.getResolveDefer();
                                        }, function (err) {
                                            return uiUtilService.getRejectDefer(err);
                                        });
                                    }, angularConstants.checkInterval
                                );

                            }
                        }
                    }
                }
            }]));
        }
    }
);