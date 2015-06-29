define(
    ["angular", "jquery", "hammer"],
    function () {
        return function (appModule, extension, opts) {
            var DIRECTIVE = "uiSketchWidget";

            var DIRECTION_NONE = 1;
            var DIRECTION_LEFT = 2;
            var DIRECTION_RIGHT = 4;
            var DIRECTION_UP = 8;
            var DIRECTION_DOWN = 16;

            var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
            var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
            var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

            var directionOpt = {
                    'horizontal': DIRECTION_HORIZONTAL,
                    'vertical': DIRECTION_VERTICAL,
                    'all': DIRECTION_ALL
                }, defaults = {
                    direction: 'all'
                },
                options = angular.extend(defaults, opts),
                inject = ['$rootScope', '$parse', '$timeout', "$q", "$exceptionHandler", "$compile", "$log", "angularConstants", "angularEventTypes", "uiUtilService", "uiService"];

            appModule.directive(
                DIRECTIVE,
                _.union(inject, [function ($rootScope, $parse, $timeout, $q, $exceptionHandler, $compile, $log, angularConstants, angularEventTypes, uiUtilService, uiService) {
                    var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                    var tapRecognizer, panRecognizer, pressRecognizer, toggleHandler, toggleTextModeHandler, dragHandler;

                    function isTextToggleable(widgetObj) {
                        return !widgetObj.isTemporary && !widgetObj.hasClass(angularConstants.widgetClasses.holderClass);
                    }

                    function registerHandlers(scope, element) {
                        var widgetObj = element.data("widgetObject");

                        if (widgetObj && !widgetObj.hasClass(angularConstants.widgetClasses.widgetContainerClass)) {
                            //'sketch-widget-hammer' stores the configuration hammer gestures
                            var mc = element.data("sketch-widget-hammer");

                            if (!mc) {
                                mc = new Hammer.Manager(element[0]);
                                element.data("sketch-widget-hammer", mc);
                            }

                            toggleHandler = function (event) {
                                function handler(widget, shiftPressed) {
                                    var defer = $q.defer();

                                    $timeout(function () {
                                        var prevWidget = $rootScope.sketchObject.pickedWidget;

                                        if (shiftPressed) {
                                            if (widget.isElement) {
                                                if (prevWidget) {
                                                    if (prevWidget.isElement) {
                                                        if (prevWidget.isTemporary) {
                                                            if (prevWidget.id != widget.id) {
                                                                if (prevWidget.directContains(widget)) {
                                                                    prevWidget.levelUp(widget, true);

                                                                    if (prevWidget.childWidgets.length == 1) {
                                                                        prevWidget.disassemble();
                                                                        $rootScope.sketchObject.pickedWidget = null;
                                                                    }
                                                                } else {
                                                                    widget.appendTo(prevWidget);
                                                                }
                                                            } else {
                                                                prevWidget.$element.removeClass(angularConstants.widgetClasses.activeClass);
                                                                $rootScope.sketchObject.pickedWidget = null;
                                                            }
                                                        } else {
                                                            prevWidget.$element.removeClass(angularConstants.widgetClasses.activeClass);

                                                            if (!prevWidget.directContains(widget)) {
                                                                if (prevWidget.id != widget.id) {
                                                                    if (widget.isTemporary) {
                                                                        prevWidget.appendTo(widget);
                                                                        $rootScope.sketchObject.pickedWidget = widget;
                                                                    } else {
                                                                        var composite = uiService.createComposite([prevWidget, widget], true);
                                                                        composite.addClass(scope.options.widgetClass);
                                                                        $rootScope.sketchObject.pickedWidget = composite;
                                                                    }
                                                                    $rootScope.sketchObject.pickedWidget.$element.addClass(angularConstants.widgetClasses.activeClass);
                                                                } else {
                                                                    $rootScope.sketchObject.pickedWidget = null;
                                                                }
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    $rootScope.sketchObject.pickedWidget = widget;
                                                    $rootScope.sketchObject.pickedWidget.$element.addClass(angularConstants.widgetClasses.activeClass);
                                                }
                                            }
                                        } else {
                                            if (!$rootScope.sketchObject.pickedWidget || $rootScope.sketchObject.pickedWidget.id != widget.id) {
                                                $rootScope.sketchObject.pickedWidget = widget;
                                                $rootScope.sketchObject.pickedWidget.$element.addClass(angularConstants.widgetClasses.activeClass);
                                            }

                                            if (prevWidget) {
                                                prevWidget.$element.removeClass(angularConstants.widgetClasses.activeClass);
                                                if ($rootScope.sketchObject.pickedWidget == prevWidget)
                                                    $rootScope.sketchObject.pickedWidget = null;
                                                !prevWidget.isTemporary && prevWidget.isElement && prevWidget.$element && toggleTextMode(prevWidget.$element, false);
                                            }
                                        }

                                        defer.resolve();
                                    });

                                    return defer.promise;
                                }

                                if (!$rootScope.sketchWidgetSetting.isPlaying && !event.srcEvent.defaultPrevented) {
                                    var target = angular.isElement(event) && event || event.target,
                                        $target = $(target);

                                    if ($target.attr("ui-sketch-widget") === undefined) {
                                        var $container = $target.closest("." + angularConstants.widgetClasses.widgetContainerClass);
                                        $target = $container.parent();
                                    }

                                    var widget = $target.data("widgetObject");
                                    if (widget) {
                                        uiUtilService.once(handler, null, angularConstants.unresponsiveInterval, "sketch-widget.toggleHandler.handler" + widget.id)(widget, event.srcEvent && event.srcEvent.shiftKey);
                                    }
                                }
                            }

                            toggleTextModeHandler = function (event) {
                                function handler(widget) {
                                    var defer = $q.defer();

                                    $timeout(function () {
                                        var prevWidget = $rootScope.sketchObject.pickedWidget;

                                        prevWidget && !prevWidget.isTemporary && prevWidget.isElement && toggleTextMode(prevWidget.$element, false);

                                        if (!prevWidget || prevWidget.id != widget.id) {
                                            prevWidget && prevWidget.$element.removeClass(angularConstants.widgetClasses.activeClass);
                                            $rootScope.sketchObject.pickedWidget = widget;
                                            !widget.isTemporary && widget.isElement && toggleTextMode(widget.$element);
                                        } else {
                                            if (!toggleTextMode(widget.$element)) {
                                                $rootScope.sketchObject.pickedWidget = null;
                                            }
                                            widget.$element.removeClass(angularConstants.widgetClasses.activeClass);
                                        }

                                        defer.resolve();
                                    });

                                    return defer.promise;
                                }

                                if (!$rootScope.sketchWidgetSetting.isPlaying && !event.srcEvent.defaultPrevented) {
                                    var target = angular.isElement(event) && event || event.target,
                                        $target = $(target);

                                    if ($target.attr(angularConstants.anchorAttr) != null) {
                                        var $container = $target.closest("." + angularConstants.widgetClasses.widgetContainerClass);
                                        $target = $container.parent();
                                    }

                                    var widget = $target.data("widgetObject");
                                    if (widget && widget.isKindOf("ElementSketchWidget")) {
                                        uiUtilService.once(handler, null, angularConstants.unresponsiveInterval, "registerHandlers.toggleTextModeHandler." + widget.id)(widget);
                                    }
                                }
                            }

                            function toggleTextMode($el, state) {
                                var widgetObj = $el.data("widgetObject"),
                                    $textHolder = $("#widgetTextHolder"),
                                    editingWidget = $textHolder.data("widgetObject");

                                if (state == null)
                                    state = !editingWidget || editingWidget.id !== widgetObj.id;

                                $textHolder.toggle(state);

                                if (state) {
                                    uiService.createEditor("#widgetTextHolder", widgetObj.markdown);

                                    $textHolder.data("widgetObject", widgetObj);
                                } else {
                                    $textHolder.removeData("widgetObject");
                                }

                                return state;
                            }

                            dragHandler = function (event) {
                                function handler(event) {
                                    var defer = $q.defer();

                                    $timeout(function () {
                                        if (angularConstants.VERBOSE) {
                                            $log.debug(event.type);
                                        }

                                        if (!event.currentTarget)
                                            event.currentTarget = element[0];

                                        var $u = $(element[0]),
                                            target = event.srcEvent.target;

                                        if (target.id && $u.has("#" + target.id)) {
                                            $u = $(target);
                                        }

                                        var touchX = $u.data("touchX"),
                                            touchY = $u.data("touchY");
                                        if (!widgetObj.zoomed) {
                                            if (event.type === "panstart") {
                                                touchX = event.srcEvent.clientX - $u.parent().offset().left;
                                                touchY = event.srcEvent.clientY - $u.parent().offset().top;
                                                $u.data("touchX", touchX);
                                                $u.data("touchY", touchY);
                                            } else if (event.type === "panmove") {
                                                if (touchX != undefined && touchY != undefined) {
                                                    if (scope.options.direction & DIRECTION_VERTICAL) {
                                                        var moveY = event.srcEvent.clientY - ($u.parent().offset().top + touchY),
                                                            maxHeight = $u.parent().height(),
                                                            height = $u.height(),
                                                            ftTop,
                                                            top;

                                                        var m = ($u.css("top") || "").match(/([-\d\.]+)px$/);
                                                        if (m && m.length == 2)
                                                            ftTop = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                        else
                                                            ftTop = Math.floor(($u.offset().top - $u.parent().offset().top) * angularConstants.precision) / angularConstants.precision;
                                                        top = ftTop + moveY;

                                                        if (scope.scale) {
                                                            ftTop = $u.offset().top - $u.parent().offset().top;
                                                            top = ftTop + moveY;
                                                            maxHeight *= scope.scale;
                                                            height *= scope.scale;
                                                        }

                                                        if (top + height / 2 < 0)
                                                            top = -height / 2;
                                                        else if (top + height / 2 > maxHeight)
                                                            top = maxHeight - height / 2;

                                                        if (scope.scale)
                                                            top = Math.floor(top / scope.scale * angularConstants.precision) / angularConstants.precision;
                                                        else
                                                            top = Math.floor(top * angularConstants.precision) / angularConstants.precision;

                                                        touchY += moveY;
                                                        event.moveY = top - ftTop;

                                                        widgetObj.css("top", top + "px");

                                                        if (angularConstants.VERBOSE) {
                                                            $log.debug("top:" + top);
                                                            $log.debug("touchY:" + touchY);
                                                        }
                                                    }

                                                    if (scope.options.direction & DIRECTION_HORIZONTAL) {
                                                        var moveX = event.srcEvent.clientX - ($u.parent().offset().left + touchX),
                                                            maxWidth = $u.parent().width(),
                                                            width = $u.width(),
                                                            ftLeft,
                                                            left;

                                                        var m = ($u.css("left") || "").match(/([-\d\.]+)px$/);
                                                        if (m && m.length == 2)
                                                            ftLeft = Math.floor(parseFloat(m[1]) * angularConstants.precision) / angularConstants.precision;
                                                        else
                                                            ftLeft = Math.floor(($u.offset().left - $u.parent().offset().left) * angularConstants.precision) / angularConstants.precision;
                                                        left = ftLeft + moveX;

                                                        if (scope.scale) {
                                                            ftLeft = $u.offset().left - $u.parent().offset().left;
                                                            left = ftLeft + moveX;
                                                            maxWidth *= scope.scale;
                                                            width *= scope.scale;
                                                        }

                                                        if (left + width / 2 < 0)
                                                            left = -width / 2;
                                                        else if (left + width / 2 > maxWidth)
                                                            left = maxWidth - width / 2;

                                                        if (scope.scale)
                                                            left = Math.floor(left / scope.scale * angularConstants.precision) / angularConstants.precision;
                                                        else
                                                            left = Math.floor(left * angularConstants.precision) / angularConstants.precision;

                                                        touchX += moveX;
                                                        event.moveX = left - ftLeft;

                                                        widgetObj.css("left", left + "px");

                                                        if (angularConstants.VERBOSE) {
                                                            $log.debug("left:" + left);
                                                            $log.debug("touchX:" + touchX);
                                                        }
                                                    }

                                                    $u.data("touchX", touchX);
                                                    $u.data("touchY", touchY);
                                                }
                                            } else {
                                                $u.removeData("touchX");
                                                $u.removeData("touchY");
                                            }
                                        }

                                        defer.resolve();
                                    });

                                    return defer.promise;
                                }

                                if (!$rootScope.sketchWidgetSetting.isPlaying && !event.srcEvent.defaultPrevented) {
                                    if (event.srcEvent.target.id === widgetObj.id && $(event.srcEvent.target).hasClass(angularConstants.widgetClasses.activeClass)) {
                                        uiUtilService.once(handler, null, angularConstants.unresponsiveInterval, "sketch-widget.registerHandlers.dragHandler.handler." + widgetObj.id)(event);
                                    }
                                }
                            };

                            mc.add(new Hammer.Tap());
                            mc.add(new Hammer.Pan());
                            mc.on("tap", toggleHandler);
                            mc.on("panstart panmove panend", dragHandler);
                            tapRecognizer = mc.get("tap");
                            panRecognizer = mc.get("pan");

                            if (isTextToggleable(widgetObj)) {
                                mc.add(new Hammer.Press());
                                mc.on("press", toggleTextModeHandler);
                                pressRecognizer = mc.get("press");
                            }
                        }
                    }

                    function unregisterHandlers(element) {
                        var widgetObj = element.data("widgetObject");

                        if (widgetObj && !widgetObj.hasClass(angularConstants.widgetClasses.widgetContainerClass)) {
                            var mc = element.data("sketch-widget-hammer");

                            if (mc) {
                                mc.off("tap", toggleHandler);
                                mc.off("panstart panmove panend", dragHandler);

                                if (isTextToggleable(widgetObj))
                                    mc.off("press", toggleTextModeHandler);

                                tapRecognizer && mc.remove(tapRecognizer);
                                panRecognizer && mc.remove(panRecognizer);
                                pressRecognizer && mc.remove(pressRecognizer);
                                tapRecognizer = null, panRecognizer = null, pressRecognizer = null;

                                mc.destroy();
                                element.removeData("sketch-widget-hammer");
                            }
                        }
                    }

                    return {
                        restrict: "A",
                        scope: {scale: "=?", widgetName: "@"},
                        replace: false,
                        compile: function (element, attrs) {
                            return {
                                pre: function (scope, element, attrs) {
                                    extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                        element: element,
                                        scope: scope
                                    }));

                                    scope.options = angular.extend(options, $parse(attrs['uiSketchWidgetOpts'])(scope, {}));
                                    scope.options.widgetClass = angularConstants.widgetClasses.widgetClass;
                                    scope.options.direction = directionOpt[options.direction] || DIRECTION_ALL;

                                    /* FIXME
                                    * Some widgets' elements append to dom without angular compilation, so the directive logic won't be processed,
                                    * which will cause the gesture in design mode not to work on such widgets.
                                    * */

                                    //Since widget setting gesture may collide with actual playing gesture, we disable it for play.
                                    scope.playProjectWatcher = scope.$on(angularEventTypes.playProjectEvent, function (event, value) {
                                        function watchHandler(el, isPlaying) {
                                            if (isPlaying) {
                                                unregisterHandlers(el);
                                            } else {
                                                registerHandlers(scope, el);
                                            }

                                            return uiUtilService.getResolveDefer();
                                        }

                                        if (element.parent().length) {
                                            //Directive ng-include will recreate element which have no widget id attribute.
                                            var id = element.attr("id") || element.parent().attr("id");

                                            id && uiUtilService.latestOnce(watchHandler, null, angularConstants.unresponsiveInterval, "sketch-widget.playProjectEvent.watchHandler.{0}".format(id))(element, value);
                                        }
                                    });

                                    //Defining widget route depends on mouse click event which collides with widget setting gesture,  we disable it temporarily.
                                    scope.defineWidgetRouteWatcher = scope.$on(angularEventTypes.defineWidgetRouteEvent, function (event, value) {
                                        function watchHandler(el, isPlaying) {
                                            if (isPlaying) {
                                                unregisterHandlers(el);
                                            } else {
                                                registerHandlers(scope, el);
                                            }

                                            return uiUtilService.getResolveDefer();
                                        }

                                        if (element.parent().length) {
                                            //Directive ng-include will recreate element which have no widget id attribute.
                                            var id = element.attr("id") || element.parent().attr("id");

                                            id && uiUtilService.latestOnce(watchHandler, null, angularConstants.unresponsiveInterval, "sketch-widget.defineWidgetRouteEvent.watchHandler.{0}".format(id))(element, value);
                                        }
                                    });

                                    attrs.$observe(DIRECTIVE, function () {
                                        function attachHandler(el) {
                                            var widgetObj = uiService.createWidgetObj(el);
                                            if (widgetObj) {
                                                if (scope.widgetName) {
                                                    widgetObj.name = scope.widgetName;
                                                }
                                                widgetObj.attach();

                                                $rootScope.sketchWidgetSetting.isPlaying || registerHandlers(scope, el);
                                            }

                                            return uiUtilService.getResolveDefer();
                                        }

                                        if (element.parent().length) {
                                            var id = element.attr("id");

                                            if (!id && element.hasClass(angularConstants.widgetClasses.widgetContainerClass)) {
                                                id =  element.parent().attr("id") + ".containerWidget";
                                            }

                                            id && uiUtilService.latestOnce(attachHandler, null, angularConstants.unresponsiveInterval, "sketch-widget.attachHandler.{0}".format(id))(element);
                                        }
                                    });

                                    scope.$on('$destroy', function () {
                                        unregisterHandlers(element);

                                        if (scope.playProjectWatcher) {
                                            scope.playProjectWatcher();
                                            scope.playProjectWatcher = null;
                                        }

                                        if (scope.defineWidgetRouteWatcher) {
                                            scope.defineWidgetRouteWatcher();
                                            scope.defineWidgetRouteWatcher = null;
                                        }
                                    });
                                },
                                post: function (scope, element, attrs) {
                                }
                            };
                        }
                    };
                }]));
        }
    }
);