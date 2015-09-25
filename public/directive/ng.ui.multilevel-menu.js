define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "$exceptionHandler", "$parse", "angularConstants", "angularEventTypes", "utilService"];

            appModule.directive("uiMultilevelMenu", _.union(inject, [function ($http, $timeout, $q, $exceptionHandler, $parse, angularConstants, angularEventTypes, utilService) {
                'use strict';

                var injectObj = _.object(inject, Array.prototype.slice.call(arguments)),
                    defaults = {
                        zIndex: 1000,
                        listField: "list"
                    },
                    options = _.extend(defaults, opts);

                return {
                    restrict: "A",
                    scope: {
                        // classes for the animation effects
                        // Valid enter effects include 'dl-animate-in-1', ...'dl-animate-in-5', exit effects include  'dl-animate-out-1', ...'dl-animate-out-5'
                        pickedMenuItem: "=",
                        menuList: "=",
                        onMenuSelect: '&'
                    },
                    replace: true,
                    transclude: true,
                    templateUrl: "include/_multilevel_menu.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs, ctrl) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    "$timeout": $timeout,
                                    "$q": $q,
                                    "angularConstants": angularConstants,
                                    "utilService": utilService,
                                    element: element,
                                    scope: scope
                                }));

                                scope.options = _.extend(_.clone(options), $parse(attrs['uiMultilevelMenuOpts'])(scope, {}));

                                function openMenu($subLevel) {
                                    if ($subLevel) {
                                        scope.level = parseInt($subLevel.attr('data-level'));

                                        // reset transform for sublevel
                                        $subLevel.css(utilService.prefixedStyle("transform", ""));

                                        $subLevel.addClass('mp-level-open');
                                    } else {
                                        scope.level = 1;
                                        element.find(".mp-menu > .mp-level").addClass('mp-level-open');
                                    }
                                }

                                function resetMenu() {
                                    scope.level = 0;

                                    toggleLevels();
                                }

                                function toggleLevels() {
                                    element.find(".mp-level").each(function (i, el) {
                                        var $el = $(el),
                                            $li = $el.parent("li"),
                                            dataLevel = parseInt($el.attr('data-level'));

                                        if (dataLevel >= scope.level + 1) {
                                            $el.removeClass('mp-level-open');
                                            $el.removeClass('mp-level-overlay');
                                        } else if (dataLevel == scope.level) {
                                            $el.removeClass('mp-level-overlay');
                                        }
                                        $li.removeClass("item-open");
                                    });
                                }

                                function findLevel($el) {
                                    if ($el.attr("data-level")) {
                                        return parseInt($el.attr("data-level"));
                                    } else {
                                        var $parents = $el.parents(".mp-level"),
                                            level;

                                        if ($parents.length) {
                                            var $parent = $($parents.get(0)),
                                                attrLevel = $parent.attr("data-level");

                                            if (attrLevel) {
                                                level = parseInt(attrLevel) + 1;
                                            } else {
                                                level = findLevel($parent) + 1;
                                            }
                                        } else {
                                            level = 1;
                                        }

                                        $el.attr("data-level", level);

                                        return level;
                                    }
                                }

                                scope.filterItem = function (item) {
                                    if (scope.options.listFilter && typeof scope.options.listFilter === "object") {
                                        return _.findWhere([item], scope.options.listFilter);
                                    }

                                    return true;
                                }

                                scope.toggleMenu = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    return scope.toggleSelect().then(function () {
                                        if (element.hasClass("select")) {
                                            element.find(".mp-level").each(function (i, el) {
                                                findLevel($(el));
                                            });

                                            openMenu();
                                        } else {
                                            resetMenu();
                                        }

                                        return utilService.getResolveDefer();
                                    });
                                }

                                scope.goBack = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $el = $(event.target),
                                        $mpLevel = $el.closest('.mp-level'),
                                        level = parseInt($mpLevel.attr('data-level'));

                                    if (scope.level <= level) {
                                        scope.level = level - 1;

                                        var $li = $mpLevel.parent("li"),
                                            $parentLevels = $mpLevel.parents(".mp-level");

                                        $mpLevel.removeClass('mp-level-open');
                                        $mpLevel.removeClass('mp-level-overlay');
                                        $li.removeClass("item-open");
                                        if ($parentLevels.length) {
                                            var $parentLevel = $($parentLevels.get(0));
                                            $parentLevel.removeClass('mp-level-overlay');
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                }

                                scope.onSelect = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $el = $(event.currentTarget),
                                        $subLevel = $el.find("> div.mp-level");

                                    if ($subLevel.length > 0) {
                                        var $mpLevel = $el.closest(".mp-level"),
                                            level = parseInt($mpLevel.attr('data-level'));

                                        if (scope.level <= level) {
                                            $el.addClass("item-open");
                                            $mpLevel.addClass('mp-level-overlay');
                                            openMenu($subLevel);
                                        }

                                        return utilService.getResolveDefer();
                                    } else {
                                        element.find(".mp-level").removeClass('mp-level-open').removeClass('mp-level-overlay');
                                        scope.toggleSelect();

                                        scope.pickedMenuItem = $el.attr("data-value");
                                        return $timeout(function () {
                                            scope.onMenuSelect && scope.onMenuSelect();
                                        });
                                    }
                                }

                                scope.pickValue = function (item) {
                                    if (typeof item === "object") {
                                        return item && item[scope.options.dataField] || "";
                                    } else {
                                        return item;
                                    }
                                }

                                scope.pickLabel = function (item) {
                                    if (typeof item === "object") {
                                        return item && item[scope.options.labelField] || "";
                                    } else {
                                        return item;
                                    }
                                }
                            }
                            ,
                            post: function (scope, element, attrs) {
                            }
                        }
                    }
                }
            }
            ]))
            ;
        }
    }
)
;