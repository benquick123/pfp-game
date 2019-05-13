
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
    this.menuOptionsText = ["New game", "Leaderboard", "Feed VASKO", "Credits"];
    this.menuOptionsTextSize = 24;
    this.appVersion;
    this.menuOptions;
    this.musicName = "basic";

    this.createMenu = function (x, y) {
        this.menuOptions = this.scene.add.group();
        y -= this.menuOptionsTextSize*this.menuOptionsText.length/4
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

        this.appVersion = this.scene.make.bitmapText({
            x: 2,
            y: 0,
            text: "0.9.6",
            font: "font12"
        })
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
        this.appVersion.destroy();

        for (var i=0; i < menuChildren.length; i++) {
            menuChildren[i].off("pointerdown", NaN);
            menuChildren[i].removeAllListeners();
            menuChildren[i].destroy();
        }

        if (button.text == this.menuOptionsText[0]) {
            prevModeInstance = currModeInstance;
            currModeInstance = new GameModeSelectionMenu(prevModeInstance.menu);
            currModeInstance.createMenu();
        }
        
        else if (button.text == this.menuOptionsText[1]) {
            prevModeInstance = currModeInstance;
            currModeInstance = new LeaderboardMenu(prevModeInstance.menu);
            currModeInstance.createMenu(gridHeight*ratio/2-currModeInstance.maxLineLength/2, 2);
        }
        
        else if (button.text == this.menuOptionsText[2]) {
            prevModeInstance = currModeInstance;
            currModeInstance = new MainMenu(prevModeInstance.menu);
            currModeInstance.createMenu(gridHeight*ratio/2, gridHeight/2);
            window.open("https://paypal.me/vasko420blazeit69", "_system");
        }

        else if (button.text == this.menuOptionsText[3]) {
            prevModeInstance = currModeInstance;
            currModeInstance = new CreditsMenu(prevModeInstance.menu);
            currModeInstance.createMenu();
        }
    }
} 

function CreditsMenu(menu) {
    this.menu = menu;
    this.scrollSpeed = 0.6;

    this.creditsText;
    this.creditsTextString = "Team V.A.S.K.O.:\n\n\nDesign\nNina Kosednar\n\n\nCloud Soulutions Engineering\n@Blowkz\n\n\nSpecial Danks\n<3 MRFY <3\n\n\nEVERYTHING ELSE\n\nYours trully,\npersons from porlock\n\nd:^)";

    this.createMenu = function () {
        this.creditsText = this.scene.make.bitmapText({
            x: 0,
            y: 0,
            text: this.creditsTextString,
            font: "font12",
            align: 1
        });
        this.creditsText.setX(gridHeight*ratio/2 - this.creditsText.width/2);
        this.creditsText.setY(gridHeight-40);

        this.creditsText.scrollSpeed = this.scrollSpeed;

        this.creditsText.setInteractive().on("pointerdown", this.letGo, this);

        // this.scene.input.on("pointerdown", this.letGo, this);

        var timer = this.scene.time.addEvent({
            delay: 1000/30,
            callback: function () {
                this.setY(this.y - this.scrollSpeed);
                if (this.y < -this.height + 64) {
                    this.timer.remove();
                    currModeInstance.letGo(this);
                }
            },
            callbackScope: this.creditsText,
            loop: true,
        });
        this.creditsText.timer = timer;
    }

    this.letGo = function (button) {
        this.creditsText.timer.remove();
        this.creditsText.off("pointerdown");
        this.creditsText.removeAllListeners();
        this.creditsText.destroy();

        prevModeInstance = currModeInstance;
        currModeInstance = new MainMenu(prevModeInstance.menu);
        currModeInstance.createMenu(gridHeight*ratio/2, gridHeight/2);
    }
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
        var username = window.localStorage.getItem("username");
        if (!username)
            username = "@"
        $("#highscore-text").val(username);

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
            text: "Restart",
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
        if (button.text == "Restart") {
            this.gameOverText.destroy();
            $("#highscore-text").css("visibility", "hidden");
            this.submitText.removeAllListeners();
            this.submitText.destroy();
            this.newGameText.removeAllListeners();
            this.newGameText.destroy();
            this.scene.input.keyboard.off("keydown-ENTER");
            this.environment.scoreText.setText("");
            initMenuLoad = "gameModeSelectionMenu";
            
            prevModeInstance = undefined;
            this.scene.scene.restart();
        }
        else {
            var highScoreName = $("#highscore-text").val();
            if (highScoreName.length == 0 || highScoreName == "@") {
                $("#highscore-text").val("")
                $("#highscore-text").attr("placeholder", "Invalid Instagram handle");
            }
            else {

                var timestamp = Date.now();
                var reqData = {"player": highScoreName.substring(1, highScoreName.length), "score": Math.round(this.score), "timestamp": timestamp};
                
                var secret = "bmlrb2wgc2UgbmUgemFjZXQgZHJvZ2lyYXQ=";
                var hash = CryptoJS.HmacSHA256($.param(reqData), atob(secret)).toString(CryptoJS.enc.Hex).toUpperCase();

                var postResponse = $.ajax({
                    type: "POST",
                    url: "http://pfp-scoreboard.us-west-2.elasticbeanstalk.com/rankings",
                    data: reqData,
                    headers: {"Security-Motherfucker": hash},
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
                    callback: currModeInstance.menu.tintButton,
                    callbackScope: textScore,
                    repeat: 1000
                });
                textName.timer = this.scene.time.addEvent({
                    delay: 500,
                    callback: currModeInstance.menu.tintButton,
                    callbackScope: textName,
                    repeat: 1000
                })
            }
            this.leaderboard.add(textName);
            this.leaderboard.add(textScore);
        }
        this.leaderboard.setDepth(4);
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
        this.backText.setDepth(8);
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
            prevModeInstance = undefined;
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
    this.arcadeUnlocked = true;
    this.musicName = "basic";

    this.createMenu = function () {
        var unlocked = window.localStorage.getItem("arcadeUnlock");
        console.log("unlocked:" + unlocked);
        this.arcadeUnlocked = true;

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
            this.arcadeModeText.setAlpha(0.3);
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
            prevModeInstance = currModeInstance;
            currModeInstance = new ScrollingIntroText(prevModeInstance.menu);
            currModeInstance.createMenu();
            // changeMode();
        }
        else if (button.text == "Arcade mode") {
            gameplayMode = ARCADEMODE;
            changeMode();
        }
    }
}

function ScrollingIntroText (menu) {
    this.menu = menu;
    this.scrollSpeed = 0.6;

    this.scrollingText;
    this.scrollingTextString = "\n\n\nIt is the year 2020\n\nThe distant future\n\nCrime and poverty have been eliminated\n\nThe tecnhological singularity has\npushed humanity into\na perfect symbiotic cybernetic\nco-existence with its digital other.\n\nNew micro-prosthetic mechanisms\nof control emergent\nfrom advanced bio-molecular techniques\nand media networks.\n\nPharmaco post-pornographic xenofeminist\nhypercapitalism\n\nIn this brave new world\n\nFour young wanderers\nin search of meaning are\non their way to the dystopian megacity\nknown as “Lyublianaah”,\nWhen their paths intersect.\n\nOr, in so many less words…\n\n\n\n\nThe boys were back in town.\n\n\n";

    this.createMenu = function () {
        this.scrollingText = this.scene.make.bitmapText({
            x: 0,
            y: 0,
            text: this.scrollingTextString,
            font: "font12",
            align: 1
        });
        this.scrollingText.setX(gridHeight*ratio/2 - this.scrollingText.width/2);
        this.scrollingText.setY(gridHeight-40);

        this.scrollingText.scrollSpeed = this.scrollSpeed;

        this.scrollingText.setInteractive().on("pointerdown", this.letGo, this);

        // this.scene.input.on("pointerdown", this.letGo, this);

        var timer = this.scene.time.addEvent({
            delay: 1000/30,
            callback: function () {
                this.setY(this.y - this.scrollSpeed);
                if (this.y < -this.height + 64) {
                    this.timer.remove();
                    currModeInstance.letGo(this);
                }
            },
            callbackScope: this.scrollingText,
            loop: true,
        });
        this.scrollingText.timer = timer;
    }

    this.letGo = function (button) {
        // console.log("Let go intro text");
        // this.scene.input.off("pointerdown");
        this.scrollingText.timer.remove();
        this.scrollingText.off("pointerdown");
        this.scrollingText.removeAllListeners();
        this.scrollingText.destroy();

        /* this.pauseButton = this.scene.add.image(gridHeight*ratio-20, gridHeight-10, "pause");
        this.pauseButton.setInteractive().on("pointerdown", function () { 
            console.log("pauseClicked"); 
            if (!currModeInstance.scene.scene.isSleeping()) {
                currModeInstance.scene.scene.sleep();
            }
            else {
                currModeInstance.scene.scene.wake();
            }
        });*/
        changeMode();
    }
}