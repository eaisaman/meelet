define(
    ["angular", "jquery"],
    function () {

        function TabDemoController($scope, $rootScope, $timeout, $q) {
            $scope.setTransition = function (transition) {
                $scope.demoTransition = transition;
            }
            $scope.setAlign = function (align) {
                $scope.demoAlign = align;
            }

            $scope.alignList = [{name: "alignLeft"}, {name: "alignRight"}, {name: "alignTop"}, {name: "alignBottom"}];
            $scope.transitions = [
                {
                    name: "MOVE",
                    list: [{name: "moveToLeft"}, {name: "moveToRight"}, {name: "moveToTop"}, {name: "moveToBottom"}]
                },
                {
                    name: "FADE",
                    list: [
                        {name: "fadeToLeft"}, {name: "fadeToRight"}, {name: "fadeToTop"}, {name: "fadeToBottom"},
                        {name: "moveToLeftFade"}, {name: "moveToRightFade"}, {name: "moveToBottomFade"}, {name: "moveToTopFade"}
                    ]
                },
                {
                    name: "SCALE",
                    list: [
                        {name: "moveToLeftScaleDown"}, {name: "moveToRightScaleDown"}, {name: "moveToBottomScaleDown"}, {name: "moveToTopScaleDown"},
                        {name: "scaleUpAtLeft"}, {name: "scaleUpAtRight"}, {name: "scaleUpAtTop"}, {name: "scaleUpAtBottom"}, {name: "scaleUp"}, {name: "scaleUpCenter"}
                    ]
                },
                {
                    name: "ROTATE",
                    list: [
                        {
                            name: "GLUE",
                            list: [{name: "moveToLeftAfterRotation"}, {name: "moveToRightAfterRotation"}, {name: "moveToTopAfterRotation"}, {name: "moveToBottomAfterRotation"}]
                        },
                        {
                            name: "FLIP",
                            list: [{name: "flipInLeftOutRight"}, {name: "flipInRightOutLeft"}, {name: "flipInBottomOutTop"}, {name: "flipInTopOutBottom"}]
                        },
                        {
                            name: "ROOM",
                            list: [{name: "roomToLeft"}, {name: "roomToRight"}, {name: "roomToTop"}, {name: "roomToBottom"}]
                        },
                        {
                            name: "CUBE",
                            list: [{name: "cubeToLeft"}, {name: "cubeToRight"}, {name: "cubeToTop"}, {name: "cubeToBottom"}]
                        },
                        {
                            name: "CAROUSEL",
                            list: [{name: "carouselToLeft"}, {name: "carouselToRight"}, {name: "carouselToTop"}, {name: "carouselToBottom"}]
                        },
                        {name: "sides"}
                    ]
                },
                {name: "fall"}, {name: "newspaper"}, {name: "slide"}
            ];
            $scope.demoTitles = [{name: 'Tab1'}, {name: 'Tab2'}, {name: 'Tab3'}];
            $scope.demoAlign = "alignTop";
            $scope.demoTransition = "newspaper";
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('TabDemoController', ["$scope", "$rootScope", "$timeout", "$q", TabDemoController]);
        }
    });