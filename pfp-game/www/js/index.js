var gridHeight = 144;
var ratio;
var game;

var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        document.addEventListener("pause", onPause, false);
        document.addEventListener("resume", onResume, false);

        w = document.documentElement.clientWidth;
        h = document.documentElement.clientHeight;
        ratio = w / h;
        var config = {
            type: Phaser.AUTO,
            crisp: true,
            pixelArt: true,
            parent: "main-game-window",
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: Math.floor(gridHeight * ratio),
                height: gridHeight
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: {y: 0},
                    debug: false
                }
            },
            scene: {
                key: 'main',
                preload: preload,
                create: create,
                update: update
            },
            input: {
                activePointers: 1
            }
        };
        game = new Phaser.Game(config);

        $("#highscore-text").css("height", 12*h / gridHeight + "px");
        $("#highscore-text").css("width", 112*h / gridHeight + "px");
        $("#highscore-text").css("border", h / gridHeight + "px solid black");
        $("#highscore-text").css("padding", 2*h / gridHeight + "px");
        $("#highscore-text").css("font-size", 12*h / gridHeight + "px");
        $("#highscore-text").attr("placeholder", "@instagram_handle");
    }
};

function onPause() {
    if (currModeInstance && currModeInstance.music.isPlaying) {
        currModeInstance.music.pause();
    }
}

function onResume() {
    if (currModeInstance) {
        currModeInstance.music.resume();
    }
}

app.initialize();