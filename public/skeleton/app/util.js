define(
    ["angular", "hammer"],
    function () {
        var utilService = function ($rootScope, $timeout, $q, angularConstants, uiUtilService) {
            this.$rootScope = $rootScope;
            this.$timeout = $timeout;
            this.$q = $q;
            this.angularConstants = angularConstants;
            this.uiUtilService = uiUtilService;
        };

        utilService.$inject = ["$rootScope", "$timeout", "$q", "angularConstants", "uiUtilService"];

        utilService.prototype.registerTrigger = function (id, eventMap) {
            var self = this,
                defer = self.$q.defer();

            function scopeSetterHandler(scope, key, value) {
                var setterName = ("set" + key.charAt(0).toUpperCase() + key.substr(1)),
                    setter = scope[setterName];
                if (setter) {
                    setter.apply(scope, [value]);
                } else {
                    if (scope.configuration) {
                        scope.configuration[key] = value;
                    }
                    scope[key] = value;
                }
            }

            function doAction(action) {
                var $widgetElement = $("#" + action.widgetObj);

                if ($widgetElement.length) {
                    if (action.actionType === "Sequence") {
                        var arr = [],
                            chainId = "utilService.registerTrigger.doAction." + action.id;

                        action.childActions && action.childActions.forEach(function (childAction) {
                            arr.push(function () {
                                return doAction(childAction);
                            });
                        });

                        return self.uiUtilService.chain(arr,
                            chainId);
                    } else if (action.actionType === "Effect") {
                    } else if (action.actionType === "State") {
                        $widgetElement.attr("state", action.newState);

                        var animationName = $widgetElement.css("animation-name");
                        if (animationName && animationName !== "none") {
                            return self.uiUtilService.onAnimationEnd($widgetElement);
                        } else {
                            return self.uiUtilService.getResolveDefer();
                        }
                    } else if (action.actionType === "Configuration") {
                        var defer = self.$q.defer();

                        self.uiUtilService.whilst(function () {
                                var scope = angular.element($widgetElement.find("[widget-container]:nth-of-type(1)").first().children()[0]).scope();
                                return !scope;
                            }, function (callback) {
                                callback();
                            }, function (err) {
                                if (!err) {
                                    var scope = angular.element($widgetElement.find("[widget-container]:nth-of-type(1)").first().children()[0]).scope();

                                    action.configuration && action.configuration.forEach(function (item) {
                                        if (item.type === "size") {
                                            var m = (item.pickedValue || "").match(/([-\d\.]+)(px|em|%)+$/)
                                            if (m && m.length == 3) {
                                                scope[item.key] = item.pickedValue;
                                            }
                                        } else {
                                            scopeSetterHandler(scope, item.key, item.pickedValue);
                                        }
                                    });

                                    defer.resolve();
                                } else {
                                    defer.reject(err);
                                }
                            },
                            self.angularConstants.checkInterval,
                            "utilService.registerTrigger.doAction.setScopedValue." + $widgetElement.attr("id"),
                            self.angularConstants.renderTimeout
                        )

                        return defer.promise;
                    }
                } else {
                    return self.uiUtilService.getRejectDefer("Cannot do action on nonexist element with id {0}".format(action.widgetObj));
                }
            }

            function createActionCallback(id, actions) {
                return function (event) {
                    var $element = $("#" + id);
                    actions.every(function (action) {
                        if ($element.attr("state") === action.state) {
                            doAction(action);
                            return false;
                        }

                        return false;
                    });
                }
            }

            self.uiUtilService.whilst(function () {
                    return !document.getElementById(id);
                },
                function (callback) {
                    callback();
                },
                function (err) {
                    if (!err) {
                        _.each(eventMap, function (triggerConfig, triggerType) {
                            if (!_.isEmpty(triggerConfig)) {
                                if (triggerType === "Gesture") {
                                    var element = document.getElementById(id),
                                        mc = new Hammer.Manager(element),
                                        handlerMap = {};

                                    $(element).data("hammer", mc);
                                    _.each(triggerConfig, function (eventConfig, eventType) {
                                        var handlerConfig;

                                        if (eventType === "pan" || eventType === "panstart" || eventType === "panmove" || eventType === "panend" || eventType === "panleft" || eventType === "panright" || eventType === "panup" || eventType === "pandown") {
                                            handlerConfig = handlerMap['pan'] = handlerMap['pan'] || {handlers: []};
                                            handlerMap['pan'].recognizer = handlerMap['pan'].recognizer || new Hammer.Pan(eventConfig.options);
                                        } else if (eventType === "pinch" || eventType === "pinchin" || eventType === "pinchout") {
                                            handlerConfig = handlerMap['pinch'] = handlerMap['pinch'] || {handlers: []};
                                            handlerMap['pinch'].recognizer = handlerMap['pinch'].recognizer || new Hammer.Pinch(eventConfig.options);
                                        } else if (eventType === "press" || eventType === "pressup") {
                                            handlerConfig = handlerMap['press'] = handlerMap['press'] || {handlers: []};
                                            handlerMap['press'].recognizer = handlerMap['press'].recognizer || new Hammer.Press(eventConfig.options);
                                        } else if (eventType === "rotate" || eventType === "rotatestart" || eventType === "rotatemove" || eventType === "rotateend") {
                                            handlerConfig = handlerMap['rotate'] = handlerMap['rotate'] || {handlers: []};
                                            handlerMap['rotate'].recognizer = handlerMap['rotate'].recognizer || new Hammer.Rotate(eventConfig.options);
                                        } else if (eventType === "swipe" || eventType === "swipeleft" || eventType === "swiperight" || eventType === "swipeup" || eventType === "swipedown") {
                                            handlerConfig = handlerMap['swipe'] = handlerMap['swipe'] || {handlers: []};
                                            handlerMap['swipe'].recognizer = handlerMap['swipe'].recognizer || new Hammer.Swipe(eventConfig.options);
                                        } else if (eventType === "tap") {
                                            handlerConfig = handlerMap['tap'] = handlerMap['tap'] || {handlers: []};
                                            handlerMap['tap'].recognizer = handlerMap['tap'].recognizer || new Hammer.Tap(eventConfig.options);
                                        } else if (eventType === "doubletap") {
                                            handlerConfig = handlerMap['doubletap'] = handlerMap['doubletap'] || {handlers: []};
                                            handlerMap['doubletap'].recognizer = handlerMap['doubletap'].recognizer || new Hammer.Tap(eventConfig.options);
                                        }

                                        if (handlerConfig) {
                                            handlerConfig.handlers.push({
                                                event: eventType,
                                                callback: createActionCallback(id, eventConfig.actions)
                                            });
                                        }
                                    })

                                    var recognizers = [], events = [];
                                    _.each(handlerMap, function (handlerConfig) {
                                        if (handlerConfig.handlers && handlerConfig.handlers.length) {
                                            mc.add(handlerConfig.recognizer);
                                            recognizers.push(handlerConfig.recognizer);
                                            handlerConfig.handlers.forEach(function (handler) {
                                                    mc.on(handler.event, handler.callback);
                                                    events.push(handler.event);
                                                }
                                            );
                                        }
                                    })

                                    if (recognizers.length && events.length) {
                                        var scope = angular.element(element).scope();
                                        scope && scope.$on('$destroy', function () {
                                            var mc = $(element).data("hammer");
                                            if (mc) {
                                                events.forEach(function (evt) {
                                                    mc.off(evt);
                                                });
                                                recognizers.forEach(function (recognizer) {
                                                    mc.remove(recognizer);
                                                });
                                                mc.destroy();
                                                $(element).removeData("hammer");
                                            }
                                        });
                                    }
                                }
                            }
                        });

                        defer.resolve();
                    } else {
                        defer.reject(err);
                    }
                },
                self.angularConstants.checkInterval,
                "utilService.registerTrigger." + id,
                self.angularConstants.renderTimeout
            );

            return defer.promise;
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('utilService', utilService);
                }]);
        }
    }
)
;