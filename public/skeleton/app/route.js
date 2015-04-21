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

        return function (appModule) {
            if (isBrowser) {
                appModule.
                    config(["$provide", function ($provide) {
                        $provide.service('urlService', urlService);
                    }]).
                    config(["$routeProvider", function ($routeProvider) {
                        return $routeProvider
                            .otherwise({redirectTo: "/"});
                    }]);
            }
        }
    });