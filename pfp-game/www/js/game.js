var score;
var labelScore;

var currLevel;
var EL;
 
function preload() {
    this.load.image("floor", "img/floor.png");
    this.load.image("underground", "img/underground.png");
    this.load.spritesheet("character", "img/character.png", {frameWidth: 24, frameHeight: 48});
    this.load.image("obstacle", "img/obstacle.png");
    this.load.spritesheet("enemy", "img/enemy.png", {frameWidth: 16, frameHeight: 16});
    this.load.spritesheet("weapon", "img/weapon.png", {frameWidth: 2, frameHeight: 8})
}
 
function create() {
    this.physics.world.bounds.width = w;
    this.physics.world.bounds.height = h;
    
    currLevel = new Level(this);
    currLevel.addPlayer(gridHeight*ratio - 240, -24)
    currLevel.addGround(0, 128);
    currLevel.addObstacle(gridHeight*ratio, 116);
    currLevel.addTargetObject(gridHeight*ratio+8, Math.random()*64 - 32)

    // add event listeners for keys and touches.
    var cursors = this.input.keyboard.createCursorKeys();
    EL = new eventListeners(cursors, this);
    
    // cameras
    this.cameras.main.setBounds(0, 0, h, w);     
    this.cameras.main.setBackgroundColor('#ccccff'); 

    score = 0
    labelScore = this.add.text(10, 10, "0", { font: "100px Arial", fill: "#ffffff" })
    labelScore.setScale(0.2)
}
 
function update(time, delta) {
    // keep the floor under the player
    if (!currLevel.grounds.isFull()) {
        var groundChildren = currLevel.grounds.getChildren();
        var lastChildX = groundChildren[groundChildren.length-1].x;
        for (var i=currLevel.grounds.countActive(); i <= currLevel.grounds.maxSize; i++) {
            currLevel.addGroundColumn(lastChildX + (i-currLevel.grounds.countActive()+1)*8, 128)
        }
        // currLevel.levelSpeedAdder = score * 0.05;
        // console.log(currLevel.levelSpeedAdder);
    }

    EL.checkKeyboardEvents();

    // update score
    score += delta * 0.02
    labelScore.setText(Math.round(score))
}

function resetGame() {
    currLevel.scene.scene.restart();
    console.log("RESET");
}