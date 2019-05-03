
function Story(environment) {
    this.environment = environment;
    
    this.dialogues = [];
    this.dialogueIndex = 0;
    this.dialogueBox;
    
    this.graphics = this.scene.add.graphics();

    this.currSpeaker;
    this.currText;
    this.currDialogueWidth;

    this.speed = -1;
    this.parallaxScrollFactor = -1;

    this.nSpeakers = 2;
    this.speakers = undefined;

    this.speakerStartingPositionX = gridHeight*ratio;
    this.speakerStartingPositionY = gridHeight/2;
    this.speakersStartingPositionsOffsets = [];
    this.speakersEndingPositionsOffsets = [];
    this.speakerSprites = [];
    this.speakerFlipX = [];
    this.speakersDead = 0;
    this.stayingSpeaker = 0;
    this.stayingSpeakerPosition = 0;
    this.stayingSpeakerHeight = 48;
    this.speakersDieImmediately = [];
    this.speakersImmediateDeathDirection = [];
    this.playerIsSpeaker0 = true;

    this.inConversation = false;
    this.speakersPositioned = false;
    this.remainStillAfterEnd = false;

    this.skipText;

    this.initializeStory = function (modeInstance) {
        var onOutOfBounds = function(objectA, objectB) {
            objectA.destroy();
        }
        
        this.environment.currSpeed = this.speed == -1 ? modeInstance.currSpeed : this.speed;
        this.parallaxScrollFactor = this.parallaxScrollFactor == -1 ? modeInstance.parallaxScrollFactor : this.parallaxScrollFactor;
        this.gravity = this.gravity == -1 ? modeInstance.gravity : this.gravity;
        this.environment.fastBackground = modeInstance.fastBackground;

        if (modeInstance.backgroundIndex)
            this.environment.backgroundIndex = modeInstance.backgroundIndex;

        this.speakers = this.scene.add.group();
        if (this.playerIsSpeaker0) {
            this.environment.playerSprite = this.speakerSprites[0];
            this.addAnimations();
        }
        
        for (var i = this.playerIsSpeaker0 ? 1 : 0; i < this.nSpeakers; i++) {
            this.createSpeaker(this.speakersStartingPositionsOffsets[i][0],
                                this.speakersStartingPositionsOffsets[i][1],
                                this.speakersEndingPositionsOffsets[i][0], 
                                this.speakersEndingPositionsOffsets[i][1], 
                                this.speakerSprites[i], 
                                this.speakerFlipX[i]);
        }

        this.scene.physics.add.collider(this.player, this.grounds);
        this.scene.physics.add.overlap(this.grounds, this.leftCollider, onOutOfBounds);
    }

    this.createSpeaker = function (xOffset, yOffset, xOffsetEnd, yOffsetEnd, speakerSprite, flipX) {
        var speaker = this.scene.physics.add.sprite(this.speakerStartingPositionX + xOffset, this.speakerStartingPositionY + yOffset, speakerSprite);
        speaker.setVelocityX(-this.currSpeed);
        speaker.setGravity(0);
        speaker.setFlipX(flipX);
        speaker.setDepth(-1);

        // add animations for speaker

        this.speakers.add(speaker);
    }

    this.registerSkipButton = function () {
        var onButtonPressed = function (pointer, localX, localY, event) {
            event.stopPropagation();
            var timer = this.scene.time.addEvent({
                delay: 32,
                callback: function () {
                    if (this.isTinted)
                        this.clearTint();
                    else
                        this.setTintFill("black");
                    
                    if (this.timer.getRepeatCount() == 0) {
                        this.off("pointerdown", NaN);
                        this.removeAllListeners();
                        this.destroy();
                        currModeInstance.dialogueIndex = currModeInstance.dialogues.length;
                        currModeInstance.conversate();
                    }
                },
                callbackScope: this.skipText,
                loop: false,
                repeat: 7
            });
            this.skipText.timer = timer;
        }

        this.skipText = this.scene.make.bitmapText({
            x: 0,
            y: 0,
            text: "Skip",
            font: "font20"
        });
        this.skipText.setDepth(-1);
        this.skipText.setFontSize(24);
        this.skipText.setLetterSpacing(2);
        this.skipText.setX(gridHeight*ratio - this.skipText.width - 10);
        this.skipText.setY(10);
        this.skipText.setInteractive().on("pointerdown", onButtonPressed, this);
    }

    this.conversate = function () {
        this.inConversation = true;

        if (this.dialogueBox) {
            this.dialogueBox.destroy();
            this.graphics.clear();
        }

        if (this.dialogueIndex < this.dialogues.length) {
            if (this.playerIsSpeaker0 && this.dialogues[this.dialogueIndex][0] == 0)
                this.currSpeaker = this.player;
            else
                this.currSpeaker = this.speakers.getChildren()[this.dialogues[this.dialogueIndex][0]-1];

            this.currText = this.dialogues[this.dialogueIndex][1];

            var speakerPosition = this.dialogues[this.dialogueIndex][0] == 0 ? -1 : 1;
            
            this.dialogueBox = this.scene.make.bitmapText({
                x: 0,
                y: 0,
                text: this.currText,
                align: 1,
                font: "font12" 
            });

            this.dialogueBox.setOrigin(0.5, 0.5);
            this.dialogueBox.setY(8 + this.dialogueBox.height/2);
            this.dialogueBox.setX(this.currSpeaker.x - speakerPosition*this.currSpeaker.width - speakerPosition*this.dialogueBox.width/2);

            this.graphics.fillStyle(0xffffff, 1);
            this.graphics.lineStyle(1, 0x000000, 1);
            this.graphics.fillRoundedRect(this.dialogueBox.x-this.dialogueBox.width/2-4, this.dialogueBox.y-this.dialogueBox.height/2-4, 
                this.dialogueBox.width+8, this.dialogueBox.height+8, 4);
            this.graphics.strokeRoundedRect(this.dialogueBox.x-this.dialogueBox.width/2-4, this.dialogueBox.y-this.dialogueBox.height/2-4, 
                this.dialogueBox.width+8, this.dialogueBox.height+8, 4);
        
            startPointX = this.dialogueBox.x + speakerPosition*this.dialogueBox.width/2 + speakerPosition*4;
            startPointY = this.dialogueBox.y + this.dialogueBox.height/2 - 8 + 4;
            endPointX = this.dialogueBox.x + speakerPosition*this.dialogueBox.width/2 - speakerPosition*8;
            endPointY = this.dialogueBox.y + this.dialogueBox.height/2 + 4;
            this.graphics.fillPoints([
                {x: startPointX, y: startPointY}, 
                {x: startPointX + speakerPosition*4, y: startPointY + 8 + 4}, 
                {x: endPointX, y: endPointY}
            ]);
            this.graphics.strokePoints([
                {x: startPointX, y: startPointY}, 
                {x: startPointX + speakerPosition*4, y: startPointY + 8 + 4}, 
                {x: endPointX, y: endPointY}
            ]);

            this.currText = this.currText.split(" ");
            this.dialogueBox.setText("");
            this.dialogueBox.setTintFill("black");
            this.dialogueBox.wordNumber = 0;
            this.dialogueBox.timer = this.scene.time.addEvent({
                delay: 120,
                callback: function () {
                    if (this.dialogueBox.wordNumber < this.currText.length) {
                        this.dialogueBox.setText(this.dialogueBox.text + (this.dialogueBox.wordNumber == 0 ? "" : " ") + this.currText[this.dialogueBox.wordNumber]);
                        this.dialogueBox.wordNumber++;
                    }
                    else {
                        this.dialogueBox.timer.delay = 0;
                        this.dialogueBox.timer.remove();
                    }
                },
                callbackScope: this,
                loop: -1
            });
        }
        else {
            this.letGo();
            if (!this.remainStillAfterEnd)
                this.resumeGameplay(false, true);
            this.player.anims.stop();
            this.player.anims.play("playeridle");
        }
    }

    this.onPointerDown = function (pointer) {
        this.dialogueIndex++;
        this.conversate();
    }

    this.letGo = function () {
        var onOutOfBounds = function(objectA, objectB) {
            currModeInstance.speakersDead++;
            objectA.destroy();
        }

        this.skipText.removeAllListeners();
        this.skipText.destroy();

        this.player.finalPositionX = this.player.x;
        if (this.playerIsSpeaker0 && this.stayingSpeaker != 0 && this.stayingSpeakerPosition != 0) {
            this.player.setVelocityX(-this.currSpeed);
            this.player.setGravity(0);
            this.player.finalPositionX = this.speakersEndingPositionsOffsets[0][0];
            this.scene.physics.add.overlap(this.player, this.extraLeftCollider, onOutOfBounds);
        }
        
        var speakerChildren = this.speakers.getChildren();
        for (var i = 0+this.playerIsSpeaker0; i < this.speakerSprites.length; i++) {
            if (this.speakersDieImmediately[i]) {
                speakerChildren[i-this.playerIsSpeaker0].setGravityY(this.gravity);
                speakerChildren[i-this.playerIsSpeaker0].setVelocityX(this.speakersImmediateDeathDirection[i-this.playerIsSpeaker0]);
                this.scene.physics.add.overlap(speakerChildren[i-this.playerIsSpeaker0], this.extraLeftCollider, onOutOfBounds);
                this.scene.physics.add.overlap(speakerChildren[i-this.playerIsSpeaker0], this.bottomCollider, onOutOfBounds);
                this.scene.physics.add.overlap(speakerChildren[i-this.playerIsSpeaker0], this.rightCollider, onOutOfBounds);
                // speakerChildren[i-this.playerIsSpeaker0].destroy();
            }
            else if (i != this.stayingSpeaker) {
                speakerChildren[i-this.playerIsSpeaker0].setVelocityX(-this.currSpeed);
                this.scene.physics.add.overlap(speakerChildren[i-this.playerIsSpeaker0], this.extraLeftCollider, onOutOfBounds);
            }
            else if (i == this.stayingSpeaker && this.stayingSpeakerPosition == 1) {
                var finalPlayerPositionX = this.player.x;

                this.environment.playerSprite = this.speakerSprites[i];
                this.environment.addPlayer(speakerChildren[i-this.playerIsSpeaker0].x, speakerChildren[i-this.playerIsSpeaker0].y + this.player.height - this.stayingSpeakerHeight);

                speakerChildren[i-this.playerIsSpeaker0].destroy();
                
                this.player.setVelocityX(-this.currSpeed);
                this.player.finalPositionX = finalPlayerPositionX;

                var groundChildren = this.grounds.getChildren();
                for (var i = 0; i < groundChildren.length; i+=3) {
                    this.scene.physics.add.collider(this.player, groundChildren[i]);
                }

                this.addAnimations();
            }
        }

        this.scene.input.off("pointerdown");
    }
}