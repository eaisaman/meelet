define(
    ["angular", "jquery"],
    function () {
        var Extension = function () {
            },
            e = new Extension();

        Extension.prototype.attach = function (bindObj, injectObj) {
            var self = this,
                uiUtilService = injectObj.uiUtilService;

            for (var name in self) {
                var fn = self[name];
                if (typeof fn === "function") {
                    var m = name.match(/(\w+)Service$/);
                    if (m && m.length == 2) {
                        var argNames = uiUtilService.formalParameterList(fn),
                            args = []

                        argNames.forEach(function (argName) {
                            args.push(injectObj[argName]);
                        });
                        bindObj[m[1]] = fn.apply(null, args);
                    }
                }
            }
        }

        Extension.prototype.toggleExpandService = function (element, $q, $timeout, uiUtilService) {
            return function (selector, event) {
                event && event.stopPropagation && event.stopPropagation();

                var $el, defer = $q.defer();

                if (typeof selector == "string")
                    $el = element.find(selector);
                else if (typeof selector === "object")
                    $el = selector.jquery && selector || $(selector);
                else
                    $el = element;

                if ($el.hasClass("expanded")) {
                    $el.removeClass("expanded");
                    $el.addClass("collapsing");
                    if (!$el.css("animation-name") || $el.css("animation-name") === "none") {
                        $timeout(function () {
                            $el.removeClass("collapsing");
                            defer.resolve(selector);
                        });
                    } else {
                        uiUtilService.onAnimationEnd($el).then(
                            function () {
                                $el.removeClass("collapsing");
                                defer.resolve(selector);
                            }
                        );
                    }
                } else {
                    $el.addClass("expanded");

                    if (!$el.css("animation-name") || $el.css("animation-name") === "none") {
                        $timeout(function () {
                            defer.resolve(selector);
                        });
                    } else {
                        uiUtilService.onAnimationEnd($el).then(
                            function () {
                                defer.resolve(selector);
                            }
                        );
                    }
                }

                return defer.promise;
            };
        }

        Extension.prototype.toggleDisplayService = function (element, $q, $timeout, uiUtilService) {
            return function (selector, event) {
                event && event.stopPropagation && event.stopPropagation();

                var $el, defer = $q.defer();

                if (typeof selector == "string")
                    $el = element.find(selector);
                else if (typeof selector === "object")
                    $el = selector.jquery && selector || $(selector);
                else
                    $el = element;

                if ($el.hasClass("show")) {
                    $el.removeClass("show");
                    $el.addClass("hiding");

                    if (!$el.css("animation-name") || $el.css("animation-name") === "none") {
                        $timeout(function () {
                            $el.removeClass("hiding");
                            defer.resolve(selector);
                        });
                    } else {
                        uiUtilService.onAnimationEnd($el).then(
                            function () {
                                $el.removeClass("hiding");
                                defer.resolve(selector);
                            }
                        );
                    }
                } else {
                    $el.addClass("show");

                    if (!$el.css("animation-name") || $el.css("animation-name") === "none") {
                        $timeout(function () {
                            defer.resolve(selector);
                        });
                    } else {
                        uiUtilService.onAnimationEnd($el).then(
                            function () {
                                defer.resolve(selector);
                            }
                        );
                    }
                }

                return defer.promise;
            };
        }

        Extension.prototype.toggleEnableControlService = function (element, $q, $timeout, uiUtilService) {
            return function (selector, event) {
                event && event.stopPropagation && event.stopPropagation();

                var $el, defer = $q.defer();

                if (typeof selector == "string")
                    $el = element.find(selector);
                else if (typeof selector === "object")
                    $el = selector.jquery && selector || $(selector);
                else
                    $el = element;

                $el.toggleClass("enable");
                if (!$el.css("animation-name") || $el.css("animation-name") === "none") {
                    $timeout(function () {
                        defer.resolve($el.hasClass("enable"));
                    });
                } else {
                    uiUtilService.onAnimationEnd($el).then(
                        function () {
                            defer.resolve($el.hasClass("enable"));
                        }
                    );
                }

                return defer.promise;
            };
        }

        Extension.prototype.enableControlService = function (element, $q, $timeout, uiUtilService) {
            return function (selector, event) {
                event && event.stopPropagation && event.stopPropagation();

                var $el, defer = $q.defer();

                if (typeof selector == "string")
                    $el = element.find(selector);
                else if (typeof selector === "object")
                    $el = selector.jquery && selector || $(selector);
                else
                    $el = element;

                $el.addClass("enable");
                if (!$el.css("animation-name") || $el.css("animation-name") === "none") {
                    $timeout(function () {
                        defer.resolve();
                    });
                } else {
                    uiUtilService.onAnimationEnd($el).then(
                        function () {
                            defer.resolve();
                        }
                    );
                }

                return defer.promise;
            };
        }

        Extension.prototype.disableControlService = function (element, $q, $timeout, uiUtilService) {
            return function (selector, event) {
                event && event.stopPropagation && event.stopPropagation();

                var $el, defer = $q.defer();

                if (typeof selector == "string")
                    $el = element.find(selector);
                else if (typeof selector === "object")
                    $el = selector.jquery && selector || $(selector);
                else
                    $el = element;

                $el.removeClass("enable");
                if (!$el.css("animation-name") || $el.css("animation-name") === "none") {
                    $timeout(function () {
                        defer.resolve();
                    });
                } else {
                    uiUtilService.onAnimationEnd($el).then(
                        function () {
                            defer.resolve();
                        }
                    );
                }

                return defer.promise;
            };
        }

        Extension.prototype.toggleSelectService = function (element, $q, $timeout, uiUtilService) {
            return function (selector, event) {
                event && event.stopPropagation && event.stopPropagation();

                var $el, defer = $q.defer();

                if (typeof selector == "string")
                    $el = element.find(selector);
                else if (typeof selector === "object")
                    $el = selector.jquery && selector || $(selector);
                else
                    $el = element;

                $el.toggleClass("select");
                if (!$el.css("animation-name") || $el.css("animation-name") === "none") {
                    $timeout(function () {
                        defer.resolve(selector);
                    });
                } else {
                    uiUtilService.onAnimationEnd($el).then(
                        function () {
                            defer.resolve(selector);
                        }
                    );
                }

                return defer.promise;
            };
        }

        Extension.prototype.toggleExclusiveSelectService = function (element, $q, $timeout, uiUtilService) {
            return function (selector, event) {
                event && event.stopPropagation && event.stopPropagation();

                var $el, defer = $q.defer();

                if (typeof selector === "string")
                    $el = element.find(selector);
                else if (typeof selector === "object")
                    $el = selector.jquery && selector || $(selector);
                else
                    $el = element;

                $el.toggleClass("select");
                if (!$el.css("animation-name") || $el.css("animation-name") === "none") {
                    $timeout(function () {
                        $el.siblings().removeClass("select");
                        defer.resolve();
                    });
                } else {
                    uiUtilService.onAnimationEnd($el).then(
                        function () {
                            $el.siblings().removeClass("select");
                            defer.resolve();
                        }
                    );
                }

                return defer.promise;
            };
        }

        Extension.prototype.selectTabService = function ($q, $timeout, uiUtilService) {
            return function ($tabContainer, $tabHead, event, content) {
                event && event.stopPropagation && event.stopPropagation();

                var $el, defer = $q.defer();

                $tabContainer = $tabContainer.jquery && $tabContainer || $($tabContainer);
                $tabHead = $tabHead.jquery && $tabHead || $($tabHead);
                content = content || $tabHead.attr("tab-content");

                var index = $tabHead.index();

                if ($tabHead.attr("tab-sel") && !$tabHead.hasClass("select")) {
                    content = content && ("-" + content);
                    $el = $($tabContainer.find("div[tab-sel^=tab-content" + content + "]").get(index));
                    $tabContainer.find("div[tab-sel^=tab-head" + content + "].select").removeClass("select");
                    $tabContainer.find("div[tab-sel^=tab-content" + content + "].select").removeClass("select");

                    $el.addClass("select");

                    if (!$el.css("animation-name") || $el.css("animation-name") === "none") {
                        $timeout(function () {
                            $tabHead.addClass("select");
                            defer.resolve();
                        });
                    } else {
                        uiUtilService.onAnimationEnd($el).then(
                            function () {
                                $tabHead.addClass("select");
                                defer.resolve();
                            }
                        );
                    }
                } else {
                    $timeout(function () {
                        defer.resolve();
                    });
                }

                return defer.promise;
            };
        }

        Extension.prototype.hasClassService = function (element) {
            return function (selector, clazz) {
                if (typeof selector == "string")
                    return clazz && element.find(selector).hasClass(clazz);
                else if (typeof selector === "object")
                    return clazz && $(selector).hasClass(clazz);
            };
        }

        Extension.prototype.attrService = function (element) {
            return function (selector, attr) {
                if (typeof selector == "string")
                    return attr && element.find(selector).attr(attr);
                else if (typeof selector === "object")
                    return attr && $(selector).attr(attr);
            };
        }

        Extension.prototype.isLengthyService = function () {
            return function (value) {
                if (typeof value === "string") {
                    var m = value.match(/([-\d\.]+)(px)?$/);
                    if (m && m.length == 3) value = parseFloat(m[1]);

                    return value > 0;
                } else if (typeof value === "number") {
                    return value > 0;
                } else return false;
            }
        }

        Extension.prototype.parseLengthService = function () {
            return function (value) {
                if (typeof value === "string") {
                    var m = value.match(/([-\d\.]+)(px)?$/);
                    if (m && m.length == 3) value = parseFloat(m[1]);

                    return value;
                } else if (typeof value === "number") {
                    return value;
                } else return 0;
            }
        }

        Extension.prototype.prefixedStyleService = function () {
            return function (style, format) {
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
        }

        Extension.prototype.composeTextShadowCssService = function () {
            return function (value) {
                var arr = [];

                if (value && toString.call(value) === '[object Array]') {
                    value.forEach(function (item) {
                        var str = "{0} {1} {2} {3}".format(item.color || "", item["h-shadow"] || "", item["v-shadow"] || "", item["blur"] || "").trim();
                        str && arr.push(str);
                    });
                }

                return arr.length && {"text-shadow": arr.join(",")} || {};
            }
        }

        Extension.prototype.composeBoxShadowCssService = function (uiUtilService) {
            return function (styles, id) {
                if (styles && id) {
                    var styleBlockArr = [];

                    ["style", "beforeStyle", "afterStyle"].forEach(function (pseudoStylePrefix) {
                        var pseudo = pseudoStylePrefix.replace(/style/i, "");
                        if (pseudo)
                            pseudo = ":" + pseudo;

                        var s = styles[pseudoStylePrefix];

                        if (s) {
                            var styleArr = [];
                            _.each(s, function (styleValue, styleName) {
                                var styleObj = uiUtilService.composeCssStyle(styleName, styleValue);

                                _.each(styleObj, function (value, key) {
                                    styleArr.push("{0}:{1}".format(key, value || '\"\"'));
                                });
                            });

                            styleArr.length && styleBlockArr.push("#{0}{1} { {2}; }".format(id, pseudo || "", styleArr.join(";")));
                        }
                    });

                    return styleBlockArr.join(" ");
                }

                return "";
            }
        }

        Extension.prototype.generateBoxShadowStyleService = function (uiUtilService) {
            return function (groups) {
                var ret = [];

                if (groups && toString.call(groups) === '[object Array]') {
                    groups.forEach(function (group) {
                        group.list && toString.call(group.list) === '[object Array]' && group.list.forEach(function (styles) {
                            var styleBlockArr = [],
                                id = "boxShadow-" + styles.id;

                            ["style", "beforeStyle", "afterStyle"].forEach(function (pseudoStylePrefix) {
                                var pseudo = pseudoStylePrefix.replace(/style/i, "");
                                if (pseudo)
                                    pseudo = ":" + pseudo;

                                var s = styles[pseudoStylePrefix];

                                if (s) {
                                    var styleArr = [];
                                    _.each(s, function (styleValue, styleName) {
                                        var styleObj = uiUtilService.composeCssStyle(styleName, styleValue);

                                        _.each(styleObj, function (value, key) {
                                            styleArr.push("{0}:{1}".format(key, value || '\"\"'));
                                        });
                                    });

                                    styleArr.length && styleBlockArr.push("#{0}{1} { {2}; }".format(id, pseudo || "", styleArr.join(";")));
                                }
                            });

                            styleBlockArr.length && ret.push(styleBlockArr.join(" "));
                        });
                    });
                }

                return ret.join(" ");
            }
        }

        Extension.prototype.composePseudoElementCssService = function (uiUtilService) {
            return function (widgets) {
                var ret = [];

                if (widgets && toString.call(widgets) === '[object Array]') {
                    widgets.forEach(function (widget) {
                        var id = widget.id;
                        if (id && widget.pseudoCss) {
                            var beforeStyle = widget.pseudoCss("before").beforeStyle,
                                afterStyle = widget.pseudoCss("after").afterStyle;

                            if (beforeStyle) {
                                var beforeStyleArr = [];
                                _.each(beforeStyle, function (styleValue, styleName) {
                                    var styleObj = uiUtilService.composeCssStyle(styleName, styleValue);

                                    _.each(styleObj, function (value, key) {
                                        beforeStyleArr.push("{0}:{1}".format(key, value || '\"\"'));
                                    });
                                });
                                beforeStyleArr.length && ret.push("#{0}:before { {1}; }".format(id, beforeStyleArr.join(";")));
                            }

                            if (afterStyle) {
                                var afterStyleArr = [];
                                _.each(afterStyle, function (styleValue, styleName) {
                                    var styleObj = uiUtilService.composeCssStyle(styleName, styleValue);

                                    _.each(styleObj, function (value, key) {
                                        afterStyleArr.push("{0}:{1}".format(key, value || '\"\"'));
                                    });
                                });
                                afterStyleArr.length && ret.push("#{0}:after { {1}; }".format(id, afterStyleArr.join(";")));
                            }
                        }
                    });
                }

                return ret.join(" ");
            }
        }

        Extension.prototype.hasStyleService = function () {
            return function (styles) {
                return !(_.isEmpty(styles) || (_.isEmpty(styles.style) && _.isEmpty(styles.beforeStyle) && _.isEmpty(styles.afterStyle)));
            }
        }

        Extension.prototype.pickStyleService = function () {
            return function (styles, pseudo) {
                var pseudoStylePrefix = (pseudo || "") + "Style";
                pseudoStylePrefix = pseudoStylePrefix.charAt(0).toLowerCase() + pseudoStylePrefix.substr(1);

                return styles && styles[pseudoStylePrefix] || {};
            }
        }

        return e;
    }
);