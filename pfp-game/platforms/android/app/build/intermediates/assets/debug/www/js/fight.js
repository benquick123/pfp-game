
function Fight(environment) {
    this.environment = environment;
    
    this.bossSprite = "";
    this.bossPower = -1;
    this.bossStartingPositionOffset = [];
    this.bossMovementBB = [];
    this.bossEndingPositionOffset = [];
    this.bossTimeBetweenMovements = 2000;
    this.bossMovementTime = 4000;
    this.boss;

    this.enemySprites = [];
    this.enemies;
    this.enemyFlightTime = 5000;
    this.enemySpawningFrequency = 300;
    this.prevEnemies;

    this.hitCount = 0;
    this.hitCountGoal = 10;

    this.bossStartingPositionX = gridHeight*ratio;
    this.bossStartingPositionY = gridHeight/2;

    this.weaponSprite = "weapon-placeholder";

    this.initializeFight = function (modeInstance) {
        this.environment.currSpeed = this.speed == -1 ? modeInstance.currSpeed : this.speed;
        this.parallaxScrollFactor = this.parallaxScrollFactor == -1 ? modeInstance.parallaxScrollFactor : this.parallaxScrollFactor;
        this.jumpVelocity = this.jumpVelocity == -1 ? modeInstance.jumpVelocity : this.jumpVelocity;

        if (modeInstance.enemies) {
            this.prevEnemies = modeInstance.enemies;
            var prevEnemiesChildren = this.prevEnemies.getChildren();
            for (var i = 0; i < prevEnemiesChildren.length; i++)
                prevEnemiesChildren[i].timer.remove();
        }
        if (modeInstance.weaponAngularVelocity && this.weaponAngularVelocity == -1)
            this.weaponAngularVelocity = modeInstance.weaponAngularVelocity;
        if (modeInstance.backgroundIndex)
            this.environment.backgroundIndex = modeInstance.backgroundIndex;
        
        this.enemies = this.scene.add.group();

        this.addBoss();

        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.scene.input.on("pointerdown", this.onPointerDown, this);
    }

    this.addBoss = function() {
        this.boss = this.scene.physics.add.sprite(this.bossStartingPositionX + this.bossStartingPositionOffset[0], this.bossStartingPositionY + this.bossStartingPositionOffset[1], this.bossSprite);
        
        this.boss.setImmovable();

        var toX = this.bossStartingPositionX + Math.random()*(this.bossMovementBB[1][0] - this.bossMovementBB[0][0]) + this.bossMovementBB[0][0];
        var toY = Math.random()*(this.bossMovementBB[1][1] - this.bossMovementBB[0][1]) + this.bossMovementBB[0][1];
        this.addBossMovement(toX, toY);

        this.shootEnemy();
        
    }

    this.addBossMovement = function (toX, toY) {
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
                if (currModeInstance.boss.betweenMovementTimer) {
                    currModeInstance.boss.betweenMovementTimer.remove();
                }

                if (currModeInstance.hitCount < currModeInstance.hitCountGoal) {
                    var toX = currModeInstance.bossStartingPositionX + Math.random()*(currModeInstance.bossMovementBB[1][0] - currModeInstance.bossMovementBB[0][0]) + currModeInstance.bossMovementBB[0][0];
                    var toY = Math.random()*(currModeInstance.bossMovementBB[1][1] - currModeInstance.bossMovementBB[0][1]) + currModeInstance.bossMovementBB[0][1];
                    var betweenMovementTimer = currModeInstance.scene.time.addEvent({
                        delay: currModeInstance.bossTimeBetweenMovements,
                        callback: currModeInstance.addBossMovement,
                        callbackScope: currModeInstance,
                        args: [toX, toY],
                        loop: false
                    });
                    currModeInstance.boss.betweenMovementTimer = betweenMovementTimer;
                }
                else if (currModeInstance.hitCount >= currModeInstance.hitCountGoal){
                    if (currModeInstance.bossPower < 0)
                        currModeInstance.addBossMovement(currModeInstance.bossStartingPositionX + currModeInstance.bossEndingPositionOffset[0], currModeInstance.bossStartingPositionY/2 + currModeInstance.bossEndingPositionOffset[1]);
                }
                if (currModeInstance.boss.x == currModeInstance.bossStartingPositionX + currModeInstance.bossEndingPositionOffset[0] && 
                    currModeInstance.boss.y == currModeInstance.bossStartingPositionY/2 + currModeInstance.bossEndingPositionOffset[1]) {
                        currModeInstance.letGo();
                        changeMode();
                    }
            }
        });
        this.boss.tween = tween;
    }

    this.shootEnemy = function () {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }
        
        // randomly select first or the second asset name.
        var enemyI = Math.floor(Math.random()*this.enemySprites.length);
        // create new animation based on configuration in lines 114-117.
        this.scene.anims.remove("bossEnemy" + enemyI + "animation")
        this.scene.anims.create({
            key: "bossEnemy" + enemyI + "animation",
            frames: this.scene.anims.generateFrameNumbers(this.enemySprites[enemyI], { start: 0, end: 3 }),
            frameRate: 4,
            repeat: -1
        });
        // add new target to scene.
        var enemy = this.scene.physics.add.sprite(this.boss.x, this.boss.y, this.enemySprites[enemyI]);
        // play the animation.
        enemy.anims.play("bossEnemy" + enemyI + "animation", true);
        enemy.setDepth(-4);
        
        // this.scene.physics.add.collider(this.player, weapon, restartGame);
        // this.scene.physics.add.collider(this.grounds, enemy);
        this.scene.physics.add.overlap(enemy, this.leftCollider, onOutOfBounds);
        this.scene.physics.add.overlap(enemy, this.rightCollider, onOutOfBounds);
        this.scene.physics.add.overlap(enemy, this.bottomCollider, onOutOfBounds);
        this.enemies.add(enemy);

        var tween = this.scene.tweens.add({
            targets: enemy,
            x: -20,
            y: Math.random() * 16 + 104,
            ease: "Linear",
            loop: 0,
            duration: this.enemyFlightTime,
            onComplete: function(event) {
                event.targets[0].destroy();
            }
        });
        enemy.tween = tween;
        
        var timer = this.scene.time.addEvent({
            delay: this.enemySpawningFrequency,
            callback: this.shootEnemy,
            callbackScope: this,
            loop: false
        });
        enemy.timer = timer;
    }

    this.manageBossHits = function (objectA, objectB) {
        if (!objectB.scaleTween) {
            var tween = currModeInstance.scene.tweens.add({
                targets: objectB,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 80,
                ease: "Quad.easeInOut",
                yoyo: true,
                repeat: 0,
                onComplete: function () {
                    objectB.scaleTween = undefined;
                }
            });
            objectB.scaleTween = tween;
        }

        currModeInstance.hitCount++;

        if (currModeInstance.hitCount >= currModeInstance.hitCountGoal && currModeInstance.bossPower > 0) {
            var onOutOfBounds = function (objectA, objectB) {
                objectA.destroy();
            }
            currModeInstance.boss.setGravity(currModeInstance.gravity);
            currModeInstance.scene.physics.add.collider(currModeInstance.boss, currModeInstance.rightCollider, onOutOfBounds);
            currModeInstance.scene.physics.add.collider(currModeInstance.boss, currModeInstance.bottomCollider, onOutOfBounds);

            currModeInstance.letGo(false, false);
            changeMode();
        }
    }

    this.letGo = function (listeners, removeBoss) {
        if (this.boss.tween) {
            this.boss.tween.stop();
        }
        if (this.boss.betweenMovementTimer) {
            this.boss.betweenMovementTimer.remove();
        }

        var enemyChildren = this.enemies.getChildren();
        for (var i = 0; i < enemyChildren.length; i++) {
            enemyChildren[i].timer.remove();
        }

        if (removeBoss)
            this.boss.destroy();

        if (listeners)
            this.scene.input.off("pointerdown");
    }

    this.onPointerDown = function(pointer) {
        if (pointer.x < gridHeight*ratio/3 && this.jumpVelocity && this.player.anims.isPlaying) {
            this.player.anims.play("playerjump");
            this.player.body.setVelocityY(-this.jumpVelocity); // jump up
        }
        else if (pointer.x >= gridHeight*ratio/3) {
            if (pointer.y < this.groundYOffset - this.groundImageDimension/2)
                this.shootWeapon(this.player.x + this.player.width/2, this.player.y - 4, pointer.x, pointer.y);
        }
    }

    this.checkKeyboardEvents = function () {
        if (this.cursors.up.isDown && this.player.body.touching.down && this.jumpVelocity) {
            this.player.anims.play("playerjump");
            this.player.body.setVelocityY(-this.jumpVelocity); // jump up
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
        // weapon.setDepth();
        this.scene.physics.add.overlap(weapon, this.rightCollider, onOutOfBounds);
        this.scene.physics.add.collider(weapon, this.enemies, onProjectileHit);
        this.scene.physics.add.collider(weapon, this.prevEnemies, onProjectileHit);
        this.scene.physics.add.collider(weapon, this.boss, this.manageBossHits);

        weapon.body.setAllowRotation();
        weapon.setBounce(0.5);
        weapon.body.setAngularVelocity(this.weaponAngularVelocity);
        weapon.body.setGravityY(this.gravity);

        var diffX = Math.abs(targetX - x);
        var diffY = Math.abs(targetY - y);
        angle = Math.atan((4*diffY) / (2*diffX));
        v0 = Math.sqrt(2*this.gravity*diffY) / Math.sin(angle);

        weapon.body.setVelocityX(v0 * Math.cos(angle));
        weapon.body.setVelocityY(-v0 * Math.sin(angle));
    }
}