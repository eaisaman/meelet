define(
    ["angular", "jquery", "jquery-ui", "app-route", "app-service"],
    function () {
        function RootController($scope, $rootScope, $q, appService, urlService) {
        }

        return function (appModule) {
            if (isBrowser) {
                appModule.
                    controller('RootController', ["$scope", "$rootScope", "$q", "appService", "urlService", RootController]);
            }
        }
    }
);