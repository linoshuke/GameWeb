const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreElement');
const levelElement = document.getElementById('levelElement');
const playerImage = document.getElementById('playerShip');
const hpFill = document.getElementById('hpFill');
const hpText = document.getElementById('hpText');

// Set ukuran canvas
canvas.width = 800;
canvas.height = 600;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    width: 80,
    height: 60,
    speed: 5,
    dx: 0,
    canShoot: true,
    shootCooldown: 500,
    maxHp: 100,
    currentHp: 100
};

// Projectiles
let projectiles = [];
const projectileSpeed = 7;

// Aliens
let aliens = [];
const alienRows = 3;
const alienCols = 6;
const alienWidth = 40;
const alienHeight = 30;
const alienPadding = 10;
let alienDirection = 1;
let alienStepDown = 30;
const ALIEN_SHOOT_CHANCE = 0.002;

// Game state
let score = 0;
let level = 1;
let alienSpeed = 1;
let enemiesDefeated = 0;
let attackSpeedBuff = 0;
const BUFF_INCREMENT = 0.05; // 5% per buff
const MAX_ATTACK_SPEED_BUFF = 0.50; // Maksimal 50% buff
let gameOver = false;
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// Tambahkan array untuk laser musuh
let enemyLasers = [];
const enemyLaserSpeed = 5;

// Di bagian atas file, tambahkan:
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Fungsi untuk menyesuaikan ukuran canvas
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    
    // Set ukuran canvas sesuai container dengan aspect ratio 4:3
    canvas.width = containerWidth;
    canvas.height = containerWidth * 0.75;
    
    // Reset posisi player
    player.x = canvas.width / 2;
    player.y = canvas.height - 80;
}

// Tambahkan event listener untuk resize
window.addEventListener('resize', () => {
    resizeCanvas();
});

// Update touch controls
if (isMobile) {
    const leftBtn = document.getElementById('leftButton');
    const rightBtn = document.getElementById('rightButton');
    const shootBtn = document.getElementById('shootButton');

    // Touch controls
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        player.dx = -player.speed;
    });

    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        player.dx = player.speed;
    });

    [leftBtn, rightBtn].forEach(btn => {
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            player.dx = 0;
        });
    });

    shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (player.canShoot && !gameOver) {
            projectiles.push({
                x: player.x,
                y: player.y - 20
            });
            
            const buffedCooldown = player.shootCooldown * (1 - attackSpeedBuff);
            
            player.canShoot = false;
            setTimeout(() => {
                player.canShoot = true;
            }, buffedCooldown);
        }
    });
}

// Tambahkan setelah touch controls dan sebelum game loop
// Keyboard controls untuk desktop
document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    
    if (e.key === 'ArrowLeft') {
        player.dx = -player.speed;
    }
    if (e.key === 'ArrowRight') {
        player.dx = player.speed;
    }
    if (e.key === ' ' && player.canShoot) {
        projectiles.push({
            x: player.x,
            y: player.y - 20
        });
        
        const buffedCooldown = player.shootCooldown * (1 - attackSpeedBuff);
        
        player.canShoot = false;
        setTimeout(() => {
            player.canShoot = true;
        }, buffedCooldown);
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' && player.dx < 0) {
        player.dx = 0;
    }
    if (e.key === 'ArrowRight' && player.dx > 0) {
        player.dx = 0;
    }
});

// Update game loop untuk better performance
let lastTime = 0;
const FPS = 60;
const frameTime = 1000 / FPS;

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    
    const deltaTime = timestamp - lastTime;
    
    if (deltaTime >= frameTime) {
        if (!gameOver) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            updatePlayer();
            updateProjectiles();
            updateEnemyLasers();
            updateAliens();
            
            drawPlayer();
            drawProjectiles();
            drawEnemyLasers();
            drawAliens();
            
            checkCollisions();
            
            lastTime = timestamp;
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Update inisialisasi game
function initGame() {
    resizeCanvas();
    resetGame();
    gameLoop();
}

// Ganti start game dengan initGame
initGame();

// Initialize aliens
function initAliens() {
    aliens = [];
    for (let row = 0; row < alienRows; row++) {
        for (let col = 0; col < alienCols; col++) {
            aliens.push({
                x: col * (alienWidth + alienPadding) + alienPadding,
                y: row * (alienHeight + alienPadding) + alienPadding + 30,
                width: alienWidth,
                height: alienHeight,
                alive: true
            });
        }
    }
}

// Draw functions
function drawPlayer() {
    ctx.drawImage(
        playerImage,
        player.x - player.width/2,
        player.y,
        player.width,
        player.height
    );
}

function drawProjectiles() {
    ctx.fillStyle = '#fff';
    projectiles.forEach(projectile => {
        ctx.fillRect(projectile.x - 2, projectile.y - 20, 4, 10);
    });
}

function drawAliens() {
    aliens.forEach(alien => {
        if (alien.alive) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(alien.x, alien.y, alien.width, alien.height);
        }
    });
}

function drawEnemyLasers() {
    ctx.fillStyle = '#ff0000';
    enemyLasers.forEach(laser => {
        ctx.fillRect(laser.x - 2, laser.y, 4, 10);
    });
}

// Update functions
function updatePlayer() {
    if (player.x + player.dx > player.width/2 && 
        player.x + player.dx < canvas.width - player.width/2) {
        player.x += player.dx;
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].y -= projectileSpeed;
        if (projectiles[i].y < 0) {
            projectiles.splice(i, 1);
        }
    }
}

function updateEnemyLasers() {
    for (let i = enemyLasers.length - 1; i >= 0; i--) {
        enemyLasers[i].y += enemyLaserSpeed;
        if (enemyLasers[i].y > canvas.height) {
            enemyLasers.splice(i, 1);
        }
    }
}

function updateAliens() {
    let touchedEdge = false;
    
    aliens.forEach(alien => {
        if (!alien.alive) return;
        
        alien.x += alienSpeed * alienDirection;
        
        if (alien.x <= 0 || alien.x + alienWidth >= canvas.width) {
            touchedEdge = true;
        }
        
        // Peluang alien menembak
        if (Math.random() < ALIEN_SHOOT_CHANCE) {
            enemyLasers.push({
                x: alien.x + alienWidth/2,
                y: alien.y + alienHeight
            });
        }
    });
    
    if (touchedEdge) {
        alienDirection *= -1;
        aliens.forEach(alien => {
            alien.y += alienStepDown;
        });
    }
}

// Collision detection
function checkCollisions() {
    // Check enemy laser collision with player
    enemyLasers.forEach((laser, index) => {
        if (laser.x >= player.x - player.width/2 &&
            laser.x <= player.x + player.width/2 &&
            laser.y >= player.y &&
            laser.y <= player.y + player.height) {
            
            // Kurangi HP player (damage 10)
            updatePlayerHp(-10);
            enemyLasers.splice(index, 1);
        }
    });

    // Check alien collision with player
    aliens.forEach(alien => {
        if (!alien.alive) return;
        
        // Collision with player
        if (alien.y + alienHeight >= player.y &&
            alien.x < player.x + player.width/2 &&
            alien.x + alienWidth > player.x - player.width/2) {
            handleGameOver();
        }
        
        // Game over if aliens reach bottom
        if (alien.y + alienHeight >= canvas.height) {
            handleGameOver();
        }
    });

    // Existing projectile collision code
    if (!gameOver) {
        projectiles.forEach((projectile, projectileIndex) => {
            aliens.forEach(alien => {
                if (alien.alive && 
                    projectile.x >= alien.x && 
                    projectile.x <= alien.x + alien.width &&
                    projectile.y >= alien.y && 
                    projectile.y <= alien.y + alien.height) {
                    
                    alien.alive = false;
                    projectiles.splice(projectileIndex, 1);
                    score += 10;
                    scoreElement.textContent = score;
                    
                    enemiesDefeated++;
                    if (enemiesDefeated >= 10) {
                        enemiesDefeated = 0;
                        if (attackSpeedBuff < MAX_ATTACK_SPEED_BUFF) {
                            attackSpeedBuff += BUFF_INCREMENT;
                            console.log(`Attack Speed Buff: ${(attackSpeedBuff * 100).toFixed(0)}%`);
                        }
                    }
                    
                    checkLevelComplete();
                }
            });
        });
    }
}

function checkLevelComplete() {
    if (aliens.every(alien => !alien.alive)) {
        level++;
        levelElement.textContent = level;
        alienSpeed += 0.5;
        initAliens();
    }
}

// Tambahkan fungsi untuk update HP player
function updatePlayerHp(change) {
    player.currentHp = Math.max(0, Math.min(player.maxHp, player.currentHp + change));
    const hpPercent = (player.currentHp / player.maxHp) * 100;
    hpFill.style.setProperty('--hp-percent', `${hpPercent}%`);
    hpText.textContent = `${player.currentHp}/${player.maxHp}`;
    
    if (player.currentHp <= 0) {
        handleGameOver();
    }
}

// Tambahkan fungsi untuk menghandle game over
function handleGameOver() {
    gameOver = true;
    gameOverScreen.style.display = 'block';
    finalScoreElement.textContent = score;
}

// Tambahkan fungsi reset game
function resetGame() {
    gameOver = false;
    score = 0;
    level = 1;
    alienSpeed = 1;
    enemiesDefeated = 0;
    attackSpeedBuff = 0;
    projectiles = [];
    scoreElement.textContent = score;
    levelElement.textContent = level;
    gameOverScreen.style.display = 'none';
    player.x = canvas.width / 2;
    initAliens();
    player.currentHp = player.maxHp;
    updatePlayerHp(0);
    enemyLasers = [];
}

// Tambahkan event listener untuk restart button
restartButton.addEventListener('click', () => {
    resetGame();
    gameLoop();
});
