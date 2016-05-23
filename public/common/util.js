define(
    ["angular-lib", "jquery-lib", "hammer-lib", "velocity-lib", "snap-svg-lib"],
    function () {
        var utilService = function ($rootScope, $log, $parse, $timeout, $q, $exceptionHandler, angularConstants, serviceRegistry) {
            this.$rootScope = $rootScope;
            this.$log = $log;
            this.$parse = $parse;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$exceptionHandler = $exceptionHandler;
            this.angularConstants = angularConstants;
            this.serviceRegistry = serviceRegistry;

            _.extend(utilService.prototype, SketchAnimation.prototype);
            _.extend(utilService.prototype, SVGAnimation.prototype);
        };

        utilService.$inject = ["$rootScope", "$log", "$parse", "$timeout", "$q", "$exceptionHandler", "angularConstants", "serviceRegistry"];

        //Animation service based on velocity.js
        var SketchAnimation = function () {
        };

        SketchAnimation.prototype.moveWidget = function ($element, routes, action, completeCallback) {
            function moveOneStop(coord, callback) {
                var currentStop = coord.currentStop,
                    nextStop;

                if (!currentStop) {
                    nextStop = coord;
                } else {
                    nextStop = currentStop.nextStop;
                }

                coord.currentStop = nextStop;

                if (nextStop) {
                    var v = {
                        complete: function ($el) {
                            try {
                                if (!nextStop.nextStop) {
                                    coord.currentStop = null;
                                }
                                callback && callback($el, !nextStop.nextStop);
                            } catch (err) {
                                self.$exceptionHandler(err);
                            }
                        }
                    };
                    _.each(settings, function (s) {
                        v[s.key] = s.pickedValue;
                    });
                    Velocity.animate.apply($element, [{
                        left: nextStop.left + "px",
                        top: nextStop.top + "px"
                    }, v]);
                }
            }

            function moveStops(coord, callback) {
                moveOneStop(coord, function ($el, isCompleted) {
                    if (isCompleted) {
                        try {
                            callback && callback();
                        } catch (err) {
                            self.$exceptionHandler(err);
                        }
                    } else {
                        self.$timeout(function () {
                            moveStops(coord, callback);
                        });
                    }
                })
            }

            var self = this,
                routeIndex = parseInt(action.routeIndex),
                settings = action.settings,
                runThrough = action.runThrough;

            if (routes && routeIndex < routes.length) {
                if ($element && $element[0].nodeType == 1 && $element.parent().length) {
                    var coord = routes[routeIndex],
                        defer = self.$q.defer();
                    if (runThrough) {
                        moveStops(coord, function () {
                            try {
                                completeCallback && completeCallback();
                            } catch (err) {
                                self.$exceptionHandler(err);
                            }
                            defer.resolve();
                        });

                        return defer.promise;
                    } else {
                        moveOneStop(coord, function ($el, isCompleted) {
                            if (isCompleted) {
                                try {
                                    completeCallback && completeCallback();
                                } catch (err) {
                                    self.$exceptionHandler(err);
                                }
                            }
                            defer.resolve();
                        })
                    }
                }
            }

            return self.getResolveDefer();
        };

        SketchAnimation.prototype.restoreAnimationWidget = function ($element, action, routes) {
            delete routes[action.routeIndex].currentStop;
        };

        SketchAnimation.prototype.doAnimation = function ($element, effect) {
            var self = this;

            if ($element && $element[0].nodeType == 1 && $element.parent().length) {
                var defer = self.$q.defer();

                $element.velocity(effect, {
                    complete: function () {
                        defer.resolve();
                    }
                });

                return defer.promise;
            }

            return self.getResolveDefer();
        };

        SketchAnimation.prototype.doAnimationWithCallback = function ($element, effect, start, complete) {
            if ($element && $element[0].nodeType == 1 && $element.parent().length) {
                $element.velocity(effect, {
                    start: start,
                    complete: complete
                });

                return defer.promise;
            }
        };

        //SVG animation service basedon snap.js
        var SVGAnimation = function () {
            },
            defaults = {
                speedIn: 500,
                speedOut: 500,
                easingIn: mina.linear,
                easingOut: mina.linear
            };

        SVGAnimation.prototype.init = function (element, options, openingSteps, closingSteps) {
            if (element) {
                var $el;

                if (element.jquery) {
                    $el = element;
                } else if (typeof element === "string" || angular.isElement(element)) {
                    $el = $(element);
                }

                if ($el.length) {
                    var animationPath = $el.data("animationPath");
                    if (!animationPath) {
                        var s = Snap($el.find("svg").get(0)),
                            animationPath = _.extend(s.select("path"), {attachedObj: {}});

                        animationPath.attachedObj.initialPath = animationPath.attr('d');
                        $el.data("animationPath", animationPath);
                    }
                    options = _.extend({}, defaults, animationPath.attachedObj.options, options);
                    animationPath.attachedObj.options = options;
                    animationPath.attachedObj.openingSteps = openingSteps || animationPath.openingSteps;
                    animationPath.attachedObj.closingSteps = closingSteps || animationPath.closingSteps || [animationPath.attachedObj.initialPath];

                    return animationPath;
                }
            }
        };

        SVGAnimation.prototype.show = function (element, options, openingSteps) {
            var self = this;

            if (element) {
                var animationPath = self.init(element, options, openingSteps, null);

                if (animationPath) {
                    var steps = animationPath.attachedObj.openingSteps,
                        speed = animationPath.attachedObj.options.speedIn,
                        easing = animationPath.attachedObj.options.easingIn,
                        stepsTotal = steps && steps.length || 0,
                        defer = self.$q.defer();

                    (function nextStep(pos) {
                        if (pos <= stepsTotal - 1) {
                            animationPath.animate({'path': steps[pos]}, speed, easing, function () {
                                nextStep(pos);
                            });
                            pos++;
                        } else {
                            defer.resolve();
                        }
                    })(0);

                    return defer.promise;
                }
            }

            return self.getResolveDefer();
        };

        SVGAnimation.prototype.hide = function (element, options, closingSteps) {
            var self = this;

            if (element) {
                var animationPath = self.init(element, options, null, closingSteps);

                if (animationPath) {
                    var steps = animationPath.attachedObj.closingSteps,
                        speed = animationPath.attachedObj.options.speedOut,
                        easing = animationPath.attachedObj.options.easingOut,
                        stepsTotal = steps && steps.length || 0,
                        defer = self.$q.defer();

                    (function nextStep(pos) {
                        if (pos <= stepsTotal - 1) {
                            animationPath.animate({'path': steps[pos]}, speed, easing, function () {
                                nextStep(pos);
                            });
                            pos++;
                        } else {
                            animationPath.attr('d', animationPath.attachedObj.initialPath);

                            defer.resolve();
                        }
                    })(0);

                    return defer.promise;
                }
            }

            return self.getResolveDefer();
        };

        var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        function _utf8_encode(string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                } else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                } else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }
            return utftext;
        }

        function _utf8_decode(utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;
            while (i < utftext.length) {
                c = utftext.charCodeAt(i);
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                } else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                } else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            return string;
        }

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

        utilService.prototype.encode = function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            input = _utf8_encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output +
                    _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
                    _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
            }
            return output;
        };

        utilService.prototype.decode = function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i < input.length) {
                enc1 = _keyStr.indexOf(input.charAt(i++));
                enc2 = _keyStr.indexOf(input.charAt(i++));
                enc3 = _keyStr.indexOf(input.charAt(i++));
                enc4 = _keyStr.indexOf(input.charAt(i++));
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
                output = output + String.fromCharCode(chr1);
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
            }
            output = _utf8_decode(output);
            return output;
        };

        utilService.prototype.listOmit = function (list) {
            var self = this,
                keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1)),
                arr = [];

            list && list.forEach(function (obj) {
                var item = _.omit(obj, keys);
                if (obj.list) {
                    var args = keys.slice();
                    args.splice(0, 0, 0, obj.list);
                    item.list = self.listOmit.apply(self, args);
                }
                arr.push(item);
            });

            return arr;
        };

        utilService.prototype.arrayOmit = function (objects) {
            var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1)),
                arr = [];

            objects && objects.forEach(function (obj) {
                arr.push(_.omit(obj, keys));
            });

            return arr;
        };

        utilService.prototype.arrayPick = function (objects) {
            var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1)),
                arr = [];

            objects && objects.forEach(function (obj) {
                arr.push(_.pick(obj, keys));
            });

            return arr;
        };

        utilService.prototype.calculateTop = function ($element) {
            var self = this,
                m = ($element.css("top") || "").match(/([-\d\.]+)px$/),
                top;
            if (m && m.length == 2)
                top = Math.floor(parseFloat(m[1]) * self.angularConstants.precision) / self.angularConstants.precision;
            else
                top = Math.floor(($element.offset().top - $element.parent().offset().top) * self.angularConstants.precision) / self.angularConstants.precision;

            return top;
        };

        utilService.prototype.calculateLeft = function ($element) {
            var self = this,
                m = ($element.css("left") || "").match(/([-\d\.]+)px$/),
                left;
            if (m && m.length == 2)
                left = Math.floor(parseFloat(m[1]) * self.angularConstants.precision) / self.angularConstants.precision;
            else
                left = Math.floor(($element.offset().left - $element.parent().offset().left) * self.angularConstants.precision) / self.angularConstants.precision;

            return left;
        };

        utilService.prototype.calculateHeight = function ($element) {
            var self = this,
                m = ($element.css("height") || "").match(/([-\d\.]+)px$/),
                height;
            if (m && m.length == 2)
                height = Math.floor(parseFloat(m[1]) * self.angularConstants.precision) / self.angularConstants.precision;
            else
                height = Math.floor($element.height() * self.angularConstants.precision) / self.angularConstants.precision;

            return height;
        };

        utilService.prototype.calculateWidth = function ($element) {
            var self = this,
                m = ($element.css("width") || "").match(/([-\d\.]+)px$/),
                width;
            if (m && m.length == 2)
                width = Math.floor(parseFloat(m[1]) * self.angularConstants.precision) / self.angularConstants.precision;
            else
                width = Math.floor($element.height() * self.angularConstants.precision) / self.angularConstants.precision;

            return width;
        };

        utilService.prototype.isVisible = function (element) {
            if (element) {
                var $el = element.jquery && element || $(element);

                return $el.css("display") !== "none" && $el.css("visibility") !== "hidden";
            }

            return false;
        };

        utilService.prototype.rgba = function (hex, alpha) {
            var rgb;

            if (typeof hex === "string") {
                rgb = this.hexTorgb(hex);
                alpha = 1;
            } else {
                if (hex.rValue != null && hex.gValue != null && hex.bValue != null) {
                    rgb = [hex.rValue, hex.gValue, hex.bValue];
                } else {
                    rgb = this.hexTorgb(hex.color);
                }
                if (alpha == null)
                    alpha = hex.alpha;
                alpha = Math.round(alpha * 100) / 100;
                hex = hex.color;
            }

            if (alpha == 1)
                return hex;
            else
                return "rgba({0}, {1}, {2}, {3})".format(rgb[0], rgb[1], rgb[2], alpha);
        };

        utilService.prototype.rgbToHsl = function (r, g, b) {
            r /= 255, g /= 255, b /= 255;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var h, s, l = (max + min) / 2;

            if (max == min) {
                h = s = 0; // achromatic
            } else {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r:
                        h = (g - b) / d + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / d + 2;
                        break;
                    case b:
                        h = (r - g) / d + 4;
                        break;
                }
                h /= 6;
            }

            return [h, s, l];
        };

        utilService.prototype.hue2rgb = function (p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        utilService.prototype.hslToRgb = function (h, s, l) {
            var self = this,
                r, g, b;

            if (s == 0) {
                r = g = b = l; // achromatic
            } else {
                var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                var p = 2 * l - q;
                r = self.hue2rgb(p, q, h + 1 / 3);
                g = self.hue2rgb(p, q, h);
                b = self.hue2rgb(p, q, h - 1 / 3);
            }

            return [r * 255, g * 255, b * 255];
        };

        utilService.prototype.toHex = function (decimal) {
            var code = Math.round(decimal).toString(16);

            (code.length > 1) || (code = '0' + code);
            return code;
        };

        utilService.prototype.contrastColor = function (hex) {
            if (hex) {
                var rgbval = parseInt(this.formalizeHex(hex).replace(/#/, ''), 16),
                    r = rgbval >> 16,
                    g = (rgbval & 65280) >> 8,
                    b = rgbval & 255,
                    brightness = r * 0.299 + g * 0.587 + b * 0.114;
                return (brightness > 160) ? "#000000" : "#ffffff"
            }

            return "";
        };

        utilService.prototype.lighterColor = function (rgb, percent) {
            var self = this,
                rgbval = parseInt(rgb.replace(/#/, ''), 16),
                r = rgbval >> 16,
                g = (rgbval & 65280) >> 8,
                b = rgbval & 255,
                hsl = self.rgbToHsl(r, g, b),
                newBrightness = hsl[2] + hsl[2] * percent;

            if (hsl[2] == 0 || hsl[2] == 1) {
                newBrightness = hsl[2] + percent;
            }
            if (newBrightness < 0) {
                newBrightness = 0;
            } else if (newBrightness > 1) {
                newBrightness = 1;
            }
            var newRGB = self.hslToRgb(hsl[0], hsl[1], newBrightness);

            return '#'
                + self.toHex(newRGB[0])
                + self.toHex(newRGB[1])
                + self.toHex(newRGB[2]);
        };

        utilService.prototype.hexTorgb = function (hex) {
            hex = hex.replace(/#/, '');
            if (hex.length == 3)
                hex = hex + hex;
            var rgbval = parseInt(hex, 16),
                r = rgbval >> 16,
                g = (rgbval & 65280) >> 8,
                b = rgbval & 255;
            return [r, g, b];
        };

        utilService.prototype.hexTohsl = function (hex) {
            var self = this;

            return self.rgbToHsl.apply(self, self.hexTorgb(hex));
        };

        utilService.prototype.formalizeHex = function (hex) {
            hex = hex.replace(/#/, '');
            if (hex.length == 3)
                hex = hex + hex;

            return "#" + hex;
        };

        utilService.prototype.rgbToHex = function (r, g, b) {
            var self = this;

            if (typeof r === "string" && g == undefined && b == undefined) {
                var arr = (/(\d+)[^\d]+(\d+)[^\d]+(\d+)/g).exec(r);
                if (arr && arr.length == 4) {
                    r = parseInt(arr[1]);
                    g = parseInt(arr[2]);
                    b = parseInt(arr[3]);
                }
            }

            if (r === undefined || r === null)
                r = 0;

            if (g === undefined || g === null)
                g = 0;

            if (b === undefined || b === null)
                b = 0;

            return '#'
                + self.toHex(r)
                + self.toHex(g)
                + self.toHex(b);
        };

        utilService.prototype.hslToHex = function (h, s, l) {
            var self = this;

            return self.rgbToHex.apply(self, self.hslToRgb(h, s, l));
        };

        utilService.prototype.prefixedStyleValue = function (styleValueFormat, val) {
            //styleValueFormat {0}linear-gradient(top, #888888 0%, rgba(132, 132, 132, 0.8) 100%);
            var prefixes = ["-webkit-", "-moz-", "-ms-", "-o-"],
                styleValues = [],
                values = Array.prototype.slice.call(arguments, 1) || [];

            values.splice(0, 0, "DUMMY-PREFIX");
            prefixes.forEach(function (prefix) {
                values.splice(0, 1, prefix);
                styleValues.push(String.prototype.format.apply(styleValueFormat, values));
            });

            return styleValues;
        };

        utilService.prototype.prefixedStyle = function (style, format) {
            var styleObj = {};

            if (style && format != null) {
                var prefixes = ["-webkit-", "-moz-", "-ms-", "-o-", ""],
                    values = Array.prototype.slice.call(arguments, 2);

                prefixes.forEach(function (prefix) {
                    styleObj[prefix + style] = String.prototype.format.apply(format, values);
                });
            }

            return styleObj;
        };

        utilService.prototype.getTextMetrics = function (element, size) {
            var $el = element.jquery && element || $(element),
                fontStyle = {},
                width = size.width,
                height = size.height;

            ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'].forEach(function (style) {
                var styleValue = $el.css(style);
                if (styleValue) fontStyle[style] = styleValue;
            });

            var temp = document.createElement('span'),
                $temp = $(temp);
            $temp.css({
                position: "absolute",
                left: -1000,
                top: -1000,
                opacity: 0,
                "white-space": "nowrap",
                "margin": 0,
                "padding": 0
            });
            document.body.appendChild(temp);
            $temp.css(fontStyle);

            var ch = "游",
                str, oldStr,
                text,
                cols,
                maxCols = 0,
                rows = 0;

            for (; $temp.outerHeight() <= height; rows++) {
                str = "", oldStr = "", cols = 0, text = document.createTextNode(str);
                $temp.append(text);
                for (; $temp.outerWidth() <= width; cols++) {
                    oldStr = str;
                    str += ch;
                    text.textContent = str;
                }
                text.textContent = oldStr;
                $temp.append("<br/>");
                if (cols > maxCols) maxCols = cols;
            }
            $temp.remove();

            return {rows: rows, cols: maxCols};
        };

        utilService.prototype.formalizePixelLength = function (value) {
            if (typeof value === "string") {
                var m = value.match(/([-\d\.]+)(px)?$/);
                if (m && m.length == 3)
                    return m[2] ? value : value + "px";
            } else if (typeof value === "number") {
                if (value >= 0)
                    return value + "px";
            }

            return "0px";
        };

        utilService.prototype.formalParameterList = function (fn) {
            var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
            var FN_ARG_SPLIT = /,/;
            var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
            var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

            var fnText, argDecl;
            var args = [];
            fnText = fn.toString().replace(STRIP_COMMENTS, '');
            argDecl = fnText.match(FN_ARGS);

            var r = argDecl[1].split(FN_ARG_SPLIT);
            for (var a in r) {
                var arg = r[a];
                arg.replace(FN_ARG, function (all, underscore, name) {
                    args.push(name);
                });
            }
            return args;
        };

        //Some control may need additional initialization process after scope variable is updated,
        //initMap contains this kind of init function
        utilService.prototype.createDirectiveBoundMap = function (boundProperties, attrs, initMap, sourceProps) {
            var boundMap = {};
            initMap = initMap || {}, sourceProps = sourceProps || {};
            for (var key in boundProperties) {
                var prop = attrs[key];
                boundMap[key] = {prop: prop, initFn: initMap[key], source: sourceProps[key]};
            }

            return boundMap;
        };

        utilService.prototype.tailorCssPrefix = function (styleObj, style) {
            if (style && styleObj) {
                var prefixes = ["-webkit-", "-moz-", "-ms-", "-o-"];

                prefixes.forEach(function (prefix) {
                    delete styleObj[prefix + style];
                });
            }
        };

        utilService.prototype.composeCssStyle = function (styleName, styleValue) {
            var self = this,
                styleObj = {};

            if (styleName === "transform") {
                var transformStyle = {},
                    arr;

                if (styleValue != null) {
                    if (toString.call(styleValue) === '[object Object]')
                        arr = [styleValue];
                    else if (toString.call(styleValue) === '[object Array]')
                        arr = styleValue;
                }

                var transformArr = [];
                arr && arr.forEach(function (t) {
                    if (t.name && t.value) {
                        transformArr.push("{0}({1})".format(t.name, t.value));
                    }
                });
                if (transformArr.length) {
                    transformStyle = self.prefixedStyle("transform", "{0}", transformArr.join(" "));
                }

                styleObj = transformStyle;
            } else if (styleName === "transform-origin") {
                if (styleValue != null) {
                    styleObj = self.prefixedStyle("transform-origin", "{0}", styleValue);
                } else {
                    styleObj = self.prefixedStyle("transform-origin", "{0}", "");
                }
            } else if (styleName === "box-shadow") {
                var arr = [];
                if (styleValue != null) {
                    if (toString.call(styleValue) === '[object Array]') {
                        styleValue.forEach(function (item) {
                            var str = "{0} {1} {2} {3} {4} {5}".format(self.rgba(item.color) || "", item["h-shadow"] || "", item["v-shadow"] || "", item["blur"] || "", item["spread"] || "", item["inset"] || "").trim();
                            str && arr.push(str);
                        });
                    }
                }

                styleObj = {"box-shadow": arr.join(",")};
            } else if (styleName === "text-shadow") {
                var arr = [];
                if (styleValue != null) {
                    if (toString.call(styleValue) === '[object Array]') {
                        styleValue.forEach(function (item) {
                            var str = "{0} {1} {2} {3}".format(self.rgba(item.color) || "", item["h-shadow"] || "", item["v-shadow"] || "", item["blur"] || "").trim();
                            str && arr.push(str);
                        });
                    }
                }
                styleObj = {"text-shadow": arr.join(",")};
            } else if (styleName === "linearGradientColor") {
                if (styleValue && styleValue.colorStopList && styleValue.colorStopList.length) {
                    if (styleValue.colorStopList.length > 1) {
                        var x1, y1, x2, y2;
                        if (styleValue.angle == 90) {
                            x1 = 50;
                            y1 = 100;
                            x2 = 50;
                            y2 = 0;
                        } else if (styleValue.angle == 270) {
                            x1 = 50;
                            y1 = 0;
                            x2 = 50;
                            y2 = 100;
                        } else {
                            var tan = Math.tan(styleValue.angle);
                            if (styleValue.angle <= 45) {
                                x1 = 0;
                                y1 = 50 * ( 1 + tan);
                                x2 = 100;
                                y2 = 50 * (1 - tan);
                            } else if (styleValue.angle <= 135) {
                                y1 = 100;
                                x1 = 50 * (1 - 1 / tan);
                                y2 = 0;
                                x2 = 50 * (1 + 1 / tan);
                            } else if (styleValue.angle <= 225) {
                                x1 = 100;
                                y1 = 50 * (1 - tan);
                                x2 = 0;
                                y1 = 50 * (1 + tan);
                            } else if (styleValue.angle <= 315) {
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
                        styleValue.colorStopList.forEach(function (colorStop) {
                            webkitStops.push("color-stop({1}%, {0})".format(self.rgba(colorStop.color), colorStop.percent));
                            stops.push("{0} {1}%".format(self.rgba(colorStop.color), colorStop.percent));
                        });

                        var styles = [];
                        styles.push("-webkit-gradient(linear, {0}% {1}%, {2}% {3}%, {4})".format(x1, y1, x2, y2, webkitStops.join(",")));
                        self.prefixedStyleValue("{0}linear-gradient({1}deg, {2})", styleValue.angle, stops.join(",")).forEach(
                            function (gradientStyleValue) {
                                styles.push(gradientStyleValue);
                            }
                        );

                        styleObj = {"background": styles};
                    } else {
                        styleObj = {"background": self.rgba(styleValue.colorStopList[0].color) || ""};
                    }
                } else {
                    styleObj = {"background": ""};
                }
            } else if (styleName === "background-image") {
                if (styleValue) {
                    var m = styleValue.match(/[^\/]+$/);
                    if (m && m.length) {
                        styleValue = styleValue.replace(/[^\/]+$/, encodeURIComponent(m[0]));
                    }
                    styleObj = {"background-image": "url({0})".format(styleValue)};
                } else {
                    styleObj = {"background-image": ""};
                }
            } else if (styleName === "background-position") {
                if (styleValue && !_.isEmpty(styleValue)) {
                    styleObj = {"background-position": "{0}{2} {1}{2}".format(styleValue.x, styleValue.y, styleValue.unit)};
                } else {
                    styleObj = {"background-position": ""};
                }
            } else if (styleName === "color" || styleName === "border-color") {
                if (styleValue && !_.isEmpty(styleValue)) {
                    styleObj[styleName] = self.rgba(styleValue);
                }
            } else {
                if (styleValue == null)
                    styleValue = "";
                styleObj[styleName] = styleValue;
            }

            return styleObj;
        };

        utilService.prototype.hasParentClass = function (element, classname) {
            var self = this;

            if (element === document) return false;

            return $(element).hasClass(classname) || (element.parentNode && self.hasParentClass(element.parentNode, classname));
        };

        utilService.prototype.mobileCheck = function () {
            var check = false;
            (function (a) {
                if (/(android|ipad|playbook|silk|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))check = true
            })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        };

        utilService.prototype.eventType = function () {
            return this.mobileCheck() ? 'touchstart' : 'click';
        };

        utilService.prototype.onAnimationStart = function (target) {
            var animEndEventNames = {
                    'WebkitAnimation': 'webkitAnimationStart',
                    'OAnimation': 'oAnimationStart',
                    'msAnimation': 'MSAnimationStart',
                    'animation': 'animationstart'
                },
                animEndEventName = animEndEventNames[Modernizr.prefixed('animation')],
                self = this,
                defer = self.$q.defer();

            target.on(animEndEventName, function () {
                $(this).off(animEndEventName);
                defer.resolve();
            });

            return defer.promise;
        };

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
        };

        utilService.prototype.onTransitionEnd = function (target) {
            var tranEndEventNames = {
                    'WebkitTransition': 'webkitTransitionEnd',
                    'OTransition': 'oTransitionEnd',
                    'msTransition': 'MSTransitionEnd',
                    'transition': 'transitionend'
                },
                tranEndEventName = tranEndEventNames[Modernizr.prefixed('transition')],
                self = this,
                defer = self.$q.defer();

            target.on(tranEndEventName, function () {
                $(this).off(tranEndEventName);
                defer.resolve();
            });

            return defer.promise;
        };

        utilService.prototype.markSelection = function (target, source, props) {
            if (toString.call(target) === '[object Array]' && target.length) {
                target.forEach(function (item) {
                    item._selected = false;
                });

                if (source && source.length) {
                    if (props) {
                        target.forEach(function (item) {
                            if (!source.every(function (o) {
                                    return !props.every(function (prop) {
                                        return o[prop.source] === item[prop.target];
                                    });
                                })) {
                                item._selected = true;
                            }
                        });
                    } else {
                        target.forEach(function (item) {
                            item._selected = false;

                            if (!source.every(function (o) {
                                    return o !== item;
                                })) {
                                item._selected = true;
                            }
                        });
                    }
                }
            }

            return target;
        };

        utilService.prototype.filterSelection = function (target, source, props) {
            var arr = [];

            if (toString.call(target) === '[object Array]' && target.length) {
                if (source && source.length) {

                    if (props) {
                        target.forEach(function (item) {
                            if (!source.every(function (o) {
                                    return !props.every(function (prop) {
                                        return o[prop.source] === item[prop.target];
                                    });
                                })) {
                                arr.push(item);
                            }
                        });
                    } else {
                        target.forEach(function (item) {
                            if (!source.every(function (o) {
                                    return o !== item;
                                })) {
                                arr.push(item);
                            }
                        });
                    }

                    return arr;
                }
            }

            return arr;
        };

        utilService.prototype.uniqueIdGen = function (prefix, uid) {
            uid = uid || ['0', '0', '0'];

            return function () {
                var index = uid.length;
                var digit;

                while (index) {
                    index--;
                    digit = uid[index].charCodeAt(0);
                    if (digit == 57 /*'9'*/) {
                        uid[index] = 'A';
                        return uid.join('');
                    }
                    if (digit == 90  /*'Z'*/) {
                        uid[index] = '0';
                    } else {
                        uid[index] = String.fromCharCode(digit + 1);
                        return [prefix || "", "-", uid.join('')].join("");
                    }
                }
                uid.unshift('0');
                return [prefix || "", "-", uid.join('')].join("");
            }
        };

        utilService.prototype.createObjectClass = function () {
            var self = this;

            return function () {
                var len = arguments.length;
                var P = arguments[0];
                var F = arguments[len - 1];

                if ((self.classMap = self.classMap || {})[F.CLASS_NAME]) {
                    return self.classMap[F.CLASS_NAME];
                }

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

                self.classMap[F.CLASS_NAME] = C;

                return C;
            }
        };

        utilService.prototype.findObjectClass = function () {
            var self = this;

            return function (className) {
                return (self.classMap = self.classMap || {})[className];
            }
        };

        utilService.prototype.NOOP = function () {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve();
            });

            return defer.promise;
        };

        utilService.prototype.getResolveDefer = function (result) {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                defer.resolve(result);
            });

            return defer.promise;
        };

        utilService.prototype.getRejectDefer = function (err) {
            var self = this,
                errorDefer = self.$q.defer();

            self.$timeout(function () {
                errorDefer.reject(err);
            });

            return errorDefer.promise;
        };

        //The root may not be set to the scope when part of the scope initialization program is executed.
        utilService.prototype.broadcast = function (scope, eventName, boundObj) {
            var self = this;

            self.whilst(function () {
                    return !scope.$root;
                }, function (err) {
                    err || scope.$root.$broadcast(eventName, boundObj);
                }, self.angularConstants.checkInterval,
                "utilService.broadcast.{0}-{1}".format(eventName, _.now()))
        };

        utilService.prototype.timeout = function (callback, timeoutId, timeout) {
            var self = this;

            timeoutId = timeoutId || "timeout_" + _.now();
            self.timeoutMap = self.timeoutMap || {};
            self.timeoutMap[timeoutId] = self.timeoutMap[timeoutId] || {};
            self.timeoutMap[timeoutId].defer = self.timeoutMap[timeoutId].defer || self.$q.defer();

            var t = timeout > 0 && self.$timeout(function () {
                    if (self.timeoutMap[timeoutId]) {
                        self.timeoutMap[timeoutId].defer.reject("TIMEOUT");
                        delete self.timeoutMap[timeoutId];
                    }

                    self.angularConstants.VERBOSE && self.$log.debug("TIMEOUT occurred on timeoutId " + timeoutId);
                }, timeout) || null;

            callback().then(function (result) {
                t && self.$timeout.cancel(t);
                if (self.timeoutMap[timeoutId]) {
                    self.timeoutMap[timeoutId].defer.resolve(result);
                    delete self.timeoutMap[timeoutId];
                }
            }, function (err) {
                t && self.$timeout.cancel(t);
                if (self.timeoutMap[timeoutId]) {
                    self.timeoutMap[timeoutId].defer.reject(err);
                    delete self.timeoutMap[timeoutId];
                }
            });

            return self.timeoutMap[timeoutId].defer.promise;
        };

        utilService.prototype.whilst = function (test, callback, interval, whilstId, timeout) {
            var self = this;

            whilstId = whilstId || "whilst_" + _.now();
            self.whilstMap = self.whilstMap || {};
            self.whilstMap[whilstId] = self.whilstMap[whilstId] || {};
            self.whilstMap[whilstId].defer = self.whilstMap[whilstId].defer || self.$q.defer();
            var t = timeout > 0 && self.$timeout(function () {
                    if (self.whilstMap[whilstId]) {
                        try {
                            callback && callback("TIMEOUT");
                        } catch (e) {
                            self.$exceptionHandler(e);
                        }

                        if (self.whilstMap[whilstId]) {
                            self.whilstMap[whilstId].defer.reject("TIMEOUT");
                            delete self.whilstMap[whilstId];
                        }

                        self.angularConstants.VERBOSE && self.$log.debug("TIMEOUT occurred on whilstId " + whilstId);
                    }
                }, timeout) || null;

            self.$timeout(function () {
                if (self.whilstMap[whilstId]) {
                    if (test()) {
                        if (self.whilstMap[whilstId]) {
                            self.whilst(test, callback, interval, whilstId);
                        }
                    }
                    else {
                        t && self.$timeout.cancel(t);

                        callback && callback();
                        if (self.whilstMap[whilstId]) {
                            self.whilstMap[whilstId].defer.resolve();
                            delete self.whilstMap[whilstId];
                        }
                    }
                }
            }, interval);

            return self.whilstMap[whilstId].defer.promise;
        };

        utilService.prototype.chain = function (arr, chainId, timeout, stopOnEach, callback) {
            var self = this;

            function chainHandler() {
                var eachDefer = stopOnEach && self.$q.defer();

                if (self.chainMap[chainId]) {
                    if (self.chainMap[chainId].currentIndex < self.chainMap[chainId].arr.length) {
                        var fn = self.chainMap[chainId].arr[self.chainMap[chainId].currentIndex];

                        fn().then(
                            function () {
                                eachDefer && eachDefer.resolve();

                                if (self.chainMap[chainId]) {
                                    self.chainMap[chainId].currentIndex++;
                                    !stopOnEach && self.$timeout(function () {
                                        chainHandler();
                                    });
                                }
                            },
                            function (err) {
                                if (self.chainMap[chainId]) {
                                    self.chainMap[chainId].t && self.$timeout.cancel(self.chainMap[chainId].t);

                                    if (self.chainMap[chainId]) {
                                        self.chainMap[chainId].defer.resolve(err);
                                        delete self.chainMap[chainId];
                                    }
                                }

                                eachDefer && eachDefer.resolve(err);
                            }
                        );
                    } else {
                        try {
                            callback && callback();
                        } catch (e) {
                            self.$exceptionHandler();
                        }

                        self.chainMap[chainId].t && self.$timeout.cancel(self.chainMap[chainId].t);

                        if (self.chainMap[chainId]) {
                            self.chainMap[chainId].defer.resolve();
                            delete self.chainMap[chainId];
                        }

                        eachDefer && eachDefer.resolve();
                    }
                } else {
                    eachDefer && eachDefer.resolve("ENOENT");
                }

                return eachDefer && eachDefer.promise;
            }

            chainId = chainId || "chain_" + _.now();
            self.chainMap = self.chainMap || {};
            if (!self.chainMap[chainId]) {
                self.chainMap[chainId] = {};
                self.chainMap[chainId].defer = self.chainMap[chainId].defer || self.$q.defer();
                self.chainMap[chainId].currentIndex = 0;
                self.chainMap[chainId].arr = arr;
                self.chainMap[chainId].t = timeout > 0 && !stopOnEach && self.$timeout(function () {
                        if (self.chainMap[chainId]) {
                            self.chainMap[chainId].defer.resolve("TIMEOUT");
                            delete self.chainMap[chainId];

                            self.angularConstants.VERBOSE && self.$log.debug("TIMEOUT occurred on chainId " + chainId);
                        }
                    }, timeout) || null;

                !stopOnEach && chainHandler();
            }

            return stopOnEach && {
                    next: function () {
                        return chainHandler();
                    },
                    cancel: function () {
                        if (self.chainMap[chainId]) {
                            self.chainMap[chainId].t && self.$timeout.cancel(self.chainMap[chainId].t);

                            self.chainMap[chainId].defer.resolve("CANCEL");
                            delete self.chainMap[chainId];
                        }
                    },
                    isComplete: function () {
                        return !self.chainMap[chainId];
                    },
                    promise: self.chainMap[chainId].defer.promise
                } || _.extend(self.chainMap[chainId].defer.promise, {
                    cancel: function () {
                        if (self.chainMap[chainId]) {
                            self.chainMap[chainId].t && self.$timeout.cancel(self.chainMap[chainId].t);

                            self.chainMap[chainId].defer.resolve("CANCEL");
                            delete self.chainMap[chainId];
                        }
                    },
                    isComplete: function () {
                        return !self.chainMap[chainId];
                    }
                });
        };

        utilService.prototype.once = function (fn, callback, interval, onceId) {
            var self = this;

            onceId = onceId || fn.onceId;
            if (!onceId)
                return angular.noop;

            self.onceMap = self.onceMap || {};
            self.onceMap[onceId] = self.onceMap[onceId] || {isExecuted: false};
            if (self.onceMap[onceId].isExecuted)
                return angular.noop;
            self.onceMap[onceId].isExecuted = true;

            return function () {
                var args = Array.prototype.slice.call(arguments);

                self.angularConstants.VERBOSE && self.$log.debug("onceId:" + onceId);

                fn.apply(null, args).then(
                    function (result) {
                        self.$timeout(
                            function () {
                                try {
                                    callback && callback(result);
                                } catch (e) {
                                    self.$exceptionHandler(e);
                                }

                                delete self.onceMap[onceId];
                            },
                            interval
                        )
                    },
                    function (err) {
                        self.$timeout(
                            function () {
                                try {
                                    callback && callback(null, err);
                                } catch (e) {
                                    self.$exceptionHandler(e);
                                }

                                delete self.onceMap[onceId];
                            },
                            interval
                        )
                    }
                );
            }
        };

        utilService.prototype.onceWrapper = function (bindObj) {
            var self = this,
                functionNames = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));

            functionNames.forEach(function (functionName) {
                var fn = bindObj[functionName];

                bindObj[functionName] = function () {
                    var defer = self.$q.defer(),
                        args = Array.prototype.slice.call(arguments);

                    self.once(
                        function () {
                            return fn.apply(bindObj, args);
                        },
                        function (result, err) {
                            if (err) {
                                defer.reject(err);
                            } else {
                                defer.resolve(result);
                            }
                        },
                        self.angularConstants.checkInterval,
                        "{0}.{1}".format(bindObj.id, functionName)
                    )();

                    return defer.promise;
                }
            });
        };

        utilService.prototype.latestOnce = function (fn, callback, errorCallback, interval, onceId) {
            var self = this;

            onceId = onceId || fn.onceId;
            if (!onceId)
                return angular.noop;

            function latestOnceHandler(id) {
                self.$timeout(
                    function () {
                        var fn = self.latestOnceMap[id].fn,
                            callback = self.latestOnceMap[id].callback,
                            errorCallback = self.latestOnceMap[id].errorCallback,
                            args = self.latestOnceMap[id].args,
                            timestamp = self.latestOnceMap[id].timestamp;

                        function block(result) {
                            try {
                                callback && callback.apply(null, [result]);
                            } catch (e) {
                                self.$exceptionHandler(e);
                            }

                            if (timestamp == self.latestOnceMap[id].timestamp) {
                                self.latestOnceMap[id].isExecuted = false;

                                delete self.latestOnceMap[id].fn;
                                delete self.latestOnceMap[id].callback;
                                delete self.latestOnceMap[id].errorCallback;
                                delete self.latestOnceMap[id].timestamp;
                                delete self.latestOnceMap[id].args;
                            } else {
                                latestOnceHandler(id);
                            }
                        }

                        function errorBlock(err) {
                            try {
                                errorCallback && errorCallback.apply(null, [err]);
                            } catch (e) {
                                self.$exceptionHandler(e);
                            }

                            if (timestamp == self.latestOnceMap[id].timestamp) {
                                self.latestOnceMap[id].isExecuted = false;

                                delete self.latestOnceMap[id].fn;
                                delete self.latestOnceMap[id].callback;
                                delete self.latestOnceMap[id].errorCallback;
                                delete self.latestOnceMap[id].timestamp;
                                delete self.latestOnceMap[id].args;
                            } else {
                                latestOnceHandler(id);
                            }
                        }

                        try {
                            fn.apply(null, args).then(block, errorBlock);
                        } catch (e) {
                            self.$exceptionHandler(e);
                        }
                    }, interval
                );
            }

            return function () {
                var args = Array.prototype.slice.call(arguments);

                self.latestOnceMap = self.latestOnceMap || {};
                self.latestOnceMap[onceId] = self.latestOnceMap[onceId] || {isExecuted: false};
                self.latestOnceMap[onceId].fn = fn;
                self.latestOnceMap[onceId].callback = callback;
                self.latestOnceMap[onceId].errorCallback = errorCallback;
                self.latestOnceMap[onceId].timestamp = _.now();
                self.latestOnceMap[onceId].args = args;

                if (!self.latestOnceMap[onceId].isExecuted) {
                    self.latestOnceMap[onceId].isExecuted = true;

                    latestOnceHandler(onceId);
                }
            };
        };

        utilService.prototype.setState = function (id, state) {
            var self = this,
                defer = self.$q.defer(),
                widgetName;

            //Accept widget name
            if (!/Widget_\d+$/.test(id)) {
                widgetName = id;
                id = null;
            }

            self.whilst(function () {
                    return widgetName ? !document.getElementsByName(widgetName).length : !document.getElementById(id);
                },
                function (err) {
                    if (!err) {
                        if (widgetName) {
                            var element = document.getElementsByName(widgetName)[0];
                            id = element.id;
                        }

                        var fn = self.$rootScope[id] && self.$rootScope[id].setState,
                            ret;
                        if (fn) {
                            ret = fn(state);
                        } else {
                            ret = self.setStateOnWidget(id, state)
                        }

                        ret.then(function () {
                            defer.resolve();
                        });
                    } else {
                        defer.reject(err);
                    }
                },
                self.angularConstants.checkInterval,
                "utilService.setState.{0}({1})".format(id || "", widgetName || ""),
                self.angularConstants.renderTimeout);

            return defer.promise;
        };

        utilService.prototype.setStateOnWidget = function (id, state) {
            var self = this,
                defer = self.$q.defer(),
                widgetName;

            //Accept widget name
            if (!/Widget_\d+$/.test(id)) {
                widgetName = id;
                id = null;
            }

            self.whilst(function () {
                    return widgetName ? !document.getElementsByName(widgetName).length : !document.getElementById(id);
                },
                function (err) {
                    if (!err) {
                        var $widgetElement;
                        if (widgetName) {
                            var element = document.getElementsByName(widgetName)[0];
                            $widgetElement = $(element);
                            id = element.id;
                        } else {
                    	    $widgetElement = $("#" + id);
                        }

                        $widgetElement.attr("state", state);
                        if ($widgetElement.hasClass(self.angularConstants.widgetClasses.widgetIncludeAnchorClass)) {
                            self.whilst(function () {
                                    var scope = angular.element($widgetElement.find("[widget-container]:nth-of-type(1)").first().children()[0]).scope();
                                    return !scope;
                                }, function (err) {
                                    if (!err) {
                                        var scope = angular.element($widgetElement.find("[widget-container]:nth-of-type(1)").first().children()[0]).scope();
                                        scope.state = state;
                                        defer.resolve();
                                    } else {
                                        defer.reject(err);
                                    }
                                },
                                self.angularConstants.checkInterval,
                                "utilService.setState.RepoSketchWidget." + id,
                                self.angularConstants.renderTimeout
                            )
                        } else {
                            var animationName = $widgetElement.css("animation-name");
                            if (animationName && animationName !== "none") {
                                self.onAnimationEnd($widgetElement).then(function () {
                                    defer.resolve();
                                });
                            } else {
                                defer.resolve();
                            }
                        }
                    } else {
                        defer.reject(err);
                    }
                },
                self.angularConstants.checkInterval,
                "utilService.setStateOnWidget.{0}({1})".format(id || "", widgetName || ""),
                self.angularConstants.renderTimeout);

            return defer.promise;
        };

        utilService.prototype.handleEventOnce = function (widgetId, fn) {
            var self = this;

            return self.once(function () {
                var result = fn() || {};

                return result.then && result || self.getResolveDefer();
            }, null, self.angularConstants.eventThrottleInterval, "handleEventOnce.{0}".format(widgetId));
        };

        utilService.prototype.doAction = function (action, runOnce) {
            var self = this,
                $widgetElement = $("#" + action.widgetObj);

            if (runOnce == null) runOnce = false;
            if ($widgetElement.length) {
                var widgetScope = angular.element($widgetElement).scope(),
                    mark = self.setActionMark($widgetElement, action, runOnce);

                if (!mark.isComplete || !runOnce) {
                    if (action.actionType === "Sequence") {
                        mark.setRestoreHandler(function () {
                            if (action.chainObject) {
                                action.chainObject.cancel();
                                action.chainObject = null;
                            }

                            action.childActions.forEach(function (actionObj) {
                                self.restoreWidget(actionObj);
                            });
                        });

                        var arr = [],
                            chainId = "utilService.doAction." + action.id;

                        if (action.stopOnEach) {
                            if (action.chainObject && action.chainObject.isComplete()) action.chainObject = null;

                            if (!action.chainObject) {
                                action.childActions && action.childActions.forEach(function (childAction) {
                                    if (childAction.runThrough != null && !childAction.runThrough && childAction.stepCount > 1) {
                                        for (var i = 0; i < childAction.stepCount; i++) {
                                            arr.push(function () {
                                                return self.doAction(childAction, runOnce);
                                            });
                                        }
                                    } else {
                                        arr.push(function () {
                                            return self.doAction(childAction, runOnce);
                                        });
                                    }
                                });

                                //FIXME Need code review on releasing resource after scope destroyed.
                                action.scopeDestroyWatcher && action.scopeDestroyWatcher();

                                var chainObject = self.chain(arr,
                                    chainId,
                                    null,
                                    action.stopOnEach,
                                    function () {
                                        mark.markComplete();
                                    }
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
                            action.childActions && action.childActions.forEach(function (childAction) {
                                arr.push(function () {
                                    return self.doAction(childAction, runOnce);
                                });
                            });

                            action.scopeDestroyWatcher && action.scopeDestroyWatcher();

                            var promise = self.chain(arr,
                                chainId,
                                null,
                                action.stopOnEach,
                                function () {
                                    mark.markComplete();
                                }
                            );

                            if (widgetScope) {
                                action.scopeDestroyWatcher = widgetScope.$on('$destroy', function () {
                                    promise.cancel && promise.cancel();
                                });
                            }

                            return promise;
                        }
                    }
                    else if (action.actionType === "Effect") {
                        var defer = self.$q.defer(),
                            fullName = action.artifactSpec.directiveName;

                        mark.markComplete();

                        if (action.artifactSpec.version) {
                            fullName = fullName + "-" + action.artifactSpec.version.replace(/\./g, "-")
                        }
                        $widgetElement.attr(fullName, "");
                        $widgetElement.attr("effect", action.effect.name);

                        if (action.effect.type === "Animation") {
                            var cssAnimation = {};

                            if (action.effect.options.duration) {
                                _.extend(
                                    cssAnimation, self.prefixedStyle("animation-duration", "{0}s", action.effect.options.duration)
                                );
                            }
                            if (action.effect.options.timing) {
                                _.extend(
                                    cssAnimation, self.prefixedStyle("timing-function", "{0}", action.effect.options.timing)
                                );
                            }

                            $widgetElement.css(cssAnimation);

                            if (action.runAfterComplete) {
                                self.onAnimationEnd($widgetElement).then(function () {
                                    $widgetElement.removeAttr(fullName);
                                    $widgetElement.removeAttr("effect");

                                    for (var key in cssAnimation) {
                                        $widgetElement.css(key, "");
                                    }

                                    defer.resolve();
                                });
                            } else {
                                self.onAnimationStart($widgetElement).then(function () {
                                    defer.resolve();
                                });

                                self.onAnimationEnd($widgetElement).then(function () {
                                    $widgetElement.removeAttr(fullName);
                                    $widgetElement.removeAttr("effect");

                                    for (var key in cssAnimation) {
                                        $widgetElement.css(key, "");
                                    }
                                });
                            }
                        } else {
                            self.$timeout(function () {
                                defer.resolve();
                            });
                        }

                        return defer.promise;
                    }
                    else if (action.actionType === "State") {
                        mark.markComplete();

                        return self.setState(action.widgetObj, action.newState);
                    }
                    else if (action.actionType === "Configuration") {
                        var defer = self.$q.defer();

                        mark.markComplete();

                        self.whilst(function () {
                                var scope = angular.element($widgetElement.find("[widget-container]:nth-of-type(1)").first().children()[0]).scope();
                                return !scope;
                            }, function (err) {
                                if (!err) {
                                    var scope = angular.element($widgetElement.find("[widget-container]:nth-of-type(1)").first().children()[0]).scope();

                                    action.configuration && action.configuration.forEach(function (item) {
                                        if (item.type === "size") {
                                            var m = (item.pickedValue || "").match(/([-\d\.]+)(px|em|%)+$/);
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
                        );

                        return defer.promise;
                    }
                    else if (action.actionType === "Movement") {
                        var styleObj = {left: $widgetElement.css("left"), top: $widgetElement.css("top")};
                        mark.setRestoreHandler(function () {
                            $widgetElement.css(styleObj);
                            self.restoreAnimationWidget($widgetElement, action, self.$rootScope[$widgetElement.attr("id")].routes);
                        });

                        return self.moveWidget(
                            $widgetElement,
                            self.$rootScope[$widgetElement.attr("id")].routes,
                            action,
                            function () {
                                mark.markComplete();
                            });
                    }
                    else if (action.actionType === "Sound") {
                        mark.markComplete();

                        return action.resourceName && self.serviceRegistry.invoke("BaseService", "playSound")("resource/audio/{0}".format(action.resourceName)) || self.getResolveDefer();
                    }
                    else if (action.actionType === "Service") {
                        mark.markComplete();

                        var fn = self.serviceRegistry.invoke(action.feature, action.serviceName);

                        if (fn) {
                            var arr = [];
                            if (action.communicationType === "event") {
                                //Set eventHandler, eventId as null
                                arr.splice(0, 0, null, null);
                            }
                            action.parameters.forEach(function (param) {
                                var val = null;
                                action.input.every(function (inputItem) {
                                    if (inputItem.name === param) {
                                        if (inputItem.expression != null) {
                                            val = widgetScope.$eval(inputItem.expression);
                                        }
                                        return false;
                                    }

                                    return true;
                                });
                                arr.push(val);
                            });

                            var ret = fn.apply(null, arr);
                            if (ret && ret.then) return ret;
                        }

                        return self.getResolveDefer();
                    }
                    else if (action.actionType === "Include") {
                        mark.markComplete();

                        if (action.edge) {
                            widgetScope && widgetScope.$on('$destroy', function () {
                                self.unloadAnimation(action.edge);
                            });

                            return self.loadAnimation(action.edge);
                        }

                        return self.getResolveDefer();
                    }
                    else if (action.actionType === "IncludeVideo") {
                        mark.markComplete();

                        return self.getResolveDefer();
                    }
                }
            }

            return self.getResolveDefer();
        };

        utilService.prototype.handleStateAction = function (stateAction) {
            return this.doAction(stateAction);
        };

        utilService.prototype.registerTrigger = function (id, eventMap) {
            var self = this,
                defer = self.$q.defer();

            function createWidgetObject(action) {
                self.whilst(function () {
                        return !document.getElementById(action.widgetObj);
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

            function createActionCallback(actions, runOnce) {
                if (actions && actions.length) {
                    var actionObj = actions[0].actionObj;

                    if (self.$rootScope.pickedPage) {
                        var m = self.$rootScope.pickedPage.match(/[^page-].+$/);
                        if (m && m.length) {
                            var widgetId = m[0],
                                $container = $("#main"),
                                $page = $container.children("#" + widgetId);

                            if ($page.length) {
                                var pageScope = angular.element($page).scope();

                                (pageScope.restoreHandlers = pageScope.restoreHandlers || []).push(
                                    function () {
                                        self.restoreWidget(actionObj);
                                    }
                                );
                            }
                        }
                    }

                    //Some widget may be triggered by hammer gesture and ng mouse event at the same time, which is
                    //to be prevented. A widget object with handleEventOnce function can stop widget event handling if
                    //hammer handling is processed first.
                    createWidgetObject(actionObj);

                    return function (event) {
                        if (event && event.srcEvent) {
                            event.srcEvent.stopPropagation && event.srcEvent.stopPropagation();
                        }

                        if (actionObj.stopOnEach && actionObj.chainObject) {
                            self.doAction(actionObj, runOnce);
                        } else {
                            self.handleEventOnce(actionObj.widgetObj, function () {
                                return self.doAction(actionObj, runOnce);
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

            self.whilst(function () {
                    return !document.getElementById(id);
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
                                                callback: createActionCallback(eventConfig.actions, eventConfig.runOnce)
                                            });
                                        }
                                    });

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
                                    });

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
        };

        utilService.prototype.setActionMark = function ($widgetElement, action, runOnce) {
            var ActionMark = function (action, runOnce) {
                this.action = action;
                this.runOnce = runOnce;
                this.count = 0;
                this.isComplete = false;
            };

            ActionMark.prototype.markComplete = function () {
                this.count++;
                if (this.runOnce) {
                    this.isComplete = true;
                }
            };

            ActionMark.prototype.setRestoreHandler = function (restoreHandler) {
                if (!restoreHandler || (restoreHandler && !this.restoreHandler)) {
                    this.restoreHandler = restoreHandler;
                }
            };

            ActionMark.prototype.restoreWidget = function () {
                if (this.restoreHandler) {
                    this.restoreHandler();
                    this.restoreHandler = null;
                }

                this.count = 0;
                this.isComplete = false;
            };

            var actionMarks = $widgetElement.data("actionMarks");
            if (!actionMarks) {
                $widgetElement.data("actionMarks", actionMarks = {});
            }
            return actionMarks[action.id] = actionMarks[action.id] || new ActionMark(action, runOnce);
        };

        utilService.prototype.restoreWidget = function (action) {
            var $widgetElement = $("#" + action.widgetObj),
                actionMarks = $widgetElement.data("actionMarks");
            if (actionMarks) {
                var actionMark = actionMarks[action.id];
                actionMark.restoreWidget();
            }
        };

        utilService.prototype.loadAnimation = function (edgeClass) {
            var self = this;

            return self.whilst(function () {
                    return !document.getElementsByClassName(edgeClass).length;
                }, function (err) {
                    if (!err) {
                        try {
                            var fn = window.globalEdges && window.globalEdges[edgeClass].load;
                            fn && fn();
                        } catch (e) {
                            self.$exceptionHandler(e);
                        }
                    }
                },
                self.angularConstants.checkInterval,
                "utilService.loadAnimation." + edgeClass,
                self.angularConstants.renderTimeout
            )
        };

        utilService.prototype.unloadAnimation = function (edgeClass) {
            var self = this;

            try {
                var fn = window.globalEdges && window.globalEdges[edgeClass].unload;
                fn && fn();
                delete window.globalEdges[edgeClass];
            } catch (e) {
                self.$exceptionHandler(e);
            }
        };

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('utilService', utilService);
                }]);
        }
    }
)
;
