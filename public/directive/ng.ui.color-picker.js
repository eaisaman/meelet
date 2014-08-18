define(
    ["jquery"],
    function () {
        return function (appModule, util, common, opts) {
            appModule.directive("uiColorPicker", ["$http", "$timeout", function ($http, $timeout) {
                'use strict';

                var defaults = {
                        colorJson: "",
                        colors: ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e",
                            "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50",
                            "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6",
                            "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d"
                        ]
                    },
                    options = angular.extend(defaults, opts);

                return {
                    restrict: "A",
                    scope: {
                        pickedColor: "="

                    },
                    replace: false,
                    templateUrl: "include/_color_picker.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                if (options.colorJson) {
                                    $http.get(options.colorJson).then(function (result) {
                                        scope.colors = result.data;
                                        scope.pickerPaneBackgroundColor = scope.pickedColor = scope.colors && scope.colors.length && scope.colors[0] || "";
                                        scope.pickerPaneColor = util.contrastColor(scope.pickerPaneBackgroundColor);
                                        scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#fff" ? util.lighterColor(scope.pickedColor, 0.5) : util.lighterColor(scope.pickedColor, -0.5);
                                    });
                                } else {
                                    scope.colors = options.colors || [];
                                    scope.pickerPaneBackgroundColor = scope.pickedColor = scope.colors && scope.colors.length && scope.colors[0] || "";
                                    scope.pickerPaneColor = util.contrastColor(scope.pickerPaneBackgroundColor);
                                    scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#fff" ? util.lighterColor(scope.pickedColor, 0.5) : util.lighterColor(scope.pickedColor, -0.5);
                                }
                            },
                            post: function (scope, element, attrs) {
                                scope.pickColor = function (value) {
                                    scope.pickerPaneColor = "";
                                    scope.pickedColor = value;
                                    $timeout(function () {
                                        scope.pickerPaneBackgroundColor = scope.pickedColor;
                                        scope.pickerPaneColor = util.contrastColor(scope.pickerPaneBackgroundColor);
                                        scope.pickerBarBackgroundColor = scope.pickerPaneColor === "#fff" ? util.lighterColor(scope.pickedColor, 0.5) : util.lighterColor(scope.pickedColor, -0.5);
                                    });
                                };

                                scope.togglePalette = function () {
                                    element.toggleClass("expanded");
                                }
                            }
                        }
                    }
                }
            }]);
        }
    }
);