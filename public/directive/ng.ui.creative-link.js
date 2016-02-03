define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "angularConstants", "angularEventTypes", "utilService"];

            appModule.directive("uiCreativeLink", _.union(inject, [function ($timeout, $q, angularConstants, angularEventTypes, utilService) {
                'use strict';

                var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                        /**
                         * Valid effect values include 'brackets', 'slideUpLine', 'slideDownLine', 'slideUpSecondLine',
                         * 'translateLine', 'slightTranslateLine', 'reveal', 'switchLine',
                         * 'scaleDown', 'fallDown', 'fadeOut', 'flipUp', 'slightTranslate'
                         */
                        effect: "@",
                        onSelect: "&"
                    },
                    replace: true,
                    transclude: true,
                    templateUrl: "/include/_creative_link.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs, ctrl) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));

                                scope.toggleSelectLink = function (state) {
                                    return scope.toggleSelect(element, null, state).then(function () {
                                        if (state && scope.onSelect) scope.onSelect();
                                        return utilService.getResolveDefer();
                                    });
                                }

                                scope.effect = scope.effect || "brackets";
                            },
                            post: function (scope, element, attrs) {
                            }
                        }
                    }
                }
            }]));
        }
    }
);