define(
    ["angular", "jquery", "underscore", "ng.ui.util"],
    function () {
        var Service = function ($timeout, $q, $compile, uiUtilService) {
            this.$timeout = $timeout;
            this.$q = $q;
            this.$compile = $compile;
            this.uiUtilService = uiUtilService;
        };

        Service.$inject = ["$timeout", "$q", "$compile", "uiUtilService"];

        //Define sketch widget class
        var Class = function () {
                var len = arguments.length;
                var P = arguments[0];
                var F = arguments[len - 1];

                var C = typeof F.initialize == "function" ?
                    F.initialize :
                    function () {
                        P.prototype.initialize.apply(this, arguments);
                    };

                if (len > 1) {
                    var newArgs = [].concat(
                        Array.prototype.slice.call(arguments).slice(1, len - 1), F);

                    var OF = function () {
                    };
                    OF.prototype = P.prototype;
                    C.prototype = new OF;

                    newArgs.forEach(function (o) {
                        if (typeof o === "function") {
                            o = o.prototype;
                        }
                        _.extend(C.prototype, o);
                    });
                } else {
                    C.prototype = F;
                }
                return C;
            },
            BaseSketchWidgetClass = Class({
                    CLASS_NAME: "BaseSketchWidget",
                    STYLE_DEFAULTS: {},
                    MEMBERS: {
                        id: "",
                        name: "NO NAME",
                        childWidgets: [],
                        style: {},
                        attr: {},
                        classList: [],
                        $element: null,
                        resizable: true
                    },
                    initialize: function (id) {
                        for (var member in this.MEMBERS)
                            this[member] = _.clone(this.MEMBERS[member]);
                        this.id = id || ("" + new Date().getTime());
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return BaseSketchWidgetClass.prototype.CLASS_NAME == className;
                    },
                    clone: function () {
                        var self = this,
                            cloneObj = new self.initialize(),
                            cloneMembers = _.difference(_.keys(self.MEMBERS), ["id", "childWidgets", "style", "$element"]);

                        cloneMembers.forEach(function (member) {
                            cloneObj[member] = _.clone(self[member]);
                        });

                        //style may contains property with array value
                        for (var styleName in self.style) {
                            cloneObj.style[styleName] = _.clone(self.style[styleName]);
                        }

                        self.childWidgets.forEach(function (obj) {
                            cloneObj.childWidgets.push(obj.clone());
                        });

                        return cloneObj;
                    },
                    append: function (childWidget) {
                        var self = this;

                        if (childWidget && childWidget.isKindOf && childWidget.isKindOf("BaseSketchWidget")) {
                            var notFound = self.childWidgets.every(function (obj) {
                                return obj.id != childWidget.id;
                            });

                            notFound && self.childWidgets.push(childWidget);

                            if (self.$element) {
                                if (childWidget.$element) {
                                    self.$element.append(childWidget.$element);
                                } else {
                                    childWidget.draw(self.$element);
                                }
                            }
                        }

                        return self;
                    },
                    remove: function () {
                        var self = this;

                        if (self.$element) {
                            var $parent = self.$element.parent();

                            if ($parent.length) {
                                var parentWidgetObj = $parent.data("widgetObject");

                                if (parentWidgetObj) {
                                    var wIndex;
                                    parentWidgetObj.childWidgets.every(function (obj, index) {
                                        if (obj.id == self.id) {
                                            wIndex = index;
                                            return false;
                                        }

                                        return true;
                                    });

                                    wIndex != undefined && parentWidgetObj.childWidgets.splice(wIndex, 1);
                                }

                                self.$element.remove();

                            }
                            self.$element = null;
                        }
                    },
                    draw: function (container) {
                        if (container) {
                            var self = this;

                            self.$element = self.$element || $("<div />").data("widgetObject", self).attr("id", self.id);
                            self.$element.attr(self.attr);
                            self.$element.addClass(self.classList.join(" "));
                            self.css(_.extend(_.clone(self.STYLE_DEFAULTS), self.style));

                            self.childWidgets.forEach(function (child) {
                                child.draw(self.$element);
                            });

                            container = (typeof container == "string" || angular.isElement(container) && $(container)) || container;
                            var widgetObj = container.data("widgetObject");

                            if (widgetObj && widgetObj.isKindOf && widgetObj.isKindOf("BaseSketchWidget")) {
                                widgetObj.append(self);
                            } else {
                                container.append(self.$element);
                            }
                        }

                        return self;
                    },
                    addClass: function (classes) {
                        var self = this;

                        if (classes) {
                            var classList = _.difference(_.uniq(classes.split(" ")), self.classList);

                            if (classList.length) {
                                self.classList = _.union(self.classList, classList);

                                if (self.$element) {
                                    self.$element.addClass(classList.join(" "));
                                }
                            }
                        }

                        return self;
                    },
                    removeClass: function (classes) {
                        var self = this;

                        if (classes) {
                            var classList = _.uniq(classes.split(" "));

                            if (classList.length) {
                                self.classList = _.difference(self.classList, _.uniq(classes.split(" ")));

                                if (self.$element) {
                                    self.$element.removeClass(classes);
                                }
                            }
                        }

                        return self;
                    },
                    hasClass: function (clazz) {
                        return !self.classList.every(function (c) {
                            return c != clazz;
                        });
                    },
                    css: function () {
                        var self = this,
                            args = Array.prototype.slice.call(arguments),
                            ret = null;

                        switch (args.length) {
                            case 1 :
                                if (typeof args[0] === "string")
                                    ret = self.style[args[0]];
                                else if (typeof args[0] === "object") {
                                    _.extend(self.style, args[0]);
                                    if (self.$element) {
                                        for (var key in args[0]) {
                                            self.css(key, args[0][key]);
                                        }
                                    }
                                }
                                break;
                            case 2 :
                                if (typeof args[0] === "string") {
                                    if (args[1]) {
                                        self.style[args[0]] = args[1];
                                    } else {
                                        delete self.style[args[0]];
                                    }
                                    if (self.$element) {
                                        if (toString.call(args[1]) === '[object Array]') {
                                            args[1].forEach(function (styleValue) {
                                                self.$element.css(args[0], styleValue);
                                            });
                                        } else {
                                            self.$element.css(args[0], args[1]);
                                        }
                                    }
                                    ret = self;
                                }
                                break;

                            default:
                                break;
                        }

                        return ret;
                    },
                    showHide: function (state) {
                        this.$element && this.$element.toggle(state);

                        return state;
                    },
                    setColor: function (value) {
                        value && this.css("color", value) || this.css("color", "");
                    },
                    getColor: function () {
                        return this.css("color");
                    },
                    setBorderColor: function (value) {
                        value && this.css("border-color", value) || this.css("border-color", "");
                    },
                    getBorderColor: function () {
                        return this.css("border-color");
                    },
                    setLinearGradientColor: function (value) {
                        var self = this;

                        if (value && value.colorStopList) {
                            if (value.colorStopList.length > 1) {
                                var x1, y1, x2, y2;
                                if (value.angle == 90) {
                                    x1 = 50;
                                    y1 = 100;
                                    x2 = 50;
                                    y2 = 0;
                                } else if (value.angle == 270) {
                                    x1 = 50;
                                    y1 = 0;
                                    x2 = 50;
                                    y2 = 100;
                                } else {
                                    var tan = Math.tan(value.angle);
                                    if (value.angle <= 45) {
                                        x1 = 0;
                                        y1 = 50 * ( 1 + tan);
                                        x2 = 100;
                                        y2 = 50 * (1 - tan);
                                    } else if (value.angle <= 135) {
                                        y1 = 100;
                                        x1 = 50 * (1 - 1 / tan);
                                        y2 = 0;
                                        x2 = 50 * (1 + 1 / tan);
                                    } else if (value.angle <= 225) {
                                        x1 = 100;
                                        y1 = 50 * (1 - tan);
                                        x2 = 0;
                                        y1 = 50 * (1 + tan);
                                    } else if (value.angle <= 315) {
                                        y1 = 0;
                                        x1 = 50 * (1 + 1 / tan);
                                        y2 = 100;
                                        x2 = 50 * (1 - 1 / tan);
                                    } else {
                                        x1 = 0;
                                        y1 = 50 + 50 * tan;
                                        x2 = 100;
                                        y2 = 50 - 50 * tan;
                                    }
                                    x1 = Math.ceil(x1);
                                    y1 = Math.ceil(y1);
                                    x2 = Math.ceil(x2);
                                    y2 = Math.ceil(y2);
                                }

                                var webkitStops = [], stops = [];
                                value.colorStopList.forEach(function (colorStop) {
                                    webkitStops.push("color-stop({1}%, {0})".format(colorStop.color, colorStop.percent));
                                    stops.push("{0} {1}%".format(colorStop.color, colorStop.percent));
                                });

                                var styles = [];
                                styles.push("-webkit-gradient(linear, {0}% {1}%, {2}% {3}%, {4})".format(x1, y1, x2, y2, webkitStops.join(",")));
                                self.uiUtilService.prefixedStyleValue("{0}linear-gradient({1}deg, {2})", value.angle, stops.join(",")).forEach(
                                    function (gradientStyleValue) {
                                        styles.push(gradientStyleValue);
                                    }
                                );
                                self.css("background", styles);
                            } else if (value.colorStopList.length == 1) {
                                var color = value.colorStopList[0].color;
                                color && self.css("background", color);
                            }
                        } else {
                            self.css("background", "");
                        }
                    },
                    getLinearGradientColor: function () {
                        var self = this,
                            value = self.css("background"),
                            colorObj = null;

                        if (toString.call(value) === '[object Array]') {
                            value.every(function (styleValue) {
                                var m = styleValue.match(/linear-gradient\((.+)\)/);
                                if (m && m.length == 2) {
                                    var n = m[1].match(/(\d)deg,(.+)$/);
                                    if (n && n.length == 3) {
                                        var angle = parseInt(n[1]),
                                            stops = n[2].split(","),
                                            colorStopList = [];

                                        stops.forEach(function (stopValue) {
                                            var s = stopValue.match(/(#\w+) (\d+)%/);
                                            if (s && s.length == 3) {
                                                var color = s[1];
                                                colorStopList.push({percent: parseInt(s[2]), color: color, backgroundColor: self.uiUtilService.contrastColor(color) === "#ffffff" ? self.uiUtilService.lighterColor(color, 0.5) : self.uiUtilService.lighterColor(color, -0.5)});
                                            }
                                        });

                                        if (colorStopList.length) {
                                            for (var i = 1; i < colorStopList.length - 1; i++) {
                                                colorStopList[i].minPercent = colorStopList[i - 1].percent + 1;
                                                colorStopList[i].maxPercent = colorStopList[i + 1].percent - 1;
                                            }
                                            colorStopList[0].minPercent = 0;
                                            colorStopList[colorStopList.length - 1].maxPercent = 100;
                                            if (colorStopList.length > 1) {
                                                colorStopList[0].maxPercent = colorStopList[1].percent - 1;
                                                colorStopList[colorStopList.length - 1].minPercent = colorStopList[colorStopList.length - 2].percent + 1;
                                            }

                                            colorObj = {angle: angle, colorStopList: colorStopList};
                                        }
                                    }
                                }

                                return !colorObj;
                            });
                        } else if (typeof value === "string") {
                            colorObj = {
                                angle: 0,
                                colorStopList: [
                                    {percent: 0, color: value, minPercent: 0, maxPercent: 100, backgroundColor: self.uiUtilService.contrastColor(value) === "#ffffff" ? self.uiUtilService.lighterColor(value, 0.5) : self.uiUtilService.lighterColor(value, -0.5)}
                                ]
                            };
                        }

                        return colorObj;
                    },
                    setShape: function () {
                    },
                    getShape: function () {

                    }
                }
            ),
            ElementSketchWidgetClass = Class(BaseSketchWidgetClass, {
                CLASS_NAME: "ElementSketchWidget",
                STYLE_DEFAULTS: {"width": "100px", "height": "100px", "color": "#000000", "border-color": "#000000", "background": "#ffffff", "border-width": "1px", "border-style": "solid"},
                initialize: function () {
                    this.initialize.prototype.__proto__.initialize.apply(this);
                    this.isElement = true;
                    this.isTemporary = false;

                    if (arguments.length >= 1) {
                        var self = this,
                            widgetsArr = arguments[0];

                        if (toString.apply(widgetsArr) == "[object Array]" && widgetsArr.length) {
                            widgetsArr.forEach(function (childWidget) {
                                self.append(childWidget);
                            });
                        }
                    }
                },
                isKindOf: function (className) {
                    var self = this;

                    return ElementSketchWidgetClass.prototype.CLASS_NAME == className || self.initialize.prototype.__proto__.isKindOf.apply(self, [className]);
                },
                draw: function (container) {
                    var self = this;

                    if (container) {
                        var $container = (typeof container == "string" || angular.isElement(container) && $(container)) || container,
                            containerLeft = $container.offset().left,
                            containerTop = $container.offset().top;

                        containerLeft = Math.floor(containerLeft * 100) / 100, containerTop = Math.floor(containerTop * 100) / 100;

                        self.offsetLeft != undefined && self.css("left", (self.offsetLeft - containerLeft) + "px") && delete self.offsetLeft;
                        self.offsetTop != undefined && self.css("top", (self.offsetTop - containerTop) + "px") && delete self.offsetTop;

                        self.initialize.prototype.__proto__.draw.apply(self, [container]);
                    }
                },
                append: function (childWidget) {
                    var self = this;

                    if (childWidget.$element && childWidget.$element.parent().length) {
                        var childLeft = childWidget.$element.offset().left,
                            childTop = childWidget.$element.offset().top,
                            childWidth = childWidget.$element.width(),
                            childHeight = childWidget.$element.height(),
                            left,
                            top,
                            offsetLeft,
                            offsetTop,
                            width,
                            height;

                        childLeft = Math.floor(childLeft * 100) / 100, childTop = Math.floor(childTop * 100) / 100, childWidth = Math.floor(childWidth * 100) / 100, childHeight = Math.floor(childHeight * 100) / 100;

                        childWidget.remove();

                        if (self.$element && self.$element.parent().length) {
                            left = offsetLeft = self.$element.offset().left, top = offsetTop = self.$element.offset().top, width = self.$element.width(), height = self.$element.height();
                        } else {
                            left = self.offsetLeft, top = self.offsetTop;

                            var m = (self.css("width") || "").match(/([\d\.]+)px$/);
                            if (m && m.length == 2) width = Math.floor(parseFloat(m[1]) * 100) / 100;
                            m = (self.css("height") || "").match(/([\d\.]+)px$/);
                            if (m && m.length == 2) height = Math.floor(parseFloat(m[1]) * 100) / 100;

                            if (left == undefined || top == undefined || width == undefined || height == undefined) {
                                left = childLeft, top = childTop, width = childWidth, height = childHeight;
                            }
                        }

                        if (childLeft < left) {
                            width += (left - childLeft);
                            left = childLeft;
                        }
                        if (childTop < top) {
                            height += (top - childTop);
                            top = childTop;
                        }
                        if (childLeft + childWidth > left + width) {
                            width = childLeft + childWidth - left;
                        }
                        if (childTop + childHeight > top + height) {
                            height = childTop + childHeight - top;
                        }

                        if ((self.offsetLeft != undefined && self.offsetLeft != left) || (offsetLeft != undefined && offsetLeft != left)) {
                            if (offsetLeft == undefined) {
                                offsetLeft = self.offsetLeft;
                            } else {
                                m = (self.css("left") || "").match(/([\d\.]+)px$/);
                                if (m && m.length == 2) {
                                    self.css("left", (Math.floor(parseFloat(m[1]) * 100) / 100 + left - offsetLeft) + "px");
                                }
                            }
                            self.childWidgets.forEach(function (w) {
                                var cm = (w.css("left") || "").match(/([\d\.]+)px$/),
                                    cLeft = parseFloat(cm[1]);
                                w.css("left", (cLeft - (left - offsetLeft) + "px"));
                            });
                        }
                        if ((self.offsetTop != undefined && self.offsetTop != top) || (offsetTop != undefined && offsetTop != top)) {
                            if (offsetTop == undefined) {
                                offsetTop = self.offsetTop;
                            } else {
                                m = (self.css("top") || "").match(/([\d\.]+)px$/);
                                if (m && m.length == 2) {
                                    self.css("top", (Math.floor(parseFloat(m[1]) * 100) / 100 + top - offsetTop) + "px");
                                }
                            }
                            self.childWidgets.forEach(function (w) {
                                var cm = (w.css("top") || "").match(/([\d\.]+)px$/),
                                    cTop = parseFloat(cm[1]);
                                w.css("top", (cTop - (top - offsetTop) + "px"));
                            });
                        }

                        if (!self.$element || !self.$element.parent().length) {
                            self.offsetLeft = left;
                            self.offsetTop = top;
                        }

                        self.css("width", width + "px");
                        self.css("height", height + "px");

                        childLeft -= left;
                        childTop -= top;
                        childWidget.css("left", childLeft + "px");
                        childWidget.css("top", childTop + "px");
                    }

                    self.initialize.prototype.__proto__.append.apply(self, [childWidget]);
                },
                levelUp: function (widgetObj, doCompile, waiveDisassemble) {
                    var self = this;

                    if (self.$element && self.$element.parent().length) {
                        var $parent = self.$element.parent(),
                            left = self.$element.offset().left,
                            top = self.$element.offset().top,
                            width = self.$element.width(),
                            height = self.$element.height(),
                            parentLeft = $parent.offset().left,
                            parentTop = $parent.offset().top,
                            wChildLeft = 0,
                            wChildTop = 0,
                            minChildLeft = 0,
                            minChildTop = 0,
                            maxChildRight = 0,
                            maxChildBottom = 0,
                            wIndex;

                        left = Math.floor(left * 100) / 100, top = Math.floor(top * 100) / 100, parentLeft = Math.floor(parentLeft * 100) / 100, parentTop = Math.floor(parentTop * 100) / 100, width = Math.floor(width * 100) / 100, height = Math.floor(height * 100) / 100;

                        self.childWidgets.forEach(function (childWidget, index) {
                            var childLeft = 0, childTop = 0, childWidth = 0, childHeight = 0;

                            var m = childWidget.css("left").match(/([\d\.]+)px$/);
                            if (m && m.length == 2) childLeft = Math.floor(parseFloat(m[1]) * 100) / 100;
                            m = childWidget.css("top").match(/([\d\.]+)px$/);
                            if (m && m.length == 2) childTop = Math.floor(parseFloat(m[1]) * 100) / 100;
                            m = childWidget.css("width").match(/([\d\.]+)px$/);
                            if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;
                            m = childWidget.css("height").match(/([\d\.]+)px$/);
                            if (m && m.length == 2) childHeight = Math.floor(parseFloat(m[1]) * 100) / 100;

                            if (childWidget.id == widgetObj.id) {
                                wChildLeft = (left - parentLeft) + childLeft;
                                wChildTop = (top - parentTop) + childTop;
                                wIndex = index;
                            } else {
                                if (childLeft < minChildLeft) minChildLeft = childLeft;
                                if (childTop < minChildTop) minChildTop = childTop;
                                if (childLeft + childWidth > maxChildRight) maxChildRight = childLeft + childWidth;
                                if (childTop + childHeight > maxChildBottom) maxChildBottom = childTop + childHeight;
                            }
                        });

                        if (wIndex != undefined) {
                            widgetObj = self.childWidgets[wIndex];
                            widgetObj.remove();

                            widgetObj.css("left", wChildLeft + "px");
                            widgetObj.css("top", wChildTop + "px");
                            widgetObj.draw(self.$element.parent());

                            if (doCompile) {
                                var scope = angular.element(self.$element.parent()).scope();
                                self.$compile(self.$element.parent())(scope);
                            }

                            if (self.childWidgets.length == 1) {
                                !waiveDisassemble && self.disassemble();
                            } else {
                                left += minChildLeft, top += minChildTop, width = (maxChildRight - minChildLeft), height = (maxChildBottom - minChildTop);

                                self.css("left", (left - parentLeft) + "px");
                                self.css("top", (top - parentTop) + "px");
                                self.css("width", width + "px");
                                self.css("height", height + "px");
                            }
                        }
                    }
                },
                disassemble: function () {
                    var self = this;

                    if (self.$element && self.$element.parent().length && self.childWidgets.length) {
                        for (;self.childWidgets.length;) {
                            var childWidget = self.childWidgets[0];
                            self.levelUp(childWidget, false, true);
                        }

                        var $parent = self.$element.parent();

                        self.remove();

                        var scope = angular.element($parent).scope();
                        self.$compile($parent)(scope);
                    }
                },
                directContains: function (widgetObj) {
                    return !this.childWidgets.every(function (w) {
                        return w.id != widgetObj.id;
                    });
                },
                alignLeft: function () {
                    var self = this;

                    if (self.$element && self.$element.parent().length) {
                        var maxChildWidth = 0,
                            m = (self.css("left") || "").match(/([\d\.]+)px$/),
                            firstChildLeft,
                            left;
                        if (m && m.length == 2) left = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.childWidgets[0].css("left") || "").match(/([\d\.]+)px$/);
                        if (m && m.length == 2) firstChildLeft = Math.floor(parseFloat(m[1]) * 100) / 100;

                        if (firstChildLeft != undefined) {
                            self.childWidgets.forEach(function (w) {
                                var childWidth,
                                    m = (w.css("width") || "").match(/([\d\.]+)px$/);
                                if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;
                                if (childWidth > maxChildWidth) maxChildWidth = childWidth;

                                w.css("left", "0px");
                            });

                            if (maxChildWidth) {
                                self.css("left", (left + firstChildLeft) + "px");
                                self.css("width", maxChildWidth + "px");
                            }
                        }
                    }
                },
                alignCenter: function () {
                    var self = this;

                    if (self.$element && self.$element.parent().length) {
                        var width,
                            maxChildWidth = 0,
                            m = (self.css("left") || "").match(/([\d\.]+)px$/),
                            firstChildLeft,
                            firstChildWidth,
                            left;
                        if (m && m.length == 2) left = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.css("width") || "").match(/([\d\.]+)px$/);
                        if (m && m.length == 2) width = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.childWidgets[0].css("left") || "").match(/([\d\.]+)px$/);
                        if (m && m.length == 2) firstChildLeft = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.childWidgets[0].css("width") || "").match(/([\d\.]+)px$/);
                        if (m && m.length == 2) firstChildWidth = Math.floor(parseFloat(m[1]) * 100) / 100;

                        if (firstChildLeft != undefined && firstChildWidth) {
                            self.childWidgets.forEach(function (w) {
                                var childWidth,
                                    m = (w.css("width") || "").match(/([\d\.]+)px$/);
                                if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;
                                if (childWidth > maxChildWidth) maxChildWidth = childWidth;
                            });

                            if (maxChildWidth) {
                                self.css("left", (left + firstChildLeft) + "px");
                                self.css("width", maxChildWidth + "px");

                                self.childWidgets.forEach(function (w) {
                                    var childWidth,
                                        m = (w.css("width") || "").match(/([\d\.]+)px$/);
                                    if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;

                                    if (childWidth) {
                                        w.css("left", ((maxChildWidth - childWidth) / 2) + "px");
                                    }
                                });
                            }
                        }
                    }
                },
                alignRight: function () {
                    var self = this;

                    if (self.$element && self.$element.parent().length) {
                        var width,
                            maxChildWidth = 0,
                            m = (self.css("left") || "").match(/([\d\.]+)px$/),
                            firstChildLeft,
                            firstChildWidth,
                            left;
                        if (m && m.length == 2) left = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.css("width") || "").match(/([\d\.]+)px$/);
                        if (m && m.length == 2) width = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.childWidgets[0].css("left") || "").match(/([\d\.]+)px$/);
                        if (m && m.length == 2) firstChildLeft = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.childWidgets[0].css("width") || "").match(/([\d\.]+)px$/);
                        if (m && m.length == 2) firstChildWidth = Math.floor(parseFloat(m[1]) * 100) / 100;

                        if (firstChildLeft != undefined && firstChildWidth) {
                            self.childWidgets.forEach(function (w) {
                                var childWidth,
                                    m = (w.css("width") || "").match(/([\d\.]+)px$/);
                                if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;
                                if (childWidth > maxChildWidth) maxChildWidth = childWidth;
                            });

                            if (maxChildWidth) {
                                self.css("left", (left + firstChildLeft + firstChildWidth - maxChildWidth ) + "px");
                                self.css("width", maxChildWidth + "px");

                                self.childWidgets.forEach(function (w) {
                                    var childWidth,
                                        m = (w.css("width") || "").match(/([\d\.]+)px$/);
                                    if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;

                                    if (childWidth) {
                                        w.css("left", (maxChildWidth - childWidth) + "px");
                                    }
                                });
                            }
                        }
                    }
                },
                setTemporary: function (value) {
                    if (this.isTemporary != value) {
                        if (value) {
                            this.addClass("tempElement");
                        } else {
                            this.removeClass("tempElement");
                        }
                        this.isTemporary = value;
                    }
                }
            }),
            PageSketchWidgetClass = Class(BaseSketchWidgetClass, {
                CLASS_NAME: "PageSketchWidget",
                STYLE_DEFAULTS: {"color": "#000000"},
                initialize: function () {
                    this.initialize.prototype.__proto__.initialize.apply(this);
                    this.resizable = false;
                },
                isKindOf: function (className) {
                    var self = this;

                    return PageSketchWidgetClass.prototype.CLASS_NAME == className || self.initialize.prototype.__proto__.isKindOf.apply(self, [className]);
                }
            });

        Service.prototype.createWidget = function (containerElement) {
            var self = this,
                widgetObj = _.extend(new ElementSketchWidgetClass(), _.pick(self, Service.$inject));
            widgetObj.attr["ui-draggable"] = "";
            widgetObj.attr["ui-draggable-opts"] = "{threshold: 5, pointers: 0}";
            widgetObj.attr["ui-sketch-widget"] = "";
            widgetObj.attr["picked-widget"] = "sketchObject.pickedWidget";
            widgetObj.draw(containerElement);

            var scope = angular.element(widgetObj.$element.parent()).scope();
            self.$compile(widgetObj.$element.parent())(scope);

            return widgetObj;
        }

        Service.prototype.copyWidget = function (widgetObj, holderElement) {
            var self = this,
                cloneObj = _.extend(widgetObj.clone(), _.pick(self, Service.$inject));

            cloneObj.removeClass("pickedWidget");
            cloneObj.draw(holderElement);

            var scope = angular.element(cloneObj.$element.parent()).scope();
            self.$compile(cloneObj.$element.parent())(scope);

            return cloneObj;
        }

        Service.prototype.createComposite = function (widgetObjs) {
            if (widgetObjs && widgetObjs.length) {
                var containerId = null,
                    containerElement = null;
                widgetArr = [];

                widgetObjs.forEach(function (w) {
                    if (w.isElement) {
                        if (!w.$element || !w.$element.parent().length) {
                            widgetArr.push(w);
                        } else {
                            var $parent = w.$element.parent(),
                                parentId = $parent.data("widgetObject").id;
                            containerId = containerId || parentId;
                            containerElement = containerElement || ($parent.length && $parent);
                            if (!parentId || !containerId || containerId == parentId) {
                                widgetArr.push(w);
                            }
                        }
                    }
                });

                if (widgetArr.length && containerElement) {
                    var self = this,
                        compositeObj = _.extend(new ElementSketchWidgetClass(widgetArr), _.pick(self, Service.$inject));
                    compositeObj.attr["ui-draggable"] = "";
                    compositeObj.attr["ui-draggable-opts"] = "{threshold: 5, pointers: 0}";
                    compositeObj.attr["ui-sketch-widget"] = "";
                    compositeObj.attr["picked-widget"] = "sketchObject.pickedWidget";
                    compositeObj.draw(containerElement);

                    var scope = angular.element(compositeObj.$element.parent()).scope();
                    self.$compile(compositeObj.$element.parent())(scope);

                    return compositeObj;
                }
            }

            return null;
        }

        Service.prototype.createPage = function (holderElement) {
            var self = this,
                pageObj = _.extend(new PageSketchWidgetClass(), _.pick(self, Service.$inject));

            pageObj.attr["ui-sketch-widget"] = "";
            pageObj.attr["picked-widget"] = "sketchObject.pickedWidget";
            pageObj.draw(holderElement);

            var scope = angular.element(pageObj.$element.parent()).scope();
            self.$compile(pageObj.$element.parent())(scope);

            return pageObj;
        }

        Service.prototype.copyPage = function (pageObj, holderElement) {
            var self = this,
                cloneObj = _.extend(pageObj.clone(), _.pick(self, Service.$inject));

            cloneObj.removeClass("pickedWidget");
            cloneObj.draw(holderElement);

            var scope = angular.element(cloneObj.$element.parent()).scope();
            self.$compile(cloneObj.$element.parent())(scope);

            return cloneObj;
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('uiService', Service);
                }]);
        };
    }
);