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

        appService.prototype.loadRepoArtifact = appService.prototype.NOOP;

        appService.prototype.loadEffectArtifactList = appService.prototype.NOOP;

        appService.prototype.loadIconArtifactList = appService.prototype.NOOP;

        appService.prototype.loadWidgetArtifactList = appService.prototype.NOOP;

        appService.prototype.addConfigurableArtifact = appService.prototype.NOOP;

        appService.prototype.removeConfigurableArtifact = appService.prototype.NOOP;

        appService.prototype.updateConfigurableArtifact = appService.prototype.NOOP;

        appService.prototype.saveSketch = appService.prototype.NOOP;

        appService.prototype.loadSketch = appService.prototype.NOOP;

        appService.prototype.unlockProject = appService.prototype.NOOP;

        appService.prototype.lockProject = appService.prototype.NOOP;

        appService.prototype.removeProjectImage = appService.prototype.NOOP;

        appService.prototype.getUser = appService.prototype.NOOP;

        appService.prototype.getRepoLibrary = appService.prototype.NOOP;

        appService.prototype.getRepoArtifact = appService.prototype.NOOP;

        appService.prototype.getUserDetail = appService.prototype.NOOP;

        appService.prototype.getProjectDependency = appService.prototype.NOOP;

        appService.prototype.updateProjectDependency = appService.prototype.NOOP;

        appService.prototype.deleteProjectDependency = appService.prototype.NOOP;

        appService.prototype.getProject = appService.prototype.NOOP;

        appService.prototype.createProject = appService.prototype.NOOP;

        appService.prototype.modifyProject = appService.prototype.NOOP;

        appService.prototype.deleteProject = appService.prototype.NOOP;

        appService.prototype.convertToHtml = appService.prototype.NOOP;

        return function (appModule) {
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
)
;