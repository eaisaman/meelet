define(
    ["angular-lib", "jquery-lib", "velocity-lib"],
    function () {
        var SketchAnimation = function ($log, $compile, $parse, $timeout, $q, $exceptionHandler, utilService, angularConstants, angularEventTypes) {
            this.$log = $log;
            this.$compile = $compile;
            this.$parse = $parse;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$exceptionHandler = $exceptionHandler;
            this.utilService = utilService;
            this.angularConstants = angularConstants;
            this.angularEventTypes = angularEventTypes;
        };

        SketchAnimation.$inject = ["$log", "$compile", "$parse", "$timeout", "$q", "$exceptionHandler", "utilService", "angularConstants", "angularEventTypes"];

        SketchAnimation.prototype.moveWidget = function ($element, routes, routeIndex, settings) {
            var self = this;

            if (routes && routeIndex < routes.length) {
                if ($element && $element[0].nodeType == 1 && $element.parent().length) {
                    var coord = routes[routeIndex],
                        currentStop = coord.currentStop,
                        nextStop;

                    if (!coord.complete) {
                        if (!currentStop) {
                            nextStop = coord;
                        } else {
                            nextStop = currentStop.nextStop;
                        }

                        coord.currentStop = nextStop;

                        if (nextStop) {
                            var defer = self.$q.defer();

                            var v = {
                                complete: function () {
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
                        } else {
                            coord.complete = true;
                        }
                    }
                }
            }

            return self.utilService.getResolveDefer();
        }

        SketchAnimation.prototype.doAnimation = function ($element, effect) {
            var self = this;

            if ($element && $element[0].nodeType == 1 && $element.parent().length) {
                var defer = self.$q.defer();

                $element.velocity(effect, {
                    complete: function () {
                        defer.resolve();
                    }
                });

                return defer.promise;
            }

            return self.utilService.getResolveDefer();
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('uiAnimationService', SketchAnimation);
                }]);
        };
    }
);