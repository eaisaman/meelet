define(
    ["angular", "jquery"],
    function () {
        return function (appModule) {

            appModule.controller('uiMultiTranscludeController', ['$scope', '$transclude', function ($scope, $transclude) {
                this.transclude = function (name, element) {
                    $transclude && $transclude(function (clone) {
                        for (var i = 0; i < clone.length; ++i) {
                            var el = angular.element(clone[i]);
                            if (el.attr('name') === name) {
                                element.append(el);
                                return;
                            }
                        }
                    });
                }
            }]);

            appModule.directive('uiMultiTransclude', function () {
                return {
                    controller: "uiMultiTranscludeController",
                    link: function (scope, element, attrs, ctrl) {
                        // Receive transcluded content.
                        ctrl.transclude(attrs.uiMultiTransclude, element);
                    }
                };
            });

        }
    }
);