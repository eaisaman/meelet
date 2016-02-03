requirejs.config(
    {
        paths: {
            "node-uuid": NODE_UUID_LIB_PATH + "uuid"
        },
        waitSeconds: 0
    }
);

define(
    [
        "node-uuid"
    ],
    function (uuid) {
        window.uuid = uuid;

        return function () {
        }
    }
);