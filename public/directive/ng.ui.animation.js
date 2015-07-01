define(
    ["angular", "jquery", "velocity"],
    function () {
        var SketchAnimation = function ($log, $compile, $parse, $timeout, $q, $exceptionHandler, uiUtilService, angularConstants, angularEventTypes) {
            this.$log = $log;
            this.$compile = $compile;
            this.$parse = $parse;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$exceptionHandler = $exceptionHandler;
            this.uiUtilService = uiUtilService;
            this.angularConstants = angularConstants;
            this.angularEventTypes = angularEventTypes;
        };

        SketchAnimation.$inject = ["$log", "$compile", "$parse", "$timeout", "$q", "$exceptionHandler", "uiUtilService", "angularConstants", "angularEventTypes"];

        SketchAnimation.prototype.moveWidget = function ($element, routes, routeIndex, settings) {
            var self = this;

            if (routes && routeIndex < routes.length) {
                if ($element && $element[0].nodeType == 1 && $element.parent().length) {
                    var coord = routes[routeIndex],
                        currentStop = coord.currentStop,
                        nextStop;

                    if (!currentStop) {
                        nextStop = coord;
                    } else {
                        left = currentStop.left, top = currentStop.top;
                        nextStop = currentStop.nextStop;
                    }

                    coord.currentStop = nextStop;

                    if (nextStop) {
                        var defer = self.$q.defer();

                        var v = {
                            completion: function () {
                                defer.resolve();
                            }
                        };
                        _.each(settings, function (s) {
                            v[s.key] = s.pickedValue;
                        });
                        $element.velocity({
                            left: nextStop.left + "px",
                            top: nextStop.top + "px"
                        }, v);

                        return defer.promise;
                    }
                }
            }

            return self.uiUtilService.getResolveDefer();
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('uiAnimationService', SketchAnimation);
                }]);
        };
    }
);