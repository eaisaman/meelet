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
                    uiUtilService.onAnimationEnd($el).then(
                        function () {
                            $el.removeClass("hiding");
                            defer.resolve();
                        }
                    );
                } else {
                    $el.addClass("show");
                    uiUtilService.onAnimationEnd($el).then(
                        function () {
                            defer.resolve();
                        }
                    );
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

                    uiUtilService.onAnimationEnd($el).then(
                        function () {
                            $tabHead.addClass("select");
                            defer.resolve();
                        }
                    );
                    $el.addClass("select");
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

        return e;
    }
);