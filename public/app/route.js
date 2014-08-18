var needGoBack = false;

define(function () {
    var urlService = function ($location, $rootScope) {
        this.$location = $location;
        this.$rootScope = $rootScope;

        this.$rootScope.urlStack = [];

        this.$rootScope.$on("$routeChangeSuccess", function (scope, next, current) {
        });
    };

    urlService.$inject = ["$location", "$rootScope"];

    urlService.prototype.back = function () {
        if (this.$rootScope.urlStack.length > 1) {
            this.$rootScope.urlStack.pop();
            var fn = this.$rootScope.urlStack[this.$rootScope.urlStack.length - 1];
            fn(true);
        }
    }
    urlService.prototype.clearUrlStack = function (depth) {
        if (depth != null) {
            if (depth <= this.$rootScope.urlStack.length)
                this.$rootScope.urlStack.splice(this.$rootScope.urlStack.length - depth, depth);
        } else {
            this.$rootScope.urlStack = [];
        }
    }
    urlService.prototype.route = function (location, skipUrlTrack, urlParams, appTitle) {
        this.$rootScope.step = location;
        this.$rootScope.urlParams = this.$rootScope.urlParams || {};
        delete this.$rootScope.urlParams[location];
        this.$rootScope.urlParams[location] = {};

        for (var key in urlParams) {
            this.$rootScope.urlParams[location][key] = urlParams[key];
        }
        this.$location.path(location);
        if (needGoBack && (skipUrlTrack == null || !skipUrlTrack))
            this.$rootScope.urlStack.push(arguments.callee);
    }
    urlService.prototype.frameSketch = function (skipUrlTrack, urlParams, appTitle) {
        this.route('frameSketch', skipUrlTrack, urlParams, appTitle);
    }
    urlService.prototype.boxShadow = function (skipUrlTrack, urlParams, appTitle) {
        this.route('boxShadow', skipUrlTrack, urlParams, appTitle);
    }
    urlService.prototype.textShadow = function (skipUrlTrack, urlParams, appTitle) {
        this.route('textShadow', skipUrlTrack, urlParams, appTitle);
    }
    urlService.prototype.arrow = function (skipUrlTrack, urlParams, appTitle) {
        this.route('arrow', skipUrlTrack, urlParams, appTitle);
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
                    .otherwise({redirectTo: "/"});
            }]);
    }
});