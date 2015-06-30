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

        SketchAnimation.prototype.moveWidget = function (widgetObj, routeIndex, settings) {
            var self = this;

            if (widgetObj.routes && routeIndex < widgetObj.routes.length) {
                if (widgetObj.$element && widgetObj.$element[0].nodeType == 1 && widgetObj.$element.parent().length) {
                    var coord = widgetObj.routes[routeIndex],
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
                        widgetObj.$element.velocity({
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