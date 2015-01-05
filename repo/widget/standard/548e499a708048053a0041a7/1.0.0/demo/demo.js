define(
    ["angular", "jquery"],
    function () {

        function ModalWindowDemoController($scope, $rootScope, $timeout, $q) {

            $scope.doTransition = function (transition, event) {
                var $el = $(event.target),
                    $container = $el.closest("[ui-widget-modal-window-1-0-0]"),
                    $md = $container.find(".md-modal");

                if (transition) {
                    $scope.demoTransition = transition;
                }

                $timeout(function () {
                    var scope = angular.element($md).scope();
                    scope.toggleModalWindow(event);
                });
            }

            $scope.demoTransition = "fadeInScaleUp"
        }

        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            $controllerProvider.
                register('ModalWindowDemoController', ["$scope", "$rootScope", "$timeout", "$q", ModalWindowDemoController]);
        }
    });