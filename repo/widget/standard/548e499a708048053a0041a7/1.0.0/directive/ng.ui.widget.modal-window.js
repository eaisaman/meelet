define(
    ["angular", "jquery"],
    function () {
        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            var inject = ["$http", "$timeout", "$q", "$parse", "angularEventTypes", "uiUtilService"],
                name = "uiWidgetModalWindow",
                version = "1.0.0",
                directive = name + version.replace(/\./g, ""),
                directiveService = name + version.replace(/\./g, "") + "Directive";

            if (!$injector.has(directiveService)) {
                $compileProvider.directive(directive, _.union(inject, [function ($http, $timeout, $q, $parse, angularEventTypes, uiUtilService) {
                    'use strict';

                    var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                    return {
                        restrict: "A",
                        scope: {
                            /**
                             * Valid states include '*', 'show'.
                             */
                            state: "@",
                            /**
                             * Valid transitions include 'fadeInScaleUp', 'slideFromRight', 'slideFromBottom', 'newspaper', 'fall', 'sideFall',
                             * 'slideStickTop', 'flipHorizontal3D', 'flipVertical3D', 'sign3D', 'superScaled', 'justMe', 'slit3D', 'rotateFromBottom3D',
                             * 'rotateFromLeft3D', 'blur', 'slideFromBottomPerspective', 'slideFromRightPerspective', 'slipFromTopPerspective'
                             */
                            transition: "=?",
                            setPerspective: "=?" //Support true, false. Special modal that will add a perspective class to the html element.
                        },
                        replace: true,
                        transclude: true,
                        templateUrl: (directiveUrl || "") + "/include/_widget_modal_window.html",
                        compile: function (element, attrs) {
                            return {
                                pre: function (scope, element, attrs, ctrl) {
                                    extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                        element: element,
                                        scope: scope
                                    }));

                                    scope.toggleModalWindow = function (event) {
                                        return scope.toggleDisplay('.md-modal', event);
                                    }

                                    scope.$watch("state", function (value) {
                                        if (value != null) {
                                            scope.toggleDisplay('.md-modal', null, value === "show");
                                        }
                                    });

                                    scope.transition = "fadeInScaleUp";
                                    scope.setPerspective = false;
                                    scope.modalContentWidth = "50%";
                                    scope.modalContentHeight = "50%";
                                },
                                post: function (scope, element, attrs) {
                                }
                            }
                        }
                    }
                }]));
            }
        }
    }
);