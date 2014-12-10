define(
    ["angular", "jquery"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$timeout", "$q", "$parse", "angularEventTypes", "angularConstants", "uiUtilService", "uiService"];

            appModule.directive("uiPage", _.union(inject, [function ($timeout, $q, $parse, angularEventTypes, angularConstants, uiUtilService, uiService) {
                'use strict';

                var boundProperties = {},
                    defaults = {
                        pageHolderClass: "deviceHolder",
                        pageClass: "pageHolder"
                    },
                    options = _.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({sketchObject: "=", sketchWorks: "=", dockAlign: "=", treeNodeIdPrefix: "="}, boundProperties),
                    replace: false,
                    templateUrl: "include/_page.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {element: element, scope: scope}));

                                scope.$root.$broadcast(angularEventTypes.boundPropertiesEvent, uiUtilService.createDirectiveBoundMap(boundProperties, attrs));

                                options = _.extend(_.clone(options), $parse(attrs['uiPageOpts'])(scope, {}));
                            },
                            post: function (scope, element, attrs) {
                                scope.togglePage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $wrapper = element.find(".ui-control-wrapper"),
                                        $panel = element.find(".ui-control-panel"),
                                        $el = $(event.target);

                                    $wrapper.toggleClass("expanded");
                                    $panel.toggleClass("show");
                                    $el.toggleClass("select");
                                }

                                scope.insertPage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var pageObj = uiService.createPage($("." + options.pageHolderClass));
                                    pageObj.addClass("pickedWidget");
                                    pageObj.addClass(options.pageClass);
                                    scope.sketchObject.pickedPage && scope.sketchObject.pickedPage.removeClass("pickedWidget");
                                    scope.sketchObject.pickedPage = pageObj;
                                    scope.sketchWorks.pages.push(pageObj);
                                }

                                scope.removePage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var i = $(".pageList select").val();
                                    if (scope.sketchWorks.pages.length > 1) {
                                        var pageObj = scope.sketchWorks.pages[i],
                                            j = (i + 1) == scope.sketchWorks.pages.length ? 0 : i;

                                        scope.sketchWorks.pages.splice(i, 1);
                                        if (pageObj == scope.sketchObject.pickedPage) {
                                            scope.sketchObject.pickedPage = scope.sketchWorks.pages[j];
                                        }
                                    }
                                }

                                scope.copyPage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var i = $(".pageList select").val(),
                                        pageObj = scope.sketchWorks.pages[i],
                                        cloneObj = uiService.copyPage(pageObj, $("." + options.pageHolderClass));

                                    cloneObj.addClass("pickedWidget");
                                    cloneObj.addClass(options.pageClass);
                                    scope.sketchObject.pickedPage && scope.sketchObject.pickedPage.removeClass("pickedWidget");
                                    scope.sketchObject.pickedPage = cloneObj;
                                    scope.sketchWorks.pages.splice(i + 1, 0, cloneObj);
                                }

                                scope.toggleSelectState = function (item, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $dropdown = element.find("#widgetStateDropdown");

                                    if (event) {
                                        var $el = $(event.target),
                                            offset = $el.offset();

                                        var m = ($el.css("height") || "").match(/([-\d\.]+)px$/);
                                        if (m && m.length == 2)
                                            offset.top += parseFloat(m[1]) * 1.5;
                                        offset.left = Math.floor(offset.left * angularConstants.precision) / angularConstants.precision;
                                        offset.top = Math.floor(offset.top * angularConstants.precision) / angularConstants.precision;

                                        $dropdown.offset(offset);
                                    }

                                    if (item) {
                                        scope.stateTreeNodeItem = item;
                                    }

                                    if (scope.stateTreeNodeItem.stateOptions.length) {
                                        scope.toggleSelect($dropdown).then(
                                            function ($dropdown) {
                                                if ($dropdown.hasClass("select")) {
                                                    angular.element($dropdown.find("> div")).scope().open();
                                                }
                                            }
                                        );
                                    }

                                    return true;
                                }

                                $timeout(function () {
                                    $(".pageList select").change(function () {
                                        var i = $(this).val(),
                                            pageObj = scope.sketchWorks.pages[i];

                                        if (pageObj.id != scope.sketchObject.pickedPage.id) {
                                            scope.sketchObject.pickedPage = pageObj;
                                            scope.$apply();
                                        }
                                    });

                                    scope.$broadcast("collapseAll");
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);