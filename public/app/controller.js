define(
    ["angular", "jquery", "jquery-ui", "app-util", "app-route", "app-filter", "app-service"],
    function () {
        function RootController(urlService) {
            urlService.frameSketch();
        }

        function FrameSketchController($scope, $timeout, $q, angularEventTypes, uiService) {
            //TODO 背景图片 阴影 视角 旋转 出现/消失/装载/其它事件动画 对齐 按网格移动/改变大小 width/height/border-radius 手势
            var widgetSettingList = [];

            $scope.sketchWidgetSetting = {};
            $scope.sketchPageSetting = {};
            $scope.sketchObject = {sketchWorks: {pages: []}};
            $scope.sketchDevice = {type: "desktop", width: 1024, height: 768, img: "device_ipad_horizontal.svg"};
            $scope.dockAlign = "align-left";

            function setterFactory(obj, name) {
                return function (to) {
                    var setterName = "set" + name.charAt(0).toUpperCase() + name.substr(1);
                    var setter = obj[setterName];
                    setter && setter.apply(obj, [to]);
                }
            }

            function initWidgetSettingWatch(setting) {
                if ($scope.sketchObject.pickedWidget) {
                    setting.deregisterWatch && setting.deregisterWatch();

                    var name = setting.name,
                        getterName = "get" + name.charAt(0).toUpperCase() + name.substr(1);

                    var getter = $scope.sketchObject.pickedWidget[getterName];
                    if (getter) {
                        var value = getter.apply($scope.sketchObject.pickedWidget);
                        $scope.sketchWidgetSetting[name] = value;
                        setting.initFn && setting.initFn(value);
                    }

                    setting.deregisterWatch = $scope.$watch("sketchWidgetSetting" + "." + name, setterFactory($scope.sketchObject.pickedWidget, name));
                }
            }

            $scope.$watch("sketchObject.pickedWidget", function (to) {
                if (!to) {
                    $scope.sketchObject.pickedWidget = $scope.sketchObject.pickedPage;
                }
            });

            $scope.$watch("sketchObject.pickedWidget.state", function (to) {
                if (to) {
                    widgetSettingList.forEach(function (setting) {
                        initWidgetSettingWatch(setting);
                    });
                }
            });

            $scope.$watch("sketchObject.pickedPage", function (to) {
                if (to) {
                    $scope.sketchObject.pickedWidget = to;
                    $scope.sketchObject.sketchWorks.pages.forEach(function (p) {
                        p.id != to.id && p.showHide(false);
                    });
                    to.showHide(true);
                }
            });

            $scope.$watch("sketchObject.sketchWorks.pages", function (to, from) {
                if (from !== to) {
                    from && from.forEach(function (oldPageObj) {
                        oldPageObj.remove();
                    });

                    if (to && to.length) {
                        var $deviceHolder = $(".deviceHolder");
                        to.forEach(function (pageObj) {
                            uiService.createPage($deviceHolder, pageObj);
                        });

                        $scope.sketchObject.pickedPage = to[0];
                    }
                }
            });

            //Receive control directive settings of bound properties
            $scope.$on(angularEventTypes.boundPropertiesEvent, function (event, data) {
                for (var key in data) {
                    var prop = data[key].prop;
                    if (typeof prop === "string") {
                        var m = prop.match(/^sketchWidgetSetting\.(\w+)/);
                        if (m && m.length == 2) {
                            var name = m[1],
                                setting = {name: name, initFn: data[key].initFn};

                            widgetSettingList.push(setting);
                            initWidgetSettingWatch(setting);
                        }
                    }
                }
            });

            function initSketch() {
                var defer = $q.defer();

                $timeout(function () {
                    var pageObj = uiService.createPage($(".deviceHolder"));
                    pageObj.addClass("pageHolder");
                    $scope.sketchObject.pickedPage = pageObj;
                    $scope.sketchObject.sketchWorks.pages.push(pageObj);
                    defer.resolve();
                });

                return defer.promise;
            }

            $scope.$on("$routeChangeSuccess", function (scope, next, current) {
                $q.all([initSketch()]);
            });
        }

        return function (appModule) {
            appModule.
                controller('RootController', ["urlService", RootController]).
                controller('FrameSketchController', ["$scope", "$timeout", "$q", "angularEventTypes", "uiService", FrameSketchController]);
        }
    });