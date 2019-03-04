
function MainMenu(scene) {
    this.scene = scene;
    this.menuOptionsText = ["New game", "Leaderboard", "Credits"];
    this.menuOptions = scene.add.group();

    this.createMenu = function (x, y) {
        y -= 24*this.menuOptionsText.length/2
        for (var i=0; i < this.menuOptionsText.length; i++) {
            var menuOption = this.scene.make.bitmapText({
                x: 0,
                y: 0,
                text: this.menuOptionsText[i],
                font: "font20"
            });
            menuOption.setLetterSpacing(2);
            menuOption.setFontSize(24);
            menuOption.setX(gridHeight*ratio/2 - menuOption.width/2);
            menuOption.setY(gridHeight/2 - y + i*24);
            menuOption.setInteractive().on("pointerdown", this.onPointerDown, menuOption);

            this.menuOptions.add(menuOption);
        }
    }

    this.onPointerDown = function (pointer, localX, localY, event) {
        event.stopPropagation();

        this.timer = currMenu.scene.time.addEvent({
            delay: 32,
            callback: tintButton,
            callbackScope: this,
            loop: false,
            repeat: 7
        });
    }

    this.letGo = function (button) {
        var menuChildren = this.menuOptions.getChildren();
        for (var i=0; i < menuChildren.length; i++) {
            menuChildren[i].off("pointerdown", NaN);
            menuChildren[i].removeAllListeners();
            menuChildren[i].destroy();
        }
        if (button.text == this.menuOptionsText[0]) 
            changeMode();
        else if (button.text == this.menuOptionsText[1]) {
            currMenu = new LeaderboardMenu(this.scene);
            currMenu.createMenu(gridHeight*ratio/2, gridHeight/2);
        }
        else if (button.text == this.menuOptionsText[2]) {
            console.log(button.text);
        }
    }
} 

function CreditsMenu() {

}

function LeaderboardMenu(scene) {
    this.scene = scene;
    this.maxItems = 10;
    this.highscoreItems = [];
    this.maxCharPerLine = 12;
    this.leaderBoardText;
    this.backText;
    this.backRestart = false;

    this.getLeaderBoard = function () {
        var textArray = [];
        for (var i=0; i < this.maxItems; i++) {
            var text = "";
            name = "AUDBAI";
            text += (i+1).toString() + "." + name;
            for (var j=name.length; j < this.maxCharPerLine-3; j++) {
                text += ".";
            }
            text += Math.floor(Math.random()*1000).toString();
            while (text.length < this.maxCharPerLine) {
                text += " ";
            }
            textArray.push(text);
        }
        var text = "";
        for (var i = 0; i < textArray.length/2; i++) {
            text += textArray[i] + "  " + textArray[i+textArray.length/2] + "\n";
        }
        return text;
    }

    this.createMenu = function (x, y) {
        text = this.getLeaderBoard();
        this.leaderBoardText = this.scene.make.bitmapText({
            x: x,
            y: y-20/2,
            text: text,
            font: "font20_1"
        });
        this.leaderBoardText.setFontSize(20);
        this.leaderBoardText.setLetterSpacing(2);
        this.leaderBoardText.setX(gridHeight*ratio/2 - this.leaderBoardText.width/2);
        this.leaderBoardText.setY(12);

        this.backText = this.scene.make.bitmapText({
            x: x,
            y: this.leaderBoardText.y + 0.2*(this.leaderBoardText.height/2) + 20/2,
            text: "Back",
            font: "font20"
        });
        this.backText.setFontSize(24);
        this.backText.setLetterSpacing(2);
        this.backText.setX(gridHeight*ratio/2 - this.backText.width/2);
        this.backText.setY(this.leaderBoardText.y + this.leaderBoardText.height + 12/2);
        this.backText.setInteractive().on("pointerdown", this.onPointerDown, this.backText);
    }

    this.onPointerDown = function (pointer, localX, localY, event) {
        event.stopPropagation();

        this.timer = currMenu.scene.time.addEvent({
            delay: 32,
            callback: tintButton,
            callbackScope: this,
            loop: false,
            repeat: 7
        });
    }

    this.letGo = function (button) {
        this.leaderBoardText.destroy();
        this.backText.removeAllListeners();
        this.backText.destroy();
        currMenu = new MainMenu(currMenu.scene);
        currMenu.createMenu(gridHeight*ratio/2, gridHeight/2);
        if (this.backRestart) {
            this.scene.scene.restart();
        }
    }
}

function tintButton() {
    if (this.isTinted)
        this.clearTint();
    else
        this.setTintFill("black");
    
    if (this.timer.getRepeatCount() == 0) {
        currMenu.letGo(this);
    }
}