window.addEventListener("DOMContentLoaded", function (event) {
    window.focus();

    // Game
    let snakePositions; // An array of snake positions, starting head first
    let applePosition; // The position of the apple

    let startTimestamp; // The starting timestamp of the animation
    let lastTimestamp; // The previous timestamp of the animation
    let stepsTaken; // How many steps did the snake take
    let score;
    let contrast;

    let inputs; // A list of directions the snake still has to take in order

    let gameStarted = false;
    let hardMode = false;

    // Configuration
    const width = 15; // Grid width
    const height = 15; // Grid height

    const speed = 200; // Milliseconds
    let fadeSpeed = 5000; // Milliseconds
    let fadeExponential = 1.024;
    const contrastIncrease = 0.5;
    const color = "black";

    const grid = document.querySelector(".grid");
    for (let i = 0; i < width * height; i++) {
        const content = document.createElement("div");
        content.setAttribute("class", "content");
        content.setAttribute("id", i); // Just for debugging, not used

        const tile = document.createElement("div");
        tile.setAttribute("class", "tile");
        tile.appendChild(content);

        grid.appendChild(tile);
    }

    const tiles = document.querySelectorAll(".grid .tile .content");

    const containerElement = document.querySelector(".container");
    const noteElement = document.querySelector("footer");
    const contrastElement = document.querySelector(".contrast");
    const scoreElement = document.querySelector(".score");

    // Khởi tạo
    resetGame();

    // Đặt lại bố cục trò chơi
    function resetGame() {
        snakePositions = [168, 169, 170, 171];
        applePosition = 100; // Initially the apple is always at the same position to make sure it's reachable

        startTimestamp = undefined;
        lastTimestamp = undefined;
        stepsTaken = -1; // It's -1 because then the snake will start with a step
        score = 0;
        contrast = 1;

        inputs = [];

        contrastElement.innerText = `${Math.floor(contrast * 100)}%`;
        scoreElement.innerText = hardMode ? `HARD ${score}` : score;

        for (const tile of tiles) setTile(tile);

        // Food
        setTile(tiles[applePosition], {
            "background-color": color,
            "border-radius": "50%"
        });

        for (const i of snakePositions.slice(1)) {
            const snakePart = tiles[i];
            snakePart.style.backgroundColor = color;

            if (i == snakePositions[snakePositions.length - 1])
                snakePart.style.left = 0;
            if (i == snakePositions[0]) snakePart.style.right = 0;
        }
    }

    window.addEventListener("keydown", function (event) {
        if (
            ![
                "ArrowLeft",
                "ArrowUp",
                "ArrowRight",
                "ArrowDown",
                " ",
                "H",
                "h",
                "E",
                "e"
            ].includes(event.key)
        )
            return;

        event.preventDefault();

        if (event.key == " ") {
            resetGame();
            startGame();
            return;
        }

        // Chế độ Khó
        if (event.key == "H" || event.key == "h") {
            hardMode = true;
            fadeSpeed = 4000;
            fadeExponential = 1.025;
            noteElement.innerHTML = `Chế độ HARD. Nhấn SPACE để bắt đầu!`;
            noteElement.style.opacity = 1;
            resetGame();
            return;
        }

        // Chế độ Dễ
        if (event.key == "E" || event.key == "e") {
            hardMode = false;
            fadeSpeed = 5000;
            fadeExponential = 1.024;
            noteElement.innerHTML = `Chế độ DỄ. Nhấn phím SPACE để bắt đầu!`;
            noteElement.style.opacity = 1;
            resetGame();
            return;
        }

        // Nếu ấn 1 nút di chuyển hãy ấn thêm 1 nút khác để thêm hướng đi mới
        // Không được ấn 2 lần cũng một hướng đi
        // Rắn cung không thể quay đầu
        if (
            event.key == "ArrowLeft" &&
            inputs[inputs.length - 1] != "left" &&
            headDirection() != "right"
        ) {
            inputs.push("left");
            if (!gameStarted) startGame();
            return;
        }
        if (
            event.key == "ArrowUp" &&
            inputs[inputs.length - 1] != "up" &&
            headDirection() != "down"
        ) {
            inputs.push("up");
            if (!gameStarted) startGame();
            return;
        }
        if (
            event.key == "ArrowRight" &&
            inputs[inputs.length - 1] != "right" &&
            headDirection() != "left"
        ) {
            inputs.push("right");
            if (!gameStarted) startGame();
            return;
        }
        if (
            event.key == "ArrowDown" &&
            inputs[inputs.length - 1] != "down" &&
            headDirection() != "up"
        ) {
            inputs.push("down");
            if (!gameStarted) startGame();
            return;
        }
    });

    // Bắt đầu Game
    function startGame() {
        gameStarted = true;
        noteElement.style.opacity = 0;
        window.requestAnimationFrame(main);
    }

    function main(timestamp) {
        try {
            if (startTimestamp === undefined) startTimestamp = timestamp;
            const totalElapsedTime = timestamp - startTimestamp;
            const timeElapsedSinceLastCall = timestamp - lastTimestamp;

            const stepsShouldHaveTaken = Math.floor(totalElapsedTime / speed);
            const percentageOfStep = (totalElapsedTime % speed) / speed;

            if (stepsTaken != stepsShouldHaveTaken) {
                stepAndTransition(percentageOfStep);

                const headPosition = snakePositions[snakePositions.length - 1];
                if (headPosition == applePosition) {
                    // Tăng điểm
                    score++;
                    scoreElement.innerText = hardMode ? `H ${score}` : score;

                    // Tạo 1 Food mới khác
                    addNewApple();

                    contrast = Math.min(1, contrast + contrastIncrease);

                    console.log(`Độ rõ nét tăng lên ${contrastIncrease * 100}%`);
                    console.log(
                        "Tốc độ mờ từ 100% đến 0%",
                        Math.pow(fadeExponential, score) * fadeSpeed
                    );
                }

                stepsTaken++;
            } else {
                transition(percentageOfStep);
            }

            if (lastTimestamp) {
                // Nhiều điềm thì thời gian trôi đi sẽ chậm hơn
                const contrastDecrease =
                    timeElapsedSinceLastCall /
                    (Math.pow(fadeExponential, score) * fadeSpeed);
                contrast = Math.max(0, contrast - contrastDecrease);
            }

            contrastElement.innerText = `${Math.floor(contrast * 100)}%`;
            containerElement.style.opacity = contrast;

            window.requestAnimationFrame(main);
        } catch (error) {
            // Bắt đầu và độ khó
            const pressSpaceToStart = "Nhấn Space để chơi.";
            const changeMode = hardMode
                ? "Nhấn E để quay lại chế độ DỄ."
                : "Nhấn H để sang độ khó HARD.";
        }

        lastTimestamp = timestamp;
    }

    function stepAndTransition(percentageOfStep) {
        const newHeadPosition = getNextPosition();
        console.log(`Snake stepping into tile ${newHeadPosition}`);
        snakePositions.push(newHeadPosition);

        const previousTail = tiles[snakePositions[0]];
        setTile(previousTail);

        if (newHeadPosition != applePosition) {
            snakePositions.shift();

            const tail = tiles[snakePositions[0]];
            const tailDi = tailDirection();
            // Đuôi
            const tailValue = `${100 - percentageOfStep * 100}%`;

            if (tailDi == "right")
                setTile(tail, {
                    left: 0,
                    width: tailValue,
                    "background-color": color
                });

            if (tailDi == "left")
                setTile(tail, {
                    right: 0,
                    width: tailValue,
                    "background-color": color
                });

            if (tailDi == "down")
                setTile(tail, {
                    top: 0,
                    height: tailValue,
                    "background-color": color
                });

            if (tailDi == "up")
                setTile(tail, {
                    bottom: 0,
                    height: tailValue,
                    "background-color": color
                });
        }

        // Size của đầu
        const previousHead = tiles[snakePositions[snakePositions.length - 2]];
        setTile(previousHead, { "background-color": color });

        // Thiết lập và bắt đầu cho bước di chuyển
        // Đảm bảo đsung kích thước
        const head = tiles[newHeadPosition];
        const headDi = headDirection();
        const headValue = `${percentageOfStep * 100}%`;

        if (headDi == "right")
            setTile(head, {
                left: 0, // Sang trái
                width: headValue,
                "background-color": color,
                "border-radius": 0
            });

        if (headDi == "left")
            setTile(head, {
                right: 0, // Sang phải
                width: headValue,
                "background-color": color,
                "border-radius": 0
            });

        if (headDi == "down")
            setTile(head, {
                top: 0, // Di chuyển lên
                height: headValue,
                "background-color": color,
                "border-radius": 0
            });

        if (headDi == "up")
            setTile(head, {
                bottom: 0, // Di chuyển xuống
                height: headValue,
                "background-color": color,
                "border-radius": 0
            });
    }

    // Đầu và đuôi
    // Di chuyển trong khung hình
    function transition(percentageOfStep) {
        // Đầu
        const head = tiles[snakePositions[snakePositions.length - 1]];
        const headDi = headDirection();
        const headValue = `${percentageOfStep * 100}%`;
        if (headDi == "right" || headDi == "left") head.style.width = headValue;
        if (headDi == "down" || headDi == "up") head.style.height = headValue;

        // Đuôi
        const tail = tiles[snakePositions[0]];
        const tailDi = tailDirection();
        const tailValue = `${100 - percentageOfStep * 100}%`;
        if (tailDi == "right" || tailDi == "left") tail.style.width = tailValue;
        if (tailDi == "down" || tailDi == "up") tail.style.height = tailValue;
    }

    // Di chuyển của rắn
    // Rắn cắn đuối hoặc va vào tường
    function getNextPosition() {
        const headPosition = snakePositions[snakePositions.length - 1];
        const snakeDirection = inputs.shift() || headDirection();
        switch (snakeDirection) {
            case "right": {
                const nextPosition = headPosition + 1;
                if (nextPosition % width == 0) throw Error("Rắn va vào tường");
                //
                if (snakePositions.slice(1).includes(nextPosition))
                    throw Error("Rắn tự cắn mình");
                return nextPosition;
            }
            case "left": {
                const nextPosition = headPosition - 1;
                if (nextPosition % width == width - 1 || nextPosition < 0)
                    throw Error("Rắn va vào tường");
                // Ignore the last snake part, it'll move out as the head moves in
                if (snakePositions.slice(1).includes(nextPosition))
                    throw Error("Rắn tự cắn mình");
                return nextPosition;
            }
            case "down": {
                const nextPosition = headPosition + width;
                if (nextPosition > width * height - 1)
                    throw Error("Rắn va vào tường");
                //
                if (snakePositions.slice(1).includes(nextPosition))
                    throw Error("Rắn tự cắn mình");
                return nextPosition;
            }
            case "up": {
                const nextPosition = headPosition - width;
                if (nextPosition < 0) throw Error("Rắn va vào tường");
                // Khi đầu rắn đâm vào đuôi
                if (snakePositions.slice(1).includes(nextPosition))
                    throw Error("You Dead");
                return nextPosition;
            }
        }
    }

    // Đầu rắn
    function headDirection() {
        const head = snakePositions[snakePositions.length - 1];
        const neck = snakePositions[snakePositions.length - 2];
        return getDirection(head, neck);
    }

    // Đuôi rắn
    function tailDirection() {
        const tail1 = snakePositions[0];
        const tail2 = snakePositions[1];
        return getDirection(tail1, tail2);
    }

    function getDirection(first, second) {
        if (first - 1 == second) return "right";
        if (first + 1 == second) return "left";
        if (first - width == second) return "down";
        if (first + width == second) return "up";
        throw Error("the two tile are not connected");
    }

    // Tạo 1 Food mới
    function addNewApple() {
        // Vị trí mới cho Food
        let newPosition;
        do {
            newPosition = Math.floor(Math.random() * width * height);
        } while (snakePositions.includes(newPosition));

        // Food mới
        setTile(tiles[newPosition], {
            "background-color": color,
            "border-radius": "50%"
        });

        // Lưu ý
        applePosition = newPosition;
    }

    // Liên quan đến css
    function setTile(element, overrides = {}) {
        const defaults = {
            width: "100%",
            height: "100%",
            top: "auto",
            right: "auto",
            bottom: "auto",
            left: "auto",
            "background-color": "transparent"
        };
        const cssProperties = { ...defaults, ...overrides };
        element.style.cssText = Object.entries(cssProperties)
            .map(([key, value]) => `${key}: ${value};`)
            .join(" ");
    }
});