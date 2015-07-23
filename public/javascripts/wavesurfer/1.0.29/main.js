requirejs.config(
    {
        paths: {
            "wavesurfer": WAVESURFER_LIB_PATH + "wavesurfer",
            "wavesurfer.util": WAVESURFER_LIB_PATH + "util",
            "wavesurfer.webaudio": WAVESURFER_LIB_PATH + "webaudio",
            "wavesurfer.mediaelement": WAVESURFER_LIB_PATH + "mediaelement",
            "wavesurfer.drawer": WAVESURFER_LIB_PATH + "drawer",
            "wavesurfer.drawer.canvas": WAVESURFER_LIB_PATH + "drawer.canvas"
        },
        shim: {
            "wavesurfer": {
                exports: "WaveSurfer"
            },
            "wavesurfer.util": {
                deps: ["wavesurfer"]
            },
            "wavesurfer.webaudio": {
                deps: ["wavesurfer", "wavesurfer.util"]
            },
            "wavesurfer.mediaelement": {
                deps: ["wavesurfer", "wavesurfer.util", "wavesurfer.webaudio"]
            },
            "wavesurfer.drawer": {
                deps: ["wavesurfer", "wavesurfer.util"]
            },
            "wavesurfer.drawer.canvas": {
                deps: ["wavesurfer", "wavesurfer.util", "wavesurfer.drawer"]
            }
        },
        waitSeconds: 0
    }
);

define(
    [
        "wavesurfer", "wavesurfer.util", "wavesurfer.webaudio", "wavesurfer.mediaelement", "wavesurfer.drawer", "wavesurfer.drawer.canvas"
    ],
    function () {
        //renderer WaveSurfer.Drawer.WaveVisualizer is initialized in directive ng.ui.wave.visualizer.js
        WaveSurfer.defaultParams.renderer = "WaveVisualizer";

        return function () {
        }
    }
);