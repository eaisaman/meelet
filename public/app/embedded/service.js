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