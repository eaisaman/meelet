define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "uiUtilService", "angularConstants"];

            appModule.directive("uiDock", _.union(inject, [function ($timeout, $q, uiUtilService, angularConstants) {
                'use strict';

                var defaults = {},
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {visiblePseudoEnabledWidgets: "="},
                    replace: false,
                    transclude: true,
                    templateUrl: "include/_dock.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    element: element,
                                    scope: scope
                                }));
                            },
                            post: function (scope, element, attrs) {
                                element.find(".showButton, .hideButton").on("click", function (event) {
                                    scope.toggleDisplay(element);
                                });

                                scope.selectContentTab = function ($tabContainer, $tabHead, event) {
                                    return scope.selectTab($tabContainer, $tabHead, event).then(function () {
                                        var defer = $q.defer();

                                        $timeout(function () {
                                            var $content = $(".structureContent .content");
                                            $content.sly({
                                                smart: 1,
                                                activateOn: 'click',
                                                mouseDragging: 0,
                                                touchDragging: 0,
                                                releaseSwing: 1,
                                                scrollBar: null,
                                                scrollBy: 10,
                                                pagesBar: null,
                                                activatePageOn: 'click',
                                                speed: 300,
                                                elasticBounds: 1,
                                                easing: 'easeOutExpo',
                                                dragHandle: 1,
                                                dynamicHandle: 1,
                                                clickBar: 1
                                            });

                                            //The sly plugin makes $content overflow:hidden which hides the circular menu
                                            //We make it visible and set the tab title's z-index no smaller than the content
                                            $content.css("overflow", "visible");
                                        });

                                        return defer.promise;
                                    });
                                }

                                $timeout(function () {
                                    scope.selectContentTab(
                                        element.find(".dockContent"),
                                        element.find("div[tab-sel^=tab-head-control-group]").get(0),
                                        null,
                                        "control-group"
                                    );
                                }, angularConstants.actionDelay);


                                /* FIXME Adjust Slidee Height When Sketch Control Expands.
                                 *  div.content-1 is used as slidee for sly plugin, whose height is 200% of its parent.
                                 *  Slidee height is used to determine when the elastic bounce occurs. It is difficult
                                 *  to get the actual scroll height since every sketch control supports expand action
                                 *  which may enlarge the value. We can check it by adding the top position and scroll
                                 *  height of the sketch control, and compare to slidee height. If exceed, adjust slidee
                                 *  height to new bigger one, and reload sly control.
                                 * */
                            }
                        }
                    }
                }
            }]));
        }
    }
);