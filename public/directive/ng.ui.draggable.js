define(
    ["angular", "jquery", "hammer"],
    function () {
        return function (appModule, extension, opts) {
            var DIRECTIVE = "uiDraggable";
            var VERBOSE = true;

            var DIRECTION_NONE = 1;
            var DIRECTION_LEFT = 2;
            var DIRECTION_RIGHT = 4;
            var DIRECTION_UP = 8;
            var DIRECTION_DOWN = 16;

            var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
            var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
            var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

            var directionOpt = {'horizontal': DIRECTION_HORIZONTAL, 'vertical': DIRECTION_VERTICAL, 'all': DIRECTION_ALL},
                defaults = {
                    onceId: "draggable.dragHandler.handler"
                },
                options = angular.extend(defaults, opts);

            appModule.directive(
                DIRECTIVE,
                ['$parse', '$log', '$timeout', '$q', 'uiUtilService', function ($parse, $log, $timeout, $q, uiUtilService) {
                    return function (scope, element, attr) {
                        var mc, dragHandler;

                        attr.$observe(DIRECTIVE, function (value) {
                            var fn = $parse(value),
                                opts = $parse(attr[DIRECTIVE + 'Opts'])(scope, {});

                            opts.direction = directionOpt[opts.direction || 'all'] || DIRECTION_ALL;
                            mc = new Hammer.Manager(element[0]);
                            mc.add(new Hammer.Pan(_.extend({}, opts)));
                            dragHandler = function (event) {
                                function handler(event) {
                                    var defer = $q.defer();

                                    $timeout(function () {
                                        if (VERBOSE) {
                                            $log.debug(event.type);
                                        }

                                        if (!event.currentTarget)
                                            event.currentTarget = element[0];

                                        var $u = $(element[0]),
                                            touchX = $u.data("touchX"),
                                            touchY = $u.data("touchY");

                                        if (event.type === "panstart") {
                                            touchX = event.srcEvent.pageX - $u.parent().offset().left;
                                            touchY = event.srcEvent.pageY - $u.parent().offset().top;
                                            $u.data("touchX", touchX);
                                            $u.data("touchY", touchY);
                                        } else if (event.type === "panmove" || event.type === "panend") {
                                            if (touchX != undefined && touchY != undefined) {
                                                if (opts.direction & DIRECTION_VERTICAL) {
                                                    var moveY = event.srcEvent.pageY - ($u.parent().offset().top + touchY),
                                                        maxHeight = $u.parent().height(),
                                                        height = $u.height(),
                                                        ftTop = $u.offset().top - $u.parent().offset().top,
                                                        top = Math.floor((ftTop + moveY) * 100) / 100;

                                                    if (top + height / 2 < 0)
                                                        top = -height / 2;
                                                    else if (top + height / 2 > maxHeight)
                                                        top = maxHeight - height / 2;

                                                    touchY += moveY;
                                                    event.moveY = top - ftTop;
                                                    $u.css("top", top);
                                                }

                                                if (opts.direction & DIRECTION_HORIZONTAL) {
                                                    var moveX = event.srcEvent.pageX - ($u.parent().offset().left + touchX),
                                                        maxWidth = $u.parent().width(),
                                                        width = $u.width(),
                                                        ftLeft = $u.offset().left - $u.parent().offset().left,
                                                        left = Math.floor((ftLeft + moveX) * 100) / 100;

                                                    if (left + width / 2 < 0)
                                                        left = -width / 2;
                                                    else if (left + width / 2 > maxWidth)
                                                        left = maxWidth - width / 2;

                                                    touchX += moveX;
                                                    event.moveX = left - ftLeft;
                                                    $u.css("left", left);
                                                }

                                                $u.data("touchX", touchX);
                                                $u.data("touchY", touchY);
                                            }

                                            if (event.type === "panend") {
                                                $u.removeData("touchX");
                                                $u.removeData("touchY");
                                            }
                                        }

                                        touchX != undefined && touchY != undefined && fn(scope, { $event: event });

                                        defer.resolve();
                                    });

                                    return defer.promise;
                                }

                                handler.onceId = options.onceId;

                                uiUtilService.once(handler, null, 20)(event);
                            };

                            mc.on("panstart panmove panend", dragHandler);
                        });
                        scope.$on('$destroy', function () {
                            mc.off("panstart panmove panend", dragHandler);
                        });
                    };
                }]);
        }
    }
);