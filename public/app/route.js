define(
    ["angular"],
    function () {
        var needGoBack = true;

        var urlService = function ($location, $rootScope) {
            this.$location = $location;
            this.$rootScope = $rootScope;

            this.$rootScope.urlStack = [];

            this.$rootScope.$on("$routeChangeSuccess", function (scope, next, current) {
            });
        };

        urlService.$inject = ["$location", "$rootScope"];

        urlService.prototype.currentLocation = function () {
            if (this.$rootScope.urlStack.length) {
                return this.$rootScope.urlStack[this.$rootScope.urlStack.length - 1].location;
            } else {
                return "";
            }
        }
        urlService.prototype.back = function () {
            if (this.$rootScope.urlStack.length > 1) {
                var urlObj = this.$rootScope.urlStack.pop();
                delete this.$rootScope.urlParams[urlObj.location];

                urlObj = this.$rootScope.urlStack[this.$rootScope.urlStack.length - 1];
                urlObj.fn.apply(this, [urlObj.location, true, this.$rootScope.urlParams[urlObj.location]]);
            }
        }
        urlService.prototype.home = function (needLoad) {
            if (this.$rootScope.urlStack.length > 1) {
                this.clearUrlStack(this.$rootScope.urlStack.length - 1);

                if (needLoad == null || needLoad) {
                    var urlObj = this.$rootScope.urlStack[0];
                    urlObj.fn.apply(this, [urlObj.location, true, this.$rootScope.urlParams[urlObj.location]]);
                }
            }
        }
        urlService.prototype.clearUrlStack = function (depth) {
            var self = this;

            depth = Math.min(depth || self.$rootScope.urlStack.length, self.$rootScope.urlStack.length);

            self.$rootScope.urlStack.slice(self.$rootScope.urlStack.length - depth, depth).forEach(function (urlObj) {
                delete self.$rootScope.urlParams[urlObj.location];
            });

            self.$rootScope.urlStack.splice(self.$rootScope.urlStack.length - depth, depth);
        }
        urlService.prototype.route = function (location, skipUrlTrack, urlParams) {
            this.$rootScope.step = location;
            this.$rootScope.urlParams = this.$rootScope.urlParams || {};
            urlParams = urlParams || {};
            if (urlParams !== this.$rootScope.urlParams[location])
                this.$rootScope.urlParams[location] = _.clone(urlParams);
            if (needGoBack && (skipUrlTrack == null || !skipUrlTrack)) {
                var locationAlreadyExists = false;

                if (this.$rootScope.urlStack.length) {
                    var urlObj = this.$rootScope.urlStack[this.$rootScope.urlStack.length - 1];
                    locationAlreadyExists = urlObj.location === location;
                }

                !locationAlreadyExists && this.$rootScope.urlStack.push({fn: arguments.callee, location: location});
            }

            this.$location.path(location);
        }
        urlService.prototype.frameSketch = function (skipUrlTrack, urlParams) {
            this.route('frameSketch', skipUrlTrack, urlParams);
        }
        urlService.prototype.boxShadow = function (skipUrlTrack, urlParams) {
            this.route('boxShadow', skipUrlTrack, urlParams);
        }
        urlService.prototype.textShadow = function (skipUrlTrack, urlParams) {
            this.route('textShadow', skipUrlTrack, urlParams);
        }
        urlService.prototype.arrow = function (skipUrlTrack, urlParams) {
            this.route('arrow', skipUrlTrack, urlParams);
        }
        urlService.prototype.project = function (skipUrlTrack, urlParams) {
            this.route('project', skipUrlTrack, urlParams);
        }
        urlService.prototype.repo = function (skipUrlTrack, urlParams) {
            this.route('repo', skipUrlTrack, urlParams);
        }
        urlService.prototype.repoLib = function (skipUrlTrack, urlParams) {
            this.route('repoLib', skipUrlTrack, urlParams);
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('urlService', urlService);
                }]).
                config(["$routeProvider", function ($routeProvider) {
                    return $routeProvider
                        .when("/frameSketch", {templateUrl: "frameSketch.html"})
                        .when("/boxShadow", {templateUrl: "boxShadow.html"})
                        .when("/textShadow", {templateUrl: "textShadow.html"})
                        .when("/arrow", {templateUrl: "arrow.html"})
                        .when("/project", {templateUrl: "project.html"})
                        .when("/repo", {templateUrl: "repo.html"})
                        .when("/repoLib", {templateUrl: "repoLib.html"})
                        .otherwise({redirectTo: "/"});
                }]);
        }
    });