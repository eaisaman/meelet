define(
    ["angular", "jquery"],
    function () {
        return function ($injector, $compileProvider, $controllerProvider, extension, directiveUrl) {
            var inject = ["$http", "$timeout", "$q", "$parse", "$compile", "angularConstants", "angularEventTypes", "utilService"],
                name = "uiWidgetTab",
                version = "1.0.0",
                directive = name + version.replace(/\./g, ""),
                directiveService = name + version.replace(/\./g, "") + "Directive",
                widgetAnchorId = "ACD77ACC-BAB4-4198-901E-F219FA2A2641";

            if (!$injector.has(directiveService)) {
                $controllerProvider.
                    register('uiWidgetTabController', ['$scope', '$transclude', '$q', '$timeout', 'utilService', function ($scope, $transclude, $q, $timeout, utilService) {
                        this.transclude = function (name, element) {
                            $transclude && $transclude(function (clone) {
                                for (var i = 0; i < clone.length; ++i) {
                                    var el = angular.element(clone[i]);
                                    if (el.attr('name') === name) {
                                        utilService.whilst(
                                            function () {
                                                return !el.scope();
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

                $compileProvider.directive(directive, _.union(inject, [function ($http, $timeout, $q, $parse, $compile, angularConstants, angularEventTypes, utilService) {
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

                                    scope.getTitle = function (titleObj) {
                                        return (titleObj && typeof titleObj === "string" && titleObj || titleObj.name) || "";
                                    }

                                    scope.selectWidgetTab = function (event) {
                                        event && event.stopPropagation();

                                        if (scope.isPlaying == null || scope.isPlaying) {
                                            var $el = $(event.target),
                                                tabIndex = parseInt($el.attr("tab-index"));

                                            if (tabIndex >= 0) {
                                                var $tab = element.find(".tabGroup[tab-index = " + tabIndex + "]");

                                                scope.pickedTabTitle = scope.getTitle(scope.tabTitles[tabIndex]);

                                                return $q.all([scope.toggleExclusiveSelect($el, event, true), scope.toggleExclusiveDisplay($tab, event, true)]);
                                            }
                                        }

                                        return utilService.getResolveDefer();
                                    }

                                    scope.setTabTitles = function (to) {
                                        if (to != null) {
                                            if (!scope.pickedTabTitle || to.every(function (titleObj) {
                                                    return scope.getTitle(titleObj) !== scope.pickedTabTitle;
                                                })) {
                                                scope.pickedTabTitle = to.length && scope.getTitle(to[0]) || "";
                                            }

                                            to.forEach(function (titleObj, i) {
                                                var $tabGroup = element.find(".tabGroup[" + i + "]"),
                                                    $group = $tabGroup;
                                                for (; $group.length && $group.attr("tab-name") !== scope.getTitle(titleObj); $group = $group.next()) {
                                                }

                                                if ($group.length) {
                                                    if ($group != $tabGroup) {
                                                        $group.detach();
                                                        $tabGroup.before($group);
                                                    }
                                                } else {
                                                    var $newGroup = $("<div />").
                                                        addClass("tabGroup fs-x-large-before").
                                                        attr("ng-class", "{'show': pickedTabTitle === '{0}'}".format(scope.getTitle(titleObj)));

                                                    if ($tabGroup.length) {
                                                        $tabGroup.before($newGroup);
                                                    } else {
                                                        element.find(".tabGroups").append($newGroup);
                                                    }
                                                }
                                            });
                                            var len = to.length || 0;
                                            element.find(".tabGroup").each(function (i, groupElement) {
                                                var $groupElement = $(groupElement);

                                                if (i < len) {
                                                    var anchor = "{0}[{1}]".format(widgetAnchorId, scope.getTitle(to[i]));

                                                    $groupElement.attr("tab-name", scope.getTitle(to[i]))
                                                        .attr("desc", "Tab Group " + scope.getTitle(to[i]))
                                                        .attr("tab-index", i)
                                                        .attr("widget-anchor", anchor);

                                                    $groupElement.children("[ui-sketch-widget]").each(function (i, childElement) {
                                                        var $child = $(childElement),
                                                            widgetObj = $child.data("widgetObject");

                                                        if (widgetObj)
                                                            widgetObj.anchor = anchor;
                                                    });
                                                } else {
                                                    $groupElement.children("[ui-sketch-widget]").each(function (i, childElement) {
                                                        var $child = $(childElement),
                                                            widgetObj = $child.data("widgetObject");

                                                        if (widgetObj)
                                                            widgetObj.dispose();
                                                    });
                                                    $groupElement.remove();
                                                }
                                            });

                                            if (!element.hasClass(angularConstants.repoWidgetClass)) {
                                                element.find(".tabGroups").children(".tabGroup").each(function (i, groupElement) {
                                                    ctrl.transclude(scope.getTitle(to[i]), $(groupElement));
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
                                        utilService.whilst(function () {
                                                return !(element.closest && element.closest(".widgetContainer").attr("id"));
                                            }, function (err) {
                                                if (!err) {
                                                    //id of widget of RepoSketchWidgetClass type
                                                    scope.widgetId = element.closest(".widgetContainer").parent().attr("id");
                                                    utilService.broadcast(scope, angularConstants.widgetEventPattern.format(angularEventTypes.widgetContentIncludedEvent, scope.widgetId), {widgetId: scope.widgetId});
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