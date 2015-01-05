define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "$parse", "angularEventTypes", "uiUtilService"];

            appModule.directive("uiSideBar", _.union(inject, [function ($http, $timeout, $q, $parse, angularEventTypes, uiUtilService) {
                'use strict';

                var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {
                        /* Valid transitions include 'slideInOnTop', 'reveal', 'slideAlong', 'reverseSlideOut', 'scaleDownPusher',
                         * 'scaleUp', 'scaleRotatePusher', 'openDoor', 'fallDown', 'rotatePusher', 'rotateIn3D', 'rotateOut3D', 'delayed3DRotate'
                         * */
                        transition: "@",
                        side: "@",//Support 'leftSide', 'rightSide'
                        overlay: "@",//Support 'overlay', ''. Whether add overlay shadow when the side bar is open.
                        barContentWidth: "@"//Support px, %, em
                    },
                    replace: true,
                    transclude: true,
                    templateUrl: "include/_sidebar.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs, ctrl) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));
                            },
                            post: function (scope, element, attrs) {
                                scope.hideSideBar = function (event) {
                                    scope.toggleSelect(".sideBarContainer", event, false);
                                }
                            }
                        }
                    }
                }
            }]));
        }
    }
);