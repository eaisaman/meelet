define(
    ["angular-lib", "jquery-lib", "fabric-lib", "wavesurfer-lib"],
    function () {
        var WaveVisualizer = function ($log, $compile, $parse, $timeout, $q, $exceptionHandler, flowFactory, utilService, uiCanvasService, angularConstants, angularEventTypes) {
                this.$log = $log;
                this.$compile = $compile;
                this.$parse = $parse;
                this.$timeout = $timeout;
                this.$q = $q;
                this.$exceptionHandler = $exceptionHandler;
                this.flowFactory = flowFactory;
                this.utilService = utilService;
                this.angularConstants = angularConstants;
                this.angularEventTypes = angularEventTypes;

                this.playFinishListener = angular.noop;
                this.markers = [];
                this.audioClips = [];

                this.resourceFlow = flowFactory.create({
                    target: "api/public/projectResourceChunk",
                    simultaneousUploads: 1,
                    query: {
                        resourceType: 'audio'
                    },
                    generateUniqueIdentifier: function (file) {
                        return "{0}/{1}".format(file.attachedObj.projectId, file.attachedObj.fileName);
                    }
                });

                this.resourceFlow.on("fileError", function (flowFileObj, message) {
                    if (flowFileObj.file.attachedObj.defer) {
                        flowFileObj.file.attachedObj.defer.reject(message);
                    }
                    flowFileObj.file.attachedObj && flowFileObj.file.attachedObj.defer && flowFileObj.file.attachedObj.defer.reject(event);
                });
                this.resourceFlow.on("fileSuccess", function (flowFileObj, data) {
                    if (flowFileObj.file.attachedObj.defer) {
                        if (data.result === "OK") {
                            flowFileObj.file.attachedObj.defer.resolve();
                        } else {
                            flowFileObj.file.attachedObj.defer.reject(data.reason);
                        }
                    }

                    flowFileObj.cancel();
                });

                this.worker = new Worker(angularConstants.waveVisualizerWorkerPath);

                _.extend($inject, _.pick(this, WaveVisualizer.$inject));
            },
            PLAYING_STATE = 0,
            PAUSED_STATE = 1,
            FINISHED_STATE = 2,
            $canvasContainer,
            wavesurfer,
            clipAudioSource,
            clipScriptNode,
            currentSeekProgress = 0,
            clipPlayState = FINISHED_STATE,
            visualizerWaveSeekPrecision = 100000,
            visualizerWaveHeight = 256,
            VisualizerWaveColor = "#f2f3f3",
            VisualizerLineColor = "rgb(221,125,0)",
            visualizerSeekMarker = makeLine([0, 0, 0, 0], VisualizerLineColor),
            visualizerYAxis = makeLine([0, 0, 0, 0], VisualizerWaveColor),
            visualizerXAxis = makeLine([0, 0, 0, 0], VisualizerWaveColor);

        function makeLine(cords, color) {
            return new fabric.Line(cords, {
                originX: "center",
                originY: "center",
                fill: color,
                stroke: color,
                strokeWidth: 2,
                selectable: false
            });
        }

        function dragMarkerHandler(evt) {
            var $marker = $(evt.srcEvent.target),
                data = $marker.data("marker"),
                touchX = $marker.data("touchX") || 0;

            if (evt.type === "panstart") {
                touchX = evt.srcEvent.offsetX;
                $marker.data("touchX", touchX);
            }
            else if (evt.type === "panmove") {
                var left = evt.srcEvent.clientX - $marker.parent().offset().left - touchX;
                $marker.css("left", left + "px");
            }
            else if (evt.type === "panend") {
                var left = evt.srcEvent.clientX - $marker.parent().offset().left - touchX;
                $marker.css("left", left + "px");

                $inject.$timeout(function () {
                    $marker.removeData("touchX");
                }, $inject.angularConstants.eventThrottleInterval);
            }

            var bbox = wavesurfer.drawer.wrapper.getBoundingClientRect(),
                pos = $marker.offset().left - bbox.left + wavesurfer.drawer.wrapper.scrollLeft,
                progress = pos / wavesurfer.drawer.width;

            data.progress = Math.floor(progress * visualizerWaveSeekPrecision) / visualizerWaveSeekPrecision;
            visualizerSeekMarker.set({'x1': pos, 'x2': pos});
            visualizerSeekMarker.canvas.bringToFront(visualizerSeekMarker);
        }

        function drawMarkers(arr) {
            var $markers = [];

            if (wavesurfer) {
                var $waveMarkers = $canvasContainer.find('.waveCanvasPanel .waveMarkers'),
                    waveWidth = wavesurfer.drawer.width;

                arr.forEach(function (marker) {
                    var $marker = marker.$element;

                    if (!$marker) {
                        $marker = $("<div class='waveMarker' />").data("marker", marker).css("left", (waveWidth * marker.progress) + "px");
                        marker.$element = $marker;

                        if (marker.progress > 0 && marker.progress < 1) {
                            var mc = new Hammer.Manager($marker.get(0));

                            mc.add(new Hammer.Pan());
                            mc.on("panstart panmove panend", dragMarkerHandler);
                            $marker.data("destroyHammer", function () {
                                mc.off("panstart panmove panend", dragMarkerHandler);
                            });
                        }

                        $waveMarkers.append($marker);
                    }

                    $markers.push($marker);
                });
            }

            return $markers;
        }

        function clearMarkers(arr) {
            var $waveMarkers = $canvasContainer.find('.waveCanvasPanel .waveMarkers'),
                $markers = [];

            if (arr) {
                $waveMarkers.children().each(function (i, el) {
                    var $el = $(el),
                        marker = $el.data("marker"),
                        item = _.findWhere(arr, {progress: marker.progress});

                    if (item) {
                        $markers.push($el);
                    }
                });
            } else {
                $markers = $waveMarkers.children().toArray();
            }

            $markers.forEach(function (element) {
                var $marker = element.jquery && element || $(element),
                    hammerFn = $marker.data("destroyHammer");
                hammerFn && hammerFn();
                $marker.remove();
            });
        }

        function extendWaveSurferDrawer(visualizer) {
            WaveSurfer.Drawer.WaveVisualizer = Object.create(WaveSurfer.Drawer);

            _.extend(WaveSurfer.Drawer.WaveVisualizer, {
                createWrapper: function () {
                    this.wrapper = this.container.querySelector(".canvas-container");

                    if (this.params.fillParent || this.params.scrollParent) {
                        this.style(this.wrapper, {
                            overflowX: this.params.hideScrollbar ? 'hidden' : 'auto',
                            overflowY: 'hidden'
                        });
                    }

                    this.setupWrapperEvents();
                },
                createElements: function () {
                },
                handleEvent: function (e) {
                    e.preventDefault();
                    var bbox = this.wrapper.getBoundingClientRect();
                    return ((e.clientX - bbox.left + this.wrapper.scrollLeft) / this.wrapper.scrollWidth) || 0;
                },
                setupWrapperEvents: function () {
                    var self = this;

                    self.wrapperClickHandler = function (e) {
                        var scrollbarHeight = self.wrapper.offsetHeight - self.wrapper.clientHeight;
                        if (scrollbarHeight != 0) {
                            // scrollbar is visible.  Check if click was on it
                            var bbox = self.wrapper.getBoundingClientRect();
                            if (e.clientY >= bbox.bottom - scrollbarHeight) {
                                // ignore mousedown as it was on the scrollbar
                                return;
                            }
                        }

                        if (self.params.interact) {
                            var bbox = self.wrapper.getBoundingClientRect();
                            currentSeekProgress = ((e.clientX - bbox.left + self.wrapper.scrollLeft) / self.width) || 0;
                            if (currentSeekProgress > 1) currentSeekProgress = 1;
                            if (currentSeekProgress < 0) currentSeekProgress = 0;
                            currentSeekProgress = Math.floor(currentSeekProgress * visualizerWaveSeekPrecision) / visualizerWaveSeekPrecision;

                            self.fireEvent('click', e, currentSeekProgress);
                        }
                    }

                    self.wrapperScollHanlder = function (e) {
                        self.fireEvent('scroll', e);
                    }

                    self.wrapper.addEventListener('click', self.wrapperClickHandler);
                    self.wrapper.addEventListener('scroll', self.wrapperScollHanlder);
                },
                updateSize: function () {
                    var width = Math.round(this.width / window.devicePixelRatio),
                        height = Math.round(this.height / window.devicePixelRatio);

                    fabric.util.setStyle(visualizer.canvas.upperCanvasEl, {
                        width: width + 'px',
                        height: height + 'px'
                    });

                    this.clearWave();
                },
                clearWave: function () {
                    visualizer.canvas.clear();
                },
                drawWave: function (peaks, channelIndex) {
                    // Split channels
                    if (toString.call(peaks[0]) === '[object Array]') {
                        var channels = peaks;
                        if (this.params.splitChannels) {
                            this.setHeight(channels.length * this.params.height * window.devicePixelRatio);
                            channels.forEach(this.drawWave, this);
                            return;
                        } else {
                            peaks = channels[0];
                        }
                    }

                    if (peaks && toString.call(peaks) === "[object Array]") {
                        // A margin between split waveforms
                        var height = this.params.height;
                        var offsetY = height * channelIndex || 0;
                        var halfH = height / 2;
                        var length = peaks.length;
                        var scale = 1;
                        if (this.params.fillParent && this.width != length) {
                            scale = this.width / length;
                        }
                        var max = 1;
                        if (this.params.normalize) {
                            max = Math.max.apply(Math, peaks);
                        }

                        visualizer.canvas.fillStyle = this.params.waveColor;

                        var points = [{x: 0, y: halfH + offsetY}];

                        for (var i = 0; i < length; i++) {
                            var h = Math.round(peaks[i] / max * halfH);
                            points.push({x: i * scale, y: halfH + h + offsetY});
                        }
                        points.push({x: this.width, y: halfH + offsetY});

                        for (var j = length; j > 0; j--) {
                            var h = Math.round(peaks[j - 1] / max * halfH);
                            points.push({x: (j - 1) * scale, y: halfH - h + offsetY});
                        }

                        var polygon = new fabric.Polygon(points, {
                            left: 0,
                            top: 0,
                            fill: VisualizerWaveColor,
                            selectable: false
                        });

                        visualizer.canvas.add(polygon);

                        visualizer.canvas.bringToFront(visualizerYAxis);
                        visualizer.canvas.bringToFront(visualizerXAxis);
                        visualizerSeekMarker && visualizer.canvas.bringToFront(visualizerSeekMarker);

                        drawMarkers(visualizer.markers);
                    }
                },
                updateProgress: function (progress) {
                    var pos = Math.round(
                        this.width * progress
                    );

                    visualizerSeekMarker.set({'x1': pos, 'y1': 0, 'x2': pos, 'y2': visualizerWaveHeight});
                    visualizer.canvas.bringToFront(visualizerSeekMarker);
                },
                destroy: function () {
                    this.unAll();

                    if (this.wrapperClickHandler) {
                        this.wrapper.removeEventListener('click', this.wrapperClickHandler);
                        this.wrapperClickHandler = null;
                    }

                    if (this.wrapperScollHanlder) {
                        this.wrapper.removeEventListener('scroll', this.wrapperScollHanlder);
                        this.wrapperScollHanlder = null;
                    }
                }
            });
        }

        WaveVisualizer.prototype.release = function () {
            this.markers.splice(0);
            this.audioClips.splice(0);

            clearMarkers();

            wavesurfer && wavesurfer.destroy();
            if (clipAudioSource) {
                if (clipPlayState === PLAYING_STATE) clipAudioSource.stop(0);
                clipAudioSource.disconnect();
            }

            if (clipScriptNode) {
                clipScriptNode.disconnect();
                clipScriptNode.onaudioprocess = null;
            }

            wavesurfer = null;
            clipAudioSource = null;
            clipScriptNode = null;
            clipPlayState = FINISHED_STATE;

            this.canvas && this.canvas.dispose();
            this.canvas = null;
        }

        WaveVisualizer.prototype.initCanvas = function ($container) {
            var self = this;

            if (!self.canvas) {
                $canvasContainer = $container;

                var width,
                    height;
                var m = ($canvasContainer.css("width") || "").match(/([-\d\.]+)px$/);
                if (m && m.length == 2) width = parseInt(m[1]);
                m = ($canvasContainer.css("height") || "").match(/([-\d\.]+)px$/);
                if (m && m.length == 2) height = parseInt(m[1]);

                self.canvas = new fabric.Canvas($canvasContainer.find("#waveCanvas").get(0), {
                    width: width,
                    height: height
                });

                extendWaveSurferDrawer(self);
            }

            visualizerSeekMarker.set({'x1': 0, 'y1': 0, 'x2': 0, 'y2': 0});
            visualizerYAxis.set({'x1': 0, 'y1': 0, 'x2': 0, 'y2': visualizerWaveHeight});
            visualizerXAxis.set({'y1': visualizerWaveHeight, 'x2': self.canvas.width, 'y2': visualizerWaveHeight});
            self.canvas.add(visualizerSeekMarker);
            self.canvas.add(visualizerYAxis);
            self.canvas.add(visualizerXAxis);

            wavesurfer = Object.create(WaveSurfer);
            wavesurfer.init({
                container: $container.get(0),
                height: visualizerWaveHeight
            });
        }

        WaveVisualizer.prototype.loadAudio = function (projectId, fileName) {
            var self = this,
                url = "project/{0}/resource/audio/{1}".format(projectId, fileName),
                defer = self.$q.defer();

            self.projectId = projectId;
            self.resourceFileName = fileName;

            clearMarkers();
            self.markers.splice(0);
            self.audioClips.splice(0);
            self.markers.push({progress: 0}, {progress: 1});
            wavesurfer.load(url);
            wavesurfer.on("ready", function () {
                defer.resolve();
            })
            wavesurfer.on("error", function (err) {
                defer.reject(err);
            })
            wavesurfer.on("finish", function () {
                self.playFinishListener && self.playFinishListener.call(!wavesurfer.backend.isPaused());
            })

            return defer.promise;
        }

        WaveVisualizer.prototype.playPause = function (callback) {
            var self = this;

            if (wavesurfer) {
                if (callback) self.playFinishListener = callback;
                wavesurfer.playPause();

                return !wavesurfer.backend.isPaused();
            }

            return false;
        }

        WaveVisualizer.prototype.saveAudio = function () {
            var self = this;

            var attachedObj = {projectId: self.projectId, fileName: self.resourceFileName + '.wav'};
            var flowFile = self.resourceFlow.getFromUniqueIdentifier(self.resourceFlow.generateUniqueIdentifier({attachedObj: attachedObj}));
            if (flowFile) {
                return flowFile.file.attachedObj.defer.promise;
            } else {
                self.resourceFlow.opts.query.projectId = self.projectId;

                if (wavesurfer && !self.worker.onmessage) {
                    attachedObj.defer = self.$q.defer();

                    self.worker.onmessage = function (e) {
                        e.data.attachedObj = attachedObj;
                        e.data.fileName = self.resourceFileName + '.wav';

                        self.resourceFlow.addFile(e.data);
                        self.resourceFlow.resume();

                        self.worker.onmessage = null;
                    }

                    var channelArrays = [];
                    var channels = wavesurfer.backend.buffer.numberOfChannels;
                    for (var i = 0; i < channels; i++) {
                        var channelArray = wavesurfer.backend.buffer.getChannelData(i);
                        channelArrays.push(channelArray);
                    }

                    self.worker.postMessage({
                        command: "encodeWAV",
                        channelArrays: channelArrays,
                        type: "audio/x-wav",
                        numberOfChannels: channels,
                        sampleRate: wavesurfer.backend.buffer.sampleRate
                    });

                    return attachedObj.defer.promise;
                } else {
                    return self.utilService.getRejectDefer();
                }
            }
        }

        WaveVisualizer.prototype.stopPlay = function () {
            if (wavesurfer && !wavesurfer.backend.isPaused()) {
                wavesurfer.stop();
            }
        }

        WaveVisualizer.prototype.addMarker = function () {
            var self = this,
                index, obj;

            self.markers.every(function (p, i) {
                index = i;

                if (p.progress > currentSeekProgress) {
                    return false;
                } else if (p.progress === currentSeekProgress) {
                    obj = p;
                    return false;
                }

                return true;
            })

            if (!obj) {
                self.markers.splice(index == null && self.markers.length || index, 0, obj = {
                    progress: currentSeekProgress
                })
                return Array.prototype.concat.apply(Array.prototype, [obj, drawMarkers([obj])]);
            } else {
                var $waveMarkers = $canvasContainer.find('.waveCanvasPanel .waveMarkers'),
                    $marker;

                $waveMarkers.children().toArray().every(function (element) {
                    var $element = $(element),
                        marker = $element.data("marker");

                    if (marker && marker.progress === currentSeekProgress) {
                        $marker = $element;
                        return false;
                    }

                    return true;
                });

                return [obj, $marker];
            }
        }

        WaveVisualizer.prototype.removeMarker = function (marker) {
            var self = this,
                index,
                progress;

            if (typeof marker === "number") {
                progress = marker;
            }

            self.markers.every(function (p, i) {
                if (p.progress === progress) {
                    marker = p;
                    index = i;
                    return false;
                }

                return true;
            });

            if (index > 0 && index < self.markers.length - 1) {
                self.markers.splice(index, 1);
                clearMarkers([marker]);

                return true;
            }

            return false;
        }

        WaveVisualizer.prototype.selectMarker = function (marker) {
            var self = this,
                index;

            if (marker && !self.markers.every(function (p, i) {
                    if (p.progress === marker.progress) {
                        index = i;
                        return false;
                    }

                    return true;
                })) {
                var pos = wavesurfer.drawer.width * self.markers[index].progress;

                visualizerSeekMarker.set({'x1': pos, 'x2': pos});
                visualizerSeekMarker.canvas.bringToFront(visualizerSeekMarker);

                currentSeekProgress = marker.progress;

                return true;
            }

            return false;
        }

        WaveVisualizer.prototype.collectAudioClip = function (startProgress, endProgress) {
            var self = this,
                buffer = wavesurfer.backend.buffer,
                context = wavesurfer.backend.ac;

            if (buffer) {
                var defer = self.$q.defer();

                self.$timeout(function () {
                    var channels = buffer.numberOfChannels;
                    var startOffset = Math.round(buffer.length * startProgress),
                        endOffset = Math.round(buffer.length * endProgress);
                    var clipBuffer = context.createBuffer(channels, endOffset - startOffset + 1, buffer.sampleRate);

                    for (var i = 0; i < channels; i++) {
                        var channelArray = buffer.getChannelData(i);
                        clipBuffer.getChannelData(i).set(channelArray.subarray(startOffset, endOffset));
                    }

                    var duration = wavesurfer.backend.getDuration();
                    self.audioClips.push({
                        startTime: duration * startProgress,
                        endTime: duration * endProgress,
                        duration: duration * (endProgress - startProgress),
                        buffer: clipBuffer,
                        progress: 0,
                        isLooped: false
                    });

                    defer.resolve(clipBuffer);
                });

                return defer.promise;
            } else {
                return self.utilService.getRejectDefer();
            }
        }

        WaveVisualizer.prototype.playPauseAudioClip = function (clipItem, callback) {
            var self = this;

            function createAudioProcessHandler(handler) {
                return function (event) {
                    var time = wavesurfer.backend.ac.currentTime - clipAudioSource.lastPlay,
                        duration = clipAudioSource.buffer.duration;

                    if (time >= duration) {
                        clipPlayState = FINISHED_STATE;
                        clipAudioSource.clipItem.progress = 0;
                        clipScriptNode.onaudioprocess = null;

                        if (clipAudioSource.clipItem.isLooped) {
                            self.$timeout(function () {
                                self.playPauseAudioClip(clipAudioSource.clipItem, handler);
                            });
                        }
                    } else {
                        var progress = time / duration;
                        clipAudioSource.clipItem.progress = Math.floor(progress * visualizerWaveSeekPrecision) / visualizerWaveSeekPrecision;
                    }

                    handler(clipAudioSource.clipItem, clipPlayState === PLAYING_STATE);
                }
            }

            function startClipAudioSource(item, handler) {
                clipAudioSource = wavesurfer.backend.ac.createBufferSource();
                clipAudioSource.playbackRate.value = 1;

                clipAudioSource.buffer = item.buffer;
                clipAudioSource.clipItem = item;

                clipScriptNode = wavesurfer.backend.ac.createScriptProcessor(256);
                clipScriptNode.onaudioprocess = createAudioProcessHandler(handler);

                clipAudioSource.connect(wavesurfer.backend.ac.destination);
                clipScriptNode.connect(wavesurfer.backend.ac.destination);

                clipAudioSource.start(0, item.buffer.duration * item.progress);
                clipAudioSource.lastPlay = wavesurfer.backend.ac.currentTime;
                clipAudioSource.clipItem.isPlaying = true;
                clipPlayState = PLAYING_STATE;
            }

            if (clipItem && clipItem.buffer) {
                if (clipPlayState === FINISHED_STATE || clipPlayState === PAUSED_STATE) {
                    startClipAudioSource(clipItem, callback);
                } else {
                    var oldItem = clipAudioSource.clipItem;

                    clipAudioSource.stop(0);
                    clipPlayState = PAUSED_STATE;
                    clipAudioSource.clipItem.isPlaying = false;

                    clipAudioSource.disconnect();
                    clipScriptNode.disconnect();
                    clipScriptNode.onaudioprocess = null;

                    clipAudioSource = null;
                    clipScriptNode = null;

                    if (oldItem !== clipItem) {
                        startClipAudioSource(clipItem, callback);
                    }
                }
            }
        }

        WaveVisualizer.prototype.removeAudioPart = function (startProgress, endProgress) {
            var self = this,
                defer = self.$q.defer(),
                buffer = wavesurfer.backend.buffer,
                context = wavesurfer.backend.ac;

            self.$timeout(function () {
                if (currentSeekProgress === startProgress || currentSeekProgress === endProgress) currentSeekProgress = 0;

                self.removeMarker(startProgress);
                self.removeMarker(endProgress);

                var channels = buffer.numberOfChannels;
                var startOffset = Math.round(buffer.length * startProgress),
                    endOffset = Math.round(buffer.length * endProgress);
                var newBuffer = context.createBuffer(channels, buffer.length - (endOffset - startOffset + 1), buffer.sampleRate);

                for (var i = 0; i < channels; i++) {
                    var channelArray = buffer.getChannelData(i);

                    if (startProgress > 0) {
                        var beforeArray = channelArray.subarray(0, startOffset);
                        newBuffer.getChannelData(i).set(beforeArray);
                    }

                    if (endProgress < 1) {
                        var endArray = channelArray.subarray(endOffset + 1);
                        newBuffer.getChannelData(i).set(endArray, startOffset);
                    }
                }

                wavesurfer.loadDecodedBuffer(newBuffer);

                defer.resolve();
            });

            return defer.promise;
        }

        WaveVisualizer.prototype.insertAudioPart = function (progress, clipItem) {
            var self = this,
                defer = self.$q.defer(),
                buffer = wavesurfer.backend.buffer,
                context = wavesurfer.backend.ac;

            self.$timeout(function () {
                var channels = buffer.numberOfChannels;
                var oldLength = buffer.length,
                    newLength = buffer.length + clipItem.buffer.length,
                    offset = Math.round(buffer.length * progress);
                var newBuffer = context.createBuffer(channels, newLength, buffer.sampleRate);

                for (var i = 0; i < channels; i++) {
                    var channelArray = buffer.getChannelData(i),
                        fillChannelArray = clipItem.buffer.getChannelData(i);

                    if (progress > 0) {
                        newBuffer.getChannelData(i).set(channelArray.subarray(0, offset + 1));
                    }

                    newBuffer.getChannelData(i).set(fillChannelArray, offset + 1);

                    if (progress < 1) {
                        newBuffer.getChannelData(i).set(channelArray.subarray(offset + 1), offset + clipItem.buffer.length - 1);
                    }
                }

                var waveWidth = wavesurfer.drawer.width;
                self.markers.forEach(function (marker) {
                    if (marker.progress > 0 && marker.progress < 1) {
                        var newProgress = Math.floor((oldLength * marker.progress / newLength) * visualizerWaveSeekPrecision) / visualizerWaveSeekPrecision;
                        marker.$element.css("left", (waveWidth * newProgress) + "px");
                        marker.progress = newProgress;
                    }
                });

                wavesurfer.loadDecodedBuffer(newBuffer);

                defer.resolve();
            });

            return defer.promise;
        }

        WaveVisualizer.$inject = ["$log", "$compile", "$parse", "$timeout", "$q", "$exceptionHandler", "flowFactory", "utilService", "uiCanvasService", "angularConstants", "angularEventTypes"];
        var $inject = {};

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('uiWaveVisualizerService', WaveVisualizer);
                }]);
        };
    }
);