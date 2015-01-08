define(
    ["angular", "jquery"],
    function () {

        function SidebarDemoController($scope, $rootScope, $timeout, $q) {

            $scope.doTransition = function (transition, event) {
                var $el = $(event.target),
                    $container = $el.closest("[ui-widget-side-bar-1-0-0]"),
                    $bar = $container.find("._widget_sideBarContainer");

                if (transition) {
                    $scope.demoTransition = transition;
                }

                $timeout(function () {
                    var scope = angular.element($bar).scope();
                    scope.toggleSideBar(event);
                });
            }

            $scope.side = "leftSide";
            $scope.demoTransition = "slideInOnTop"
            $scope.contentWidth = "300px"
            $scope.overlay = "overlay"
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('SidebarDemoController', ["$scope", "$rootScope", "$timeout", "$q", SidebarDemoController]);
        }
    });