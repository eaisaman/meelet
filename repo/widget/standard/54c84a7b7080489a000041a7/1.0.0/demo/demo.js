define(
    ["angular", "jquery"],
    function () {

        function CreativeLinkDemoController($scope, $rootScope, $timeout, $q) {
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('CreativeLinkDemoController', ["$scope", "$rootScope", "$timeout", "$q", CreativeLinkDemoController]);
        }
    });