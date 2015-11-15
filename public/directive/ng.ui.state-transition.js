define(
    ["angular-lib", "jquery-lib"],
    function () {
        return function (appModule, extension, opts) {
            var inject = ["$rootScope", "$http", "$parse", "$timeout", "$q", "$exceptionHandler", "angularEventTypes", "angularConstants", "utilService", "uiService", "uiCanvasService", "appService", "serviceRegistry"];

            appModule.directive("uiStateTransition", _.union(inject, [function ($rootScope, $http, $parse, $timeout, $q, $exceptionHandler, angularEventTypes, angularConstants, utilService, uiService, uiCanvasService, appService, serviceRegistry) {
                'use strict';

                var defaults = {
                        triggerJson: ""
                    },
                    options = angular.extend(defaults, opts),
                    injectObj = _.object(inject, Array.prototype.slice.call(arguments));

                return {
                    restrict: "A",
                    scope: {pickedWidget: "=", pickedPage: "=", dockAlign: "="},
                    replace: false,
                    templateUrl: "include/_state_transition.html",
                    compile: function (element, attrs) {
                        return {
                            pre: function (scope, element, attrs) {
                                extension && extension.attach && extension.attach(scope, _.extend(injectObj, {
                                    "$timeout": $timeout,
                                    "$q": $q,
                                    "angularConstants": angularConstants,
                                    "utilService": utilService,
                                    element: element,
                                    scope: scope
                                }));

                                scope.pickEffectArtifact = function (action, artifactId) {
                                    scope.effectList.splice(0);

                                    scope.filterEffectLibraryList.every(function (library) {
                                        return library.artifactList.every(function (artifact) {
                                            if (artifact._id === artifactId) {
                                                var arr = artifact.json.slice(0, artifact.json.length);
                                                arr.splice(0, 0, 0, 0);
                                                Array.prototype.splice.apply(scope.effectList, arr);

                                                if (!action.artifactSpec || action.artifactSpec.artifactId !== artifact._id) {
                                                    action.artifactSpec = {
                                                        type: artifact.type,
                                                        directiveName: artifact.directiveName,
                                                        libraryName: library.name,
                                                        artifactName: artifact.name,
                                                        artifactId: artifact._id,
                                                        version: artifact._version || (artifact.versionList.length && artifact.versionList[artifact.versionList.length - 1].name) || ""
                                                    }
                                                }
                                                return false;
                                            }

                                            return true;
                                        });

                                    });
                                };

                                scope.initEffectList = function (action) {
                                    scope.effectList.splice();

                                    if (action.artifactSpec && action.artifactSpec.artifactId) {
                                        var artifactId = action.artifactSpec.artifactId;

                                        scope.filterEffectLibraryList.every(function (library) {
                                            return library.artifactList.every(function (artifact) {
                                                if (artifact._id === artifactId) {
                                                    var arr = utilService.listOmit(artifact.json, "$$hashkey");
                                                    arr.splice(0, 0, 0, 0);
                                                    Array.prototype.splice.apply(scope.effectList, arr);

                                                    return false;
                                                }

                                                return true;
                                            });

                                        });
                                    }
                                };

                                scope.filterLibraryList = function (libraryList, xrefList) {
                                    return utilService.filterSelection(libraryList, xrefList, [{
                                        target: '_id',
                                        source: 'libraryId'
                                    }]);
                                };

                                scope.filterArtifactList = function (effectLibrary, xrefList) {
                                    var artifactList = (_.findWhere(xrefList, {libraryId: effectLibrary._id}) || {}).artifactList;

                                    return utilService.filterSelection(effectLibrary.artifactList, artifactList, [{
                                        target: '_id',
                                        source: 'artifactId'
                                    }]);
                                };

                                scope.markLibrarySelection = function (libraryList, xrefList) {
                                    return utilService.markSelection(libraryList, xrefList, [{
                                        target: '_id',
                                        source: 'libraryId'
                                    }]);
                                };

                                scope.markArtifactSelection = function (effectLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: effectLibrary._id}) || {},
                                        artifactList = xref.artifactList;

                                    return utilService.markSelection(effectLibrary.artifactList, artifactList, [{
                                        target: '_id',
                                        source: 'artifactId'
                                    }]);
                                };

                                scope.isPartialSelection = function (effectLibrary, xrefList) {
                                    var xref = _.findWhere(xrefList, {libraryId: effectLibrary._id}),
                                        artifactList = effectLibrary.artifactList;

                                    return xref && artifactList && artifactList.length > xref.artifactList.length;
                                };

                                scope.onMovementActionRouteIndexChange = function (routeIndex) {
                                    if (!$rootScope.sketchWidgetSetting.isDefingRoute) {
                                        uiCanvasService.initCanvas();
                                        item.widgetObj.displayRoute();

                                        $rootScope.sketchWidgetSetting.isDefingRoute = true;
                                        $rootScope.$broadcast(angularEventTypes.defineWidgetRouteEvent, $rootScope.sketchWidgetSetting.isDefingRoute);
                                    }

                                    $rootScope.$broadcast(angularEventTypes.markWidgetRouteEvent, routeIndex);
                                };

                                scope.onPickServiceFeature = function (action) {
                                    if (action.feature) {
                                        scope.pickedServiceFeature = _.findWhere(scope.registry, {feature: action.feature});
                                    }
                                };

                                scope.onPickService = function (action) {
                                    scope.pickedServiceFeature && scope.pickedServiceFeature.serviceList.every(function (service) {
                                        if (action.serviceName === service.name) {
                                            action.communicationType = service.communicationType;
                                            action.parameters = _.clone(service.parameters);
                                            return false;
                                        }

                                        return true;
                                    });
                                };

                                scope.createInputParameter = function (action, parameter, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    action.input = action.input || [];
                                    if (action.input.every(function (item) {
                                            return item.name !== parameter;
                                        })) {
                                        action.input.push({name: parameter, expression: ""});
                                    }

                                    return utilService.getResolveDefer();
                                };

                                scope.deleteInputParameter = function (action, inputItem, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var index;
                                    if (action.input && !action.input.every(function (item, i) {
                                            if (item.name === inputItem.name) {
                                                index = i;
                                                return false;
                                            }

                                            return true;
                                        })) {
                                        action.input.splice(index, 1);
                                    }

                                    return utilService.getResolveDefer();
                                };

                                function createConfigurationItemAssign(name) {
                                    var fn = $parse(name),
                                        assign = fn.assign;

                                    if (!fn.assign.customized) {
                                        fn.assign = function ($scope, value) {
                                            function itemHandler() {
                                                var defer = $q.defer();

                                                $timeout(function () {
                                                    $scope.item.setConfigurationItem($scope.configurationItem);
                                                    defer.resolve();
                                                });

                                                return defer.promise;
                                            }

                                            if (value) {
                                                var args = Array.prototype.slice.call(arguments),
                                                    result = assign.apply(fn, args);

                                                utilService.latestOnce(
                                                    itemHandler,
                                                    null,
                                                    null,
                                                    angularConstants.unresponsiveInterval, "uiStateTransition.createConfigurationItemAssign.itemHandler.{0}.{1}".format($scope.configurationItem.widget.id, $scope.configurationItem.name)
                                                )();

                                                return result;
                                            }
                                        };

                                        fn.assign.customized = true;
                                    }
                                    return fn;
                                }

                                createConfigurationItemAssign("configurationItem.configuredValue");

                                scope._ = _;
                            },
                            post: function (scope, element, attrs) {
                                scope.toggleTransitionDetails = function (selector, event) {
                                    return scope.toggleSelect(selector, event).then(function (selector) {
                                        var $el = $(selector);

                                        scope.selectTab(
                                            $el,
                                            $el.find("div[tab-sel^=tab-head-transition-details]").get(0),
                                            null,
                                            "transition-details"
                                        );

                                        $el.find('#triggerContent input[type=radio]').iCheck({
                                            checkboxClass: 'icheckbox_square-blue',
                                            radioClass: 'iradio_square-blue',
                                            increaseArea: '20%'
                                        });

                                        return utilService.getResolveDefer();
                                    });
                                };

                                scope.selectTransitionDetailsTab = function (event) {
                                    return scope.toggleSelect("#actionWidgetTreeTab", null, false).then(function () {
                                        return scope.selectTab(event.currentTarget, event.target, event);
                                    });
                                };

                                scope.toggleActionPanel = function (selector, event) {
                                    return scope.toggleExpand(selector, event).then(function (selector) {
                                        var $el = $(selector),
                                            $panel = $el.find(".transition-action-panel");

                                        return scope.toggleDisplay($panel);
                                    });
                                };

                                scope.toggleConfigurationBody = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    return scope.toggleSelect(event.currentTarget).then(function (target) {
                                        var $el = $(target);

                                        if ($el.hasClass("select")) {
                                            $el.find('input.configurationCheckBox').on('ifChanged', function (event) {
                                                var configurationScope = angular.element(event.target).scope();
                                                configurationScope.configurationItem.booleanValue = event.target.checked;
                                                configurationScope.$apply();
                                            }).iCheck({
                                                checkboxClass: 'icheckbox_square-blue',
                                                radioClass: 'iradio_square-blue',
                                                increaseArea: '20%'
                                            });
                                        }

                                        return utilService.getResolveDefer();
                                    });
                                };

                                scope.toggleActionWidgetTree = function (action, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    return scope.toggleSelect("#actionWidgetTreeTab").then(function () {
                                        if (element.find("#actionWidgetTreeTab").hasClass("select")) {
                                            scope.pickedAction = action;
                                        } else {
                                            if (action) {
                                                var $node = element.find("#actionWidgetTreeTab li.selected");
                                                if ($node.length) {
                                                    var nodeScope = angular.element($node).scope();
                                                    action.setWidget(nodeScope.item);
                                                }
                                            }
                                            scope.pickedAction = null;
                                        }

                                        return utilService.getResolveDefer();
                                    });
                                };

                                scope.createState = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var $createButton = $(event.currentTarget),
                                        $stateOption = $createButton.siblings(".stateOption.select"),
                                        stateName = $stateOption.attr("name");

                                    stateName && scope.activeWidget.addState(stateName);

                                    return utilService.getResolveDefer();
                                };

                                scope.createStateOption = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var stateName = $("#stateOptionInput").val();
                                    stateName && scope.activeWidget.addStateOption({name: stateName});

                                    return utilService.getResolveDefer();
                                };

                                scope.createTransition = function (state, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (state && scope.activeWidget) {
                                        var transitionName = $("#transitionNameInput").val();
                                        transitionName && state.addTransition(transitionName);
                                    }

                                    return utilService.getResolveDefer();
                                };

                                scope.createAction = function (parentAction, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (parentAction) {
                                        var actionType = $("#actionTypeSelect").val();
                                        actionType && parentAction.addAction(actionType);
                                    }

                                    return utilService.getResolveDefer();
                                };

                                scope.onUpdateStopOnEach = function (sequenceAction, stopOnEach) {
                                    sequenceAction.setStopOnEach(stopOnEach);
                                };

                                scope.deleteState = function (state, event) {
                                    if (event) {
                                        event.stopPropagation && event.stopPropagation();
                                        event.preventDefault && event.preventDefault();
                                    }

                                    scope.activeWidget && scope.activeWidget.removeState(state);

                                    return utilService.getResolveDefer();
                                };

                                scope.deleteStateOption = function (stateOption, event) {
                                    if (event) {
                                        event.stopPropagation && event.stopPropagation();
                                        event.preventDefault && event.preventDefault();
                                    }

                                    scope.activeWidget && scope.activeWidget.removeStateOption(stateOption);

                                    return utilService.getResolveDefer();
                                };

                                scope.deleteTransition = function (state, transition, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (state && transition) {
                                        var index;
                                        state.transitions.every(function (t, i) {
                                            if (t.id === transition.id) {
                                                index = i;
                                                return false;
                                            }
                                            return true;
                                        });

                                        index != undefined && state.transitions.splice(index, 1);
                                    }

                                    return utilService.getResolveDefer();
                                };

                                scope.deleteAction = function (parentAction, action, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    if (parentAction && action) {
                                        var index;
                                        parentAction.childActions.every(function (a, i) {
                                            if (a.id === action.id) {
                                                index = i;
                                                return false;
                                            }
                                            return true;
                                        });

                                        index != undefined && parentAction.childActions.splice(index, 1);
                                    }

                                    return utilService.getResolveDefer();
                                };

                                scope.getStateOptions = function (item) {
                                    var stateOptions = [_.clone(item.initialStateOption)];

                                    item.stateOptions.forEach(function (stateOption) {
                                        stateOptions.push(_.clone(stateOption));
                                    });

                                    return stateOptions;
                                };

                                scope.createEffectObj = function (effectValue) {
                                    return {
                                        name: effectValue.replace(/\+.+$/g, ''),
                                        type: effectValue.replace(/^.+\+/g, ''),
                                        options: {}
                                    };
                                };

                                scope.pickTriggerEvent = function (triggerType, transition, triggerEventId) {
                                    var triggerList = scope.triggers[triggerType];

                                    triggerList && triggerList.every(function (triggerEvent) {
                                        if (triggerEvent.id === triggerEventId) {
                                            transition.setTrigger(triggerEventId, triggerType, triggerEvent.eventName, triggerEvent.options);

                                            return false;
                                        }

                                        return true;
                                    });
                                };

                                scope.toggleSelectLibraryList = function (event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    return scope.toggleSelect(".effectLibraryList").then(function () {
                                        if (element.find(".effectLibraryList").hasClass("select")) {
                                            element.find(".effectLibraryList").siblings("div").css("opacity", 0);
                                        } else {
                                            element.find(".effectLibraryList").siblings("div").css("opacity", 1);
                                        }

                                        return utilService.getResolveDefer();
                                    });
                                };

                                scope.toggleArtifactSelection = function (repoArtifact, effectLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    repoArtifact._version = (repoArtifact.versionList.length && repoArtifact.versionList[repoArtifact.versionList.length - 1].name || "");

                                    if (repoArtifact._version) {
                                        var xref = _.findWhere($rootScope.loadedProject.xrefRecord, {libraryId: effectLibrary._id});

                                        if (xref) {
                                            var artifact = _.findWhere(xref.artifactList, {artifactId: repoArtifact._id});
                                            if (artifact) {
                                                var result = $rootScope.loadedProject.unselectArtifact(effectLibrary._id, repoArtifact._id);
                                                if (result.artifactUnselect) {
                                                    delete repoArtifact._selected;
                                                    delete repoArtifact._version;
                                                }
                                                if (result.libraryUnselect) {
                                                    delete effectLibrary._selected;

                                                    var index;
                                                    if (!scope.filterEffectLibraryList.every(function (lib, i) {
                                                            if (lib._id === effectLibrary._id) {
                                                                index = i;
                                                                return false;
                                                            }

                                                            return true;
                                                        })) {
                                                        scope.filterEffectLibraryList.splice(index, 1);
                                                    }
                                                }
                                            } else {
                                                if ($rootScope.loadedProject.selectArtifact(effectLibrary._id, repoArtifact._id, repoArtifact.name, repoArtifact._version)) {
                                                    repoArtifact._selected = true;
                                                }
                                            }
                                        } else {
                                            $rootScope.loadedProject.addLibrary(
                                                effectLibrary._id,
                                                effectLibrary.name,
                                                effectLibrary.type,
                                                [
                                                    {
                                                        artifactId: repoArtifact._id,
                                                        name: repoArtifact.name,
                                                        version: repoArtifact._version
                                                    }
                                                ]
                                            );

                                            repoArtifact._selected = true;

                                            if (scope.filterEffectLibraryList.every(function (lib) {
                                                    return lib._id !== effectLibrary._id;
                                                })) {
                                                scope.filterEffectLibraryList.push(effectLibrary);
                                            }
                                        }

                                    }

                                    return utilService.getResolveDefer();
                                };

                                scope.toggleLibrarySelection = function (effectLibrary, event) {
                                    event && event.stopPropagation && event.stopPropagation();

                                    var library = _.findWhere($rootScope.loadedProject.xrefRecord, {libraryId: effectLibrary._id});
                                    if (library) {
                                        if ($rootScope.loadedProject.removeLibrary(effectLibrary._id)) {
                                            delete effectLibrary._selected;

                                            var index;
                                            if (!scope.filterEffectLibraryList.every(function (lib, i) {
                                                    if (lib._id === effectLibrary._id) {
                                                        index = i;
                                                        return false;
                                                    }

                                                    return true;
                                                })) {
                                                scope.filterEffectLibraryList.splice(index, 1);
                                            }
                                        }
                                    } else {
                                        var artifactList = [];
                                        effectLibrary.artifactList.forEach(function (artifact) {
                                            var version = artifact.versionList.length && artifact.versionList[artifact.versionList.length - 1].name || "";

                                            version && artifactList.push({
                                                artifactId: artifact._id,
                                                name: artifact.name,
                                                version: version
                                            });
                                        });

                                        if (artifactList.length && $rootScope.loadedProject.addLibrary(effectLibrary._id, effectLibrary.name, effectLibrary.type, artifactList)) {
                                            effectLibrary._selected = true;

                                            if (scope.filterEffectLibraryList.every(function (lib) {
                                                    return lib._id !== effectLibrary._id;
                                                })) {
                                                scope.filterEffectLibraryList.push(effectLibrary);
                                            }
                                        }
                                    }

                                    return utilService.getResolveDefer();
                                };

                                if (options.triggerJson) {
                                    $http.get(options.triggerJson).then(function (result) {
                                        result.data.forEach(function (triggerGroup) {
                                            scope.triggers[triggerGroup.group] = triggerGroup.list;
                                        });
                                    });
                                }

                                scope.triggers = {};
                                scope.effectList = [];
                                scope.effectLibraryList = $rootScope.effectLibraryList;
                                scope.filterEffectLibraryList = [];
                                scope.registry = serviceRegistry.registry;

                                function refreshArtifactList(project) {
                                    utilService.latestOnce(
                                        function () {
                                            return $timeout(function () {
                                                appService.loadEffectArtifactList().then(function () {
                                                    var arr = scope.filterLibraryList(scope.effectLibraryList, project.xrefRecord);
                                                    arr.splice(0, 0, 0, 0);
                                                    scope.filterEffectLibraryList.splice(0);
                                                    Array.prototype.splice.apply(scope.filterEffectLibraryList, arr);
                                                });
                                            });
                                        },
                                        null,
                                        null,
                                        angularConstants.unresponsiveInterval,
                                        "ui-state-transition.compile.post.refreshArtifactList"
                                    )();
                                }

                                scope.pickedWidgetWatcher = scope.$watch("pickedWidget", function (value) {
                                    if (value) {
                                        var widgetObj = uiService.configurableWidget(value);
                                        scope.activeWidget = widgetObj || value;
                                    }
                                });

                                scope.switchProjectWatcher = scope.$on(angularEventTypes.switchProjectEvent, function (event, project) {
                                    refreshArtifactList(project);
                                });

                                utilService.latestOnce(
                                    function () {
                                        return $timeout(function () {
                                            var $wrapper = element.find(".ui-control-wrapper"),
                                                $panel = element.find(".ui-control-panel");

                                            $wrapper.addClass("expanded");
                                            $panel.addClass("show");
                                        });
                                    },
                                    null,
                                    null,
                                    angularConstants.unresponsiveInterval,
                                    "ui-state-transition.compile.post.init"
                                )();

                                if ($rootScope.loadedProject.projectRecord && $rootScope.loadedProject.projectRecord._id) {
                                    refreshArtifactList($rootScope.loadedProject);
                                }

                                scope.$on('$destroy', function () {
                                    scope.switchProjectWatcher && scope.switchProjectWatcher();
                                    scope.switchProjectWatcher = null;

                                    scope.pickedWidgetWatcher && scope.pickedWidgetWatcher();
                                    scope.pickedWidgetWatcher = null;
                                });
                            }
                        }
                    }
                }
            }]));
        }
    }
);