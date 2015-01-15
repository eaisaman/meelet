define(
    ["angular", "jquery", "underscore", "ng.ui.util"],
    function () {
        var Service = function ($parse, $timeout, $q, $compile, $rootScope, angularConstants, appService, uiUtilService) {
            this.$parse = $parse;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$compile = $compile;
            this.$rootScope = $rootScope;
            this.angularConstants = angularConstants;
            this.appService = appService;
            this.uiUtilService = uiUtilService;

            _.extend($inject, _.pick(this, Service.$inject));
        };

        Service.$inject = ["$parse", "$timeout", "$q", "$compile", "$rootScope", "angularConstants", "appService", "uiUtilService"];
        var $inject = {};

        //Define sketch widget class
        var Class = function () {
                var len = arguments.length;
                var P = arguments[0];
                var F = arguments[len - 1];

                var C = typeof F.initialize == "function" ?
                    F.initialize :
                    function () {
                        P.prototype.initialize.apply(this, arguments);
                    };

                if (len > 1) {
                    var newArgs = [].concat(
                        Array.prototype.slice.call(arguments).slice(1, len - 1), F);

                    var OF = function () {
                    };
                    OF.prototype = P.prototype;
                    C.prototype = new OF;

                    newArgs.forEach(function (o) {
                        if (typeof o === "function") {
                            o = o.prototype;
                        }
                        _.extend(C.prototype, o);
                    });
                } else {
                    C.prototype = F;
                }
                return C;
            },
            State = Class({
                CLASS_NAME: "State",
                MEMBERS: {
                    id: "",
                    context: null,
                    node: null,
                    name: null,
                    transitions: []
                },
                initialize: function (node, name, context, id) {
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }
                    if (typeof node === "string") {
                        this.node = node;
                    } else {
                        this.widgetObj = node;
                        this.node = node.id;
                    }
                    this.context = context;
                    this.name = name;
                    this.id = id || "State_" + new Date().getTime();
                },
                toJSON: function () {
                    return _.extend(_.pick(this, ["id", "node", "name", "transitions"], "CLASS_NAME"), {context: this.context && this.context.node !== "?" && this.context.id || ""});
                },
                fromObject: function (obj) {
                    var ret = new State(obj.node, obj.name, obj.context, obj.id);
                    obj.transitions && obj.transitions.forEach(function (t) {
                        var transition = Transition.prototype.fromObject(t);
                        transition.state = ret;
                        ret.transitions.push(transition);
                    });

                    return ret;
                },
                setContext: function (value) {
                    this.context = value;
                },
                toString: function () {
                    return this.node !== "?" && this.id || "?";
                },
                addTransition: function (name) {
                    this.transitions.push(new Transition(name, this));
                },
                removeToState: function (toState) {
                    var self = this;

                    self.transitions = _.reject(self.transitions, function (t) {
                        return t.toState == toState;
                    });
                },
                removeToStateOption: function (stateOption) {
                    var self = this;

                    self.transitions = _.reject(self.transitions, function (t) {
                        return t.toState.name == stateOption.name;
                    });
                },
                clone: function () {
                    var cloneObj = new State(this.node, this.name, this.context);
                    cloneObj.widgetObj = this.widgetObj;

                    return cloneObj;
                }
            }),
            Transition = Class({
                CLASS_NAME: "Transition",
                MEMBERS: {
                    id: "",
                    name: "",
                    state: null,
                    trigger: null,
                    actionObj: null
                },
                initialize: function (name, state, id) {
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }

                    this.name = name;
                    this.state = state;
                    this.id = id || "Transition_" + new Date().getTime();
                    this.actionObj = new SequenceTransitionAction();

                    if (typeof state === "object") {
                        this.actionObj.widgetObj = state.widgetObj;
                    }
                },
                toJSON: function () {
                    return _.extend(_.pick(this, ["name", "id", "trigger", "actionObj"], "CLASS_NAME"), {
                        state: this.state.id
                    });
                },
                fromObject: function (obj) {
                    var ret = new Transition(obj.name, null, obj.id);

                    obj.trigger && ret.setTrigger(obj.trigger.triggerType, obj.trigger.eventName, obj.trigger.options);

                    if (obj.actionObj) {
                        var classes = ["SequenceTransitionAction"],
                            className = obj.actionObj.CLASS_NAME,
                            actionObj;

                        classes.every(function (clazz) {
                            if (eval("className === {0}.prototype.CLASS_NAME".format(clazz))) {
                                actionObj = eval("{0}.prototype.fromObject(obj.actionObj)".format(clazz));
                                return false;
                            }

                            return true;
                        });
                        ret.actionObj = actionObj;
                    }

                    return ret;
                },
                createTriggerSetter: function (triggerType) {
                    var self = this,
                        fn = $inject.$parse("transition." + triggerType.charAt(0).toLowerCase() + triggerType.substr(1) + "EventName"),
                        assign = fn.assign;

                    if (!fn.assign.customizedForTrigger) {
                        fn.assign = function (scope, eventId) {
                            function triggerSetterHandler(transition, triggerType, eventName, options) {
                                var defer = $inject.$q.defer();

                                $inject.$timeout(function () {
                                    transition.setTrigger(triggerType, eventName, options);

                                    defer.resolve();
                                });

                                return defer.promise;
                            }

                            triggerSetterHandler.onceId = "Transition.createTriggerSetter.triggerSetterHandler";

                            if (eventId) {
                                var args = Array.prototype.slice.call(arguments),
                                    result = assign.apply(fn, args),
                                    triggerInfo = _.where(scope.triggers[triggerType], {id: eventId}),
                                    transition = scope.transition;

                                if (triggerInfo.length) {
                                    var options = triggerInfo[0].options,
                                        eventName = triggerInfo[0].eventName;

                                    $inject.uiUtilService.once(triggerSetterHandler, null, 20)(transition, triggerType, eventName, options);
                                }

                                return result;
                            }
                        }

                        fn.assign.customizedForTrigger = true;
                    }
                    return fn;
                },
                setAction: function (actionObj) {
                    this.actionObj = actionObj;
                },
                setTrigger: function (triggerType, eventName, options) {
                    var self = this,
                        trigger;

                    function triggerCallback(event, widgetObj) {
                        self.actionObj && self.actionObj.doAction();
                    }

                    if (triggerType === "Gesture") {
                        if (eventName) {
                            trigger = new GestureTrigger(eventName, options, triggerCallback);
                        }
                    }

                    if (trigger) {
                        var widgetObj;
                        if (this.trigger) {
                            widgetObj = this.trigger.widgetObj;
                            this.unregisterTrigger();
                        }
                        this.trigger = trigger;
                        widgetObj && this.trigger.on(widgetObj);
                    }
                },
                registerTrigger: function (widgetObj) {
                    this.trigger && widgetObj.isPlaying && this.trigger.on(widgetObj);
                },
                unregisterTrigger: function () {
                    this.trigger && this.trigger.off();
                }
            }),
            BaseTransitionAction = Class({
                CLASS_NAME: "BaseTransitionAction",
                MEMBERS: {
                    id: "",
                    actionType: "",
                    widgetObj: null
                },
                initialize: function (widgetObj, actionType, id) {
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }

                    this.widgetObj = widgetObj;
                    this.actionType = actionType;
                    this.id = id || "TransitionAction_" + new Date().getTime();
                },
                toJSON: function () {
                    return _.pick(this, ["id", "actionType"], "CLASS_NAME");
                    return _.extend(_.pick(this, ["id", "actionType"], "CLASS_NAME"), {
                        widgetObj: this.widgetObj.id
                    });
                },
                fromObject: function (obj) {
                    var self = this;

                    BaseSketchWidgetClass.prototype.matchReference(obj.widgetObj, function (obj) {
                        self.widgetObj = obj;
                    });
                },
                doAction: function (widgetObj) {
                },
                restoreWidget: function (widgetObj) {
                }
            }),
            SequenceTransitionAction = Class(BaseTransitionAction, {
                CLASS_NAME: "SequenceTransitionAction",
                MEMBERS: {
                    childActions: []
                },
                initialize: function (widgetObj, id) {
                    this.initialize.prototype.__proto__.initialize.apply(this, [widgetObj, "Sequence", id]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }
                },
                toJSON: function () {
                    var jsonObj = SequenceTransitionAction.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["childActions", "CLASS_NAME"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    var ret = new SequenceTransitionAction(obj.widgetObj, obj.id);

                    SequenceTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj]);

                    var classes = ["AnimationTransitionAction", "StateTransitionAction", "ConfigurationTransitionAction"];
                    obj.childActions && obj.childActions.forEach(function (action) {
                        var className = action.CLASS_NAME,
                            actionObj;

                        classes.every(function (clazz) {
                            if (eval("className === {0}.prototype.CLASS_NAME".format(clazz))) {
                                actionObj = eval("{0}.prototype.fromObject(action)".format(clazz));
                                ret.childActions.push(actionObj);
                                return false;
                            }

                            return true;
                        });
                    });

                    return ret;
                },
                doAction: function () {
                    var self = this,
                        whilstId = "SequenceTransitionAction.doAction." + self.widgetObj.id,
                        actionIndex = 0,
                        defer = $inject.$q.defer();

                    $inject.uiUtilService.whilst(function () {
                            return actionIndex < self.childActions.length;
                        }, function (callback) {
                            var actionObj = self.childActions[actionIndex++];

                            actionObj.doAction().then(function () {
                                callback();
                            });
                        }, function (err) {
                            if (!err) {
                                defer.resolve(self);
                            } else {
                                defer.reject();
                            }
                        },
                        $inject.angularConstants.checkInterval,
                        whilstId,
                        $inject.angularConstants.renderTimeout
                    );

                    $inject.$timeout(function () {
                        defer.resolve(self);
                    });

                    return defer.promise;
                },
                addAction: function (actionType) {
                    var action;

                    if (actionType === "Animation") {
                        action = new AnimationTransitionAction(this.widgetObj);
                    } else if (actionType === "State") {
                        action = new StateTransitionAction(this.widgetObj, this.widgetObj.initialStateOption.name);
                    } else if (actionType === "Configuration") {
                        action = new ConfigurationTransitionAction(this.widgetObj);
                    }

                    action && this.childActions.push(action);
                }
            }),
            AnimationTransitionAction = Class(BaseTransitionAction, {
                CLASS_NAME: "AnimationTransitionAction",
                MEMBERS: {
                    animation: {}
                },
                initialize: function (widgetObj, animation, id) {
                    this.initialize.prototype.__proto__.initialize.apply(this, [widgetObj, "Animation", id]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }
                    this.animation = animation || this.animation;
                },
                toJSON: function () {
                    var jsonObj = AnimationTransitionAction.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["animation", "CLASS_NAME"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    var ret = new AnimationTransitionAction(obj.widgetObj, obj.animation, obj.id);

                    AnimationTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj]);

                    return ret;
                },
                doAction: function () {
                    var self = this,
                        defer = $inject.$q.defer();

                    if (self.widgetObj.$element && self.widgetObj.$element.parent().length) {
                        self.cssAnimation = _.extend(
                            $inject.uiUtilService.prefixedStyle("animation", "{0} {1}s {2}", self.animation.name, self.animation.options.duration || 1, self.animation.options.timing || "")
                        );

                        self.widgetObj.$element.css(self.cssAnimation);

                        var animationName = self.widgetObj.$element.css("animation-name");
                        if (animationName && animationName !== "none") {
                            $inject.uiUtilService.onAnimationEnd(self.widgetObj.$element).then(function () {
                                self.restoreWidget();
                                defer.resolve(self);
                            });

                            return defer.promise;
                        }
                    }

                    $inject.$timeout(function () {
                        defer.resolve(self);
                    });

                    return defer.promise;
                },
                restoreWidget: function () {
                    var self = this;

                    if (self.widgetObj && self.cssAnimation) {
                        for (var key in self.cssAnimation) {
                            self.widgetObj.$element.css(key, "");
                        }
                    }
                }
            }),
            StateTransitionAction = Class(BaseTransitionAction, {
                CLASS_NAME: "StateTransitionAction",
                MEMBERS: {
                    newState: ""
                },
                initialize: function (widgetObj, newState, id) {
                    this.initialize.prototype.__proto__.initialize.apply(this, [widgetObj, "State", id]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }
                    this.newState = newState || this.newState;
                },
                toJSON: function () {
                    var jsonObj = StateTransitionAction.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["newState", "CLASS_NAME"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    var ret = new StateTransitionAction(obj.widgetObj, obj.newState, obj.id);

                    StateTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj]);

                    return ret;
                },
                doAction: function () {
                    var self = this,
                        defer = $inject.$q.defer();

                    $inject.$timeout(function () {
                        self.widgetObj.setState(self.newState);

                        if (self.widgetObj.$element && self.widgetObj.$element.parent().length) {
                            var animationName = self.widgetObj.$element.css("animation-name");
                            if (animationName && animationName !== "none") {
                                $inject.uiUtilService.onAnimationEnd(self.widgetObj.$element).then(function () {
                                    defer.resolve(self);
                                });
                            }
                        }
                        defer.resolve(self);
                    });

                    return defer.promise;
                }
            }),
            ConfigurationTransitionAction = Class(BaseTransitionAction, {
                CLASS_NAME: "ConfigurationTransitionAction",
                MEMBERS: {
                    configuration: {}
                },
                initialize: function (widgetObj, configuration, id) {
                    this.initialize.prototype.__proto__.initialize.apply(this, [widgetObj, "Configuration", id]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }
                    if (widgetObj) {
                        this.configuration = widgetObj.widgetSpec && widgetObj.widgetSpec.configuration || null;
                    }
                    this.configuration = this.configuration || configuration;
                    this.configuration = angular.copy(this.configuration);
                },
                toJSON: function () {
                    var jsonObj = ConfigurationTransitionAction.prototype.__proto__.toJSON.apply(this);

                    _.extend(jsonObj, _.pick(this, ["configuration", "CLASS_NAME"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    _.values(obj.configuration).forEach(function (value) {
                        value.options && value.options.forEach(function (option) {
                            delete option["$$hashKey"];
                        });
                    });

                    var ret = new ConfigurationTransitionAction(obj.widgetObj, obj.configuration, obj.id);

                    ConfigurationTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj]);

                    return ret;
                },
                doAction: function () {
                    var self = this,
                        defer = $inject.$q.defer();

                    $inject.$timeout(function () {
                        self.widgetObj.setConfiguration && self.widgetObj.setConfiguration(self.configuration);

                        if (self.widgetObj.$element && self.widgetObj.$element.parent().length) {
                            var animationName = self.widgetObj.$element.css("animation-name");
                            if (animationName && animationName !== "none") {
                                $inject.uiUtilService.onAnimationEnd(self.widgetObj.$element).then(function () {
                                    defer.resolve(self);
                                });
                            }
                        }
                        defer.resolve(self);
                    });

                    return defer.promise;
                }
            }),
            BaseTrigger = Class({
                CLASS_NAME: "BaseTrigger",
                MEMBERS: {
                    triggerType: "",
                    eventName: "",
                    options: null,
                    widgetObj: null,
                    callback: null
                },
                initialize: function (triggerType, eventName, options) {
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }

                    this.triggerType = triggerType;
                    this.eventName = eventName;
                    this.options = options;
                },
                toJSON: function () {
                    return _.pick(this, ["triggerType", "eventName", "options"], "CLASS_NAME");
                },
                fromObject: function (obj) {
                },
                on: function (widgetObj) {
                    this.widgetObj = widgetObj;
                },
                off: function () {
                }
            }),
            GestureTrigger = Class(BaseTrigger, {
                CLASS_NAME: "GestureTrigger",
                MEMBERS: {},
                initialize: function (eventName, options, callback) {
                    this.initialize.prototype.__proto__.initialize.apply(this, ["Gesture", eventName, _.clone(options)]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }

                    this.callback = callback;
                },
                toJSON: function () {
                    var jsonObj = GestureTrigger.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    var ret = new GestureTrigger(obj.eventName, obj.options);

                    GestureTrigger.prototype.__proto__.fromObject.apply(ret, [obj]);

                    return ret;
                },
                on: function (widgetObj) {
                    //FIXME For RepoSketchWidget, hammer should listen on child element of class widgetContainer
                    var self = this;

                    if (widgetObj && widgetObj.$element && widgetObj.$element.parent().length && self.eventName) {
                        self.initialize.prototype.__proto__.on.apply(self, [widgetObj]);

                        self.hammer = new Hammer(widgetObj.$element.get(0), _.clone(self.options));
                        self.hammer.on(self.eventName, function (event) {
                            self.callback && self.callback(event, widgetObj);
                            $inject.$timeout(function () {
                                self.off();
                            });
                        });
                    }
                },
                off: function () {
                    this.initialize.prototype.__proto__.off.apply(this, []);

                    if (this.hammer) {
                        this.hammer.off(this.eventName);
                        this.hammer = null;
                    }
                }
            }),
            StyleManager = Class({
                CLASS_NAME: "StyleManager",
                MEMBERS: {
                    widgetObj: null,
                    stateMaps: {},
                    omniClasses: [] //Classes irrelevant to widget state
                },
                initialize: function (widgetObj) {
                    //TODO How to group each element's style into a css class

                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }

                    this.widgetObj = widgetObj;
                },
                toJSON: function () {
                    return _.pick(this, ["stateMaps", "omniClasses"], "CLASS_NAME");
                },
                fromObject: function (obj) {
                    var ret = new StyleManager();
                    ret.stateMaps = obj.stateMaps;
                    ret.omniClasses = obj.omniClasses;

                    return ret;
                },
                addOmniClass: function (classes) {
                    var self = this;

                    if (classes) {
                        var newClassList = _.difference(_.uniq(classes.split(" ")), self.omniClasses);

                        if (newClassList.length) {
                            newClassList.forEach(function (c) {
                                self.omniClasses.splice(self.omniClasses.length, 0, c);
                            });

                            self.widgetObj.$element && self.widgetObj.$element.addClass(self.omniClasses.join(" "));
                        }
                    }

                    return self;
                },
                removeOmniClass: function (classes) {
                    var self = this;

                    if (classes) {
                        var removeClassList = _.uniq(classes.split(" "));

                        if (removeClassList.length) {
                            removeClassList.forEach(function (removeClazz) {
                                var index;
                                if (!self.omniClasses.every(function (c, i) {
                                        if (c == removeClazz) {
                                            index = i;
                                            return false;
                                        }
                                        return true;
                                    })) {
                                    self.omniClasses.splice(index, 1);
                                }
                            });

                            self.widgetObj.$element && self.widgetObj.$element.removeClass(removeClassList.join(" "));
                        }
                    }
                },
                addClass: function (classes, state, stateContext) {
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {
                                style: {},
                                beforeStyle: {},
                                afterStyle: {},
                                styleSource: [],
                                classList: []
                            },
                        classList = stateValue.classList;

                    if (stateMap !== self.stateMaps[stateContext]) self.stateMaps[stateContext] = stateMap;
                    if (stateValue !== stateMap[state.name]) stateMap[state.name] = stateValue;

                    if (classes) {
                        var newClassList = _.difference(_.uniq(classes.split(" ")), classList);

                        if (newClassList.length) {
                            newClassList.forEach(function (c) {
                                classList.splice(classList.length, 0, c);
                            });

                            if (state == self.widgetObj.state) {
                                self.widgetObj.$element && self.widgetObj.$element.addClass(classList.join(" "));
                            }
                        }
                    }

                    return self;
                },
                removeClass: function (classes, state, stateContext) {
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {
                                style: {},
                                beforeStyle: {},
                                afterStyle: {},
                                styleSource: [],
                                classList: []
                            };

                    if (stateMap === self.stateMaps[stateContext] && stateValue === stateMap[state.name]) {
                        var classList = stateValue.classList;

                        if (classes && classList.length) {
                            var removeClassList = _.uniq(classes.split(" "));

                            if (removeClassList.length) {
                                removeClassList.forEach(function (removeClazz) {
                                    var index;
                                    if (!classList.every(function (c, i) {
                                            if (c == removeClazz) {
                                                index = i;
                                                return false;
                                            }
                                            return true;
                                        })) {
                                        classList.splice(index, 1);
                                    }
                                });

                                if (state == self.widgetObj.state) {
                                    self.widgetObj.$element && self.widgetObj.$element.removeClass(removeClassList.join(" "));
                                }
                            }
                        }
                    }

                    return self;
                },
                hasClass: function (clazz, state, stateContext) {
                    var self = this,
                        classList = self.classList(state, stateContext);

                    return !classList.every(function (c) {
                        return c != clazz;
                    });
                },
                classList: function (state, stateContext) {
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {
                                style: {},
                                beforeStyle: {},
                                afterStyle: {},
                                styleSource: [],
                                classList: []
                            };

                    if (stateMap !== self.stateMaps[stateContext]) self.stateMaps[stateContext] = stateMap;
                    if (stateValue !== stateMap[state.name]) stateMap[state.name] = stateValue;

                    return _.union(stateValue.classList, self.omniClasses);
                },
                css: function (state, stateContext) {
                    var args = Array.prototype.slice.call(arguments);
                    args.splice(2, 0, "");
                    return this.pseudoCss.apply(this, args);
                },
                pseudoCss: function (state, stateContext, pseudo) {
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {
                                style: {},
                                beforeStyle: {},
                                afterStyle: {},
                                styleSource: [],
                                classList: []
                            },
                        args = Array.prototype.slice.call(arguments, 2),
                        ret = self,
                        stylePseudoPrefix = ((pseudo || "") + "Style").replace(/^:(.+)/, "$1");
                    stylePseudoPrefix = stylePseudoPrefix.charAt(0).toLowerCase() + stylePseudoPrefix.substr(1);

                    var style = stateValue[stylePseudoPrefix];

                    if (stateMap !== self.stateMaps[stateContext]) self.stateMaps[stateContext] = stateMap;
                    if (stateValue !== stateMap[state.name]) stateMap[state.name] = stateValue;

                    switch (args.length) {
                        case 0:
                            ret = _.pick(stateValue, ["style", "beforeStyle", "afterStyle"]);
                            break;
                        case 1:
                            ret = _.pick(stateValue, [stylePseudoPrefix]);
                            break;
                        case 2 :
                            if (typeof args[1] === "string")
                                ret = style[args[1]];
                            else if (typeof args[1] === "object") {
                                if (args[1]) {
                                    for (var key in args[1]) {
                                        self.pseudoCss(state, stateContext, pseudo, key, args[1][key]);
                                    }
                                } else {
                                    _.keys(style).forEach(function (key) {
                                        delete style[key];
                                    });
                                }
                            }
                            break;
                        case 3 :
                            if (typeof args[1] === "string") {
                                if (args[2] != null) {
                                    style[args[1]] = args[2];
                                } else {
                                    delete style[args[1]];
                                }
                                if (self.widgetObj.$element) {
                                    if (state == self.widgetObj.state) {
                                        if (stylePseudoPrefix === "style") {
                                            self.applyStyle(args[1], args[2]);
                                        } else {
                                            self.updatePseudoStyle(state, stateContext);
                                        }
                                    }
                                }
                            }
                            break;

                        default:
                            break;
                    }

                    return ret;
                },
                trackablePseudoCss: function (state, stateContext, source, pseudo) {
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {
                                style: {},
                                beforeStyle: {},
                                afterStyle: {},
                                styleSource: [],
                                classList: []
                            },
                        args = Array.prototype.slice.call(arguments, 3),
                        ret = self,
                        stylePseudoPrefix = ((pseudo || "") + "Style").replace(/^:(.+)/, "$1");
                    stylePseudoPrefix = stylePseudoPrefix.charAt(0).toLowerCase() + stylePseudoPrefix.substr(1);

                    var styleSourceArr = _.where(stateValue.styleSource, {source: source}),
                        styleSource;
                    if (styleSourceArr.length) {
                        styleSource = styleSourceArr[0];
                    } else {
                        styleSource = {
                            source: source,
                            style: {},
                            beforeStyle: {},
                            afterStyle: {}
                        };
                        stateValue.styleSource.push(styleSource);
                    }
                    var sourceStyle = styleSource[stylePseudoPrefix];

                    if (stateMap !== self.stateMaps[stateContext]) self.stateMaps[stateContext] = stateMap;
                    if (stateValue !== stateMap[state.name]) stateMap[state.name] = stateValue;

                    switch (args.length) {
                        case 0:
                            ret = styleSource;
                            break;
                        case 1:
                            ret = sourceStyle;
                            break;
                        case 2 :
                            if (typeof args[1] === "string") {
                                ret = sourceStyle[args[1]];
                            } else if (typeof args[1] === "object") {
                                if (args[1]) {
                                    for (var key in args[1]) {
                                        self.trackablePseudoCss(state, stateContext, source, pseudo, key, args[1][key]);
                                    }
                                } else {
                                    var keys = _.keys(sourceStyle);

                                    if (keys.length) {
                                        keys.forEach(function (key) {
                                            delete sourceStyle[key];
                                        });

                                        //FIXME Use latestOnce
                                        var styleProps = {};
                                        styleProps[stylePseudoPrefix] = keys;
                                        self.uniteSourceStyle(state, stateContext, styleProps);
                                    }
                                }
                            }
                            break;
                        case 3 :
                            if (typeof args[1] === "string") {
                                if (args[2] != null) {
                                    sourceStyle[args[1]] = args[2];
                                } else {
                                    delete sourceStyle[args[1]];
                                }
                                //FIXME Use latestOnce
                                var styleProps = {};
                                styleProps[stylePseudoPrefix] = [args[1]];
                                self.uniteSourceStyle(state, stateContext, styleProps);
                            }
                            break;

                        default:
                            break;
                    }

                    return ret;
                },
                uniteSourceStyle: function (state, stateContext, styleProps) {
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {
                                style: {},
                                beforeStyle: {},
                                afterStyle: {},
                                styleSource: [],
                                classList: []
                            };

                    if (stateMap !== self.stateMaps[stateContext]) self.stateMaps[stateContext] = stateMap;
                    if (stateValue !== stateMap[state.name]) stateMap[state.name] = stateValue;

                    _.each(styleProps, function (props, stylePseudoPrefix) {
                        var pseudoStyle = {},
                            pseudo = stylePseudoPrefix.replace(/style/i, "");
                        if (props && props.length) {
                            props.forEach(function (prop) {
                                var propValues = [];
                                _.pluck(stateValue.styleSource, stylePseudoPrefix).forEach(function (value) {
                                    if (value[prop] !== undefined) {
                                        propValues.push(value[prop]);
                                    }
                                });

                                pseudoStyle[prop] = propValues.length ? propValues[propValues.length - 1] : null;
                            });
                        } else {
                            _.pluck(stateValue.styleSource, stylePseudoPrefix).forEach(function (sourceStyle) {
                                _.extend(pseudoStyle, sourceStyle);
                            });
                        }
                        self.pseudoCss(state, stateContext, pseudo, pseudoStyle);
                    });
                },
                updatePseudoStyle: function (state, stateContext) {
                    var self = this;

                    function appendToPseudoEnabledWidgets() {
                        var defer = $inject.$q.defer();

                        var pseudoWidgets = _.clone($inject.$rootScope.visiblePseudoEnabledWidgets);
                        if ($inject.$rootScope.visiblePseudoEnabledWidgets.every(function (w) {
                                return w.id != self.widgetObj.id;
                            })) {
                            pseudoWidgets.push(self.widgetObj);
                        }

                        $inject.$timeout(function () {
                            $inject.$rootScope.visiblePseudoEnabledWidgets = pseudoWidgets;
                            defer.resolve();
                        });

                        return defer.promise;
                    }

                    appendToPseudoEnabledWidgets.onceId = "StyleManager.pseudoCss.appendToPseudoEnabledWidgets";

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {
                                style: {},
                                beforeStyle: {},
                                afterStyle: {},
                                styleSource: [],
                                classList: []
                            };

                    if (stateMap !== self.stateMaps[stateContext]) self.stateMaps[stateContext] = stateMap;
                    if (stateValue !== stateMap[state.name]) stateMap[state.name] = stateValue;

                    if (!_.isEmpty(stateValue.beforeStyle) || !_.isEmpty(stateValue.afterStyle)) {
                        $inject.uiUtilService.latestOnce(appendToPseudoEnabledWidgets, null, 100)();
                    }
                },
                removePseudoStyle: function () {
                    var index;
                    $inject.$rootScope.visiblePseudoEnabledWidgets.every(function (w, i) {
                        if (w.id === self.id) {
                            index = i;
                            return false;
                        }

                        return true;
                    });

                    index != null && $inject.$rootScope.visiblePseudoEnabledWidgets.splice(index, 1);
                },
                applyStyle: function (styleName, styleValue) {
                    var self = this;

                    if (self.widgetObj.$element) {
                        var styleObj = $inject.uiUtilService.composeCssStyle(styleName, styleValue);
                        styleObj && _.each(styleObj, function (value, key) {
                            if (toString.call(value) === '[object Array]') {
                                value.forEach(function (v) {
                                    self.widgetObj.$element.css(key, v);
                                });
                            } else {
                                self.widgetObj.$element.css(key, value);
                            }
                        })
                    }
                },
                draw: function (state, stateContext) {
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {
                                style: {},
                                beforeStyle: {},
                                afterStyle: {},
                                styleSource: [],
                                classList: []
                            },
                        style = stateValue.style,
                        classList = self.classList();

                    if (self.widgetObj.$element) {
                        self.widgetObj.$element.addClass(classList.join(" "));

                        if (state == self.widgetObj.state) {
                            for (var styleName in style) {
                                var styleValue = style[styleName];

                                if (toString.call(styleValue) === '[object Array]') {
                                    styleValue.forEach(function (value) {
                                        self.applyStyle(styleName, value);
                                    });
                                } else {
                                    self.applyStyle(styleName, styleValue);
                                }
                            }

                            self.updatePseudoStyle(state, stateContext);
                        }
                    }
                },
                clone: function () {
                    var self = this,
                        cloneObj = new self.initialize(),
                        cloneMembers = _.difference(_.keys(self.MEMBERS), ["widgetObj", "stateMaps"]);

                    cloneMembers.forEach(function (member) {
                        cloneObj[member] = angular.copy(self[member]);
                    });

                    //style may contains property with array value
                    for (var stateContext in self.stateMaps) {
                        var stateMap = self.stateMaps[stateContext];
                        cloneObj.stateMaps[stateContext] = {};
                        for (var stateName in stateMap) {
                            var stateValue = stateMap[stateName];
                            cloneObj.stateMaps[stateContext][stateName] = {
                                style: {},
                                beforeStyle: {},
                                afterStyle: {},
                                styleSource: [],
                                classList: _.clone(stateValue.classList)
                            };

                            var style = stateValue.style,
                                cloneStyle = cloneObj.stateMaps[stateContext][stateName].style;

                            for (var styleName in style) {
                                cloneStyle[styleName] = angular.copy(style[styleName]);
                            }

                            var beforeStyle = stateValue.beforeStyle,
                                cloneBeforeStyle = cloneObj.stateMaps[stateContext][stateName].beforeStyle;

                            for (var styleName in beforeStyle) {
                                cloneBeforeStyle[styleName] = angular.copy(beforeStyle[styleName]);
                            }

                            var afterStyle = stateValue.afterStyle,
                                cloneAfterStyle = cloneObj.stateMaps[stateContext][stateName].afterStyle;

                            for (var styleName in beforeStyle) {
                                cloneAfterStyle[styleName] = angular.copy(afterStyle[styleName]);
                            }
                        }
                    }

                    return cloneObj;
                },
                removeState: function (state, stateContext) {
                    if (state) {
                        var self = this,
                            stateName = typeof state === "string" && state || state.name;

                        if (stateName) {
                            if (stateContext) {
                                var stateMap = self.stateMaps[stateContext];

                                stateMap && delete stateMap[stateName];
                            } else {
                                for (var key in self.stateMaps) {
                                    delete  self.stateMaps[key][stateName];
                                }
                            }
                        }
                    }
                },
                removeStateContext: function (stateContext) {
                    var self = this,
                        stateMap = self.stateMaps[stateContext];

                    if (stateMap) {
                        delete self.stateMaps[stateContext];
                    }
                },
                changeStateContext: function (oldContext, newContext) {
                    var self = this,
                        oldContext = arguments[0],
                        newContext = arguments[1],
                        stateMap;

                    if (newContext) {
                        stateMap = self.stateMaps[oldContext];

                        if (stateMap) {
                            self.stateMaps[newContext] = stateMap;
                            delete self.stateMaps[oldContext];
                        }
                    } else {
                        newContext = arguments[0];
                        stateMap = {};
                        for (var key in self.stateMaps) {
                            _.extend(stateMap, self.stateMaps[key]);
                            delete self.stateMaps[key];
                        }
                        self.stateMaps[newContext] = stateMap;
                    }
                }
            }),
            BaseSketchWidgetClass = Class({
                    CLASS_NAME: "BaseSketchWidget",
                    STATE_CONTEXT: new State("?", "*"),
                    MEMBERS: {
                        id: "",
                        name: "NO NAME",
                        childWidgets: [],
                        anchor: "",
                        initialStateOption: {name: "*"},
                        attr: {},
                        styleManager: null,
                        state: null,
                        stateContext: null,
                        states: [],
                        stateOptions: [],
                        $element: null,
                        resizable: true
                    },
                    initialize: function (id) {
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                        this.id = id || ("Widget_" + new Date().getTime());
                        this.stateContext = this.STATE_CONTEXT;
                        this.state = new State(this, this.initialStateOption.name, this.STATE_CONTEXT);
                        this.states.push(this.state);
                        this.styleManager = new StyleManager(this);

                        var proto = BaseSketchWidgetClass.prototype;
                        if (proto.objectMap) {
                            var value = proto.objectMap[this.id] || {callbacks: []};
                            proto.objectMap[this.id] = value;
                            value.item = this;
                            value.callbacks.forEach(function (callback) {
                                callback.call(null, value);
                            });
                            value.callbacks.splice(0, value.callbacks.length);
                        }
                    },
                    dispose: function () {
                        var self = this;

                        self.remove();
                    },
                    startMatchReference: function () {
                        var proto = BaseSketchWidgetClass.prototype;
                        proto.objectMap = proto.objectMap || {};
                    },
                    matchReference: function (id, callback) {
                        var proto = BaseSketchWidgetClass.prototype;
                        if (proto.objectMap) {
                            var value = proto.objectMap[id] || {callbacks: []};
                            if (value.item) {
                                callback(value.item);
                            } else {
                                proto.objectMap[id] = value;
                                value.callbacks.push(callback);
                            }
                        }
                    },
                    endMatchReference: function () {
                        var proto = BaseSketchWidgetClass.prototype;
                        delete proto.objectMap;
                    },
                    toJSON: function () {
                        return _.extend(_.pick(this, ["id", "name", "childWidgets", "anchor", "attr", "styleManager", "states", "stateOptions"]), {
                            state: this.state.id,
                            stateContext: this.stateContext.node !== "?" && this.stateContext.id || ""
                        });
                    },
                    fromObject: function (obj) {
                        var self = this;

                        self.anchor = obj.anchor;
                        self.name = obj.name;
                        self.attr = _.omit(obj.attr, ["$$hashKey"]);
                        self.styleManager = StyleManager.prototype.fromObject(obj.styleManager);
                        self.styleManager.widgetObj = self;
                        obj.stateOptions.forEach(function (stateOption) {
                            self.stateOptions.push(_.omit(stateOption, ["$$hashKey"]));
                        });

                        self.states.splice(0, self.states.length);
                        var stateMap = {};
                        obj.states.forEach(function (s) {
                            var state = State.prototype.fromObject(s);
                            if (state) {
                                state.widgetObj = self;
                                self.states.push(state);
                                stateMap[state.id] = state;
                                if (!state.context) {
                                    state.context = self.STATE_CONTEXT;
                                }
                                if (state.id === obj.state) {
                                    self.state = state;
                                }
                            }
                        });

                        var childWidgets = [],
                            classes = ["ElementSketchWidgetClass", "RepoSketchWidgetClass"];
                        obj.childWidgets.forEach(function (c) {
                            var className = c.CLASS_NAME,
                                childWidget;

                            classes.every(function (clazz) {
                                if (eval("className === {0}.prototype.CLASS_NAME".format(clazz))) {
                                    childWidget = eval("{0}.prototype.fromObject(c)".format(clazz));
                                    return false;
                                }

                                return true;
                            });
                            if (childWidget) {
                                childWidget.states.forEach(function (s) {
                                    if (typeof s.context === "string")
                                        s.context = stateMap[s.context];
                                });
                                childWidgets.push(childWidget);
                            }
                        });

                        childWidgets.forEach(function (childWidget) {
                            childWidget.appendTo(self);
                        });
                    },
                    isKindOf: function (className) {
                        return BaseSketchWidgetClass.prototype.CLASS_NAME == className;
                    },
                    clone: function () {
                        var self = this,
                            cloneObj = new self.initialize(),
                            cloneMembers = _.difference(_.keys(self.MEMBERS), ["id", "childWidgets", "anchor", "styleManager", "states", "$element"]);

                        cloneMembers.forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        self.states.forEach(function (s) {
                            cloneObj.states.push(s.clone && s.clone() || angular.copy(s));
                        });
                        cloneObj.setState(self.state);

                        cloneObj.styleManager = self.styleManager.clone();
                        cloneObj.styleManager.widgetObj = cloneObj;

                        self.childWidgets.forEach(function (obj) {
                            cloneObj.childWidgets.push(obj.clone());
                        });

                        return cloneObj;
                    },
                    parent: function () {
                        var self = this,
                            $parent;

                        if (self.$element) {
                            if (self.anchor) {
                                var $anchor = self.$element.parent("[widget-anchor='" + self.anchor + "']");
                                if ($anchor.length) {
                                    $parent = $anchor.closest("[ui-sketch-widget]");
                                }
                            } else {
                                $parent = self.$element.parent();
                            }
                        }

                        return $parent && $parent.data("widgetObject") || null;
                    },
                    parentElement: function (parentWidgetElement) {
                        var self = this,
                            parentElement;

                        if (self.$element) {
                            if (self.anchor) {
                                parentElement =
                                    parentWidgetElement && parentWidgetElement.find("[widget-anchor='" + self.anchor + "']") || self.$element.parent("[widget-anchor='" + self.anchor + "']");
                            } else {
                                parentElement = parentWidgetElement || self.$element.parent("[ui-sketch-widget]");
                            }
                        }

                        return parentElement;
                    },
                    detach: function () {
                        var self = this;

                        if (self.$element) {
                            var parentWidgetObj = self.parent();

                            if (parentWidgetObj) {
                                var wIndex;
                                if (!parentWidgetObj.childWidgets.every(function (obj, index) {
                                        if (obj.id == self.id) {
                                            wIndex = index;
                                            return false;
                                        }

                                        return true;
                                    })) {
                                    parentWidgetObj.childWidgets.splice(wIndex, 1);
                                }
                            }

                            self.$element.detach();
                        }
                    },
                    removeChild: function (child) {
                        var self = this,
                            wIndex;

                        if (typeof child === "number")
                            wIndex = child;
                        else if (typeof child === "object") {
                            self.childWidgets.every(function (obj, index) {
                                if (obj.id == child.id) {
                                    wIndex = index;
                                    return false;
                                }

                                return true;
                            })
                        }

                        if (wIndex != null && wIndex < self.childWidgets.length) {
                            child = self.childWidgets[wIndex];
                            self.childWidgets.splice(wIndex, 1);
                            if (child.$element) {
                                child.$element.remove();
                                child.styleManager.removePseudoStyle();
                                child.$element = null;
                            }

                            return child;
                        }
                    },
                    remove: function () {
                        var self = this;

                        if (self.$element) {
                            var parentWidgetObj = self.parent();

                            if (parentWidgetObj) {
                                var wIndex;
                                if (!parentWidgetObj.childWidgets.every(function (obj, index) {
                                        if (obj.id == self.id) {
                                            wIndex = index;
                                            return false;
                                        }

                                        return true;
                                    })) {
                                    parentWidgetObj.childWidgets.splice(wIndex, 1);
                                }
                            }

                            self.$element.remove();
                            self.styleManager.removePseudoStyle();
                            self.$element = null;
                        }
                    },
                    attach: function (element) {
                        var self = this,
                            $element;

                        if (element.jquery) {
                            $element = element;
                        } else if (typeof element === "string" || angular.isElement(element)) {
                            $element = $(element);
                        }

                        if ($element && $element.length) {
                            var $container = $element.parent();

                            if ($container.length) {
                                var anchor = $container.attr("widget-anchor");

                                if (anchor) {
                                    $container = $container.closest("[ui-sketch-widget]");
                                }

                                var widgetObj = $container.data("widgetObject");

                                if (widgetObj) {
                                    self.remove();

                                    self.anchor = anchor;
                                    self.$element = $element;
                                    $element.attr("id", self.id);
                                }
                            }
                        }
                    },
                    appendTo: function (container) {
                        if (container) {
                            var self = this,
                                widgetObj;

                            if (!self.$element) {
                                //FIXME "Phantom Element". Due to Angular rendering, there are two possible cases of such kind of element:
                                //first, the element may be removed from document, but the widget object still holds reference to the orphanage element;
                                //second, the widget object holds reference to the orphanage element, while an element appears in document which needs to
                                //be attached to by the widget object.

                                self.$element = $("<div />").data("widgetObject", self).attr("id", self.id);
                                self.childWidgets.forEach(function (child) {
                                    if (child.$element) {
                                        child.$element.detach();
                                    } else {
                                        child.$element = $("<div />").data("widgetObject", child).attr("id", child.id);
                                    }
                                    child.$element.attr(child.attr);
                                    self.$element.append(child.$element);
                                })
                            }
                            self.$element.attr(self.attr);

                            var $container;
                            if (container.isKindOf && container.isKindOf("BaseSketchWidget")) {
                                $container = (container.$element = container.$element || $("<div />").data("widgetObject", container).attr("id", container.id));
                                widgetObj = container;
                            } else if (container.jquery) {
                                $container = container;
                                widgetObj = $container.data("widgetObject");
                            } else if (typeof container === "string" || angular.isElement(container)) {
                                $container = $(container);
                                widgetObj = $container.data("widgetObject");
                            }

                            if (widgetObj && widgetObj.isKindOf && widgetObj.isKindOf("BaseSketchWidget")) {
                                var childLeft, childTop, childWidth, childHeight;

                                //Keep offset and size or else they may be lost when the widget is detached later.
                                if (self.$element && self.$element.parent().length) {
                                    childLeft = self.$element.offset().left,
                                        childTop = self.$element.offset().top,
                                        childWidth = self.$element.width(),
                                        childHeight = self.$element.height();

                                    childLeft = Math.floor(childLeft * $inject.angularConstants.precision) / $inject.angularConstants.precision,
                                        childTop = Math.floor(childTop * $inject.angularConstants.precision) / $inject.angularConstants.precision,
                                        childWidth = Math.floor(childWidth * $inject.angularConstants.precision) / $inject.angularConstants.precision,
                                        childHeight = Math.floor(childHeight * $inject.angularConstants.precision) / $inject.angularConstants.precision;
                                }

                                if ((self.parent() || {}).id !== widgetObj.id) {
                                    self.detach();
                                }

                                if (widgetObj.childWidgets.every(function (obj) {
                                        return obj.id != self.id;
                                    })) {
                                    widgetObj.childWidgets.push(self);
                                }

                                self.setStateContext(widgetObj.state);

                                var parentElement = self.parentElement(widgetObj.$element);
                                parentElement && !parentElement.find("#" + self.id).length && parentElement.append(self.$element);

                                if (widgetObj.isTemporary) {
                                    //Only widget whose element has already existed in html can be appended to temporary widget
                                    if (self.$element && self.$element.parent().length) {
                                        var left,
                                            top,
                                            offsetLeft,
                                            offsetTop,
                                            width,
                                            height;

                                        if ($container && $container.parent().length) {
                                            left = offsetLeft = $container.offset().left, top = offsetTop = $container.offset().top, width = $container.width(), height = $container.height();
                                        } else {
                                            left = widgetObj.offsetLeft, top = widgetObj.offsetTop;

                                            var m = (widgetObj.css("width") || "").match(/([-\d\.]+)px$/);
                                            if (m && m.length == 2) width = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;
                                            m = (widgetObj.css("height") || "").match(/([-\d\.]+)px$/);
                                            if (m && m.length == 2) height = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                                            if (left == undefined || top == undefined || width == undefined || height == undefined) {
                                                left = childLeft, top = childTop, width = childWidth, height = childHeight;
                                            }
                                        }

                                        if (childLeft < left) {
                                            width += (left - childLeft);
                                            left = childLeft;
                                        }
                                        if (childTop < top) {
                                            height += (top - childTop);
                                            top = childTop;
                                        }
                                        if (childLeft + childWidth > left + width) {
                                            width = childLeft + childWidth - left;
                                        }
                                        if (childTop + childHeight > top + height) {
                                            height = childTop + childHeight - top;
                                        }

                                        if ((widgetObj.offsetLeft != undefined && widgetObj.offsetLeft != left) || (offsetLeft != undefined && offsetLeft != left)) {
                                            if (offsetLeft == undefined) {
                                                offsetLeft = widgetObj.offsetLeft;
                                            } else {
                                                m = (widgetObj.css("left") || "").match(/([-\d\.]+)px$/);
                                                if (m && m.length == 2) {
                                                    widgetObj.css("left", (Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision + left - offsetLeft) + "px");
                                                }
                                            }
                                            widgetObj.childWidgets.forEach(function (w) {
                                                var cm = (w.css("left") || "").match(/([-\d\.]+)px$/),
                                                    cLeft = parseFloat(cm[1]);
                                                w.css("left", (cLeft - (left - offsetLeft) + "px"));
                                            });
                                        }
                                        if ((widgetObj.offsetTop != undefined && widgetObj.offsetTop != top) || (offsetTop != undefined && offsetTop != top)) {
                                            if (offsetTop == undefined) {
                                                offsetTop = widgetObj.offsetTop;
                                            } else {
                                                m = (widgetObj.css("top") || "").match(/([-\d\.]+)px$/);
                                                if (m && m.length == 2) {
                                                    widgetObj.css("top", (Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision + top - offsetTop) + "px");
                                                }
                                            }
                                            widgetObj.childWidgets.forEach(function (w) {
                                                var cm = (w.css("top") || "").match(/([-\d\.]+)px$/),
                                                    cTop = parseFloat(cm[1]);
                                                w.css("top", (cTop - (top - offsetTop) + "px"));
                                            });
                                        }

                                        if (!$container || !$container.parent().length) {
                                            widgetObj.offsetLeft = left;
                                            widgetObj.offsetTop = top;
                                        }

                                        widgetObj.css("width", width + "px");
                                        widgetObj.css("height", height + "px");

                                        childLeft -= left;
                                        childTop -= top;
                                        self.css("left", childLeft + "px");
                                        self.css("top", childTop + "px");
                                    }
                                }
                            } else {
                                if (!self.anchor && $container) {
                                    //Sketch widget can be appended to a jquery element.
                                    if (!$container.find("#" + self.id).length) {
                                        self.$element.detach();
                                        $container.append(self.$element);
                                        self.setStateContext(self.STATE_CONTEXT);
                                    }
                                }
                            }

                            $container = self.$element.parent();
                            if (self.offsetLeft != undefined) {
                                if ($container.length) {
                                    var containerLeft = $container.offset().left,
                                        containerTop = $container.offset().top;

                                    containerLeft = Math.floor(containerLeft * $inject.angularConstants.precision) / $inject.angularConstants.precision, containerTop = Math.floor(containerTop * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                                    self.css("left", (self.offsetLeft - containerLeft) + "px");
                                    self.css("top", (self.offsetTop - containerTop) + "px");

                                    delete self.offsetLeft, delete self.offsetTop;
                                }
                            }

                            if ($container.length) {
                                self.childWidgets.forEach(function (child) {
                                    child.styleManager.draw();
                                });
                                self.styleManager.draw();

                                if (self.isTemporary) {
                                    self.$element.addClass("tempElement");
                                } else {
                                    self.$element.removeClass("tempElement");
                                }
                            }
                        }

                        return self;
                    },
                    addClass: function (classes) {
                        this.styleManager.addClass.apply(this.styleManager, [classes, this.state, this.stateContext]);

                        return this;
                    },
                    removeClass: function (classes) {
                        this.styleManager.removeClass.apply(this.styleManager, [classes, this.state, this.stateContext]);

                        return this;
                    },
                    addOmniClass: function (classes) {
                        this.styleManager.addOmniClass.apply(this.styleManager, [classes]);

                        return this;
                    },
                    removeOmniClass: function (classes) {
                        this.styleManager.removeOmniClass.apply(this.styleManager, [classes]);

                        return this;
                    },
                    hasClass: function (clazz) {
                        return this.styleManager.hasClass.apply(this.styleManager, [clazz, this.state, this.stateContext]);
                    },
                    css: function () {
                        var args = Array.prototype.slice.call(arguments);
                        args.splice(0, 0, this.state, this.stateContext);

                        return this.styleManager.css.apply(this.styleManager, args);
                    },
                    pseudoCss: function () {
                        var args = Array.prototype.slice.call(arguments);
                        args.splice(0, 0, this.state, this.stateContext);

                        return this.styleManager.pseudoCss.apply(this.styleManager, args);
                    },
                    trackablePseudoCss: function () {
                        var args = Array.prototype.slice.call(arguments);
                        args.splice(0, 0, this.state, this.stateContext);

                        return this.styleManager.trackablePseudoCss.apply(this.styleManager, args);
                    },
                    showHide: function (showState) {
                        if (this.$element) {
                            this.$element.toggle(showState);

                            var isHidden = this.$element.css("display") === "none";
                            showState && isHidden && this.styleManager.updatePseudoStyle();
                            !showState && !isHidden && this.styleManager.removePseudoStyle();
                        }

                        return showState;
                    },
                    setState: function (value) {
                        if (value) {
                            var self = this,
                                stateName = typeof value === "string" && value || value.name,
                                stateFound = false;

                            if (stateName) {
                                if (self.states.every(function (s) {
                                        if (s.context.id == self.stateContext.id && s.name == stateName) {
                                            value = s;
                                            stateFound = true;
                                            return false;
                                        }

                                        return true;
                                    })) {
                                    if (self.stateOptions.every(function (stateOption) {
                                            if (stateOption.name == stateName) {
                                                value = new State(self, stateName, self.stateContext);
                                                return false;
                                            }

                                            return true;
                                        })) {
                                        if (self.initialStateOption.name == stateName)
                                            value = new State(self, self.initialStateOption.name, self.stateContext);
                                        else
                                            value = null;
                                    }
                                }

                                if (value && self.state != value) {
                                    !stateFound && self.states.push(value);
                                    self.unregisterTrigger();

                                    self.state = value;
                                    self.childWidgets.forEach(function (child) {
                                        child.setStateContext(self.state);
                                    });
                                    self.styleManager.draw();

                                    self.isPlaying && self.registerTrigger();
                                }
                            }
                        }
                    },
                    getState: function (stateName) {
                        var self = this,
                            state;

                        if (stateName) {
                            self.states.every(function (s) {
                                if (s.context.id = self.stateContext.id && s.name == stateName) {
                                    state = s;
                                    return false;
                                }

                                return true;
                            });
                        } else {
                            state = self.state;
                        }

                        return state;
                    },
                    addState: function (stateName) {
                        if (stateName) {
                            var self = this,
                                newState;

                            self.states.every(function (s) {
                                return s.context.id != self.stateContext.id || s.name != stateName;
                            }) && self.stateOptions.every(function (stateOption) {
                                if (stateOption.name == stateName) {
                                    newState = new State(self, stateName, self.stateContext);
                                    self.states.push(newState);
                                    return false;
                                }

                                return true;
                            });

                            return newState;
                        }
                    },
                    removeState: function (value) {
                        if (value) {
                            var self = this,
                                stateName = typeof value === "string" && value || value.name;

                            if (stateName && stateName !== self.initialStateOption.name) {
                                if (!self.stateOptions.every(function (s, i) {
                                        if (s.name == stateName) {
                                            return false;
                                        }
                                        return true;
                                    })) {
                                    self.styleManager.removeState(stateName);

                                    var index;
                                    if (!self.states.every(function (state, i) {
                                            if (state.context.id = self.stateContext.id && state.name === stateName) {
                                                index = i;
                                                self.childWidgets.forEach(function (child) {
                                                    child.removeStateContext(state);
                                                });

                                                return false;
                                            }

                                            return true;
                                        })) {
                                        self.states.splice(index, 1);
                                    }

                                    if (self.state.name == stateName) {
                                        self.setState(self.initialStateOption);
                                    } else {
                                        //Trigger state update on child widgets
                                        self.setState(self.state);
                                    }
                                }
                            }
                        }
                    },
                    addStateOption: function (value) {
                        var self = this;

                        if (value && value.name && value.name !== self.initialStateOption.name) {
                            if (self.stateOptions.every(function (s) {
                                    return s.name != value.name;
                                })) {
                                self.stateOptions.push(value);
                            }
                        }
                    },
                    removeStateOption: function (value) {
                        if (value) {
                            var self = this,
                                stateName = typeof value === "string" && value || value.name;

                            if (stateName && stateName !== self.initialStateOption.name) {
                                var index;
                                if (!self.stateOptions.every(function (s, i) {
                                        if (s.name == stateName) {
                                            index = i;
                                            return false;
                                        }
                                        return true;
                                    })) {
                                    self.styleManager.removeState(stateName);
                                    self.stateOptions.splice(index, 1);

                                    var arr = [];
                                    self.states.forEach(function (state, i) {
                                        if (state.name === stateName) {
                                            arr.push(i);
                                            self.childWidgets.forEach(function (child) {
                                                child.removeStateContext(state);
                                            });
                                        }
                                    });
                                    arr.length && arr.reverse() && arr.forEach(function (index) {
                                        self.states.splice(index, 1);
                                    });
                                    if (self.state.name == stateName) {
                                        self.setState(self.initialStateOption);
                                    } else {
                                        //Trigger state update on child widgets
                                        self.setState(self.state);
                                    }
                                }
                            }
                        }
                    },
                    getStates: function (context) {
                        var self = this,
                            states = _.clone(self.states),
                            context = context || self.stateContext;

                        return _.filter(states, function (state) {
                            return state.context && state.context.id == context.id;
                        });
                    },
                    setStateContext: function (value) {
                        var self = this;

                        if (value) {
                            if (self.states.every(function (state) {
                                    if (state.context === value && state.name == self.initialStateOption.name) {
                                        if (self.state !== state) {
                                            self.stateContext = value;
                                            self.setState(state);
                                        }
                                        return false;
                                    }

                                    return true;
                                })) {
                                if (self.state.context.node !== value.node) {
                                    var states = {};
                                    self.states.forEach(function (state) {
                                        if (state.context.name === value.name && !states[state.name]) {
                                            state.setContext(value);
                                            states[state.name] = state;
                                        } else {
                                            self.styleManager.removeState(state, state.context);
                                            self.childWidgets.forEach(function (child) {
                                                child.removeStateContext(state);
                                            });
                                        }
                                    });
                                    self.states = _.values(states);
                                    self.styleManager.changeStateContext(value);
                                }

                                self.stateContext = value;
                                self.setState(self.initialStateOption);
                            }
                        }
                    },
                    getStateContext: function () {
                        return this.stateContext;
                    },
                    removeStateContext: function (stateContext) {
                        var self = this,
                            arr = [];

                        self.states.forEach(function (state, i) {
                            if (state.context === stateContext) {
                                arr.push(i);
                                self.styleManager.removeStateContext(stateContext);
                                self.childWidgets.forEach(function (child) {
                                    child.removeStateContext(state);
                                });
                            }
                        });
                        arr.length && arr.reverse() && arr.forEach(function (index) {
                            self.states.splice(index, 1);
                        });

                        if (self.stateContext === stateContext) {
                            self.stateContext = null;
                        }
                    },
                    registerTrigger: function () {
                        var self = this;

                        self.state.transitions.forEach(function (transition) {
                            transition.registerTrigger(self);
                        });

                        return self;
                    },
                    unregisterTrigger: function (restoreWidget) {
                        var self = this;

                        //TODO Need function to undo modification on widget element
                        self.state.transitions.forEach(function (transition) {
                            transition.unregisterTrigger(restoreWidget);
                        });

                        return self;
                    },
                    playAnimation: function (animation) {
                        var self = this,
                            defer = $inject.$q.defer();

                        self.css(animation);
                        self.$element && self.$element.parent().length && $inject.uiUtilService.onAnimationEnd(self.$element).then(function () {
                            defer.resolve();
                        }) || $inject.$timeout(function () {
                            defer.resolve();
                        });

                        return defer.promise;
                    },
                    setBorderColor: function (value) {
                        value && this.css("border-color", value) || this.css("border-color", "");
                    },
                    getBorderColor: function () {
                        return this.css("border-color");
                    },
                    setBorderWidth: function (value) {
                        value && this.css("border-width", $inject.uiUtilService.formalizePixelLength(value)) || this.css("border-width", "");
                    },
                    getBorderWidth: function () {
                        return this.css("border-width");
                    },
                    setBorderStyle: function (value) {
                        value && this.css("border-style", value) || this.css("border-style", "");
                    },
                    getBorderStyle: function () {
                        return this.css("border-style");
                    },
                    setBorderRadius: function (value) {
                        value && this.css("border-radius", $inject.uiUtilService.formalizePixelLength(value)) || this.css("border-radius", "");
                    },
                    getBorderRadius: function () {
                        return this.css("border-radius");
                    },
                    setColor: function (value) {
                        value && this.css("color", value) || this.css("color", "");
                    },
                    getColor: function () {
                        return this.css("color");
                    },
                    setTextShadow: function (value) {
                        value && this.css("text-shadow", value) || this.css("text-shadow", "");
                    },
                    getTextShadow: function () {
                        return this.css("text-shadow");
                    },
                    setBoxShadow: function (value) {
                        value && this.css("box-shadow", value) || this.css("box-shadow", "");
                    },
                    getBoxShadow: function () {
                        return this.css("box-shadow");
                    },
                    getTrackablePseudoStyle: function () {
                        var args = Array.prototype.slice.call(arguments);
                        return this.trackablePseudoCss.apply(this, args);
                    },
                    setTrackablePseudoStyle: function (source) {
                        var self = this,
                            args = Array.prototype.slice.call(arguments);

                        if (args.length > 1 && args[1]) {
                            if (typeof args[1] === "string") {
                                if (args.length > 2) {
                                    self.trackablePseudoCss.apply(self, args);
                                }
                            } else if (typeof args[1] === "object") {
                                var styleSource = self.getTrackablePseudoStyle(source);
                                if (args[1] != styleSource) {
                                    ["style", "beforeStyle", "afterStyle"].forEach(function (pseudoStylePrefix) {
                                        var value = args[1][pseudoStylePrefix],
                                            pseudo = pseudoStylePrefix.replace(/style/i, "");

                                        self.trackablePseudoCss(source, pseudo, null);
                                        value && self.trackablePseudoCss(source, pseudo, value);
                                    });
                                }
                            }
                        }
                    },
                    setLinearGradientColor: function (value) {
                        var self = this;

                        if (value && value.colorStopList) {
                            if (value.colorStopList.length > 1) {
                                var x1, y1, x2, y2;
                                if (value.angle == 90) {
                                    x1 = 50;
                                    y1 = 100;
                                    x2 = 50;
                                    y2 = 0;
                                } else if (value.angle == 270) {
                                    x1 = 50;
                                    y1 = 0;
                                    x2 = 50;
                                    y2 = 100;
                                } else {
                                    var tan = Math.tan(value.angle);
                                    if (value.angle <= 45) {
                                        x1 = 0;
                                        y1 = 50 * ( 1 + tan);
                                        x2 = 100;
                                        y2 = 50 * (1 - tan);
                                    } else if (value.angle <= 135) {
                                        y1 = 100;
                                        x1 = 50 * (1 - 1 / tan);
                                        y2 = 0;
                                        x2 = 50 * (1 + 1 / tan);
                                    } else if (value.angle <= 225) {
                                        x1 = 100;
                                        y1 = 50 * (1 - tan);
                                        x2 = 0;
                                        y1 = 50 * (1 + tan);
                                    } else if (value.angle <= 315) {
                                        y1 = 0;
                                        x1 = 50 * (1 + 1 / tan);
                                        y2 = 100;
                                        x2 = 50 * (1 - 1 / tan);
                                    } else {
                                        x1 = 0;
                                        y1 = 50 + 50 * tan;
                                        x2 = 100;
                                        y2 = 50 - 50 * tan;
                                    }
                                    x1 = Math.ceil(x1);
                                    y1 = Math.ceil(y1);
                                    x2 = Math.ceil(x2);
                                    y2 = Math.ceil(y2);
                                }

                                var webkitStops = [], stops = [];
                                value.colorStopList.forEach(function (colorStop) {
                                    webkitStops.push("color-stop({1}%, {0})".format(colorStop.color, colorStop.percent));
                                    stops.push("{0} {1}%".format(colorStop.color, colorStop.percent));
                                });

                                var styles = [];
                                styles.push("-webkit-gradient(linear, {0}% {1}%, {2}% {3}%, {4})".format(x1, y1, x2, y2, webkitStops.join(",")));
                                $inject.uiUtilService.prefixedStyleValue("{0}linear-gradient({1}deg, {2})", value.angle, stops.join(",")).forEach(
                                    function (gradientStyleValue) {
                                        styles.push(gradientStyleValue);
                                    }
                                );
                                self.css("background", styles);
                            } else if (value.colorStopList.length == 1) {
                                var color = value.colorStopList[0].color;
                                color && self.css("background", color);
                            }
                        } else {
                            self.css("background", "");
                        }
                    },
                    getLinearGradientColor: function () {
                        var self = this,
                            value = self.css("background"),
                            colorObj = null;

                        if (toString.call(value) === '[object Array]') {
                            value.every(function (styleValue) {
                                var m = styleValue.match(/linear-gradient\((.+)\)/);
                                if (m && m.length == 2) {
                                    var n = m[1].match(/(\d)deg,(.+)$/);
                                    if (n && n.length == 3) {
                                        var angle = parseInt(n[1]),
                                            stops = n[2].split(","),
                                            colorStopList = [];

                                        stops.forEach(function (stopValue) {
                                            var s = stopValue.match(/(#\w+) (\d+)%/);
                                            if (s && s.length == 3) {
                                                var color = s[1];
                                                colorStopList.push({
                                                    percent: parseInt(s[2]),
                                                    color: color,
                                                    backgroundColor: $inject.uiUtilService.contrastColor(color) === "#ffffff" ? $inject.uiUtilService.lighterColor(color, 0.5) : $inject.uiUtilService.lighterColor(color, -0.5)
                                                });
                                            }
                                        });

                                        if (colorStopList.length) {
                                            for (var i = 1; i < colorStopList.length - 1; i++) {
                                                colorStopList[i].minPercent = colorStopList[i - 1].percent + 1;
                                                colorStopList[i].maxPercent = colorStopList[i + 1].percent - 1;
                                            }
                                            colorStopList[0].minPercent = 0;
                                            colorStopList[colorStopList.length - 1].maxPercent = 100;
                                            if (colorStopList.length > 1) {
                                                colorStopList[0].maxPercent = colorStopList[1].percent - 1;
                                                colorStopList[colorStopList.length - 1].minPercent = colorStopList[colorStopList.length - 2].percent + 1;
                                            }

                                            colorObj = {angle: angle, colorStopList: colorStopList};
                                        }
                                    }
                                }

                                return !colorObj;
                            });
                        } else if (typeof value === "string") {
                            colorObj = {
                                angle: 0,
                                colorStopList: [
                                    {
                                        percent: 0,
                                        color: value,
                                        minPercent: 0,
                                        maxPercent: 100,
                                        backgroundColor: $inject.uiUtilService.contrastColor(value) === "#ffffff" ? $inject.uiUtilService.lighterColor(value, 0.5) : $inject.uiUtilService.lighterColor(value, -0.5)
                                    }
                                ]
                            };
                        }

                        return colorObj;
                    },
                    setIsPlaying: function (value) {
                        if (!!this.isPlaying != !!value) {
                            this.unregisterTrigger(true);
                            this.isPlaying = value;
                            this.isPlaying && this.registerTrigger();
                        }
                    }
                }
            ),
            ElementSketchWidgetClass = Class(BaseSketchWidgetClass, {
                CLASS_NAME: "ElementSketchWidget",
                MEMBERS: {},
                initialize: function (id, widgetsArr, isTemporary) {
                    this.initialize.prototype.__proto__.initialize.apply(this, [id]);
                    var self = this,
                        MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }

                    this.isElement = true;
                    this.isTemporary = false;

                    if (isTemporary != null) {
                        this.isTemporary = isTemporary;
                    }

                    if (widgetsArr && toString.apply(widgetsArr) == "[object Array]") {
                        widgetsArr.forEach(function (childWidget) {
                            childWidget.appendTo(self);
                        });
                    }
                },
                toJSON: function () {
                    var jsonObj = ElementSketchWidgetClass.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["CLASS_NAME", "html"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    var ret = new ElementSketchWidgetClass(obj.id);

                    ElementSketchWidgetClass.prototype.__proto__.fromObject.apply(ret, [obj]);
                    ret.html = obj.html;

                    return ret;
                },
                isKindOf: function (className) {
                    var self = this;

                    return ElementSketchWidgetClass.prototype.CLASS_NAME == className || ElementSketchWidgetClass.prototype.__proto__.isKindOf.apply(self, [className]);
                },
                levelUp: function (widgetObj, doCompile, waiveDisassemble) {
                    var self = this;

                    if (self.$element && self.$element.parent().length) {
                        var $parent = self.$element.parent(),
                            left = self.$element.offset().left,
                            top = self.$element.offset().top,
                            width = self.$element.width(),
                            height = self.$element.height(),
                            parentLeft = $parent.offset().left,
                            parentTop = $parent.offset().top,
                            wChildLeft = 0,
                            wChildTop = 0,
                            minChildLeft = 0,
                            minChildTop = 0,
                            maxChildRight = 0,
                            maxChildBottom = 0,
                            wIndex;

                        left = Math.floor(left * $inject.angularConstants.precision) / $inject.angularConstants.precision, top = Math.floor(top * $inject.angularConstants.precision) / $inject.angularConstants.precision, parentLeft = Math.floor(parentLeft * $inject.angularConstants.precision) / $inject.angularConstants.precision, parentTop = Math.floor(parentTop * $inject.angularConstants.precision) / $inject.angularConstants.precision, width = Math.floor(width * $inject.angularConstants.precision) / $inject.angularConstants.precision, height = Math.floor(height * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        self.childWidgets.forEach(function (childWidget, index) {
                            var childLeft = 0, childTop = 0, childWidth = 0, childHeight = 0;

                            var m = (childWidget.css("left") || "").match(/([-\d\.]+)px$/);
                            if (m && m.length == 2) childLeft = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;
                            m = (childWidget.css("top") || "").match(/([-\d\.]+)px$/);
                            if (m && m.length == 2) childTop = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;
                            m = (childWidget.css("width") || "").match(/([-\d\.]+)px$/);
                            if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;
                            m = (childWidget.css("height") || "").match(/([-\d\.]+)px$/);
                            if (m && m.length == 2) childHeight = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                            if (childWidget.id == widgetObj.id) {
                                wChildLeft = (left - parentLeft) + childLeft;
                                wChildTop = (top - parentTop) + childTop;
                                wIndex = index;
                            } else {
                                if (childLeft < minChildLeft) minChildLeft = childLeft;
                                if (childTop < minChildTop) minChildTop = childTop;
                                if (childLeft + childWidth > maxChildRight) maxChildRight = childLeft + childWidth;
                                if (childTop + childHeight > maxChildBottom) maxChildBottom = childTop + childHeight;
                            }
                        });

                        if (wIndex != undefined) {
                            widgetObj = self.removeChild(wIndex);

                            widgetObj.css("left", wChildLeft + "px");
                            widgetObj.css("top", wChildTop + "px");
                            widgetObj.appendTo(self.$element.parent());

                            if (doCompile) {
                                var scope = angular.element(self.$element.parent()).scope();
                                $inject.$compile(self.$element.parent())(scope);
                            }

                            if (self.childWidgets.length == 1) {
                                !waiveDisassemble && self.disassemble();
                            } else {
                                left += minChildLeft, top += minChildTop, width = (maxChildRight - minChildLeft), height = (maxChildBottom - minChildTop);

                                self.css("left", (left - parentLeft) + "px");
                                self.css("top", (top - parentTop) + "px");
                                self.css("width", width + "px");
                                self.css("height", height + "px");
                            }
                        }
                    }
                },
                disassemble: function () {
                    var self = this;

                    if (self.$element && self.$element.parent().length && self.childWidgets.length) {
                        for (; self.childWidgets.length;) {
                            var childWidget = self.childWidgets[0];
                            self.levelUp(childWidget, false, true);
                        }

                        var $parent = self.$element.parent();

                        self.remove();

                        var scope = angular.element($parent).scope();
                        $inject.$compile($parent)(scope);
                    }
                },
                directContains: function (widgetObj) {
                    return !this.childWidgets.every(function (w) {
                        return w.id != widgetObj.id;
                    });
                },
                alignLeft: function () {
                    var self = this;

                    if (self.$element && self.$element.parent().length) {
                        var maxChildWidth = 0,
                            m = (self.css("left") || "").match(/([-\d\.]+)px$/),
                            firstChildLeft,
                            left;
                        if (m && m.length == 2) left = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        m = (self.childWidgets[0].css("left") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) firstChildLeft = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        if (firstChildLeft != undefined) {
                            self.childWidgets.forEach(function (w) {
                                var childWidth,
                                    m = (w.css("width") || "").match(/([-\d\.]+)px$/);
                                if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;
                                if (childWidth > maxChildWidth) maxChildWidth = childWidth;

                                w.css("left", "0px");
                            });

                            if (maxChildWidth) {
                                self.css("left", (left + firstChildLeft) + "px");
                                self.css("width", maxChildWidth + "px");
                            }
                        }
                    }
                },
                alignCenter: function () {
                    var self = this;

                    if (self.$element && self.$element.parent().length) {
                        var width,
                            maxChildWidth = 0,
                            m = (self.css("left") || "").match(/([-\d\.]+)px$/),
                            firstChildLeft,
                            firstChildWidth,
                            left;
                        if (m && m.length == 2) left = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        m = (self.css("width") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) width = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        m = (self.childWidgets[0].css("left") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) firstChildLeft = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        m = (self.childWidgets[0].css("width") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) firstChildWidth = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        if (firstChildLeft != undefined && firstChildWidth) {
                            self.childWidgets.forEach(function (w) {
                                var childWidth,
                                    m = (w.css("width") || "").match(/([-\d\.]+)px$/);
                                if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;
                                if (childWidth > maxChildWidth) maxChildWidth = childWidth;
                            });

                            if (maxChildWidth) {
                                self.css("left", (left + firstChildLeft) + "px");
                                self.css("width", maxChildWidth + "px");

                                self.childWidgets.forEach(function (w) {
                                    var childWidth,
                                        m = (w.css("width") || "").match(/([-\d\.]+)px$/);
                                    if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                                    if (childWidth) {
                                        w.css("left", ((maxChildWidth - childWidth) / 2) + "px");
                                    }
                                });
                            }
                        }
                    }
                },
                alignRight: function () {
                    var self = this;

                    if (self.$element && self.$element.parent().length) {
                        var width,
                            maxChildWidth = 0,
                            m = (self.css("left") || "").match(/([-\d\.]+)px$/),
                            firstChildLeft,
                            firstChildWidth,
                            left;
                        if (m && m.length == 2) left = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        m = (self.css("width") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) width = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        m = (self.childWidgets[0].css("left") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) firstChildLeft = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        m = (self.childWidgets[0].css("width") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) firstChildWidth = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        if (firstChildLeft != undefined && firstChildWidth) {
                            self.childWidgets.forEach(function (w) {
                                var childWidth,
                                    m = (w.css("width") || "").match(/([-\d\.]+)px$/);
                                if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;
                                if (childWidth > maxChildWidth) maxChildWidth = childWidth;
                            });

                            if (maxChildWidth) {
                                self.css("left", (left + firstChildLeft + firstChildWidth - maxChildWidth ) + "px");
                                self.css("width", maxChildWidth + "px");

                                self.childWidgets.forEach(function (w) {
                                    var childWidth,
                                        m = (w.css("width") || "").match(/([-\d\.]+)px$/);
                                    if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                                    if (childWidth) {
                                        w.css("left", (maxChildWidth - childWidth) + "px");
                                    }
                                });
                            }
                        }
                    }
                },
                fillParent: function () {
                },
                setTemporary: function (value) {
                    if (this.isTemporary != value && this.$element) {
                        if (value) {
                            this.$element.addClass("tempElement");
                        } else {
                            this.$element.removeClass("tempElement");
                        }
                        this.isTemporary = value;
                    }
                },
                zoomIn: function ($page) {
                    var self = this;

                    if ($page && self.$element && self.$element.parent().length) {
                        var scaleX = $page.width() / self.$element.width(),
                            scaleY = $page.height() / self.$element.height(),
                            scale = Math.max(scaleX, scaleY);
                        scale = Math.floor(scale * $inject.angularConstants.precision) / $inject.angularConstants.precision;

                        var scaleStyleObj = $inject.uiUtilService.prefixedStyle("transform", "scale({0}, {1})", scale, scale);
                        self.$element.css(scaleStyleObj);

                        var pageLeft = $page.offset().left, pageTop = $page.offset().top;
                        pageLeft = Math.floor(pageLeft * $inject.angularConstants.precision) / $inject.angularConstants.precision, pageTop = Math.floor(pageTop * $inject.angularConstants.precision) / $inject.angularConstants.precision;
                        self.$element.offset({left: pageLeft, top: pageTop});

                        self.addClass("zoom");
                        self.zoomed = true;

                        return scale;
                    }
                },
                zoomOut: function () {
                    var self = this;

                    if (self.zoomed) {
                        var scaleStyleObj = $inject.uiUtilService.prefixedStyle("transform", "scale(1, 1)");
                        self.$element.css(scaleStyleObj);

                        self.$element.css({left: self.css("left"), top: self.css("top")});
                        self.removeClass("zoom");
                        self.zoomed = false;
                    }
                },
                setHtml: function (value) {
                    this.html = value;
                }
            }),
            IncludeSketchWidgetClass = Class(BaseSketchWidgetClass, {
                CLASS_NAME: "IncludeSketchWidget",
                MEMBERS: {
                    template: ""
                },
                initialize: function (id, template) {
                    arguments.callee.prototype.__proto__.initialize.apply(this, [id]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }

                    this.template = template;
                },
                toJSON: function () {
                    var jsonObj = IncludeSketchWidgetClass.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["CLASS_NAME", "template"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    var self = this;

                    self.template = obj.template;

                    IncludeSketchWidgetClass.prototype.__proto__.fromObject.apply(self, [obj]);

                    return self;
                },
                isKindOf: function (className) {
                    var self = this;

                    return IncludeSketchWidgetClass.prototype.CLASS_NAME == className || IncludeSketchWidgetClass.prototype.__proto__.isKindOf.apply(self, [className]);
                },
                appendTo: function (container) {
                    var self = this;

                    IncludeSketchWidgetClass.prototype.__proto__.appendTo.apply(self, [container]);

                    if (self.$element) {
                        return $inject.uiUtilService.whilst(function () {
                                return !angular.element(self.$element).scope();
                            }, function (callback) {
                                callback();
                            }, function (err) {
                                var defer = $inject.$q.defer();

                                if (!err) {
                                    self.$element.attr("ng-include", "'" + self.template + "'");

                                    var $parent = self.$element.parent(),
                                        scope = angular.element(self.$element).scope();

                                    scope.$on("$includeContentLoaded", function () {
                                        function completionScanner() {
                                            return $inject.uiUtilService.whilst(function () {
                                                    return !$parent.find("#" + self.id).length;
                                                }, function (callback) {
                                                    callback();
                                                }, null,
                                                $inject.angularConstants.checkInterval,
                                                "IncludeSketchWidgetClass.appendTo.completionScanner",
                                                $inject.angularConstants.renderTimeout
                                            );
                                        }

                                        completionScanner.onceId = "IncludeSketchWidgetClass.appendTo.completionScanner";

                                        $inject.uiUtilService.once(completionScanner, function (err) {
                                            if (err) {
                                                defer.reject(err);
                                            } else {
                                                defer.resolve(self);
                                            }
                                        }, 20)();
                                    });

                                    $inject.$compile(self.$element)(scope);
                                } else {
                                    $inject.$timeout(function () {
                                        defer.reject(err);
                                    });
                                }

                                return defer.promise;
                            },
                            $inject.angularConstants.checkInterval,
                            "IncludeSketchWidgetClass.appendTo",
                            $inject.angularConstants.renderTimeout
                        ).then(function (err) {
                                var defer = $inject.$q.defer();

                                $inject.$timeout(function () {
                                    if (err) {
                                        defer.reject(err);
                                    } else {
                                        defer.resolve(self);
                                    }
                                });

                                return defer.promise;
                            }
                        );
                    } else {
                        var defer = $inject.$q.defer();

                        $inject.$timeout(function () {
                            defer.resolve(self);
                        });

                        return defer.promise;
                    }
                }
            }),
            RepoSketchWidgetClass = Class(IncludeSketchWidgetClass, {
                CLASS_NAME: "RepoSketchWidget",
                MEMBERS: {
                    widgetSpec: null
                },
                initialize: function (id, widgetSpec) {
                    arguments.callee.prototype.__proto__.initialize.apply(this, [id, widgetSpec && widgetSpec.template || ""]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }

                    this.resizable = false;
                    this.widgetSpec = widgetSpec;
                },
                dispose: function () {
                    RepoSketchWidgetClass.prototype.__proto__.dispose.apply(this);
                },
                toJSON: function () {
                    var jsonObj = RepoSketchWidgetClass.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["CLASS_NAME", "widgetSpec"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    var ret = new RepoSketchWidgetClass(obj.id, obj.widgetSpec);

                    RepoSketchWidgetClass.prototype.__proto__.fromObject.apply(ret, [obj]);

                    return ret;
                },
                isKindOf: function (className) {
                    var self = this;

                    return RepoSketchWidgetClass.prototype.CLASS_NAME == className || RepoSketchWidgetClass.prototype.__proto__.isKindOf.apply(self, [className]);
                },
                appendTo: function (container) {
                    var self = this;

                    return RepoSketchWidgetClass.prototype.__proto__.appendTo.apply(self, [container]).then(
                        function () {
                            return $inject.appService.loadRepoArtifact({
                                _id: self.widgetSpec.artifactId,
                                name: self.widgetSpec.name,
                                type: self.widgetSpec.type
                            }, self.widgetSpec.libraryName, self.widgetSpec.version).then(
                                function (loadedSpec) {
                                    var defer = $inject.$q.defer();

                                    $inject.$timeout(function () {
                                        self.widgetSpec = loadedSpec;
                                        self.template = loadedSpec.template;

                                        var stateConfiguration = loadedSpec.configuration.state;
                                        if (stateConfiguration) {
                                            var stateOptions = stateConfiguration.options;
                                            stateOptions.forEach(function (option) {
                                                RepoSketchWidgetClass.prototype.__proto__.addStateOption.apply(self, [{name: option.name}]);
                                            });
                                        }

                                        self.$element && self.$element.addClass("widgetIncludeAnchor");
                                        defer.resolve();
                                    });

                                    return defer.promise;
                                },
                                function (err) {
                                    var errorDefer = $inject.$q.defer();

                                    $inject.$timeout(function () {
                                        errorDefer.reject(err);
                                    });

                                    return errorDefer.promise;
                                }
                            );
                        },
                        function (err) {
                            var errorDefer = $inject.$q.defer();

                            $inject.$timeout(function () {
                                errorDefer.reject(err);
                            });

                            return errorDefer.promise;
                        }
                    );
                },
                setConfiguration: function (key, value) {
                    var self = this;

                    if (self.$element && self.$element.parent().length) {
                        var scope = angular.element(self.$element.find(".ui-widget:nth-of-type(1) :first-child")).scope();

                        if (typeof key === "object") {
                            _.each(key, function (item) {
                                if (item.type === "list") {
                                    scope[item.key] = item.pickedOption;
                                } else if (item.type === "number") {
                                    var m = (item.numberValue || "").match(/([-\d\.]+)(px|%)+$/)
                                    if (m && m.length == 3) {
                                        scope[item.key] = item.numberValue;
                                    }
                                } else if (item.type === "boolean") {
                                    scope[item.key] = item.booleanValue;
                                }
                            });
                        }
                        else if (typeof key === "string") {
                            scope[key] = value;
                        }
                    }
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
                    RepoSketchWidgetClass.prototype.__proto__.setState.apply(this, [value]);

                    if (this.$element && this.$element.parent().length) {
                        var scope = angular.element(this.$element.find(".ui-widget:nth-of-type(1) :first-child")).scope();
                        scope.state = value;
                    }
                },
                setStateContext: function (value) {
                    var self = this;

                    if (value) {
                        RepoSketchWidgetClass.prototype.__proto__.setStateContext.apply(self, [value]);

                        //Initialize states from the widget setting
                        var stateOptions = angular.copy(self.stateOptions);
                        _.union([self.initialStateOption], stateOptions).forEach(function (stateOption) {
                            if (self.states.every(function (s) {
                                    return s.context.id != self.stateContext.id || s.name != stateOption.name;
                                })) {
                                self.states.push(new State(self, stateOption.name, self.stateContext));
                            }
                        });
                    }
                }
            }),
            PageSketchWidgetClass = Class(BaseSketchWidgetClass, {
                CLASS_NAME: "PageSketchWidget",
                MEMBERS: {},
                initialize: function (id) {
                    this.initialize.prototype.__proto__.initialize.apply(this, [id]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = angular.copy(MEMBERS[member]);
                    }

                    this.resizable = false;
                },
                toJSON: function () {
                    var jsonObj = PageSketchWidgetClass.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    //Match marshalled widget id with created widget object.
                    //Some objects may marshall widget id instead of the object. In order to restore object reference, match process will be handled.
                    PageSketchWidgetClass.prototype.__proto__.startMatchReference.apply(null);

                    var ret = new PageSketchWidgetClass(obj.id);
                    PageSketchWidgetClass.prototype.__proto__.fromObject.apply(ret, [obj]);

                    PageSketchWidgetClass.prototype.__proto__.endMatchReference.apply(null);

                    return ret;
                },
                isKindOf: function (className) {
                    var self = this;

                    return PageSketchWidgetClass.prototype.CLASS_NAME == className || PageSketchWidgetClass.prototype.__proto__.isKindOf.apply(self, [className]);
                },
                parent: function () {
                    return null;
                },
                parentElement: function () {
                    var self = this;

                    return self.$element && self.$element.parent() || null;
                }
            });

        Service.prototype.createWidgetObj = function (element) {
            var self = this,
                $el;

            if (element.jquery) {
                $el = element;
            } else if (typeof element === "string" || angular.isElement(element)) {
                $el = $(element);
            }

            if ($el && $el.attr("ui-sketch-widget") != null && !$el.data("widgetObject")) {
                var $parentElement = $el.parent("[widget-anchor]"),
                    anchor;

                if ($parentElement.length) {
                    anchor = $parentElement.attr("widget-anchor");
                    $parentElement = $parentElement.closest("[ui-sketch-widget]");
                } else {
                    $parentElement = $el.parent("[ui-sketch-widget]");
                }

                if ($parentElement.length) {
                    var parentWidgetObj = $parentElement.data("widgetObject");
                    if (parentWidgetObj) {
                        var widgetObj,
                            id = $el.attr("id");

                        //Fetch widget object if found
                        if (id) {
                            parentWidgetObj.childWidgets.every(function (child) {
                                if (child.id === id) {
                                    widgetObj = child;
                                    return false;
                                }

                                return true;
                            });
                        } else if ($el.hasClass(self.angularConstants.widgetClasses.widgetContainerClass) && parentWidgetObj.isKindOf("RepoSketchWidget")) {
                            if (parentWidgetObj.childWidgets.length) {
                                widgetObj = parentWidgetObj.childWidgets[0];
                                widgetObj.addOmniClass(self.angularConstants.widgetClasses.widgetContainerClass);
                            }
                        }

                        if (!widgetObj) {
                            widgetObj = new ElementSketchWidgetClass();

                            widgetObj.attr["ui-draggable"] = $el.attr("ui-draggable");
                            widgetObj.attr["ui-draggable-opts"] = $el.attr("ui-draggable-opts");
                            widgetObj.attr["ui-sketch-widget"] = "";
                            widgetObj.attr["is-playing"] = "sketchWidgetSetting.isPlaying";
                            widgetObj.attr["sketch-object"] = "sketchObject";
                            widgetObj.addOmniClass(self.angularConstants.widgetClasses.widgetClass);
                            if ($el.hasClass(self.angularConstants.widgetClasses.widgetContainerClass)) {
                                widgetObj.addOmniClass(self.angularConstants.widgetClasses.widgetContainerClass);
                            }
                        }

                        widgetObj.$element = $el;
                        widgetObj.anchor = anchor;
                        $el.attr("id", widgetObj.id);
                        $el.data("widgetObject", widgetObj);

                        BaseSketchWidgetClass.prototype.appendTo.apply(widgetObj, [parentWidgetObj]);

                        return widgetObj;
                    }
                }
            }
        }

        Service.prototype.createWidget = function (containerElement, widgetObj) {
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
                } else if ($container.attr("widget-anchor") != null) {
                    $parent = $container.closest("[ui-sketch-widget]");
                    anchor = $container.attr("widget-anchor");
                }

                if ($parent) {
                    widgetObj = widgetObj || new ElementSketchWidgetClass();
                    widgetObj.anchor = anchor;
                    widgetObj.attr["ui-draggable"] = "";
                    widgetObj.attr["ui-draggable-opts"] = "{threshold: 5, pointers: 0}";
                    widgetObj.attr["ui-sketch-widget"] = "";
                    widgetObj.attr["is-playing"] = "sketchWidgetSetting.isPlaying";
                    widgetObj.attr["sketch-object"] = "sketchObject";
                    widgetObj.addOmniClass(self.angularConstants.widgetClasses.widgetClass);
                    widgetObj.appendTo($parent);

                    var scope = angular.element(containerElement).scope();
                    $inject.$compile(containerElement)(scope);

                    return widgetObj;
                }
            }
        }

        Service.prototype.createRepoWidget = function (containerElement, widgetSpec) {
            var self = this,
                widgetObj = new RepoSketchWidgetClass(null, widgetSpec);
            widgetObj.attr["ui-sketch-widget"] = "";
            widgetObj.attr["is-playing"] = "sketchWidgetSetting.isPlaying";
            widgetObj.attr["sketch-object"] = "sketchObject";
            widgetObj.addOmniClass(self.angularConstants.widgetClasses.widgetClass);

            widgetObj.appendTo(containerElement);

            return widgetObj;
        }

        Service.prototype.copyWidget = function (widgetObj, holderElement) {
            var self = this,
                cloneObj = widgetObj.clone();

            cloneObj.removeClass(self.angularConstants.widgetClasses.activeClass);
            cloneObj.appendTo(holderElement);

            var scope = angular.element(cloneObj.$element.parent()).scope();
            $inject.$compile(cloneObj.$element.parent())(scope);

            return cloneObj;
        }

        Service.prototype.createComposite = function (widgetObjs, isTemporary) {
            if (widgetObjs && widgetObjs.length) {
                var self = this,
                    containerId = null,
                    containerElement = null,
                    widgetArr = [];

                widgetObjs.forEach(function (w) {
                    if (w.isElement) {
                        if (!w.$element || !w.$element.parent().length) {
                            widgetArr.push(w);
                        } else {
                            var $parent = w.$element.parent(),
                                parentId = $parent.data("widgetObject").id;
                            containerId = containerId || parentId;
                            containerElement = containerElement || ($parent.length && $parent);
                            if (!parentId || !containerId || containerId == parentId) {
                                widgetArr.push(w);
                            }
                        }
                    }
                });

                if (widgetArr.length && containerElement) {
                    var compositeObj = new ElementSketchWidgetClass(null, widgetArr, isTemporary);

                    compositeObj.attr["ui-draggable"] = "";
                    compositeObj.attr["ui-draggable-opts"] = "{threshold: 5, pointers: 0}";
                    compositeObj.attr["ui-sketch-widget"] = "";
                    compositeObj.attr["is-playing"] = "sketchWidgetSetting.isPlaying";
                    compositeObj.attr["sketch-object"] = "sketchObject";
                    compositeObj.addOmniClass(self.angularConstants.widgetClasses.widgetClass);
                    compositeObj.appendTo(containerElement);

                    var scope = angular.element(compositeObj.$element.parent()).scope();
                    self.$compile(compositeObj.$element.parent())(scope);

                    return compositeObj;
                }
            }

            return null;
        }

        Service.prototype.createPage = function (holderElement, pageObj) {
            var self = this;

            pageObj = pageObj || new PageSketchWidgetClass();
            pageObj.attr["ui-sketch-widget"] = "";
            pageObj.attr["is-playing"] = "sketchWidgetSetting.isPlaying";
            pageObj.attr["sketch-object"] = "sketchObject";
            pageObj.addOmniClass(self.angularConstants.widgetClasses.holderClass);
            pageObj.appendTo(holderElement);

            return self.uiUtilService.whilst(function () {
                return !angular.element(holderElement).scope();
            }, function (callback) {
                callback();
            }, function () {
                var scope = angular.element(holderElement).scope();
                self.$compile(holderElement)(scope);
            }).then(function () {
                var defer = self.$q.defer();

                self.$timeout(function () {
                    defer.resolve(pageObj);
                });

                return defer.promise;
            }, self.angularConstants.checkInterval);
        }

        Service.prototype.copyPage = function (pageObj, holderElement) {
            var self = this,
                cloneObj = pageObj.clone();

            cloneObj.removeClass(self.angularConstants.widgetClasses.activeClass);
            cloneObj.appendTo(holderElement);

            return self.uiUtilService.whilst(function () {
                return !angular.element(cloneObj.$element.parent()).scope();
            }, function (callback) {
                callback();
            }, function () {
                var scope = angular.element(cloneObj.$element.parent()).scope();
                $inject.$compile(cloneObj.$element.parent())(scope);
            }).then(function () {
                var defer = self.$q.defer();

                self.$timeout(function () {
                    defer.resolve(cloneObj);
                });

                return defer.promise;
            }, self.angularConstants.checkInterval);
        }

        Service.prototype.fromObject = function (obj) {
            var className = obj.CLASS_NAME,
                classes = ["PageSketchWidgetClass"],
                ret;

            classes.every(function (clazz) {
                if (eval("className === {0}.prototype.CLASS_NAME".format(clazz))) {
                    ret = eval("{0}.prototype.fromObject(obj)".format(clazz));
                    return false;
                }

                return true;
            });

            return ret;
        }

        Service.prototype.isConfigurable = function (widgetObj) {
            return this.configurableWidget(widgetObj);
        }

        Service.prototype.configurableWidget = function (widgetObj) {
            var self = this,
                result = null;

            if (widgetObj && widgetObj.isKindOf("BaseSketchWidget")) {
                if (widgetObj.$element && widgetObj.$element.hasClass("widgetContainer")) {
                    var $parent = widgetObj.$element.parent();
                    if ($parent.length) {
                        result = self.configurableWidget($parent.data("widgetObject"));
                    }
                } else if (widgetObj.isKindOf("RepoSketchWidget")) {
                    if (!_.isEmpty(_.omit(widgetObj.widgetSpec && widgetObj.widgetSpec.configuration || {}, "state")))
                        result = widgetObj;
                }
            }

            return result;
        }

        Service.prototype.loadSketch = function (sketchWorks) {
            var self = this;

            return self.appService.loadSketch(sketchWorks).then(function (pages) {
                var defer = self.$q.defer();

                self.$timeout(function () {
                    if (pages && pages.length) {
                        sketchWorks.pages = [];
                        pages.forEach(function (pageObj) {
                            var page = self.fromObject(pageObj);
                            page && sketchWorks.pages.push(page);
                        });
                    }

                    defer.resolve(sketchWorks);
                }, function () {
                    defer.reject();
                });

                return defer.promise;
            });
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('uiService', Service);
                }]);
        };
    }
);