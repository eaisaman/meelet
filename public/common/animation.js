define(
    ["angular-lib", "jquery-lib", "velocity-lib"],
    function () {
        var SketchAnimation = function ($log, $compile, $parse, $timeout, $q, $exceptionHandler, angularConstants, angularEventTypes) {
            this.$log = $log;
            this.$compile = $compile;
            this.$parse = $parse;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$exceptionHandler = $exceptionHandler;
            this.angularConstants = angularConstants;
            this.angularEventTypes = angularEventTypes;
        };

        SketchAnimation.$inject = ["$log", "$compile", "$parse", "$timeout", "$q", "$exceptionHandler", "angularConstants", "angularEventTypes"];

        SketchAnimation.prototype.getResolveDefer = function (result) {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve(result);
            });

            return defer.promise;
        }

        SketchAnimation.prototype.getRejectDefer = function (err) {
            var self = this,
                errorDefer = self.$q.defer();

            self.$timeout(function () {
                errorDefer.reject(err);
            });

            return errorDefer.promise;
        }

        SketchAnimation.prototype.moveWidget = function ($element, routes, routeIndex, settings, runThrough) {
            function moveOneStop(coord, callback) {
                var currentStop = coord.currentStop,
                    nextStop;

                if (!currentStop) {
                    nextStop = coord;
                } else {
                    nextStop = currentStop.nextStop;
                }

                coord.currentStop = nextStop;

                if (nextStop) {
                    var v = {
                        complete: callback
                    };
                    _.each(settings, function (s) {
                        v[s.key] = s.pickedValue;
                    });
                    Velocity.animate.apply($element, [{
                        left: nextStop.left + "px",
                        top: nextStop.top + "px"
                    }, v]);
                } else {
                    //The route is run through
                    callback && callback(null, true);
                }
            }

            function moveStops(coord, callback) {
                moveOneStop(coord, function ($el, isCompleted) {
                    if (isCompleted) {
                        callback && callback();
                    } else {
                        self.$timeout(function () {
                            moveStops(coord, callback);
                        });
                    }
                })
            }

            var self = this;

            if (routes && routeIndex < routes.length) {
                if ($element && $element[0].nodeType == 1 && $element.parent().length) {
                    var widgetCoordinate = $element.data("widgetCoordinate");

                    if (!widgetCoordinate) {
                        $element.data("widgetCoordinate", {
                            left: $element.css("left"),
                            top: $element.css("top")
                        });
                    }

                    var coord = routes[routeIndex],
                        defer = self.$q.defer();

                    if (runThrough) {
                        moveStops(coord, function () {
                            defer.resolve();
                        })
                    } else {
                        moveOneStop(coord, function () {
                            defer.resolve();
                        })
                    }

                    return defer.promise;
                }
            }

            return self.getResolveDefer();
        }

        SketchAnimation.prototype.restoreWidget = function ($element, routes, routeIndex) {
            $element && $element.removeData("widgetCoordinate");
            delete routes[routeIndex].currentStop;
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

            return self.getResolveDefer();
        }

        SketchAnimation.prototype.doAnimationWithCallback = function ($element, effect, start, complete) {
            if ($element && $element[0].nodeType == 1 && $element.parent().length) {
                $element.velocity(effect, {
                    start: start,
                    complete: complete
                });

                return defer.promise;
            }
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('animationService', SketchAnimation);
                }]);
        };
    }
);