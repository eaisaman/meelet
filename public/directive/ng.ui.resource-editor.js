define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$rootScope", "$http", "$timeout", "$q", "$interval", "$exceptionHandler", "angularEventTypes", "angularConstants", "utilService", "uiWaveVisualizerService"];

            appModule.directive("uiResourceEditor", _.union(inject, [function ($rootScope, $http, $timeout, $q, $interval, $exceptionHandler, angularEventTypes, angularConstants, utilService, uiWaveVisualizerService) {
                'use strict';

                var boundProperties = {},
                    defaults = {},
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "="}, boundProperties),
                    replace: false,
                    transclude: false,
                    templateUrl: "include/_resource-editor.html",
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

                                scope.onUploadSuccess = function (resourceType, $file, $message) {
                                    if ($message) {
                                        var ret = JSON.parse($message);
                                        if (ret.result === "OK") {
                                            $rootScope.loadedProject.addResource(resourceType, ret.resultValue);
                                        }
                                    }

                                    $file.cancel();
                                }

                                scope.deleteResource = function (resourceType, resourceItem, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (resourceType && resourceItem) {
                                        return $rootScope.loadedProject.deleteResource(resourceType, resourceItem);
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.pickedMarkers = [];
                            },
                            post: function (scope, element, attrs) {
                                function startInsertAudioPart(audioClip) {
                                    scope.pickedAudioClip = audioClip;
                                    scope.$editorEl.find("#audioSideBar .sideBarContainer:not(.ng-hide) #waveCanvasContainer .waveMarkers").addClass("insertPart");
                                }

                                function cancelInsertAudioPart() {
                                    scope.pickedAudioClip = null;
                                    scope.$editorEl && scope.$editorEl.find("#audioSideBar .sideBarContainer:not(.ng-hide) #waveCanvasContainer .waveMarkers").removeClass("insertPart");
                                }

                                function displayInsertPartPopup($marker) {
                                    if (scope.pickedAudioClip) {
                                        var $insertPartPopup = scope.$editorEl.find("#audioSideBar .sideBarContainer:not(.ng-hide) #waveCanvasContainer .insertPartPopup"),
                                            markerWidth,
                                            markerHeight,
                                            popupLeft,
                                            popupTop;

                                        var m = ($marker.css("width") || "").match(/([-\d\.]+)px$/);
                                        if (m && m.length == 2) markerWidth = parseInt(m[1]);
                                        m = ($marker.css("height") || "").match(/([-\d\.]+)px$/);
                                        if (m && m.length == 2) markerHeight = parseInt(m[1]);

                                        if ($marker.data("marker").progress < 1) {
                                            popupLeft = $marker.offset().left + 1;
                                        } else {
                                            var popupWidth;
                                            m = ($insertPartPopup.css("width") || "").match(/([-\d\.]+)px$/);
                                            if (m && m.length == 2) popupWidth = parseInt(m[1]);

                                            popupLeft = $marker.offset().left + markerWidth - popupWidth + 1;
                                        }
                                        popupTop = $marker.offset().top + markerHeight + 1;
                                        popupLeft = popupLeft - $insertPartPopup.parent().offset().left;
                                        popupTop = popupTop - $insertPartPopup.parent().offset().top;
                                        popupLeft = Math.floor(popupLeft * angularConstants.precision) / angularConstants.precision;
                                        popupTop = Math.floor(popupTop * angularConstants.precision) / angularConstants.precision;
                                        $insertPartPopup.css("left", popupLeft + "px");
                                        $insertPartPopup.css("top", popupTop + "px");

                                        $insertPartPopup.data("marker", $marker.data("marker"));

                                        scope.toggleDisplay($insertPartPopup, null, true);
                                    }
                                }

                                scope.hideInsertPartPopup = function () {
                                    if (scope.pickedAudioClip) {
                                        var $insertPartPopup = scope.$editorEl.find("#audioSideBar .sideBarContainer:not(.ng-hide) #waveCanvasContainer .insertPartPopup");

                                        $insertPartPopup.removeData("marker");

                                        return scope.toggleDisplay($insertPartPopup, null, false);
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.insertPartAfter = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.pickedAudioClip) {
                                        var $insertPartPopup = scope.$editorEl.find("#audioSideBar .sideBarContainer:not(.ng-hide) #waveCanvasContainer .insertPartPopup"),
                                            marker = $insertPartPopup.data("marker");

                                        uiWaveVisualizerService.insertAudioPart(marker.progress, scope.pickedAudioClip).then(function () {
                                            return scope.hideInsertPartPopup();
                                        });
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.saveAudio = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    return uiWaveVisualizerService.saveAudio();
                                }

                                scope.playPauseAudio = function (event) {
                                    function playStateHandler(isPlaying) {
                                        scope.isPlaying = isPlaying;
                                        scope.$apply();
                                    }

                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.isPlaying = uiWaveVisualizerService.playPause(playStateHandler);

                                    return utilService.getResolveDefer();
                                }

                                scope.stopAudio = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.isPlaying = false;
                                    uiWaveVisualizerService.stopPlay();

                                    return utilService.getResolveDefer();
                                }

                                scope.cutAudioClip = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.pickedMarkers.length === 2) {
                                        var startProgress = Math.min(scope.pickedMarkers[0].progress, scope.pickedMarkers[1].progress),
                                            endProgress = Math.max(scope.pickedMarkers[0].progress, scope.pickedMarkers[1].progress);

                                        uiWaveVisualizerService.collectAudioClip(startProgress, endProgress).then(
                                            function () {
                                                if (_.findWhere(scope.pickedMarkers, {progress: scope.activeMarker.progress})) {
                                                    scope.activeMarker = null;
                                                    scope.$activeMarkerElement = null;
                                                }
                                                scope.pickedMarkers.splice(0);

                                                uiWaveVisualizerService.removeAudioPart(startProgress, endProgress);
                                            }
                                        );
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.copyAudioClip = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.pickedMarkers.length === 2) {
                                        var startProgress = Math.min(scope.pickedMarkers[0].progress, scope.pickedMarkers[1].progress),
                                            endProgress = Math.max(scope.pickedMarkers[0].progress, scope.pickedMarkers[1].progress);

                                        uiWaveVisualizerService.collectAudioClip(startProgress, endProgress);
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.removeAudioPart = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.pickedMarkers.length === 2) {
                                        var startProgress = Math.min(scope.pickedMarkers[0].progress, scope.pickedMarkers[1].progress),
                                            endProgress = Math.max(scope.pickedMarkers[0].progress, scope.pickedMarkers[1].progress);

                                        if (_.findWhere(scope.pickedMarkers, {progress: scope.activeMarker.progress})) {
                                            scope.activeMarker = null;
                                            scope.$activeMarkerElement = null;
                                        }
                                        scope.pickedMarkers.splice(0);

                                        uiWaveVisualizerService.removeAudioPart(startProgress, endProgress);
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.toggleSelectAudioClip = function (audioClip, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $clipItem = $(event.target);
                                    $clipItem.toggleClass("select");
                                    if ($clipItem.hasClass("select")) {
                                        $clipItem.siblings().removeClass("select");

                                        startInsertAudioPart(audioClip);
                                    } else {
                                        cancelInsertAudioPart();
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.removeAudioClip = function (audioClip, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (!audioClip.isPlaying) {
                                        var $el = $(event.target),
                                            $clipItem = $el.parent(".waveClipItem"),
                                            index;

                                        if ($clipItem.length && !scope.audioClips.every(function (item, i) {
                                                if (item === audioClip) {
                                                    index = i;
                                                    return false;
                                                }
                                                return true;
                                            })) {
                                            if ($clipItem.hasClass("select")) {
                                                cancelInsertAudioPart();
                                            }

                                            $clipItem.addClass("moveOut");
                                            utilService.onAnimationEnd($clipItem).then(function () {
                                                scope.audioClips.splice(index, 1);
                                            });
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.toggleAudioClipLoop = function (audioClip, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    audioClip.isLooped = !audioClip.isLooped;

                                    return utilService.getResolveDefer();
                                }

                                scope.playPauseAudioClip = function (audioClip, event) {
                                    function playStateHandler(clip, isPlaying) {
                                        clip.isPlaying = isPlaying;
                                        scope.$apply();
                                    }

                                    event && event.stopPropagation && event.stopPropagation();

                                    audioClip.isPlaying = uiWaveVisualizerService.playPauseAudioClip(audioClip, playStateHandler);

                                    return utilService.getResolveDefer();
                                }

                                scope.insertAudioPart = function (marker, audioClip) {
                                    return uiWaveVisualizerService.insertAudioPart(marker, audioClip);
                                }

                                scope.addMarker = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.pickedMarkers.length < 2) {
                                        var ret = uiWaveVisualizerService.addMarker();
                                        scope.activeMarker = ret[0];
                                        scope.$activeMarkerElement = ret[1];
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.toggleMarkerEditMode = function (event, mode) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $el = $(event.target);
                                    $el.toggleClass("select");
                                    if ($el.hasClass("select")) {
                                        $el.siblings().removeClass("select");
                                        scope.markerEditMode = mode;
                                    } else {
                                        scope.markerEditMode = null;
                                    }

                                    return scope.toggleAudioSideBar(scope.markerEditMode === "DisplayClips");
                                }

                                scope.toggleAudioSideBar = function (state) {
                                    var $sidebar = $("#audioSidebar"),
                                        sideBarScope = angular.element($sidebar.find(".sideBarContainer")).scope();

                                    return sideBarScope.toggleSideBar(null, state);
                                }

                                scope.toggleSelectMarker = function (evt) {
                                    evt && evt.stopPropagation && evt.stopPropagation();

                                    var $marker = $(evt.target),
                                        touchX = $marker.data("touchX"),//Which is set by hammer gesture
                                        data = $marker.data("marker"),
                                        index;

                                    if (touchX == null && data) {
                                        if (scope.pickedAudioClip) {
                                            displayInsertPartPopup($marker);
                                        } else {
                                            scope.pickedMarkers.every(function (marker, i) {
                                                if (marker.progress === data.progress) {
                                                    index = i;
                                                    return false;
                                                }

                                                return true;
                                            });

                                            if (scope.markerEditMode === "RemoveMarker") {
                                                uiWaveVisualizerService.removeMarker(data);
                                                index != null && scope.pickedMarkers.splice(index, 1);
                                            } else {
                                                if (scope.activeMarker && scope.activeMarker !== data) {
                                                    if (index == null && scope.pickedMarkers.length === 2) {
                                                        var prevIndex;
                                                        if (!scope.pickedMarkers.every(function (marker, i) {
                                                                if (marker === scope.activeMarker) {
                                                                    prevIndex = i;
                                                                    return false;
                                                                }

                                                                return true;
                                                            })) {
                                                            scope.pickedMarkers.splice(prevIndex, 1)
                                                        }
                                                        scope.toggleSelect(scope.$activeMarkerElement);
                                                    }

                                                    scope.activeMarker = data;
                                                    scope.$activeMarkerElement = $marker;
                                                    scope.toggleSelect($marker, null, true);
                                                    index != null || scope.pickedMarkers.push(data);
                                                } else {
                                                    scope.toggleSelect($marker);

                                                    scope.activeMarker = null;
                                                    scope.$activeMarkerElement = null;
                                                    if ($marker.hasClass("select")) {
                                                        scope.activeMarker = data || null;
                                                        scope.$activeMarkerElement = $marker;
                                                    }
                                                    index != null && scope.pickedMarkers.splice(index, 1) || scope.pickedMarkers.push(data);
                                                }

                                                uiWaveVisualizerService.selectMarker(scope.activeMarker);
                                            }
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.displayResourceEditor = function (resourceType, fileName, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.resourceEditorType = resourceType;

                                    var editorEl = element.find(".resourceEditor");
                                    utilService.broadcast(scope,
                                        angularEventTypes.resourceEditEvent,
                                        {
                                            editor: editorEl.length && editorEl || null,
                                            callback: function ($editorEl) {
                                                scope.editorAttached = true;
                                                scope.$editorEl = $editorEl;
                                                if (resourceType === "audio") {
                                                    uiWaveVisualizerService.initCanvas(scope.$editorEl.find("#audioSideBar .sideBarContainer:not(.ng-hide) #waveCanvasContainer"));
                                                    scope.audioClips = uiWaveVisualizerService.audioClips;
                                                }
                                            }
                                        }
                                    );

                                    return utilService.whilst(
                                        function () {
                                            return !scope.editorAttached;
                                        }, function (err) {
                                            err || utilService.latestOnce(
                                                function () {
                                                    return $timeout(function () {
                                                        if (resourceType === "audio") {
                                                            uiWaveVisualizerService.loadAudio($rootScope.loadedProject.projectRecord._id, fileName);
                                                        }
                                                    });
                                                },
                                                null,
                                                null,
                                                angularConstants.unresponsiveInterval,
                                                "ui.resource-editor.displayResourceEditor"
                                            )();
                                        },
                                        angularConstants.checkInterval,
                                        "ui.resource-editor.displayResourceEditor",
                                        angularConstants.renderTimeout
                                    );
                                }

                                scope.resourceEditEndWatcher = scope.$on(angularEventTypes.resourceEditEndEvent, function (event) {
                                    utilService.once(function () {
                                        return $timeout(function () {
                                            uiWaveVisualizerService.release();

                                            cancelInsertAudioPart();
                                        });
                                    }, null, angularConstants.unresponsiveInterval, "ui.resource.editor.resourceEditEndWatcher")();
                                });

                                scope.$on('$destroy', function () {
                                    scope.resourceEditEndWatcher && scope.resourceEditEndWatcher();
                                    scope.resourceEditEndWatcher = null;
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);