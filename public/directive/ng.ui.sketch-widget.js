define(
    ["angular", "jquery", "hammer"],
    function () {
        return function (appModule, extension, opts) {
            var DIRECTIVE = "uiSketchWidget";
            var VERBOSE = true;

            var DIRECTION_NONE = 1;
            var DIRECTION_LEFT = 2;
            var DIRECTION_RIGHT = 4;
            var DIRECTION_UP = 8;
            var DIRECTION_DOWN = 16;

            var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
            var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
            var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

            var defaults = {
                    onceId: "sketch-widget.handler",
                    draggableOnceId: "draggable.dragHandler.handler"
                },
                options = angular.extend(defaults, opts),
                inject = ['$parse', '$timeout', "$q", "$compile", "$log", "angularConstants", "angularEventTypes", "uiUtilService", "uiService"];

            appModule.directive(
                DIRECTIVE,
                _.union(inject, [function ($parse, $timeout, $q, $compile, $log, angularConstants, angularEventTypes, uiUtilService, uiService) {
                    var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                    var resizeHandler, toggleHandler, toggleResizeOnPressHandler, toggleTextModeHandler;

                    function registerHandlers(scope, element) {
                        var widgetObj = element.data("widgetObject");

                        if (widgetObj && !widgetObj.hasClass(angularConstants.widgetClasses.widgetContainerClass)) {
                            var mc = element.data("hammer");

                            if (!mc) {
                                mc = new Hammer.Manager(element[0]);
                                mc.add(new Hammer.Press());
                                mc.add(new Hammer.Tap());
                                element.data("hammer", mc);

                                toggleHandler = function (event) {
                                    function handler(widget, shiftPressed) {
                                        var defer = $q.defer();

                                        $timeout(function () {
                                            var prevWidget = scope.sketchObject.pickedWidget;

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
                                                                            scope.sketchObject.pickedWidget = null;
                                                                        }
                                                                    } else {
                                                                        widget.appendTo(prevWidget);
                                                                    }
                                                                } else {
                                                                    prevWidget.removeOmniClass(angularConstants.widgetClasses.activeClass);
                                                                    prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element, false);
                                                                    scope.sketchObject.pickedWidget = null;
                                                                }
                                                            } else {
                                                                prevWidget.removeOmniClass(angularConstants.widgetClasses.activeClass);
                                                                prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element, false);

                                                                if (!prevWidget.directContains(widget)) {
                                                                    if (prevWidget.id != widget.id) {
                                                                        if (widget.isTemporary) {
                                                                            prevWidget.appendTo(widget);
                                                                            scope.sketchObject.pickedWidget = widget;
                                                                        } else {
                                                                            var composite = uiService.createComposite([prevWidget, widget], true);
                                                                            composite.addClass(options.widgetClass);
                                                                            scope.sketchObject.pickedWidget = composite;
                                                                        }
                                                                        scope.sketchObject.pickedWidget.addOmniClass(angularConstants.widgetClasses.activeClass);
                                                                    } else {
                                                                        scope.sketchObject.pickedWidget = null;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    } else {
                                                        scope.sketchObject.pickedWidget = widget;
                                                        scope.sketchObject.pickedWidget.addOmniClass(angularConstants.widgetClasses.activeClass);
                                                    }
                                                }
                                            } else {
                                                if (!scope.sketchObject.pickedWidget || scope.sketchObject.pickedWidget.id != widget.id) {
                                                    scope.sketchObject.pickedWidget = widget;
                                                    scope.sketchObject.pickedWidget.addOmniClass(angularConstants.widgetClasses.activeClass);
                                                }

                                                if (prevWidget) {
                                                    prevWidget.removeOmniClass(angularConstants.widgetClasses.activeClass);
                                                    if (scope.sketchObject.pickedWidget == prevWidget)
                                                        scope.sketchObject.pickedWidget = null;
                                                    !prevWidget.isTemporary && prevWidget.isElement && prevWidget.$element && toggleTextMode(prevWidget.$element, false);
                                                }
                                            }

                                            defer.resolve();
                                        });

                                        return defer.promise;
                                    }

                                    handler.onceId = options.onceId;

                                    var target = angular.isElement(event) && event || event.target,
                                        $target = $(target);

                                    if ($target.attr("widget-anchor") != null) {
                                        var $container = $target.closest("." + angularConstants.widgetClasses.widgetContainerClass);
                                        $target = $container.parent();
                                    }

                                    var widget = $target.data("widgetObject");
                                    if (widget) {
                                        uiUtilService.once(handler, null, 20)(widget, event.srcEvent && event.srcEvent.shiftKey);
                                    }
                                }

                                toggleResizeOnPressHandler = function (event) {
                                    function handler(widget) {
                                        var defer = $q.defer();

                                        $timeout(function () {
                                            var prevWidget = scope.sketchObject.pickedWidget;

                                            if (!scope.sketchObject.pickedWidget || scope.sketchObject.pickedWidget.id != widget.id) {
                                                scope.sketchObject.pickedWidget = widget;
                                                scope.sketchObject.pickedWidget.addOmniClass(angularConstants.widgetClasses.activeClass);
                                                widget.resizable && !widget.isTemporary && toggleResize(widget.$element);
                                            }

                                            if (prevWidget) {
                                                if (scope.sketchObject.pickedWidget == prevWidget) {
                                                    var resizeToggled = prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element);
                                                    if (!resizeToggled) {
                                                        scope.sketchObject.pickedWidget = null;
                                                        prevWidget.removeOmniClass(angularConstants.widgetClasses.activeClass);
                                                    }
                                                } else {
                                                    prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element, false);
                                                    prevWidget.removeOmniClass(angularConstants.widgetClasses.activeClass);
                                                }
                                            }

                                            defer.resolve();
                                        });

                                        return defer.promise;
                                    }

                                    handler.onceId = options.onceId;

                                    var target = angular.isElement(event) && event || event.target,
                                        $target = $(target);

                                    if ($target.attr("widget-anchor") != null) {
                                        var $container = $target.closest("." + angularConstants.widgetClasses.widgetContainerClass);
                                        $target = $container.parent();
                                    }

                                    var widget = $target.data("widgetObject");
                                    if (widget && widget.isKindOf("ElementSketchWidget")) {
                                        uiUtilService.once(handler, null, 20)(widget);
                                    }
                                }

                                resizeHandler = function (event) {
                                    function handler(event) {
                                        var defer = $q.defer();

                                        $timeout(function () {
                                            var $u = $(event.target),
                                                direction = parseInt($u.attr("direction")) || DIRECTION_NONE,
                                                top = event.srcEvent.pageY - $u.offset().top,
                                                left = event.srcEvent.pageX - $u.offset().left;

                                            top = Math.floor(top * angularConstants.precision) / angularConstants.precision;
                                            left = Math.floor(left * angularConstants.precision) / angularConstants.precision;

                                            if (VERBOSE) {
                                                $log.debug(event.type);
                                            }

                                            if (event.type === "panstart") {
                                                var height = $u.height(),
                                                    width = $u.width();

                                                if (top >= height - 5 && top <= height)
                                                    direction |= DIRECTION_DOWN;
                                                else if (top <= 5)
                                                    direction |= DIRECTION_UP;

                                                if (left >= width - 5 && top <= width)
                                                    direction |= DIRECTION_RIGHT;
                                                else if (left <= 5)
                                                    direction |= DIRECTION_LEFT;

                                                $u.attr("direction", direction);
                                            } else if (event.type === "panmove") {
                                                if (direction & DIRECTION_HORIZONTAL) {
                                                    $u.width(left);
                                                }

                                                if (direction & DIRECTION_VERTICAL) {
                                                    $u.height(top);
                                                }
                                            } else if (event.type == "panend") {
                                                var w = $u.width(), h = $u.height(), widgetObj = element.data("widgetObject");
                                                w = Math.floor(w * angularConstants.precision) / angularConstants.precision, h = Math.floor(h * angularConstants.precision) / angularConstants.precision;

                                                if (widgetObj) {
                                                    widgetObj.css("width", w + "px");
                                                    widgetObj.css("height", h + "px");
                                                } else {
                                                    element.width(w);
                                                    element.height(h);
                                                }
                                            }

                                            defer.resolve();
                                        });

                                        return defer.promise;
                                    }

                                    handler.onceId = options.draggableOnceId;
                                    uiUtilService.once(handler, null, 20)(event);
                                }

                                function toggleResize($el, state) {
                                    var $resize = $el.prev();

                                    if (!$resize.hasClass("resize")) {
                                        if (state == undefined || state) {
                                            $resize = $("<div class='resize' />")
                                                .load("include/_sketch_widget_resize.html")
                                                .insertBefore($el);
                                            var left = $el.position().left,
                                                top = $el.position().top,
                                                width = $el.width(),
                                                height = $el.height(),
                                                zIndex = $el.css("z-index") || 0;

                                            if (zIndex === "auto")
                                                zIndex = 0;
                                            left = Math.floor(left * angularConstants.precision) / angularConstants.precision;
                                            top = Math.floor(top * angularConstants.precision) / angularConstants.precision;
                                            width = Math.floor(width * angularConstants.precision) / angularConstants.precision;
                                            height = Math.floor(height * angularConstants.precision) / angularConstants.precision;

                                            $resize.width(width);
                                            $resize.height(height);
                                            $resize.css("left", left + "px");
                                            $resize.css("top", top + "px");
                                            $resize.css("z-index", zIndex + 1);

                                            var backgroundColor = $el.css("background-color"),
                                                borderColor = backgroundColor;
                                            if (backgroundColor) {
                                                backgroundColor = uiUtilService.rgbToHex(backgroundColor);
                                                borderColor = uiUtilService.contrastColor(backgroundColor) === "#ffffff" ? uiUtilService.lighterColor(backgroundColor, 0.5) : uiUtilService.lighterColor(backgroundColor, -0.5);
                                            } else {
                                                borderColor = "#000000";
                                            }
                                            $resize.css("color", borderColor);

                                            var rmc = new Hammer.Manager($resize.get(0));
                                            rmc.add(new Hammer.Pan({threshold: 0, pointers: 0}));
                                            rmc.add(new Hammer.Tap());
                                            rmc.on("panstart panmove panend", resizeHandler);
                                            rmc.on("tap", function (event) {
                                                rmc.off("panstart panmove panend");
                                                rmc.off("tap");

                                                $timeout(function () {
                                                    toggleHandler($(event.target).next());
                                                });
                                            });
                                        }
                                    } else {
                                        if (state == undefined || !state)
                                            $resize.remove();
                                    }

                                    return $resize.parent().length && $resize.hasClass("resize");
                                }

                                toggleTextModeHandler = function (event) {
                                    function handler(widget) {
                                        var defer = $q.defer();

                                        $timeout(function () {
                                            var prevWidget = scope.sketchObject.pickedWidget;

                                            prevWidget && !prevWidget.isTemporary && prevWidget.isElement && toggleTextMode(prevWidget.$element, false);

                                            if (!prevWidget || prevWidget.id != widget.id) {
                                                prevWidget && prevWidget.removeOmniClass(angularConstants.widgetClasses.activeClass);
                                                scope.sketchObject.pickedWidget = widget;
                                                !widget.isTemporary && widget.isElement && toggleTextMode(widget.$element);
                                            } else {
                                                if (!toggleTextMode(widget.$element)) {
                                                    scope.sketchObject.pickedWidget = null;
                                                }
                                                widget.removeOmniClass(angularConstants.widgetClasses.activeClass);
                                            }

                                            defer.resolve();
                                        });

                                        return defer.promise;
                                    }

                                    handler.onceId = options.onceId;

                                    var target = angular.isElement(event) && event || event.target,
                                        $target = $(target);

                                    if ($target.attr("widget-anchor") != null) {
                                        var $container = $target.closest("." + angularConstants.widgetClasses.widgetContainerClass);
                                        $target = $container.parent();
                                    }

                                    var widget = $target.data("widgetObject");
                                    if (widget && widget.isKindOf("ElementSketchWidget")) {
                                        uiUtilService.once(handler, null, 20)(widget);
                                    }
                                }

                                function toggleTextMode($el, state) {
                                    var widgetObj = $el.data("widgetObject"),
                                        $text = $("#widgetText"),
                                        editingWidget = $text.data("widgetObject"),
                                        left = $el.offset().left,
                                        top = $el.offset().top,
                                        width = $el.width(),
                                        height = $el.height();

                                    if (state == null)
                                        state = !editingWidget || editingWidget.id !== widgetObj.id;

                                    $text.toggle(state);

                                    if (state) {
                                        left = Math.floor(left * angularConstants.precision) / angularConstants.precision;
                                        top = Math.floor(top * angularConstants.precision) / angularConstants.precision;
                                        width = Math.floor(width * angularConstants.precision) / angularConstants.precision;
                                        height = Math.floor(height * angularConstants.precision) / angularConstants.precision;

                                        $text.width(width);
                                        $text.height(height);
                                        $text.offset({left: left, top: top});

                                        var backgroundColor = $el.css("background-color"),
                                            borderColor = backgroundColor;
                                        if (backgroundColor) {
                                            backgroundColor = uiUtilService.rgbToHex(backgroundColor);
                                            borderColor = uiUtilService.contrastColor(backgroundColor) === "#ffffff" ? uiUtilService.lighterColor(backgroundColor, 0.5) : uiUtilService.lighterColor(backgroundColor, -0.5);
                                        } else {
                                            borderColor = "#000000";
                                        }
                                        $text.css("color", borderColor);
                                        $text.data("widgetObject", widgetObj);
                                        $text.focus();
                                    } else {
                                        if (editingWidget) {
                                            $text.css("width", "auto");
                                            if ($text.width()) {
                                                editingWidget.setHtml($text.html());
                                            }
                                        }
                                        $text.removeData("widgetObject");
                                    }

                                    return state;
                                }

                                mc.on("tap", toggleHandler);
                                mc.on("press", toggleTextModeHandler);

                                //Disable resize mode on sketch widget since we can use ruler function instead.
                                //mc.on("press", toggleResizeOnPressHandler);
                            }
                        }
                    }

                    function unregisterHandlers(element) {
                        var widgetObj = element.data("widgetObject");

                        if (widgetObj && !widgetObj.hasClass(angularConstants.widgetClasses.widgetContainerClass)) {
                            var mc = element.data("hammer");

                            if (mc) {
                                mc.off("tap", toggleHandler);
                                mc.off("press", toggleTextModeHandler);

                                //Disable resize mode on sketch widget since we can use ruler function instead.
                                //mc.off("press", toggleResizeOnPressHandler);

                                element.removeData("hammer");
                            }
                        }
                    }

                    return {
                        restrict: "A",
                        scope: {sketchObject: "=", isPlaying: "="},
                        replace: false,
                        compile: function (element, attrs) {
                            return {
                                pre: function (scope, element, attrs) {
                                    extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                        element: element,
                                        scope: scope
                                    }));

                                    options = angular.extend(options, $parse(attrs['uiSketchWidgetOpts'])(scope, {}));
                                    options.widgetClass = angularConstants.widgetClasses.widgetClass;

                                    //Since widget setting gesture may collide with actual playing gesture, we disable it for play.
                                    scope.$watch("isPlaying", function (value) {
                                        var widgetObj = uiService.createWidgetObj(element);
                                        widgetObj && widgetObj.setIsPlaying && widgetObj.setIsPlaying(value);

                                        if (value) {
                                            unregisterHandlers(element);
                                        } else {
                                            registerHandlers(scope, element);
                                        }
                                    });
                                },
                                post: function (scope, element, attrs) {
                                    attrs.$observe(DIRECTIVE, function (value) {
                                        uiService.createWidgetObj(element);
                                        registerHandlers(scope, element);
                                    });

                                    scope.$on('$destroy', function () {
                                        unregisterHandlers(element);
                                    });
                                }
                            };
                        }
                    };
                }]));
        }
    }
);