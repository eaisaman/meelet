define(
    ["angular", "jquery"],
    function () {
        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            var inject = ["$http", "$timeout", "$q", "$parse", "angularEventTypes", "uiUtilService"],
                name = "uiWidgetSideBar",
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
                             * Valid states include '*', 'select'.
                             */
                            state: "@",
                            /* Valid transitions include 'slideInOnTop', 'reveal', 'slideAlong', 'reverseSlideOut', 'scaleDownPusher',
                             * 'scaleUp', 'scaleRotatePusher', 'openDoor', 'fallDown', 'rotatePusher', 'rotateIn3D', 'rotateOut3D', 'delayed3DRotate'
                             * */
                            transition: "=?",
                            side: "=?",//Support 'leftSide', 'rightSide'
                            overlay: "=?",//Support 'overlay', ''. Whether add overlay shadow when the side bar is open.
                            barContentWidth: "=?"//Support px, %, em
                        },
                        replace: true,
                        transclude: true,
                        templateUrl: (directiveUrl || "") + "/include/_widget_sidebar.html",
                        compile: function (element, attrs) {
                            return {
                                pre: function (scope, element, attrs, ctrl) {
                                    extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                        element: element,
                                        scope: scope
                                    }));

                                    scope.toggleSideBar = function (event) {
                                        scope.toggleSelect("._widget_sideBarContainer", event);
                                    }

                                    scope.hideSideBar = function (event) {
                                        scope.toggleSelect("._widget_sideBarContainer", event, false);
                                    }

                                    scope.$watch("state", function (value) {
                                        if (value != null) {
                                            scope.toggleSelect("._widget_sideBarContainer", null, value === "select");
                                        }

                                    });

                                    scope.transition = "slideInOnTop";
                                    scope.side = "leftSide";
                                    scope.overlay = "overlay";
                                    scope.barContentWidth = "300px";
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