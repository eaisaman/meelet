define(
    ["angular-lib", "jquery-lib", "underscore-lib", "ng.ui.util", "ng.ui.service"],
    function () {
        var FEATURE = "FlowService",
            PLATFORM = "browser",
            FlowService = function ($parse, $timeout, $q, $exceptionHandler, $compile, $rootScope, angularEventTypes, angularConstants, appService, serviceRegistry, uiUtilService, uiCanvasService, uiAnimationService) {
                this.$parse = $parse;
                this.$timeout = $timeout;
                this.$q = $q;
                this.$exceptionHandler = $exceptionHandler;
                this.$compile = $compile;
                this.$rootScope = $rootScope;
                this.angularEventTypes = angularEventTypes;
                this.angularConstants = angularConstants;
                this.appService = appService;
                this.serviceRegistry = serviceRegistry;
                this.uiUtilService = uiUtilService;
                this.uiCanvasService = uiCanvasService;
                this.uiAnimationService = uiAnimationService;

                _.extend($inject, _.pick(this, FlowService.$inject));

                defineFlowClass(uiUtilService.createObjectClass(), uiUtilService.findObjectClass());
            };

        FlowService.$inject = ["$parse", "$timeout", "$q", "$exceptionHandler", "$compile", "$rootScope", "angularEventTypes", "angularConstants", "appService", "serviceRegistry", "uiUtilService", "uiCanvasService", "uiAnimationService"];
        var $inject = {};

        function defineFlowClass(Class, FindClass) {
            var FlowProject = Class(FindClass("Project"), {
                    CLASS_NAME: "FlowProject",
                    MEMBERS: {
                        flowWorks: {
                            flows: [],
                            processes: []
                        }
                    },
                    initialize: function (projectRecord) {
                        FlowProject.prototype.__proto__.initialize.apply(this, [projectRecord]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    save: function () {
                        var self = this;

                        if (self.projectRecord._id) {
                            return FlowProject.prototype.__proto__.save.apply(self).then(
                                function () {
                                    return self.saveFlow();
                                }, function (err) {
                                    return $inject.uiUtilService.getRejectDefer(err);
                                }
                            );
                        }

                        return $inject.uiUtilService.getRejectDefer(err);
                    },
                    loadFlow: function () {
                        var self = this;

                        if (self.projectRecord._id) {
                            self.flowWorks.flows.splice(0);
                            self.flowWorks.processes.splice(0);
                            return $inject.appService.loadFlow(self.projectRecord._id).then(function (flowWorks) {
                                var flows = flowWorks.flows,
                                    processes = flowWorks.processes;

                                flows && flows.forEach(function (flowObj) {
                                    var flow = FlowService.prototype.fromObject(flowObj);
                                    if (flow) {
                                        self.flowWorks.flows.push(flow);
                                    }
                                });

                                processes && processes.forEach(function (processObj) {
                                    var process = FlowService.prototype.fromObject(processObj);
                                    if (process) {
                                        self.flowWorks.processes.push(process);
                                    }
                                });

                                return $inject.uiUtilService.getResolveDefer(self);
                            }, function (err) {
                                return $inject.uiUtilService.getRejectDefer(err);
                            });
                        } else {
                            return $inject.uiUtilService.getResolveDefer(self);
                        }
                    },
                    saveFlow: function () {
                        var self = this;

                        if (self.projectRecord._id) {
                            return $inject.appService.saveFlow(self.projectRecord._id, self.flowWorks);
                        } else {
                            return $inject.uiUtilService.getResolveDefer();
                        }
                    },
                    addFlow: function (flow, beforeFlow) {
                        if (flow) {
                            var index, beforeIndex;
                            beforeFlow && this.flowWorks.flows.every(function (child, i) {
                                if (child.id === beforeFlow.id) {
                                    beforeIndex = i;
                                    return false;
                                }
                                return true;
                            });

                            if (this.flowWorks.flows.every(function (child, i) {
                                    if (child.id === flow.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (beforeIndex == null) beforeIndex = this.flowWorks.flows.length;
                                this.flowWorks.flows.splice(beforeIndex, 0, flow);
                            } else {
                                //Change existing flow position
                                if (beforeIndex != null) {
                                    if (index < beforeIndex - 1) {
                                        this.flowWorks.flows.splice(beforeIndex, 0, flow);
                                        this.flowWorks.flows.splice(index, 1);
                                    }
                                    if (index > beforeIndex) {
                                        this.flowWorks.flows.splice(beforeIndex, 0, flow);
                                        this.flowWorks.flows.splice(index + 1, 1);
                                    }
                                }
                            }
                        }
                    },
                    moveDownFlow: function (flow) {
                        if (flow) {
                            var index;
                            if (!this.flowWorks.flows.every(function (child, i) {
                                    if (child.id === flow.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index < this.flowWorks.flows.length - 1) {
                                    this.flowWorks.flows.splice(index, 1);
                                    this.flowWorks.flows.splice(index + 1, 0, flow);
                                }
                            }
                        }
                    },
                    moveUpFlow: function (flow) {
                        if (flow) {
                            var index;
                            if (!this.flowWorks.flows.every(function (child, i) {
                                    if (child.id === flow.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index > 0) {
                                    this.flowWorks.flows.splice(index, 1);
                                    this.flowWorks.flows.splice(index - 1, 0, flow);
                                }
                            }
                        }
                    },
                    addProcess: function (process, beforeProcess) {
                        if (process) {
                            var index, beforeIndex;
                            beforeProcess && this.flowWorks.processes.every(function (child, i) {
                                if (child.id === beforeProcess.id) {
                                    beforeIndex = i;
                                    return false;
                                }
                                return true;
                            });

                            if (this.flowWorks.processes.every(function (child, i) {
                                    if (child.id === process.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (beforeIndex == null) beforeIndex = this.flowWorks.processes.length;
                                this.flowWorks.processes.splice(beforeIndex, 0, process);
                            } else {
                                //Change existing process position
                                if (beforeIndex != null) {
                                    if (index < beforeIndex - 1) {
                                        this.flowWorks.processes.splice(beforeIndex, 0, process);
                                        this.flowWorks.processes.splice(index, 1);
                                    }
                                    if (index > beforeIndex) {
                                        this.flowWorks.processes.splice(beforeIndex, 0, process);
                                        this.flowWorks.processes.splice(index + 1, 1);
                                    }
                                }
                            }
                        }
                    },
                    moveDownProcess: function (process) {
                        if (process) {
                            var index;
                            if (!this.flowWorks.processes.every(function (child, i) {
                                    if (child.id === process.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index < this.flowWorks.processes.length - 1) {
                                    this.flowWorks.processes.splice(index, 1);
                                    this.flowWorks.processes.splice(index + 1, 0, process);
                                }
                            }
                        }
                    },
                    moveUpProcess: function (process) {
                        if (process) {
                            var index;
                            if (!this.flowWorks.processes.every(function (child, i) {
                                    if (child.id === process.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index > 0) {
                                    this.flowWorks.processes.splice(index, 1);
                                    this.flowWorks.processes.splice(index - 1, 0, process);
                                }
                            }
                        }
                    },
                    removeFlow: function (flow) {
                        var index;
                        if (!this.flowWorks.flows.every(function (f, i) {
                                if (f.id === flow.id) {
                                    index = i;
                                    return false;
                                }

                                return true;
                            })) {
                            this.flowWorks.flows.splice(index, 1);
                        }
                    },
                    removeProcess: function (process) {
                        var index;
                        if (!this.flowWorks.processes.every(function (p, i) {
                                if (p.id === process.id) {
                                    index = i;
                                    return false;
                                }

                                return true;
                            })) {
                            this.flowWorks.processes.splice(index, 1);
                        }
                    },
                    flowIndexOf: function (flow) {
                        if (flow) {
                            var index;
                            if (!this.flowWorks.flows.every(function (child, i) {
                                    if (child.id === flow.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                return index;
                            }
                        }
                    },
                    getFlow: function (index) {
                        return index >= 0 && index < this.flowWorks.flows.length && this.flowWorks.flows[index];
                    },
                    processIndexOf: function (process) {
                        if (process) {
                            var index;
                            if (!this.flowWorks.processes.every(function (child, i) {
                                    if (child.id === process.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                return index;
                            }
                        }
                    },
                    getProcess: function (index) {
                        return index >= 0 && index < this.flowWorks.processes.length && this.flowWorks.processes[index];
                    }
                }),
                Flow = Class({
                    CLASS_NAME: "Flow",
                    MEMBERS: {
                        id: "",
                        name: "",
                        comment: "",
                        childSteps: []
                    },
                    initialize: function (id) {
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }

                        this.id = id || "Flow" + _.now();
                    },
                    toJSON: function () {
                        return _.extend(_.pick(this, ["id", "name", "comment"], "CLASS_NAME"), {childSteps: $inject.uiUtilService.arrayOmit(this.childSteps, "$$hashKey")});
                    },
                    fromObject: function (obj) {
                        var ret = new Flow(obj.id);
                        ret.name = obj.name;
                        ret.comment = obj.comment;

                        var classes = ["SequenceFlowStep", "InvokeFlowStep", "MapFlowStep", "SwitchFlowStep", "RepeatFlowStep", "ExitFlowStep"];
                        obj.childSteps && obj.childSteps.forEach(function (step) {
                            var className = step.CLASS_NAME,
                                stepObj;

                            classes.every(function (clazz) {
                                if (eval("className === {0}.prototype.CLASS_NAME".format(clazz))) {
                                    stepObj = eval("{0}.prototype.fromObject(step)".format(clazz));
                                    ret.childSteps.push(stepObj);
                                    return false;
                                }

                                return true;
                            });
                        });

                        return ret;
                    },
                    toString: function () {
                        return this.id;
                    },
                    isKindOf: function (className) {
                        return Flow.prototype.CLASS_NAME == className;
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, Flow.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, ["id", "childSteps"]);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        this.childSteps.forEach(function (step) {
                            cloneObj.childSteps.push(step.clone());
                        });

                        return cloneObj;
                    },
                    addStep: function (step, beforeStep) {
                        if (step) {
                            var index, beforeIndex;
                            beforeStep && this.childSteps.every(function (child, i) {
                                if (child.id === beforeStep.id) {
                                    beforeIndex = i;
                                    return false;
                                }
                                return true;
                            });

                            if (this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (beforeIndex == null) beforeIndex = this.childSteps.length;
                                this.childSteps.splice(beforeIndex, 0, step);
                            } else {
                                //Change existing step position
                                if (beforeIndex != null) {
                                    if (index < beforeIndex - 1) {
                                        this.childSteps.splice(beforeIndex, 0, step);
                                        this.childSteps.splice(index, 1);
                                    }
                                    if (index > beforeIndex) {
                                        this.childSteps.splice(beforeIndex, 0, step);
                                        this.childSteps.splice(index + 1, 1);
                                    }
                                }
                            }
                        }
                    },
                    removeStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                this.childSteps.splice(index, 1);
                            }
                        }
                    },
                    moveDownStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index < this.childSteps.length - 1) {
                                    this.childSteps.splice(index, 1);
                                    this.childSteps.splice(index + 1, 0, step);
                                }
                            }
                        }
                    },
                    moveUpStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index > 0) {
                                    this.childSteps.splice(index, 1);
                                    this.childSteps.splice(index - 1, 0, step);
                                }
                            }
                        }
                    },
                    indexOf: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                return index;
                            }
                        }
                    },
                    getItem: function (index) {
                        return index >= 0 && index < this.childSteps.length && this.childSteps[index];
                    }
                }),
                BaseFlowStep = Class({
                    CLASS_NAME: "BaseFlowStep",
                    MEMBERS: {
                        id: "",
                        name: "",
                        comment: "",
                        flowStepType: "",
                        label: ""//$null, $default
                    },
                    initialize: function (flowStepType, id) {
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }

                        this.flowStepType = flowStepType;
                        this.id = id || "FlowStep_" + _.now();
                    },
                    toJSON: function () {
                        return _.extend(_.pick(this, ["id", "name", "comment", "flowStepType", "label"], "CLASS_NAME"));
                    },
                    fromObject: function (obj) {
                        this.name = obj.name || this.name;
                        this.comment = obj.name || this.comment;
                        this.flowStepType = obj.flowStepType || this.flowStepType;
                        this.label = obj.label || this.label;
                    },
                    toString: function () {
                        return this.id;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return BaseFlowStep.prototype.CLASS_NAME == className;
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, BaseFlowStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, ["id"]);
                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        return cloneObj;
                    },
                    moveStep: function () {
                    }
                }),
                SequenceFlowStep = Class(BaseFlowStep, {
                    CLASS_NAME: "SequenceFlowStep",
                    MEMBERS: {
                        childSteps: [],
                        exitOn: "Failure"//Success, Failure, Done
                    },
                    initialize: function (id) {
                        SequenceFlowStep.prototype.__proto__.initialize.apply(this, ["Sequence", id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    toJSON: function () {
                        var jsonObj = SequenceFlowStep.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME", "exitOn"]), {childSteps: $inject.uiUtilService.arrayOmit(this.childSteps, "$$hashKey")});

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new SequenceFlowStep(obj.id);
                        ret.exitOn = obj.exitOn || ret.exitOn;

                        SequenceFlowStep.prototype.__proto__.fromObject.apply(ret, [obj]);

                        var classes = ["SequenceFlowStep", "InvokeFlowStep", "MapFlowStep", "SwitchFlowStep", "RepeatFlowStep", "ExitFlowStep"];
                        obj.childSteps && obj.childSteps.forEach(function (step) {
                            var className = step.CLASS_NAME,
                                stepObj;

                            classes.every(function (clazz) {
                                if (eval("className === {0}.prototype.CLASS_NAME".format(clazz))) {
                                    stepObj = eval("{0}.prototype.fromObject(step)".format(clazz));
                                    ret.childSteps.push(stepObj);
                                    return false;
                                }

                                return true;
                            });
                        });

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return SequenceFlowStep.prototype.CLASS_NAME == className || SequenceFlowStep.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        cloneObj = cloneObj || new SequenceFlowStep();

                        _.extend(MEMBERS = MEMBERS || {}, SequenceFlowStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, ["childSteps"]);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        SequenceFlowStep.prototype.__proto__.clone.apply(self, [cloneObj, MEMBERS]);

                        this.childSteps.forEach(function (child) {
                            cloneObj.childSteps.push(child.clone());
                        });

                        return cloneObj;
                    },
                    moveStep: function () {
                    },
                    addStep: function (step, beforeStep) {
                        if (step) {
                            var index, beforeIndex;
                            beforeStep && this.childSteps.every(function (child, i) {
                                if (child.id === beforeStep.id) {
                                    beforeIndex = i;
                                    return false;
                                }
                                return true;
                            });

                            if (this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (beforeIndex == null) beforeIndex = this.childSteps.length;
                                this.childSteps.splice(beforeIndex, 0, step);
                            } else {
                                //Change existing step position
                                if (beforeIndex != null) {
                                    if (index < beforeIndex - 1) {
                                        this.childSteps.splice(beforeIndex, 0, step);
                                        this.childSteps.splice(index, 1);
                                    }
                                    if (index > beforeIndex) {
                                        this.childSteps.splice(beforeIndex, 0, step);
                                        this.childSteps.splice(index + 1, 1);
                                    }
                                }
                            }
                        }
                    },
                    removeStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                this.childSteps.splice(index, 1);
                            }
                        }
                    },
                    moveDownStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index < this.childSteps.length - 1) {
                                    this.childSteps.splice(index, 1);
                                    this.childSteps.splice(index + 1, 0, step);
                                }
                            }
                        }
                    },
                    moveUpStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index > 0) {
                                    this.childSteps.splice(index, 1);
                                    this.childSteps.splice(index - 1, 0, step);
                                }
                            }
                        }
                    },
                    indexOf: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                return index;
                            }
                        }
                    },
                    getItem: function (index) {
                        return index >= 0 && index < this.childSteps.length && this.childSteps[index];
                    }
                }),
                InvokeFlowStep = Class(BaseFlowStep, {
                    CLASS_NAME: "InvokeFlowStep",
                    MEMBERS: {
                        timeout: 0
                    },
                    initialize: function (id) {
                        InvokeFlowStep.prototype.__proto__.initialize.apply(this, ["Invoke", id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    toJSON: function () {
                        var jsonObj = InvokeFlowStep.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME", "timeout"]));

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new InvokeFlowStep(obj.id);
                        ret.timeout = obj.timeout || ret.timeout;

                        InvokeFlowStep.prototype.__proto__.fromObject.apply(ret, [obj]);

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return InvokeFlowStep.prototype.CLASS_NAME == className || InvokeFlowStep.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, InvokeFlowStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, []);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        InvokeFlowStep.prototype.__proto__.clone.apply(self, [cloneObj, MEMBERS]);

                        return cloneObj;
                    },
                    moveStep: function () {
                    }
                }),
                MapFlowStep = Class(BaseFlowStep, {
                    CLASS_NAME: "MapFlowStep",
                    MEMBERS: {
                        mappings: []//array of object {variable: "v", expression: ""}, expression is evaluated by angular.
                    },
                    initialize: function (id) {
                        MapFlowStep.prototype.__proto__.initialize.apply(this, ["Map", id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    toJSON: function () {
                        var jsonObj = MapFlowStep.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]), {mappings: $inject.uiUtilService.arrayOmit(this.mappings, "$$hashKey")});

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new MapFlowStep(obj.id);
                        if (obj.mappings && obj.mappings.length)
                            ret.mappings = angular.copy(obj.mappings);

                        MapFlowStep.prototype.__proto__.fromObject.apply(ret, [obj]);

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return MapFlowStep.prototype.CLASS_NAME == className || MapFlowStep.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, MapFlowStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, []);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        MapFlowStep.prototype.__proto__.clone.apply(self, [cloneObj, MEMBERS]);

                        return cloneObj;
                    },
                    moveStep: function () {
                    }
                }),
                SwitchFlowStep = Class(BaseFlowStep, {
                    CLASS_NAME: "SwitchFlowStep",
                    MEMBERS: {
                        childSteps: [],
                        switchExpression: "",
                        evaluateLabels: false
                    },
                    initialize: function (id) {
                        SwitchFlowStep.prototype.__proto__.initialize.apply(this, ["Switch", id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    toJSON: function () {
                        var jsonObj = SwitchFlowStep.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME", "switchExpression", "evaluateLabels"]), {childSteps: $inject.uiUtilService.arrayOmit(this.childSteps, "$$hashKey")});

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new SwitchFlowStep(obj.id);
                        ret.switchExpression = obj.switchExpression || ret.switchExpression;
                        ret.evaluateLabels = obj.evaluateLabels || ret.evaluateLabels;

                        SwitchFlowStep.prototype.__proto__.fromObject.apply(ret, [obj]);

                        var classes = ["SequenceFlowStep", "InvokeFlowStep", "MapFlowStep", "SwitchFlowStep", "RepeatFlowStep", "ExitFlowStep"];
                        obj.childSteps && obj.childSteps.forEach(function (step) {
                            var className = step.CLASS_NAME,
                                stepObj;

                            classes.every(function (clazz) {
                                if (eval("className === {0}.prototype.CLASS_NAME".format(clazz))) {
                                    stepObj = eval("{0}.prototype.fromObject(step)".format(clazz));
                                    ret.childSteps.push(stepObj);
                                    return false;
                                }

                                return true;
                            });
                        });

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return SwitchFlowStep.prototype.CLASS_NAME == className || SwitchFlowStep.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, SwitchFlowStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, ["childSteps"]);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        SwitchFlowStep.prototype.__proto__.clone.apply(self, [cloneObj, MEMBERS]);

                        this.childSteps.forEach(function (child) {
                            cloneObj.childSteps.push(child.clone());
                        });

                        return cloneObj;
                    },
                    moveStep: function () {
                    },
                    addStep: function (step, beforeStep) {
                        if (step) {
                            var index, beforeIndex;
                            beforeStep && this.childSteps.every(function (child, i) {
                                if (child.id === beforeStep.id) {
                                    beforeIndex = i;
                                    return false;
                                }
                                return true;
                            });

                            if (this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (beforeIndex == null) beforeIndex = this.childSteps.length;
                                this.childSteps.splice(beforeIndex, 0, step);
                            } else {
                                //Change existing step position
                                if (beforeIndex != null) {
                                    if (index < beforeIndex - 1) {
                                        this.childSteps.splice(beforeIndex, 0, step);
                                        this.childSteps.splice(index, 1);
                                    }
                                    if (index > beforeIndex) {
                                        this.childSteps.splice(beforeIndex, 0, step);
                                        this.childSteps.splice(index + 1, 1);
                                    }
                                }
                            }
                        }
                    },
                    removeStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                this.childSteps.splice(index, 1);
                            }
                        }
                    },
                    moveDownStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index < this.childSteps.length - 1) {
                                    this.childSteps.splice(index, 1);
                                    this.childSteps.splice(index + 1, 0, step);
                                }
                            }
                        }
                    },
                    moveUpStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index > 0) {
                                    this.childSteps.splice(index, 1);
                                    this.childSteps.splice(index - 1, 0, step);
                                }
                            }
                        }
                    },
                    indexOf: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                return index;
                            }
                        }
                    },
                    getItem: function (index) {
                        return index >= 0 && index < this.childSteps.length && this.childSteps[index];
                    }
                }),
                RepeatFlowStep = Class(BaseFlowStep, {
                    CLASS_NAME: "RepeatFlowStep",
                    MEMBERS: {
                        childSteps: [],
                        repeatOn: "Failure",//Success, Failure
                        count: "",
                        timeout: 0,
                        interval: 0
                    },
                    initialize: function (id) {
                        RepeatFlowStep.prototype.__proto__.initialize.apply(this, ["Repeat", id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    toJSON: function () {
                        var jsonObj = RepeatFlowStep.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME", "repeatOn", "count", "timeout", "interval"]), {childSteps: $inject.uiUtilService.arrayOmit(this.childSteps, "$$hashKey")});

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new RepeatFlowStep(obj.id);
                        ret.repeatOn = obj.repeatOn || ret.repeatOn;
                        ret.count = obj.count || ret.count;
                        ret.timeout = obj.timeout || ret.timeout;
                        ret.interval = obj.interval || ret.interval;

                        RepeatFlowStep.prototype.__proto__.fromObject.apply(ret, [obj]);

                        var classes = ["SequenceFlowStep", "InvokeFlowStep", "MapFlowStep", "SwitchFlowStep", "RepeatFlowStep", "ExitFlowStep"];
                        obj.childSteps && obj.childSteps.forEach(function (step) {
                            var className = step.CLASS_NAME,
                                stepObj;

                            classes.every(function (clazz) {
                                if (eval("className === {0}.prototype.CLASS_NAME".format(clazz))) {
                                    stepObj = eval("{0}.prototype.fromObject(step)".format(clazz));
                                    ret.childSteps.push(stepObj);
                                    return false;
                                }

                                return true;
                            });
                        });

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return RepeatFlowStep.prototype.CLASS_NAME == className || RepeatFlowStep.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, RepeatFlowStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, ["childSteps"]);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        RepeatFlowStep.prototype.__proto__.clone.apply(self, [cloneObj, MEMBERS]);

                        this.childSteps.forEach(function (child) {
                            cloneObj.childSteps.push(child.clone());
                        });

                        return cloneObj;
                    },
                    moveStep: function () {
                    },
                    addStep: function (step, beforeStep) {
                        if (step) {
                            var index, beforeIndex;
                            beforeStep && this.childSteps.every(function (child, i) {
                                if (child.id === beforeStep.id) {
                                    beforeIndex = i;
                                    return false;
                                }
                                return true;
                            });

                            if (this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (beforeIndex == null) beforeIndex = this.childSteps.length;
                                this.childSteps.splice(beforeIndex, 0, step);
                            } else {
                                //Change existing step position
                                if (beforeIndex != null) {
                                    if (index < beforeIndex - 1) {
                                        this.childSteps.splice(beforeIndex, 0, step);
                                        this.childSteps.splice(index, 1);
                                    }
                                    if (index > beforeIndex) {
                                        this.childSteps.splice(beforeIndex, 0, step);
                                        this.childSteps.splice(index + 1, 1);
                                    }
                                }
                            }
                        }
                    },
                    removeStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                this.childSteps.splice(index, 1);
                            }
                        }
                    },
                    moveDownStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index < this.childSteps.length - 1) {
                                    this.childSteps.splice(index, 1);
                                    this.childSteps.splice(index + 1, 0, step);
                                }
                            }
                        }
                    },
                    moveUpStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                if (index > 0) {
                                    this.childSteps.splice(index, 1);
                                    this.childSteps.splice(index - 1, 0, step);
                                }
                            }
                        }
                    },
                    indexOf: function (step) {
                        if (step) {
                            var index;
                            if (!this.childSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                return index;
                            }
                        }
                    },
                    getItem: function (index) {
                        return index >= 0 && index < this.childSteps.length && this.childSteps[index];
                    }
                }),
                ExitFlowStep = Class(BaseFlowStep, {
                    CLASS_NAME: "ExitFlowStep",
                    MEMBERS: {
                        exitFrom: "$parent",//$parent, $flow
                        signal: "",//Success, Failure
                        message: ""
                    },
                    initialize: function (id) {
                        ExitFlowStep.prototype.__proto__.initialize.apply(this, ["Exit", id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    toJSON: function () {
                        var jsonObj = ExitFlowStep.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME", "exitFrom", "signal", "message"]));

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new ExitFlowStep(obj.id);
                        ret.exitFrom = obj.exitFrom || ret.exitFrom;
                        ret.signal = obj.signal || ret.signal;
                        ret.message = obj.message || ret.message;

                        ExitFlowStep.prototype.__proto__.fromObject.apply(ret, [obj]);

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return ExitFlowStep.prototype.CLASS_NAME == className || ExitFlowStep.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, ExitFlowStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, []);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        ExitFlowStep.prototype.__proto__.clone.apply(self, [cloneObj, MEMBERS]);

                        return cloneObj;
                    },
                    moveStep: function () {
                    }
                }),
                Process = Class({
                    CLASS_NAME: "Process",
                    MEMBERS: {
                        id: "",
                        name: "",
                        processSteps: []
                    },
                    initialize: function (id) {
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }

                        this.id = id || "Process" + _.now();
                    },
                    toJSON: function () {
                        return _.extend(_.pick(this, ["id", "name"], "CLASS_NAME"), {processSteps: $inject.uiUtilService.arrayOmit(this.processSteps, "$$hashKey")});
                    },
                    fromObject: function (obj) {
                        var ret = new Process(obj.id);
                        ret.name = obj.name;

                        var classes = [""];
                        obj.processSteps && obj.processSteps.forEach(function (step) {
                            var className = step.CLASS_NAME,
                                stepObj;

                            classes.every(function (clazz) {
                                if (eval("className === {0}.prototype.CLASS_NAME".format(clazz))) {
                                    stepObj = eval("{0}.prototype.fromObject(step)".format(clazz));
                                    ret.processSteps.push(stepObj);
                                    return false;
                                }

                                return true;
                            });
                        });

                        return ret;
                    },
                    toString: function () {
                        return this.id;
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, Process.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, ["id", "processSteps"]);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        this.processSteps.forEach(function (step) {
                            cloneObj.processSteps.push(step.clone());
                        });

                        return cloneObj;
                    },
                    removeStep: function (step) {
                        if (step) {
                            var index;
                            if (!this.processSteps.every(function (child, i) {
                                    if (child.id === step.id) {
                                        index = i;
                                        return false;
                                    }
                                    return true;
                                })) {
                                this.processSteps.splice(index, 1);
                            }
                        }
                    }
                }),
                BaseProcessStep = Class({
                    CLASS_NAME: "BaseProcessStep",
                    MEMBERS: {
                        id: "",
                        processStepType: "",
                        inboundTransitions: [],
                        outboundTransitions: []
                    },
                    initialize: function (processStepType, id) {
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }

                        this.processStepType = processStepType;
                        this.id = id || "ProcessStep_" + _.now();
                    },
                    toJSON: function () {
                        return _.extend(_.pick(this, ["id", "processStepType"], "CLASS_NAME"));
                    },
                    fromObject: function (obj) {
                    },
                    toString: function () {
                        return this.id;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return BaseProcessStep.prototype.CLASS_NAME == className;
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, BaseProcessStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, ["id"]);
                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        return cloneObj;
                    }
                }),
                CallProcessStep = Class(BaseProcessStep, {
                    CLASS_NAME: "CallProcessStep",
                    MEMBERS: {},
                    initialize: function (id) {
                        CallProcessStep.prototype.__proto__.initialize.apply(this, ["Call", id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    toJSON: function () {
                        var jsonObj = CallProcessStep.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]));

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new CallProcessStep(obj.id);

                        CallProcessStep.prototype.__proto__.fromObject.apply(ret, [obj]);

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return CallProcessStep.prototype.CLASS_NAME == className || CallProcessStep.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, CallProcessStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, []);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        CallProcessStep.prototype.__proto__.clone.apply(self, [cloneObj, MEMBERS]);

                        return cloneObj;
                    },
                    moveStep: function () {
                    }
                }),
                ReceiveProcessStep = Class(BaseProcessStep, {
                    CLASS_NAME: "ReceiveProcessStep",
                    MEMBERS: {
                        event: null
                    },
                    initialize: function (id) {
                        ReceiveProcessStep.prototype.__proto__.initialize.apply(this, ["Receive", id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    toJSON: function () {
                        var jsonObj = ReceiveProcessStep.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]));

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new ReceiveProcessStep(obj.id);

                        ReceiveProcessStep.prototype.__proto__.fromObject.apply(ret, [obj]);

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return ReceiveProcessStep.prototype.CLASS_NAME == className || ReceiveProcessStep.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, ReceiveProcessStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, []);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        ReceiveProcessStep.prototype.__proto__.clone.apply(self, [cloneObj, MEMBERS]);

                        return cloneObj;
                    },
                    moveStep: function () {
                    }
                }),
                TerminateProcessStep = Class(BaseProcessStep, {
                    CLASS_NAME: "TerminateProcessStep",
                    MEMBERS: {},
                    initialize: function (id) {
                        TerminateProcessStep.prototype.__proto__.initialize.apply(this, ["Terminate", id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    toJSON: function () {
                        var jsonObj = TerminateProcessStep.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]));

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new TerminateProcessStep(obj.id);

                        TerminateProcessStep.prototype.__proto__.fromObject.apply(ret, [obj]);

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return TerminateProcessStep.prototype.CLASS_NAME == className || TerminateProcessStep.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, TerminateProcessStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, []);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        TerminateProcessStep.prototype.__proto__.clone.apply(self, [cloneObj, MEMBERS]);

                        return cloneObj;
                    },
                    moveStep: function () {
                    }
                }),
                ForkProcessStep = Class(BaseProcessStep, {
                    CLASS_NAME: "ForkProcessStep",
                    MEMBERS: {},
                    initialize: function (id) {
                        ForkProcessStep.prototype.__proto__.initialize.apply(this, ["Fork", id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    toJSON: function () {
                        var jsonObj = ForkProcessStep.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]));

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new ForkProcessStep(obj.id);

                        ForkProcessStep.prototype.__proto__.fromObject.apply(ret, [obj]);

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return ForkProcessStep.prototype.CLASS_NAME == className || ForkProcessStep.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, ForkProcessStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, []);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        ForkProcessStep.prototype.__proto__.clone.apply(self, [cloneObj, MEMBERS]);

                        return cloneObj;
                    },
                    moveStep: function () {
                    }
                }),
                JoinProcessStep = Class(BaseProcessStep, {
                    CLASS_NAME: "JoinProcessStep",
                    MEMBERS: {},
                    initialize: function (id) {
                        JoinProcessStep.prototype.__proto__.initialize.apply(this, ["Join", id]);
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }
                    },
                    toJSON: function () {
                        var jsonObj = JoinProcessStep.prototype.__proto__.toJSON.apply(this);
                        _.extend(jsonObj, _.pick(this, ["CLASS_NAME"]));

                        return jsonObj;
                    },
                    fromObject: function (obj) {
                        var ret = new JoinProcessStep(obj.id);

                        JoinProcessStep.prototype.__proto__.fromObject.apply(ret, [obj]);

                        return ret;
                    },
                    isKindOf: function (className) {
                        var self = this;

                        return JoinProcessStep.prototype.CLASS_NAME == className || JoinProcessStep.prototype.__proto__.isKindOf.apply(self, [className]);
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, JoinProcessStep.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, []);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        JoinProcessStep.prototype.__proto__.clone.apply(self, [cloneObj, MEMBERS]);

                        return cloneObj;
                    },
                    moveStep: function () {
                    }
                }),
                ProcessTransition = Class({
                    CLASS_NAME: "ProcessTransition",
                    MEMBERS: {
                        id: "",
                        fromStep: null,
                        toStep: null,
                        condition: ""
                    },
                    initialize: function (id) {
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }

                        this.id = id || "ProcessTransition_" + _.now();
                    },
                    toJSON: function () {
                        return _.extend(_.pick(this, ["id"], "CLASS_NAME"));
                    },
                    fromObject: function (obj) {
                    },
                    toString: function () {
                        return this.id;
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, ProcessTransition.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, ["id"]);

                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        return cloneObj;
                    },
                    moveStep: function () {
                    }
                }),
                ProcessEventSpec = Class({
                    CLASS_NAME: "ProcessEventSpec",
                    MEMBERS: {
                        id: ""
                    },
                    initialize: function (id) {
                        var MEMBERS = arguments.callee.prototype.MEMBERS;

                        for (var member in MEMBERS) {
                            this[member] = angular.copy(MEMBERS[member]);
                        }

                        this.id = id || "ProcessEventSpec_" + _.now();
                    },
                    toJSON: function () {
                        return _.extend(_.pick(this, ["id"], "CLASS_NAME"));
                    },
                    fromObject: function (obj) {
                    },
                    toString: function () {
                        return this.id;
                    },
                    clone: function (cloneObj, MEMBERS) {
                        var self = this;

                        _.extend(MEMBERS = MEMBERS || {}, ProcessEventSpec.prototype.MEMBERS);
                        MEMBERS = _.omit(MEMBERS, ["id"]);
                        _.keys(MEMBERS).forEach(function (member) {
                            cloneObj[member] = angular.copy(self[member]);
                        });

                        return cloneObj;
                    },
                    moveStep: function () {
                    }
                });

            FlowService.prototype.registerService = function () {
                this.serviceRegistry && this.serviceRegistry.register(this, FEATURE, PLATFORM);
            }

            FlowService.prototype.unregisterService = function () {
                this.serviceRegistry && this.serviceRegistry.unregister(FEATURE, PLATFORM);
            }

            FlowService.prototype.createFlow = function () {
                return new Flow();
            }

            FlowService.prototype.createFlowStep = function (className) {
                var classes = ["SequenceFlowStep", "InvokeFlowStep", "MapFlowStep", "SwitchFlowStep", "RepeatFlowStep", "ExitFlowStep"];

                var stepObj;
                classes.every(function (clazz) {
                    if (eval("className === {0}.prototype.CLASS_NAME".format(clazz))) {
                        stepObj = eval("new {0}()".format(clazz));
                        return false;
                    }

                    return true;
                });

                return stepObj;
            }

            FlowService.prototype.createProcess = function () {
                return new Process();
            }

            FlowService.prototype.createProcessStep = function (className) {
                var classes = ["ReceiveProcessStep", "TerminateProcessStep", "ForkProcessStep", "JoinProcessStep"];

                var stepObj;
                classes.every(function (clazz) {
                    if (eval("className === {0}.prototype.CLASS_NAME".format(clazz))) {
                        stepObj = eval("new {0}()".format(clazz));
                        return false;
                    }

                    return true;
                });

                return stepObj;
            }

            FlowService.prototype.prepareFakeFlow = function () {
                var self = this,
                    sequence = new SequenceFlowStep();

                sequence.addStep(new InvokeFlowStep());

                self.$timeout(function () {
                    sequence.addStep(new MapFlowStep());
                });
                self.$timeout(function () {
                    sequence.addStep(new ExitFlowStep());
                });
                self.$timeout(function () {
                    var repeatStep = new RepeatFlowStep();
                    sequence.addStep(repeatStep);

                    self.$timeout(function () {
                        repeatStep.addStep(new InvokeFlowStep());
                    }, 10);
                    self.$timeout(function () {
                        repeatStep.addStep(new MapFlowStep());
                    }, 20);
                    self.$timeout(function () {
                        repeatStep.addStep(new ExitFlowStep());
                    }, 30);
                }, 10);
                self.$timeout(function () {
                    var switchStep = new SwitchFlowStep();
                    sequence.addStep(switchStep);

                    self.$timeout(function () {
                        switchStep.addStep(new InvokeFlowStep());
                    }, 10);
                    self.$timeout(function () {
                        switchStep.addStep(new MapFlowStep());
                    }, 20);
                    self.$timeout(function () {
                        switchStep.addStep(new ExitFlowStep());
                    }, 30);
                }, 20);

                var flow = new Flow();
                flow.addStep(sequence);

                this.$rootScope.loadedProject.addFlow(flow);

                return flow;
            }

            FlowService.prototype.fromObject = function (obj) {
                var className = obj.CLASS_NAME,
                    classes = ["Flow", "Process"],
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

            FlowService.prototype.loadProject = function (dbObject) {
                var self = this;

                if (!_.isEmpty(self.$rootScope.loadedProject)) {
                    self.$rootScope.loadedProject.unload();
                }
                self.$rootScope.loadedProject = new FlowProject(dbObject);

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
                            return self.$rootScope.loadedProject.loadFlow();
                        },
                        function () {
                            self.$rootScope.$broadcast(self.angularEventTypes.switchProjectEvent, self.$rootScope.loadedProject);

                            return self.$rootScope.loadedProject.tryLock(self.$rootScope.loginUser._id);
                        }
                    ]
                );
            }
        }

        return function (appModule) {
            appModule.
                config(["$provide", function ($provide) {
                    $provide.service('uiFlowService', FlowService);
                }]);
        };
    }
)
;