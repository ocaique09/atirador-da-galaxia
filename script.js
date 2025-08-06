// Canvas & UI Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('gameOver-screen');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('finalScore');
const shootButton = document.getElementById('shoot-button');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game Variables
let player, projectiles, enemies, particles, score, animationId;
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false
};

// Game Object Classes
class Player {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 8;
        this.emoji = '🚀';
    }

    draw() {
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.emoji, this.x + this.width / 2, this.y + this.height - 5);
    }

    update() {
        if (keys.ArrowLeft && this.x > 0) {
            this.x -= this.speed;
        }
        if (keys.ArrowRight && this.x < canvas.width - this.width) {
            this.x += this.speed;
        }
        this.draw();
    }
}

class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.color = '#ffeb3b';
        this.velocity = { x: 0, y: -8 };
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.y += this.velocity.y;
        this.draw();
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.velocity = { y: Math.random() * 2 + 1 };
        this.emoji = ['👾', '👽', '🛸'][Math.floor(Math.random() * 3)];
    }

    draw() {
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.emoji, this.x, this.y);
    }
    
    update() {
        this.y += this.velocity.y;
        this.draw();
    }
}

class Particle {
     constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 2;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * (Math.random() * 6),
            y: (Math.random() - 0.5) * (Math.random() * 6)
        };
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02;
        this.draw();
    }
}


// --- Game Functions ---
function init() {
    player = new Player();
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreDisplay.textContent = 0;
    finalScoreDisplay.textContent = 0;
}

function spawnEnemies() {
    setInterval(() => {
        if (animationId) {
            const x = Math.random() * (canvas.width - 50) + 25;
            enemies.push(new Enemy(x, -30));
        }
    }, 1200);
}

function handleCollision() {
    // Projectile hits enemy
    projectiles.forEach((proj, pIndex) => {
        enemies.forEach((enemy, eIndex) => {
            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
            if (dist - enemy.radius - proj.radius < 1) {
                // Create explosion particles
                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(enemy.x, enemy.y, '#ff4500'));
                }
                
                setTimeout(() => {
                    enemies.splice(eIndex, 1);
                    projectiles.splice(pIndex, 1);
                    score += 100;
                    scoreDisplay.textContent = score;
                }, 0);
            }
        });
    });

    // Enemy hits player
    enemies.forEach((enemy) => {
        const dist = Math.hypot(player.x + player.width/2 - enemy.x, player.y + player.height/2 - enemy.y);
        if (dist - enemy.radius - player.width / 2 < 1 || enemy.y > canvas.height) {
            cancelAnimationFrame(animationId);
            animationId = null;
            finalScoreDisplay.textContent = score;
            gameOverScreen.classList.remove('hidden');
            shootButton.classList.add('hidden');
        }
    });
}

function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(12, 10, 24, 0.2)'; // Fading effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.update();
    
    particles.forEach((particle, index) => {
        if(particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    projectiles.forEach((proj, index) => {
        if (proj.y + proj.radius < 0) {
            projectiles.splice(index, 1);
        } else {
            proj.update();
        }
    });

    enemies.forEach(enemy => enemy.update());

    handleCollision();
}

// --- Event Listeners ---
function shoot() {
    projectiles.push(new Projectile(player.x + player.width / 2, player.y));
}

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && animationId) {
        e.preventDefault();
        shoot();
    }
});
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Touch controls
let isTouching = false;
canvas.addEventListener('touchstart', (e) => {
    isTouching = true;
    handleTouchMove(e);
});
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', () => isTouching = false);

function handleTouchMove(e) {
    if (isTouching && animationId) {
        let touchX = e.touches[0].clientX;
        player.x = touchX - player.width / 2;
    }
}

shootButton.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent screen zoom
    if (animationId) shoot();
});

// Game State Buttons
startButton.addEventListener('click', () => {
    init();
    animate();
    spawnEnemies();
    startScreen.classList.add('hidden');
    shootButton.classList.remove('hidden'); // Show for mobile
});

restartButton.addEventListener('click', () => {
    init();
    animate();
    gameOverScreen.classList.add('hidden');
    shootButton.classList.remove('hidden');
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if(player) {
       player.y = canvas.height - player.height - 20;
    }
});
