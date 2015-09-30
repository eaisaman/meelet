requirejs.config(
    {
        paths: {
            "velocity": VELOCITY_LIB_PATH + "velocity.min"
        },
        waitSeconds: 0
    }
);

define(
    [
            "velocity"
    ],
    function (Velocity) {
        window.Velocity = Velocity;

        return function () {
        }
    }
);