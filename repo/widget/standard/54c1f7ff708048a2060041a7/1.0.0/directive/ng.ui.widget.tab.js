define(
    ["angular", "jquery"],
    function () {
        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            var inject = ["$http", "$timeout", "$q", "$parse", "$compile", "angularConstants", "angularEventTypes", "uiUtilService"],
                name = "uiWidgetTab",
                version = "1.0.0",
                directive = name + version.replace(/\./g, ""),
                directiveService = name + version.replace(/\./g, "") + "Directive";

            if (!$injector.has(directiveService)) {
                $controllerProvider.
                    register('uiWidgetTabController', ['$scope', '$transclude', '$q', '$timeout', 'uiUtilService', function ($scope, $transclude, $q, $timeout, uiUtilService) {
                        this.transclude = function (name, element) {
                            $transclude && $transclude(function (clone) {
                                for (var i = 0; i < clone.length; ++i) {
                                    var el = angular.element(clone[i]);
                                    if (el.attr('name') === name) {
                                        uiUtilService.whilst(
                                            function () {
                                                return !el.scope();
                                            }, function (callback) {
                                                callback();
                                            }, function (err) {
                                                var defer = $q.defer();

                                                if (!err) {
                                                    $timeout(function () {
                                                        element.append(el);

                                                        defer.resolve();
                                                    });
                                                } else {
                                                    $timeout(function () {
                                                        defer.reject(err);
                                                    });
                                                }

                                                return defer.promise;
                                            }
                                        );
                                        return;
                                    }
                                }
                            });
                        }
                    }]);

                $compileProvider.directive(directive, _.union(inject, [function ($http, $timeout, $q, $parse, $compile, angularConstants, angularEventTypes, uiUtilService) {
                    'use strict';

                    var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                    return {
                        controller: "uiWidgetTabController",
                        restrict: "A",
                        scope: {
                            /**
                             * Valid align values include 'alignTop', 'alignBottom', 'alignLeft', 'alignRight'
                             */
                            align: "=",
                            /**
                             * Valid transition values include 'moveToLeft', 'moveToRight', 'moveToTop', 'moveToBottom',
                             * 'fadeToLeft', 'fadeToRight', 'fadeToTop', 'fadeToBottom',
                             * 'moveToLeftFade', 'moveToRightFade', 'moveToBottomFade', 'moveToTopFade',
                             * 'moveToLeftScaleDown', 'moveToRightScaleDown', 'moveToBottomScaleDown', 'moveToTopScaleDown',
                             * 'scaleUpAtLeft', 'scaleUpAtRight', 'scaleUpAtTop', 'scaleUpAtBottom', 'scaleUp', 'scaleUpCenter',
                             * 'moveToLeftAfterRotation', 'moveToRightAfterRotation', 'moveToTopAfterRotation', 'moveToBottomAfterRotation',
                             * 'flipInLeftOutRight', 'flipInRightOutLeft', 'flipInBottomOutTop', 'flipInTopOutBottom',
                             * 'roomToLeft', 'roomToRight', 'roomToTop', 'roomToBottom',
                             * 'cubeToLeft', 'cubeToRight', 'cubeToTop', 'cubeToBottom',
                             * 'carouselToLeft', 'carouselToRight', 'carouselToTop', 'carouselToBottom',
                             * 'sides', fall', 'newspaper', "slide"
                             */
                            transition: "=",
                            tabTitles: "=",
                            pickedTabTitle: "=?"
                        },
                        replace: true,
                        transclude: true,
                        templateUrl: (directiveUrl || "") + "/include/_widget_tab.html",
                        compile: function (element, attrs) {
                            return {
                                pre: function (scope, element, attrs, ctrl) {
                                    extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                        element: element,
                                        scope: scope
                                    }));

                                    scope.selectWidgetTab = function (event) {
                                        event && event.stopPropagation();

                                        var $el = $(event.target),
                                            tabIndex = $el.attr("tab-index"),
                                            $tab = element.find(".tabGroup[tab-index = " + tabIndex + "]");

                                        return $q.all([scope.toggleExclusiveSelect($el, event, true), scope.toggleExclusiveDisplay($tab, event, true)]);
                                    }

                                    scope.$watch("tabTitles", function (to) {
                                        if (to != null) {
                                            scope.pickedTabTitle = to.length && to[0].name || "";

                                            element.find(".tabGroup").remove();

                                            to.forEach(function (titleObj, i) {
                                                var $tabGroup = $("<div />").
                                                    addClass("tabGroup fs-x-large-before").
                                                    attr("tab-index", i).
                                                    attr("desc", "Tab Group " + titleObj.name).
                                                    attr("widget-anchor", "ACD77ACC-BAB4-4198-901E-F219FA2A2641-" + i).
                                                    attr("ng-class", "{'show': pickedTabTitle === '{0}'}".format(titleObj.name));

                                                element.find(".tabGroups").append($tabGroup);
                                            });

                                            $compile(element.find(".tabGroups"))(scope);

                                            element.find(".tabGroups").children(".tabGroup").each(function (i, groupElement) {
                                                ctrl.transclude(to[i].name, $(groupElement));
                                            });
                                        }
                                    });
                                },
                                post: function (scope, element, attrs, ctrl) {
                                }
                            }
                        }
                    }
                }]));
            }
        }
    }
);