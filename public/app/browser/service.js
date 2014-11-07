define(
    ["angular"],
    function () {
        var appService = function ($rootScope, $http, $timeout, $q, $cookies, $cookieStore, uiService) {
            this.$rootScope = $rootScope;
            this.$http = $http;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$cookies = $cookies;
            this.$cookieStore = $cookieStore;
            this.uiService = uiService;
        };

        appService.$inject = ["$rootScope", "$http", "$timeout", "$q", "$cookies", "$cookieStore", "uiService"];

        appService.prototype.NOOP = function () {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve();
            });

            return defer.promise;
        };

        appService.prototype.saveSketch = function (sketchWorks) {
            return this.$http({
                method: 'POST',
                url: '/api/public/postSketch',
                params: {sketchWorks: JSON.stringify(sketchWorks)}
            });
        }

        appService.prototype.loadSketch = function (sketchWorks) {
            var self = this;

            return self.$http({
                method: 'GET',
                url: '/api/public/getSketch',
                params: {}
            }).then(function (result) {
                var defer = self.$q.defer();

                if (result.data.result === "OK") {
                    var resultValue = JSON.parse(result.data.resultValue);
                    if (resultValue.pages && resultValue.pages.length) {
                        sketchWorks.pages = [];
                        resultValue.pages.forEach(function (pageObj) {
                            var page = self.uiService.fromObject(pageObj);
                            page && sketchWorks.pages.push(page);
                        });
                    }
                }

                self.$timeout(function () {
                    defer.resolve();
                });

                return defer.promise;
            });
        }

        return function (appModule) {
            appModule.
                config(['$httpProvider',
                    function ($httpProvider) {
                        $httpProvider.defaults.useXDomain = true;
                        $httpProvider.defaults.withCredentials = true;
                        delete $httpProvider.defaults.headers.common['X-Requested-With'];
                    }
                ]).
                config(["$provide", function ($provide) {
                    $provide.service('appService', appService);
                }]);
        }
    }
)
;