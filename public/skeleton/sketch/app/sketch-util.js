define(
    ["angular"],
    function () {
        return function (appModule) {
            var sketchUtilService = function ($rootScope, $timeout, $q, $compile, $exceptionHandler, angularConstants, utilService) {
                this.$rootScope = $rootScope;
                this.$timeout = $timeout;
                this.$q = $q;
                this.$compile = $compile;
                this.$exceptionHandler = $exceptionHandler;
                this.angularConstants = angularConstants;
                this.utilService = utilService;
            };

            sketchUtilService.$inject = ["$rootScope", "$timeout", "$q", "$compile", "$exceptionHandler", "angularConstants", "utilService"];

            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('sketchUtilService', sketchUtilService);
                }]);
        }
    }
)
;