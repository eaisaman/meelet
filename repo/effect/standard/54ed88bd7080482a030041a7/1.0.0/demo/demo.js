define(
    ["angular", "jquery"],
    function () {

        function MagicAnimationDemoController($scope, $rootScope, $timeout, $q, utilService) {
            $scope.doAnimation = function (animation) {
                var $el = $("#timing");

                $el.attr("effect", animation);
                utilService.onAnimationEnd($el).then(function () {
                    $el.attr("effect", "");
                });
            }
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('MagicAnimationDemoController', ["$scope", "$rootScope", "$timeout", "$q", "utilService", MagicAnimationDemoController]);
        }
    });