define(function () {
    function RootController(urlService) {
        urlService.frameSketch();
    }

    function FrameSketchController($scope, $timeout, $q) {
        //TODO 填充 背景图片 阴影 视角 旋转 缩放 位移 出现/消失/装载/其它事件动画 对齐 按网格移动/改变大小 width/height/border-radius 手势
        $scope.canvasSetting = {}

        function initSketch() {
            return $timeout(function () {
                $scope.canvas = new fabric.Canvas('c');
                fabric.Object.prototype.transparentCorners = false;

                var rect = new fabric.Rect({
                    width: 100,
                    height: 100,
                    top: 100,
                    left: 100,
                    fill: 'rgba(255,0,0,0.5)'
                });

                $scope.canvas.add(rect);

            }).then($timeout(function () {
                $scope.canvas.setWidth($("#canvasHolder").width());
                $scope.canvas.setHeight($("#canvasHolder").height());

                $scope.$on(angularEventTypes.resizeEvent, function () {
                    $scope.canvas.setWidth($("#canvasHolder").width());
                    $scope.canvas.setHeight($("#canvasHolder").height());
                });

                $scope.$watch("canvasSetting.strokeColor", function (value) {
                });

                $scope.$watch("canvasSetting.angle", function (value) {
                    $scope.canvas.forEachObject(function (childObject) {
                        childObject.setAngle(parseFloat(value)).setCoords();
                    });
                    $scope.canvas.renderAll();
                });

                $scope.$watch("canvasSetting.scale", function (value) {
                    $scope.canvas.forEachObject(function (childObject) {
                        childObject.scale(parseFloat(value)).setCoords();
                    });
                    $scope.canvas.renderAll();
                });

                $scope.$watch("canvasSetting.top", function (value) {
                    $scope.canvas.forEachObject(function (childObject) {
                        childObject.setTop(parseInt(value, 10)).setCoords();
                    });
                    $scope.canvas.renderAll();
                });

                $scope.$watch("canvasSetting.left", function (value) {
                    $scope.canvas.forEachObject(function (childObject) {
                        childObject.setLeft(parseInt(value, 10)).setCoords();
                    });
                    $scope.canvas.renderAll();
                });
            }));
        }

        $scope.$on("$routeChangeSuccess", function (scope, next, current) {
            $timeout(function () {
                $q.all([initSketch()]).then(function () {
                    //Render complete
                });
            }, 50);
        });
    }

    return function (appModule) {
        appModule.
            controller('RootController', ["urlService", RootController]).
            controller('FrameSketchController', ["$scope", "$timeout", "$q", "utilService", FrameSketchController]);
    }
});