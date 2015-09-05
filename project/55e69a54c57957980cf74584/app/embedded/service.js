define(
    ["angular"],
    function () {
        var appService = function ($rootScope, $http, $timeout, $q, $compile, $cookies, $cookieStore, urlService) {
            this.$rootScope = $rootScope;
            this.$http = $http;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$compile = $compile;
            this.$cookies = $cookies;
            this.$cookieStore = $cookieStore;
            this.urlService = urlService;
        };

        appService.$inject = ["$rootScope", "$http", "$timeout", "$q", "$compile", "$cookies", "$cookieStore", "urlService"];

        appService.prototype.NOOP = function () {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve();
            });

            return defer.promise;
        }

        appService.prototype.getResolveDefer = function () {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve();
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

        appService.prototype.cordovaPromise = function (functionName) {
            var self = this;

            function cordovaReady(fn) {

                var queue = [];

                var impl = function () {
                    queue.push(Array.prototype.slice.call(arguments));
                };

                document.addEventListener('deviceready', function () {
                    queue.forEach(function (args) {
                        fn.apply(this, args);
                    });
                    impl = fn;
                }, false);

                return function () {
                    return impl.apply(this, arguments);
                };
            };

            return function () {
                var defer = self.$q.defer();

                cordovaReady(function () {
                    cordova.exec(
                        function (result) {
                            defer.resolve(result);
                        },
                        function (err) {
                            defer.reject(err);
                        },
                        "NativeBridge", functionName, Array.prototype.slice.call(arguments));

                }).apply(self, Array.prototype.slice.call(arguments));

                return defer.promise;
            }
        }

        appService.prototype.playSound = function (url, loop) {
            return this.cordovaPromise("playSound").apply(this, Array.prototype.slice.call(arguments));
        }

        appService.prototype.stopPlaySound = function () {
            return this.cordovaPromise("stopPlaySound").apply(this, Array.prototype.slice.call(arguments));
        }

        appService.prototype.exitPage = function () {
            return this.cordovaPromise("exitPage").apply(this, Array.prototype.slice.call(arguments));
        }

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