define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$rootScope", "$http", "$timeout", "$q", "$exceptionHandler", "angularEventTypes", "angularConstants", "uiUtilService", "uiWaveVisualizerService"];

            appModule.directive("uiResourceEditor", _.union(inject, [function ($rootScope, $http, $timeout, $q, $exceptionHandler, angularEventTypes, angularConstants, uiUtilService, uiWaveVisualizerService) {
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

                                scope.playPauseAudio = function (event) {
                                    function playStateHandler(isPlaying) {
                                        scope.isPlaying = isPlaying;
                                        scope.$apply();
                                    }

                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.isPlaying = uiWaveVisualizerService.playPause(playStateHandler);
                                }

                                scope.stopAudio = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.isPlaying = false;
                                    uiWaveVisualizerService.stopPlay();
                                }

                                scope.cutAudioClip = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.pickedMarkers.length === 2) {
                                        var startProgress = Math.min(scope.pickedMarkers[0].progress, scope.pickedMarkers[1].progress),
                                            endProgress = Math.max(scope.pickedMarkers[0].progress, scope.pickedMarkers[1].progress);

                                        uiWaveVisualizerService.collectAudioClip(startProgress, endProgress).then(
                                            function () {
                                                uiWaveVisualizerService.removeAudioPart(startProgress, endProgress);
                                            }
                                        );
                                    }
                                }

                                scope.copyAudioClip = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.pickedMarkers.length === 2) {
                                        var startProgress = Math.min(scope.pickedMarkers[0].progress, scope.pickedMarkers[1].progress),
                                            endProgress = Math.max(scope.pickedMarkers[0].progress, scope.pickedMarkers[1].progress);

                                        uiWaveVisualizerService.collectAudioClip(startProgress, endProgress);
                                    }
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
                                            uiUtilService.onAnimationEnd($clipItem).then(function () {
                                                scope.audioClips.splice(index, 1);
                                            });
                                        }
                                    }
                                }

                                scope.toggleAudioClipLoop = function (audioClip, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    audioClip.isLooped = !audioClip.isLooped;
                                }

                                scope.playPauseAudioClip = function (audioClip, event) {
                                    function playStateHandler(clip, isPlaying) {
                                        clip.isPlaying = isPlaying;
                                        scope.$apply();
                                    }

                                    event && event.stopPropagation && event.stopPropagation();

                                    audioClip.isPlaying = uiWaveVisualizerService.playPauseAudioClip(audioClip, playStateHandler);
                                }

                                scope.insertAudioPart = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();
                                }

                                scope.addMarker = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (scope.pickedMarkers.length < 2) {
                                        var ret = uiWaveVisualizerService.addMarker();
                                        scope.activeMarker = ret[0];
                                        scope.$activeMarkerElement = ret[1];
                                    }
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

                                    scope.toggleAudioSideBar(scope.markerEditMode === "DisplayClips");
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
                                }

                                scope.displayResourceEditor = function (resourceType, fileName, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    scope.resourceEditorType = resourceType;

                                    var editorEl = element.find(".resourceEditor");
                                    uiUtilService.broadcast(scope,
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

                                    return uiUtilService.whilst(
                                        function () {
                                            return !scope.editorAttached;
                                        }, function (callback) {
                                            callback();
                                        }, function () {
                                            uiUtilService.latestOnce(
                                                function () {
                                                    return $timeout(function () {
                                                        if (resourceType === "audio") {
                                                            uiWaveVisualizerService.loadAudio($rootScope.loadedProject.projectRecord._id, fileName);
                                                        }
                                                    });
                                                },
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
                                    uiUtilService.once(function () {
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