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

            var boundProperties = {},
                defaults = {
                    widgetClass: "sketchWidget",
                    onceId: "sketch-widget.handler",
                    draggableOnceId: "draggable.dragHandler.handler"
                },
                options = angular.extend(defaults, opts),
                inject = ['$parse', '$timeout', "$q", "$compile", "$log", "angularConstants", "angularEventTypes", "uiUtilService", "uiService"];

            appModule.directive(
                DIRECTIVE,
                _.union(inject, [function ($parse, $timeout, $q, $compile, $log, angularConstants, angularEventTypes, uiUtilService, uiService) {
                    var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                    var mc, resizeHandler, toggleHandler, toggleResizeOnPressHandler, toggleTextModeHandler;

                    function registerHandlers(scope, element) {
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
                                                                    prevWidget.append(widget);
                                                                }
                                                            } else {
                                                                prevWidget.removeClass("pickedWidget");
                                                                prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element, false);
                                                                scope.sketchObject.pickedWidget = null;
                                                            }
                                                        } else {
                                                            prevWidget.removeClass("pickedWidget");
                                                            prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element, false);

                                                            if (!prevWidget.directContains(widget)) {
                                                                if (prevWidget.id != widget.id) {
                                                                    if (widget.isTemporary) {
                                                                        widget.append(prevWidget);
                                                                        scope.sketchObject.pickedWidget = widget;
                                                                    } else {
                                                                        var composite = uiService.createComposite([prevWidget, widget]);
                                                                        composite.addClass(options.widgetClass);
                                                                        composite.setTemporary(true);
                                                                        scope.sketchObject.pickedWidget = composite;
                                                                    }
                                                                    scope.sketchObject.pickedWidget.addClass("pickedWidget");
                                                                } else {
                                                                    scope.sketchObject.pickedWidget = null;
                                                                }
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    scope.sketchObject.pickedWidget = widget;
                                                    scope.sketchObject.pickedWidget.addClass("pickedWidget");
                                                }
                                            }
                                        } else {
                                            if (!scope.sketchObject.pickedWidget || scope.sketchObject.pickedWidget.id != widget.id) {
                                                scope.sketchObject.pickedWidget = widget;
                                                scope.sketchObject.pickedWidget.addClass("pickedWidget");
                                            }

                                            if (prevWidget) {
                                                prevWidget.removeClass("pickedWidget");
                                                if (scope.sketchObject.pickedWidget == prevWidget)
                                                    scope.sketchObject.pickedWidget = null;
                                                prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element, false);
                                            }
                                        }

                                        defer.resolve();
                                    });

                                    return defer.promise;
                                }

                                handler.onceId = options.onceId;

                                var target = angular.isElement(event) && event || event.target,
                                    widget = $(target).data("widgetObject");
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
                                            scope.sketchObject.pickedWidget.addClass("pickedWidget");
                                            widget.resizable && !widget.isTemporary && toggleResize(widget.$element);
                                        }

                                        if (prevWidget) {
                                            if (scope.sketchObject.pickedWidget == prevWidget) {
                                                var resizeToggled = prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element);
                                                if (!resizeToggled) {
                                                    scope.sketchObject.pickedWidget = null;
                                                    prevWidget.removeClass("pickedWidget");
                                                }
                                            } else {
                                                prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element, false);
                                                prevWidget.removeClass("pickedWidget");
                                            }
                                        }

                                        defer.resolve();
                                    });

                                    return defer.promise;
                                }

                                handler.onceId = options.onceId;

                                var target = angular.isElement(event) && event || event.target,
                                    widget = $(target).data("widgetObject");
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

                                        top = Math.ceil(top * angularConstants.precision) / angularConstants.precision;
                                        left = Math.ceil(left * angularConstants.precision) / angularConstants.precision;

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
                                        left = Math.ceil(left * angularConstants.precision) / angularConstants.precision;
                                        top = Math.ceil(top * angularConstants.precision) / angularConstants.precision;
                                        width = Math.ceil(width * angularConstants.precision) / angularConstants.precision;
                                        height = Math.ceil(height * angularConstants.precision) / angularConstants.precision;

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

                                        if (!scope.sketchObject.pickedWidget || scope.sketchObject.pickedWidget.id != widget.id) {
                                            scope.sketchObject.pickedWidget = widget;
                                            scope.sketchObject.pickedWidget.addClass("pickedWidget");
                                            !widget.isTemporary && toggleTextMode(widget.$element);
                                        }

                                        if (prevWidget) {
                                            if (scope.sketchObject.pickedWidget == prevWidget) {
                                                var textModeToggled = !prevWidget.isTemporary && toggleTextMode(prevWidget.$element);
                                                if (!textModeToggled) {
                                                    scope.sketchObject.pickedWidget = null;
                                                    prevWidget.removeClass("pickedWidget");
                                                }
                                            } else {
                                                !prevWidget.isTemporary && toggleTextMode(prevWidget.$element, false);
                                                prevWidget.removeClass("pickedWidget");
                                            }
                                        }

                                        defer.resolve();
                                    });

                                    return defer.promise;
                                }

                                handler.onceId = options.onceId;

                                var target = angular.isElement(event) && event || event.target,
                                    widget = $(target).data("widgetObject");
                                if (widget && widget.isKindOf("ElementSketchWidget")) {
                                    uiUtilService.once(handler, null, 20)(widget);
                                }
                            }

                            function toggleTextMode($el, state) {
                                var $text = $el.prev();

                                if (!$text.hasClass("widgetText")) {
                                    if (state == undefined || state) {
                                        $text = $("<div class='widgetText' contenteditable='true'></div>")
                                            .insertBefore($el);
                                        var left = $el.position().left,
                                            top = $el.position().top,
                                            width = $el.width(),
                                            height = $el.height(),
                                            zIndex = $el.css("z-index") || 0;

                                        if (zIndex === "auto")
                                            zIndex = 0;
                                        left = Math.ceil(left * angularConstants.precision) / angularConstants.precision;
                                        top = Math.ceil(top * angularConstants.precision) / angularConstants.precision;
                                        width = Math.ceil(width * angularConstants.precision) / angularConstants.precision;
                                        height = Math.ceil(height * angularConstants.precision) / angularConstants.precision;

                                        $text.width(width);
                                        $text.height(height);
                                        $text.css("left", left + "px");
                                        $text.css("top", top + "px");
                                        $text.css("z-index", zIndex + 1);

                                        var backgroundColor = $el.css("background-color"),
                                            borderColor = backgroundColor;
                                        if (backgroundColor) {
                                            backgroundColor = uiUtilService.rgbToHex(backgroundColor);
                                            borderColor = uiUtilService.contrastColor(backgroundColor) === "#ffffff" ? uiUtilService.lighterColor(backgroundColor, 0.5) : uiUtilService.lighterColor(backgroundColor, -0.5);
                                        } else {
                                            borderColor = "#000000";
                                        }
                                        $text.css("color", borderColor);

                                        var rmc = new Hammer.Manager($text.get(0));
                                        rmc.add(new Hammer.Tap());
                                        rmc.on("tap", function (event) {
                                            rmc.off("tap");

                                            $timeout(function () {
                                                toggleHandler($(event.target).next());
                                            });
                                        });
                                    }
                                } else {
                                    if (state == undefined || !state)
                                        $text.remove();
                                }

                                return $text.parent().length && $text.hasClass("widgetText");
                            }

                            mc.on("tap", toggleHandler);
                            mc.on("press", toggleTextModeHandler);

                            //Disable resize mode on sketch widget since we can use ruler function instead.
                            //mc.on("press", toggleResizeOnPressHandler);
                        }
                    }

                    function unregisterHandlers(element) {
                        if (mc) {
                            mc.off("tap", toggleHandler);
                            mc.off("press", toggleTextModeHandler);

                            //Disable resize mode on sketch widget since we can use ruler function instead.
                            //mc.off("press", toggleResizeOnPressHandler);

                            element.removeData("hammer");

                            mc = null;
                        }
                    }

                    return {
                        restrict: "A",
                        scope: angular.extend({sketchObject: "=", isPlaying: "="}, boundProperties),
                        replace: false,
                        compile: function (element, attrs) {
                            return {
                                pre: function (scope, element, attrs) {
                                    extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                        element: element,
                                        scope: scope
                                    }));

                                    scope.$root.$broadcast(angularEventTypes.boundPropertiesEvent, uiUtilService.createDirectiveBoundMap(boundProperties, attrs));

                                    options = angular.extend(options, $parse(attrs['uiSketchWidgetOpts'])(scope, {}));

                                    scope.$watch("isPlaying", function (value) {
                                        var widgetObj = element.data("widgetObject");
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