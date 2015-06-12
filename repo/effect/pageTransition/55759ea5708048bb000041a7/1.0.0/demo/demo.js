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

                    var $current = $(".pt-page.pt-page-current"),
                        $next = $current.next();

                    if (!$next.length) {
                        $next = $current.siblings().eq(0);
                        $next.detach();
                        $next.insertAfter($current);
                    }

                    $current.addClass("forward currentPage");
                    $current.attr("effect", $scope.transitionName);

                    $timeout(function () {
                        $next.addClass("pt-page-current");
                    });

                    $q.all([
                        uiUtilService.onAnimationEnd($current),
                        uiUtilService.onAnimationEnd($next)
                    ]).then(function () {
                        $current.removeClass("pt-page-current forward currentPage");
                        $current.removeAttr("effect");
                        $scope.isAnimating = false;
                    });
                }
            }
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('PageTransitionDemoController', ["$scope", "$rootScope", "$timeout", "$q", "uiUtilService", PageTransitionDemoController]);
        }
    });