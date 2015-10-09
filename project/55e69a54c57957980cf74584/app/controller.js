define(
    ["angular", "jquery", "jquery-ui", "app-route", "app-service"],
    function () {
        return function (appModule, meta) {
            function ReportController($scope, $rootScope, $timeout, $q, angularConstants, angularEventTypes, appService, urlService, uiUtilService) {
                $timeout(
                    function () {
                        (function () {
                            var ctx = document.getElementById("timeChart").getContext("2d");
                            var randomScalingFactor = function () {
                                return Math.round(Math.random() * 20)
                            };
                            var lineChartData = {
                                labels: ["27/08", "28/08", "29/08", "30/08", "31/08", "01/09", "02/09", "03/09", "04/09", "05/09"],
                                datasets: [
                                    {
                                        label: "My First dataset",
                                        fillColor: "rgba(151,187,205,0.2)",
                                        strokeColor: "rgba(151,187,205,1)",
                                        pointColor: "rgba(151,187,205,1)",
                                        pointStrokeColor: "#fff",
                                        pointHighlightFill: "#fff",
                                        pointHighlightStroke: "rgba(151,187,205,1)",
                                        data: [randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor()]
                                    }
                                ]

                            }

                            $scope.myLine = new Chart(ctx).Line(lineChartData, {
                                responsive: true
                            });
                        })();

                        (function () {
                            var ctx = document.getElementById("favoriteChart").getContext("2d");
                            var randomScalingFactor = function () {
                                return Math.round(Math.random() * 5)
                            };
                            var barChartData = {
                                labels: ["第1模块第1节", "第1模块第2节", "第1模块第3节", "第1模块第4节", "第1模块第5节", "第1模块第6节", "第1模块第7节"],
                                datasets: [
                                    {
                                        fillColor: "rgba(151,187,205,0.5)",
                                        strokeColor: "rgba(151,187,205,0.8)",
                                        highlightFill: "rgba(151,187,205,0.75)",
                                        highlightStroke: "rgba(151,187,205,1)",
                                        data: [randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor()]
                                    }
                                ]

                            }

                            $scope.myBar = new Chart(ctx).Bar(barChartData, {
                                responsive: true
                            });
                        })();

                    }, 300
                );
            }

            function SettingsController($scope, $rootScope, $timeout, $q, angularConstants, angularEventTypes, appService, urlService, uiUtilService) {
            }

            function RootController($scope, $rootScope, $q, $timeout, angularConstants, angularEventTypes, appService, urlService, utilService, uiUtilService) {
                window.onTakeAvatarPhoto = function() {
                    appService.takeMyPhoto().then(function(url) {
                        if (url) {
                            var m = url.match("resource\/image\/.+$");
                            if (m && m.length) {
                                $rootScope.avatarUrl = m[0];
                            }
                        }
                    });
                }

                window.onToggleSound = function (widgetId, url, loop) {
                    appService.isPlayingSound().then(function (isPlaying) {
                        if (isPlaying) {
                            onStopPlayWidgetSound(widgetId);
                        } else {
                            onPlayWidgetSound(widgetId, url, loop);
                        }
                    })
                }

                window.onPlaySound = function (url, loop) {
                    appService.playSound("55e69a54c57957980cf74584", url, loop);
                }

                window.onStopPlaySound = function () {
                    appService.stopPlaySound();
                }

                window.onPlayWidgetSound = function (widgetId, url, loop) {
                    appService.playSound("55e69a54c57957980cf74584", url, loop);

                    //If sound file is local, it may take a while to load the file and change state to 'playing', or unload
                    //and change to 'stopped'.
                    widgetId && $timeout(function () {
                        appService.isPlayingSound().then(function (isPlaying) {
                            if (isPlaying) {
                                onChangeWidgetState(widgetId, "*");
                            } else {
                                onChangeWidgetState(widgetId, "mute");
                            }
                        })
                    }, angularConstants.actionDelay);
                }

                window.onStopPlayWidgetSound = function (widgetId) {
                    appService.stopPlaySound();

                    //If sound file is local, it may take a while to load the file and change state to 'playing', or unload
                    //and change to 'stopped'.
                    widgetId && $timeout(function () {
                        appService.isPlayingSound().then(function (isPlaying) {
                            if (isPlaying) {
                                onChangeWidgetState(widgetId, "*");
                            } else {
                                onChangeWidgetState(widgetId, "mute");
                            }
                        })
                    }, angularConstants.actionDelay);
                }

                window.onGotoPage = function (pageNum) {
                    utilService.gotoPage($rootScope.pickedPage, pageNum);
                    $rootScope.$apply();
                }

                window.onChangeWidgetState = function (id, name) {
                    utilService.setStateOnWidget(id, name);
                    $rootScope.$apply();
                }

                $rootScope.initFns = [];
                $rootScope.stateFns = [];

                $rootScope.initFns.push(function () {
                    this['Widget_1441176722817'] = {};
                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441177272848'] = {};

                    this['Widget_1441177272848']['transition'] = "reveal";

                    this['Widget_1441177272848']['side'] = "rightSide";

                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441179877213'] = {};

                    this['Widget_1441179877213']['routes'] = [];

                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441180700147'] = {};

                    this['Widget_1441180700147']['routes'] = [];

                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441181327406'] = {};

                    this['Widget_1441181327406']['routes'] = [];

                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441181507595'] = {};

                    this['Widget_1441181507595']['routes'] = [];

                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441182225803'] = {};

                    this['Widget_1441182225803']['routes'] = [];

                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441258496323'] = {};

                    this['Widget_1441258496323']['routes'] = [];

                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441259980199'] = {};
                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441260121937'] = {};

                    this['Widget_1441260121937']['routes'] = [];

                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441260036623'] = {};
                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441260144493'] = {};

                    this['Widget_1441260144493']['routes'] = [];

                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441260060886'] = {};
                });

                $rootScope.initFns.push(function () {
                    this['Widget_1441260155371'] = {};

                    this['Widget_1441260155371']['routes'] = [];

                });

                $rootScope.initFns.forEach(function (fn) {
                    fn.apply($rootScope)
                });

                $rootScope.stateFns.forEach(function (fn) {
                    fn.apply($rootScope)
                });

                $scope.nextPage = function (event) {
                    event && event.stopPropagation();
                    utilService.nextPage($rootScope.pickedPage);
                }
                $scope.prevPage = function (event) {
                    event && event.stopPropagation();
                    utilService.prevPage($rootScope.pickedPage);
                }
                $scope.exitPage = function (event) {
                    event && event.stopPropagation();
                    utilService.firstPage($rootScope.pickedPage);
                }
                $rootScope.pickedPage = null;
                utilService.loadPage($rootScope.pickedPage, meta.locations[0], true).then(function(location) {$rootScope.pickedPage = location;});
            }

            function Widget_1441176722817_Controller($scope, $rootScope, $q, $timeout, appService, urlService, utilService, uiUtilService) {
                utilService.setState("Widget_1441176722817", "*").then(function () {
                    onPlaySound('resource/audio/background.mp3', true);

                    utilService.loadAnimation('EDGE-16665010');
                })

                $scope.$on('$destroy', function () {
                    utilService.unloadAnimation('EDGE-16665010');
                    globalEdges['EDGE-16665010'].unload();
                });
            }

            function Widget_1441259980199_Controller($scope, $rootScope, $q, $timeout, appService, urlService, utilService, uiUtilService) {
                utilService.setState("Widget_1441259980199", "*").then(function () {
                    utilService.loadAnimation('EDGE-635559');
                })

                $scope.$on('$destroy', function () {
                    utilService.unloadAnimation('EDGE-635559');
                });
            }

            function Widget_1441260036623_Controller($scope, $rootScope, $q, $timeout, appService, urlService, utilService, uiUtilService) {
                utilService.setState("Widget_1441260036623", "*").then(function () {
                    utilService.loadAnimation('EDGE-14551220');
                })

                $scope.$on('$destroy', function () {
                    utilService.unloadAnimation('EDGE-14551220');
                });
            }

            function Widget_1441260060886_Controller($scope, $rootScope, $q, $timeout, appService, urlService, utilService, uiUtilService) {
                utilService.setState("Widget_1441260060886", "*").then(function () {
                    utilService.loadAnimation('EDGE-14201750');
                })

                $scope.$on('$destroy', function () {
                    utilService.unloadAnimation('EDGE-14201750');
                });
            }


            if (isBrowser) {
                appModule.
                    controller('ReportController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "angularEventTypes", "appService", "urlService", "uiUtilService", ReportController]);

                appModule.
                    controller('SettingsController', ["$scope", "$rootScope", "$timeout", "$q", "angularConstants", "angularEventTypes", "appService", "urlService", "uiUtilService", SettingsController]);

                appModule.
                    controller('RootController', ["$scope", "$rootScope", "$q", "$timeout", "angularConstants", "angularEventTypes", "appService", "urlService", "utilService", "uiUtilService", RootController]);

                appModule.
                    controller('Widget_1441176722817_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "uiUtilService", Widget_1441176722817_Controller]);

                appModule.
                    controller('Widget_1441259980199_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "uiUtilService", Widget_1441259980199_Controller]);

                appModule.
                    controller('Widget_1441260036623_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "uiUtilService", Widget_1441260036623_Controller]);

                appModule.
                    controller('Widget_1441260060886_Controller', ["$scope", "$rootScope", "$q", "$timeout", "appService", "urlService", "utilService", "uiUtilService", Widget_1441260060886_Controller]);


            }
        }
    }
);