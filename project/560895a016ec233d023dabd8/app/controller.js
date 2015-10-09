

define(
    ["angular", "jquery", "app-route", "app-service", "app-util", "sketch-util"],
    function () {
        return function (appModule, extension) {
            function RootController($scope, $rootScope, $q, $timeout, appService, urlService, utilService, sketchUtilService) {
                $rootScope.initFns = [];
                $rootScope.stateFns = [];

                $rootScope.initFns.push(function() { this['Widget_1443403213888'] = {}; });

                $rootScope.initFns.push(function() {
                    this['Widget_1443403308159'] = {};

                    this['Widget_1443403308159']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443410291944'] = {};

                    this['Widget_1443410291944']['routes'] = [];

                });

                $rootScope.initFns.push(function() { this['Widget_1443410277764'] = {}; });

                $rootScope.initFns.push(function() {
                    this['Widget_1443410277766'] = {};

                    this['Widget_1443410277766']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443410454753'] = {};

                    this['Widget_1443410454753']['routes'] = [];

                });

                $rootScope.initFns.push(function() { this['Widget_1443410405611'] = {}; });

                $rootScope.initFns.push(function() {
                    this['Widget_1443410405613'] = {};

                    this['Widget_1443410405613']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443410469265'] = {};

                    this['Widget_1443410469265']['routes'] = [];

                });

                $rootScope.initFns.push(function() { this['Widget_1443410414390'] = {}; });

                $rootScope.initFns.push(function() {
                    this['Widget_1443410414391'] = {};

                    this['Widget_1443410414391']['routes'] = [];

                });

                $rootScope.initFns.push(function() {
                    this['Widget_1443410491342'] = {};

                    this['Widget_1443410491342']['routes'] = [];

                });

                $rootScope.initFns.forEach(function(fn) {fn.apply($rootScope)});

                $rootScope.stateFns.forEach(function(fn) {fn.apply($rootScope)});

                $scope.nextPage = function(event) {
                    event && event.stopPropagation();
                    appService.nextPage();
                }
                $scope.prevPage = function(event) {
                    event && event.stopPropagation();
                    appService.prevPage();
                }
                $scope.exitPage = function(event) {
                    event && event.stopPropagation();
                    appService.exitPage();
                }
                appService.loadPage(urlService.locations[0], true);
            }

            function Widget_1443403213888_Controller($scope, $rootScope, $q, $timeout, appService, urlService, utilService, sketchUtilService) {
                appService.setState("Widget_1443403213888", "*");
            }

            function Widget_1443410277764_Controller($scope, $rootScope, $q, $timeout, appService, urlService, utilService, sketchUtilService) {
                appService.setState("Widget_1443410277764", "*");
            }

            function Widget_1443410405611_Controller($scope, $rootScope, $q, $timeout, appService, urlService, utilService, sketchUtilService) {
                appService.setState("Widget_1443410405611", "*");
            }

            function Widget_1443410414390_Controller($scope, $rootScope, $q, $timeout, appService, urlService, utilService, sketchUtilService) {
                appService.setState("Widget_1443410414390", "*");
            }


            if (isBrowser) {
                appModule.
                    controller('RootController', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "sketchUtilService", RootController]);

                appModule.
                    controller('Widget_1443403213888_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "sketchUtilService", Widget_1443403213888_Controller]);

                appModule.
                    controller('Widget_1443410277764_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "sketchUtilService", Widget_1443410277764_Controller]);

                appModule.
                    controller('Widget_1443410405611_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "sketchUtilService", Widget_1443410405611_Controller]);

                appModule.
                    controller('Widget_1443410414390_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "sketchUtilService", Widget_1443410414390_Controller]);


            }
        }
    }
);