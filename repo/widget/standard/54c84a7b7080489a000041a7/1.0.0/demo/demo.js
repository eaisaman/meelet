define(
    ["angular", "jquery"],
    function () {

        function CreativeLinkDemoController($scope, $rootScope, $timeout, $q) {

            $scope.toggleState = function (event) {
                var $el = $(event.currentTarget);

                var scope = angular.element($el.find(".ui-widget")).scope();
                scope.toggleState(event);
            }
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('CreativeLinkDemoController', ["$scope", "$rootScope", "$timeout", "$q", CreativeLinkDemoController]);
        }
    });