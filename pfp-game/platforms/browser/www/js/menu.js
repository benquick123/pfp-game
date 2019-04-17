
function Menu(environment) {
    this.environment = environment;

    this.tintButton = function () {
        if (this.isTinted)
            this.clearTint();
        else
            this.setTintFill("black");
        
        if (this.timer.getRepeatCount() == 0) {
            currModeInstance.letGo(this);
        }
    }

    this.onButtonClick = function (pointer, localX, localY, event) {
        event.stopPropagation();

        this.timer = currModeInstance.scene.time.addEvent({
            delay: 32,
            callback: currModeInstance.tintButton,
            callbackScope: this,
            loop: false,
            repeat: 7
        });
    }
}

function MainMenu(menu) {
    this.menu = menu;
    this.menuOptionsText = ["New game", "Leaderboard", "Credits"];
    this.menuOptionsTextSize = 24;
    this.menuOptions;
    this.musicName = "basic";

    this.createMenu = function (x, y) {
        this.menuOptions = this.scene.add.group();
        y -= this.menuOptionsTextSize*this.menuOptionsText.length/2
        for (var i=0; i < this.menuOptionsText.length; i++) {
            var menuOption = this.scene.make.bitmapText({
                x: 0,
                y: 0,
                text: this.menuOptionsText[i],
                font: "font20"
            });
            menuOption.setLetterSpacing(2);
            menuOption.setFontSize(this.menuOptionsTextSize);
            menuOption.setX(gridHeight*ratio/2 - menuOption.width/2);
            menuOption.setY(gridHeight/2 - y + i*this.menuOptionsTextSize);
            menuOption.setInteractive().on("pointerdown", this.onButtonClick, menuOption);

            this.menuOptions.add(menuOption);
        }
        if (this.menu.environment.music == undefined) {
            this.menu.environment.music = this.scene.sound.add(this.musicName, { loop: true });
            this.menu.environment.music.play();
        }
    }

    /* this.onButtonClick = function (pointer, localX, localY, event) {
        currModeInstance.menu.onButtonClick.call(this, pointer, localX, localY, event);
        if (this.text == "New game") {
            this.fadeOutTimer = currModeInstance.scene.time.addEvent({
                delay: 24,
                callback: function () { if (currModeInstance.menu.environment.music.volume > 0) 
                    currModeInstance.menu.environment.music.setVolume(currModeInstance.menu.environment.music.volume-0.1); },
                repeat: 10
            })
        }
    }*/ 

    this.letGo = function (button) {
        var menuChildren = this.menuOptions.getChildren();
        for (var i=0; i < menuChildren.length; i++) {
            menuChildren[i].off("pointerdown", NaN);
            menuChildren[i].removeAllListeners();
            menuChildren[i].destroy();
        }

        if (button.text == this.menuOptionsText[0]) {
            // button.fadeOutTimer.remove();
            prevModeInstance = currModeInstance;
            currModeInstance = new GameModeSelectionMenu(prevModeInstance.menu);
            currModeInstance.createMenu();
            // changeMode();
        }
        
        else if (button.text == this.menuOptionsText[1]) {
            prevModeInstance = currModeInstance;
            currModeInstance = new LeaderboardMenu(prevModeInstance.menu);
            currModeInstance.createMenu(gridHeight*ratio/2-currModeInstance.maxLineLength/2, 2);
        }
        
        else if (button.text == this.menuOptionsText[2]) {
            console.log(button.text);
        }
    }
} 

function CreditsMenu() {

}

function EnterLeaderboardName(menu) {
    this.menu = menu;
    this.leaderboard = []
    this.gameOverText;
    this.submitText;
    this.newGameText;
    this.achievedI = -1;
    this.score = -1;
    
    this.createMenu = function(score) {
        this.score = score;
        this.gameOverText = this.scene.make.bitmapText({
            x: 0,
            y: 0,
            text: "GAME OVER",
            font: "font20",
        });
        this.gameOverText.setFontSize(24);
        this.gameOverText.setLetterSpacing(2);
        this.gameOverText.setX(gridHeight*ratio/2 - this.gameOverText.width/2);
        this.gameOverText.setY(10);

        $("#highscore-text").css("visibility", "visible");
        $("#highscore-text").val(window.localStorage.getItem("username"));

        this.submitText = this.scene.make.bitmapText({
            x: 0,
            y: 0,
            text: "Submit",
            font: "font20"
        });
        this.submitText.setFontSize(24);
        this.submitText.setLetterSpacing(2);
        this.submitText.setX(gridHeight*ratio/4 - this.submitText.width/2);
        this.submitText.setY(96);
        this.submitText.setInteractive().on("pointerdown", this.onButtonClick, this.submitText);
        this.submitText.setDepth(3);

        this.newGameText = this.scene.make.bitmapText({
            x: 0,
            y: 0,
            text: "New game",
            font: "font20"
        });
        this.newGameText.setFontSize(24);
        this.newGameText.setLetterSpacing(2);
        this.newGameText.setX(3*gridHeight*ratio/4 - this.newGameText.width/2);
        this.newGameText.setY(96);
        this.newGameText.setInteractive().on("pointerdown", this.onButtonClick, this.newGameText);
        this.newGameText.setDepth(3);

        this.scene.input.keyboard.on("keydown-ENTER", this.onEnterDown, this);
    }

    this.onEnterDown = function (event) {
        this.letGo(this.submitText);
    }

    this.letGo = function(button) {
        if (button.text == "New game") {
            this.gameOverText.destroy();
            $("#highscore-text").css("visibility", "hidden");
            this.submitText.removeAllListeners();
            this.submitText.destroy();
            this.newGameText.removeAllListeners();
            this.newGameText.destroy();
            this.scene.input.keyboard.off("keydown-ENTER");
            this.environment.scoreText.setText("");
            initMenuLoad = "gameModeSelectionMenu";
            this.scene.scene.restart();
        }
        else {
            var highScoreName = $("#highscore-text").val();
            if (highScoreName.length == 0) {
                $("#highscore-text").attr("placeholder", "Invalid Instagram handle");
            }
            else {
                var postResponse = $.ajax({
                    type: "POST",
                    url: "http://pfp-scoreboard.us-west-2.elasticbeanstalk.com/rankings",
                    data: {"player": highScoreName.substring(1, highScoreName.length), "score": Math.round(this.score)},
                    async: false
                });
                if (postResponse.status == 400) {
                    $("#highscore-text").val("");
                    $("#highscore-text").attr("placeholder", "Invalid profile.");
                }
                else {
                    var storage = window.localStorage;
                    storage.setItem("username", highScoreName);
                    this.gameOverText.destroy();
                    $("#highscore-text").css("visibility", "hidden");
                    this.submitText.removeAllListeners();
                    this.submitText.destroy();
                    this.newGameText.removeAllListeners();
                    this.newGameText.destroy();
                    this.scene.input.keyboard.off("keydown-ENTER");
                    this.environment.scoreText.setText("");

                    prevModeInstance = currModeInstance
                    currModeInstance = new LeaderboardMenu(prevModeInstance.menu);
                    currModeInstance.backRestart = true;
                    if (postResponse.responseJSON["isHighscore"]) {
                        currModeInstance.currPlayerRank = postResponse.responseJSON["rank"];
                    }   
                    currModeInstance.createMenu(gridHeight*ratio/2-currModeInstance.maxLineLength/2, 2);
                }
            }
        }
    }
}

function LeaderboardMenu(menu) {
    this.menu = menu;
    this.maxItems = 10;
    this.highscoreItems = [];
    this.maxLineLength = 160;
    this.leaderBoardText;
    this.leaderBoardArray = [];
    this.currPlayerRank = -1;
    this.leaderboard;;
    this.backText;
    this.backRestart = false;

    this.constructLeaderboard = function (x, y) {
        onHandleClick = function (pointer, localX, localY, event) {
            window.open(encodeURI("https://www.instagram.com/" + this.text.substring(this.text.indexOf("@")+1, this.text.length)), "_system");
        }
        this.leaderboard = this.scene.add.group();
        for (var i = 0; i < this.maxItems; i++) {
            var number = (i+1).toString() + ".";
            var name = i < this.leaderBoardArray.length ? "@" + this.leaderBoardArray[i][0] : "(rajko)";
            var score = i < this.leaderBoardArray.length ? this.leaderBoardArray[i][1].toString() : "0";
            var textName = this.scene.make.bitmapText({
                x: x,
                y: y+i*12,
                text: number + name,
                font: "font12"
            });
            // textName.setTintFill("black");
            if (name[0] == "@") {
                textName.setInteractive().on("pointerdown", onHandleClick, this.textName);
            }
            var textScore = this.scene.make.bitmapText({
                x: textName.x + this.maxLineLength,
                y: y+i*12,
                text: score,
                font: "font12"
            });
            // textScore.setTintFill("black");
            if (i == this.currPlayerRank-1) {
                textScore.timer = this.scene.time.addEvent({
                    delay: 500,
                    callback: currMenu.tintButton,
                    callbackScope: textScore,
                    repeat: 1000
                });
                textName.timer = this.scene.time.addEvent({
                    delay: 500,
                    callback: currMenu.tintButton,
                    callbackScope: textName,
                    repeat: 1000
                })
            }
            this.leaderboard.add(textName);
            this.leaderboard.add(textScore);
        }
    }

    this.createMenu = function (x, y) {
        this.leaderBoardArray = this.retrieveLeaderBoard();
        this.constructLeaderboard(x, y);

        lastChild = this.leaderboard.getChildren()[this.leaderboard.getChildren().length-1];
        this.backText = this.scene.make.bitmapText({
            x: 0,
            y: lastChild.y + lastChild.height + 4,
            text: "Back",
            font: "font20"
        });
        this.backText.setFontSize(24);
        this.backText.setLetterSpacing(2);
        this.backText.setX(gridHeight*ratio/2 - this.backText.width/2);
        this.backText.setInteractive().on("pointerdown", this.onButtonClick, this.backText);
        this.backText.setDepth(3);
    }

    this.letGo = function (button) {
        leaderboardChildren = this.leaderboard.getChildren();
        for (var i = 0; i < leaderboardChildren.length; i++) {
            leaderboardChildren[i].removeAllListeners();
        }
        this.leaderboard.clear(true);
        this.backText.removeAllListeners();
        this.backText.destroy();
        
        prevModeInstance = currModeInstance;
        currModeInstance = new MainMenu(prevModeInstance.menu);
        currModeInstance.createMenu(gridHeight*ratio/2, gridHeight/2);
        if (this.backRestart) {
            this.music.stop();
            initMenuLoad = "mainMenu";
            this.scene.scene.restart();
        }
    }

    this.retrieveLeaderBoard = function () {
        // returns sorted array with indices ["name", score]
        var response = $.ajax({
            type: "GET",
            url: "http://pfp-scoreboard.us-west-2.elasticbeanstalk.com/rankings?n=10",
            async: false
        });
        var returnArray = []
        if (Math.floor(response.status/100) != 4) {
            for (var key in response.responseJSON) {
                returnArray.push([key, response.responseJSON[key]]);
            }
        }
        else {
            returnArray.push(["CONNECTION ERROR", "0"])
        }
        return returnArray;
    }
}

function GameModeSelectionMenu(menu) {
    this.menu = menu;
    this.arcadeModeText;
    this.storyModeText;
    this.arcadeUnlocked = false;
    this.musicName = "basic";

    this.createMenu = function () {
        this.storyModeText = this.scene.make.bitmapText({
            x: 0,
            y: 0,
            text: "Story mode",
            font: "font20",
        });
        this.storyModeText.setFontSize(24);
        this.storyModeText.setLetterSpacing(2);
        this.storyModeText.setX(gridHeight*ratio/2 - this.storyModeText.width/2);
        this.storyModeText.setY(gridHeight/2 - this.storyModeText.height/2);
        this.storyModeText.setInteractive().on("pointerdown", this.onButtonClick, this.storyModeText);
        this.storyModeText.setDepth(3);

        this.arcadeModeText = this.scene.make.bitmapText({
            x: 0,
            y: 0,
            text: "Arcade mode",
            font: "font20"
        });
        this.arcadeModeText.setFontSize(24);
        this.arcadeModeText.setLetterSpacing(2);
        this.arcadeModeText.setX(gridHeight*ratio/2 - this.arcadeModeText.width/2);
        this.arcadeModeText.setY(gridHeight/2 + this.arcadeModeText.height/2);
        this.arcadeModeText.setDepth(5);
        if (this.arcadeUnlocked) {
            this.arcadeModeText.setInteractive().on("pointerdown", this.onButtonClick, this.arcadeModeText);
        }
        else {
            this.arcadeModeText.setAlpha(0.6);
        }

        if (this.menu.environment.music == undefined) {
            this.menu.environment.music = this.scene.sound.add(this.musicName, { loop: true });
            this.menu.environment.music.play();
        }
    }

    this.letGo = function(button) {
        this.arcadeModeText.off("pointerdown", NaN);
        this.arcadeModeText.removeAllListeners();
        this.arcadeModeText.destroy();

        this.storyModeText.off("pointerdown", NaN);
        this.storyModeText.removeAllListeners();
        this.storyModeText.destroy();

        if (button.text == "Story mode") {
            gameplayMode = STORYMODE;
            changeMode();
        }
        else if (button.text == "Arcade mode") {
            gameplayMode = ARCADEMODE;
            changeMode();
        }
    }
}