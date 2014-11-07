define(
    ["angular", "jquery", "underscore", "ng.ui.util"],
    function () {
        var Service = function ($parse, $timeout, $q, $compile, uiUtilService) {
            this.$parse = $parse;
            this.$timeout = $timeout;
            this.$q = $q;
            this.$compile = $compile;
            this.uiUtilService = uiUtilService;

            _.extend($inject, _.pick(this, Service.$inject));
        };

        Service.$inject = ["$parse", "$timeout", "$q", "$compile", "uiUtilService"];
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
                        this[member] = _.clone(MEMBERS[member]);
                    }
                    this.node = node;
                    this.context = context;
                    this.name = name;
                    this.id = id || "State_" + new Date().getTime();
                },
                toJSON: function () {
                    return _.extend(_.pick(this, ["id", "node", "name", "transition"], "CLASS_NAME"), {context: this.context && this.context.node !== "?" && this.context.id || ""});
                },
                fromObject: function (obj) {
                    var ret = new State(obj.node, obj.name, obj.context, obj.id);
                    obj.transitions.forEach(function (t) {
                        ret.transitions.push(Transition.prototype.fromObject(t));
                    });

                    return ret;
                },
                setContext: function (value) {
                    this.context = value;
                },
                toString: function () {
                    return this.node !== "?" && this.id || "?";
                },
                addTransition: function (toState) {
                    var self = this;

                    if (toState && toState.context === self.context) {
                        self.transitions.every(function (t) {
                            return t.toState.name !== toState.name;
                        }) && self.transitions.push(new Transition(self, toState));
                    }
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

                    return cloneObj;
                }
            }),
            Transition = Class({
                CLASS_NAME: "Transition",
                MEMBERS: {
                    id: "",
                    state: null,
                    toState: null,
                    trigger: null,
                    actionObj: null
                },
                initialize: function (state, toState, id) {
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = _.clone(MEMBERS[member]);
                    }

                    this.state = state;
                    this.toState = toState;
                    this.id = id || "Transition_" + new Date().getTime();
                },
                toJSON: function () {
                    return _.extend(_.pick(this, ["id", "trigger", "actionObj"], "CLASS_NAME"), {
                        state: this.state.id,
                        toState: this.toState.id
                    });
                },
                fromObject: function (obj) {
                    var ret = new Transition(obj.state, obj.toState, obj.id);

                    obj.trigger && ret.setTrigger(obj.trigger.triggerType, obj.trigger.eventName, obj.trigger.options);

                    if (obj.actionObj) {
                        var classes = ["AnimationTransitionAction"],
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
                                });

                                return defer.promise;
                            }

                            triggerSetterHandler.onceId = "Transition.createTriggerSetter.triggerSetterHandler";

                            if (eventId) {
                                var args = Array.prototype.slice.apply(arguments),
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
                setAnimationAction: function (animation) {
                    this.setAction(new AnimationTransitionAction(animation));
                },
                setTrigger: function (triggerType, eventName, options) {
                    var self = this,
                        trigger;

                    function triggerCallback(event, widgetObj) {
                        var $q = $inject.$q,
                            defer = $q.defer();

                        self.actionObj && $q.all([self.actionObj.doAction(widgetObj)]).then(
                            function (actionObjs) {
                                actionObjs.forEach(function (obj) {
                                    obj && obj.restoreWidget(widgetObj);
                                });
                                widgetObj.setState(self.toState);
                            }
                        );
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
                unregisterTrigger: function (restoreWidget) {
                    if (this.trigger) {
                        var widgetObj = this.trigger.widgetObj;

                        this.trigger.off();
                        if (widgetObj && restoreWidget && this.actionObj) {
                            this.actionObj.restoreWidget(widgetObj);
                        }
                    }
                }
            }),
            BaseTransitionAction = Class({
                CLASS_NAME: "BaseTransitionAction",
                MEMBERS: {
                    id: "",
                    actionType: "",
                    name: ""
                },
                initialize: function (actionType, name, id) {
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = _.clone(MEMBERS[member]);
                    }

                    this.actionType = actionType;
                    this.name = name;
                    this.id = id || "TransitionAction_" + new Date().getTime();
                },
                toJSON: function () {
                    return _.pick(this, ["id", "actionType", "name"], "CLASS_NAME");
                },
                fromObject: function (obj) {
                },
                doAction: function (widgetObj) {
                },
                restoreWidget: function (widgetObj) {
                }
            }),
            AnimationTransitionAction = Class(BaseTransitionAction, {
                CLASS_NAME: "AnimationTransitionAction",
                MEMBERS:{},
                initialize: function (animation, id) {
                    this.initialize.prototype.__proto__.initialize.apply(this, ["Animation", animation, id]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = _.clone(MEMBERS[member]);
                    }
                },
                toJSON: function () {
                    var jsonObj = this.initialize.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    var ret = new AnimationTransitionAction(obj.name, obj.id);

                    AnimationTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj]);

                    return ret;
                },
                doAction: function (widgetObj) {
                    var self = this,
                        defer = $inject.$q.defer();

                    if (widgetObj.$element && widgetObj.$element.parent().length) {
                        self.cssAnimation = _.extend(
                            $inject.uiUtilService.prefixedStyle("animation", "{0} {1}s {2}", self.name, 1, "both")
                        );

                        widgetObj.$element.css(self.cssAnimation);

                        var animationName = widgetObj.$element.css("animation-name");
                        if (animationName && animationName !== "none") {
                            $inject.uiUtilService.onAnimationEnd(widgetObj.$element).then(function () {
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
                restoreWidget: function (widgetObj) {
                    var self = this;

                    if (widgetObj && self.cssAnimation) {
                        for (var key in self.cssAnimation) {
                            widgetObj.$element.css(key, "");
                        }
                    }
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
                        this[member] = _.clone(MEMBERS[member]);
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
                MEMBERS:{},
                initialize: function (eventName, options, callback) {
                    this.initialize.prototype.__proto__.initialize.apply(this, ["Gesture", eventName, _.clone(options)]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = _.clone(MEMBERS[member]);
                    }

                    this.callback = callback;
                },
                toJSON: function () {
                    var jsonObj = this.initialize.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    var ret = new GestureTrigger(obj.eventName, obj.options);

                    GestureTrigger.prototype.__proto__.fromObject.apply(ret, [obj]);

                    return ret;
                },
                on: function (widgetObj) {
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
                    stateMaps: {}
                },
                initialize: function (widgetObj) {
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = _.clone(MEMBERS[member]);
                    }

                    this.widgetObj = widgetObj;
                },
                toJSON: function () {
                    return _.pick(this, ["stateMaps"], "CLASS_NAME");
                },
                fromObject: function (obj) {
                    var ret = new StyleManager();
                    ret.stateMaps = obj.stateMaps;

                    return ret;
                },
                addClass: function (classes, state, stateContext) {
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {style: {}, classList: []},
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
                        stateValue = stateMap[state.name] || {style: {}, classList: []};

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
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {style: {}, classList: []};

                    if (stateMap === self.stateMaps[stateContext] && stateValue === stateMap[state.name]) {
                        var classList = stateValue.classList;

                        return !classList.every(function (c) {
                            return c != clazz;
                        });
                    }

                    return false;
                },
                classList: function (state, stateContext) {
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {style: {}, classList: []};

                    if (stateMap !== self.stateMaps[stateContext]) self.stateMaps[stateContext] = stateMap;
                    if (stateValue !== stateMap[state.name]) stateMap[state.name] = stateValue;

                    return stateValue.classList;
                },
                css: function (state, stateContext) {
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {style: {}, classList: []},
                        style = stateValue.style,
                        args = Array.prototype.slice.call(arguments, 2),
                        ret = self;

                    if (stateMap !== self.stateMaps[stateContext]) self.stateMaps[stateContext] = stateMap;
                    if (stateValue !== stateMap[state.name]) stateMap[state.name] = stateValue;

                    switch (args.length) {
                        case 1 :
                            if (typeof args[0] === "string")
                                ret = style[args[0]];
                            else if (typeof args[0] === "object") {
                                for (var key in args[0]) {
                                    self.css(state, stateContext, key, args[0][key]);
                                }
                            } else if (!args[0]) {
                                _.keys(style).forEach(function (key) {
                                    delete style[key];
                                });
                            }
                            break;
                        case 2 :
                            if (typeof args[0] === "string") {
                                if (args[1]) {
                                    style[args[0]] = args[1];
                                } else {
                                    delete style[args[0]];
                                }
                                if (self.widgetObj.$element) {
                                    if (state == self.widgetObj.state) {
                                        if (toString.call(args[1]) === '[object Array]') {
                                            args[1].forEach(function (styleValue) {
                                                self.widgetObj.$element.css(args[0], styleValue);
                                            });
                                        } else {
                                            self.widgetObj.$element.css(args[0], args[1]);
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
                draw: function (state, stateContext) {
                    var self = this;

                    state = state || self.widgetObj.state;
                    stateContext = stateContext || state.context;

                    var stateMap = self.stateMaps[stateContext] || {},
                        stateValue = stateMap[state.name] || {style: {}, classList: []},
                        style = stateValue.style,
                        classList = stateValue.classList;

                    if (self.widgetObj.$element) {
                        self.widgetObj.$element.addClass(classList.join(" "));

                        if (state == self.widgetObj.state) {
                            for (var styleName in style) {
                                var styleValue = style[styleName];

                                if (styleValue === '[object Array]') {
                                    styleValue.forEach(function (value) {
                                        self.widgetObj.$element.css(styleName, value);
                                    });
                                } else {
                                    self.widgetObj.$element.css(styleName, styleValue);
                                }
                            }
                        }
                    }
                },
                clone: function () {
                    var self = this,
                        cloneObj = new self.initialize(),
                        cloneMembers = _.difference(_.keys(self.MEMBERS), ["widgetObj", "stateMaps"]);

                    cloneMembers.forEach(function (member) {
                        cloneObj[member] = _.clone(self[member]);
                    });

                    //style may contains property with array value
                    for (var stateContext in self.stateMaps) {
                        var stateMap = self.stateMaps[stateContext];
                        cloneObj.stateMaps[stateContext] = {};
                        for (var stateName in stateMap) {
                            var stateValue = stateMap[stateName];
                            cloneObj.stateMaps[stateContext][stateName] = {
                                style: {},
                                classList: _.clone(stateValue.classList)
                            };

                            var style = stateValue.style,
                                cloneStyle = cloneObj.stateMaps[stateContext][stateName].style;

                            for (var styleName in style) {
                                cloneStyle[styleName] = _.clone(style[styleName]);
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
                            this[member] = _.clone(MEMBERS[member]);
                        }
                        this.id = id || ("Widget_" + new Date().getTime());
                        this.stateContext = this.STATE_CONTEXT;
                        this.state = new State(this.id, this.initialStateOption.name, this.STATE_CONTEXT);
                        this.states.push(this.state);
                        this.styleManager = new StyleManager(this);
                    },
                    toJSON: function () {
                        return _.extend(_.pick(this, ["id", "name", "childWidgets", "attr", "styleManager", "states", "stateOptions"]), {
                            state: this.state.id,
                            stateContext: this.stateContext.node !== "?" && this.stateContext.id || ""
                        });
                    },
                    fromObject: function (obj) {
                        var self = this;

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
                        self.states.forEach(function (s) {
                            s.transitions.forEach(function (t) {
                                t.state = stateMap[t.state];
                                t.toState = stateMap[t.toState];
                            });
                        });

                        var childWidgets = [],
                            classes = ["ElementSketchWidgetClass"];
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
                                    s.context = stateMap[s.context];
                                });
                                childWidgets.push(childWidget);
                            }
                        });

                        childWidgets.forEach(function (childWidget) {
                            self.append(childWidget);
                        });
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return BaseSketchWidgetClass.prototype.CLASS_NAME == className;
                    },
                    clone: function () {
                        var self = this,
                            cloneObj = new self.initialize(),
                            cloneMembers = _.difference(_.keys(self.MEMBERS), ["id", "childWidgets", "styleManager", "states", "$element"]);

                        cloneMembers.forEach(function (member) {
                            cloneObj[member] = _.clone(self[member]);
                        });

                        self.states.forEach(function (s) {
                            cloneObj.states.push(s.clone && s.clone() || _.clone(s));
                        });
                        cloneObj.setState(self.state);

                        cloneObj.styleManager = self.styleManager.clone();
                        cloneObj.styleManager.widgetObj = cloneObj;

                        self.childWidgets.forEach(function (obj) {
                            cloneObj.childWidgets.push(obj.clone());
                        });

                        return cloneObj;
                    },
                    append: function (childWidget) {
                        var self = this;

                        if (childWidget && childWidget.isKindOf && childWidget.isKindOf("BaseSketchWidget")) {
                            childWidget.draw(self);
                        }

                        return self;
                    },
                    remove: function () {
                        var self = this;

                        if (self.$element) {
                            var $parent = self.$element.parent();

                            if ($parent.length) {
                                var parentWidgetObj = $parent.data("widgetObject");

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

                            }
                            self.$element = null;
                        }
                    },
                    draw: function (container) {
                        if (container) {
                            var self = this,
                                widgetObj,
                                parentId = self.$element && self.$element.parent().attr("id") || "";

                            if (container.isKindOf && container.isKindOf("BaseSketchWidget")) {
                                widgetObj = container;
                            } else if (typeof container === "string" || angular.isElement(container)) {
                                widgetObj = $(container).data("widgetObject");
                            } else if (container.jquery) {
                                widgetObj = container.data("widgetObject");
                            }

                            self.$element = self.$element || $("<div />").data("widgetObject", self).attr("id", self.id);
                            self.$element.attr(self.attr);

                            if (widgetObj && widgetObj.isKindOf && widgetObj.isKindOf("BaseSketchWidget")) {
                                widgetObj.childWidgets.every(function (obj) {
                                    return obj.id != self.id;
                                }) && widgetObj.childWidgets.push(self);

                                self.setStateContext(widgetObj.state);

                                if (parentId && parentId !== widgetObj.id) {
                                    self.$element.detach();
                                }
                                widgetObj.$element && widgetObj.$element.append(self.$element);
                            } else {
                                self.setStateContext(self.STATE_CONTEXT);
                                if (!container.find("#" + self.id).length) {
                                    var containerId = container.attr("id");
                                    if (!containerId && !parentId && (parentId !== containerId)) {
                                        self.$element.detach();
                                    }
                                    container.append(self.$element);
                                }
                            }

                            self.childWidgets.forEach(function (child) {
                                child.draw(self);
                            })
                            self.styleManager.draw();
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
                    hasClass: function (clazz) {
                        return this.styleManager.hasClass.apply(this.styleManager, [clazz, this.state, this.stateContext]);
                    },
                    css: function () {
                        var args = Array.prototype.slice.call(arguments);
                        args.splice(0, 0, this.state, this.stateContext);

                        return this.styleManager.css.apply(this.styleManager, args);
                    },
                    showHide: function (showState) {
                        this.$element && this.$element.toggle(showState);

                        return showState;
                    },
                    setState: function (value) {
                        if (value) {
                            var self = this,
                                stateName = typeof value === "string" && value || value.name,
                                stateFound = false;

                            if (stateName) {
                                if (self.states.every(function (s) {
                                        if (s.context == self.stateContext && s.name == stateName) {
                                            value = s;
                                            stateFound = true;
                                            return false;
                                        }

                                        return true;
                                    })) {
                                    if (self.stateOptions.every(function (stateOption) {
                                            if (stateOption.name == stateName) {
                                                value = new State(self.id, stateName, self.stateContext);
                                                return false;
                                            }

                                            return true;
                                        })) {
                                        if (self.initialStateOption.name == stateName)
                                            value = new State(self.id, self.initialStateOption.name, self.stateContext);
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
                                if (s.context = self.stateContext && s.name == stateName) {
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
                                return s.context != self.stateContext || s.name != stateName;
                            }) && self.stateOptions.every(function (stateOption) {
                                if (stateOption.name == stateName) {
                                    newState = new State(self.id, stateName, self.stateContext);
                                    self.states.push(newState);
                                    return false;
                                }

                                return true;
                            });
                        }

                        return newState;
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
                                            if (state.context = self.stateContext && state.name === stateName) {
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

                        if (value && value.name) {
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
                    setColor: function (value) {
                        value && this.css("color", value) || this.css("color", "");
                    },
                    getColor: function () {
                        return this.css("color");
                    },
                    setBorderColor: function (value) {
                        value && this.css("border-color", value) || this.css("border-color", "");
                    },
                    getBorderColor: function () {
                        return this.css("border-color");
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
                    },
                    setShape: function () {
                    },
                    getShape: function () {

                    }
                }
            ),
            ElementSketchWidgetClass = Class(BaseSketchWidgetClass, {
                CLASS_NAME: "ElementSketchWidget",
                MEMBERS:{},
                initialize: function (id) {
                    this.initialize.prototype.__proto__.initialize.apply(this, [id]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = _.clone(MEMBERS[member]);
                    }

                    this.isElement = true;
                    this.isTemporary = false;

                    if (arguments.length >= 1) {
                        var self = this,
                            widgetsArr = arguments[0];

                        if (toString.apply(widgetsArr) == "[object Array]" && widgetsArr.length) {
                            widgetsArr.forEach(function (childWidget) {
                                self.append(childWidget);
                            });
                        }
                    }
                },
                toJSON: function () {
                    var jsonObj = this.initialize.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    var ret = new ElementSketchWidgetClass(obj.id);

                    ElementSketchWidgetClass.prototype.__proto__.fromObject.apply(ret, [obj]);

                    return ret;
                },
                isKindOf: function (className) {
                    var self = this;

                    return ElementSketchWidgetClass.prototype.CLASS_NAME == className || self.initialize.prototype.__proto__.isKindOf.apply(self, [className]);
                },
                draw: function (container) {
                    var self = this;

                    if (container) {
                        var $container;
                        if (container.isKindOf && container.isKindOf("BaseSketchWidget")) {
                            $container = container.$element;
                        } else if (typeof container === "string" || angular.isElement(container)) {
                            $container = $(container);
                        } else if (container.jquery) {
                            $container = container;
                        }

                        if ($container) {
                            var containerLeft = $container.offset().left,
                                containerTop = $container.offset().top;

                            containerLeft = Math.floor(containerLeft * 100) / 100, containerTop = Math.floor(containerTop * 100) / 100;

                            self.offsetLeft != undefined && self.css("left", (self.offsetLeft - containerLeft) + "px") && delete self.offsetLeft;
                            self.offsetTop != undefined && self.css("top", (self.offsetTop - containerTop) + "px") && delete self.offsetTop;
                        }

                        self.initialize.prototype.__proto__.draw.apply(self, [container]);
                    }
                },
                append: function (childWidget) {
                    var self = this;

                    if (childWidget.$element && childWidget.$element.parent().length) {
                        var childLeft = childWidget.$element.offset().left,
                            childTop = childWidget.$element.offset().top,
                            childWidth = childWidget.$element.width(),
                            childHeight = childWidget.$element.height(),
                            left,
                            top,
                            offsetLeft,
                            offsetTop,
                            width,
                            height;

                        childLeft = Math.floor(childLeft * 100) / 100, childTop = Math.floor(childTop * 100) / 100, childWidth = Math.floor(childWidth * 100) / 100, childHeight = Math.floor(childHeight * 100) / 100;

                        childWidget.remove();

                        if (self.$element && self.$element.parent().length) {
                            left = offsetLeft = self.$element.offset().left, top = offsetTop = self.$element.offset().top, width = self.$element.width(), height = self.$element.height();
                        } else {
                            left = self.offsetLeft, top = self.offsetTop;

                            var m = (self.css("width") || "").match(/([-\d\.]+)px$/);
                            if (m && m.length == 2) width = Math.floor(parseFloat(m[1]) * 100) / 100;
                            m = (self.css("height") || "").match(/([-\d\.]+)px$/);
                            if (m && m.length == 2) height = Math.floor(parseFloat(m[1]) * 100) / 100;

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

                        if ((self.offsetLeft != undefined && self.offsetLeft != left) || (offsetLeft != undefined && offsetLeft != left)) {
                            if (offsetLeft == undefined) {
                                offsetLeft = self.offsetLeft;
                            } else {
                                m = (self.css("left") || "").match(/([-\d\.]+)px$/);
                                if (m && m.length == 2) {
                                    self.css("left", (Math.floor(parseFloat(m[1]) * 100) / 100 + left - offsetLeft) + "px");
                                }
                            }
                            self.childWidgets.forEach(function (w) {
                                var cm = (w.css("left") || "").match(/([-\d\.]+)px$/),
                                    cLeft = parseFloat(cm[1]);
                                w.css("left", (cLeft - (left - offsetLeft) + "px"));
                            });
                        }
                        if ((self.offsetTop != undefined && self.offsetTop != top) || (offsetTop != undefined && offsetTop != top)) {
                            if (offsetTop == undefined) {
                                offsetTop = self.offsetTop;
                            } else {
                                m = (self.css("top") || "").match(/([-\d\.]+)px$/);
                                if (m && m.length == 2) {
                                    self.css("top", (Math.floor(parseFloat(m[1]) * 100) / 100 + top - offsetTop) + "px");
                                }
                            }
                            self.childWidgets.forEach(function (w) {
                                var cm = (w.css("top") || "").match(/([-\d\.]+)px$/),
                                    cTop = parseFloat(cm[1]);
                                w.css("top", (cTop - (top - offsetTop) + "px"));
                            });
                        }

                        if (!self.$element || !self.$element.parent().length) {
                            self.offsetLeft = left;
                            self.offsetTop = top;
                        }

                        self.css("width", width + "px");
                        self.css("height", height + "px");

                        childLeft -= left;
                        childTop -= top;
                        childWidget.css("left", childLeft + "px");
                        childWidget.css("top", childTop + "px");
                    }

                    self.initialize.prototype.__proto__.append.apply(self, [childWidget]);
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

                        left = Math.floor(left * 100) / 100, top = Math.floor(top * 100) / 100, parentLeft = Math.floor(parentLeft * 100) / 100, parentTop = Math.floor(parentTop * 100) / 100, width = Math.floor(width * 100) / 100, height = Math.floor(height * 100) / 100;

                        self.childWidgets.forEach(function (childWidget, index) {
                            var childLeft = 0, childTop = 0, childWidth = 0, childHeight = 0;

                            var m = childWidget.css("left").match(/([-\d\.]+)px$/);
                            if (m && m.length == 2) childLeft = Math.floor(parseFloat(m[1]) * 100) / 100;
                            m = childWidget.css("top").match(/([-\d\.]+)px$/);
                            if (m && m.length == 2) childTop = Math.floor(parseFloat(m[1]) * 100) / 100;
                            m = childWidget.css("width").match(/([-\d\.]+)px$/);
                            if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;
                            m = childWidget.css("height").match(/([-\d\.]+)px$/);
                            if (m && m.length == 2) childHeight = Math.floor(parseFloat(m[1]) * 100) / 100;

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
                            widgetObj = self.childWidgets[wIndex];
                            widgetObj.remove();

                            widgetObj.css("left", wChildLeft + "px");
                            widgetObj.css("top", wChildTop + "px");
                            widgetObj.draw(self.$element.parent());

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
                        if (m && m.length == 2) left = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.childWidgets[0].css("left") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) firstChildLeft = Math.floor(parseFloat(m[1]) * 100) / 100;

                        if (firstChildLeft != undefined) {
                            self.childWidgets.forEach(function (w) {
                                var childWidth,
                                    m = (w.css("width") || "").match(/([-\d\.]+)px$/);
                                if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;
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
                        if (m && m.length == 2) left = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.css("width") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) width = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.childWidgets[0].css("left") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) firstChildLeft = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.childWidgets[0].css("width") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) firstChildWidth = Math.floor(parseFloat(m[1]) * 100) / 100;

                        if (firstChildLeft != undefined && firstChildWidth) {
                            self.childWidgets.forEach(function (w) {
                                var childWidth,
                                    m = (w.css("width") || "").match(/([-\d\.]+)px$/);
                                if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;
                                if (childWidth > maxChildWidth) maxChildWidth = childWidth;
                            });

                            if (maxChildWidth) {
                                self.css("left", (left + firstChildLeft) + "px");
                                self.css("width", maxChildWidth + "px");

                                self.childWidgets.forEach(function (w) {
                                    var childWidth,
                                        m = (w.css("width") || "").match(/([-\d\.]+)px$/);
                                    if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;

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
                        if (m && m.length == 2) left = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.css("width") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) width = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.childWidgets[0].css("left") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) firstChildLeft = Math.floor(parseFloat(m[1]) * 100) / 100;

                        m = (self.childWidgets[0].css("width") || "").match(/([-\d\.]+)px$/);
                        if (m && m.length == 2) firstChildWidth = Math.floor(parseFloat(m[1]) * 100) / 100;

                        if (firstChildLeft != undefined && firstChildWidth) {
                            self.childWidgets.forEach(function (w) {
                                var childWidth,
                                    m = (w.css("width") || "").match(/([-\d\.]+)px$/);
                                if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;
                                if (childWidth > maxChildWidth) maxChildWidth = childWidth;
                            });

                            if (maxChildWidth) {
                                self.css("left", (left + firstChildLeft + firstChildWidth - maxChildWidth ) + "px");
                                self.css("width", maxChildWidth + "px");

                                self.childWidgets.forEach(function (w) {
                                    var childWidth,
                                        m = (w.css("width") || "").match(/([-\d\.]+)px$/);
                                    if (m && m.length == 2) childWidth = Math.floor(parseFloat(m[1]) * 100) / 100;

                                    if (childWidth) {
                                        w.css("left", (maxChildWidth - childWidth) + "px");
                                    }
                                });
                            }
                        }
                    }
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
                        scale = Math.floor(scale * 100) / 100;

                        var scaleStyleObj = $inject.uiUtilService.prefixedStyle("transform", "scale({0}, {1})", scale, scale);
                        self.$element.css(scaleStyleObj);

                        var pageLeft = $page.offset().left, pageTop = $page.offset().top;
                        pageLeft = Math.floor(pageLeft * 100) / 100, pageTop = Math.floor(pageTop * 100) / 100;
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
                }
            }),
            PageSketchWidgetClass = Class(BaseSketchWidgetClass, {
                CLASS_NAME: "PageSketchWidget",
                MEMBERS: {},
                initialize: function (id) {
                    this.initialize.prototype.__proto__.initialize.apply(this, [id]);
                    var MEMBERS = arguments.callee.prototype.MEMBERS;

                    for (var member in MEMBERS) {
                        this[member] = _.clone(MEMBERS[member]);
                    }

                    this.resizable = false;
                },
                toJSON: function () {
                    var jsonObj = this.initialize.prototype.__proto__.toJSON.apply(this);
                    _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]));

                    return jsonObj;
                },
                fromObject: function (obj) {
                    var ret = new PageSketchWidgetClass(obj.id);

                    PageSketchWidgetClass.prototype.__proto__.fromObject.apply(ret, [obj]);

                    return ret;
                },
                isKindOf: function (className) {
                    var self = this;

                    return PageSketchWidgetClass.prototype.CLASS_NAME == className || self.initialize.prototype.__proto__.isKindOf.apply(self, [className]);
                }
            });

        Service.prototype.createWidget = function (containerElement, widgetObj) {
            var self = this;

            widgetObj = widgetObj || new ElementSketchWidgetClass();
            widgetObj.attr["ui-draggable"] = "";
            widgetObj.attr["ui-draggable-opts"] = "{threshold: 5, pointers: 0}";
            widgetObj.attr["ui-sketch-widget"] = "";
            widgetObj.attr["is-playing"] = "sketchWidgetSetting.isPlaying";
            widgetObj.attr["sketch-object"] = "sketchObject";
            widgetObj.draw(containerElement);

            var scope = angular.element(containerElement).scope();
            $inject.$compile(containerElement)(scope);

            return widgetObj;
        }

        Service.prototype.copyWidget = function (widgetObj, holderElement) {
            var self = this,
                cloneObj = widgetObj.clone();

            cloneObj.removeClass("pickedWidget");
            cloneObj.draw(holderElement);

            var scope = angular.element(cloneObj.$element.parent()).scope();
            $inject.$compile(cloneObj.$element.parent())(scope);

            return cloneObj;
        }

        Service.prototype.createComposite = function (widgetObjs) {
            if (widgetObjs && widgetObjs.length) {
                var containerId = null,
                    containerElement = null;
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
                    var self = this,
                        compositeObj = new ElementSketchWidgetClass(widgetArr);
                    compositeObj.attr["ui-draggable"] = "";
                    compositeObj.attr["ui-draggable-opts"] = "{threshold: 5, pointers: 0}";
                    compositeObj.attr["ui-sketch-widget"] = "";
                    compositeObj.attr["is-playing"] = "sketchWidgetSetting.isPlaying";
                    compositeObj.attr["sketch-object"] = "sketchObject";
                    compositeObj.draw(containerElement);

                    var scope = angular.element(compositeObj.$element.parent()).scope();
                    $inject.$compile(compositeObj.$element.parent())(scope);

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
            pageObj.draw(holderElement);

            var scope = angular.element(holderElement).scope();
            $inject.$compile(holderElement)(scope);

            return pageObj;
        }

        Service.prototype.copyPage = function (pageObj, holderElement) {
            var self = this,
                cloneObj = pageObj.clone();

            cloneObj.removeClass("pickedWidget");
            cloneObj.draw(holderElement);

            var scope = angular.element(cloneObj.$element.parent()).scope();
            $inject.$compile(cloneObj.$element.parent())(scope);

            return cloneObj;
        }

        Service.prototype.fromObject = function (obj) {
            var className = obj.CLASS_NAME,
                classes = ["PageSketchWidgetClass", "ElementSketchWidgetClass", "StyleManager", "State", "Transition", "GestureTrigger", "AnimationTransitionAction"],
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

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('uiService', Service);
                }]);
        };
    }
);