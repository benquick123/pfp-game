
function MainMenu(scene) {
    this.scene = scene;
    this.menuOptionsText = ["New game", "Leaderboard", "Credits"];
    this.menuOptions = this.scene.add.group();

    this.createMenu = function (x, y) {
        y -= 24*this.menuOptionsText.length/2
        for (var i=0; i < this.menuOptionsText.length; i++) {
            var menuOption = this.scene.make.text({
                x: x,
                y: y + i*24,
                text: this.menuOptionsText[i],
                origin: { x: 0.5, y: 0.5 },
                style: { font: '20px Consolas', fill: 'white' },
                resolution: 10
            });
            menuOption.setInteractive().on("pointerdown", this.onPointerDown, menuOption);

            this.menuOptions.add(menuOption);
        }
    }

    this.onPointerDown = function (pointer, localX, localY, event) {
        buttonNumber = -1
        for (var i=0; i < currMenu.menuOptionsText.length; i++) {
            if (this.text == currMenu.menuOptionsText[i]) {
                buttonNumber = i;
                break;
            }
        }
        if (buttonNumber == 0) {
            changeMode()
        }
        else if (buttonNumber == 1) {

        }
        else if (buttonNumber == 2) {

        }
    }

    this.letGo = function () {
        this.menuOptions.clear();
    }
}