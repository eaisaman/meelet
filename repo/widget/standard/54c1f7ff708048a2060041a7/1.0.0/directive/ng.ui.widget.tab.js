define(
    ["angular", "jquery"],
    function () {
        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            var inject = ["$http", "$timeout", "$q", "$parse", "$compile", "angularConstants", "angularEventTypes", "uiService", "uiUtilService"],
                name = "uiWidgetTab",
                version = "1.0.0",
                directive = name + version.replace(/\./g, ""),
                directiveService = name + version.replace(/\./g, "") + "Directive",
                widgetAnchorId = "ACD77ACC-BAB4-4198-901E-F219FA2A2641";

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

                $compileProvider.directive(directive, _.union(inject, [function ($http, $timeout, $q, $parse, $compile, angularConstants, angularEventTypes, uiService, uiUtilService) {
                    'use strict';

                    var injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                    return {
                        controller: "uiWidgetTabController",
                        restrict: "A",
                        scope: {
                            /**
                             * Valid align values include 'alignTop', 'alignBottom', 'alignLeft', 'alignRight'
                             */
                            align: "=?",
                            /**
                             * Valid transition values include 'moveToLeft', 'moveToRight', 'moveToTop', 'moveToBottom',
                             * 'fadeToLeft', 'fadeToRight', 'fadeToTop', 'fadeToBottom',
                             * 'moveToLeftFade', 'moveToRightFade', 'moveToBottomFade', 'moveToTopFade',
                             * 'moveToLeftScaleDown', 'moveToRightScaleDown', 'moveToBottomScaleDown', 'moveToTopScaleDown',
                             * 'scaleUpAtLeft', 'scaleUpAtRight', 'scaleUpAtTop', 'scaleUpAtBottom', 'scaleUp', 'scaleUpCenter',
                             * 'moveToLeftAfterRotation', 'moveToRightAfterRotation', 'moveToTopAfterRotation', 'moveToBottomAfterRotation',
                             * 'flipInLeftOutRight', 'flipInRightOutLeft', 'flipInBottomOutTop', 'flipInTopOutBottom',
                             * 'pushLeft', 'pushRight', 'pushTop', 'pushBottom',
                             * 'pullLeft', 'pullRight', 'pullTop', 'pullBottom',
                             * 'foldLeft', 'foldRight', 'foldTop', 'foldBottom',
                             * 'UnfoldLeft', 'UnfoldRight', 'UnfoldTop', 'UnfoldBottom',
                             * 'roomToLeft', 'roomToRight', 'roomToTop', 'roomToBottom',
                             * 'cubeToLeft', 'cubeToRight', 'cubeToTop', 'cubeToBottom',
                             * 'carouselToLeft', 'carouselToRight', 'carouselToTop', 'carouselToBottom',
                             * 'sides', fall', 'newspaper', "slide"
                             */
                            transition: "=?",
                            tabTitles: "=?",
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

                                        if ((scope.isPlaying == null || scope.isPlaying) && !event.originalEvent.defaultPrevented) {
                                            var $el = $(event.target),
                                                tabIndex = parseInt($el.attr("tab-index"));

                                            if (tabIndex >= 0) {
                                                var $tab = element.find(".tabGroup[tab-index = " + tabIndex + "]");

                                                scope.pickedTabTitle = scope.tabTitles[tabIndex].name;

                                                return $q.all([scope.toggleExclusiveSelect($el, event, true), scope.toggleExclusiveDisplay($tab, event, true)]);
                                            }
                                        }

                                        return uiUtilService.getResolveDefer();
                                    }

                                    scope.onModifyTabTitles = function (to) {
                                        if (to != null) {
                                            if (!scope.pickedTabTitle || to.every(function (titleObj) {
                                                    return titleObj.name !== scope.pickedTabTitle;
                                                })) {
                                                scope.pickedTabTitle = to.length && to[0].name || "";
                                            }

                                            to.forEach(function (titleObj, i) {
                                                var $tabGroup = element.find(".tabGroup[" + i + "]"),
                                                    $group = $tabGroup;
                                                for (; $group.length && $group.attr("tab-name") !== titleObj.name; $group = $group.next()) {
                                                }

                                                if ($group.length) {
                                                    if ($group != $tabGroup) {
                                                        $group.detach();
                                                        $tabGroup.before($group);
                                                    }
                                                } else {
                                                    var $newGroup = $("<div />").
                                                        addClass("tabGroup fs-x-large-before").
                                                        attr("ng-class", "{'show': pickedTabTitle === '{0}'}".format(titleObj.name));

                                                    if ($tabGroup.length) {
                                                        $tabGroup.before($newGroup);
                                                    } else {
                                                        element.find(".tabGroups").append($newGroup);
                                                    }
                                                }
                                            });
                                            var len = to.length || 0;
                                            element.find(".tabGroup").each(function (i, groupElement) {
                                                if (i < len) {
                                                    $(groupElement).attr("tab-name", to[i].name)
                                                        .attr("desc", "Tab Group " + to[i].name)
                                                        .attr("tab-index", i)
                                                        .attr("widget-anchor", "{0}[{1}]".format(widgetAnchorId, to[i].name));
                                                    uiService.anchorElement(groupElement);
                                                } else {
                                                    uiService.disposeElement(groupElement);
                                                }
                                            });

                                            if (!element.hasClass(angularConstants.repoWidgetClass)) {
                                                element.find(".tabGroups").children(".tabGroup").each(function (i, groupElement) {
                                                    ctrl.transclude(to[i].name, $(groupElement));
                                                });
                                            }

                                            $compile(element.find(".tabGroups"))(scope);
                                        }
                                    }

                                    scope.align = scope.align || "alignTop";
                                    scope.transition = scope.transition || "moveToLeft";
                                    scope.tabTitles = scope.tabTitles || [];
                                },
                                post: function (scope, element, attrs, ctrl) {
                                    if (element.hasClass(angularConstants.repoWidgetClass)) {
                                        uiUtilService.whilst(function () {
                                                return !element.closest(".widgetContainer").attr("id");
                                            }, function (callback) {
                                                callback();
                                            }, function (err) {
                                                if (!err) {
                                                    //id of widget of RepoSketchWidgetClass type
                                                    scope.widgetId = element.closest(".widgetContainer").parent().attr("id");
                                                    uiUtilService.broadcast(scope, angularConstants.widgetEventPattern.format(angularEventTypes.widgetContentIncludedEvent, scope.widgetId), {widgetId: scope.widgetId});
                                                }
                                            },
                                            angularConstants.checkInterval,
                                            "ui-widget-tab.compile.post" + new Date().getTime()
                                        )
                                    }
                                }
                            }
                        }
                    }
                }]));
            }
        }
    }
);