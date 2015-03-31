define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$parse", "$rootScope", "$http", "$timeout", "$q", "$exceptionHandler", "angularConstants", "angularEventTypes", "uiUtilService", "appService"];

            appModule.directive("uiBoxShadowEditor", _.union(inject, [function ($parse, $rootScope, $http, $timeout, $q, $exceptionHandler, angularConstants, angularEventTypes, uiUtilService, appService) {
                'use strict';

                var boundProperties = {boxShadow: "="},
                    defaults = {
                        boxShadow: {
                            style: {
                                'box-shadow': []
                            },
                            beforeStyle: {
                                'box-shadow': []
                            },
                            afterStyle: {
                                'box-shadow': []
                            }
                        }
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_box-shadow.html",
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
                                            boxShadow: function (value) {
                                                if (value && scope.hasStyle(value)) {
                                                    scope.pickedBoxShadow = value;
                                                    scope.enableControl();
                                                } else {
                                                    scope.disableControl();
                                                }
                                            }
                                        },
                                        {boxShadow: "uiBoxShadowEditor"})
                                );

                                function createBoxShadowValueInputAssign(name) {
                                    var fn = $parse(name),
                                        assign = fn.assign;

                                    if (!fn.assign.customized) {
                                        fn.assign = function ($scope, value) {
                                            function shadowHandler() {
                                                var defer = $q.defer();

                                                $timeout(function () {
                                                    //Trigger watcher on sketchWidgetSetting.boxShadow to apply style to widget
                                                    scope.setBoxShadow(scope.pickedBoxShadow);
                                                    defer.resolve();
                                                });

                                                return defer.promise;
                                            }

                                            shadowHandler.onceId = "uiBoxShadowEditor.createBoxShadowValueInputAssign.shadowHandler";

                                            if (value) {
                                                var args = Array.prototype.slice.call(arguments),
                                                    result = assign.apply(fn, args);

                                                uiUtilService.once(shadowHandler, null, angularConstants.unresponsiveInterval)(value);

                                                return result;
                                            }
                                        }

                                        fn.assign.customized = true;
                                    }
                                    return fn;
                                }

                                createBoxShadowValueInputAssign("shadowStop['h-shadow']");
                                createBoxShadowValueInputAssign("shadowStop['v-shadow']");
                                createBoxShadowValueInputAssign("shadowStop['blur']");
                                createBoxShadowValueInputAssign("shadowStop['spread']");

                                createBoxShadowValueInputAssign("pickedBoxShadow.beforeStyle[shadowStyle]");
                                createBoxShadowValueInputAssign("pickedBoxShadow.afterStyle[shadowStyle]");

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

                                    return xref && artifactList && artifactList.length > xref.artifactList.length;
                                }

                                scope.styleNames = ['left', 'top', 'right', 'bottom', 'width', 'height'];
                            },
                            post: function (scope, element, attrs) {
                                scope.toggleBoxShadowControl = function () {
                                    scope.toggleEnableControl().then(function (enable) {
                                        if (enable) {
                                            uiUtilService.whilst(
                                                function () {
                                                    return !scope.boxShadow;
                                                },
                                                function (callback) {
                                                    callback();
                                                },
                                                function (err) {
                                                    scope.setBoxShadow(angular.copy(options.boxShadow));

                                                    return uiUtilService.getResolveDefer();
                                                },
                                                angularConstants.checkInterval,
                                                "ui-box-shadow-editor.toggleBoxShadowControl",
                                                angularConstants.renderTimeout
                                            );
                                        } else {
                                            if (scope.boxShadow) {
                                                scope.boxShadow = angular.copy(scope.unsetStyles(scope.boxShadow));
                                            }
                                        }
                                    });
                                }

                                scope.togglePalette = function (event) {
                                    //toggleDisplayService is bought from extension object
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel");

                                    if ($wrapper.hasClass("expanded")) {
                                        scope.selectTab($panel, $panel.find("div[tab-sel^='tab-head-box-shadow-value']:nth-child(1)")).then(
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
                                                scope.selectTab($panel, $panel.find("div[tab-sel^='tab-head-box-shadow-value']:nth-child(1)"));
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
                                        var top = element.find(".shadowStopGroup[pseudo='" + scope.selectedShadowPseudo + "'] .shadowStop[shadow-order=" + scope.selectedShadowStopIndex + "]").offset().top,
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
                                                to && scope.setStopColor(scope.selectedShadowPseudo, scope.selectedShadowStopIndex, to);
                                            });
                                        }
                                    } else {
                                        scope.deregisterWatch && scope.deregisterWatch();
                                        scope.deregisterWatch = null;
                                    }
                                }

                                scope.pickBoxShadow = function (value, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (value) {
                                        scope.pickedBoxShadow = null;
                                        scope.pickedBoxShadowName = value.name;
                                        $timeout(function () {
                                            var styles = {style: {}, beforeStyle: {}, afterStyle: {}};
                                            ["style", "beforeStyle", "afterStyle"].forEach(function (pseudoStylePrefix) {
                                                _.each(value[pseudoStylePrefix], function (styleValue, key) {
                                                    styles[pseudoStylePrefix][key] = angular.copy(styleValue);
                                                })
                                            });
                                            scope.setBoxShadow(styles);
                                        });
                                    }
                                }

                                scope.toggleShadowStopMenu = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleDisplay(".shadowStopGroup[pseudo='" + pseudo + "'] .shadowStop[shadow-order=" + index + "] .circular-menu .circle", event);
                                }

                                scope.insertShadowStop = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(pseudo, index, event);

                                    var pseudoStylePrefix = (pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix],
                                        shadowStop = angular.extend({}, pseudoShadowStyle['box-shadow'][index]);
                                    pseudoShadowStyle['box-shadow'].splice(index + 1, 0, shadowStop);

                                    //Trigger watcher on sketchWidgetSetting.boxShadow to apply style to widget
                                    scope.setBoxShadow(scope.pickedBoxShadow);
                                }

                                scope.removeShadowStop = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(pseudo, index, event);

                                    var pseudoStylePrefix = (pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix];
                                    if (pseudoShadowStyle['box-shadow'].length > 1 && index < pseudoShadowStyle['box-shadow'].length) {
                                        pseudoShadowStyle['box-shadow'].splice(index, 1);

                                        //Trigger watcher on sketchWidgetSetting.boxShadow to apply style to widget
                                        scope.setBoxShadow(scope.pickedBoxShadow);
                                    }
                                }

                                scope.setShadowStopColor = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(pseudo, index, event);

                                    var pseudoStylePrefix = (pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix];
                                    if (index < pseudoShadowStyle['box-shadow'].length) {
                                        scope.selectedShadowStopColor = pseudoShadowStyle['box-shadow'][index].color;
                                        scope.selectedShadowPseudo = pseudo;
                                        scope.selectedShadowStopIndex = index;

                                        scope.toggleShadowStopColorPalette();
                                    }
                                }

                                scope.copyShadowStop = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(pseudo, index, event);

                                    var pseudoStylePrefix = (pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix];
                                    if (index < pseudoShadowStyle['box-shadow'].length) {
                                        scope.copiedShadowStopColor = pseudoShadowStyle['box-shadow'][index].color;
                                    }
                                }

                                scope.pasteShadowStop = function (pseudo, index, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.toggleShadowStopMenu(pseudo, index, event);

                                    var pseudoStylePrefix = (pseudo || "") + "Style";
                                    pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                    scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                    var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix];
                                    if (scope.copiedShadowStopColor && index < pseudoShadowStyle['box-shadow'].length) {
                                        var shadowStop = pseudoShadowStyle['box-shadow'][index];

                                        if (scope.copiedShadowStopColor !== shadowStop.color) {
                                            scope.setStopColor(pseudo, index, scope.copiedShadowStopColor);
                                        }
                                    }
                                }

                                scope.setStopColor = function (pseudo, index, value, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (value.color) {
                                        var pseudoStylePrefix = (pseudo || "") + "Style";
                                        pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                                        scope.pickedBoxShadow[pseudoStylePrefix] = scope.pickedBoxShadow[pseudoStylePrefix] || {};
                                        var pseudoShadowStyle = scope.pickedBoxShadow[pseudoStylePrefix];
                                        if (index < pseudoShadowStyle['box-shadow'].length) {
                                            if (value.alpha < 1 && !value.alphaColor) {
                                                value.alphaColor = uiUtilService.rgba(value);
                                            }

                                            var shadowStop = pseudoShadowStyle['box-shadow'][index];

                                            if (value !== shadowStop.color) {
                                                shadowStop.color = null;

                                                $timeout(function () {
                                                    shadowStop.color = _.pick(value, ["color", "alpha", "alphaColor"]);

                                                    //Trigger watcher on sketchWidgetSetting.boxShadow to apply style to widget
                                                    scope.setBoxShadow(scope.pickedBoxShadow);
                                                }).then($timeout(function () {
                                                    var $shadowStop = element.find(".shadowStopGroup[pseudo='" + pseudo + "'] .shadowStop[shadow-order=" + index + "]");

                                                    uiUtilService.onAnimationEnd($shadowStop).then(
                                                        function () {
                                                            $shadowStop.removeClass("animate");
                                                        }
                                                    );
                                                    $shadowStop.addClass("animate");
                                                }));
                                            }
                                        }
                                    }

                                    return true;
                                }

                                scope.setBoxShadow = function (value) {
                                    if (value) {
                                        ["style", "beforeStyle", "afterStyle"].forEach(function (pseudoStylePrefix) {
                                            if (value[pseudoStylePrefix]["box-shadow"]) {
                                                value[pseudoStylePrefix]["box-shadow"].forEach(function (shadowStop) {
                                                    if (typeof shadowStop.color === "string") {
                                                        shadowStop.color = {color: shadowStop.color, alpha: 1};
                                                    } else if (typeof shadowStop.color === "object") {
                                                        shadowStop.color = _.pick(shadowStop.color, ["color", "alpha", "alphaColor"]);
                                                        if (shadowStop.color.alpha < 1 && !shadowStop.color.alphaColor) {
                                                            shadowStop.color.alphaColor = uiUtilService.rgba(shadowStop.color);
                                                        }
                                                    }
                                                });
                                            }
                                        });

                                        value.source = "uiBoxShadowEditor";
                                        scope.pickedBoxShadow = value;

                                        //Trigger watcher on sketchWidgetSetting.boxShadow to apply style to widget
                                        scope.boxShadow = angular.copy(value);
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
                                            if (effectLibrary.uiControl === "uiBoxShadowEditor") {
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
                                    } else if (effectLibrary.uiControl === "uiBoxShadowEditor") {
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
                                }

                                scope.$on(angularEventTypes.switchProjectEvent, function (event, data) {
                                    if (data) {
                                        var arr = scope.filterLibraryList(_.where(scope.effectLibraryList, {uiControl: "uiBoxShadowEditor"}), $rootScope.loadedProject.xrefRecord);
                                        arr.splice(0, 0, 0, 0);
                                        scope.filterEffectLibraryList.splice(0, scope.filterEffectLibraryList.length);
                                        Array.prototype.splice.apply(scope.filterEffectLibraryList, arr);
                                    }
                                });

                                scope.effectList = [];
                                scope.effectLibraryList = $rootScope.effectLibraryList;
                                scope.filterEffectLibraryList = [];

                                $timeout(function () {
                                    uiUtilService.whilst(
                                        function () {
                                            return !$rootScope.loadedProject;
                                        },
                                        function (callback) {
                                            callback();
                                        },
                                        function (err) {
                                            appService.loadEffectArtifactList().then(function () {
                                                var arr = scope.filterLibraryList(_.where(scope.effectLibraryList, {uiControl: "uiBoxShadowEditor"}), $rootScope.loadedProject.xrefRecord);
                                                arr.splice(0, 0, 0, 0);
                                                scope.filterEffectLibraryList.splice(0, scope.filterEffectLibraryList.length);
                                                Array.prototype.splice.apply(scope.filterEffectLibraryList, arr);
                                            });
                                        },
                                        angularConstants.checkInterval,
                                        "ui-box-shadow-editor.compile.post",
                                        angularConstants.renderTimeout
                                    );
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);