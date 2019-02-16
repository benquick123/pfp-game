
function Level(scene) {
    this.scene = scene;
    this.levelNumber = 0;
    this.levelInitSpeed = 100;
    this.levelSpeedAdder = 0.0;
    this.player;
    this.playerSprite = "character";
    this.playerBounce = 0.0;
    this.enemySprite = "enemy";
    this.grounds = this.scene.add.group()
    this.groundFloorImage = "floor";
    this.groundUnderImage = "underground";
    this.gravity = 500;
    this.obstacleSprite = "obstacle";
    this.obstacles = scene.add.group();
    this.targetSprite = "enemy";
    this.targetObjects = this.scene.add.group();
    this.weaponSprite = "weapon";
    this.weaponAngularVelocity = 500;
    this.weaponVelocityX = 200;
    this.weaponVelocityY = -500;

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
        this.player = this.scene.physics.add.sprite(x, y, this.playerSprite); 
        this.player.setBounce(this.playerBounce);
        this.player.setGravityY(500);
    }

    this.addGroundColumn = function (x, y) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }

        var floor = this.scene.physics.add.image(x, y, this.groundFloorImage);
        this.scene.physics.add.collider(this.player, floor)
        this.scene.physics.add.overlap(floor, this.leftCollider, onOutOfBounds)

        floor.body.setVelocityX(-this.levelInitSpeed - this.levelSpeedAdder);
        floor.body.setImmovable();
        floor.body.setFriction(0.0);

        this.grounds.add(floor)

        for (var i=y+8; i<=gridHeight+8; i+=8) {
            var underground = this.scene.physics.add.sprite(x, i, this.groundUnderImage);
            this.scene.physics.add.overlap(underground, this.leftCollider, onOutOfBounds);

            underground.body.setVelocityX(-this.levelInitSpeed - this.levelSpeedAdder);
            this.grounds.add(underground);
        }
    }
    
    this.addGround = function (startX, startY) {
        for (var i=startX; i<=gridHeight*ratio+16; i+=8) {
            this.addGroundColumn(i, startY, this.leftCollider)
        }
        this.grounds.maxSize = this.grounds.getLength();
    }

    this.addObstacle = function (x, y) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }

        var obstacle = this.scene.physics.add.sprite(x, y, this.obstacleSprite);
        obstacle.setGravity(0);
        this.scene.physics.add.collider(this.player, obstacle, resetGame);

        // Add velocity to the obstacle to make it move left
        obstacle.body.setVelocityX(-this.levelInitSpeed)

        this.scene.physics.add.overlap(obstacle, this.leftCollider, onOutOfBounds);

        this.obstacles.add(obstacle)
        this.scene.time.addEvent({
            delay: Math.random() * (1000) + (1000),
            callback: this.addObstacle,
            args: [gridHeight*ratio, 116],
            callbackScope: this,
            loop: false
        });
    }

    this.addTargetObject = function (x, y) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }

        var target = this.scene.physics.add.sprite(x, y, this.targetSprite);
        target.setDepth(-4)
        
        this.scene.physics.add.collider(this.player, target, resetGame);
        this.scene.physics.add.collider(this.grounds, target);
        this.scene.physics.add.overlap(target, this.leftCollider, onOutOfBounds);
        this.scene.physics.add.overlap(target, this.rightCollider, onOutOfBounds);
        this.targetObjects.add(target);

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

        this.scene.time.addEvent({
            delay: Math.random() * 2500 + 2000,
            callback: this.addTargetObject,
            callbackScope: this,
            args: [gridHeight*ratio+8, Math.random()*64 - 32],
            loop: false
        })
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
        this.scene.physics.add.collider(weapon, this.targetObjects, onProjectileHit);
        this.scene.physics.add.collider(weapon, this.player, resetGame);

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