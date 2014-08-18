define(
    ["jquery"],
    function () {
        var Common = function () {
            },
            c = new Common();

        Common.prototype.toggleDisplayService = function (element) {
            return function (selector, event) {
                event && event.stopPropagation();

                if (typeof selector == "string")
                    element.find(selector).toggleClass("show");
                else if (typeof selector === "object")
                    $(selector).toggleClass("show");

                return true;
            };
        }

        Common.prototype.toggleSelectService = function (element) {
            return function (selector, event) {
                event && event.stopPropagation();

                if (typeof selector == "string")
                    element.find(selector).toggleClass("select");
                else if (typeof selector === "object")
                    $(selector).toggleClass("select");

                return true;
            };
        }

        Common.prototype.toggleExclusiveSelectService = function (element) {
            return function (selector, event) {
                event && event.stopPropagation();

                if (typeof selector == "string") {
                    element.find(selector).toggleClass("select");
                    element.find(selector).siblings().removeClass("select");
                } else if (typeof selector === "object") {
                    $(selector).toggleClass("select");
                    $(selector).siblings().removeClass("select");
                }

                return true;
            };
        }

        Common.prototype.hasClassService = function (element) {
            return function (selector, clazz) {
                if (typeof selector == "string")
                    return clazz && element.find(selector).hasClass(clazz);
                else if (typeof selector === "object")
                    return clazz && $(selector).toggleClass(clazz);
            };
        }

        Common.prototype.attrService = function (element) {
            return function (selector, attr) {
                if (typeof selector == "string")
                    return attr && element.find(selector).attr(attr);
                else if (typeof selector === "object")
                    return attr && $(selector).toggleClass(attr);
            };
        }

        Common.prototype.selectTabService = function () {
            return function (tabContainer, tabHead, event) {
                event && event.stopPropagation();

                var $tabContainer = $(tabContainer),
                    $tabHead = $(tabHead),
                    index = $tabHead.index();

                if ($tabHead.attr("tab-sel") && !$tabHead.hasClass("select")) {
                    $tabContainer.find("div[tab-sel^=tab].select").removeClass("select");
                    $tabHead.addClass("select");
                    $($tabContainer.find("div[tab-sel^=tab-content]").get(index)).addClass("select");
                }

                return true;
            };
        }

        Common.prototype.prefixedStyle = function (style, format, val) {
            var prefixes = ["-webkit-", "-moz-", "-ms-", "-o-", ""],
                styleObj = {},
                values = Array.prototype.slice.call(arguments, 2);

            prefixes.forEach(function (prefix) {
                styleObj[prefix + style] = String.prototype.format.apply(format, values);
            });

            return styleObj;
        }

        return c;
    }
);