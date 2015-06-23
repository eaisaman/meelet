define(
    ["angular", "jquery", "jquery-ui", "app-route", "app-service"],
    function () {
        return function (appModule, meta) {
            function RootController($scope, $rootScope, $q, appService, urlService, utilService) {
                $rootScope.initFns = [];

                $rootScope.initFns.forEach(function(fn) {fn.apply($rootScope)});

                $rootScope.pickedPage = meta.locations[0];
                $scope.nextPage = function(event) {
                    event && event.stopPropagation();
                    utilService.nextPage($rootScope.pickedPage);
                }
                $scope.prevPage = function(event) {
                    event && event.stopPropagation();
                    utilService.prevPage($rootScope.pickedPage);
                }
                utilService.loadPage(null, $rootScope.pickedPage, true);
            }

            if (isBrowser) {
                appModule.
                    controller('RootController', ["$scope", "$rootScope", "$q", "appService", "urlService", ", utilService", RootController]);
            }
        }
    }
);