const MODELEVEL = 0;
const MODESTORY = 1;
const MODELEVELTRANSITION = 2;
const MODEMENU = 3;
const MODEGAMEOVER = 4;

var score;
var labelScore;

var currLevel;
var currLevelNumber = 0;
var currStory;
var EL;
var mode;
 
function preload() {
    this.load.image("floor", "img/floor.png");
    this.load.image("underground", "img/underground.png");
    this.load.spritesheet("character", "img/character.png", {frameWidth: 24, frameHeight: 48});
    this.load.image("obstacle", "img/obstacle.png");
    this.load.spritesheet("enemy", "img/enemy.png", {frameWidth: 16, frameHeight: 16});
    this.load.spritesheet("weapon", "img/weapon.png", {frameWidth: 2, frameHeight: 8});
    this.load.spritesheet("helper", "img/helper.png", {frameWidth: 48, frameHeight: 64});

    // load settings
    for (var i = 0; i < 1; i++) {
        this.load.json("level-" + i, "settings/level-" + i + ".json");
        this.load.json("story-" + i, "settings/story-" + i + ".json");
    }
}
 
function create() {
    this.physics.world.bounds.width = w;
    this.physics.world.bounds.height = h;
    
    mode = MODELEVEL;
    currLevel = new Level(this);
    $(currLevel).attr(this.cache.json.get("level-" + currLevelNumber));
    currLevel.levelCurrentSpeed = currLevel.levelInitSpeed;
    // currLevel.levelStop = true;

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

    score = 0;
    labelScore = this.add.text(10, 10, "0", { font: "100px Arial", fill: "#ffffff" });
    labelScore.setScale(0.2);
}
 
function update(time, delta) {
    // move the player on keypress.
    EL.checkKeyboardEvents();

    if (mode == MODELEVEL || mode == MODELEVELTRANSITION) {
        // keep the floor under the player
        if (!currLevel.grounds.isFull()) {
            var groundChildren = currLevel.grounds.getChildren();
            var lastChildX = groundChildren[groundChildren.length-1].x;
            var active = currLevel.grounds.countActive();
            var step = (gridHeight*ratio - 128) / 3; 
            for (var i=active; i < currLevel.grounds.maxSize; i+=step) {
                currLevel.addGroundColumn(lastChildX + (i-active+1)*8, 128)
            }
        }
        // during regular gameplay or transition, keep increasing score and gameplay speed.
        currLevel.levelCurrentSpeed = currLevel.levelInitSpeed;
        score += delta * 0.02;
        labelScore.setText(Math.round(score));
    }

    if (mode == MODELEVEL && score >= currLevel.levelEndScore) {
        // wait until player reaches desired score, then go to level transition.
        changeMode()
    }
    else if (mode == MODELEVELTRANSITION && currLevel.obstacles.countActive() == 0 && currLevel.targets.countActive() == 0) {
        // wait until there are no more obstacles and enemies on scene, then go to story.
        changeMode();
    }
    /* else if (mode == MODELEVELTRANSITION || mode == MODESTORY) {
        var groundChildren = currLevel.grounds.getChildren();
        var cunt = 0;
        for (var i = 0; i < groundChildren.length; i++) {
            if (groundChildren[i].body.velocity.x != 0) {
                cunt++;
            }
        }
        console.log(cunt);
        console.log(currLevel.grounds.countActive());
    }*/ 
}

function restartGame() {
    currLevel.scene.scene.restart();
    mode = MODEMENU;
}

function changeMode() {
    if (mode == MODELEVEL) {
        currLevel.levelStop = true; 

        currStory = new Story(currLevel.scene);
        $(currStory).attr(currStory.scene.cache.json.get("story-" + currLevelNumber));
        currStory.player = currLevel.player;
        currStory.grounds = currLevel.grounds;

        mode = MODELEVELTRANSITION;
        console.log("Go to level transition.");
    }
    else if (mode == MODELEVELTRANSITION) {
        currLevel.levelCurrentSpeed = 0;
        var groundChildren = currLevel.grounds.getChildren();
        for (var i = 0; i < groundChildren.length; i++) {
            groundChildren[i].body.setVelocityX(0);
        }
        
        currStory.createHelper(gridHeight*ratio - 32, gridHeight/2);
        mode = MODESTORY;
        console.log("Go to story.");
    }
    else if (mode == MODEGAMEOVER) {
        mode = MODEMENU;
    }
    else if (mode == MODESTORY) {
        currStory.letGo();
        // missing settings for next level.
        currLevel.levelStop = false;
        currLevel.levelEndScore = 100000;
        currLevel.levelCurrentSpeed = currLevel.levelInitSpeed;
    
        var groundChildren = currLevel.grounds.getChildren();
        for (var i = 0; i < groundChildren.length; i++) {
            groundChildren[i].body.setVelocityX(-currLevel.levelInitSpeed);
        }
        currLevel.addObstacle(gridHeight*ratio, 116);
        currLevel.addTargetObject(gridHeight*ratio+8, Math.random()*64 - 32)     
        mode = MODELEVEL;
    }
    else if (mode == MODEMENU) {
        mode = MODELEVEL;
    }
}