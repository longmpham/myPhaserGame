//SECTION 1 - Preload
function preload() {

    game.load.baseURL = 'http://examples.phaser.io/assets/';
    game.load.crossOrigin = 'anonymous';
    
    game.load.image('stars', 'misc/starfield.jpg');
    game.load.spritesheet('ship', 'sprites/humstar.png', 32, 32);
    game.load.image('monster', 'sprites/shinyball.png');
    game.load.image('bullet', 'sprites/bullet');
    game.load.spritesheet('boom', 'sprites/explosion.png', 64, 64);
    game.load.image('heart', 'sprites/carrot.png');
    game.load.spritesheet('coin', 'sprites/coin.png', 32, 32);
    
    game.load.image('weaponBox', 'sprites/block.png');
        
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//SECTION 2 - Create

//global variables
var ship;                   //spaceship
var starfield;              //background
var cursors;                //controls
var bullets;                //bullets to shoot stuff
var fireRate = 50;         //how fast bullets shoot
var nextFire = 0;   
var monsters;               //the monster, duh!
var numberOfMonsters = 10;
var monsterSpeed = 50;
var explosions;             //add some explosions when things 'die'
var hearts;                 
var lifeText;               
var gameOverText;           
var worldBoundX = 1600;     //world bounds
var worldBoundY = 1200;     //world bounds
var tolerance = 500;        //tolerance for spawning meteors
var setAmountOfLives = 3;   //life points
var pointsText;
var points = 0;
var coin;
var highScoreText;
var highScoreNumber = 0;
var pointsInterval = 0;
var spawningInterval = 0;
var randomizeTimer = 0;

//var weaponBox;


function create() {
    
    //world physics stuff
    game.world.setBounds(0, 0, worldBoundX, worldBoundY);
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.defaultRestitution = 0.9;

    //background
    starfield = game.add.tileSprite(0, 0, 800, 600, 'stars');
    starfield.fixedToCamera = true;

    //create coin/points
	coin = game.add.sprite(game.world.randomX, game.world.randomY, 'coin');
    coin.animations.add('coinAnimation', [0,1,2,3,4,5], 10, true);
    coin.play('coinAnimation');
    game.physics.enable(coin, Phaser.Physics.ARCADE);


    //make weapon box!
    weaponBox = game.add.sprite(game.world.randomX, game.world.randomY, 'weaponBox');
    weaponBox.scale.set(0.25); //make the weaponbox smaller than the image itself
    game.physics.enable(weaponBox, Phaser.Physics.ARCADE);


    //gameover text is hidden until activated
    gameOverText = game.add.text(200, 300, ' ', {
        font: '48px Arial', 
        fill: '#fff' });
    gameOverText.visible = false;
    gameOverText.fixedToCamera = true;
    
    //highscore text is hidden until game is over
    highScoreText = game.add.text(200, 100, ' ', {
        font: '48px Arial', 
        fill: '#fff' });
    highScoreText.visible = false;
    highScoreText.fixedToCamera = true;

    //add life
    hearts = game.add.group();
    hearts.fixedToCamera = true;
    lifeText = game.add.text(40, 30, 'Lives: ' , {
        font: '34px Arial',
        fill: '#fff'
    });
    lifeText.fixedToCamera = true;
    createLives();
    
    //points system text
    pointsText = game.add.text(500, 30, 'Points: ' , {
        font: '34px Arial',
        fill: '#fff'
    });
    pointsText.fixedToCamera = true;

    //add explosions animations to each monster
    explosions = game.add.group();
    explosions.createMultiple(50, 'boom');
    explosions.forEach(addExplosionAnimation, this);
    
    //add spaceship stuff
	ship = game.add.sprite(200, 100, 'ship');
    ship.scale.set(2);
    ship.smoothed = false;
    ship.animations.add('fly', [0,1,2,3,4,5], 10, true);
    ship.play('fly');
    ship.animations.add('boom');
    
    //monster group?
    monsters = game.add.group()
    monsters.enableBody = true;
    monsters.physicsBodyType = Phaser.Physics.ARCADE;
    
    //spawn monster group
    createMonsters();

    //set arcade stuff for ship (collision handling etc.)
    game.physics.enable(ship, Phaser.Physics.ARCADE);
	game.camera.follow(ship);       // camera movement
	ship.body.collideWorldBounds = true;

    cursors = game.input.keyboard.createCursorKeys();
    
    //bullet stuff
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    bullets.createMultiple(50, 'bullet');
    bullets.setAll('checkWorldBounds', true);
    bullets.setAll('outOfBoundsKill', true);
    
    start();

}

function createMonsters(){
    var count = 0;
    var inverseTolerance = tolerance;
    
    while(count < numberOfMonsters){
        inverseTolerance = inverseTolerance * -1;
        
        var randX = game.world.randomX + inverseTolerance;
        var randY = game.world.randomY + inverseTolerance;
        
        //a < x == x < b (check if number is between range)
        if(ship.position.x - tolerance < randX == randX < ship.position.x + tolerance){
            continue; //if the number is, then its too close to the ship! redo.
        }
        
        count += 1;
        var monster = monsters.create(randX, randY, 'monster');
    }
}

function randomizeObjectLocation(objectToRandomize){
    objectToRandomize.x = game.world.randomX;
    objectToRandomize.y = game.world.randomY;
}

function addExplosionAnimation(monster){
    monster.animations.add('boom');
}

function createLives(){
    for(var i = 0; i < setAmountOfLives; i++){
        var heart = hearts.create(200 - (30 * i), 40, 'heart');
    }
}


function start(){

    points = 0;
    game.time.reset();
    
    numberOfMonsters = 10;
    
    hearts.callAll('revive');
    
    monsters.removeAll();
    numberOfMonsters = 10;
    monsterSpeed = 50;
    
    createMonsters();
    ship.revive();
    randomizeObjectLocation(coin);
    randomizeObjectLocation(weaponBox);

    gameOverText.visible = false;
    highScoreText.visible = false;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//SECTION 3 - Update

function update() {
    
    //ship movement controls
    movementControls();
    
    //world can move too! 
    worldMovementControls();

    //allow ship to fire stuff
    shipFireControls();

    //collision detection controls
    collisionDetection();
  
    //make the monsters follow you
    monsterMovement();
    
    //increase points over time
    increaseThePoints();
    
    //spawn creeps
    spawnMonster();
    
    //randomize objects every x seconds to make it more interesting
    randomizeObjectTimer();

}

function randomizeObjectTimer(){
    if(game.time.now > randomizeTimer && hearts.countLiving() > 0){
        randomizeObjectLocation(coin);
        randomizeObjectLocation(weaponBox);
        randomizeTimer = game.time.now + 5000;
    }
}

function spawnMonster(){
    if(game.time.now > spawningInterval && hearts.countLiving() > 0){
        //release it here
        if(numberOfMonsters !== 30){ //cap # of monsters
            numberOfMonsters += 1;
        }
        if(monsterSpeed !== 150){   //cap monster's speed
            monsterSpeed += 3;
        }
        createMonsters();
        spawningInterval = game.time.now + 4000;
    }
}

function increaseThePoints(){
    if(game.time.now > pointsInterval && hearts.countLiving() > 0){
        //increase points
        increasePoints(1);
        pointsInterval = game.time.now + 1000;
    }
}

function increasePoints(amount){
    if(hearts.countLiving() > 0){
        points += amount;
        pointsText.text = "Points: " + points;
    }
}

//fire your bullets
function fire() {
    if (game.time.now > nextFire && bullets.countDead() > 0){
        nextFire = game.time.now + fireRate;
        var bullet = bullets.getFirstDead();
        bullet.reset(ship.x + 30, ship.y + 30);
        game.physics.arcade.moveToPointer(bullet, 600);
    }
}

//you hit a monster with a bullet!
function bulletHitMonster (bullet, monster) {
    // When a bullet hits a monster we kill them both
    bullet.kill();
    monster.kill();

    // boom! 
    var explosion = explosions.getFirstExists(false);
    explosion.reset(monster.body.x, monster.body.y);
    explosion.play('boom', 30, false, true);
}

//monster hit you, reduce life etc.
function monsterHitShip(theShip, theMonster){
    //kill the monster
    theMonster.kill();

    //boom!
    var explosion = explosions.getFirstExists(false);
    explosion.reset(theMonster.body.x, theMonster.body.y);
    explosion.play('boom', 30, false, true);
    
    //make health system here
    var heart = hearts.getFirstAlive();
    //if some lives exist kill it.
    if(heart){
        heart.kill();
    }
    
    //then check if there are any left, otherwise it's game over!
    if (hearts.countLiving() < 1)
    {
        theShip.kill();
        //make explosion for ship? sure!
        explosion.reset(ship.body.x, ship.body.y);
        explosion.play('boom', 30, false, true);

        gameOverText.text="GAME OVER Click to restart";
        gameOverText.visible = true;
        
        getHighScore();
        
        highScoreText.text = "HighScore: " + highScoreNumber;
        highScoreText.visible = true;

        //let player decide to play again
        game.input.onTap.addOnce(start,this);
    }
}

function getHighScore(){
    if(highScoreNumber === 0){
        //first time
        highScoreNumber = points;
    }
    else if(highScoreNumber < points){
        highScoreNumber = points;
    }
}

function monsterMovement(){
    monsters.forEach(
        //create function to make each monster move towards ship at speed 20
        function (singleMonster){
            game.physics.arcade.moveToObject(singleMonster, ship, monsterSpeed);
        },
        game.physics
    );
}

function collisionDetection(){
    //bullet hits monster, destroy it
    game.physics.arcade.overlap(bullets, monsters, bulletHitMonster, null, this);
    
    //monster hits you! uh oh.
    game.physics.arcade.overlap(ship, monsters, monsterHitShip, null, this);
    
    //collected a coin
    game.physics.arcade.overlap(ship, coin, shipHitCoin, null, this);
    
    //hit a weapon box
    game.physics.arcade.overlap(ship, weaponBox, shipHitWeaponBox, null, this);
    
}



function shipHitWeaponBox(theShip, theWeaponBox){
    //kill the weapon
    weaponBox.kill();
    
    randomizeObjectLocation(weaponBox);
    
    weaponBox.revive();
    
    //make a temporary increase in weaponspeed
    checkWeaponChange();
    
    //wait at least 5 seconds, then change back the fireRate to normal!
    setTimeout(function() {
        fireRate = 50;
    }, 5000);
}


function checkWeaponChange(){
    fireRate = fireRate / 2;
}


function shipHitCoin(theSip, theCoin){
    //kill the coin
    coin.kill();
    
    randomizeObjectLocation(coin);
    
    coin.revive();
    
    //increase points now.
    increasePoints(10);
    
}

function worldMovementControls(){
    if (!game.camera.atLimit.x){
        //moving the background
        starfield.tilePosition.x -= (ship.body.velocity.x * game.time.physicsElapsed);
    }

    if (!game.camera.atLimit.y){
        //moving the background
        starfield.tilePosition.y -= (ship.body.velocity.y * game.time.physicsElapsed);
    }
}

function movementControls(){
    
    //create 'wasd' object to move with these keys also
    wasdControls = {
        up: game.input.keyboard.addKey(Phaser.Keyboard.W),
        down: game.input.keyboard.addKey(Phaser.Keyboard.S),
        left: game.input.keyboard.addKey(Phaser.Keyboard.A),
        right: game.input.keyboard.addKey(Phaser.Keyboard.D)
    };
    
    //dont move unless i say so!
    ship.body.velocity.setTo(0, 0);

    //left,right,up,down movement
    if ((wasdControls.left.isDown || cursors.left.isDown) && hearts.countLiving() > 0){
		ship.body.velocity.x = -200;
		
    }
    else if ((wasdControls.right.isDown || cursors.right.isDown) && hearts.countLiving() > 0){
		ship.body.velocity.x = 200;
    }

    if ((wasdControls.up.isDown || cursors.up.isDown) && hearts.countLiving() > 0){
    	ship.body.velocity.y = -200;
    }
    else if ((wasdControls.down.isDown || cursors.down.isDown) && hearts.countLiving() > 0){
        ship.body.velocity.y = 200;
    }
    
}

function shipFireControls(){
    //control spaceship to point at something to shoot
    game.physics.arcade.angleToPointer(ship);
    
    //click, aim and shoot stuff
    if (game.input.activePointer.isDown && hearts.countLiving() > 0){
        fire();
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//SECTION 4 - Render

function render() {

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



