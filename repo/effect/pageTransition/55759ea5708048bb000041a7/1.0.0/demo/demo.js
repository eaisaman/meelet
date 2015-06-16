define(
    ["angular", "jquery"],
    function () {

        function PageTransitionDemoController($scope, $rootScope, $timeout, $q, uiUtilService) {
            $scope.isAnimating = false;
            $scope.transitionName = "moveToLeft";

            $scope.nextPage = function (transitionName) {
                if ($scope.isAnimating) {
                    return false;
                } else {
                    $scope.isAnimating = true;

                    if (transitionName) {
                        $scope.transitionName = transitionName;
                    }

                    var $current = $(".pt-page.currentPage"),
                        $next = $current.next();

                    if (!$next.length) {
                        $next = $current.siblings().eq(0);
                        $next.detach();
                        $next.insertAfter($current);
                    }

                    $q.all([
                        uiUtilService.onAnimationEnd($current),
                        uiUtilService.onAnimationEnd($next)
                    ]).then(function () {
                        $current.removeClass("forward currentPage");
                        $current.removeAttr("effect");
                        $next.addClass("currentPage");
                        $scope.isAnimating = false;
                    });

                    $current.addClass("forward");
                    $current.attr("effect", $scope.transitionName);
                }
            }
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('PageTransitionDemoController', ["$scope", "$rootScope", "$timeout", "$q", "uiUtilService", PageTransitionDemoController]);
        }
    });