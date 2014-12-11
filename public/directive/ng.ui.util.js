define(
    ["angular", "jquery"],
    function () {
        var Util = function ($timeout, $q) {
            this.$timeout = $timeout;
            this.$q = $q;
        };

        Util.$inject = ["$timeout", "$q"];

        Util.prototype.rgbToHsl = function (r, g, b) {
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
        }

        Util.prototype.hue2rgb = function (p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        Util.prototype.hslToRgb = function (h, s, l) {
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
        }

        Util.prototype.toHex = function (decimal) {
            var code = Math.round(decimal).toString(16);

            (code.length > 1) || (code = '0' + code);
            return code;
        }

        Util.prototype.contrastColor = function (hex) {
            var rgbval = parseInt(this.formalizeHex(hex).replace(/#/, ''), 16),
                r = rgbval >> 16,
                g = (rgbval & 65280) >> 8,
                b = rgbval & 255,
                brightness = r * 0.299 + g * 0.587 + b * 0.114;
            return (brightness > 160) ? "#000000" : "#ffffff"
        }

        Util.prototype.lighterColor = function (rgb, percent) {
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
        }

        Util.prototype.hexTorgb = function (hex) {
            hex = hex.replace(/#/, '');
            if (hex.length == 3)
                hex = hex + hex;
            var rgbval = parseInt(hex, 16),
                r = rgbval >> 16,
                g = (rgbval & 65280) >> 8,
                b = rgbval & 255;
            return [r, g, b];
        }

        Util.prototype.hexTohsl = function (hex) {
            var self = this;

            return self.rgbToHsl.apply(self, self.hexTorgb(hex));
        }

        Util.prototype.formalizeHex = function (hex) {
            hex = hex.replace(/#/, '');
            if (hex.length == 3)
                hex = hex + hex;

            return "#" + hex;
        }

        Util.prototype.rgbToHex = function (r, g, b) {
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
        }

        Util.prototype.hslToHex = function (h, s, l) {
            var self = this;

            return self.rgbToHex.apply(self, self.hslToRgb(h, s, l));
        }

        Util.prototype.prefixedStyleValue = function (styleValueFormat, val) {
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
        }

        Util.prototype.prefixedStyle = function (style, format) {
            var styleObj = {};

            if (style && format) {
                var prefixes = ["-webkit-", "-moz-", "-ms-", "-o-", ""],
                    values = Array.prototype.slice.call(arguments, 2);

                prefixes.forEach(function (prefix) {
                    styleObj[prefix + style] = String.prototype.format.apply(format, values);
                });
            }

            return styleObj;
        }

        Util.prototype.getTextMetrics = function (element, size) {
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
        }

        Util.prototype.formalizePixelLength = function (value) {
            if (typeof value === "string") {
                var m = value.match(/([-\d\.]+)(px)?$/);
                if (m && m.length == 3)
                    return m[2] ? value : value + "px";
            } else if (typeof value === "number") {
                if (value >= 0)
                    return value + "px";
            }

            return "0px";
        }

        Util.prototype.formalParameterList = function (fn) {
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
        }

        //Some control may need additional initialization process after scope variable is updated,
        //initMap contains this kind of init function
        Util.prototype.createDirectiveBoundMap = function (boundProperties, attrs, initMap, sourceProps) {
            var boundMap = {};
            initMap = initMap || {}, sourceProps = sourceProps || {};
            for (var key in boundProperties) {
                var prop = attrs[key];
                boundMap[key] = {prop: prop, initFn: initMap[key], source: sourceProps[key]};
            }

            return boundMap;
        }

        Util.prototype.whilst = function (test, iterator, callback, timeout) {
            var self = this,
                defer = self.$q.defer();

            self.$timeout(function () {
                if (test()) {
                    iterator(function (err) {
                        if (err) {
                            callback && callback(err);
                            defer.reject(err);
                        }
                        self.whilst(test, iterator, callback, timeout);
                    });
                }
                else {
                    callback && callback();
                    defer.resolve("DONE");
                }
            }, timeout);

            return defer.promise;
        }

        Util.prototype.once = function (fn, callback, interval) {
            var self = this,
                onceId = fn.onceId;

            if (!onceId)
                return angular.noop;

            self.onceMap = self.onceMap || {};
            self.onceMap[onceId] = self.onceMap[onceId] || {isExecuted: false};
            if (self.onceMap[onceId].isExecuted)
                return angular.noop;
            self.onceMap[onceId].isExecuted = true;

            return function () {
                var args = Array.prototype.slice.call(arguments);

                fn.apply(null, args).then(function () {
                        var callbackArgs = Array.prototype.slice.call(arguments);

                        self.$timeout(
                            function () {
                                callback && callback.apply(null, callbackArgs);

                                delete self.onceMap[onceId];
                            },
                            interval
                        )
                    }
                );
            }
        }

        Util.prototype.latestOnce = function (fn, callback, interval) {
            var self = this,
                onceId = fn.onceId;

            if (!onceId)
                return angular.noop;

            function latestOnceHandler(id) {
                self.$timeout(
                    function () {
                        var fn = self.latestOnceMap[id].fn,
                            callback = self.latestOnceMap[id].callback,
                            args = self.latestOnceMap[id].args,
                            timestamp = self.latestOnceMap[id].timestamp;

                        function block() {
                            callback && callback.apply(null, Array.prototype.slice.call(arguments));

                            if (timestamp == self.latestOnceMap[id].timestamp) {
                                self.latestOnceMap[id].isExecuted = false;

                                delete self.latestOnceMap[id].fn;
                                delete self.latestOnceMap[id].callback;
                                delete self.latestOnceMap[id].timestamp;
                                delete self.latestOnceMap[id].args;
                            } else {
                                latestOnceHandler(id);
                            }
                        }

                        fn.apply(null, args).then(block, block);
                    }, interval
                );
            }

            return function () {
                var args = Array.prototype.slice.call(arguments);

                self.latestOnceMap = self.latestOnceMap || {};
                self.latestOnceMap[onceId] = self.latestOnceMap[onceId] || {isExecuted: false};
                self.latestOnceMap[onceId].fn = fn;
                self.latestOnceMap[onceId].callback = callback;
                self.latestOnceMap[onceId].timestamp = new Date().getTime();
                self.latestOnceMap[onceId].args = args;

                if (!self.latestOnceMap[onceId].isExecuted) {
                    self.latestOnceMap[onceId].isExecuted = true;

                    latestOnceHandler(onceId);
                }
            };
        }

        Util.prototype.createEditableStyleObject = function (styleObj) {
            var self = this,
                styleObjArr,
                editableArr = [];

            if (toString.call(styleObj) === '[object Object]')
                styleObjArr = [styleObj];
            else if (toString.call(styleObj) === '[object Array]')
                styleObjArr = styleObj;

            styleObjArr && styleObjArr.forEach(function (value) {
                var editable = _.clone(value);

                editable.pseudo = editable.pseudo || "";

                //transform
                if (editable.transform) {
                    self.tailorCssPrefix(editable, "transform");
                    var editableTransformArr = [],
                        transformStrArr = editable.transform.split(" ");
                    transformStrArr && transformStrArr.forEach(function (str) {
                        var m = str.match(/(.+)\((.*)\)/);
                        if (m && m.length == 3) {
                            editableTransformArr.push({name: m[1], value: m[2] || ""});
                        }
                    });
                    editable.transform = editableTransformArr;
                }

                //transform-origin
                if (editable["transform-origin"]) {
                    self.tailorCssPrefix(editable, "transform-origin");
                }

                //box-shadow
                if (editable["box-shadow"]) {
                    var boxShadowStr = editable["box-shadow"],
                        shadowStopStrArr = boxShadowStr.split(","),
                        shadowStopList = [],
                        stopAttrs = ["h-shadow", "v-shadow", "blur", "spread", "inset"];

                    shadowStopStrArr.forEach(function (shadowStopStr) {
                        var shadowStop = {},
                            stopValues = shadowStopStr.split(" "),
                            i = 0;

                        stopValues.forEach(function (v) {
                            if (v) {
                                if (v !== "inset")
                                    shadowStop[stopAttrs[i++]] = v;
                                else
                                    shadowStop['inset'] = v;
                            }
                        });

                        !_.isEmpty(shadowStop) && shadowStopList.push(shadowStop);
                    });

                    editable["box-shadow"] = shadowStopList;
                }

                //text-shadow
                if (editable["text-shadow"]) {
                    var textShadowStr = editable["text-shadow"],
                        shadowStopStrArr = textShadowStr.split(","),
                        shadowStopList = [],
                        stopAttrs = ["h-shadow", "v-shadow", "blur"];

                    shadowStopStrArr.forEach(function (shadowStopStr) {
                        var shadowStop = {},
                            stopValues = shadowStopStr.split(" "),
                            i = 0;

                        stopValues.forEach(function (v) {
                            if (v) {
                                shadowStop[stopAttrs[i++]] = v;
                            }
                        });

                        !_.isEmpty(shadowStop) && shadowStopList.push(shadowStop);
                    });

                    editable["text-shadow"] = shadowStopList;
                }

                //gradientColor
                if (editable.background) {
                    var colorObj;

                    if (toString.call(editable.background) === '[object Array]') {
                        editable.background.every(function (styleValue) {
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
                                            colorStopList.push({
                                                percent: parseInt(s[2]),
                                                color: color
                                            });
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
                        });
                    } else if (typeof editable.background === "string") {
                        colorObj = {
                            angle: 0,
                            colorStopList: [
                                {
                                    percent: 0,
                                    color: editable.background,
                                    minPercent: 0,
                                    maxPercent: 100
                                }
                            ]
                        };
                    }

                    editable.background = colorObj;
                }

                editableArr.push(editable);
            });

            return editableArr;
        }

        Util.prototype.tailorCssPrefix = function (styleObj, style) {
            if (style && styleObj) {
                var prefixes = ["-webkit-", "-moz-", "-ms-", "-o-"];

                prefixes.forEach(function (prefix) {
                    delete styleObj[prefix + style];
                });
            }
        }

        Util.prototype.composeCssStyle = function (styleName, styleValue) {
            var self = this,
                styleObj = {};

            if (styleName === "transform") {
                var transformStyle = {},
                    arr;

                if (styleValue != null) {
                    if (toString.call(styleValue) === '[object Object]')
                        arr = [styleValue]
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
                            var str = "{0} {1} {2} {3} {4} {5}".format(item.color || "", item["h-shadow"] || "", item["v-shadow"] || "", item["blur"] || "", item["spread"] || "", item["inset"] || "").trim();
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
                            var str = "{0} {1} {2} {3}".format(item.color || "", item["h-shadow"] || "", item["v-shadow"] || "", item["blur"] || "").trim();
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
                            webkitStops.push("color-stop({1}%, {0})".format(colorStop.color, colorStop.percent));
                            stops.push("{0} {1}%".format(colorStop.color, colorStop.percent));
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
                        styleObj = {"background": styleValue.colorStopList[0].color || ""};
                    }
                } else {
                    styleObj = {"background": ""};
                }
            } else {
                styleObj[styleName] = styleValue || "";
            }

            return styleObj;
        }

        Util.prototype.hasParentClass = function (element, classname) {
            var self = this;

            if (element === document) return false;

            return $(element).hasClass(classname) || (element.parentNode && self.hasParentClass(element.parentNode, classname));
        }

        Util.prototype.mobileCheck = function () {
            var check = false;
            (function (a) {
                if (/(android|ipad|playbook|silk|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))check = true
            })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        }

        Util.prototype.eventType = function () {
            return this.mobileCheck() ? 'touchstart' : 'click';
        }

        Util.prototype.onAnimationEnd = function (target) {
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

        Util.prototype.onTransitionEnd = function (target) {
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
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('uiUtilService', Util);
                }]);
        };
    }
);