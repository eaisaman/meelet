requirejs.config(
    {
        paths: {
            "pomeloclient": POMELO_LIB_PATH + "pomeloclient",
            "socket.io": POMELO_LIB_PATH + "socket.io",
            "pomelo-websocket-client": POMELO_LIB_PATH + "pomelo-websocket-client",
            "pomelo-protocol": POMELO_LIB_PATH + "protocol"
        },
        shim: {
            "pomeloclient": {deps: ["socket.io"]},
            "pomelo-websocket-client": {deps: ["pomelo-protocol"]}
        },
        waitSeconds: 0
    }
);

define(
    [],
    function () {
        return function (options, cb) {
            if (window.pomelo) {
                cb && cb();
            } else {
                var jsLib;
                if (options && options.transport === "sio") {
                    jsLib = ["socket.io", "pomeloclient"];
                } else if (options && options.transport === "websocket") {
                    jsLib = ["pomelo-protocol", "pomelo-websocket-client"];
                }
                jsLib && require(jsLib, cb);
            }
        }
    }
);