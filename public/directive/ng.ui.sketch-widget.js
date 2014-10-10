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

            var boundProperties = {pickedWidget: "="},
                defaults = {
                    widgetClass: "sketchWidget",
                    onceId: "sketch-widget.handler",
                    draggableOnceId: "draggable.dragHandler.handler"
                },
                options = angular.extend(defaults, opts),
                inject = ['$parse', '$timeout', "$q", "$compile", "$log", "angularEventTypes", "uiUtilService", "uiService"];

            appModule.directive(
                DIRECTIVE,
                _.union(inject, [function ($parse, $timeout, $q, $compile, $log, angularEventTypes, uiUtilService, uiService) {
                    var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                    return {
                        restrict: "A",
                        scope: angular.extend({dockAlign: "="}, boundProperties),
                        replace: false,
                        compile: function (element, attrs) {
                            return {
                                pre: function (scope, element, attrs) {
                                    scope.$root.$broadcast(angularEventTypes.boundPropertiesEvent, uiUtilService.createDirectiveBoundMap(boundProperties, attrs));

                                    extension && extension.attach && extension.attach(scope, _.extend(injectObj, {element: element, scope: scope}));

                                    options = angular.extend(options, $parse(attrs['uiSketchWidgetOpts'])(scope, {}));
                                },
                                post: function (scope, element, attrs) {
                                    var mc, resizeHandler, toggleHandler, toggleResizeOnPressHandler;

                                    attrs.$observe(DIRECTIVE, function (value) {
                                        mc = new Hammer.Manager(element[0]);
                                        mc.add(new Hammer.Press());
                                        mc.add(new Hammer.Tap());
                                        $(element).data("hammer", mc);

                                        toggleResizeOnPressHandler = function (event) {
                                            function handler(widget) {
                                                var defer = $q.defer();

                                                $timeout(function () {
                                                    var prevWidget = scope.pickedWidget;

                                                    if (!scope.pickedWidget || scope.pickedWidget.id != widget.id) {
                                                        scope.pickedWidget = widget;
                                                        scope.pickedWidget.addClass("pickedWidget");
                                                        widget.resizable && !widget.isTemporary && toggleResize(widget.$element);
                                                    }

                                                    if (prevWidget) {
                                                        if (scope.pickedWidget == prevWidget) {
                                                            var resizeToggled = prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element);
                                                            if (!resizeToggled) {
                                                                scope.pickedWidget = null;
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

                                                    top = Math.ceil(top * 100) / 100;
                                                    left = Math.ceil(left * 100) / 100;

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
                                                        w = Math.floor(w * 100) / 100, h = Math.floor(h * 100) / 100;

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
                                                    left = Math.ceil(left * 100) / 100;
                                                    top = Math.ceil(top * 100) / 100;
                                                    width = Math.ceil(width * 100) / 100;
                                                    height = Math.ceil(height * 100) / 100;

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

                                        toggleHandler = function (event) {
                                            function handler(widget, shiftPressed) {
                                                var defer = $q.defer();

                                                $timeout(function () {
                                                    var prevWidget = scope.pickedWidget;

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
                                                                                    scope.pickedWidget = null;
                                                                                }
                                                                            } else {
                                                                                prevWidget.append(widget);
                                                                            }
                                                                        } else {
                                                                            prevWidget.removeClass("pickedWidget");
                                                                            prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element, false);
                                                                            scope.pickedWidget = null;
                                                                        }
                                                                    } else {
                                                                        prevWidget.removeClass("pickedWidget");
                                                                        prevWidget.resizable && !prevWidget.isTemporary && toggleResize(prevWidget.$element, false);

                                                                        if (!prevWidget.directContains(widget)) {
                                                                            if (prevWidget.id != widget.id) {
                                                                                if (widget.isTemporary) {
                                                                                    widget.append(prevWidget);
                                                                                    scope.pickedWidget = widget;
                                                                                } else {
                                                                                    var composite = uiService.createComposite([prevWidget, widget]);
                                                                                    composite.addClass(options.widgetClass);
                                                                                    composite.setTemporary(true);
                                                                                    scope.pickedWidget = composite;
                                                                                }
                                                                                scope.pickedWidget.addClass("pickedWidget");
                                                                            } else {
                                                                                scope.pickedWidget = null;
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            } else {
                                                                scope.pickedWidget = widget;
                                                                scope.pickedWidget.addClass("pickedWidget");
                                                            }
                                                        }
                                                    } else {
                                                        if (!scope.pickedWidget || scope.pickedWidget.id != widget.id) {
                                                            scope.pickedWidget = widget;
                                                            scope.pickedWidget.addClass("pickedWidget");
                                                        }

                                                        if (prevWidget) {
                                                            prevWidget.removeClass("pickedWidget");
                                                            if (scope.pickedWidget == prevWidget)
                                                                scope.pickedWidget = null;
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

                                        mc.on("tap", toggleHandler);
                                        mc.on("press", toggleResizeOnPressHandler);
                                    });

                                    scope.$on('$destroy', function () {
                                        $(element).removeData("hammer");

                                        mc.off("tap", toggleHandler);
                                        mc.off("press", toggleResizeOnPressHandler);
                                    });
                                }
                            };
                        }
                    };
                }]));
        }
    }
);