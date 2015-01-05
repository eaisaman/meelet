define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "$parse", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiModalWindow", _.union(inject, [function ($http, $timeout, $q, $parse, angularEventTypes, uiUtilService) {
                'use strict';

                var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                        /**
                         * Valid transitions include 'fadeInScaleUp', 'slideFromRight', 'slideFromBottom', 'newspaper', 'fall', 'sideFall',
                         * 'slideStickTop', 'flipHorizontal3D', 'flipVertical3D', 'sign3D', 'superScaled', 'justMe', 'slit3D', 'rotateFromBottom3D',
                         * 'rotateFromLeft3D', 'blur', 'slideFromBottomPerspective', 'slideFromRightPerspective', 'slipFromTopPerspective'
                         */
                        transition: "@",
                        setPerspective: "@" //Support true, false. Special modal that will add a perspective class to the html element.
                    },
                    replace: true,
                    transclude: true,
                    templateUrl: "include/_modal_window.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs, ctrl) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));
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