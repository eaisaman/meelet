define(
    ["angular", "jquery"],
    function () {

        function DemoController($scope, $rootScope, $timeout, $q) {

            $scope.doTransition = function (transition, event) {
                if (transition) {
                    $scope.demoTransition = transition;
                }

                $timeout(function () {
                    var scope = angular.element($("#demoArea .md-modal")).scope();
                    scope.toggleModalWindow(event);
                });
            }

            $scope.demoTransition = "fadeInScaleUp"
        }

        return function ($compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('DemoController', ["$scope", "$rootScope", "$timeout", "$q", DemoController]);
        }
    });