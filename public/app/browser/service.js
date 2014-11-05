define(
    ["angular"],
    function () {
        var appService = function ($rootScope, $http, $timeout, $q, $cookies, $cookieStore) {
            this.$rootScope = $rootScope;
            this.$http = $http;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$cookies = $cookies;
            this.$cookieStore = $cookieStore;
        };

        appService.$inject = ["$rootScope", "$http", "$timeout", "$q", "$cookies", "$cookieStore"];

        appService.prototype.NOOP = function () {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve();
            });

            return defer.promise;
        };

        appService.prototype.saveSketch = function () {

        }

        appService.prototype.loadSketch = function () {

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