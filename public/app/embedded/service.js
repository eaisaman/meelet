define(
    ["angular"],
    function () {
        var appService = function ($rootScope, $http, $timeout, $q, $compile, $cookies, $cookieStore) {
            this.$rootScope = $rootScope;
            this.$http = $http;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$compile = $compile;
            this.$cookies = $cookies;
            this.$cookieStore = $cookieStore;
        };

        appService.$inject = ["$rootScope", "$http", "$timeout", "$q", "$compile", "$cookies", "$cookieStore"];

        appService.prototype.NOOP = function () {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve();
            });

            return defer.promise;
        };

        appService.prototype.loadRepoArtifact = appService.prototype.NOOP;

        appService.prototype.loadIconArtifactList = appService.prototype.NOOP;

        appService.prototype.loadWidgetArtifactList = appService.prototype.NOOP;

        appService.prototype.addConfigurableArtifact = appService.prototype.NOOP;

        appService.prototype.removeConfigurableArtifact = appService.prototype.NOOP;

        appService.prototype.updateConfigurableArtifact = appService.prototype.NOOP;

        appService.prototype.saveSketch = appService.prototype.NOOP;

        appService.prototype.loadSketch = appService.prototype.NOOP;

        appService.prototype.removeProjectImage = appService.prototype.NOOP;

        appService.prototype.getUser = appService.prototype.NOOP;

        appService.prototype.getRepoLibrary = appService.prototype.NOOP;

        appService.prototype.getRepoArtifact = appService.prototype.NOOP;

        appService.prototype.getUserDetail = appService.prototype.NOOP;

        appService.prototype.getProjectDetail = appService.prototype.NOOP;

        appService.prototype.createProject = appService.prototype.NOOP;

        appService.prototype.modifyProject = appService.prototype.NOOP;

        appService.prototype.deleteProject = appService.prototype.NOOP;

        appService.prototype.selectRepoArtifact = appService.prototype.NOOP;

        appService.prototype.unselectRepoArtifact = appService.prototype.NOOP;

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