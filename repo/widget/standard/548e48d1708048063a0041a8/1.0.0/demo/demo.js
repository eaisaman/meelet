define(
    ["angular", "jquery"],
    function () {

        function DemoController($scope, $rootScope, $timeout, $q) {

            $scope.doTransition = function (transition, event) {
                if (transition) {
                    $scope.demoTransition = transition;
                }

                $timeout(function () {
                    var scope = angular.element($("#demoArea ._widget_sideBarContainer")[0]).scope();
                    scope.toggleSideBar(event);
                });
            }

            $scope.side = "leftSide";
            $scope.demoTransition = "slideInOnTop"
        }

        return function ($compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('DemoController', ["$scope", "$rootScope", "$timeout", "$q", DemoController]);
        }
    });