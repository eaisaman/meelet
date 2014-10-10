require.config(
    {
        paths: {
            "hammer": HAMMER_LIB_PATH + "hammer.min"
        }
    }
);

define(
    [
            "hammer"
    ],
    function (hammer) {
        window.Hammer = hammer;

        return function () {
        }
    }
);