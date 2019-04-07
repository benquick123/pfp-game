const MODELEVEL = 0;
const MODESTORY = 1;
const MODELEVELTRANSITION = 2;
const MODEMENU = 3;
const MODEGAMEOVER = 4;
const MODEFIGHT = 5;

var gameplayModes;

var currMode = -1;
var prevMode = -1;
var currModeInstance;
var prevModeInstance;

var shaders;
 
function preload() {
    this.load.json("gameplay", "config/gameplay.json");

    // load settings and assets per level
    for (var i = 0; i < 12; i++)
        this.load.json("story-" + i, "config/story-" + i + ".json");
    
    for (var i = 0; i < 16; i++)
        this.load.image("background-" + i, "img/background-" + i + ".png");
    
    this.load.spritesheet("obstacle-0", "img/obstacle-0.png", {frameWidth: 48, frameHeight: 24});
    for (var i = 1; i < 10; i++)
        this.load.image("obstacle-" + i, "img/obstacle-" + i + ".png"); 

    for (var i = 0; i < 10; i++) {
        this.load.json("level-" + i, "config/level-" + i + ".json");
        this.load.json("fight-" + i, "config/fight-" + i + ".json");

        this.load.image("floor-" + i, "img/floor-" + i + ".png");
        this.load.image("underground-" + i, "img/underground-" + i + ".png");
        
        this.load.spritesheet("character-" + i, "img/character-" + i + ".png", {frameWidth: 24, frameHeight: 48});
        this.load.spritesheet("character-" + i + "-walk", "img/character-" + i + "-walk.png", {frameWidth: 24, frameHeight: 48});
        this.load.spritesheet("character-" + i + "-jump", "img/character-" + i + "-jump.png", {frameWidth: 24, frameHeight: 48});
        
        this.load.image("obstacle-" + i, "img/obstacle-" + i + ".png");
        this.load.spritesheet("enemy-" + i, "img/enemy-" + i + ".png", {frameWidth: 24, frameHeight: 24});

        this.load.image("weapon-" + i, "img/weapon-" + i + ".png");

        this.load.spritesheet("helper-" + i, "img/helper-" + i + ".png", {frameWidth: 48, frameHeight: 64});
    }
    this.load.spritesheet("boss-0", "img/boss-0.png", {frameWidth: 48, frameHeight: 64});
    this.load.spritesheet("boss-1", "img/boss-1.png", {frameWidth: 54, frameHeight: 105});

    this.load.bitmapFont("font20", "fonts/font20.png", "fonts/font20.xml");
    this.load.bitmapFont("font12", "fonts/font12.png", "fonts/font12.xml");

    this.load.audio("chuhapuha", "audio/chuhapuha.mp3");
    this.load.audio("basic", "audio/basic.mp3");
    this.load.audio("slshr", "audio/slshr.mp3");
    this.load.audio("bff", "audio/bff.mp3");

    this.load.spritesheet("character-placeholder", "img/character-placeholder.png", {frameWidth: 24, frameHeight: 48});
    this.load.spritesheet("character-placeholder-walk", "img/character-placeholder-walk.png", {frameWidth: 24, frameHeight: 48});
    this.load.spritesheet("character-placeholder-jump", "img/character-placeholder-jump.png", {frameWidth: 24, frameHeight: 48});
    this.load.image("floor-placeholder", "img/floor-placeholder.png");
    this.load.image("underground-placeholder", "img/underground-placeholder.png");
    this.load.image("background-placeholder", "img/background-placeholder.png");
    this.load.image("obstacle-placeholder", "img/obstacle-placeholder.png");
    this.load.spritesheet("enemy-placeholder", "img/enemy-placeholder.png", {frameWidth: 24, frameHeight: 24});
    this.load.image("weapon-placeholder", "img/weapon-placeholder.png");
    this.load.spritesheet("helper-placeholder", "img/helper-placeholder.png", {frameWidth: 48, frameHeight: 64});
    this.load.spritesheet("boss-placeholder", "img/boss-placeholder.png", {frameWidth: 48, frameHeight: 64});
}
 
function create() {
    this.physics.world.bounds.width = w;
    this.physics.world.bounds.height = h;
    
    gameplayModes = this.cache.json.get("gameplay");

    var environment = new Environment(this);
    environment.initializeEnv();

    Menu.prototype = environment;
    var menu = new Menu(environment);

    MainMenu.prototype = menu;
    LeaderboardMenu.prototype = menu;
    EnterLeaderboardName.prototype = menu;
    CreditsMenu.prototype = menu;

    Level.prototype = environment;
    Story.prototype = environment;
    Fight.prototype = environment;

    shaders = new customShaders(this);

    currMode = MODEMENU;
    currModeInstance = new MainMenu(menu);
    currModeInstance.createMenu(gridHeight*ratio/2, gridHeight/2);
    prevModeInstance = undefined;
    
    // cameras
    this.cameras.main.setBounds(0, 0, h, w);     
    this.cameras.main.setBackgroundColor('black'); 


}
 
function update(time, delta) {
    // keep the floor under the player
    var groundChildren = currModeInstance.grounds.getChildren();
    var lastChild = groundChildren[groundChildren.length-1];
    if (lastChild.x < gridHeight*ratio + 16) {
        while (lastChild.x < gridHeight*ratio + 16) {
            currModeInstance.addGroundColumn(lastChild.x + lastChild.width, currModeInstance.groundYOffset);
            groundChildren = currModeInstance.grounds.getChildren();
            lastChild = groundChildren[groundChildren.length-1];
        }
    }
    // keep background behind player
    for (var i = 0; i < currModeInstance.backgrounds.length; i++) {
        var backgroundChildren = currModeInstance.backgrounds[i].getChildren();
        var lastChild = backgroundChildren[backgroundChildren.length-1];
        if (lastChild.x < gridHeight*ratio + 16 && currModeInstance.parallaxScrollFactor > 0.0) {
            while (lastChild.x < gridHeight*ratio + 16) {
                currModeInstance.addBackgroundColumn(i, lastChild.x + lastChild.width, 0);
                backgroundChildren = currModeInstance.backgrounds[i].getChildren();
                lastChild = backgroundChildren[backgroundChildren.length-1]
            }
        }
    }

    if (currMode == MODELEVEL) {
        currModeInstance.checkKeyboardEvents();
        if (currModeInstance.player.body.touching.down && !currModeInstance.player.anims.isPlaying) {
            currModeInstance.player.anims.play("playerwalk");
        }

        if (currModeInstance.customBackgroundPipeline) {
            for (var i = 0; i < currModeInstance.backgrounds.length; i++) {
                backgroundChildren = currModeInstance.backgrounds[i].getChildren();
                var stopBackground = false;
                for (var j = 0; j < backgroundChildren.length; j++) {
                    if (backgroundChildren[j].frame.texture.key == currModeInstance.backgroundImage[0] && backgroundChildren[j].x <= 0.0) {
                        stopBackground = true;
                    }
                }
                for (var j = 0; j < backgroundChildren.length; j++) {
                    if (stopBackground) {
                        currModeInstance.parallaxScrollFactor = 0.0;
                        backgroundChildren[j].setVelocityX(0.0);
                        backgroundChildren[j].setX(0.0);
                    }
                }
            }

            if (shaders.backgroundShader) {
                shaders.backgroundShader.setFloat1("time", shaders.shadersTime/1000.0);
                shaders.backgroundShader.setFloat2("resolution", gridHeight*ratio, gridHeight);
                
                shaders.shadersTime += delta;
            }

        }

        // during regular gameplay, keep increasing score.
        currModeInstance.environment.score += delta * 0.02;
        currModeInstance.environment.scoreText.setText(Math.round(currModeInstance.score));

        if (currModeInstance.score >= currModeInstance.levelEndScore) {
            changeMode();
        }
    }
    else if (currMode == MODESTORY) {
        if (!currModeInstance.inConversation && currModeInstance.speakersPositioned && 
            ((prevMode == MODELEVEL && prevModeInstance.enemies.getLength() == 0 && prevModeInstance.obstacles.getLength() == 0) || 
            prevMode == MODESTORY || 
            (prevMode == MODEFIGHT && prevModeInstance.enemies.getLength() == 0))) { 
            if (prevMode == MODELEVEL || prevMode == MODEFIGHT)
                prevModeInstance.letGo(true, true);
            
            currModeInstance.stopGameplay();
            currModeInstance.scene.input.on("pointerdown", currModeInstance.onPointerDown, currModeInstance);
            currModeInstance.conversate();
        }
        else if (!currModeInstance.inConversation && !currModeInstance.speakersPositioned) {
            var allSpeakersPositioned = true;
            if (currModeInstance.playerIsSpeaker0) {
                allSpeakersPositioned = currModeInstance.player.x <= currModeInstance.speakerStartingPositionX - currModeInstance.playerXOffset + 
                    currModeInstance.speakersStartingPositionsOffsets[0][0] + currModeInstance.speakersEndingPositionsOffsets[0][0] ? false : true;
                allSpeakersPositioned = !currModeInstance.player.body.touching.down ? false : true;
            }
            var speakerChildren = currModeInstance.speakers.getChildren();
            for (var i = 0+currModeInstance.playerIsSpeaker0; i < currModeInstance.nSpeakers; i++) {
                if (speakerChildren[i-currModeInstance.playerIsSpeaker0].x >
                        currModeInstance.speakerStartingPositionX + currModeInstance.speakersStartingPositionsOffsets[i][0] + 
                        currModeInstance.speakersEndingPositionsOffsets[i][0]) {
                    allSpeakersPositioned = false;
                }
                else {
                    speakerChildren[i-currModeInstance.playerIsSpeaker0].x = currModeInstance.speakerStartingPositionX + currModeInstance.speakersStartingPositionsOffsets[i][0] + currModeInstance.speakersEndingPositionsOffsets[i][0];
                    speakerChildren[i-currModeInstance.playerIsSpeaker0].y = currModeInstance.speakerStartingPositionY + currModeInstance.speakersStartingPositionsOffsets[i][1] + currModeInstance.speakersEndingPositionsOffsets[i][1];
                    speakerChildren[i-currModeInstance.playerIsSpeaker0].setVelocity(0);
                }
            }
            
            if (allSpeakersPositioned) {
                currModeInstance.speakersPositioned = true;
            }
        }
        else if (currModeInstance.inConversation && currModeInstance.speakersPositioned && 
            currModeInstance.dialogueIndex == currModeInstance.dialogues.length &&
            currModeInstance.player.finalPositionX && currModeInstance.player.finalPositionX >= currModeInstance.player.x) {
                currModeInstance.player.x = currModeInstance.player.finalPositionX;
                currModeInstance.player.setVelocityX(0);
                changeMode();
        }
    }
    else if (currMode == MODEFIGHT) {
        currModeInstance.checkKeyboardEvents();
        if (currModeInstance.player.body.touching.down && !currModeInstance.player.anims.isPlaying) {
            currModeInstance.player.anims.play("playerwalk");
        }
    }
}

function restartGame() {
    currModeInstance.scene.scene.pause();
    console.log("GAME OVER");
}

function changeMode() {
    prevMode = currMode;
    var newMode = gameplayModes.shift();
    switch (newMode.split("-")[0]) {
        case "story": currMode = MODESTORY; break;
        case "level": currMode = MODELEVEL; break;
        case "fight": currMode = MODEFIGHT; break;
    }
    
    console.log("newMode", newMode);
    prevModeInstance = currModeInstance;
    
    if (currMode == MODELEVEL) {
        if (prevMode == MODELEVEL)
            prevModeInstance.letGo(true);

        currModeInstance = new Level(prevModeInstance.environment);
        $(currModeInstance).attr(currModeInstance.scene.cache.json.get(newMode));
        
        currModeInstance.initializeLevel(currMode == prevMode ? prevModeInstance : undefined);
        currModeInstance.resumeGameplay(true);
    }
    else if (currMode == MODESTORY) {
        if (prevMode == MODELEVEL)
            prevModeInstance.letGo();

        if (prevMode == MODELEVEL && prevModeInstance.bossSprite != "") {
            var toX = gridHeight*ratio + prevModeInstance.bossEndingPositionOffset[0];
            var toY = gridHeight/2 + prevModeInstance.bossEndingPositionOffset[1];
            prevModeInstance.addBossMovement(toX, toY);
        }

        currModeInstance = new Story(prevModeInstance.environment);
        $(currModeInstance).attr(currModeInstance.scene.cache.json.get(newMode));

        currModeInstance.initializeStory(prevModeInstance);
        if (prevMode != MODESTORY || (prevMode == MODESTORY && !prevModeInstance.remainStillAfterEnd))
            currModeInstance.resumeGameplay(false, true);
    }
    else if (currMode == MODEFIGHT) {
        if (prevMode == MODELEVEL)
            prevModeInstance.letGo(true);
        
        currModeInstance = new Fight(prevModeInstance.environment);
        $(currModeInstance).attr(currModeInstance.scene.cache.json.get(newMode));

        currModeInstance.initializeFight(prevModeInstance);
        currModeInstance.resumeGameplay(false, true);
    }
}