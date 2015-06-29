define(
    ["angular", "jquery", "fabric"],
    function () {
        var SketchCanvas = function ($log, $compile, $parse, $timeout, $q, $exceptionHandler, uiUtilService, angularConstants, angularEventTypes) {
                this.$log = $log;
                this.$compile = $compile;
                this.$parse = $parse;
                this.$timeout = $timeout;
                this.$q = $q;
                this.$exceptionHandler = $exceptionHandler;
                this.uiUtilService = uiUtilService;
                this.angularConstants = angularConstants;
                this.angularEventTypes = angularEventTypes;
            },
            CanvasColor = "rgb(221,125,0)",
            CanvasObject_Origin = 1,
            CanvasObject_Point = 2,
            CanvasObject_LineEnd = 3;

        SketchCanvas.$inject = ["$log", "$compile", "$parse", "$timeout", "$q", "$exceptionHandler", "uiUtilService", "angularConstants", "angularEventTypes"];

        SketchCanvas.prototype.initCanvas = function () {
            var self = this;

            if (!self.canvas) {
                var $deviceHolder = $("." + self.angularConstants.widgetClasses.deviceHolderClass),
                    $canvasContainer = $('#canvasContainer'),
                    scope = angular.element($canvasContainer).scope();

                var paddingLeft = 0, paddingTop = 0, canvasOffset = $deviceHolder.offset(), canvas;

                var m = ($canvasContainer.css("padding-left") || "").match(/([-\d\.]+)px$/);
                if (m && m.length == 2) paddingLeft = Math.floor(parseFloat(m[1]) * self.angularConstants.precision) / self.angularConstants.precision;
                m = ($canvasContainer.css("padding-top") || "").match(/([-\d\.]+)px$/);
                if (m && m.length == 2) paddingTop = Math.floor(parseFloat(m[1]) * self.angularConstants.precision) / self.angularConstants.precision;

                canvasOffset.left -= paddingLeft;
                canvasOffset.top -= paddingTop;

                $canvasContainer.offset(canvasOffset);

                canvas = new fabric.Canvas('sketchCanvas', {
                    width: scope.sketchDevice.width,
                    height: scope.sketchDevice.height
                });

                //Mouse event from canvas should not be propagated outside.
                $canvasContainer.children("div").attr("ng-click", "$event.stopPropagation()");
                self.$compile($canvasContainer)(scope);

                self.setCanvas(canvas);

                self.deregisterOnMarkRoute = scope.$on(
                    self.angularEventTypes.markWidgetRouteEvent,
                    function (event, value) {
                        self.uiUtilService.latestOnce(
                            function (markedIndex) {
                                return self.$timeout(
                                    function () {
                                        self.setMarkedRouteIndex(markedIndex);
                                    }
                                );
                            },
                            null,
                            self.angularConstants.unresponsiveInterval,
                            "SketchCanvas.setWidget.deregisterOnMarkRoute"
                        )(value);
                    }
                );

                scope.$on('$destroy', function () {
                    self.deregisterOnMarkRoute && self.deregisterOnMarkRoute();
                    self.deregisterOnMarkRoute = null;
                });
            }
        }

        SketchCanvas.prototype.setCanvas = function (canvas) {
            var self = this;

            self.canvas && self.canvas.clear();
            self.$menu = $("#canvasPopupMenu");
            self.$sketchCanvas = $('#sketchCanvas');

            self.canvas = canvas;

            if (self.canvas) {
                self.canvas.on("object:selected", function (event) {
                    var p = event.target;

                    if (p.meeletCanvasObject === CanvasObject_Origin || p.meeletCanvasObject === CanvasObject_Point) {
                        self.showMenu(p);
                    }
                });

                self.canvas.on("selection:cleared", function (event) {
                    self.hideMenu();
                });

                self.canvas.on("object:moving", function (event) {
                    var p = event.target;

                    if (p.meeletCanvasObject === CanvasObject_Point) {
                        self.hideMenu();
                        p.meeletCanvasObject = CanvasObject_LineEnd;
                    }
                    if (p.meeletCanvasObject === CanvasObject_LineEnd) {
                        p.lineIn && p.lineIn.set({'x2': p.left, 'y2': p.top});
                        p.lineOut && p.lineOut.set({'x1': p.left, 'y1': p.top});

                        self.canvas.renderAll();
                    }
                });

                self.canvas.on("mouse:up", function (event) {
                    var p = event.target;

                    if (p) {
                        if (p.meeletCanvasObject === CanvasObject_LineEnd) {
                            p.lineIn && p.lineIn.set({'x2': p.left, 'y2': p.top});
                            p.lineOut && p.lineOut.set({'x1': p.left, 'y1': p.top});

                            p.meeletCanvasObject = CanvasObject_Point;

                            self.canvas.renderAll();
                        }
                    }
                });

                self.deregisterOnMarkRoute && self.deregisterOnMarkRoute();
                self.deregisterOnMarkRoute = null;
                delete self.markedRouteIndex;
            }
        }

        SketchCanvas.prototype.getCanvas = function () {
            return this.canvas;
        }

        SketchCanvas.prototype.setWidget = function (widgetObj) {
            var self = this;

            if (self.canvas) {
                if (self.widgetObj != widgetObj) {
                    if (self.widgetObj) {
                        self.canvas.clear();
                    }

                    self.widgetObj = widgetObj;

                    if (self.widgetObj) {
                        var left = 0, top = 0;

                        var m = (self.widgetObj.css("left") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) left = Math.floor(parseFloat(m[1]) * self.angularConstants.precision) / self.angularConstants.precision;
                        m = (self.widgetObj.css("top") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) top = Math.floor(parseFloat(m[1]) * self.angularConstants.precision) / self.angularConstants.precision;

                        var origin = makeOrigin(left, top, self.widgetObj.routes);
                        self.canvas.add(origin);
                        self.widgetObj.routes.forEach(function (coord) {
                            var start = origin;

                            do {
                                var p = makePoint(coord),
                                    line = makeLine([start.left, start.top, p.left, p.top]);

                                if (start.meeletCanvasObject !== CanvasObject_Origin) {
                                    start.lineOut = line;
                                } else {
                                    coord.point = p;
                                }
                                line.start = start, p.lineIn = line, line.end = p;
                                start = p;

                                self.canvas.add(line, p);
                                self.canvas.sendToBack(line);

                                coord = coord.nextStop;
                            } while (coord);
                        });
                    }
                }

                self.canvas.renderAll();
            }
        }

        SketchCanvas.prototype.startLink = function (left, top) {
            var p = this.canvas.getActiveObject();

            if (p) {
                if (p.meeletCanvasObject === CanvasObject_Origin || (p.meeletCanvasObject === CanvasObject_Point && !p.lineOut)) {
                    var nextStop = {left: left, top: top, nextStop: null},
                        end = makePoint(nextStop),
                        line = makeLine([p.left, p.top, end.left, end.top]);

                    end.meeletCanvasObject = CanvasObject_LineEnd;

                    if (p.meeletCanvasObject === CanvasObject_Origin) {
                        p.routes.push(nextStop);
                        nextStop.point = end;
                    } else {
                        if (p.coordinate) {
                            p.coordinate.nextStop = nextStop;
                        }
                        p.lineOut = line;

                        //Copy former line's style
                        p.lineIn && line.set(_.pick(p.lineIn, "strokeDashArray"));
                    }

                    line.start = p, end.lineIn = line, line.end = end;

                    this.canvas.add(line, end);
                    this.canvas.sendToBack(line);

                    this.canvas.renderAll();
                }
            }
        }

        SketchCanvas.prototype.removePoint = function () {
            var p = this.canvas.getActiveObject();

            if (p) {
                if (p.meeletCanvasObject === CanvasObject_Point) {
                    var start, end, routeIndex;

                    if (p.lineIn) {
                        start = p.lineIn.start;
                        if (start.meeletCanvasObject !== CanvasObject_Origin) {
                            start.lineOut = null;
                            if (start.coordinate) {
                                start.coordinate.nextStop = null;
                            }
                        } else {
                            if (p.coordinate && !this.widgetObj.routes.every(function (coord, i) {
                                    if (coord === p.coordinate) {
                                        routeIndex = i;
                                        return false;
                                    }

                                    return true;
                                })) {
                                this.widgetObj.routes.splice(routeIndex, 1);
                            }
                        }

                        this.canvas.remove(p.lineIn);
                    }

                    if (p.lineOut) {
                        end = p.lineOut.end;
                        end.lineIn = null;

                        this.canvas.remove(p.lineOut);
                    }

                    if (start && end) {
                        var line = makeLine([start.left, start.top, end.left, end.top]);

                        if (start.meeletCanvasObject !== CanvasObject_Origin) {
                            start.lineOut = line;
                            if (start.coordinate) {
                                start.coordinate.nextStop = end.coordinate;
                            }
                        } else {
                            if (end.coordinate && routeIndex != null) {
                                end.coordinate.point = end;
                                this.widgetObj.routes.splice(routeIndex, 0, end.coordinate);
                            }
                        }

                        line.start = start, end.lineIn = line, line.end = end;
                        this.canvas.add(line);
                        this.canvas.sendToBack(line);
                    }

                    this.canvas.remove(p);
                    this.canvas.renderAll();
                }
            }
        }

        SketchCanvas.prototype.showMenu = function (p) {
            var self = this;

            if (self.$sketchCanvas && self.$menu) {
                var offset = self.$sketchCanvas.offset();
                self.$menu.offset(
                    {
                        left: offset.left + p.left + (p.radius + p.strokeWidth),
                        top: offset.top + p.top - (p.radius + p.strokeWidth)
                    }
                );

                self.$menu.addClass("show");
            }
        }

        SketchCanvas.prototype.hideMenu = function () {
            if (this.$menu) {
                this.$menu.removeClass("show");
            }
        }

        SketchCanvas.prototype.setMarkedRouteIndex = function (markedIndex) {
            if (this.markedRouteIndex != null) {
                if (this.markedRouteIndex < this.widgetObj.routes.length) {
                    makeDashedLine(this.widgetObj.routes[this.markedRouteIndex], null);
                }

                this.markedRouteIndex = null;
            }

            if (this.widgetObj && markedIndex < this.widgetObj.routes.length) {
                this.markedRouteIndex = markedIndex;
                makeDashedLine(this.widgetObj.routes[this.markedRouteIndex], [5, 5]);
            }

            this.canvas.renderAll();
        }

        function makeDashedLine(coord, dashArray) {
            var p = coord.point,
                line = p && p.lineIn;

            while (line) {
                line.set({strokeDashArray: dashArray});
                line = p.lineOut;
                p = line && line.end;
            }
        }

        function makePoint(left, top) {
            var coordinate;
            if (typeof left === "object") {
                coordinate = left;
            }
            if (coordinate) {
                left = coordinate.left;
                top = coordinate.top;
            }

            var point = new fabric.Circle({
                originX: "center",
                originY: "center",
                left: left,
                top: top,
                strokeWidth: 5,
                radius: 12,
                fill: '#fff',
                stroke: CanvasColor,
                hasControls: false,
                hasBorders: false
            });
            point.meeletCanvasObject = CanvasObject_Point;
            point.coordinate = coordinate;
            point.lineIn = null;
            point.lineOut = null;

            return point;
        }

        function makeOrigin(left, top, routes) {
            var point = makePoint(left, top);
            point.meeletCanvasObject = CanvasObject_Origin;
            point.lineOut = [];
            point.routes = routes || [];
            point.set({
                evented: false
            });

            return point;
        }

        function makeLine(coords) {
            return new fabric.Line(coords, {
                originX: "center",
                originY: "center",
                fill: CanvasColor,
                stroke: CanvasColor,
                strokeWidth: 5,
                selectable: false
            });
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('uiCanvasService', SketchCanvas);
                }]);
        };
    }
);