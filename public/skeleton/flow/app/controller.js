define(
    ["angular", "jquery", "app-route", "app-service"],
    function () {
        return function (appModule, meta) {
            function RootController($scope, $rootScope, $q, $timeout, angularConstants, angularEventTypes, appService, urlService, utilService, uiUtilService) {
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
                $scope.exitPage = function(event) {
                    event && event.stopPropagation();
                    utilService.exitPage($rootScope.pickedPage);
                }
                utilService.loadPage(null, $rootScope.pickedPage, true);
            }

            if (isBrowser) {
                appModule.
                    controller('RootController', ["$scope", "$rootScope", "$q", "$timeout", "angularConstants", "angularEventTypes", "appService", "urlService", "utilService", "uiUtilService", RootController]);
            }
        }
    }
);