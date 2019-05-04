
function Level(environment) {
    const LEVELMODEOVER = 0;
    const LEVELMODEON = 1;

    this.environment = environment;
    this.levelEndScore = 0;
    this.levelMode = LEVELMODEOVER;
    this.levelTimers = [];

    this.enemySprites = [];
    this.enemyDimension = 24;
    this.enemyYRange = [-32, 88];
    this.enemyTimeRange = [2500, 4500];
    this.enemySpeedRange = [5000, 9000];
    this.enemies;

    this.bossSprite = "";
    this.bossMovementRangeYOffset = [0, 0]
    this.bossMovementXOffset = 0;
    this.bossStartingPositionOffset = [];
    this.bossEndingPositionOffset = [];
    this.bossTimeBetweenMovements = 2000;
    this.bossMovementTime = 4000;
    this.boss;
    this.bossIsDone = false;

    this.obstacleSprite = [];
    this.obstacleSequence = [];
    this.obstacleNumber = 0;
    this.obstacles;
    this.obstacleHeight = 24;
    this.obstacleWidth = 24;
    this.obstacleTimeRange = [1000, 2000];
    this.obstacleStartingXOffset = 0;
    this.obstacleStartingYOffset = 0;

    this.weaponSprite = "";
    this.weaponAngularVelocity = 500;

    this.jumpVelocity = 250;
    this.initSpeed = 0;

    this.cursors;

    this.initializeLevel = function (modeInstance) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }

        var onOutOfBoundsObstacle = function(objectA, objectB) {
            if (this.levelMode == LEVELMODEON && !objectA.isJumpedOn && collisionsOn) {
                gameOver();
            }
            objectA.destroy();
        }

        this.addAnimations();

        this.obstacles = modeInstance ? modeInstance.obstacles : this.scene.add.group();
        this.enemies = modeInstance ? modeInstance.enemies : this.scene.add.group();

        this.environment.backgroundImage = this.backgroundImage;
        this.environment.backgroundImageSpawner = this.backgroundImageSpawner;

        if (this.environment.backgrounds.length > this.environment.backgroundImage.length) {
            while (this.environment.backgrounds.length != this.environment.backgroundImage.length) {
                this.environment.backgroundIndex.splice(-1, 1);
                this.environment.backgrounds.splice(-1, 1);
            }
        }
        if (this.environment.backgrounds.length < this.environment.backgroundImage.length) {
            while (this.environment.backgrounds.length != this.environment.backgroundImage.length) {
                this.environment.backgroundIndex.push(this.environment.backgroundIndex[0]);
                this.environment.addBackground(this.environment.backgrounds.length);
                this.environment.backgroundIndex[this.environment.backgroundIndex.length-1] = this.environment.backgroundIndex[0];
            }
        }

        this.environment.groundFloorImage = this.groundFloorImage;
        this.environment.groundUnderImage = this.groundUnderImage;

        if (this.bossSprite != "") {
            this.addBoss();
        }

        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.scene.input.on("pointerdown", this.onPointerDown, this);
        this.scoreText.setVisible(true);

        this.environment.music.stop();
        this.environment.music = this.scene.sound.add(this.musicName, { loop: true });
        this.environment.music.play();

        this.scene.physics.add.overlap(this.enemies, this.leftCollider, onOutOfBounds);
        this.scene.physics.add.overlap(this.enemies, this.rightCollider, onOutOfBounds);
        this.scene.physics.add.overlap(this.enemies, this.bottomCollider, onOutOfBounds);

        this.scene.physics.add.overlap(this.obstacles, this.leftCollider, onOutOfBoundsObstacle, function(objectA, objectB) { return true; }, this);

        if (collisionsOn) {
            this.scene.physics.add.collider(this.player, this.obstacles, this.onObstacleCollision, function(objectA, objectB) { return true; }, this);
            this.scene.physics.add.collider(this.player, this.enemies, gameOver);
        }

        this.scene.physics.add.collider(this.player, this.grounds);
        this.scene.physics.add.overlap(this.grounds, this.leftCollider, onOutOfBounds);

        /* if (this.cameraShakeScoreOffset) {
            this.cameraShakeNext = this.cameraShakeScoreOffset + this.score;
        }*/ 
    }

    this.letGo = function (listeners) {
        if (listeners) {
            this.cursors = undefined;
            this.scene.input.off("pointerdown");
        }

        var obstaclesChildren = this.obstacles.getChildren();
        for (var i = 0; i < obstaclesChildren.length; i++) {
            obstaclesChildren[i].timer.remove();
        }
        var enemyChildren = this.enemies.getChildren();
        for (var i = 0; i < enemyChildren.length; i++) {
            enemyChildren[i].timer.remove();
        }

        if (this.bossSprite != "") {
            var toX = gridHeight*ratio + this.bossEndingPositionOffset[0];
            var toY = gridHeight/2 + this.bossEndingPositionOffset[1];
            this.addBossMovement(toX, toY);
            this.bossIsDone = true;
        }

        for (var i = 0; i < this.levelTimers.length; i++) {
            this.levelTimers[i].remove();
        }
    }

    this.addObstacle = function (x, y) {
        if (!this.isStopped && this.obstacleSprite.length > 0 && this.score + 24 < this.levelEndScore) {
            console.log(-this.currSpeed);
            var obstacleIndex = Math.floor(Math.random() * this.obstacleSprite.length);
            if (this.obstacleSequence.length > 0) {
                obstacleIndex = this.obstacleSequence[this.obstacleNumber % this.obstacleSequence.length];
                this.obstacleNumber++;
            }
            var obstacle = this.scene.physics.add.sprite(x, y, this.obstacleSprite[obstacleIndex]);
            obstacle.setImmovable();
            obstacle.setFrictionX(0);
            obstacle.setDepth(1);
            obstacle.isJumpedOn = false;
            
            if (this.scene.anims.generateFrameNumbers(this.obstacleSprite[obstacleIndex], { start: 0, end: 7 }).length > 0) {
                this.scene.anims.create({
                    key: this.obstacleSprite[obstacleIndex] + "animation",
                    frames: this.scene.anims.generateFrameNumbers(this.obstacleSprite[obstacleIndex], { start: 0, end: 7 }),
                    frameRate: 7,
                    repeat: -1
                });
                obstacle.anims.play(this.obstacleSprite[obstacleIndex] + "animation");
            }

            if (this.obstacleStartingYOffset < 0) {
                obstacle.setGravityY(this.gravity);
                this.scene.physics.add.collider(this.grounds, obstacle, function (objectA, objectB) { 
                    objectB.setGravity(0); 
                    objectB.setVelocityY(0);
                    objectB.y = this.groundYOffset-this.groundImageDimension/2-this.obstacleHeight/2; 
                }, null, this);
            }

            // Add velocity to the obstacle to make it move left
            obstacle.body.setVelocityX(-this.currSpeed);

            this.obstacles.add(obstacle);
            
            var timer = this.scene.time.addEvent({
                delay: Math.random() * (this.obstacleTimeRange[1] - this.obstacleTimeRange[0]) + (this.obstacleTimeRange[0]),
                callback: this.addObstacle,
                args: [gridHeight*ratio + this.obstacleStartingXOffset, this.groundYOffset-this.groundImageDimension/2-this.obstacleHeight/2 + this.obstacleStartingYOffset],
                callbackScope: this,
                loop: false
            });
            obstacle.timer = timer;
            this.levelTimers.push(timer);
        }
    }

    this.addEnemyObject = function (x, y) {
        if (!this.isStopped && this.enemySprites.length > 0 && currMode == MODELEVEL) {
            if (this.bossSprite != "") {
                x = this.boss.x;
                y = this.boss.y;
            }
            
            // randomly select first or the second asset name.
            var enemyI = Math.floor(Math.random()*this.enemySprites.length);
            // create new animation based on configuration in lines 114-117.
            // add new target to scene.
            var enemy = this.scene.physics.add.sprite(x, y, this.enemySprites[enemyI]);
            if (this.scene.anims.generateFrameNumbers(this.enemySprites[enemyI], { start: 0, end: 3 }).length > 0) {
                this.scene.anims.remove("enemy" + enemyI + "animation");
                this.scene.anims.create({
                    key: "enemy" + enemyI + "animation",
                    frames: this.scene.anims.generateFrameNumbers(this.enemySprites[enemyI], { start: 0, end: 3 }),
                    frameRate: 4,
                    repeat: -1
                });   
                enemy.anims.play("enemy" + enemyI + "animation", true);
            }
            enemy.setDepth(-4);
            
            // this.scene.physics.add.collider(this.grounds, enemy);
            this.enemies.add(enemy);
    
            var tween = this.scene.tweens.add({
                targets: enemy,
                x: -20,
                y: Math.random() * 16 + 104,
                ease: "Linear",
                loop: 0,
                duration: Math.random() * (this.enemySpeedRange[1] - this.enemySpeedRange[0]) + this.enemySpeedRange[0],
                onComplete: function(event) {
                    event.targets[0].destroy();
                }
            });
            enemy.tween = tween;
            
            var timer = this.scene.time.addEvent({
                delay: Math.random() * (this.enemyTimeRange[1] - this.enemyTimeRange[0]) + this.enemyTimeRange[0],
                callback: this.addEnemyObject,
                callbackScope: this,
                args: [x, Math.random()*(this.enemyYRange[1] - this.enemyYRange[0]) + this.enemyYRange[0]],
                loop: false
            });
            enemy.timer = timer;
            this.levelTimers.push(timer);
        }
    }

    this.addBoss = function() {
        this.boss = this.scene.physics.add.sprite(gridHeight*ratio + this.bossStartingPositionOffset[0], gridHeight/2 + this.bossStartingPositionOffset[1], this.bossSprite);
        
        this.boss.setImmovable();
        this.boss.stopMoving = false;

        var toX = gridHeight*ratio + this.bossMovementXOffset;
        var toY = Math.random() * (gridHeight+this.bossMovementRangeYOffset[1] - this.bossMovementRangeYOffset[0]) + this.bossMovementRangeYOffset[0];
        this.addBossMovement(toX, toY);
        
    }

    this.addBossMovement = function (toX, toY) {
        if (this.boss) {
            if (this.boss.tween) {
                this.boss.tween.stop();
                this.boss.tween = undefined;
            }
            var tween = this.scene.tweens.add({
                targets: this.boss,
                x: toX,
                y: toY,
                duration: this.bossMovementTime,
                onComplete: function () {
                    if (currMode == MODELEVEL) {
                        if (currModeInstance.boss && currModeInstance.boss.betweenMovementTimer) {
                            currModeInstance.boss.betweenMovementTimer.remove();
                        }
        
                        var toX = gridHeight*ratio + currModeInstance.bossMovementXOffset;
                        var toY = Math.random() * (gridHeight+currModeInstance.bossMovementRangeYOffset[1] - currModeInstance.bossMovementRangeYOffset[0]) + currModeInstance.bossMovementRangeYOffset[0];
                        var betweenMovementTimer = currModeInstance.scene.time.addEvent({
                            delay: currModeInstance.bossTimeBetweenMovements,
                            callback: currModeInstance.addBossMovement,
                            callbackScope: currModeInstance,
                            args: [toX, toY],
                            loop: false
                        });
                        if (currModeInstance.boss)
                            currModeInstance.boss.betweenMovementTimer = betweenMovementTimer;
                    }
                    else if ((currMode == MODESTORY && prevMode == MODELEVEL) || currModeInstance.bossIsDone || prevModeInstance.bossIsDone) {
                        prevModeInstance.boss.destroy();
                        prevModeInstance.boss = undefined;
                    }
                }
            });
            this.boss.tween = tween;
        }
    }

    this.shootWeapon = function(x, y, targetX, targetY) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }
        var onProjectileHit = function(objectA, objectB) {
            objectB.tween.stop();
            objectB.body.setGravityY(currModeInstance.gravity);
            this.scene.physics.add.collider(objectB, this.rightCollider, function (objectA, objectB) { objectA.destroy(); });
            this.scene.physics.add.collider(objectB, this.bottomCollider, function (objectA, objectB) { objectA.destroy(); });
        }

        var weapon = this.scene.physics.add.sprite(x, y, this.weaponSprite);
        weapon.setDepth(-5);
        this.scene.physics.add.overlap(weapon, this.rightCollider, onOutOfBounds);
        this.scene.physics.add.collider(weapon, this.enemies, onProjectileHit, function (objectA, objectB) { return true; }, this);
        // this.scene.physics.add.collider(weapon, this.player, gameOver);

        weapon.body.setAllowRotation();
        weapon.body.setAngularVelocity(this.weaponAngularVelocity)
        weapon.body.setGravityY(this.gravity);

        var diffX = Math.abs(targetX - x);
        var diffY = Math.abs(targetY - y);
        angle = Math.atan((4*diffY) / (2*diffX));
        v0 = Math.sqrt(2*this.gravity*diffY) / Math.sin(angle);

        weapon.body.setVelocityX(v0 * Math.cos(angle));
        weapon.body.setVelocityY(-v0 * Math.sin(angle));
    }

    this.onObstacleCollision = function (objectA, objectB) {
        if (this.levelMode == LEVELMODEOVER) {
            gameOver();
        }
        else if (this.levelMode == LEVELMODEON) {
            if (objectB.body.touching.up) {
                objectB.isJumpedOn = true;
            }
            else {
                gameOver();
            }
        }
    }

    this.onPointerDown = function(pointer) {
        if (pointer.x < gridHeight*ratio/3 && this.player.anims.isPlaying) {
            this.player.anims.play("playerjump");
            this.player.body.setVelocityY(-this.jumpVelocity); // jump up
        }
        else if (pointer.x >= gridHeight*ratio/3) {
            if (pointer.y < this.groundYOffset - this.groundImageDimension/2 && this.weaponSprite != "")
                this.shootWeapon(this.player.x + this.player.width/2, this.player.y - 4, pointer.x, pointer.y);
        }
    }

    this.checkKeyboardEvents = function () {
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.anims.play("playerjump");
            this.player.body.setVelocityY(-this.jumpVelocity); // jump up
        }
    }
}