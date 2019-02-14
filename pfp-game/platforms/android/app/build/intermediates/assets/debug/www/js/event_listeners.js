// touch event listeners
isDown = false;
pointX = NaN;
pointY = NaN;
df = 10;

function pointerDown(pointer) {
    isDown = true;
    pointX = pointer.x;
    pointY = pointer.y;
    console.log(pointer.y);
}

function pointerMove(pointer) {
    diffX = pointer.x - pointX;
    diffY = pointer.y - pointY;
    if (pointer.y+df < pointY && Math.abs(diffY) > Math.abs(diffX) && player.body.onFloor())
        player.body.setVelocityY(-200);
}

function pointerUp(pointer) {
    isDown = false;
    pointX = NaN;
    pointY = NaN;
}

// keyboard event listeners
function checkKeyboardEvents(cursors) {
    /*if (cursors.left.isDown) // if the left arrow key is down
    {
        player.body.setVelocityX(-20); // move left
    }
    else if (cursors.right.isDown) // if the right arrow key is down
    {
        player.body.setVelocityX(20); // move right
    }
    else {
        player.body.setVelocityX(0)
    }*/
    if (cursors.up.isDown && player.body.onFloor())
    {
        player.body.setVelocityY(-200); // jump up
    }
}