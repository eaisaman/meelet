define(
    ["angular"],
    function () {
        var appService = function ($rootScope, $http, $timeout, $q, $compile, $cookies, $cookieStore, $exceptionHandler, urlService) {
            this.$rootScope = $rootScope;
            this.$http = $http;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$compile = $compile;
            this.$cookies = $cookies;
            this.$cookieStore = $cookieStore;
            this.$exceptionHandler = $exceptionHandler;
            this.urlService = urlService;
        };

        appService.$inject = ["$rootScope", "$http", "$timeout", "$q", "$compile", "$cookies", "$cookieStore", "$exceptionHandler", "urlService"];

        appService.prototype.NOOP = function () {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve();
            });

            return defer.promise;
        }

        appService.prototype.getResolveDefer = function (result) {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve(result);
            });

            return defer.promise;
        }

        appService.prototype.getRejectDefer = function (err) {
            var self = this,
                errorDefer = self.$q.defer();

            self.$timeout(function () {
                errorDefer.reject(err);
            });

            return errorDefer.promise;
        }

        appService.prototype.playSound = function (projectId, url, playLoop) {
            var self = this;

            if (!self.soundDelegate) {
                var Constructor = function () {
                    this.audioSourceNode = null;
                    this.audioScriptNode = null;
                    this.audioContext = null;
                    this.offlineAudioContext = null;
                };

                Constructor.prototype.PLAYING_STATE = 0;
                Constructor.prototype.PAUSED_STATE = 1;
                Constructor.prototype.FINISHED_STATE = 2;
                Constructor.prototype.soundSeekPrecision = 100000;

                Constructor.prototype.createAudioProcessHandler = function (handler) {
                    var instance = this;

                    return function (event) {
                        var time = instance.audioContext.currentTime - instance.audioSourceNode.lastPlay,
                            duration = instance.audioSourceNode.buffer.duration;

                        if (time >= duration) {
                            instance.progress = 1;
                            self.$timeout(function () {
                                var prevUrl = instance.url;

                                instance.stop();

                                if (instance.playLoop) {
                                    instance.play(prevUrl);
                                }
                            });
                        } else {
                            instance.progress = Math.floor((time / duration) * instance.soundSeekPrecision) / instance.soundSeekPrecision;
                        }

                        handler && handler(instance.progress);
                    }
                }

                Constructor.prototype.init = function (buffer, callback) {
                    this.audioSourceNode = this.audioContext.createBufferSource();
                    this.audioSourceNode.playbackRate.value = 1;
                    this.audioSourceNode.buffer = buffer;

                    this.audioScriptNode = this.audioContext.createScriptProcessor(256);
                    this.audioScriptNode.onaudioprocess = this.createAudioProcessHandler(callback);

                    this.audioSourceNode.connect(this.audioContext.destination);
                    this.audioScriptNode.connect(this.audioContext.destination);
                }

                Constructor.prototype.play = function (url, callback) {
                    url = url || this.url;

                    if (!this.offlineAudioContext) {
                        this.offlineAudioContext = new (
                            window.OfflineAudioContext || window.webkitOfflineAudioContext
                        )(1, 2, 44100);
                    }

                    if (!this.audioContext) {
                        this.audioContext = new (
                            window.AudioContext || window.webkitAudioContext
                        );
                    }

                    if (this.playState === this.PLAYING_STATE) {
                        if (this.url === url) {
                            return self.getResolveDefer();
                        }
                    }

                    if (this.url !== url) {
                        this.stop();

                        this.url = url;
                        this.playDefer = self.$q.defer();
                        this.progress = 0;
                        var instance = this;
                        instance.playState = instance.PLAYING_STATE;
                        self.$http({url: url, method: "GET", responseType: "arraybuffer"}).then(
                            function (result) {
                                if (instance.playState == instance.PLAYING_STATE) {
                                    instance.offlineAudioContext.decodeAudioData(result.data, function (buffer) {
                                        instance.init(buffer, callback);
                                        instance.audioSourceNode.start(0, 0);
                                        instance.audioSourceNode.lastPlay = instance.audioContext.currentTime;
                                    });
                                }
                            },
                            function (err) {
                                instance.playState = instance.PAUSED_STATE;
                                self.$exceptionHandler(err);
                                instance.playDefer.reject(err);
                                instance.playDefer = null;
                            }
                        );
                    } else {
                        this.playDefer = self.$q.defer();
                        this.audioSourceNode.start(0, this.audioSourceNode.buffer.duration * this.progress);
                        this.playState = this.PLAYING_STATE;
                    }

                    return this.playDefer.promise;
                }

                Constructor.prototype.pause = function () {
                    if (this.playState === this.PLAYING_STATE) {
                        if (this.audioSourceNode) {
                            this.audioSourceNode.stop(0);
                            this.playState = this.PAUSED_STATE;
                        }

                        if (this.playDefer) {
                            this.playDefer.resolve(this.progress);
                            this.playDefer = null;
                        }
                    }
                }

                Constructor.prototype.stop = function () {
                    if (this.audioSourceNode) {
                        this.audioSourceNode.stop(0);
                        this.audioSourceNode.disconnect();
                        this.audioSourceNode = null;
                    }
                    if (this.audioScriptNode) {
                        this.audioScriptNode.disconnect();
                        this.audioScriptNode.onaudioprocess = null;
                        this.audioScriptNode = null;
                    }
                    if (this.playDefer) {
                        this.playDefer.resolve(this.progress);
                        this.playDefer = null;
                    }
                    this.playState = this.FINISHED_STATE;
                    this.progress = 0;
                    this.url = null;
                }

                Constructor.prototype.isPlaying = function () {
                    return this.playState === this.PLAYING_STATE;
                }

                self.soundDelegate = new Constructor();
            }

            self.soundDelegate.playLoop = playLoop;

            return self.soundDelegate.play(url);
        }

        appService.prototype.stopPlaySound = function () {
            this.soundDelegate && this.soundDelegate.stop();
        }

        appService.prototype.isPlayingSound = function () {
            var self = this;

            return self.getResolveDefer(self.soundDelegate && self.soundDelegate.isPlaying());
        }

        appService.prototype.exitPage = function () {
            window.close();
        };

        return function (appModule) {
            if (isBrowser) {
                appModule.
                    config(['$httpProvider',
                        function ($httpProvider) {
                            $httpProvider.defaults.useXDomain = true;
                            $httpProvider.defaults.withCredentials = true;
                            delete $httpProvider.defaults.headers.common['X-Requested-With'];
                        }
                    ]).
                    config(["$provide", "$controllerProvider", "$compileProvider", "$injector", function ($provide, $controllerProvider, $compileProvider, $injector) {
                        $provide.service('appService', appService);
                        appService.prototype.$controllerProvider = $controllerProvider;
                        appService.prototype.$compileProvider = $compileProvider;
                        appService.prototype.$injector = $injector;
                    }]);
            }
        }
    }
)
;