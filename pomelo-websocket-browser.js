(function (exports, GLOBAL) {
    var isArray = Array.isArray;

    var root = exports;

    function EventEmitter() {
    }

    root.EventEmitter = EventEmitter;

    // By default EventEmitters will print a warning if more than
    // 10 listeners are added to it. This is a useful default which
    // helps finding memory leaks.
    //
    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
    var defaultMaxListeners = 10;
    EventEmitter.prototype.setMaxListeners = function (n) {
        if (!this._events) this._events = {};
        this._maxListeners = n;
    };


    EventEmitter.prototype.emit = function () {
        var type = arguments[0];
        // If there is no 'error' event listener then throw.
        if (type === 'error') {
            if (!this._events || !this._events.error ||
                (isArray(this._events.error) && !this._events.error.length)) {
                if (this.domain) {
                    var er = arguments[1];
                    er.domain_emitter = this;
                    er.domain = this.domain;
                    er.domain_thrown = false;
                    this.domain.emit('error', er);
                    return false;
                }

                if (arguments[1] instanceof Error) {
                    throw arguments[1]; // Unhandled 'error' event
                } else {
                    throw new Error("Uncaught, unspecified 'error' event.");
                }
                return false;
            }
        }

        if (!this._events) return false;
        var handler = this._events[type];
        if (!handler) return false;

        if (typeof handler == 'function') {
            if (this.domain) {
                this.domain.enter();
            }
            switch (arguments.length) {
                // fast cases
                case 1:
                    handler.call(this);
                    break;
                case 2:
                    handler.call(this, arguments[1]);
                    break;
                case 3:
                    handler.call(this, arguments[1], arguments[2]);
                    break;
                // slower
                default:
                    var l = arguments.length;
                    var args = new Array(l - 1);
                    for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
                    handler.apply(this, args);
            }
            if (this.domain) {
                this.domain.exit();
            }
            return true;

        } else if (isArray(handler)) {
            if (this.domain) {
                this.domain.enter();
            }
            var l = arguments.length;
            var args = new Array(l - 1);
            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

            var listeners = handler.slice();
            for (var i = 0, l = listeners.length; i < l; i++) {
                listeners[i].apply(this, args);
            }
            if (this.domain) {
                this.domain.exit();
            }
            return true;

        } else {
            return false;
        }
    };

    EventEmitter.prototype.addListener = function (type, listener) {
        if ('function' !== typeof listener) {
            throw new Error('addListener only takes instances of Function');
        }

        if (!this._events) this._events = {};

        // To avoid recursion in the case that type == "newListeners"! Before
        // adding it to the listeners, first emit "newListeners".
        this.emit('newListener', type, typeof listener.listener === 'function' ?
            listener.listener : listener);

        if (!this._events[type]) {
            // Optimize the case of one listener. Don't need the extra array object.
            this._events[type] = listener;
        } else if (isArray(this._events[type])) {

            // If we've already got an array, just append.
            this._events[type].push(listener);

        } else {
            // Adding the second element, need to change to array.
            this._events[type] = [this._events[type], listener];

        }

        // Check for listener leak
        if (isArray(this._events[type]) && !this._events[type].warned) {
            var m;
            if (this._maxListeners !== undefined) {
                m = this._maxListeners;
            } else {
                m = defaultMaxListeners;
            }

            if (m && m > 0 && this._events[type].length > m) {
                this._events[type].warned = true;
                console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
                console.trace();
            }
        }

        return this;
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.once = function (type, listener) {
        if ('function' !== typeof listener) {
            throw new Error('.once only takes instances of Function');
        }

        var self = this;

        function g() {
            self.removeListener(type, g);
            listener.apply(this, arguments);
        };

        g.listener = listener;
        self.on(type, g);

        return this;
    };

    EventEmitter.prototype.removeListener = function (type, listener) {
        if ('function' !== typeof listener) {
            throw new Error('removeListener only takes instances of Function');
        }

        // does not use listeners(), so no side effect of creating _events[type]
        if (!this._events || !this._events[type]) return this;

        var list = this._events[type];

        if (isArray(list)) {
            var position = -1;
            for (var i = 0, length = list.length; i < length; i++) {
                if (list[i] === listener ||
                    (list[i].listener && list[i].listener === listener)) {
                    position = i;
                    break;
                }
            }

            if (position < 0) return this;
            list.splice(position, 1);
        } else if (list === listener ||
            (list.listener && list.listener === listener)) {
            delete this._events[type];
        }

        return this;
    };

    EventEmitter.prototype.removeAllListeners = function (type) {
        if (arguments.length === 0) {
            this._events = {};
            return this;
        }

        var events = this._events && this._events[type];
        if (!events) return this;

        if (isArray(events)) {
            events.splice(0);
        } else {
            this._events[type] = null;
        }

        return this;
    };

    EventEmitter.prototype.listeners = function (type) {
        if (!this._events) this._events = {};
        if (!this._events[type]) this._events[type] = [];
        if (!isArray(this._events[type])) {
            this._events[type] = [this._events[type]];
        }
        return this._events[type];
    }
})('object' === typeof module ? module.exports : window, this);

(function (exports, GLOBAL) {
    exports.Protocol = exports.Protocol || require('pomelo-protocol');
    exports.Protobuf = exports.Protobuf || require('pomelo-protobuf');
}('object' === typeof module ? module.exports : window, this));

(function (exports, GLOBAL) {
    var JS_WS_CLIENT_TYPE = 'js-websocket';
    var JS_WS_CLIENT_VERSION = '0.0.1';

    var Protocol = exports.Protocol;
    var Protobuf = exports.Protobuf;
    var WebSocket = exports.WebSocket;
    var decodeIO_encoder = null;
    var decodeIO_decoder = null;
    var Package = Protocol.Package;
    var Message = Protocol.Message;

    var RES_OK = 200;
    var RES_FAIL = 500;
    var RES_OLD_CLIENT = 501;
    var gapThreshold = 100;   // heartbeat gap threashold
    var DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

    function pomelo() {

    }

    exports.pomelo = pomelo;

    var OF = function () {
    };
    OF.prototype = exports.EventEmitter.prototype;
    pomelo.prototype = new OF();

    pomelo.prototype.init = function (params, cb, errorCb) {
        var self = this;

        self.reqId = 0;
        self.dict = {};    // route string to code
        self.abbrs = {};   // code to route string
        self.serverProtos = {};
        self.clientProtos = {};
        self.protoVersion = 0;
        self.initCallback = cb;
        self.callbacks = {};
        //Map from request id to route
        self.routeMap = {};
        self.reconnectAttempts = 0;
        self.reconnectionDelay = 5000;
        self.reconnect = false;
        self.reconncetTimer = null;
        self.url = null;
        self.heartbeatInterval = 0;
        self.heartbeatTimeout = 0;
        self.nextHeartbeatTimeout = 0;
        self.heartbeatTimeoutId = null;
        self.heartbeatId = null;
        self.handshakeCallback = null;
        self.useCrypto = false;
        self.handshakeBuffer = {
            'sys': {
                type: JS_WS_CLIENT_TYPE,
                version: JS_WS_CLIENT_VERSION,
                rsa: {}
            },
            'user': {}
        };

        var host = params.host;
        var port = params.port;

        self.encode = params.encode || self.defaultEncode;
        self.decode = params.decode || self.defaultDecode;

        self.url = 'ws://' + host;
        if (port) {
            self.url += ':' + port;
        }

        self.handshakeBuffer.user = params.user;
        self.handshakeCallback = params.handshakeCallback;
        self.maxReconnectAttempts = params.maxReconnectAttempts || DEFAULT_MAX_RECONNECT_ATTEMPTS;

        /* Since the client is used in intranet, crypt is not needed
         if (params.encrypt) {
         self.useCrypto = true;
         window.rsa.generate(1024, "10001");
         var data = {
         rsa_n: rsa.n.toString(16),
         rsa_e: rsa.e
         }
         self.handshakeBuffer.sys.rsa = data;
         }
         */

        function connect() {
            //Add protobuf version
            if (exports.localStorage && exports.localStorage.getItem('protos') && self.protoVersion === 0) {
                var protos = JSON.parse(exports.localStorage.getItem('protos'));

                self.protoVersion = protos.version || 0;
                self.serverProtos = protos.server || {};
                self.clientProtos = protos.client || {};

                if (!!Protobuf) {
                    Protobuf.init({encoderProtos: self.clientProtos, decoderProtos: self.serverProtos});
                }
            }
            //Set protoversion
            self.handshakeBuffer.sys.protoVersion = self.protoVersion;

            function onopen(event) {
                if (!!self.reconnect) {
                    self.emit('reconnect');
                }
                self.reset();
                var obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(self.handshakeBuffer)));
                self.send(obj);
            };
            function onmessage(event) {
                self.processPackage(Package.decode(event.data));
                // new package arrived, update the heartbeat timeout
                if (self.heartbeatTimeout) {
                    self.nextHeartbeatTimeout = Date.now() + self.heartbeatTimeout;
                }
            };
            function onerror(event) {
                errorCb && errorCb(event);
                self.emit('io-error', event);
                console.error('socket error: ', event);
            };
            function onclose(event) {
                self.emit('close', event);
                self.emit('disconnect', event);
                console.error('socket close: ', event);
                if (!!params.reconnect && self.reconnectAttempts < self.maxReconnectAttempts) {
                    self.reconnect = true;
                    self.reconnectAttempts++;
                    self.reconncetTimer = setTimeout(function () {
                        connect();
                    }, self.reconnectionDelay);
                    self.reconnectionDelay *= 2;
                }
            };
            self.socket = new WebSocket(self.url);
            self.socket.binaryType = 'arraybuffer';
            self.socket.onopen = onopen;
            self.socket.onmessage = onmessage;
            self.socket.onerror = onerror;
            self.socket.onclose = onclose;
        }

        self.handlers = {};
        self.handlers[Package.TYPE_HANDSHAKE] = self.handshake.bind(self);
        self.handlers[Package.TYPE_HEARTBEAT] = self.heartbeat.bind(self);
        self.handlers[Package.TYPE_DATA] = self.onData.bind(self);
        self.handlers[Package.TYPE_KICK] = self.onKick.bind(self);

        connect(cb);
    };

    pomelo.prototype.defaultDecode = function (data) {
        var self = this;

        function deCompose(msg) {
            var route = msg.route;

            //Decompose route from dict
            if (msg.compressRoute) {
                if (!self.abbrs[route]) {
                    return {};
                }

                route = msg.route = self.abbrs[route];
            }
            if (Protobuf && self.serverProtos[route]) {
                return Protobuf.decodeStr(route, msg.body);
            } else if (decodeIO_decoder && decodeIO_decoder.lookup(route)) {
                return decodeIO_decoder.build(route).decode(msg.body);
            } else {
                return JSON.parse(Protocol.strdecode(msg.body));
            }

            return msg;
        };

        //probuff decode
        var msg = Message.decode(data);

        if (msg.id > 0) {
            msg.route = self.routeMap[msg.id];
            delete self.routeMap[msg.id];
            if (!msg.route) {
                return;
            }
        }

        msg.body = deCompose(msg);

        return msg;
    };

    pomelo.prototype.defaultEncode = function (reqId, route, msg) {
        var self = this, type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

        //compress message by protobuf
        if (Protobuf && self.clientProtos[route]) {
            msg = Protobuf.encode(route, msg);
        } else if (decodeIO_encoder && decodeIO_encoder.lookup(route)) {
            var Builder = decodeIO_encoder.build(route);
            msg = new Builder(msg).encodeNB();
        } else {
            msg = Protocol.strencode(JSON.stringify(msg));
        }

        var compressRoute = 0;
        if (self.dict && self.dict[route]) {
            route = self.dict[route];
            compressRoute = 1;
        }

        return Message.encode(reqId, type, compressRoute, route, msg);
    };

    pomelo.prototype.disconnect = function () {
        var self = this;

        if (self.socket) {
            if (self.socket.disconnect) self.socket.disconnect();
            if (self.socket.close) self.socket.close();
            console.log('disconnect');
            self.socket = null;
        }

        if (self.heartbeatId) {
            clearTimeout(self.heartbeatId);
            self.heartbeatId = null;
        }
        if (self.heartbeatTimeoutId) {
            clearTimeout(self.heartbeatTimeoutId);
            self.heartbeatTimeoutId = null;
        }
    };

    pomelo.prototype.reset = function () {
        var self = this;

        self.reconnect = false;
        self.reconnectionDelay = 1000 * 5;
        self.reconnectAttempts = 0;
        clearTimeout(self.reconncetTimer);
    };

    pomelo.prototype.request = function (route, msg, cb) {
        var self = this;

        if (arguments.length === 2 && typeof msg === 'function') {
            cb = msg;
            msg = {};
        } else {
            msg = msg || {};
        }
        route = route || msg.route;
        if (!route) {
            return;
        }

        self.reqId++;
        self.sendMessage(self.reqId, route, msg);

        self.callbacks[self.reqId] = cb;
        self.routeMap[self.reqId] = route;
    };

    pomelo.prototype.notify = function (route, msg) {
        var self = this;

        msg = msg || {};
        self.sendMessage(0, route, msg);
    };

    pomelo.prototype.sendMessage = function (reqId, route, msg) {
        var self = this;

        /* Since the client is used in intranet, crypt is not needed
         if (self.useCrypto) {
         msg = JSON.stringify(msg);
         var sig = window.rsa.signString(msg, "sha256");
         msg = JSON.parse(msg);
         msg['__crypto__'] = sig;
         }*/

        if (self.encode) {
            msg = self.encode(reqId, route, msg);
        }

        var packet = Package.encode(Package.TYPE_DATA, msg);
        self.send(packet);
    };

    pomelo.prototype.send = function (packet) {
        var self = this;

        if (self.socket)
            self.socket.send(packet.buffer);
    };

    pomelo.prototype.heartbeat = function (data) {
        var self = this;

        function heartbeatTimeoutCb() {
            var gap = self.nextHeartbeatTimeout - Date.now();
            if (gap > gapThreshold) {
                self.heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
            } else {
                console.error('server heartbeat timeout');
                self.emit('heartbeat timeout');
                self.disconnect();
            }
        };

        if (!self.heartbeatInterval) {
            // no heartbeat
            return;
        }

        var obj = Package.encode(Package.TYPE_HEARTBEAT);
        if (self.heartbeatTimeoutId) {
            clearTimeout(self.heartbeatTimeoutId);
            self.heartbeatTimeoutId = null;
        }

        if (self.heartbeatId) {
            // already in a heartbeat interval
            return;
        }
        self.heartbeatId = setTimeout(function () {
            self.heartbeatId = null;
            self.send(obj);

            self.nextHeartbeatTimeout = Date.now() + self.heartbeatTimeout;
            self.heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, self.heartbeatTimeout);
        }, self.heartbeatInterval);
    };

    pomelo.prototype.handshake = function (data) {
        var self = this;

        //Initilize data used in pomelo client
        function initData(data) {
            if (!data || !data.sys) {
                return;
            }
            self.dict = data.sys.dict;
            var protos = data.sys.protos;

            //Init compress dict
            if (self.dict) {
                self.abbrs = {};

                for (var route in self.dict) {
                    self.abbrs[self.dict[route]] = route;
                }
            }

            //Init protobuf protos
            if (protos) {
                self.protoVersion = protos.version || 0;
                self.serverProtos = protos.server || {};
                self.clientProtos = protos.client || {};

                //Save protobuf protos to localStorage
                exports.localStorage && exports.localStorage.setItem('protos', JSON.stringify(protos));

                if (!!Protobuf) {
                    Protobuf.init({encoderProtos: protos.client, decoderProtos: protos.server});
                }
            }
        };

        function handshakeInit(data) {
            if (data.sys && data.sys.heartbeat) {
                self.heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
                self.heartbeatTimeout = self.heartbeatInterval * 2;        // max heartbeat timeout
            } else {
                self.heartbeatInterval = 0;
                self.heartbeatTimeout = 0;
            }

            initData(data);

            if (typeof self.handshakeCallback === 'function') {
                self.handshakeCallback(data.user);
            }
        };

        data = JSON.parse(Protocol.strdecode(data));
        if (data.code === RES_OLD_CLIENT) {
            self.emit('error', 'client version not fullfill');
            return;
        }

        if (data.code !== RES_OK) {
            self.emit('error', 'handshake fail');
            return;
        }

        handshakeInit(data);

        var obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
        self.send(obj);
        if (self.initCallback) {
            self.initCallback(self.socket);
        }
    };

    pomelo.prototype.onData = function (data) {
        var self = this, msg = data;
        if (self.decode) {
            msg = self.decode(msg);
        }
        self.processMessage(msg);
    };

    pomelo.prototype.onKick = function (data) {
        var self = this;
        data = JSON.parse(Protocol.strdecode(data));
        self.emit('onKick', data);
    };

    pomelo.prototype.processPackage = function (msgs) {
        var self = this;

        if (Array.isArray(msgs)) {
            for (var i = 0; i < msgs.length; i++) {
                var msg = msgs[i];
                self.handlers[msg.type](msg.body);
            }
        } else {
            self.handlers[msgs.type](msgs.body);
        }
    };

    pomelo.prototype.processMessage = function (msg) {
        var self = this;

        if (!msg.id) {
            // server push message
            self.emit(msg.route, msg.body);
            return;
        }

        //if have a id then find the callback function with the request
        var cb = self.callbacks[msg.id];

        delete self.callbacks[msg.id];
        if (typeof cb !== 'function') {
            return;
        }

        cb(msg.body);
        return;
    };

    pomelo.prototype.processMessageBatch = function (msgs) {
        var self = this;

        for (var i = 0, l = msgs.length; i < l; i++) {
            self.processMessage(msgs[i]);
        }
    };
})('object' === typeof module ? module.exports : window, this);
