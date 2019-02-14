var grid_width = 144;   
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
        w = document.documentElement.clientWidth
        h = document.documentElement.clientHeight
        ratio = w / h
        var config = {
            type: Phaser.AUTO,
            crisp: true,
            pixelArt: true,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: grid_width * ratio,
                height: grid_width
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: {y: 500},
                    debug: false
                }
            },
            scene: {
                key: 'main',
                preload: preload,
                create: create,
                update: update
            }
        };
        game = new Phaser.Game(config);
    }
};

app.initialize();