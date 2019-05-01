function Environment (scene) {
    this.scene = scene;
    
    this.playerSprite = "character-0";
    this.playerHeight = 24;
    this.playerXOffset = 210;
    this.player = undefined;
    this.playerBounce = 0;
    this.playerBoundsOffset = -2;
    this.playerAnimationFPS = 12;

    this.groundYOffset = 128;
    this.groundFloorImage = "floor-0";
    this.groundUnderImage = "underground-0";
    this.groundImageDimension = 8;
    this.grounds = scene.add.group();
    this.backgroundImage = [["background-0", "background-1", "background-2", "background-3", "background-4", "background-5", "background-6", "background-7"]];
    this.backgroundImageSpawner = ["sequential"];
    this.backgroundIndex = [2];
    this.backgroundImageWidth = 128;
    this.backgroundTrigger = "";
    this.fastBackground = false;
    this.parallaxScrollFactor = 1.0;
    this.backgrounds = [];
    this.customBackgroundPipeline = false;
    this.customBackgroundPipelineFadeIn = 0.0;
    this.cameraShakeScoreOffset = 500;
    this.cameraShakeScoreLength = 10;
    this.cameraShakeNext;
    this.customShaderBackgroundsStopped = false;

    this.cameraAdditional;

    this.isStopped = true;

    this.gravity = 500;
    this.currSpeed = 0;
    this.prevFactorT = 0;
    
    this.musicName = "";
    this.music = undefined;

    this.score = 0;
    this.scoreText = undefined;

    this.enemySpecial = false;

    this.colliderMagicNumber = 16
    this.leftCollider = new Phaser.Physics.Arcade.Sprite(this.scene, 0, -this.colliderMagicNumber).setOrigin(0, 0);
    this.leftCollider.height = gridHeight + 2*this.colliderMagicNumber;
    this.leftCollider.x = -this.leftCollider.width-2*this.colliderMagicNumber;
    this.scene.add.existing(this.leftCollider);
    this.scene.physics.add.existing(this.leftCollider);

    this.extraLeftCollider = new Phaser.Physics.Arcade.Sprite(this.scene, 0, -this.colliderMagicNumber).setOrigin(0, 0);
    this.extraLeftCollider.height = gridHeight + 2*this.colliderMagicNumber;
    this.extraLeftCollider.x = -this.leftCollider.width-this.backgroundImageWidth;
    this.scene.add.existing(this.extraLeftCollider);
    this.scene.physics.add.existing(this.extraLeftCollider);

    this.rightCollider = new Phaser.Physics.Arcade.Sprite(this.scene, 0, -this.colliderMagicNumber).setOrigin(0, 0);
    this.rightCollider.height = gridHeight + 2*this.colliderMagicNumber;
    this.rightCollider.x = gridHeight*ratio + this.rightCollider.width + 4*this.colliderMagicNumber;
    this.scene.add.existing(this.rightCollider);
    this.scene.physics.add.existing(this.rightCollider);

    this.bottomCollider = new Phaser.Physics.Arcade.Sprite(this.scene, -this.colliderMagicNumber, gridHeight+this.colliderMagicNumber).setOrigin(0, 0);
    this.bottomCollider.width = gridHeight * ratio * 2 * this.colliderMagicNumber;
    this.bottomCollider.x = -this.colliderMagicNumber;
    this.scene.add.existing(this.bottomCollider);
    this.scene.physics.add.existing(this.bottomCollider)

    this.addPlayer = function(x, y) {
        this.player = this.scene.physics.add.sprite(x, y, this.playerSprite); 
        this.player.setBounce(this.playerBounce);
        this.player.setGravityY(this.gravity);
        this.player.body.setSize(this.player.body.width-6, this.player.body.height);

        this.cameraAdditional.ignore(this.player);
    }

    this.addAnimations = function () {
        this.scene.anims.remove("playeridle");
        this.scene.anims.remove("playerwalk");
        this.scene.anims.remove("playerjump");
        this.scene.anims.remove("playertalk");

        this.scene.anims.create({
            key: 'playeridle',
            frames: this.scene.anims.generateFrameNumbers(this.playerSprite, { start: 0, end: 0 }),
            frameRate: this.playerAnimationFPS,
            repeat: 0
        });

        this.scene.anims.create({
            key: 'playerwalk',
            frames: this.scene.anims.generateFrameNumbers(this.playerSprite + "-walk", { start: 0, end: 8 }),
            frameRate: this.playerAnimationFPS,
            repeat: -1
        });

        this.scene.anims.create({
            key: "playerjump",
            frames: this.scene.anims.generateFrameNumbers(this.playerSprite + "-jump", { start: 0, end: 0}),
            frameRate: 8,
            repeat: 0
        });
        this.scene.anims.create({
            key: "playertalk",
            frames: this.scene.anims.generateFrameNumbers(this.playerSprite + "-talk", {start: 0, end: 4}),
            frameRate: 12,
            repeat: -1
        });
    }

    this.addGroundColumn = function (x, y) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }

        var floor = this.scene.physics.add.image(x, y, this.groundFloorImage);
        this.scene.physics.add.collider(this.player, floor);
        this.scene.physics.add.overlap(floor, this.leftCollider, onOutOfBounds);

        floor.body.setVelocityX(-this.currSpeed);
        floor.body.setImmovable();
        floor.body.setFriction(0);
        floor.setDepth(-2);
        this.cameraAdditional.ignore(floor);
        
        if (this.customBackgroundPipeline) {
            floor.setPipeline("distortionShader");
        }

        this.grounds.add(floor);

        for (var i=y+this.groundImageDimension; i<=gridHeight; i+=this.groundImageDimension) {
            var underground = this.scene.physics.add.sprite(x, i, this.groundUnderImage);
            this.scene.physics.add.overlap(underground, this.leftCollider, onOutOfBounds);

            underground.body.setVelocityX(-this.currSpeed);
            underground.setDepth(-2);
            this.cameraAdditional.ignore(underground);

            if (this.customBackgroundPipeline) {
                underground.setPipeline("distortionShader");
            }

            this.grounds.add(underground);
        }
    }
    
    this.addGround = function (startX, startY) {
        for (var i=startX; i<=gridHeight*ratio+4*this.groundImageDimension; i+=this.groundImageDimension) {
            this.addGroundColumn(i, startY)
        }
    }

    this.addBackgroundColumn = function (i, x, y) {
        var onOutOfBounds = function(objectA, objectB) {
            if (currModeInstance.backgrounds.length == 2 && currModeInstance.backgrounds[0].getChildren()[0].texture.key == currModeInstance.backgroundTrigger && !currModeInstance.fastBackground) {
                currModeInstance.fastBackground = true;
                var backgroundChildren = currModeInstance.backgrounds[1].getChildren();
                for (var j = 0; j < backgroundChildren.length; j++) {
                    backgroundChildren[j].body.setVelocityX(-currModeInstance.currSpeed * currModeInstance.parallaxScrollFactor * 1.5);
                }
            }
            else if (currModeInstance.backgrounds.length == 2 && currModeInstance.backgrounds[0].getChildren()[currModeInstance.backgrounds[0].getLength()-2].texture.key != currModeInstance.backgroundTrigger && currModeInstance.fastBackground) {
                currModeInstance.fastBackground = false;
                var backgroundChildren = currModeInstance.backgrounds[1].getChildren();
                for (var j = 0; j < backgroundChildren.length; j++) {
                    backgroundChildren[j].body.setVelocityX(-currModeInstance.currSpeed * Math.pow(currModeInstance.parallaxScrollFactor, 2));
                }
            }
            objectA.destroy();
        }
        
        var backgroundImageI = Math.floor(Math.random() * this.backgroundImage[i].length);
        if (this.backgroundImageSpawner[i] == "sequential") {
            backgroundImageI = this.backgroundIndex[i] % this.backgroundImage[i].length;
            this.backgroundIndex[i]++;
        }
        var background = this.scene.physics.add.sprite(x, y, this.backgroundImage[i][backgroundImageI]);
        background.setOrigin(0);
        background.setDepth(-(i+1)*10);

        this.scene.physics.add.overlap(background, this.extraLeftCollider, onOutOfBounds);

        this.cameraAdditional.ignore(background);
        
        background.body.setVelocityX(-this.currSpeed * Math.pow(this.parallaxScrollFactor, i+1));
        if (i == 1 && this.fastBackground)
            background.body.setVelocityX(-this.currSpeed * this.parallaxScrollFactor * 1.5);

        if (this.customBackgroundPipeline) {
            background.setPipeline("backgroundShader1");
        }

        this.backgrounds[i].add(background);
    }
    
    this.addBackground = function (i) {
        this.backgrounds.push(this.scene.add.group());

        var newChildPosition = 0;
        while (newChildPosition < gridHeight*ratio + 16) {
            this.addBackgroundColumn(i, newChildPosition, 0);
            var backgroundChildren = this.backgrounds[i].getChildren();
            lastChild = backgroundChildren[backgroundChildren.length-1];
            newChildPosition = lastChild.x + lastChild.width;
        }
    }

    this.initializeEnv = function () {
        this.cameraAdditional = this.scene.cameras.add();
        this.addPlayer(gridHeight*ratio - this.playerXOffset, -this.playerHeight);
        for (var i = 0; i < this.backgroundImage.length; i++) {
            this.addBackground(i);
        }
        this.addGround(0, this.groundYOffset);

        this.score = 0;
        this.scoreText = this.scene.add.bitmapText(10, 10, "font20", this.score);
        this.scoreText.setVisible(false);
        this.scoreText.setFontSize(24);
        this.scoreText.setLetterSpacing(2);
    }

    this.stopGameplay = function (stopAll) {
        this.isStopped = true;

        var groundChildren = this.grounds.getChildren();
        for (var i = 0; i < groundChildren.length; i++) {
            groundChildren[i].body.setVelocityX(0);
        }
        var toI = stopAll ? this.backgrounds.length : 1;
        for (var i = 0; i < toI; i++) {
            var backgroundChildren = this.backgrounds[i].getChildren();
            for (var j = 0; j < backgroundChildren.length; j++) {
                backgroundChildren[j].body.setVelocityX(0);
            }
        }

        this.player.anims.stop();
        this.player.anims.play("playeridle");
    }

    this.resumeGameplay = function (fromBeginning, animationsOnly) {
        this.isStopped = false;

        if (fromBeginning) {
            this.currSpeed = this.initSpeed;
        }

        var groundChildren = this.grounds.getChildren();
        for (var i = 0; i < groundChildren.length; i++) {
            groundChildren[i].body.setVelocityX(-this.currSpeed);
        }

        for (var i = 0; i < this.backgrounds.length; i++) {
            var backgroundChildren = this.backgrounds[i].getChildren();
            for (var j = 0; j < backgroundChildren.length; j++) {
                backgroundChildren[j].body.setVelocityX(-this.currSpeed * Math.pow(this.parallaxScrollFactor, i+1));
                if (i == 1 && this.fastBackground)
                    backgroundChildren[j].body.setVelocityX(-this.currSpeed * this.parallaxScrollFactor * 1.5);
            }
        }

        if (!animationsOnly) {    
            var obstaclesChildren = this.obstacles.getChildren();
            for (var i = 0; i < obstaclesChildren.length; i++) {
                obstaclesChildren[i].body.setVelocityX(-this.currSpeed);
            }
            this.addObstacle(gridHeight*ratio + this.obstacleStartingXOffset, this.groundYOffset-this.groundImageDimension/2-this.obstacleHeight/2 + this.obstacleStartingYOffset);
            this.addEnemyObject(gridHeight*ratio+this.enemyDimension/2, Math.random()*(this.enemyYRange[1]-this.enemyYRange[0]) + this.enemyYRange[0]);
        }
        
        this.player.anims.stop();
        this.player.anims.play("playerwalk", true);
        this.player.setGravityY(this.gravity);
    }

    this.updateGameplayDifficulty = function () {
        var s = this.score - this.levelInitScore;
        var factorT = Math.log(10+s)/Math.log(this.levelDifficultyFactor) - Math.log(10)/Math.log(this.levelDifficultyFactor);
        this.currSpeed = this.initSpeed + factorT;
        this.obstacleTimeRange[0] -= (factorT - this.prevFactorT) * 4;
        this.obstacleTimeRange[1] -= (factorT - this.prevFactorT) * 10;
        // console.log(this.obstacleTimeRange);
        this.updateBackgroundSpeeds();
        this.prevFactorT = factorT;

        this.enemyTimeRange[0] -= (factorT - this.prevFactorT) * 4;
        this.enemyTimeRange[1] -= (factorT - this.prevFactorT) * 10;

        this.enemySpeedRange[0] -= (factorT - this.prevFactorT) * 4;
        this.enemySpeedRange[1] -= (factorT - this.prevFactorT) * 10;
    }

    this.updateBackgroundSpeeds = function () {
        for (var i = 0; i < this.backgrounds.length; i++) {
            var backgroundChildren = this.backgrounds[i].getChildren();
            for (var j = 0; j < backgroundChildren.length; j++) {
                backgroundChildren[j].body.setVelocityX(-this.currSpeed * Math.pow(this.parallaxScrollFactor, i+1));
                if (i == 1 && this.fastBackground)
                    backgroundChildren[j].body.setVelocityX(-this.currSpeed * this.parallaxScrollFactor * 1.5);
            }
        }
    }
}