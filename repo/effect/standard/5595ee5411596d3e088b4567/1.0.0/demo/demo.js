define(
    ["angular", "jquery", "velocity", "velocity.ui"],
    function () {

        function VelocityAnimationDemoController($scope, $rootScope, $timeout, $q, uiUtilService) {
            $scope.doAnimation = function (effect) {
                var $el = $("#timing");

                $el.velocity(effect);
            }
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('VelocityAnimationDemoController', ["$scope", "$rootScope", "$timeout", "$q", "uiUtilService", VelocityAnimationDemoController]);
        }
    });