
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
        if (this.text == "New game") {
            this.fadeOutTimer = currMenu.scene.time.addEvent({
                delay: 24,
                callback: function () { if (music.volume > 0) music.setVolume(music.volume-0.1); },
                repeat: 10
            })
        }
    }

    this.letGo = function (button) {
        var menuChildren = this.menuOptions.getChildren();
        for (var i=0; i < menuChildren.length; i++) {
            menuChildren[i].off("pointerdown", NaN);
            menuChildren[i].removeAllListeners();
            menuChildren[i].destroy();
        }
        if (button.text == this.menuOptionsText[0]) {
            button.fadeOutTimer.remove();
            changeMode();
        }
        else if (button.text == this.menuOptionsText[1]) {
            currMenu = new LeaderboardMenu(this.scene);
            currMenu.leaderBoardArray = retrieveLeaderBoard();
            currMenu.createMenu(gridHeight*ratio/2-currMenu.maxLineLength/2, 2);
        }
        else if (button.text == this.menuOptionsText[2]) {
            console.log(button.text);
        }
    }
} 

function CreditsMenu() {

}

function EnterLeaderboardName(scene) {
    /* 
    first, check if score is high enough for leaderboard.
    if not, go directly to leaderboard menu.
    if yes, display last score (at the same place as durign in-game), "Game over" text,
    text input field and submit button. 
    upon clicking submit, save the query to the db on server, and push the result into previously retrieved leaderboard array.
    display new top 10 in LeaderboardMenu.
    */
    this.scene = scene;
    this.leaderboard = []
    this.gameOverText;
    this.submitText;
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
            text: "SUBMIT",
            font: "font20"
        });
        this.submitText.setFontSize(24);
        this.submitText.setLetterSpacing(2);
        this.submitText.setX(gridHeight*ratio/2 - this.submitText.width/2);
        this.submitText.setY(96);
        this.submitText.setInteractive().on("pointerdown", this.onPointerDown, this.submitText);

        this.scene.input.keyboard.on("keydown-ENTER", this.onEnterDown, this);
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

    this.onEnterDown = function (event) {
        this.letGo(this.submitText);
    }

    this.letGo = function(button) {
        var highScoreName = $("#highscore-text").val();
        if (highScoreName.length == 0) {
            $("#highscore-text").attr("placeholder", "Enter your Instagram handle");
        }
        else {
            var postResponse = $.ajax({
                type: "POST",
                url: "http://pfp-scoreboard.us-west-2.elasticbeanstalk.com/rankings",
                data: {"player": highScoreName.substring(1, highScoreName.length), "score": Math.round(score)},
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
                this.scene.input.keyboard.off("keydown-ENTER");
                labelScore.setText("");
                currMenu = new LeaderboardMenu(currMenu.scene);
                currMenu.backRestart = true;
                if (postResponse.responseJSON["isHighscore"]) {
                    currMenu.currPlayerRank = postResponse.responseJSON["rank"];
                }   
                currMenu.createMenu(gridHeight*ratio/2-currMenu.maxLineLength/2, 2);
            }
        }
    }
}

function LeaderboardMenu(scene) {
    this.scene = scene;
    this.maxItems = 10;
    this.highscoreItems = [];
    this.maxLineLength = 160;
    this.leaderBoardText;
    this.leaderBoardArray = [];
    this.currPlayerRank = -1;
    this.leaderboard = scene.add.group();
    this.backText;
    this.backRestart = false;

    this.constructLeaderboard = function (x, y) {
        onHandleClick = function (pointer, localX, localY, event) {
            window.open(encodeURI("https://www.instagram.com/" + this.text.substring(this.text.indexOf("@")+1, this.text.length)), "_system");
        }
        console.log(this.currPlayerRank);
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
            textName.setTintFill("black");
            if (name[0] == "@") {
                textName.setInteractive().on("pointerdown", onHandleClick, this.textName);
            }
            var textScore = this.scene.make.bitmapText({
                x: textName.x + this.maxLineLength,
                y: y+i*12,
                text: score,
                font: "font12"
            });
            textScore.setTintFill("black");
            if (i == this.currPlayerRank-1) {
                textScore.timer = this.scene.time.addEvent({
                    delay: 500,
                    callback: tintButton,
                    callbackScope: textScore,
                    repeat: 1000
                });
                textName.timer = this.scene.time.addEvent({
                    delay: 500,
                    callback: tintButton,
                    callbackScope: textName,
                    repeat: 1000
                })
            }
            this.leaderboard.add(textName);
            this.leaderboard.add(textScore);
        }
    }

    this.createMenu = function (x, y) {
        this.leaderBoardArray = retrieveLeaderBoard();
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
        leaderboardChildren = this.leaderboard.getChildren();
        for (var i = 0; i < leaderboardChildren.length; i++) {
            leaderboardChildren[i].removeAllListeners();
        }
        this.leaderboard.clear(true);
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

function retrieveLeaderBoard() {
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