define(
    ["angular", "jquery"],
    function () {

        function CreativeLinkDemoController($scope, $rootScope, $timeout, $q) {
            $rootScope.bracketsEffect = "brackets";
            $rootScope.slideUpLineEffect = "slideUpLine";
            $rootScope.slideDownLineEffect = "slideDownLine";
            $rootScope.slideUpSecondLineEffect = "slideUpSecondLine";
            $rootScope.translateLineEffect = "translateLine";
            $rootScope.slightTranslateLineEffect = "slightTranslateLine";
            $rootScope.revealEffect = "reveal";
            $rootScope.switchLineEffect = "switchLine";
            $rootScope.scaleDownEffect = "scaleDown";
            $rootScope.fallDownEffect = "fallDown";
            $rootScope.fadeOutEffect = "fadeOut";
            $rootScope.flipUpEffect = "flipUp";
            $rootScope.slightTranslateEffect = "slightTranslate";
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('CreativeLinkDemoController', ["$scope", "$rootScope", "$timeout", "$q", CreativeLinkDemoController]);
        }
    });