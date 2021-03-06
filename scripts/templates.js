let ts = 48;

const AI = {};
const BULLET = {};
const COLOR = {};
const ITEM = {};
const MODEL = {};
const PART = {};
const PS = {};
const SOUND = {};
const TANK = {};
const WEAPON = {};


// AIs

AI.aim = {
    act: function() {
        this.t.aim(pl.pos.x, pl.pos.y);
        this.t.face(pl.pos.x, pl.pos.y);
    }
};

AI.follow = {
    act: function() {
        this.t.aim(pl.pos.x, pl.pos.y);
        this.t.navigateTo(pl.pos.x, pl.pos.y);
    }
};

AI.hunter = {
    act: function() {
        this.t.aim(pl.pos.x, pl.pos.y);
        this.t.navigateTo(pl.pos.x, pl.pos.y);
        if (this.t.pos.dist(pl.pos) < ts * 8) this.t.fire(pl.pos.x, pl.pos.y);
    }
};

AI.wander = {
    act: function() {
        this.t.aim(pl.pos.x, pl.pos.y);
        if (this.t.contains(this.target.x, this.target.y)) {
            this.target = map.randomPos();
        } else {
            this.t.navigateTo(this.target.x, this.target.y);
        }
    },
    init: function() {
        this.target = map.randomPos();
    }
};


// Bullets

BULLET.basic = {};


// Colors (organized by [light, dark])

COLOR.green = ['#007C21', '#005C01'];
COLOR.teal = ['#007B70', '#005B50'];
COLOR.orange = ['#E67E22', '#C86400'];
COLOR.red = ['#A70C00', '#870000'];
COLOR.purple = ['#5E147D', '#4E046D'];
COLOR.blue = ['#004790', '#102770'];


// Models

// Null model
MODEL.null = function(e) {};

// Bullet models
MODEL.basicBullet = function(b) {
    fill(0);
    noStroke();
    ellipseMode(RADIUS);
    ellipse(b.pos.x, b.pos.y, b.radius, b.radius);
};

// Item models
MODEL.shieldItem = function(e) {
    fill(e.color[0]);
    stroke(0);
    rectMode(CENTER);
    rect(e.pos.x, e.pos.y, e.radius, e.radius);
};

// Particle models
MODEL.basicParticle = function(p) {
    fill(p.color.concat(p.lifespan));
    stroke(0, p.lifespan);
    ellipseMode(RADIUS);
    ellipse(p.pos.x, p.pos.y, p.radius, p.radius);
};

MODEL.squareParticle = function(p) {
    push();

    translate(p.pos.x, p.pos.y);
    rotate(p.angle);

    fill(p.color.concat(p.lifespan));
    stroke(0, p.lifespan);
    rectMode(CENTER);
    rect(0, 0, this.radius, this.radius);
    
    pop();
};

// Tank models
MODEL.basicTank = function(t) {
    push();

    translate(t.pos.x, t.pos.y);
    rotate(t.angle);

    // Draw treads
    fill('#3C4A59');
    stroke(0);
    rectMode(CENTER);
    let d = ts * 0.33;
    rect(0, d, ts * 1.15, ts * 0.2);
    rect(0, -d, ts * 1.15, ts * 0.2);


    // Draw tank body
    fill(t.color[0]);
    rect(0, 0, ts, ts * 0.7, ts * 0.15);

    // Draw markings on front
    let m = ts * 0.45;
    let c = ts * 0.35;
    let e = ts * 0.15;
    fill('#606060');
    triangle(m, 0, c, e, c, -e);

    rotate(t.gunAngle);

    // Draw barrel
    let r = ts * 0.35;
    fill('#808080');
    rect(r, 0, r * 2, ts * 0.2);

    // Draw muzzle
    let w = ts * 0.05;
    fill('#606060');
    rect(r * 2 + w, 0, w * 2, ts * 0.3);

    // Draw turret
    fill(t.color[1]);
    ellipseMode(CENTER)
    ellipse(0, 0, ts * 0.5, ts * 0.5);

    pop();
};


// Items

ITEM.shield = {
    // Display
    color: COLOR.blue,
    model: MODEL.shieldItem,
    // Physics
    radius: ts / 3,
    // Methods
    action(t) {
        t.armor++;
    }
};

ITEM.fastFire = {
    // Display
    color: COLOR.green,
    model: MODEL.shieldItem,
    // Physics
    radius: ts / 3,
    // Methods
    action(t) {
        if (t.bCool > 2) t.bCool -= 2;
    }
};

ITEM.moveSpeed = {
    // Display
    color: COLOR.red,
    model: MODEL.shieldItem,
    // Physics
    radius: ts / 3,
    // Methods
    action(t) {
        t.maxSpeed *= 1.25;
        t.speed = t.maxSpeed;
    }
};

ITEM.shotgun = {
    // Display
    color: COLOR.orange,
    model: MODEL.shieldItem,
    // Physics
    radius: ts / 3,
    // Methods
    action(t) {
        t.weapon = new Weapon(t, WEAPON.shotgun);
    }
};

ITEM.star = {
    // Display
    color: COLOR.purple,
    model: MODEL.shieldItem,
    // Physics
    radius: ts / 3,
    // Methods
    action(t) {
        t.weapon = new Weapon(t, WEAPON.star);
    }
};


// Particles

PART.fire = {
    // Display
    color: [192, 57, 43],
    model: MODEL.squareParticle,
    // Misc
    decay: 3,
    // Methods
    init: function() {
        // Display
        this.color = [200 + random(55), random(127), random(31)];

        // Misc
        this.decay = random(3, 6);

        // Physics
        this.angle = random(TWO_PI);
        this.angVel = random(-2, 2);
        this.radius = random(6, 12);
    }
};


// Particle systems

PS.explosion = {
    num: 32,
    pTemp: PART.fire,
    speed: 3
};


// Weapons

WEAPON.bullet = {};

WEAPON.shotgun = {
    // Methods
    fire: function(x, y) {
        if (this.cooldown > 0) return;
        this.cooldown = this.t.bCool;
        play(this.sound);
        let a = createVector(x, y).sub(this.t.pos).heading();
        bullets.push(new Bullet(this.t.pos.x, this.t.pos.y, a, this.bulletType, this.t));
        let da = radians(15);
        bullets.push(new Bullet(this.t.pos.x, this.t.pos.y, a + da, this.bulletType, this.t));
        bullets.push(new Bullet(this.t.pos.x, this.t.pos.y, a - da, this.bulletType, this.t));
    }
};

WEAPON.star = {
    // Methods
    fire: function() {
        if (this.cooldown > 0) return;
        this.cooldown = this.t.bCool;
        play(this.sound);
        let a = 0;
        let ct = 8;
        for (let i = 0; i < ct; i++) {
            bullets.push(new Bullet(this.t.pos.x, this.t.pos.y, a, this.bulletType, this.t));
            a += radians(360 / ct);
        }
    }
};


// Tanks

TANK.player1 = {
    // Display
    color: COLOR.blue,
    // Stats
    armor: 15,
    canPickUp: true
};

TANK.basic = {
    // AI
    ai: AI.hunter,
    // Stats
    canPickUp: true
};

TANK.fast = {
    // AI
    ai: AI.hunter,
    // Display
    color: COLOR.teal,
    // Stats
    armor: 1,
    bCool: 28,
    canPickUp: true,
    maxSpeed: ts / 60 * 6
};

TANK.heavy = {
    // AI
    ai: AI.hunter,
    // Display
    color: COLOR.orange,
    // Stats
    armor: 3,
    bCool: 26,
    canPickUp: true
};

TANK.adv = {
    // AI
    ai: AI.hunter,
    // Display
    color: COLOR.red,
    // Stats
    armor: 2,
    bCool: 22,
    canPickUp: true,
    maxSpeed: ts / 60 * 4.5
};

TANK.boss = {
    // AI
    ai: AI.hunter,
    // Display
    color: COLOR.purple,
    // Stats
    armor: 6,
    bCool: 24,
    canPickUp: true,
    maxSpeed: ts / 60 * 5
};
