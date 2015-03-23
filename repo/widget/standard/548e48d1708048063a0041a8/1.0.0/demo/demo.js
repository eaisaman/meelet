define(
    ["angular", "jquery"],
    function () {

        function SidebarDemoController($templateCache, $compile, $scope, $rootScope, $timeout, $q) {

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


            $timeout(function () {
                var $container = $(".widgetDemoContainer [ui-widget-side-bar-1-0-0]"),
                    $bar = $container.find("._widget_sideBarContainer"),
                    $mainContent = $bar.find(".mainContent"),
                    $barContent = $bar.find(".barContent"),
                    mainContent = $templateCache.get("_sidebarDemoMainContent.html"),
                    barContent = $templateCache.get("_sidebarDemoBarContent.html");

                $mainContent.append($(mainContent));
                $barContent.append($(barContent));

                $compile($mainContent)($scope);
                $compile($barContent)($scope);
            }, 100);

            $scope.side = "leftSide";
            $scope.demoTransition = "slideInOnTop"
            $scope.overlay = "overlay"
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('SidebarDemoController', ["$templateCache", "$compile", "$scope", "$rootScope", "$timeout", "$q", SidebarDemoController]);
        }
    });