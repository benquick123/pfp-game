
var eventListeners = function(cursors, scene) {
    this.cursors = cursors;

    // touch/click event listeners
    this.pointerDown = function(pointer) {
        this.isDown = true;
        this.pointX = pointer.x;
        this.pointY = pointer.y;
        this.moveType = "";
        this.df = 10;
    }

    this.pointerMove = function(pointer) {
        var diffX = pointer.x - this.pointX;
        var diffY = pointer.y - this.pointY;
        if (diffY < -this.df && Math.abs(diffY) > Math.abs(diffX) && currLevel.player.body.touching.down) {
            currLevel.player.body.setVelocityY(-250);
            this.moveType = "jump";
        }
    }

    this.pointerUp = function(pointer) {
        isDown = false;
        this.pointX = NaN;
        this.pointY = NaN;
        if (this.moveType != "jump") {
            if (pointer.y < 128 - 4)
                currLevel.shootWeapon(currLevel.player.x+12, currLevel.player.y-4, pointer.x, pointer.y);
        }
        this.moveType = "";
    }

    // keyboard event listeners
    this.checkKeyboardEvents = function() {
        if (this.cursors.up.isDown && currLevel.player.body.touching.down) {
            currLevel.player.body.setVelocityY(-250); // jump up
        }
    }

    scene.input.on("pointerdown", this.pointerDown);
    scene.input.on("pointermove", this.pointerMove);
    scene.input.on("pointerup", this.pointerUp);
}