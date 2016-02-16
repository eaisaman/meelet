define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$rootScope", "$http", "$timeout", "$interval", "$q", "$exceptionHandler", "$parse", "$compile", "angularConstants", "angularEventTypes", "appService", "utilService", "uiService"];

            appModule.directive("uiModalWindow", _.union(inject, [function ($rootScope, $http, $timeout, $interval, $q, $exceptionHandler, $parse, $compile, angularConstants, angularEventTypes, appService, utilService, uiService) {
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
                        setPerspective: "@", //Support true, false. Special modal that will add a perspective class to the html element.
                        onWindowClose: '&'
                    },
                    replace: true,
                    transclude: true,
                    templateUrl: "include/_modal_window.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs, ctrl) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    "$timeout": $timeout,
                                    "$interval": $interval,
                                    "$q": $q,
                                    "angularConstants": angularConstants,
                                    "utilService": utilService,
                                    element: element,
                                    scope: scope
                                }));

                                scope.toggleModalWindow = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if ($rootScope.sketchWidgetSetting == null || !$rootScope.sketchWidgetSetting.isPlaying) {
                                        return scope.toggleDisplay('> .md-modal', event).then(function () {
                                            var defer = $q.defer();
                                            $timeout(function () {
                                                if (!element.find("> .md-modal").hasClass("show")) {
                                                    scope.onWindowClose && scope.onWindowClose();
                                                }

                                                defer.resolve();
                                            });

                                            return defer.promise;
                                        });
                                    } else {
                                        return utilService.getResolveDefer();
                                    }
                                }
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