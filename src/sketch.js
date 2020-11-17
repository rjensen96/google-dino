// IDEAS:
// you can jump off the top of blocks?

// Constants: gameplay mechanics
const GAME_FRAME_RATE = 160;
let GAME_STARTED = 0;

// Constants: positioning
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const DINO_START_X = 100;
const DINO_START_Y = 300;
const DINO_JUMP_SPEED = 20;
const FLOOR_Y = 300;
const GRAVITY = 2;
const MAX_LONG_JUMP_FRAMES = 7;

// Constants: blocks
const BLOCK_STROKE_WIDTH = 0;
const PLAYER_WIDTH = 25;
const PLAYER_HEIGHT = 25;

// Constants: colors
const COLOR_BACKGROUND = [10];
const COLOR_DINO = [245, 242, 4];
const COLOR_OBSTACLE = [
    [25, 64, 232],
    [219, 44, 205],
    [36, 242, 116],
    [235, 88, 0]
];

// Constants: obstacles
const SAFE_FRAME_RANGE = [20, 60];
const OBS_WIDTH_RANGE = [20, 30];
const OBS_HEIGHT_RANGE = [20, 80];

// Empty classes, Default Parameters
let theDino;
let theRoad;
let obstacles = [];
let Obstacle_Velocity = -6;
let FramesToNextObstacle = 50;
let Player_Score = 0;

function preload() {
    // getting server errors trying to load media. need to look into this.
    // IMG_STILL = loadImage('../assets/still.png');
    // IMG_RIGHT = loadImage('../assets/right.png');
    // IMG_LEFT = loadImage('../assets/left.png');
    // IMG_JUMP = loadImage('../assets/jump.png');
}

function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    colorMode(RGB);
    frameRate(GAME_FRAME_RATE);
    background(COLOR_BACKGROUND);
    rectMode(CORNERS);
    textSize(24);
    textFont('Consolas');
}

function draw() {
    initialize();
    clear();
    background(COLOR_BACKGROUND);
    postScore();
    checkForCollisions();
    theRoad.render();
    theDino.render();
    
    if (GAME_STARTED === 1) {
        theDino.move();
        theRoad.moveStripes();
        moveObstacles();
        makeObstacles();
    }
}

function initialize() {
    if (GAME_STARTED === 0) {
        theDino = new GameBlock();
        theRoad = new Road();
        // obstacles.push(new Obstacle(20, 35));
    }
}

function postScore() {
    fill(COLOR_DINO);

    if(GAME_STARTED === 0) {
        textSize(48);
        text('JUMPY BEAN LADY', 40, 70);
        textSize(24);
        text('Hit up arrow to start', 40, 370);
    } else {
        text('Score: ' + Player_Score, 40, 370);
    }
}

function moveObstacles() {
    // keep obstacles that are still on screen. others are destroyed
    obstacles = obstacles.filter(block => {
        if (block.x + block.w > 0) {
            return block;
        } else {
            Player_Score++; // because it passed them, and they jumped over it.
            // go faster as player gets more points.
            if(Player_Score > 0 && Player_Score % 5 === 0) {
                Obstacle_Velocity -= .5;
            }
        }
    })

    // shift all obstacles
    obstacles.forEach(block => {
        block.move();
        block.render();
    })

}

function makeObstacles() {
    FramesToNextObstacle--;
    if(FramesToNextObstacle === 0) {
        let w = Math.floor(Math.random() * OBS_WIDTH_RANGE[1]) + OBS_WIDTH_RANGE[0];
        let h = Math.floor(Math.random() * OBS_HEIGHT_RANGE[1]) + OBS_HEIGHT_RANGE[0];
        obstacles.push(new Obstacle(w, h))
        FramesToNextObstacle = Math.floor(Math.random() * SAFE_FRAME_RANGE[1]) + SAFE_FRAME_RANGE[0];
    }
}

function checkForCollisions() {
    // filter the list of obstacles so we don't have to check as much
    // not sure if this will actually help performance, but maybe it could?

    const shortObs = obstacles.filter(block => {
        if(block.x <= DINO_START_X + PLAYER_WIDTH) {
            return block;
        }
    })

    shortObs.forEach(block => {
        if(objectsCollided(block, theDino)) {
            frameRate(0);
            textSize(48);
            text(`BEAN SOUP'D.`, 40, 70);
        }
    })
}

const objectsCollided = (objA, objB) => {  
    if (objA.x + objA.w >= objB.x &&    // r1 right edge past r2 left
        objA.x <= objB.x + objB.w &&    // r1 left edge past r2 right
        objA.y + objA.h >= objB.y &&    // r1 top edge past r2 bottom
        objA.y <= objB.y + objB.h) {    // r1 bottom edge past r2 top
            return true;
    }
    return false;
};

class GameBlock {
    constructor() {
        this.x = DINO_START_X;
        this.y = FLOOR_Y;
        this.w = PLAYER_WIDTH;
        this.h = PLAYER_HEIGHT;
        this.velocity = 0;
        this.myColor = color(COLOR_DINO) // default to dino color
        this.jumping = false;
        this.jumpFrames = 0; // number of consecutive frames Dino has been jumping (handles long press)
        this.numJumps = 0; // it can only do one jump at once, no jumping on the air.
    }

    jump() {
        if (this.jumping === false) {
            this.jumping = true;
            this.velocity = DINO_JUMP_SPEED;
            this.numJumps = 1;
        }
    }
    
    move() {

        // force of gravity
        if (this.jumping === true) {
            this.y -= this.velocity; // negative Y is actually up, because [0, 0] is top left
            this.velocity -= GRAVITY;
        }

        // high jump | long press
        if (keyIsPressed === true && keyCode === UP_ARROW) {
            if (this.jumpFrames < MAX_LONG_JUMP_FRAMES && this.numJumps <= 1) {
                this.velocity = DINO_JUMP_SPEED;
                this.jumpFrames++;
            }
        } else {
            this.numJumps++; // they released the key, so numJumps increments. don't let them jump again.
        }

        // land.
        if (this.y >= FLOOR_Y) {
            this.y = FLOOR_Y; // dont go below ground level, ever.
            this.jumping = false;
            this.jumpFrames = 0;
            this.numJumps = 0;
        }
    }

    render() {
        fill(this.myColor);
        stroke(BLOCK_STROKE_WIDTH);
        rect(this.x, this.y, this.x + this.w, this.y - this.h);
    }
}

class Obstacle {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.x = CANVAS_WIDTH;
        this.y = FLOOR_Y;
        this.myColor = color(COLOR_OBSTACLE[Math.floor(Math.random() * COLOR_OBSTACLE.length)]);
    }

    move() {
        this.x += Obstacle_Velocity
    }

    render() {
        fill(this.myColor);
        rect(this.x, this.y, this.x + this.w, this.y - this.h);
    }

}

function keyPressed() {
    if (keyCode === UP_ARROW) {
        GAME_STARTED = 1;
        theDino.jump();
    }
    return false;
}

class Road {

    constructor() {
        this.stripe_len = 90;
        this.gap = 80;
        this.stripe_level = FLOOR_Y + 15;
        this.myColor = [24, 48, 255];
        this.stripes = [];
        this.loadStripes();
    }
    
    loadStripes() {
        for (let i = 0; i < (CANVAS_WIDTH + this.stripe_len); i+=(this.stripe_len + this.gap)) {
            this.stripes.push({
                a: i, 
                b: (i + this.stripe_len), 
                y: this.stripe_level
            })
        }
    }

    moveStripes() {
        let n = 0;
        
        // filter out defunct stripes
        this.stripes = this.stripes.filter(stripe => {
            if (stripe.b > 0) {
                return stripe;
            } else {
                n++;
            }
        })

        // move remaining stripes
        this.stripes.forEach(stripe => {
            stripe.a += Obstacle_Velocity;
            stripe.b += Obstacle_Velocity;
        })

        if (n > 0) {
            this.stripes.push({
                a: this.stripes[this.stripes.length - 1].b + this.gap,
                b: this.stripes[this.stripes.length - 1].b + this.gap + this.stripe_len,
                y: this.stripe_level
            })
        }
    }

    render() {
        stroke(this.myColor);
        strokeWeight(5);

        line(0, FLOOR_Y - 20, CANVAS_WIDTH, FLOOR_Y - 20); // EDGE OF ROAD

        strokeWeight(3);
        this.stripes.forEach(stripe => {
            line(stripe.a, stripe.y, stripe.b, stripe.y); // STRIPES 
        })

        strokeWeight(0); // turn this back off.   
    }
}