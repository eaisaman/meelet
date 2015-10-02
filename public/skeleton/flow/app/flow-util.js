define(
    ["angular"],
    function () {
        return function (appModule) {
            var bookUtilService = function ($rootScope, $timeout, $q, $compile, $exceptionHandler, angularConstants, utilService) {
                this.$rootScope = $rootScope;
                this.$timeout = $timeout;
                this.$q = $q;
                this.$compile = $compile;
                this.$exceptionHandler = $exceptionHandler;
                this.angularConstants = angularConstants;
                this.utilService = utilService;
            };

            bookUtilService.$inject = ["$rootScope", "$timeout", "$q", "$compile", "$exceptionHandler", "angularConstants", "utilService"];

            bookUtilService.prototype.loadAnimation = function (edgeClass) {
                var self = this;

                return self.utilService.whilst(function () {
                        return !document.getElementsByClassName(edgeClass).length;
                    }, function (err) {
                        if (!err) {
                            try {
                                var fn = globalEdges && globalEdges[edgeClass].load;
                                fn && fn();
                            } catch (e) {
                                self.$exceptionHandler(e);
                            }
                        }
                    },
                    self.angularConstants.checkInterval,
                    "bookUtilService.loadAnimation." + edgeClass,
                    self.angularConstants.renderTimeout
                )
            };

            bookUtilService.prototype.unloadAnimation = function (edgeClass) {
                var self = this;

                try {
                    var fn = globalEdges && globalEdges[edgeClass].unload;
                    fn && fn();
                } catch (e) {
                    self.$exceptionHandler(e);
                }
            };

            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('bookUtilService', bookUtilService);
                }]);
        }
    }
)
;