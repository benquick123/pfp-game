
function Level(scene) {
    this.scene = scene;
    this.levelNumber = 0;
    this.levelInitSpeed = 0;
    this.levelCurrentSpeed = 0;
    this.levelSpeedAdder = 0.0;
    this.levelEndScore = 0;
    this.levelStop = false;
    this.player;
    this.playerSprite = "";
    this.playerBounce = 0.0;
    this.enemySprites = [];
    this.grounds = this.scene.add.group()
    this.groundFloorImage = "";
    this.groundUnderImage = "";
    this.gravity = 500;
    this.obstacleSprite = "";
    this.obstacles = scene.add.group();
    this.targets = this.scene.add.group();
    this.weaponSprite = "";
    this.weaponAngularVelocity = 500;
    this.helperSprite = "";

    this.leftCollider = new Phaser.Physics.Arcade.Sprite(this.scene, 0, -16).setOrigin(0, 0);
    this.leftCollider.height = gridHeight + 32;
    this.leftCollider.x = -this.leftCollider.width-8;
    this.scene.add.existing(this.leftCollider);
    this.scene.physics.add.existing(this.leftCollider);

    this.rightCollider = new Phaser.Physics.Arcade.Sprite(this.scene, 0, 0).setOrigin(0, 0);
    this.rightCollider.height = gridHeight + 32;
    this.rightCollider.x = gridHeight*ratio + this.rightCollider.width + 8;
    this.scene.add.existing(this.rightCollider);
    this.scene.physics.add.existing(this.rightCollider);

    this.addPlayer = function(x, y) {
        this.player = this.scene.physics.add.sprite(x, y, this.playerSprite + "-walk"); 
        this.player.setBounce(this.playerBounce);
        this.player.setGravityY(500);

        this.scene.anims.create({
            key: 'playerwalk',
            frames: this.scene.anims.generateFrameNumbers(this.playerSprite + "-walk", { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1
        });

        this.scene.anims.create({
            key: "playerjumpup",
            frames: this.scene.anims.generateFrameNumbers(this.playerSprite + "-jump", { start: 0, end: 3}),
            frameRate: 8,
            repeat: 0
        });

        this.scene.anims.create({
            key: "playerjumpdown",
            frames: this.scene.anims.generateFrameNumbers(this.playerSprite + "-jump", { start: 3, end: 0}),
            frameRate: 8,
            repeat: 0
        })
    }

    this.addGroundColumn = function (x, y) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }

        var floor = this.scene.physics.add.image(x, y, this.groundFloorImage);
        this.scene.physics.add.collider(this.player, floor)
        this.scene.physics.add.overlap(floor, this.leftCollider, onOutOfBounds)

        floor.body.setVelocityX(-this.levelCurrentSpeed);
        floor.body.setImmovable();
        floor.body.setFriction(0.0);

        this.grounds.add(floor);

        for (var i=y+8; i<=gridHeight; i+=8) {
            var underground = this.scene.physics.add.sprite(x, i, this.groundUnderImage);
            this.scene.physics.add.overlap(underground, this.leftCollider, onOutOfBounds);

            underground.body.setVelocityX(-this.levelCurrentSpeed);
            this.grounds.add(underground);
        }
    }
    
    this.addGround = function (startX, startY) {
        for (var i=startX; i<=gridHeight*ratio+8; i+=8) {
            this.addGroundColumn(i, startY)
        }
        this.grounds.maxSize = this.grounds.getLength();
    }

    this.addObstacle = function (x, y) {
        if (!this.levelStop) {
            var onOutOfBounds = function(objectA, objectB) {
                objectA.destroy();
            }

            var obstacle = this.scene.physics.add.sprite(x, y, this.obstacleSprite);
            obstacle.setGravity(0);
            // this.scene.physics.add.collider(this.player, obstacle, restartGame);

            // Add velocity to the obstacle to make it move left
            obstacle.body.setVelocityX(-this.levelCurrentSpeed);

            this.scene.physics.add.overlap(obstacle, this.leftCollider, onOutOfBounds);

            this.obstacles.add(obstacle);
            
            var timer = this.scene.time.addEvent({
                delay: Math.random() * (1000) + (1000),
                callback: this.addObstacle,
                args: [gridHeight*ratio, 116],
                callbackScope: this,
                loop: false
            });
            obstacle.timer = timer;
        }
    }

    this.addTargetObject = function (x, y) {
        if (!this.levelStop) {
            var onOutOfBounds = function(objectA, objectB) {
                objectA.destroy();
            }
            
            // randomly select first or the second asset name.
            // var targetI = Math.floor(Math.random()*this.enemySprites.length);
            var targetI = 0;
            // create new animation based on configuration in lines 114-117.
            this.scene.anims.create({
                key: 'normal',
                frames: this.scene.anims.generateFrameNumbers(this.enemySprites[targetI], { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
            // add new target to scene.
            var target = this.scene.physics.add.sprite(x, y, this.enemySprites[targetI]);
            // play the animation.
            target.play("normal", true);
            target.setDepth(-4)
            
            this.scene.physics.add.collider(this.player, target, restartGame);
            this.scene.physics.add.collider(this.grounds, target);
            this.scene.physics.add.overlap(target, this.leftCollider, onOutOfBounds);
            this.scene.physics.add.overlap(target, this.rightCollider, onOutOfBounds);
            this.targets.add(target);
    
            var tween = this.scene.tweens.add({
                targets: target,
                x: -20,
                y: Math.random() * 32 + 88,
                ease: "Linear",
                loop: 0,
                duration: Math.random() * 4000 + 5000,
                onComplete: function(event) {
                    event.targets[0].destroy();
                }
            })
            target.tween = tween;
            
            var timer = this.scene.time.addEvent({
                delay: Math.random() * 2500 + 2000,
                callback: this.addTargetObject,
                callbackScope: this,
                args: [gridHeight*ratio+8, Math.random()*64 - 32],
                loop: false
            })
            target.timer = timer;
        }
    }

    this.shootWeapon = function(x, y, targetX, targetY) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }
        var onProjectileHit = function(objectA, objectB) {
            objectB.tween.stop();
            objectB.body.setGravity(currLevel.gravity);
        }

        var weapon = this.scene.physics.add.sprite(x, y, this.weaponSprite);
        weapon.setDepth(-5);
        this.scene.physics.add.overlap(weapon, this.rightCollider, onOutOfBounds);
        this.scene.physics.add.collider(weapon, this.targets, onProjectileHit);
        this.scene.physics.add.collider(weapon, this.player, restartGame);

        weapon.body.setAllowRotation();
        weapon.body.setAngularVelocity(this.weaponAngularVelocity)
        weapon.body.setGravity(this.gravity);

        var diffX = Math.abs(targetX - x);
        var diffY = Math.abs(targetY - y);
        angle = Math.atan((4*diffY) / (2*diffX));
        v0 = Math.sqrt(2*this.gravity*diffY) / Math.sin(angle);

        weapon.body.setVelocityX(v0 * Math.cos(angle));
        weapon.body.setVelocityY(-v0 * Math.sin(angle));
    }
}