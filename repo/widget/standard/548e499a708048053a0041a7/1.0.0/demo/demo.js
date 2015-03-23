define(
    ["angular", "jquery"],
    function () {

        function ModalWindowDemoController($templateCache, $compile, $scope, $rootScope, $timeout, $q) {

            $scope.doTransition = function (transition, event) {
                var $el = $(event.target),
                    $container = $el.closest("[ui-widget-modal-window-1-0-0]"),
                    $md = $container.find("._widget_modalWindowContainer");

                if (transition) {
                    $scope.demoTransition = transition;
                }

                $timeout(function () {
                    var scope = angular.element($md).scope();
                    scope.toggleModalWindow(event);
                });
            }

            $timeout(function () {
                var $container = $(".widgetDemoContainer [ui-widget-modal-window-1-0-0]"),
                    $mainContent = $container.find(".mainContent"),
                    $modalContent = $container.find(".md-modal"),
                    mainContent = $templateCache.get("_modalWindowDemoMainContent.html"),
                    modalContent = $templateCache.get("_modalWindowDemoModalContent.html");

                $mainContent.append($(mainContent));
                $modalContent.append($(modalContent));

                $compile($mainContent)($scope);
                $compile($modalContent)($scope);
            }, 100);

            $scope.demoTransition = "fadeInScaleUp"
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('ModalWindowDemoController', ["$templateCache", "$compile", "$scope", "$rootScope", "$timeout", "$q", ModalWindowDemoController]);
        }
    });