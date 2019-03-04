
function Story(scene) {
    this.scene = scene;
    this.grounds;
    this.storyNumber = 0;
    this.playerSprite = "character";
    this.player;
    this.helperSprite = "helper";
    this.helper;
    this.dialogues = [];
    this.dialogueIndex = 0;
    this.dialogueWidth = 100;
    this.dialogueBox;
    this.graphics = this.scene.add.graphics();

    this.currSpeaker;
    this.currText;
    this.currDialogueWidth;

    this.createHelper = function (x, y) {
        this.helper = this.scene.physics.add.sprite(x+64, y, this.helperSprite);

        this.scene.tweens.add({
            targets: this.helper,
            x: x,
            ease: "Linear",
            loop: 0,
            duration: 2000,
            onCompleteScope: this,
            onComplete: function() {
                this.conversate();
            }
        })
    }

    this.conversate = function () {
        if (this.dialogueBox)
            this.dialogueBox.destroy();
            this.graphics.clear();
        if (this.dialogueIndex < this.dialogues.length) {
            speakers = [this.player, this.helper];
            this.currSpeaker = speakers[this.dialogues[this.dialogueIndex][0]];
            this.currText = this.dialogues[this.dialogueIndex][1];
            this.currDialogueWidth = this.dialogues[this.dialogueIndex][2];

            var speakerPosition = this.dialogues[this.dialogueIndex][0] == 0 ? -1 : 1;
            
            this.dialogueBox = this.scene.make.text({
                x: 0,
                y: 0,
                origin: {x: 0.5, y: 0.5},
                text: this.currText,
                style: {
                    fontSize: "10px",
                    fontStyle: "bold",
                    color: "white",
                    fontFamily: "Consolas",
                    wordWrap: { width: this.currDialogueWidth },
                    resolution: 10
                }
            });
            this.dialogueBox.setY(8 + this.dialogueBox.height/2);
            this.dialogueBox.setX(this.currSpeaker.x - speakerPosition*this.currSpeaker.width - speakerPosition*this.dialogueBox.width/2 - speakerPosition*16);

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
            this.dialogueBox.setColor("black");
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
            })
        }
        else {
            changeMode();
        }
    }

    this.letGo = function () {
        this.scene.tweens.add({
            targets: this.helper,
            x: this.helper.x+64,
            ease: "Linear",
            loop: 0,
            duration: 2000,
            onCompleteScope: this,
            onComplete: function(event) {
                this.helper.destroy();
            }
        })
    }
}