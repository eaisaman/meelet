define(
    ["angular-lib", "jquery-lib", "underscore-lib", "ng.ui.util", "ng.ui.service"],
    function () {
        var BookService = function ($parse, $timeout, $q, $exceptionHandler, $compile, $rootScope, angularEventTypes, angularConstants, appService, uiUtilService, uiCanvasService, uiAnimationService) {
            this.$parse = $parse;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$exceptionHandler = $exceptionHandler;
            this.$compile = $compile;
            this.$rootScope = $rootScope;
            this.angularEventTypes = angularEventTypes;
            this.angularConstants = angularConstants;
            this.appService = appService;
            this.uiUtilService = uiUtilService;
            this.uiCanvasService = uiCanvasService;
            this.uiAnimationService = uiAnimationService;

            _.extend($inject, _.pick(this, BookService.$inject));

            defineBookClass(uiUtilService.createObjectClass(), uiUtilService.findObjectClass());
        };

        BookService.$inject = ["$parse", "$timeout", "$q", "$exceptionHandler", "$compile", "$rootScope", "angularEventTypes", "angularConstants", "appService", "uiUtilService", "uiCanvasService", "uiAnimationService"];
        var $inject = {};

        function defineBookClass(Class, FindClass) {
            var Project = FindClass("Project"),
                BookProject = Class(Project, {
                    CLASS_NAME: "BookProject",
                    WIDGET_CLASSES: _.union(Project.prototype.WIDGET_CLASSES, ["BookIncludeSketchWidget"]),
                    ACTION_CLASSES: _.union(Project.prototype.ACTION_CLASSES, ["IncludeTransitionAction"]),
                    MEMBERS: {},
                    initialize: function (projectRecord) {
                        this.initialize.prototype.__proto__.initialize.apply(this, [projectRecord]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    }
                }),
                BookIncludeSketchWidgetClass = Class(FindClass("ElementSketchWidget"), {
                    CLASS_NAME: "BookIncludeSketchWidget",
                    DEFAULT_STYLE: {
                        "width": "100px",
                        "height": "100px",
                        "linearGradientColor": {colorStopList: [{color: {color: "#ffffff", alpha: 1}, angle: 0}]}
                    },
                    MEMBERS: {
                        externalBook: null,
                        externalPage: null,
                        externalFile: null,
                        edge: null
                    },
                    initialize: function (id, externalBook, externalPage, externalFile, edge) {
                        BookIncludeSketchWidgetClass.prototype.__proto__.initialize.apply(this, [id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }

                        this.resizable = false;
                        this.externalBook = externalBook;
                        this.externalPage = externalPage;
                        this.externalFile = externalFile;
                        this.edge = edge;

                        var self = this;
                        _.each(BookIncludeSketchWidgetClass.prototype.DEFAULT_STYLE, function (styleValue, styleName) {
                            !self.css(styleName) && self.css(styleName, angular.copy(styleValue));
                        });
                    },
                    toJSON: function () {
                        var jsonObj = BookIncludeSketchWidgetClass.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME", "externalBook", "externalPage", "externalFile", "edge"]));

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new BookIncludeSketchWidgetClass(obj.id, obj.externalBook, obj.externalPage, obj.externalFile, obj.edge);

                        BookIncludeSketchWidgetClass.prototype.__proto__.fromObject.apply(ret, [obj]);

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return BookIncludeSketchWidgetClass.prototype.CLASS_NAME == className || BookIncludeSketchWidgetClass.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        cloneObj = cloneObj || new BookIncludeSketchWidgetClass(null, this.externalBook, this.externalPage, this.externalFile, this.edge);
                        _.extend(MEMBERS = MEMBERS || {}, BookIncludeSketchWidgetClass.prototype.MEMBERS);

                        BookIncludeSketchWidgetClass.prototype.__proto__.clone.apply(this, [cloneObj, MEMBERS]);

                        return cloneObj;
                    },
                    addState: function () {
                    },
                    removeState: function () {
                    },
                    addStateOption: function () {
                    },
                    removeStateOption: function () {
                    },
                    setState: function (value) {
                        var self = this,
                            ret = BookIncludeSketchWidgetClass.prototype.__proto__.setState.apply(this, [value]),
                            stateName = typeof value === "string" && value || value.name;

                        if (ret && ret.then) {
                            ret.then(function () {
                                var state = self.getState(stateName);

                                if (state.actionObj.isEmpty()) {
                                    var action = state.actionObj.addAction("Include");
                                    action.url = "resource/external/{0}/{1}/{2}".format(self.externalBook, self.externalPage, self.externalFile);
                                    action.edge = self.edge;
                                }
                            });
                        } else {
                            var state = self.getState(stateName);

                            if (state.actionObj.isEmpty()) {
                                var action = state.actionObj.addAction("Include");
                                action.url = "resource/external/{0}/{1}/{2}".format(self.externalBook, self.externalPage, self.externalFile);
                                action.edge = self.edge;
                            }
                        }
                    },
                    setStateContext: function (value) {
                        var self = this;

                        if (value) {
                            BookIncludeSketchWidgetClass.prototype.__proto__.setStateContext.apply(self, [value]);

                            if (self.state.actionObj.isEmpty()) {
                                var action = self.state.actionObj.addAction("Include");
                                action.url = "resource/external/{0}/{1}/{2}".format(self.externalBook, self.externalPage, self.externalFile);
                                action.edge = self.edge;
                            }
                        }
                    },
                    appendTo: function (container) {
                        var self = this;

                        return BookIncludeSketchWidgetClass.prototype.__proto__.appendTo.apply(self, [container]).then(
                            function () {
                                if (self.$element && self.$element[0].nodeType == 1 && self.$element.parent().length) {
                                    if (self.externalBook && self.externalPage && self.externalFile) {
                                        $inject.$rootScope.loadedProject.validateIncludeExternal(self.$element, "{0}/{1}/{2}".format(self.externalBook, self.externalPage, self.externalFile));
                                    }

                                    return $inject.uiUtilService.getResolveDefer(self);
                                } else {
                                    return $inject.uiUtilService.getRejectDefer("Invalid Element {0}".format(self.id));
                                }
                            }, function (err) {
                                return $inject.uiUtilService.getRejectDefer(err);
                            }
                        );
                    },
                    setExternal: function (externalBook, externalPage, externalFile, edge) {
                        this.externalBook = externalBook;
                        this.externalPage = externalPage;
                        this.externalFile = externalFile;
                        this.edge = edge;

                        this.states.forEach(function (s) {
                            var action;
                            if (!s.actionObj.isEmpty()) {
                                action = _.findWhere(state.actionObj.childActions, {actionType: "Include"});
                            }
                            if (!action) {
                                action = state.actionObj.addAction("Include");
                            }
                            action.url = "resource/external/{0}/{1}/{2}".format(self.externalBook, self.externalPage, self.externalFile);
                            action.edge = self.edge;
                        });
                    }
                }),
                IncludeTransitionAction = Class(FindClass("BaseTransitionAction"), {
                    CLASS_NAME: "IncludeTransitionAction",
                    MEMBERS: {
                        actionType: "Include",
                        url: "",
                        edge: ""
                    },
                    initialize: function (widgetObj, url, edge, id) {
                        IncludeTransitionAction.prototype.__proto__.initialize.apply(this, [widgetObj, id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                        this.url = url || this.url;
                        this.edge = edge || this.edge;
                    },
                    toJSON: function () {
                        var jsonObj = IncludeTransitionAction.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["url", "edge", "CLASS_NAME"]));

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new IncludeTransitionAction(null, obj.url, obj.edge, obj.id);

                        IncludeTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj]);

                        return ret;
                    },
                    clone: function (cloneObj, MEMBERS) {
                        cloneObj = cloneObj || new IncludeTransitionAction(this.widgetObj, this.url, this.edge);

                        _.extend(MEMBERS = MEMBERS || {}, IncludeTransitionAction.prototype.MEMBERS);

                        IncludeTransitionAction.prototype.__proto__.clone.apply(this, [cloneObj, MEMBERS]);

                        return cloneObj;
                    },
                    doAction: function () {
                        return $inject.uiUtilService.getResolveDefer();
                    }
                });

            BookService.prototype.loadProject = function (dbObject) {
                var self = this;

                if (!_.isEmpty(self.$rootScope.loadedProject)) {
                    self.$rootScope.loadedProject.unload();
                }
                self.$rootScope.loadedProject = new BookProject(dbObject);

                //FIXME Need display error alert here.
                return this.uiUtilService.chain(
                    [
                        function () {
                            return self.$rootScope.loadedProject.loadDependencies();
                        },
                        function () {
                            return self.$rootScope.loadedProject.loadResources();
                        },
                        function () {
                            return self.$rootScope.loadedProject.loadSketch();
                        },
                        function () {
                            return self.$rootScope.loadedProject.loadExternal();
                        },
                        function () {
                            self.$rootScope.$broadcast(self.angularEventTypes.switchProjectEvent, self.$rootScope.loadedProject);

                            return self.$rootScope.loadedProject.tryLock(self.$rootScope.loginUser._id);
                        }
                    ]
                );
            }

            BookService.prototype.createBookWidget = function (containerElement, externalBook, externalPage, externalFile, edge) {
                var self = this,
                    $container;

                if (containerElement.jquery) {
                    $container = containerElement;
                } else if (typeof containerElement === "string" || angular.isElement(containerElement)) {
                    $container = $(containerElement);
                }

                if ($container) {
                    var $parent,
                        anchor;

                    if ($container.hasClass(self.angularConstants.widgetClasses.holderClass) || $container.hasClass(self.angularConstants.widgetClasses.widgetClass)) {
                        $parent = $container;
                    } else if ($container.attr(self.angularConstants.anchorAttr) != null) {
                        $parent = $container.closest("[ui-sketch-widget]");
                        anchor = $container.attr(self.angularConstants.anchorAttr);
                    }

                    if ($parent) {
                        var widgetObj = new BookIncludeSketchWidgetClass(null, externalBook, externalPage, externalFile, edge);
                        widgetObj.anchor = anchor;
                        widgetObj.attr["ui-sketch-widget"] = "";
                        widgetObj.attr["ng-class"] = "{'isPlaying': $root.sketchWidgetSetting.isPlaying}";
                        widgetObj.addOmniClass(self.angularConstants.widgetClasses.widgetClass);

                        widgetObj.appendTo($parent).then(function () {
                            var parentScope = angular.element($parent).scope();
                            self.$compile(widgetObj.$element)(parentScope);
                        });

                        return widgetObj;
                    }
                }
            }
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('uiBookService', BookService);
                }]);
        };
    }
)
;