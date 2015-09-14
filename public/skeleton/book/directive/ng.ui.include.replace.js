define(
    ["angular", "jquery"],
    function () {
        return function (appModule) {
            var inject = ["angularConstants", "uiUtilService"];

            appModule.directive("uiIncludeReplace", _.union(inject, [function (angularConstants, uiUtilService) {
                'use strict';

                return {
	                require: 'ngInclude',
                    restrict: "A",
                    scope: {},
                    replace: true,
                    transclude: false,
                    link: function (scope, element, attrs) {
                        element.replaceWith(element.children());
                    }
                }
            }]));
        }
    }
);