define(
    ["angular", "jquery", "hammer"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$http", "$timeout", "$q", "$parse", "$compile", "angularEventTypes", "uiUtilService", "uiService"];

            appModule.directive("uiPage", _.union(inject, [function ($http, $timeout, $q, $parse, $compile, angularEventTypes, uiUtilService, uiService) {
                'use strict';

                var boundProperties = {pickedPage: "=", sketchWorks: "="},
                    defaults = {
                        pageHolderClass: "deviceHolder"
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: angular.extend({dockAlign: "=", treeNodeIdPrefix: "="}, boundProperties),
                    replace: false,
                    templateUrl: "include/_page.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                scope.$root.$broadcast(angularEventTypes.boundPropertiesEvent, uiUtilService.createDirectiveBoundMap(boundProperties, attrs));

                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {element: element, scope: scope}));

                                options = angular.extend(options, $parse(attrs['uiPageOpts'])(scope, {}));
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
                                    pageObj.addClass("pageHolder");
                                    scope.pickedPage && scope.pickedPage.removeClass("pickedWidget");
                                    scope.pickedPage = pageObj;
                                    scope.sketchWorks.pages.push(pageObj);
                                }

                                scope.removePage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var i = $(".pageList select").val();
                                    if (scope.sketchWorks.pages.length > 1) {
                                        var pageObj = scope.sketchWorks.pages[i],
                                            j = (i + 1) == scope.sketchWorks.pages.length ? 0 : i;

                                        scope.sketchWorks.pages.splice(i, 1);
                                        if (pageObj == scope.pickedPage) {
                                            scope.pickedPage = scope.sketchWorks.pages[j];
                                        }
                                    }
                                }

                                scope.copyPage = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var i = $(".pageList select").val(),
                                        pageObj = scope.sketchWorks.pages[i],
                                        cloneObj = uiService.copyPage(pageObj, $("." + options.pageHolderClass));

                                    cloneObj.addClass("pickedWidget");
                                    cloneObj.addClass("pageHolder");
                                    scope.pickedPage && scope.pickedPage.removeClass("pickedWidget");
                                    scope.pickedPage = cloneObj;
                                    scope.sketchWorks.pages.splice(i + 1, 0, cloneObj);
                                }

                                $timeout(function () {
                                    $(".pageList select").change(function () {
                                        var i = $(this).val(),
                                            pageObj = scope.sketchWorks.pages[i];

                                        if (pageObj.id != scope.pickedPage.id) {
                                            scope.pickedPage = pageObj;
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