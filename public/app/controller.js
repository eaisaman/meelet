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

            $scope.$watch("sketchObject.pickedWidget", function (to) {
                if (to) {
                    widgetSettingList.forEach(function (setting) {
                        setting.deregisterWatch && setting.deregisterWatch();

                        var name = setting.name,
                            getterName = "get" + name.charAt(0).toUpperCase() + name.substr(1);

                        var getter = to[getterName];
                        if (getter) {
                            $scope.sketchWidgetSetting[name] = getter.apply(to);
                            setting.initFn && setting.initFn(getter.apply(to));
                        }

                        setting.deregisterWatch = $scope.$watch("sketchWidgetSetting" + "." + name, setterFactory(to, name));
                    });
                } else {
                    $timeout(function () {
                        $scope.sketchObject.pickedWidget = $scope.sketchObject.currentPage;
                    });
                }
            });

            $scope.$watch("sketchObject.currentPage", function (to) {
                if (to) {
                    $scope.sketchObject.pickedWidget = to;
                    $scope.sketchObject.sketchWorks.pages.forEach(function (p) {
                        p.id != to.id && p.showHide(false);
                    });
                    to.showHide(true);
                }
            });

            //Receive control directive settings of bound properties
            $scope.$on(angularEventTypes.boundPropertiesEvent, function (event, data) {
                for (var key in data) {
                    var prop = data[key].prop;
                    if (typeof prop === "string") {
                        var m = prop.match(/^sketchWidgetSetting\.(\w+)/);
                        if (m && m.length == 2) {
                            var name = m[1];

                            widgetSettingList.push({name: name, initFn: data[key].initFn});
                        }
                    }
                }
            });

            function initSketch() {
            }

            $scope.$on("$routeChangeSuccess", function (scope, next, current) {
                $timeout(function () {
                    $q.all([initSketch()]).then(function () {
                        var pageObj = uiService.createPage($(".deviceHolder"));
                        pageObj.addClass("pageHolder");
                        $scope.sketchObject.currentPage = pageObj;
                        $scope.sketchObject.sketchWorks.pages.push(pageObj);
                    });
                }, 50);
            });
        }

        return function (appModule) {
            appModule.
                controller('RootController', ["urlService", RootController]).
                controller('FrameSketchController', ["$scope", "$timeout", "$q", "angularEventTypes", "uiService", FrameSketchController]);
        }
    });