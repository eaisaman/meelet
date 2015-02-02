define(
    ["angular", "jquery"],
    function () {
        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            var inject = ["$http", "$timeout", "$q", "$parse", "$compile", "angularConstants", "angularEventTypes", "uiUtilService"],
                name = "uiWidgetCreativeLink",
                version = "1.0.0",
                directive = name + version.replace(/\./g, ""),
                directiveService = name + version.replace(/\./g, "") + "Directive";

            if (!$injector.has(directiveService)) {
                $compileProvider.directive(directive, _.union(inject, [function ($http, $timeout, $q, $parse, $compile, angularConstants, angularEventTypes, uiUtilService) {
                    'use strict';

                    var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                    return {
                        restrict: "A",
                        scope: {
                            /**
                             * Valid states include '*', '{{activeState}}'.
                             */
                            state: "@",
                            /**
                             * Valid effect values include 'brackets', 'slideUpLine', 'slideDownLine', 'slideUpSecondLine',
                             * 'translateLine', 'slightTranslateLine', 'reveal', 'switchLine',
                             * 'scaleDown', 'fallDown', 'fadeOut', 'flipUp', 'slightTranslate'
                             */
                            effect: "@",
                            activeState: "@"
                        },
                        replace: true,
                        transclude: true,
                        templateUrl: (directiveUrl || "") + "/include/_widget_creative_link.html",
                        compile: function (element, attrs) {
                            return {
                                pre: function (scope, element, attrs, ctrl) {
                                    extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                        element: element,
                                        scope: scope
                                    }));

                                    scope.toggleState = function (event) {
                                        event && event.stopPropagation && event.stopPropagation();

                                        scope.state = scope.state === scope.activeState && "*" || scope.activeState;
                                    }
                                },
                                post: function (scope, element, attrs, ctrl) {
                                }
                            }
                        }
                    }
                }]));
            }
        }
    }
);