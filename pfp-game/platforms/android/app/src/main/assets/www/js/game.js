const MODELEVEL = 0;
const MODESTORY = 1;
const MODELEVELTRANSITION = 2;
const MODEMENU = 3;
const MODEGAMEOVER = 4;
const MODEFIGHT = 5;
const STORYMODE = 6;
const ARCADEMODE = 7;

var gameplayModes, gameplayModesArcade;

var initMenuLoad = "mainMenu";
var currMode = -1;
var prevMode = -1;
var currModeInstance;
var prevModeInstance;
var gameplayMode = STORYMODE;

var collisionsOn = true;

var shaders;
 
function preload() {
    this.load.json("gameplay", "config/gameplay.json");
    this.load.json("gameplayArcade", "config/gameplay.arcade.json");

    // load settings and assets per level
    // settings files for levels, stories and fights
    for (var i = 0; i < 5; i++)
        this.load.json("level-" + i, "config/level-" + i + ".json");
    for (var i = 0; i < 12; i++)
        this.load.json("story-" + i, "config/story-" + i + ".json");
    for (var i = 0; i < 3; i++) 
        this.load.json("fight-" + i, "config/fight-" + i + ".json");
    
    for (var i = 0; i < 18; i++)
        this.load.image("background-" + i, "img/background-" + i + ".png");
    
    this.load.spritesheet("obstacle-0", "img/obstacle-0.png", {frameWidth: 48, frameHeight: 24});
    for (var i = 1; i < 5; i++)
        this.load.image("obstacle-" + i, "img/obstacle-" + i + ".png"); 

    for (var i = 0; i < 5; i++) {
        this.load.spritesheet("character-" + i, "img/character-" + i + ".png", {frameWidth: 24, frameHeight: 48});
        this.load.spritesheet("character-" + i + "-walk", "img/character-" + i + "-walk.png", {frameWidth: 24, frameHeight: 48});
        this.load.spritesheet("character-" + i + "-jump", "img/character-" + i + "-jump.png", {frameWidth: 24, frameHeight: 48});

        this.load.image("floor-" + i, "img/floor-" + i + ".png");
        this.load.image("underground-" + i, "img/underground-" + i + ".png");
    }

    for (var i = 0; i < 4; i++) {
        this.load.spritesheet("helper-" + i, "img/helper-" + i + ".png", {frameWidth: 48, frameHeight: 64});
        this.load.spritesheet("enemy-" + i, "img/enemy-" + i + ".png", {frameWidth: 24, frameHeight: 24});
        this.load.image("weapon-" + i, "img/weapon-" + i + ".png");
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
}
 
function create() {
    this.physics.world.bounds.width = w;
    this.physics.world.bounds.height = h;
    
    gameplayModes = this.cache.json.get("gameplay").slice(0);
    gameplayModesArcade = this.cache.json.get("gameplayArcade").slice(0);

    shaders = new CustomShaders(this);

    var environment = new Environment(this);
    environment.initializeEnv();

    Menu.prototype = environment;
    var menu = new Menu(environment);

    MainMenu.prototype = menu;
    GameModeSelectionMenu.prototype = menu;
    LeaderboardMenu.prototype = menu;
    EnterLeaderboardName.prototype = menu;
    CreditsMenu.prototype = menu;

    Level.prototype = environment;
    Story.prototype = environment;
    Fight.prototype = environment;

    currMode = MODEMENU;
    if (initMenuLoad == "mainMenu") {
        currModeInstance = new MainMenu(menu);
        currModeInstance.createMenu(gridHeight*ratio/2, gridHeight/2);
    }
    else if (initMenuLoad == "gameModeSelectionMenu") {
        currModeInstance = new GameModeSelectionMenu(menu);
        currModeInstance.createMenu();
    }
    prevModeInstance = undefined;
    
    // cameras
    this.cameras.main.setBounds(0, 0, w, h);     
    this.cameras.main.setBackgroundColor('black');
    this.cameras.main.setRenderToTexture(shaders.blackHoleShader);
    
}
 
function update(time, delta) {
    // keep the floor under the player
    if (currMode != MODEMENU && currMode != MODEGAMEOVER) {
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
    }

    if (currMode == MODELEVEL) {
        if (currModeInstance.player.body.touching.down && !currModeInstance.player.anims.isPlaying) {
            currModeInstance.player.anims.play("playerwalk");
        }
        currModeInstance.checkKeyboardEvents();
        currModeInstance.updateGameplayDifficulty();

        if (currModeInstance.customBackgroundPipeline) {
            if (!currModeInstance.customShaderBackgroundsStopped) {
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
    
                    if (stopBackground) {
                        currModeInstance.cameraShakeNext = currModeInstance.score;
                        currModeInstance.customShaderBackgroundsStopped = true;
                    }
                }
            }

            if (shaders.backgroundShader1) {
                shaders.backgroundShader1.setFloat1("time", shaders.shadersTime/1000.0);
                shaders.backgroundShader1.setFloat2("resolution", gridHeight*ratio, gridHeight);
            }

            if (shaders.trailShader) {
                if (stopBackground)
                    currModeInstance.scene.cameras.main.setRenderToTexture(shaders.trailShader);
                // shaders.distortionShader.setFloat1("time", shaders.shaderTime/1000.0);
                // shaders.distortionShader.setFloat2("resolution", 8.0, 8.0);
                var r = ((Math.sin(shaders.shadersTime/1000.0) * 5.0) + 5.0 - Math.random()*2.0 + 1.0) * currModeInstance.customBackgroundPipelineFadeIn;
                if (currModeInstance.customBackgroundPipelineFadeIn < 1.0) {
                    currModeInstance.customBackgroundPipelineFadeIn += delta/100000.0;
                }
                shaders.trailShader.setFloat1('radius', r);
                shaders.trailShader.setFloat2('dir', 5.0, 0.0);
                shaders.trailShader.setFloat1("time", shaders.shadersTime/1000.0);
            }
            shaders.shadersTime += delta;

            if (currModeInstance.isCameraShaking) {
                currModeInstance.scene.cameras.main.shake();
                if (currModeInstance.score > currModeInstance.cameraShakeNext + currModeInstance.cameraShakeScoreLength) {
                    currModeInstance.isCameraShaking = false;
                    currModeInstance.cameraShakeNext = currModeInstance.score + currModeInstance.cameraShakeScoreOffset + (Math.random() * 100 - 50);
                }

            }
            else {
                if (currModeInstance.score > currModeInstance.cameraShakeNext) {
                    currModeInstance.isCameraShaking = true;
                }
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
            
            currModeInstance.stopGameplay(false);
            currModeInstance.scene.input.on("pointerdown", currModeInstance.onPointerDown, currModeInstance);
            currModeInstance.registerSkipButton();
            currModeInstance.conversate();
        }
        else if (!currModeInstance.inConversation && !currModeInstance.speakersPositioned) {
            if (currModeInstance.player.body.touching.down && !currModeInstance.player.anims.isPlaying && !prevModeInstance.remainStillAfterEnd) {
                currModeInstance.player.anims.play("playerwalk");
            }

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

    var enemyChildren = [];
    if (currModeInstance.enemySpecial) {
        enemyChildren = currModeInstance.enemies.getChildren();
    }
    else if (prevModeInstance && prevModeInstance.enemySpecial) {
        enemyChildren = prevModeInstance.enemies.getChildren();
    }
    if (enemyChildren.length > 0 && (currModeInstance.enemySpecial || (prevModeInstance && prevModeInstance.enemySpecial))) {
        shaders.blackHoleShader.setFloat1("n_holes", enemyChildren.length);
        var i = 0;
        for (; i < enemyChildren.length; i++) {
            shaders.blackHoleShader.setFloat2("hole_coord" + i, enemyChildren[i].x, enemyChildren[i].y);
        }
        for (; i < 30; i++) {
            shaders.blackHoleShader.setFloat2("hole_coord" + i, 0, 0);
        }
        shaders.blackHoleReset = false;
    }
    else if (!shaders.blackHoleReset) {
        shaders.blackHoleShader.setFloat1("n_holes", 1);
        shaders.blackHoleShader.setFloat2("hole_coord0", -1000, 54);
        for (var i = 1; i < 30; i++) {
            shaders.blackHoleShader.setFloat2("hole_coord" + i, 0, 0);
        }
        shaders.blackHoleReset = true;
    }
}

function gameOver() {
    currModeInstance.stopGameplay(true);
    currModeInstance.music.stop();
    currModeInstance.scene.physics.world.colliders.destroy();

    currModeInstance.player.setGravity(0);
    currModeInstance.player.setVelocity(0);

    prevMode = currMode;
    currMode = MODEGAMEOVER;
    if (currModeInstance.obstacles) {
        var obstacleChildren = currModeInstance.obstacles.getChildren();
        for (var i = 0; i < obstacleChildren.length; i++) {
            obstacleChildren[i].body.setVelocityX(0);
            if (obstacleChildren[i].anims.isPlaying)
                obstacleChildren[i].anims.stop();
        }
    }

    if (prevModeInstance.obstacles) {
        var obstacleChildren = prevModeInstance.obstacles.getChildren();
        for (var i = 0; i < obstacleChildren.length; i++) {
            obstacleChildren[i].body.setVelocityX(0);
            if (obstacleChildren[i].anims.isPlaying)
                obstacleChildren[i].anims.stop();
        }
    }

    if (currModeInstance.enemies) {
        var enemyChildren = currModeInstance.enemies.getChildren();
        for (var i = 0; i < enemyChildren.length; i++) {
            if (enemyChildren[i].anims.isPlaying)
                enemyChildren[i].anims.stop();

            enemyChildren[i].tween.stop();
            enemyChildren[i].setVelocity(0);
            enemyChildren[i].timer.remove();
        }
    }

    if (prevModeInstance.enemies) {
        var enemyChildren = prevModeInstance.enemies.getChildren();
        for (var i = 0; i < enemyChildren.length; i++) {
            if (enemyChildren[i].anims.isPlaying)
                enemyChildren[i].anims.stop();

            enemyChildren[i].tween.stop();
            enemyChildren[i].setVelocity(0);
            enemyChildren[i].timer.remove();
        }
    }

    if (currModeInstance.boss) {
        currModeInstance.boss.tween.stop();
        currModeInstance.boss.setVelocity(0);
    }

    if (currModeInstance.healthMeter) {
        currModeInstance.healthMeter.clear();
    }
    
    if (currModeInstance.speakers) {
        var speakerChildren = currModeInstance.speakers.getChildren();
        for (var i = 0; i < speakerChildren.length; i++) {
            speakerChildren[i].setVelocity(0);
        }
    }

    prevModeInstance = currModeInstance;

    var menu = new Menu(prevModeInstance.environment);
    currModeInstance = new EnterLeaderboardName(menu);
    currModeInstance.createMenu(currModeInstance.environment.score);
}

function changeMode() {
    prevMode = currMode;
    if (gameplayMode == STORYMODE)
        var newMode = gameplayModes.shift();
    else 
        var newMode = gameplayModesArcade.shift();

    switch (newMode.split("-")[0]) {
        case "story": currMode = MODESTORY; break;
        case "level": currMode = MODELEVEL; break;
        case "fight": currMode = MODEFIGHT; break;
    }

    console.log("newMode", newMode);
    prevModeInstance = currModeInstance;
    var newAttrs = JSON.parse(JSON.stringify(currModeInstance.scene.cache.json.get(newMode)));
    
    if (currMode == MODELEVEL) {
        if (prevMode == MODELEVEL)
            prevModeInstance.letGo(true);

        currModeInstance = new Level(prevModeInstance.environment);
        $(currModeInstance).attr(newAttrs);
        
        currModeInstance.initializeLevel(currMode == prevMode ? prevModeInstance : undefined);
        currModeInstance.resumeGameplay(true);
    }
    else if (currMode == MODESTORY) {
        if (prevMode == MODELEVEL)
            prevModeInstance.letGo();

        currModeInstance = new Story(prevModeInstance.environment);
        $(currModeInstance).attr(newAttrs);

        currModeInstance.initializeStory(prevModeInstance);
        if (prevMode != MODESTORY || (prevMode == MODESTORY && !prevModeInstance.remainStillAfterEnd))
            currModeInstance.resumeGameplay(false, true);
    }
    else if (currMode == MODEFIGHT) {
        if (prevMode == MODELEVEL)
            prevModeInstance.letGo(true);
        
        currModeInstance = new Fight(prevModeInstance.environment);
        $(currModeInstance).attr(newAttrs);

        currModeInstance.initializeFight(prevModeInstance);
        currModeInstance.resumeGameplay(false, true);
    }

    if (newMode == "level-4") {
        window.localStorage.setItem("arcadeUnlock", true);
    }
}