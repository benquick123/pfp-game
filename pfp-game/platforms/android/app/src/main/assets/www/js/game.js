
var map;
var player;
var cursors;
var groundLayer;
var text;
var scene;
var score;
var labelScore;
var level = 0;
var levelMultiplier = 1.0001
 
function preload() {
    this.load.image("world-tilemap", "img/world-tilemap.png")
    this.load.spritesheet("character", "img/character.png", {frameWidth: 24, frameHeight: 48})
    this.load.image("obstacle", "img/obstacle.png")
}
 
function create() {
    scene = this
    width_repeat = Math.floor(grid_width / 8) + 2
    height_repeat = Math.floor((width_repeat-2) / ratio)
    
    levels_v = []
    for (var i=0; i < height_repeat; i++) levels_v.push(-1)
    levels_v[levels_v.length-1] = 2
    levels_v[levels_v.length-2] = 1

    level = []
    for (var i=0; i < height_repeat; i++) {
        level_row = []
        for (var j=0; j < width_repeat; j++) {
            level_row.push(levels_v[i])
        }
        level.push(level_row)
    }
    map = this.make.tilemap({data: level, tileWidth: 16, tileHeight: 16})
    tiles = map.addTilesetImage("world-tilemap")
    groundLayer = map.createDynamicLayer(0, tiles, 0, 0)
    groundLayer.setCollisionByExclusion([-1])

    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;

    // take care of player
    player = this.physics.add.sprite(20, 10, 'character'); 
    player.setBounce(0.0);
    player.setCollideWorldBounds(true);

    this.physics.add.collider(groundLayer, player);

    // take care of obstacles
    this.obstacles = this.add.group()
    addObstacle(grid_width*ratio, 96)

    // add event listeners for keys and touches.
    cursors = this.input.keyboard.createCursorKeys();
    this.input.on("pointerdown", pointerDown);
    this.input.on("pointermove", pointerMove)
    this.input.on("pointerup", pointerUp)
    
    // cameras
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);     
    this.cameras.main.setBackgroundColor('#ccccff'); 

    score = 0
    labelScore = this.add.text(10, 10, "0", { font: "20px Arial", fill: "#ffffff" })
}
 
function update(time, delta) {
    checkKeyboardEvents(cursors)
    score += delta * 0.02
    labelScore.setText(Math.round(score))
}

function addObstacle(x, y) {
    var obstacle = scene.physics.add.sprite(x, y, "obstacle");
    scene.physics.add.collider(groundLayer, obstacle)
    scene.physics.add.collider(player, obstacle, resetGame)

    // Add velocity to the pipe to make it move left
    obstacle.body.velocity.x = -200 + levelMultiplier;
    levelMultiplier *= levelMultiplier 
    console.log(levelMultiplier)

    // Automatically kill the pipe when it's no longer visible 
    obstacle.checkWorldBounds = true;
    obstacle.outOfBoundsKill = true;

    scene.obstacles.add(obstacle)
    timer = scene.time.addEvent({
        delay: Math.random() * 800 + 700,
        callback: addObstacle,
        args: [grid_width*ratio, 96],
        loop: false
    })
}

function resetGame() {
    scene.scene.restart();
    level = 0;
    levelMultiplier = 1.0001
    console.log("RESET");
}