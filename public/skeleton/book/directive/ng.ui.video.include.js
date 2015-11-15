define(
    ["angular", "jquery"],
    function () {
        return function (appModule) {
            var inject = ["$parse", "$compile"],
                directiveName = "uiVideoInclude";

            appModule.directive(directiveName, _.union(inject, [function ($parse, $compile) {
                'use strict';

                return {
                    restrict: "A",
                    scope: {
                        base: "@"
                    },
                    replace: true,
                    transclude: false,
                    link: function (scope, element, attr) {
                        attr.$observe(directiveName, function (value) {
                            var relativeUrl = $parse(value)(scope) || "",
                                includeElement = document.createElement("video");

                            includeElement.setAttribute("src", "{0}{1}".format(scope.base||scope.$root.APP_PROJECT_PATH||"", relativeUrl));
                            includeElement.setAttribute("controls", "controls");

                            element.replaceWith(includeElement);
                        });
                    }
                }
            }]));
        }
    }
);
