define(
    ["angular", "jquery", "fabric"],
    function () {
        var SketchCanvas = function ($log, $parse, $timeout, $q, $exceptionHandler, angularConstants) {
                this.$log = $log;
                this.$parse = $parse;
                this.$timeout = $timeout;
                this.$q = $q;
                this.$exceptionHandler = $exceptionHandler;
                this.angularConstants = angularConstants;
            },
            CanvasColor = "rgb(221,125,0)",
            CanvasObject_Origin = 1,
            CanvasObject_Point = 2,
            CanvasObject_LineEnd = 3;

        SketchCanvas.$inject = ["$log", "$parse", "$timeout", "$q", "$exceptionHandler", "angularConstants"];

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
                    } else {
                        if (p.coordinate) {
                            p.coordinate.nextStop = nextStop;
                        }
                        p.lineOut = line;
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