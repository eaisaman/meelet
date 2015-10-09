

define(
    ["angular", "jquery", "jquery-ui", "app-route", "app-service"],
    function () {
        return function (appModule, meta) {
            function RootController($scope, $rootScope, $q, $timeout, appService, urlService, utilService, uiUtilService) {
                $rootScope.initFns = [];
                $rootScope.stateFns = [];

                $rootScope.initFns.push(function() { this['Widget_1439866248491'] = {}; });

                $rootScope.initFns.push(function() {
                    this['Widget_1439866362641'] = {};

                    this['Widget_1439866362641']['transition'] = "reveal";

                    this['Widget_1439866362641']['overlay'] = "transparent";

                });

                $rootScope.initFns.forEach(function(fn) {fn.apply($rootScope)});

                $rootScope.stateFns.forEach(function(fn) {fn.apply($rootScope)});

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
                    appService.exitPage();
                }
                utilService.loadPage(null, $rootScope.pickedPage, true);
            }

            function Widget_1439866248491_Controller($scope, $rootScope, $q, $timeout, appService, urlService, utilService, uiUtilService) {
                utilService.setState("Widget_1439866248491", "*");
            }


            if (isBrowser) {
                appModule.
                    controller('RootController', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "uiUtilService", RootController]);

                appModule.
                    controller('Widget_1439866248491_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "uiUtilService", Widget_1439866248491_Controller]);


            }
        }
    }
);