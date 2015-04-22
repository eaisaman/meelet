define(
    ["angular", "jquery"],
    function () {
        return function (appModule) {
            var inject = ["$compile", "$templateCache", "angularConstants"];

            appModule.directive("widgetAnchor", _.union(inject, [function ($compile, $templateCache, angularConstants) {
                'use strict';

                return {
                    restrict: "A",
                    scope: {},
                    replace: false,
                    transclude: false,
                    link: function (scope, element, attrs) {
                        var anchor = attrs.widgetAnchor;
                        if (anchor) {
                            var $parent = element.closest("." + angularConstants.widgetClasses.widgetContainerClass).parent(),
                                widgetId = $parent.attr("id");

                            if (widgetId) {
                                var html = $templateCache.get("Template_" + widgetId),
                                    $html = $(html),
                                    $template = $html.children("[target-anchor='{0}']".format(anchor));

                                $template.appendTo(element);
                                $compile(element.contents())(scope);
                            }
                        }
                    }
                }
            }]));
        }
    }
);