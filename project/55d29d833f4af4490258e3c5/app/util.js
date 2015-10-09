define(
    ["angular", "hammer"],
    function () {
        return function (appModule, meta) {
            var utilService = function ($rootScope, $timeout, $q, $compile, $exceptionHandler, angularConstants, appService, uiUtilService, uiAnimationService) {
                this.$rootScope = $rootScope;
                this.$timeout = $timeout;
                this.$q = $q;
                this.$compile = $compile;
                this.$exceptionHandler = $exceptionHandler;
                this.angularConstants = angularConstants;
                this.appService = appService;
                this.uiUtilService = uiUtilService;
                this.uiAnimationService = uiAnimationService;
                this.meta = angular.copy(meta);
            };

            utilService.$inject = ["$rootScope", "$timeout", "$q", "$compile", "$exceptionHandler", "angularConstants", "appService", "uiUtilService", "uiAnimationService"];

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

            utilService.prototype.handleEventOnce = function (widgetId, fn) {
                var self = this;

                return self.uiUtilService.once(function () {
                    var result = fn() || {};

                    return result.then && result || self.uiUtilService.getResolveDefer();
                }, null, self.angularConstants.eventThrottleInterval, "handleEventOnce.{0}".format(widgetId));
            }

            utilService.prototype.doAction = function (action) {
                return this.actionHandler(action);
            }

            utilService.prototype.actionHandler = function (action) {
                var self = this,
                    $widgetElement = $("#" + action.widgetObj),
                    widgetScope = angular.element($widgetElement).scope();

                if ($widgetElement.length) {
                    if (action.actionType === "Sequence") {
                        var arr = [],
                            chainId = "utilService.doAction." + action.id;

                        action.childActions && action.childActions.forEach(function (childAction) {
                            arr.push(function () {
                                return self.doAction(childAction);
                            });
                        });

                        if (action.stopOnEach) {
                            if (action.chainObject && action.chainObject.isComplete()) action.chainObject = null;

                            if (!action.chainObject) {
                                //FIXME Need code review on releasing resource after scope destroyed.
                                action.scopeDestroyWatcher && action.scopeDestroyWatcher();

                                var chainObject = self.uiUtilService.chain(arr,
                                    chainId,
                                    null,
                                    action.stopOnEach
                                );
                                action.chainObject = chainObject;

                                if (widgetScope) {
                                    action.scopeDestroyWatcher = widgetScope.$on('$destroy', function () {
                                        chainObject.cancel();
                                    });
                                }
                            }

                            return action.chainObject.next();
                        } else {
                            action.scopeDestroyWatcher && action.scopeDestroyWatcher();

                            var promise = self.uiUtilService.chain(arr,
                                chainId);

                            if (widgetScope && promise.cancel) {
                                action.scopeDestroyWatcher = widgetScope.$on('$destroy', function () {
                                    promise.cancel();
                                });
                            }

                            return promise;
                        }
                    } else if (action.actionType === "Effect") {
                        var defer = self.$q.defer(),
                            fullName = action.artifactSpec.directiveName;
                        if (action.artifactSpec.version) {
                            fullName = fullName + "-" + action.artifactSpec.version.replace(/\./g, "-")
                        }
                        $widgetElement.attr(fullName, "");
                        $widgetElement.attr("effect", action.effect.name);

                        if (action.effect.type === "Animation") {
                            var cssAnimation = {};

                            if (action.effect.options.duration) {
                                _.extend(
                                    cssAnimation, self.uiUtilService.prefixedStyle("animation-duration", "{0}s", action.effect.options.duration)
                                );
                            }
                            if (action.effect.options.timing) {
                                _.extend(
                                    cssAnimation, self.uiUtilService.prefixedStyle("timing-function", "{0}", action.effect.options.timing)
                                );
                            }

                            $widgetElement.css(cssAnimation);

                            self.uiUtilService.onAnimationEnd($widgetElement).then(function () {
                                $widgetElement.removeAttr(fullName);
                                $widgetElement.removeAttr("effect");

                                for (var key in cssAnimation) {
                                    $widgetElement.css(key, "");
                                }

                                defer.resolve();
                            });
                        } else {
                            self.$timeout(function () {
                                defer.resolve();
                            });
                        }

                        return defer.promise;
                    } else if (action.actionType === "State") {
                        return self.setState(action.widgetObj, action.newState);
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
                            "utilService.doAction.setScopedValue." + $widgetElement.attr("id"),
                            self.angularConstants.renderTimeout
                        )

                        return defer.promise;
                    } else if (action.actionType === "Movement") {
                        return self.uiAnimationService.moveWidget($widgetElement, self.$rootScope[$widgetElement.attr("id")].routes, action.routeIndex, action.settings);
                    } else if (action.actionType === "Sound") {
                        return action.resourceName && self.appService.playSound("resource/audio/{0}".format(action.resourceName)) || self.uiUtilService.getResolveDefer();
                    }
                }
            }

            utilService.prototype.handleStateAction = function (stateAction) {
                return this.actionHandler(stateAction);
            }

            utilService.prototype.setState = function (id, name) {
                var fn = this.$rootScope[id] && this.$rootScope[id].setState;
                if (fn) {
                    return fn(name);
                } else {
                    return this.setStateOnWidget(id, name);
                }
            }

            utilService.prototype.setStateOnWidget = function (id, name) {
                var self = this,
                    $widgetElement = $("#" + id);

                $widgetElement.attr("state", name);

                if ($widgetElement.hasClass(self.angularConstants.widgetClasses.widgetIncludeAnchorClass)) {
                    return self.uiUtilService.whilst(function () {
                            var scope = angular.element($widgetElement.find("[widget-container]:nth-of-type(1)").first().children()[0]).scope();
                            return !scope;
                        }, function (callback) {
                            callback();
                        }, function (err) {
                            if (!err) {
                                var scope = angular.element($widgetElement.find("[widget-container]:nth-of-type(1)").first().children()[0]).scope();
                                scope.state = name;
                            }
                        },
                        self.angularConstants.checkInterval,
                        "utilService.setStateOnWidget." + id,
                        self.angularConstants.renderTimeout
                    )
                } else {
                    var animationName = $widgetElement.css("animation-name");
                    if (animationName && animationName !== "none") {
                        return self.uiUtilService.onAnimationEnd($widgetElement);
                    } else {
                        return self.uiUtilService.getResolveDefer();
                    }
                }
            }

            utilService.prototype.registerTrigger = function (id, eventMap) {
                var self = this,
                    defer = self.$q.defer();

                function createWidgetObject(action) {
                    self.uiUtilService.whilst(function () {
                            return !document.getElementById(action.widgetObj);
                        },
                        function (callback) {
                            callback();
                        },
                        function (err) {
                            if (!err) {
                                $("#" + action.widgetObj).data("widgetObject", {
                                    handleEventOnce: function (fn) {
                                        return self.handleEventOnce(action.widgetObj, fn);
                                    }
                                });

                                action.childActions && action.childActions.forEach(function (childAction) {
                                    createWidgetObject(childAction);
                                });
                            }
                        },
                        self.angularConstants.checkInterval,
                        "utilService.registerTrigger.createWidgetObject." + action.widgetObj,
                        self.angularConstants.renderTimeout);
                }

                function createActionCallback(actions) {
                    if (actions && actions.length) {
                        var actionObj = actions[0].actionObj;

                        //Some widget may be triggered by hammer gesture and ng mouse event at the same time, which is
                        //to be prevented. A widget object with handleEventOnce function can stop widget event handling if
                        //hammer handling is processed first.
                        createWidgetObject(actionObj);

                        return function (event) {
                            if (event && event.srcEvent) {
                                event.srcEvent.stopPropagation && event.srcEvent.stopPropagation();
                            }

                            if (actionObj.stopOnEach && actionObj.chainObject) {
                                self.doAction(actionObj);
                            } else {
                                self.handleEventOnce(actionObj.widgetObj, function () {
                                    return self.doAction(actionObj);
                                })();
                            }
                        }
                    }
                }

                function destroyHammer(element, recognizers, events) {
                    return function () {
                        var $el = $(element),
                            mc = $el.data("hammer");
                        if (mc) {
                            events.forEach(function (evt) {
                                mc.off(evt);
                            });
                            recognizers.forEach(function (recognizer) {
                                mc.remove(recognizer);
                            });
                            mc.destroy();
                            $el.removeData("hammer");
                            $el.removeData("destroyHammer");
                        }
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
                            var element = document.getElementById(id),
                                fn = $(element).data("destroyHammer");
                            fn && fn();

                            _.each(eventMap, function (triggerConfig, triggerType) {
                                if (!_.isEmpty(triggerConfig)) {
                                    if (triggerType === "Gesture") {
                                        var mc = new Hammer.Manager(element),
                                            handlerMap = {};

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
                                                    callback: createActionCallback(eventConfig.actions)
                                                });
                                            }
                                        })

                                        var recognizers = [], events = [];
                                        _.each(handlerMap, function (handlerConfig) {
                                            if (handlerConfig.handlers && handlerConfig.handlers.length) {
                                                mc.add(handlerConfig.recognizer);
                                                recognizers.push(handlerConfig.recognizer);
                                                handlerConfig.handlers.forEach(function (handler) {
                                                        if (handler.callback) {
                                                            mc.on(handler.event, handler.callback);
                                                            events.push(handler.event);
                                                        }
                                                    }
                                                );
                                            }
                                        })

                                        if (recognizers.length && events.length) {
                                            $(element).data("hammer", mc);
                                            $(element).data("destroyHammer", destroyHammer(element, recognizers, events));

                                            var scope = angular.element(element).scope();
                                            scope && scope.$on('$destroy', function () {
                                                var fn = $(element).data("destroyHammer");
                                                fn && fn();
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

            function findPageElement(location) {
                var widgetId = location.match(/Widget_\d+/)[0],
                    $container = $("#main"),
                    $page = $container.children("#" + widgetId);

                return $page.length && $page || $("<div ui-include-replace></div>").attr("ng-include", "'" + location + "'");
            }

            function setCurrentPage($page) {
                var $container = $("#main"),
                    $current = $container.children(".pageHolder.currentPage");

                if ($page.attr("id") != $current.attr("id")) {
                    $current.removeClass("currentPage");
                    $page.addClass('currentPage');
                }
            }

            utilService.prototype.nextPage = function (location) {
                var self = this,
                    locationIndex;

                self.meta.locations.every(function (loc, i) {
                    if (loc === location) {
                        locationIndex = i;
                        return false;
                    }

                    return true;
                });

                if (locationIndex < self.meta.locations.length - 1) {
                    return self.loadPage(location, self.meta.locations[locationIndex + 1]).then(
                        function () {
                            var $current = findPageElement(location),
                                $next = findPageElement(self.meta.locations[locationIndex + 1]),
                                hasAnimation = false,
                                fullName;

                            $current.addClass("forward");

                            if (self.meta.pageTransition) {
                                hasAnimation = self.meta.pageTransition.effect.type === "Animation";

                                fullName = self.meta.pageTransition.artifactSpec.directiveName;
                                if (self.meta.pageTransition.artifactSpec.version) {
                                    fullName = fullName + "-" + self.meta.pageTransition.artifactSpec.version.replace(/\./g, "-")
                                }

                                $current.attr(fullName, "");
                                $current.attr("effect", self.meta.pageTransition.effect.name);
                            }

                            if (hasAnimation) {
                                $next.css("visibility", "visible");

                                return self.$q.all([
                                    self.onAnimationEnd($current),
                                    self.onAnimationEnd($next)
                                ]).then(function () {
                                    $current.removeClass("forward");
                                    $current.removeAttr("effect");
                                    fullName && $current.removeAttr(fullName);
                                    $next.css("visibility", "");
                                    setCurrentPage($next);
                                    self.$rootScope.pickedPage = self.meta.locations[locationIndex + 1];

                                    return self.setState(self.$rootScope.pickedPage.replace("page-", ""), "*").then(function () {
                                        return self.getResolveDefer(location);
                                    });
                                });
                            } else {
                                return self.$timeout(function () {
                                    $current.removeClass("forward");
                                    $current.removeAttr("effect");
                                    fullName && $current.removeAttr(fullName);
                                    setCurrentPage($next);
                                    self.$rootScope.pickedPage = self.meta.locations[locationIndex + 1];

                                    return self.setState(self.$rootScope.pickedPage.replace("page-", ""), "*").then(function () {
                                        return self.getResolveDefer(location);
                                    });
                                });
                            }
                        },
                        function (err) {
                            return self.uiUtilService.getRejectDefer(err);
                        }
                    );
                }

                return self.uiUtilService.getResolveDefer(location);
            }

            utilService.prototype.prevPage = function (location) {
                var self = this,
                    locationIndex;

                self.meta.locations.every(function (loc, i) {
                    if (loc === location) {
                        locationIndex = i;
                        return false;
                    }

                    return true;
                });

                if (locationIndex > 0) {
                    return self.loadPage(location, self.meta.locations[locationIndex - 1]).then(
                        function () {
                            var $current = findPageElement(location),
                                $prev = findPageElement(self.meta.locations[locationIndex - 1]),
                                hasAnimation = false,
                                fullName;

                            $prev.addClass("backward previousPage");

                            if (self.meta.pageTransition) {
                                hasAnimation = self.meta.pageTransition.effect.type === "Animation";

                                fullName = self.meta.pageTransition.artifactSpec.directiveName;
                                if (self.meta.pageTransition.artifactSpec.version) {
                                    fullName = fullName + "-" + self.meta.pageTransition.artifactSpec.version.replace(/\./g, "-")
                                }

                                $prev.attr(fullName, "");
                                $prev.attr("effect", self.meta.pageTransition.effect.name);
                            }

                            if (hasAnimation) {
                                $prev.css("visibility", "visible");

                                return self.$q.all([
                                    self.onAnimationEnd($current),
                                    self.onAnimationEnd($prev)
                                ]).then(function () {
                                    $prev.removeClass("backward previousPage");
                                    $prev.removeAttr("effect");
                                    fullName && $prev.removeAttr(fullName);
                                    $prev.css("visibility", "");
                                    setCurrentPage($prev);
                                    self.$rootScope.pickedPage = self.meta.locations[locationIndex - 1];

                                    return self.setState(self.$rootScope.pickedPage.replace("page-", ""), "*").then(function () {
                                        return self.getResolveDefer(location);
                                    });
                                });
                            } else {
                                return self.$timeout(function () {
                                    $prev.removeClass("backward previousPage");
                                    $prev.removeAttr("effect");
                                    fullName && $prev.removeAttr(fullName);
                                    setCurrentPage($prev);
                                    self.$rootScope.pickedPage = self.meta.locations[locationIndex - 1];

                                    return self.setState(self.$rootScope.pickedPage.replace("page-", ""), "*").then(function () {
                                        return self.getResolveDefer(location);
                                    });
                                });
                            }
                        },
                        function (err) {
                            return self.uiUtilService.getRejectDefer(err);
                        }
                    );
                }

                return self.uiUtilService.getResolveDefer(location);
            }

            utilService.prototype.loadPage = function (currentLocation, location, markCurrent) {
                var self = this,
                    $container = $("#main"),
                    $pages = $container.children("." + self.angularConstants.widgetClasses.holderClass),
                    pageCount = $pages.length;

                var m = location.match(/Widget_\d+/);
                if (m && m.length) {
                    var widgetId = m[0];
                    if (!$container.children("#" + widgetId).length) {
                        if (pageCount >= self.angularConstants.maxPageCountInDom) {
                            var $unloaded;

                            if (currentLocation) {
                                m = currentLocation.match(/Widget_\d+/);
                                if (m && m.length) {
                                    var currentWidgetId = m[0];
                                    $unloaded = $container.children("." + self.angularConstants.widgetClasses.holderClass + ":not(#" + currentWidgetId + ")").eq(0);
                                }
                            } else {
                                $unloaded = $pages.eq(0);
                            }

                            if ($unloaded) {
                                var scope = angular.element($unloaded).scope();
                                $unloaded.remove();
                                scope && scope.destroy();
                                pageCount--;
                            }
                        }

                        if (pageCount < self.angularConstants.maxPageCountInDom) {
                            var $page = $("<div ui-include-replace></div>").attr("ng-include", "'" + location + ".html'"),
                                $prev,
                                locationIndex;

                            self.meta.locations.every(function (loc, i) {
                                if (loc === location) {
                                    locationIndex = i;
                                    return false;
                                }

                                return true;
                            });
                            if (locationIndex) {
                                var prevLocation, prevWidgetId;

                                do {
                                    prevLocation = self.meta.locations[locationIndex - 1], prevWidgetId = prevLocation.match(/Widget_\d+/)[0];
                                    locationIndex--;
                                } while (locationIndex >= 1 && !$container.children("#" + prevWidgetId).length);

                                $prev = $container.children("#" + prevWidgetId);
                            }

                            $prev && $prev.length && $page.insertAfter($prev) || $page.prependTo($container);

                            return self.timeout(
                                function () {
                                    var defer = self.$q.defer(),
                                        scope = angular.element($container).scope(),
                                        includeWatcher = scope.$on("$includeContentLoaded", function () {
                                            includeWatcher();

                                            markCurrent && $container.children("#" + widgetId).addClass("currentPage");

                                            defer.resolve(location);
                                        });

                                    self.$compile($page)(scope);

                                    return defer.promise;
                                },
                                location,
                                self.angularConstants.loadTimeout
                            ).then(function (err) {
                                    return err && self.getRejectDefer(err) || self.getResolveDefer(location);
                                });
                        } else {
                            return self.getRejectDefer("The number of pages in dom exceeds maximum limit.");
                        }
                    }
                } else {
                    return self.getRejectDefer("Invalid widget id value.");
                }

                return self.getResolveDefer(location);
            }

            utilService.prototype.timeout = function (callback, timeoutId, timeout) {
                var self = this;

                timeoutId = timeoutId || "timeout_" + _.now();
                self.timeoutMap = self.timeoutMap || {};
                self.timeoutMap[timeoutId] = self.timeoutMap[timeoutId] || {}
                self.timeoutMap[timeoutId].defer = self.timeoutMap[timeoutId].defer || self.$q.defer();

                var t = timeout > 0 && self.$timeout(function () {
                        if (self.timeoutMap[timeoutId]) {
                            try {
                                callback && callback("TIMEOUT");
                            } catch (e) {
                                self.$exceptionHandler(e);
                            }

                            self.timeoutMap[timeoutId].defer.resolve("TIMEOUT");
                            delete self.timeoutMap[timeoutId];

                            self.angularConstants.VERBOSE && self.$log.debug("TIMEOUT occurred on timeoutId " + timeoutId);
                        }
                    }, timeout) || null;

                callback().then(function (result) {
                    t && self.$timeout.cancel(t);
                    self.timeoutMap[timeoutId].defer.resolve();
                    delete self.timeoutMap[timeoutId];
                }, function (err) {
                    t && self.$timeout.cancel(t);
                    self.timeoutMap[timeoutId].defer.resolve(err);
                    delete self.timeoutMap[timeoutId];
                });

                return self.timeoutMap[timeoutId].defer.promise;
            }


            utilService.prototype.getResolveDefer = function (result) {
                var self = this,
                    defer = self.$q.defer();

                self.$timeout(function () {
                    defer.resolve(result);
                });

                return defer.promise;
            }

            utilService.prototype.getRejectDefer = function (err) {
                var self = this,
                    errorDefer = self.$q.defer();

                self.$timeout(function () {
                    errorDefer.reject(err);
                });

                return errorDefer.promise;
            }

            utilService.prototype.onAnimationEnd = function (target) {
                var animEndEventNames = {
                        'WebkitAnimation': 'webkitAnimationEnd',
                        'OAnimation': 'oAnimationEnd',
                        'msAnimation': 'MSAnimationEnd',
                        'animation': 'animationend'
                    },
                    animEndEventName = animEndEventNames[Modernizr.prefixed('animation')],
                    self = this,
                    defer = self.$q.defer();

                target.on(animEndEventName, function () {
                    $(this).off(animEndEventName);
                    defer.resolve();
                });

                return defer.promise;
            }

            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('utilService', utilService);
                }]);
        }
    }
)
;