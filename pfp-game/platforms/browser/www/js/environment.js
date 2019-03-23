function Environment (scene) {
    this.scene = scene;
    
    this.playerSprite = "character-placeholder";
    this.playerHeight = 24;
    this.playerXOffset = 210;
    this.player = undefined;
    this.playerBounce = 0;
    this.playerBoundsOffset = -2;
    this.playerAnimationFPS = 12;

    this.groundYOffset = 128;
    this.groundFloorImage = "floor-placeholder";
    this.groundUnderImage = "underground-placeholder";
    this.groundImageDimension = 8;
    this.grounds = scene.add.group();
    this.backgroundImage = ["background-placeholder"];
    this.backgroundImageWidth = 128;
    this.parallaxScrollFactor = 1.0;
    this.backgrounds = scene.add.group();

    this.isStopped = true;

    this.gravity = 500;
    this.currSpeed = 0;
    
    this.musicName = "";
    this.music = undefined;

    this.score = 0;
    this.scoreText = undefined;

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

    this.addPlayer = function(x, y) {
        console.log("adding player");
        this.player = this.scene.physics.add.sprite(x, y, this.playerSprite); 
        this.player.setBounce(this.playerBounce);
        this.player.setGravityY(this.gravity);
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

        this.grounds.add(floor);

        for (var i=y+this.groundImageDimension; i<=gridHeight; i+=this.groundImageDimension) {
            var underground = this.scene.physics.add.sprite(x, i, this.groundUnderImage);
            this.scene.physics.add.overlap(underground, this.leftCollider, onOutOfBounds);

            underground.body.setVelocityX(-this.currSpeed);
            this.grounds.add(underground);
        }
    }
    
    this.addGround = function (startX, startY) {
        for (var i=startX; i<=gridHeight*ratio+4*this.groundImageDimension; i+=this.groundImageDimension) {
            this.addGroundColumn(i, startY)
        }
        this.grounds.maxSize = this.grounds.getLength();
    }

    this.addBackgroundColumn = function (x, y) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }

        var backgroundImageI = Math.floor(Math.random() * this.backgroundImage.length);
        var background = this.scene.physics.add.sprite(x, y, this.backgroundImage[backgroundImageI]);
        background.setOrigin(0);
        background.setDepth(-10);
        this.scene.physics.add.overlap(background, this.extraLeftCollider, onOutOfBounds);

        background.body.setVelocityX(-this.currSpeed*this.parallaxScrollFactor);
        this.backgrounds.add(background);
    }
    
    this.addBackground = function () {
        for (var i = 0; i < gridHeight*ratio+this.backgroundImageWidth+1; i+=this.backgroundImageWidth) {
            this.addBackgroundColumn(i, 0);
        }
        this.backgrounds.maxSize = this.backgrounds.getLength();
    }

    this.initializeEnv = function () {
        this.addPlayer(gridHeight*ratio - this.playerXOffset, -this.playerHeight);
        this.addBackground();
        this.addGround(0, this.groundYOffset);

        console.log("Initialize env");
        this.score = 0;
        this.scoreText = this.scene.add.bitmapText(10, 10, "font20", this.score);
        this.scoreText.setVisible(false);
        this.scoreText.setFontSize(24);
        this.scoreText.setLetterSpacing(2);
    }

    this.stopGameplay = function () {
        this.isStopped = true;

        var groundChildren = this.grounds.getChildren();
        for (var i = 0; i < groundChildren.length; i++) {
            groundChildren[i].body.setVelocityX(0);
        }

        var backgroundChildren = this.backgrounds.getChildren();
        for (var i = 0; i < backgroundChildren.length; i++) {
            backgroundChildren[i].body.setVelocityX(0);
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

        var backgroundChildren = this.backgrounds.getChildren();
        for (var i = 0; i < backgroundChildren.length; i++) {
            backgroundChildren[i].body.setVelocityX(-this.currSpeed*this.parallaxScrollFactor);
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
    }

    this.updateGameplayDifficulty = function () {

    }
}