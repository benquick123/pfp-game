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
var currMenu;
var EL;
var mode;
 
function preload() {
    // load settings and assets per level
    for (var i = 0; i < 1; i++) {
        this.load.json("level-" + i, "settings/level-" + i + ".json");
        this.load.json("story-" + i, "settings/story-" + i + ".json");
        this.load.image("level-" + i +"-floor", "img/level-" + i + "-floor.png");
        this.load.image("level-" + i + "-underground", "img/level-" + i + "-underground.png");
        this.load.spritesheet("level-" + i + "-character", "img/level-" + i + "-character.png", {frameWidth: 24, frameHeight: 48});
        this.load.image("level-" + i + "-obstacle", "img/level-" + i + "-obstacle.png");

        for (var j = 0; j < 2; j++) {
            this.load.spritesheet("level-" + i + "-enemy-" + j, "img/level-" + i + "-enemy-" + j + ".png", {frameWidth: 24, frameHeight: 24});
        }
        this.load.spritesheet("level-" + i + "-weapon", "img/level-" + i + "-weapon.png", {frameWidth: 2, frameHeight: 8});
        this.load.spritesheet("story-" + i + "-helper", "img/story-" + i + "-helper.png", {frameWidth: 48, frameHeight: 64});
    }

    this.load.bitmapFont("font20", "fonts/font20.png", "fonts/font20.xml");
    this.load.bitmapFont("font20_1", "fonts/font20_1.png", "fonts/font20_1.xml");
}
 
function create() {
    this.physics.world.bounds.width = w;
    this.physics.world.bounds.height = h;
    
    mode = MODEMENU;
    currLevel = new Level(this);
    $(currLevel).attr(this.cache.json.get("level-" + currLevelNumber));
    // currLevel.levelStop = true;

    currLevel.addPlayer(gridHeight*ratio - 220  , -24)
    currLevel.addGround(0, 128);

    currMenu = new MainMenu(this);
    currMenu.createMenu(gridHeight*ratio/2, gridHeight/2);

    // add event listeners for keys and touches.
    var cursors = this.input.keyboard.createCursorKeys();
    EL = new EventListeners(cursors, this);
    
    // cameras
    this.cameras.main.setBounds(0, 0, h, w);     
    this.cameras.main.setBackgroundColor('#ccccff'); 

    score = 0;
    labelScore = this.add.bitmapText(10, 10, "font20", "");
    labelScore.setFontSize(24);
    labelScore.setLetterSpacing(2);
    // labelScore = this.add.text(10, 10, "", { font: "100px Arial", fill: "#ffffff" });
    // labelScore.setScale(0.2);
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
    else if (mode == MODELEVELTRANSITION && currLevel.obstacles.getChildren().length == 0 && currLevel.targets.getChildren().length == 0) {
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
    if (mode != MODEGAMEOVER && mode != MODEMENU) {
        mode = MODEGAMEOVER;
        changeMode();
    }
    // currLevel.scene.scene.restart();
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
        currLevel.player.anims.stop();
        var groundChildren = currLevel.grounds.getChildren();
        for (var i = 0; i < groundChildren.length; i++) {
            groundChildren[i].body.setVelocityX(0);
        }
        currStory.createHelper(gridHeight*ratio - 32, gridHeight/2);
        mode = MODESTORY;
        console.log("Go to story.");
    }
    else if (mode == MODEGAMEOVER) {
        currLevel.levelCurrentSpeed = 0;
        currLevel.player.anims.stop();
        var groundChildren = currLevel.grounds.getChildren();
        for (var i = 0; i < groundChildren.length; i++) {
            groundChildren[i].body.setVelocityX(0);
        }
        var obstaclesChildren = currLevel.obstacles.getChildren();
        for (var i = 0; i < obstaclesChildren.length; i++) {
            obstaclesChildren[i].body.setVelocityX(0);
        }
        var enemyChildren = currLevel.targets.getChildren();
        for (var i = 0; i < enemyChildren.length; i++) {
            enemyChildren[i].tween.stop();
            enemyChildren[i].anims.stop();
        }
        currLevel.levelStop = true;
        labelScore.setText("");

        currMenu = new LeaderboardMenu(currLevel.scene);
        currMenu.createMenu(gridHeight*ratio/2, gridHeight/2);
        currMenu.backRestart = true;
        mode = MODEMENU;
    }
    else if (mode == MODESTORY) {
        currStory.letGo();
        // missing settings for next level.
        currLevel.levelStop = false;
        currLevel.levelEndScore = 100000;
        currLevel.levelCurrentSpeed = currLevel.levelInitSpeed;
        currLevel.player.play("playerwalk");
    
        var groundChildren = currLevel.grounds.getChildren();
        for (var i = 0; i < groundChildren.length; i++) {
            groundChildren[i].body.setVelocityX(-currLevel.levelInitSpeed);
        }
        currLevel.addObstacle(gridHeight*ratio, 116);
        currLevel.addTargetObject(gridHeight*ratio+8, Math.random()*64 - 32)     
        mode = MODELEVEL;
    }
    else if (mode == MODEMENU) {
        currMenu = NaN;

        var groundChildren = currLevel.grounds.getChildren();
        for (var i = 0; i < groundChildren.length; i++) {
            groundChildren[i].body.setVelocityX(-currLevel.levelInitSpeed);
        }
        currLevel.levelCurrentSpeed = currLevel.levelInitSpeed;
        currLevel.addObstacle(gridHeight*ratio, 116);
        currLevel.addTargetObject(gridHeight*ratio+8, Math.random()*64 - 32);
        currLevel.player.play("playerwalk", true);

        mode = MODELEVEL;
    }
}