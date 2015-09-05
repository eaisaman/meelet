var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    config = require('./config');

_.string = require('underscore.string');

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
    }, Classes = function () {
    }, c = new Classes(),
    angularConstants = {
        widgetClasses: {
            containerClass: "sketchHolder",
            deviceHolderClass: "deviceHolder",
            holderClass: "pageHolder",
            widgetClass: "sketchWidget",
            hoverClass: "widgetHover",
            activeClass: "pickedWidget",
            widgetContainerClass: "widgetContainer",
            widgetIncludeAnchorClass: "widgetIncludeAnchor"
        },
        anchorAttr: "widget-anchor",
        targetAnchorAttr: "target-anchor",
        repoWidgetClass: "ui-widget"
    };

Classes.prototype.snakeCase = function (name, separator) {
    return name.replace(/[A-Z]/g, function (letter, pos) {
        return (pos ? separator : '') + letter.toLowerCase();
    });
}

var State = Class({
        CLASS_NAME: "State",
        MEMBERS: {
            id: "",
            context: null,
            node: null,
            name: null,
            transitions: [],
            actionObj: null
        },
        initialize: function (node, name, context, id, actionObj) {
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }

            this.actionObj = actionObj || new SequenceTransitionAction();

            if (typeof node === "string") {
                this.node = node;
            } else {
                this.widgetObj = node;
                this.node = node.id;
                this.actionObj.setWidget(node);
            }
            this.context = context;
            this.name = name;
            this.id = id || "State_" + _.now();
        },
        fromObject: function (obj, context) {
            var ret = new State(obj.node, obj.name, obj.context, obj.id);

            if (obj.actionObj) {
                var classes = ["SequenceTransitionAction"],
                    className = obj.actionObj.CLASS_NAME,
                    actionObj;

                classes.every(function (clazz) {
                    if (eval(_.string.sprintf("className === %s.prototype.CLASS_NAME", clazz))) {
                        actionObj = eval(_.string.sprintf("%s.prototype.fromObject(obj.actionObj, context)", clazz));
                        return false;
                    }

                    return true;
                });
                ret.actionObj = actionObj;
            }

            obj.transitions && obj.transitions.forEach(function (t) {
                var transition = Transition.prototype.fromObject(t, context);
                transition.state = ret;
                ret.transitions.push(transition);
            });

            return ret;
        }
    }), Transition = Class({
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
                this[member] = _.clone(MEMBERS[member]);
            }

            this.name = name;
            this.state = state;
            this.id = id || "Transition_" + _.now();
            this.actionObj = new SequenceTransitionAction();

            if (state != null && typeof state === "object") {
                this.actionObj.setWidget(state.widgetObj);
            }
        },
        clone: function () {
            var cloneObj = new Transition(this.name, this.state);
            cloneObj.actionObj = this.actionObj.clone();

            return cloneObj;
        },
        fromObject: function (obj, context) {
            var ret = new Transition(obj.name, null, obj.id);

            if (obj.trigger) {
                ret.setTrigger(obj.trigger.id, obj.trigger.triggerType, obj.trigger.eventName, obj.trigger.options);
                ret[obj.trigger.triggerType.charAt(0).toLowerCase() + obj.trigger.triggerType.substr(1) + "EventName"] = obj.trigger.id;
            }

            if (obj.actionObj) {
                var classes = ["SequenceTransitionAction"],
                    className = obj.actionObj.CLASS_NAME,
                    actionObj;

                classes.every(function (clazz) {
                    if (eval(_.string.sprintf("className === %s.prototype.CLASS_NAME", clazz))) {
                        actionObj = eval(_.string.sprintf("%s.prototype.fromObject(obj.actionObj, context)", clazz));
                        return false;
                    }

                    return true;
                });
                ret.actionObj = actionObj;
            }

            return ret;
        },
        setTrigger: function (id, triggerType, eventName, options) {
            if (triggerType === "Gesture") {
                if (eventName) {
                    this.trigger = new GestureTrigger(id, eventName, options);
                }
            }
        }
    }), BaseTransitionAction = Class({
        CLASS_NAME: "BaseTransitionAction",
        MEMBERS: {
            id: "",
            actionType: "",
            widgetObj: null
        },
        initialize: function (widgetObj, actionType, id) {
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }

            this.widgetObj = widgetObj;
            this.actionType = actionType;
            this.id = id || "TransitionAction_" + _.now();
        },
        toJSON: function () {
            return _.extend(_.pick(this, ["id", "actionType"]), {
                widgetObj: this.widgetObj.id
            });
        },
        fromObject: function (obj, context) {
            var self = this;

            BaseSketchWidgetClass.prototype.matchReference(obj.widgetObj, function (result) {
                self.setWidget(result);
            });
        },
        setWidget: function (widgetObj) {
            this.widgetObj = widgetObj;
        }
    }), SequenceTransitionAction = Class(BaseTransitionAction, {
        CLASS_NAME: "SequenceTransitionAction",
        MEMBERS: {
            childActions: [],
            stopOnEach: false
        },
        initialize: function (widgetObj, id) {
            this.initialize.prototype.__proto__.initialize.apply(this, [widgetObj, "Sequence", id]);
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }
        },
        toJSON: function () {
            var jsonObj = SequenceTransitionAction.prototype.__proto__.toJSON.apply(this);
            var childActions = [];
            this.childActions.forEach(function (childAction) {
                childActions.push(childAction.toJSON());
            });
            _.extend(jsonObj, {stopOnEach: this.stopOnEach, childActions: childActions});

            return jsonObj;
        },
        fromObject: function (obj, context) {
            var ret = new SequenceTransitionAction(null, obj.id);
            ret.stopOnEach = obj.stopOnEach || false;

            SequenceTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj, context]);

            var classes = ["EffectTransitionAction", "StateTransitionAction", "ConfigurationTransitionAction", "MovementTransitionAction", "SoundTransitionAction"];
            obj.childActions && obj.childActions.forEach(function (action) {
                var className = action.CLASS_NAME,
                    actionObj;

                classes.every(function (clazz) {
                    if (eval(_.string.sprintf("className === %s.prototype.CLASS_NAME", clazz))) {
                        actionObj = eval(_.string.sprintf("%s.prototype.fromObject(action, context)", clazz));
                        ret.childActions.push(actionObj);
                        return false;
                    }

                    return true;
                });
            });

            return ret;
        },
        isEmpty: function () {
            return !this.childActions.length;
        }
    }), EffectTransitionAction = Class(BaseTransitionAction, {
        CLASS_NAME: "EffectTransitionAction",
        MEMBERS: {
            artifactSpec: {},
            effect: {}
        },
        initialize: function (widgetObj, artifactSpec, effect, id) {
            this.initialize.prototype.__proto__.initialize.apply(this, [widgetObj, "Effect", id]);
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }
            this.artifactSpec = artifactSpec || this.artifactSpec;
            this.effect = effect || this.effect;
        },
        toJSON: function () {
            var jsonObj = EffectTransitionAction.prototype.__proto__.toJSON.apply(this);
            _.extend(jsonObj, _.pick(this, ["artifactSpec", "effect"]));

            return jsonObj;
        },
        fromObject: function (obj, context) {
            var ret = new EffectTransitionAction(null, obj.artifactSpec, obj.effect, obj.id);

            EffectTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj, context]);

            //Add effect artifact to global artifactList.
            var artifactList = context.artifactList;
            artifactList.every(function (artifact) {
                return artifact.artifactId !== ret.artifactSpec.artifactId;
            }) && artifactList.push({
                type: ret.artifactSpec.type,
                libraryName: ret.artifactSpec.libraryName,
                artifactId: ret.artifactSpec.artifactId,
                version: ret.artifactSpec.version
            });

            return ret;
        }
    }), StateTransitionAction = Class(BaseTransitionAction, {
        CLASS_NAME: "StateTransitionAction",
        MEMBERS: {
            newState: ""
        },
        initialize: function (widgetObj, newState, id) {
            this.initialize.prototype.__proto__.initialize.apply(this, [widgetObj, "State", id]);
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }
            this.newState = newState || this.newState;
        },
        toJSON: function () {
            var jsonObj = StateTransitionAction.prototype.__proto__.toJSON.apply(this);
            _.extend(jsonObj, _.pick(this, ["newState"]));

            return jsonObj;
        },
        fromObject: function (obj, context) {
            var ret = new StateTransitionAction(null, obj.newState, obj.id);

            StateTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj, context]);

            return ret;
        }
    }), ConfigurationTransitionAction = Class(BaseTransitionAction, {
        CLASS_NAME: "ConfigurationTransitionAction",
        MEMBERS: {
            configuration: []
        },
        initialize: function (widgetObj, configuration, id) {
            this.initialize.prototype.__proto__.initialize.apply(this, [widgetObj, "Configuration", id]);
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }
            if (configuration) {
                this.configuration = configuration;
            } else if (widgetObj && widgetObj.widgetSpec) {
                this.setWidget(widgetObj);
            }
        },
        toJSON: function () {
            var jsonObj = ConfigurationTransitionAction.prototype.__proto__.toJSON.apply(this);

            var arr = [];
            this.configuration.forEach(function (configurationItem) {
                if (configurationItem.pickedValue) {
                    arr.push(_.pick(configurationItem, ["key", "pickedValue", "type"]));
                }
            });

            _.extend(jsonObj, {configuration: arr});

            return jsonObj;
        },
        fromObject: function (obj, context) {
            var ret = new ConfigurationTransitionAction(null, obj.configuration, obj.id);

            ConfigurationTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj, context]);

            return ret;
        },
        getConfigurationItem: function (key) {
            var self = this,
                result = null;

            self.configuration && self.configuration.every(function (configurationItem) {
                if (configurationItem.key === key) {
                    result = configurationItem;
                    return false;
                }

                return true;
            });

            return result;
        }
    }), MovementTransitionAction = Class(BaseTransitionAction, {
        CLASS_NAME: "MovementTransitionAction",
        MEMBERS: {
            routeIndex: null,
            settings: []
        },
        initialize: function (widgetObj, id) {
            this.initialize.prototype.__proto__.initialize.apply(this, [widgetObj, "Movement", id]);
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }
        },
        toJSON: function () {
            var jsonObj = MovementTransitionAction.prototype.__proto__.toJSON.apply(this);

            _.extend(jsonObj, _.pick(this, ["CLASS_NAME", "routeIndex", "settings"]));

            return jsonObj;
        },
        fromObject: function (obj, context) {
            var ret = new MovementTransitionAction(null, obj.id);
            ret.routeIndex = obj.routeIndex;
            _.each(obj.settings, function (s) {
                ret.settings.push(_.clone(s));
            });

            MovementTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj, context]);

            return ret;
        }
    }), SoundTransitionAction = Class(BaseTransitionAction, {
        CLASS_NAME: "SoundTransitionAction",
        MEMBERS: {
            resourceName: ""
        },
        initialize: function (widgetObj, id) {
            this.initialize.prototype.__proto__.initialize.apply(this, [widgetObj, "Sound", id]);
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }
        },
        toJSON: function () {
            var jsonObj = SoundTransitionAction.prototype.__proto__.toJSON.apply(this);

            _.extend(jsonObj, _.pick(this, ["CLASS_NAME", "resourceName"]));

            return jsonObj;
        },
        fromObject: function (obj, context) {
            var ret = new SoundTransitionAction(null, obj.id);
            ret.resourceName = obj.resourceName;

            SoundTransitionAction.prototype.__proto__.fromObject.apply(ret, [obj, context]);

            return ret;
        }
    }), BaseTrigger = Class({
        CLASS_NAME: "BaseTrigger",
        MEMBERS: {
            id: "",
            triggerType: "",
            eventName: "",
            options: null,
            widgetObj: null
        },
        initialize: function (id, triggerType, eventName, options) {
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }

            this.id = id;
            this.triggerType = triggerType;
            this.eventName = eventName;
            this.options = options;
        },
        fromObject: function (obj, context) {
        }
    }), GestureTrigger = Class(BaseTrigger, {
        CLASS_NAME: "GestureTrigger",
        MEMBERS: {},
        initialize: function (id, eventName, options, callback) {
            this.initialize.prototype.__proto__.initialize.apply(this, [id, "Gesture", eventName, _.clone(options)]);
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }

            this.callback = callback;
        },
        fromObject: function (obj, context) {
            var ret = new GestureTrigger(obj.id, obj.eventName, obj.options);

            GestureTrigger.prototype.__proto__.fromObject.apply(ret, [obj, context]);

            return ret;
        }
    }), StyleManager = Class({
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
                this[member] = _.clone(MEMBERS[member]);
            }

            this.widgetObj = widgetObj;
        },
        fromObject: function (obj, context) {
            var ret = new StyleManager();
            ret.stateMaps = obj.stateMaps;
            ret.omniClasses = obj.omniClasses;

            return ret;
        },
        insertClass: function () {
            var $element = this.widgetObj && this.widgetObj.$element;

            if ($element) {
                $element.addClass(this.omniClasses.join(" "));
            }
        },
        writeScss: function (out, stateContext) {
            var self = this,
                stateMap = self.stateMaps[stateContext];

            out.write(_.string.sprintf("#%s {", self.widgetObj.id));
            _.each(stateMap, function (stateValue, key) {
                if (key === "*")
                    out.write("& {");
                else
                    out.write(_.string.sprintf("&[state='%s'] {", key));

                _.isEmpty(stateValue.style) || _.each(stateValue.style, function (styleValue, styleName) {
                    self.compossScssStyle(styleValue, styleName, out);
                });

                if (!_.isEmpty(stateValue.beforeStyle)) {
                    out.write("&:before {");
                    _.each(stateValue.beforeStyle, function (styleValue, styleName) {
                        self.compossScssStyle(styleValue, styleName, out);
                    });
                    out.write("}");
                }

                if (!_.isEmpty(stateValue.afterStyle)) {
                    out.write("&:after {");
                    _.each(stateValue.afterStyle, function (styleValue, styleName) {
                        self.compossScssStyle(styleValue, styleName, out);
                    });
                    out.write("}");
                }

                if (self.widgetObj.childWidgets && self.widgetObj.childWidgets.length) {
                    var value;
                    self.widgetObj.states.every(function (s) {
                        if ((s.context.node == "?" || s.context.id === stateContext) && s.name === key) {
                            value = s.id;
                            return false;
                        }

                        return true;
                    })

                    value && self.widgetObj.childWidgets.forEach(function (child) {
                        child.writeScss(out, value);
                    });
                }

                out.write("}");
            });

            out.write("}");
        },
        compossScssStyle: function (styleValue, styleName, out) {
            var self = this;

            if (styleName === "transform") {
                var arr;

                if (styleValue != null) {
                    if (toString.call(styleValue) === '[object Object]')
                        arr = [styleValue]
                    else if (toString.call(styleValue) === '[object Array]')
                        arr = styleValue;
                }

                var transformArr = [];
                arr && arr.forEach(function (t) {
                    if (t.name && t.value) {
                        transformArr.push(_.string.sprintf("%s(%s)", t.name, t.value));
                    }
                });
                if (transformArr.length) {
                    out.write(_.string.sprintf("@include transform(%s);", transformArr.join(" ")));
                }

            } else if (styleName === "transform-origin") {
                if (styleValue != null) {
                    out.write(_.string.sprintf("@include transform-origin(%s);", styleValue));
                }
            } else if (styleName === "box-shadow") {
                var arr = [];
                if (styleValue != null) {
                    if (toString.call(styleValue) === '[object Array]') {
                        styleValue.forEach(function (item) {
                            var str = _.string.trim(_.string.sprintf("%s %s %s %s %s %s", item["h-shadow"] || "", item["v-shadow"] || "", item["blur"] || "", item["spread"] || "", item["inset"] || "", self.rgba(item.color) || ""))
                            str && arr.push(str);
                        });
                    }
                }

                arr.length && out.write(_.string.sprintf("@include box-shadow(%s);", arr.join(",")));
            } else if (styleName === "text-shadow") {
                var arr = [];
                if (styleValue != null) {
                    if (toString.call(styleValue) === '[object Array]') {
                        styleValue.forEach(function (item) {
                            var str = _.string.trim(_.string.sprintf("%s %s %s %s", item["h-shadow"] || "", item["v-shadow"] || "", item["blur"] || "", self.rgba(item.color) || ""))
                            str && arr.push(str);
                        });
                    }
                }
                arr.length && out.write(_.string.sprintf("@include text-shadow(%s);", arr.join(",")));
            } else if (styleName === "background-image") {
                if (styleValue) {
                    if (styleValue.match(/^https?:\/\//)) {
                        //External hyperlink
                        out.write(_.string.sprintf("background-image: url(%s);", styleValue));
                    } else {
                        var m = styleValue.match(/resource\/image\/.+$/);

                        if (m) {
                            out.write(_.string.sprintf("background-image: url(../%s);", m[0]));
                        }
                    }
                } else {
                    out.write("background-image: '';");
                }
            } else if (styleName === "linearGradientColor") {
                if (styleValue && styleValue.colorStopList && styleValue.colorStopList.length) {
                    if (styleValue.colorStopList.length > 1) {
                        var stops = [];
                        styleValue.colorStopList.forEach(function (colorStop) {
                            stops.push(_.string.sprintf("%s %d%%", self.rgba(colorStop.color), colorStop.percent));
                        });

                        out.write(_.string.sprintf("@include background(linear-gradient(%sdeg, %s));", styleValue.angle, stops.join(",")));
                    } else {
                        out.write(_.string.sprintf("background: %s;", self.rgba(styleValue.colorStopList[0].color) || ""));
                    }
                }
            } else if (styleName === "background-position") {
                if (styleValue && !_.isEmpty(styleValue)) {
                    out.write(_.string.sprintf("background-position: %s %s;", styleValue.x, styleValue.y));
                }
            } else if (styleName === "color" || styleName === "border-color") {
                if (styleValue && !_.isEmpty(styleValue)) {
                    out.write(_.string.sprintf("%s: %s;", styleName, self.rgba(styleValue)));
                }
            } else {
                if (styleValue == null)
                    styleValue = "";
                out.write(_.string.sprintf("%s: %s;", styleName, styleValue));
            }
        },
        rgba: function (hex, alpha) {
            var rgb;

            if (typeof hex === "string") {
                rgb = this.hexTorgb(hex);
                alpha = 1;
            } else {
                if (hex.rValue != null && hex.gValue != null && hex.bValue != null) {
                    rgb = [hex.rValue, hex.gValue, hex.bValue];
                } else {
                    rgb = this.hexTorgb(hex.color);
                }
                if (alpha == null)
                    alpha = hex.alpha;
                alpha = Math.round(alpha * 100) / 100;
                hex = hex.color;
            }

            if (alpha == 1)
                return hex;
            else
                return _.string.sprintf("rgba(%d, %d, %d, %.2f)", rgb[0], rgb[1], rgb[2], alpha);
        },
        hexTorgb: function (hex) {
            hex = hex.replace(/#/, '');
            if (hex.length == 3)
                hex = hex + hex;
            var rgbval = parseInt(hex, 16),
                r = rgbval >> 16,
                g = (rgbval & 65280) >> 8,
                b = rgbval & 255;
            return [r, g, b];
        }
    }), BaseSketchWidgetClass = Class({
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
                this[member] = _.clone(MEMBERS[member]);
            }
            this.id = id || ("Widget_" + _.now());
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
                    callback(value.item);
                });
                value.callbacks.splice(0, value.callbacks.length);
            }
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
        fromObject: function (obj, context) {
            var self = this;

            self.anchor = obj.anchor;
            self.name = obj.name;
            self.attr = _.omit(obj.attr, ["$$hashKey"]);
            self.styleManager = StyleManager.prototype.fromObject(obj.styleManager, context);
            self.styleManager.widgetObj = self;
            obj.stateOptions.forEach(function (stateOption) {
                self.stateOptions.push(_.omit(stateOption, ["$$hashKey"]));
            });

            self.states.splice(0, self.states.length);
            var stateMap = {};
            obj.states.forEach(function (s) {
                var state = State.prototype.fromObject(s, context);
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

            var classes = ["ElementSketchWidgetClass", "RepoSketchWidgetClass"];
            obj.childWidgets.forEach(function (c) {
                var className = c.CLASS_NAME,
                    childWidget;

                classes.every(function (clazz) {
                    if (eval(_.string.sprintf("className === %s.prototype.CLASS_NAME", clazz))) {
                        childWidget = eval(_.string.sprintf("%s.prototype.fromObject(c, context)", clazz));
                        childWidget.stateContext = stateMap[c.stateContext];
                        return false;
                    }

                    return true;
                });
                if (childWidget) {
                    childWidget.states.forEach(function (s) {
                        if (typeof s.context === "string")
                            s.context = stateMap[s.context];
                    });
                    self.childWidgets.push(childWidget);
                }
            });
        },

        appendTo: function ($, $document, $container, $template, $ngTemplate) {
            var self = this;

            self.$element = $("<div />").attr("id", self.id);
            self.$element.attr(_.omit(self.attr, ["ui-sketch-widget", "scale", "ng-class", "sketch-object"]));
            self.$element.attr("state", self.state.name);
            self.styleManager.insertClass();

            if (self.anchor) {
                var $anchor = $template.find(_.string.sprintf("[%s='%s']", angularConstants.anchorAttr, self.anchor));
                if (!$anchor.length) {
                    $anchor = $ngTemplate.find(_.string.sprintf("[%s='%s']", angularConstants.targetAnchorAttr, self.anchor));
                    if (!$anchor.length) {
                        ($anchor = $("<div />").attr(angularConstants.targetAnchorAttr, self.anchor)).appendTo($ngTemplate);
                    }
                }

                self.$element.appendTo($anchor);
            } else {
                self.$element.appendTo($container);
            }

            //Object 'eventMap' used to map widget's id to its event handling settings.
            self.eventMap = {
                widgetId: self.id,
                transition: {},
                stateAction: {},
                offspring: {},
                states: []
            }

            self.states && self.states.forEach(function (state) {
                self.eventMap.states.push(_.extend(_.pick(state, ["id", "name"]), {context: state.context && state.context.id || ""}));
            });

            var transitionMap = self.eventMap.transition,
                stateActionMap = self.eventMap.stateAction;
            self.states.forEach(function (state) {
                state.transitions && state.transitions.forEach(function (transition) {
                    if (transition.trigger && transition.actionObj) {
                        var stateTransition = (transitionMap[transition.state.id] = transitionMap[transition.state.id] || {});
                        var triggerMap = (stateTransition[transition.trigger.triggerType] = stateTransition[transition.trigger.triggerType] || {});

                        var transitionConfig = {};
                        transitionConfig.state = transition.state.name;
                        transitionConfig.actionObj = transition.actionObj.toJSON();

                        triggerMap[transition.trigger.eventName] = triggerMap[transition.trigger.eventName] || _.pick(transition.trigger, ["triggerType", "eventName", "options"]);
                        (triggerMap[transition.trigger.eventName].actions = triggerMap[transition.trigger.eventName].actions || []).push(transitionConfig);
                    }
                });

                if (state.actionObj && !state.actionObj.isEmpty()) {
                    stateActionMap[state.id] = state.actionObj.toJSON();
                }
            });

        },
        writeScss: function (out, stateContext) {
            return this.styleManager.writeScss(out, stateContext || "?");
        }
    }), ElementSketchWidgetClass = Class(BaseSketchWidgetClass, {
        CLASS_NAME: "ElementSketchWidget",
        MEMBERS: {
            isElement: true,
            html: "",
            markdown: "",
            routes: []
        },
        initialize: function (id, widgetsArr) {
            this.initialize.prototype.__proto__.initialize.apply(this, [id]);
            var self = this,
                MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }
        },
        fromObject: function (obj, context) {
            var ret = new ElementSketchWidgetClass(obj.id);

            ElementSketchWidgetClass.prototype.__proto__.fromObject.apply(ret, [obj, context]);
            ret.context = context;

            ret.html = obj.html;
            ret.markdown = obj.markdown;
            ret.routes = obj.routes || [];

            return ret;
        },
        appendTo: function ($, $document, $container, $template, $ngTemplate) {
            ElementSketchWidgetClass.prototype.__proto__.appendTo.apply(this, [$, $document, $container, $template, $ngTemplate]);

            var self = this,
                transition = self.eventMap.transition,
                stateAction = self.eventMap.stateAction,
                offspring = self.eventMap.offspring,
                initMap = self.context.initMap,
                attributeMap = initMap[self.id] || {};

            initMap[self.id] = attributeMap;

            //FIXME Check route feature on generated html
            attributeMap.routes = JSON.stringify(self.routes);

            if (self.html) {
                var $textNode = $("<div />").addClass("widgetText markdown-body editormd-preview-container").prependTo(self.$element);
                $textNode.html(self.html);
            }

            self.childWidgets && self.childWidgets.forEach(function (child) {
                child.appendTo($, $document, self.$element);

                if (child.eventMap) {
                    self.states.forEach(function (state) {
                        //Filter child states
                        var childStates = _.where(child.eventMap.states, {context: state.id}),
                            childMap = {};
                        childStates.forEach(function (childState) {
                            //Fetch child transition and stateAction settings on the state
                            var transition = child.eventMap.transition[childState.id] || {},
                                stateAction = child.eventMap.stateAction[childState.id] || {};
                            if (!_.isEmpty(transition) || !_.isEmpty(stateAction)) {
                                childMap[childState.name] = {
                                    transition: transition,
                                    stateAction: stateAction
                                }
                            }

                            var childOffspring = child.eventMap.offspring[childState.id];
                            if (!_.isEmpty(childOffspring)) {
                                (childMap[childState.name] = childMap[childState.name] || {}).offspring = childOffspring;
                            }
                        });

                        if (!_.isEmpty(childMap)) {
                            (offspring[state.id] = offspring[state.id] || {})[child.id] = childMap;
                            childMap._context = state.id;
                        }
                    });
                }
            });
        }
    }), IncludeSketchWidgetClass = Class(BaseSketchWidgetClass, {
        CLASS_NAME: "IncludeSketchWidget",
        MEMBERS: {
            template: ""
        },
        initialize: function (id, template) {
            arguments.callee.prototype.__proto__.initialize.apply(this, [id]);
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }

            this.template = template;
        },
        fromObject: function (obj, context) {
            var self = this;

            self.template = obj.template;

            IncludeSketchWidgetClass.prototype.__proto__.fromObject.apply(self, [obj, context]);

            return self;
        }
    }), RepoSketchWidgetClass = Class(IncludeSketchWidgetClass, {
        CLASS_NAME: "RepoSketchWidget",
        MEMBERS: {
            widgetSpec: null,
            project: null
        },
        initialize: function (id, widgetSpec) {
            arguments.callee.prototype.__proto__.initialize.apply(this, [id, widgetSpec && widgetSpec.template || ""]);
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }

            this.resizable = false;
            this.widgetSpec = widgetSpec;
        },
        fromObject: function (obj, context) {
            var ret = new RepoSketchWidgetClass(obj.id, obj.widgetSpec);

            RepoSketchWidgetClass.prototype.__proto__.fromObject.apply(ret, [obj, context]);
            ret.context = context;

            return ret;
        },
        getConfiguration: function (key) {
            var self = this,
                config = self.widgetSpec.configuration[key] || self.widgetSpec.configuration.handDownConfiguration[key];

            if (config.type === "boundWriteList") {
                config.pickedValue = config.pickedValue || [];
            }

            return config.pickedValue != null ? config.pickedValue : config.defaultValue;
        },
        appendTo: function ($, $document, $container, $template, $ngTemplate) {
            RepoSketchWidgetClass.prototype.__proto__.appendTo.apply(this, [$, $document, $container, $template, $ngTemplate]);

            var self = this,
                offspring = self.eventMap.offspring,
                artifactList = self.context.artifactList,
                initMap = self.context.initMap,
                configurationMap = initMap[self.id] || {};

            self.$element.addClass(angularConstants.widgetClasses.widgetIncludeAnchorClass);
            initMap[self.id] = configurationMap;

            //Array 'artifactList' used to retrieve artifact modules when generating html files.
            artifactList.every(function (artifact) {
                return artifact.artifactId !== self.widgetSpec.artifactId;
            }) && artifactList.push({
                type: self.widgetSpec.type,
                libraryName: self.widgetSpec.libraryName,
                artifactId: self.widgetSpec.artifactId,
                version: self.widgetSpec.version
            });

            self.$ngTemplate = $("<script type='text/ng-template' />").attr("id", "Template_" + self.id).appendTo($document);

            //template
            var artifactPath = path.join(config.userFile.repoFolder, self.widgetSpec.type, self.widgetSpec.libraryName, self.widgetSpec.artifactId, self.widgetSpec.version);
            var templateStr = config.cache.get(artifactPath) || fs.readFileSync(path.join(artifactPath, "app", "widget.html"), "utf8");
            config.cache.set(artifactPath, templateStr);
            self.$template = $(templateStr).appendTo(self.$element);
            self.$template.removeAttr("ui-sketch-widget").removeAttr("scale").removeAttr("ng-class").removeAttr("sketch-object");

            //widget container
            var containerWidget = self.childWidgets[0],
                $widgetContainer = self.$template;

            $widgetContainer.attr("id", containerWidget.id);
            containerWidget.$element = $widgetContainer;
            containerWidget.$element.attr(_.omit(containerWidget.attr, ["ui-sketch-widget", "scale", "ng-class", "sketch-object"]));
            containerWidget.$element.attr("state", containerWidget.state.name);
            containerWidget.styleManager.insertClass();

            containerWidget.childWidgets && containerWidget.childWidgets.forEach(function (child) {
                child.appendTo($, $document, $widgetContainer, self.$template, self.$ngTemplate);

                if (child.eventMap) {
                    containerWidget.states.forEach(function (state) {
                        //Filter child states
                        var childStates = _.where(child.eventMap.states, {context: state.id}),
                            childMap = {};
                        childStates.forEach(function (childState) {
                            //Fetch child transition and stateAction settings on the state
                            var transition = child.eventMap.transition[childState.id] || {},
                                stateAction = child.eventMap.stateAction[childState.id] || {};
                            if (!_.isEmpty(transition) || !_.isEmpty(stateAction)) {
                                childMap[childState.name] = {
                                    transition: transition,
                                    stateAction: stateAction
                                }
                            }

                            var childOffspring = child.eventMap.offspring[childState.id];
                            if (!_.isEmpty(childOffspring)) {
                                (childMap[childState.name] = childMap[childState.name] || {}).offspring = childOffspring;
                            }
                        });

                        if (!_.isEmpty(childMap)) {
                            if (offspring[state.context.id] == null) {
                                offspring[state.context.id] = {};
                                offspring[state.context.id][containerWidget.id] = {};
                            }
                            offspring[state.context.id][containerWidget.id]._context = state.context.id;
                            if (offspring[state.context.id][containerWidget.id][state.name] == null) {
                                offspring[state.context.id][containerWidget.id][state.name] = {};
                            }
                            if (offspring[state.context.id][containerWidget.id][state.name].offspring == null) {
                                offspring[state.context.id][containerWidget.id][state.name].offspring = {}
                            }
                            var containerOffSpring = offspring[state.context.id][containerWidget.id][state.name].offspring;
                            containerOffSpring[child.id] = childMap;
                            childMap._context = state.id;
                        }
                    });
                }
            });

            //widget configuration
            var $uiWidget = self.$template.find("." + angularConstants.repoWidgetClass);
            _.each(_.omit(self.widgetSpec.configuration, "state", "handDownConfiguration"), function (config, key) {
                var value = config.pickedValue;

                if (value != null) {
                    if (toString.call(value) === '[object Array]') {
                        var arr = [];
                        for (var i = 0; i < value.length; i++) {
                            var item = value[i],
                                str;

                            if (typeof item === "object") str = item.name;
                            if (typeof item === "string") str = item;
                            str = "\"" + (str || "").replace(/"/g, "\\\"") + "\"";
                            arr.push(str);
                        }
                        value = "[" + arr.join(",") + "]";
                    } else if (typeof value === "string") {
                        value = "\"" + value.replace(/"/g, "\\\"") + "\"";
                    } else {
                        value = toString.call(value);
                    }
                    var snakeKey = c.snakeCase(key, "-"),
                        initParam = _.string.sprintf("$root['%s']['%s']", self.id, snakeKey);
                    $uiWidget.attr(snakeKey, initParam);
                    configurationMap[snakeKey] = value;
                }
            });

            //Add configurable stylesheet link
            var $link = $("<link />").prependTo($document);
            $link.attr("type", "text/css").attr("rel", "stylesheet").attr("href", _.string.sprintf("stylesheets/configurable-widget-%s.css", self.id));

            if (!self.$ngTemplate.children().length) {
                self.$ngTemplate.remove();
            }
        }
    }), PageSketchWidgetClass = Class(BaseSketchWidgetClass, {
        CLASS_NAME: "PageSketchWidget",
        MEMBERS: {},
        initialize: function (id) {
            this.initialize.prototype.__proto__.initialize.apply(this, [id]);
            var MEMBERS = arguments.callee.prototype.MEMBERS;

            for (var member in MEMBERS) {
                this[member] = _.clone(MEMBERS[member]);
            }

            this.lastModified = new Date();
            this.resizable = false;
        },
        fromObject: function (obj, context) {
            //Match marshalled widget id with created widget object.
            //Some objects may marshall widget id instead of the object. In order to restore object reference, match process will be handled.
            PageSketchWidgetClass.prototype.__proto__.startMatchReference.apply(null);

            var ret = new PageSketchWidgetClass(obj.id);
            ret.lastModified = obj.lastModified;
            PageSketchWidgetClass.prototype.__proto__.fromObject.apply(ret, [obj, context]);
            ret.context = context;

            PageSketchWidgetClass.prototype.__proto__.endMatchReference.apply(null);

            return ret;
        },
        appendTo: function ($, $document, $container) {
            PageSketchWidgetClass.prototype.__proto__.appendTo.apply(this, [$, $document, $container]);

            var self = this;

            self.$element.attr("ng-controller", self.id + "_Controller");

            //Add stylesheet link
            var $link = $("<link />").prependTo($document);
            $link.attr("type", "text/css").attr("rel", "stylesheet").attr("href", _.string.sprintf("stylesheets/page-%s.css", self.id));

            //Array 'artifactList' used to retrieve artifact modules when generating html files.
            self.artifactList = self.context.artifactList;

            //Object 'initMap' used to map widget's id to its configuration.
            self.initMap = self.context.initMap;

            var offspring = self.eventMap.offspring;

            self.childWidgets && self.childWidgets.forEach(function (child) {
                child.appendTo($, $document, self.$element);

                if (child.eventMap) {
                    self.states.forEach(function (state) {
                            //Filter child states
                            var childStates = _.where(child.eventMap.states, {context: state.id}),
                                childMap = {};
                            childStates.forEach(function (childState) {
                                //Fetch child transition and stateAction settings on the state
                                var childTransition = child.eventMap.transition[childState.id] || {},
                                    childStateAction = child.eventMap.stateAction[childState.id] || {};
                                if (!_.isEmpty(childTransition) || !_.isEmpty(childStateAction)) {
                                    childMap[childState.name] = {
                                        transition: childTransition,
                                        stateAction: childStateAction
                                    }
                                }

                                var childOffspring = child.eventMap.offspring[childState.id];
                                if (!_.isEmpty(childOffspring)) {
                                    (childMap[childState.name] = childMap[childState.name] || {}).offspring = childOffspring;
                                }
                            });

                            if (!_.isEmpty(childMap)) {
                                (offspring[state.id] = offspring[state.id] || {})[child.id] = childMap;
                                childMap._context = state.id;
                            }
                        }
                    )
                    ;
                }
            });

            //Build state tree, state name -> child widget id -> child state name -> transition, state action
            self.stateTree = {};
            _.each(offspring, function (value, stateId) {
                var state = _.findWhere(self.states, {id: stateId});

                if (self.stateTree[state.name] == null) {
                    self.stateTree[state.name] = {}
                }
                self.stateTree[state.name].offspring = value;
            });
            _.each(self.eventMap.transition, function (value, stateId) {
                var state = _.findWhere(self.states, {id: stateId});

                if (self.stateTree[state.name] == null) {
                    self.stateTree[state.name] = {}
                }
                if (!_.isEmpty(value))
                    self.stateTree[state.name].transition = value;
            });
            _.each(self.eventMap.stateAction, function (value, stateId) {
                var state = _.findWhere(self.states, {id: stateId});

                if (self.stateTree[state.name] == null) {
                    self.stateTree[state.name] = {}
                }
                if (!_.isEmpty(value))
                    self.stateTree[state.name].stateAction = value;
            });

            config.logger.debug(JSON.stringify(self.stateTree));
        }
    })
    ;

Classes.prototype.fromObject = function (obj) {
    var className = obj.CLASS_NAME,
        classes = ["PageSketchWidgetClass"],
        ret;

    classes.every(function (clazz) {
        var context = {artifactList: [], initMap: {}, configurableStylesheets: []};
        if (eval(_.string.sprintf("className === %s.prototype.CLASS_NAME", clazz))) {
            ret = eval(_.string.sprintf("%s.prototype.fromObject(obj, context)", clazz));
            return false;
        }

        return true;
    });

    return ret;
}

module.exports = c;