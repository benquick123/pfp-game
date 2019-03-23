
function Level(environment) {
    const LEVELMODEOVER = 0;
    const LEVELMODEON = 1;

    this.environment = environment;
    this.levelEndScore = 0;
    this.levelMode = LEVELMODEOVER;

    this.enemySprites = [];
    this.enemyDimension = 24;
    this.enemyYRange = [-32, 88];
    this.enemyTimeRange = [2500, 4500];
    this.enemySpeedRange = [5000, 9000];
    this.enemies;

    this.obstacleSprite = "";
    this.obstacles;
    this.obstacleHeight = 16;
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
        this.addAnimations();

        this.obstacles = modeInstance ? modeInstance.obstacles : this.scene.add.group();
        this.enemies = modeInstance ? modeInstance.enemies : this.scene.add.group();

        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.scene.input.on("pointerdown", this.onPointerDown, this);
        // this.scene.input.keyboard.on("keydown-SPACE", function () { this.scene.scene.pause(); }, this);
        this.scoreText.setVisible(true);
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
    }

    this.addObstacle = function (x, y) {
        if (!this.isStopped) {
            var onOutOfBounds = function(objectA, objectB) {
                if (this.levelMode == LEVELMODEON && !objectA.isJumpedOn) {
                    gameOver();
                }
                objectA.destroy();
            }

            var obstacle = this.scene.physics.add.sprite(x, y, this.obstacleSprite);
            obstacle.setGravityY(this.gravity);
            obstacle.setImmovable();
            obstacle.setFrictionX(0);
            // this.scene.physics.add.collider(this.player, obstacle, this.onObstacleCollision, function(objectA, objectB) { return true; }, this);
            this.scene.physics.add.collider(this.grounds, obstacle, function (objectA, objectB) { 
                objectB.setGravity(0); 
                objectB.setVelocityY(0);
                objectB.y = this.groundYOffset-this.groundImageDimension/2-this.obstacleHeight/2; 
            }, null, this);

            // Add velocity to the obstacle to make it move left
            obstacle.body.setVelocityX(-this.currSpeed);

            this.scene.physics.add.overlap(obstacle, this.leftCollider, onOutOfBounds);

            this.obstacles.add(obstacle);
            
            var timer = this.scene.time.addEvent({
                delay: Math.random() * (this.obstacleTimeRange[1] - this.obstacleTimeRange[0]) + (this.obstacleTimeRange[0]),
                callback: this.addObstacle,
                args: [gridHeight*ratio + this.obstacleStartingXOffset, this.groundYOffset-this.groundImageDimension/2-this.obstacleHeight/2 + this.obstacleStartingYOffset],
                callbackScope: this,
                loop: false
            });
            obstacle.timer = timer;
        }
    }

    this.addEnemyObject = function (x, y) {
        if (!this.isStopped && this.enemySprites.length > 0) {
            var onOutOfBounds = function(objectA, objectB) {
                objectA.destroy();
            }
            
            // randomly select first or the second asset name.
            var enemyI = Math.floor(Math.random()*this.enemySprites.length);
            // create new animation based on configuration in lines 114-117.
            this.scene.anims.remove("enemy" + enemyI + "animation")
            this.scene.anims.create({
                key: "enemy" + enemyI + "animation",
                frames: this.scene.anims.generateFrameNumbers(this.enemySprites[enemyI], { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
            // add new target to scene.
            var enemy = this.scene.physics.add.sprite(x, y, this.enemySprites[enemyI]);
            // play the animation.
            enemy.anims.play("enemy" + enemyI + "animation", true);
            enemy.setDepth(-4);
            
            // this.scene.physics.add.collider(this.player, enemy, restartGame);
            // this.scene.physics.add.collider(this.grounds, enemy);
            this.scene.physics.add.overlap(enemy, this.leftCollider, onOutOfBounds);
            this.scene.physics.add.overlap(enemy, this.rightCollider, onOutOfBounds);
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
        }
    }

    this.shootWeapon = function(x, y, targetX, targetY) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }
        var onProjectileHit = function(objectA, objectB) {
            objectB.tween.stop();
            objectB.body.setGravityY(currModeInstance.gravity);
        }

        var weapon = this.scene.physics.add.sprite(x, y, this.weaponSprite);
        weapon.setDepth(-5);
        this.scene.physics.add.overlap(weapon, this.rightCollider, onOutOfBounds);
        this.scene.physics.add.collider(weapon, this.enemies, onProjectileHit);
        // this.scene.physics.add.collider(weapon, this.player, restartGame);

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
            restartGame();
        }
        else if (this.levelMode == LEVELMODEON) {
            if (objectB.body.touching.up) {
                objectB.isJumpedOn = true;
            }
            else {
                restartGame();
            }
        }
    }

    this.onPointerDown = function(pointer) {
        if (pointer.x < gridHeight*ratio/3) {
            this.player.anims.play("playerjump");
            this.player.body.setVelocityY(-this.jumpVelocity); // jump up
        }
        else {
            if (pointer.y < this.groundYOffset - this.groundImageDimension/2)
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