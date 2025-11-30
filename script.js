const canvas = document.getElementById("layarGame");
const ctx = canvas.getContext("2d");

// --- 1. MUAT GAMBAR (ASSETS) ---
const imgPesawat = new Image(); imgPesawat.src = "img/p.png"; 
const imgMusuh = new Image(); imgMusuh.src = "img/m.png";
const imgBackground = new Image(); imgBackground.src = "img/bg.jpg"; 

// --- [BARU] MUAT SUARA ---
const sfxTembak = new Audio("audio/shoot.mp3");
const sfxLedakan = new Audio("audio/boom.mp3");

// Trik biar suara bisa diputar cepat (tanpa nunggu selesai)
function mainkanSuara(audio) {
    audio.pause();
    audio.currentTime = 0; // Reset ke detik 0
    audio.play();
}

// --- 2. DATA PEMAIN ---
const pesawat = {
    x: canvas.width / 2 - 50, 
    y: canvas.height - 120,    
    lebar: 100,                
    tinggi: 100,               
    kecepatan: 8               
};

const peluru = []; 
const musuh = []; 
let skor = 0; 
let isGameOver = false; 

// --- [BARU] LEVEL KESULITAN ---
let level = 1;
let kecepatanMusuhBase = 3; // Kecepatan dasar musuh

// --- 3. INPUT KEYBOARD ---
const tombolDitekan = {};

document.addEventListener("keydown", function(event) {
    tombolDitekan[event.code] = true;
    if (event.code === "Space" && !isGameOver) buatPeluru();
    if (event.code === "Enter" && isGameOver) location.reload();
});

document.addEventListener("keyup", function(event) {
    tombolDitekan[event.code] = false;
});

// --- 4. LOGIKA ---
function buatPeluru() {
    peluru.push({
        x: pesawat.x + pesawat.lebar / 2 - 5, 
        y: pesawat.y,                         
        lebar: 10,   
        tinggi: 30,  
        warna: "#00f2ff", 
        kecepatan: 10 
    });
    // [BARU] Mainkan suara tembak
    mainkanSuara(sfxTembak);
}

function buatMusuh() {
    if (isGameOver) return; 
    const randomX = Math.random() * (canvas.width - 80);
    
    // [BARU] Kecepatan musuh bertambah sesuai Level
    musuh.push({
        x: randomX,
        y: -80,      
        lebar: 80,   
        tinggi: 80,  
        kecepatan: kecepatanMusuhBase + level // Musuh makin cepat tiap level naik
    });
}

setInterval(buatMusuh, 1000); 

function update() {
    if (isGameOver) return;

    // [BARU] SISTEM LEVEL UP
    // Setiap skor nambah 50, level naik
    // Math.floor membulatkan ke bawah (misal 140/50 = 2)
    level = 1 + Math.floor(skor / 50);

    // Gerak Pesawat
    if (tombolDitekan["ArrowLeft"] && pesawat.x > 0) pesawat.x -= pesawat.kecepatan;
    if (tombolDitekan["ArrowRight"] && pesawat.x + pesawat.lebar < canvas.width) pesawat.x += pesawat.kecepatan;

    // Gerak Peluru
    for (let i = 0; i < peluru.length; i++) {
        peluru[i].y -= peluru[i].kecepatan;
        if (peluru[i].y < 0) {
            peluru.splice(i, 1);
            i--;
        }
    }

    // Gerak Musuh
    for (let i = 0; i < musuh.length; i++) {
        musuh[i].y += musuh[i].kecepatan;
        
        // Cek Game Over
        if (
            pesawat.x < musuh[i].x + musuh[i].lebar &&
            pesawat.x + pesawat.lebar > musuh[i].x &&
            pesawat.y < musuh[i].y + musuh[i].tinggi &&
            pesawat.y + pesawat.tinggi > musuh[i].y
        ) {
            isGameOver = true;
            // [BARU] Suara ledakan saat kalah
            mainkanSuara(sfxLedakan);
        }

        if (musuh[i].y > canvas.height) {
            musuh.splice(i, 1);
            i--; 
        }
    }

    // Tabrakan Peluru vs Musuh
    for (let i = 0; i < musuh.length; i++) {
        let m = musuh[i];
        let musuhKena = false;

        for (let j = 0; j < peluru.length; j++) {
            let p = peluru[j];
            if (p.x < m.x + m.lebar && p.x + p.lebar > m.x && p.y < m.y + m.tinggi && p.y + p.tinggi > m.y) {
                musuhKena = true;
                peluru.splice(j, 1); 
                skor += 10;
                // [BARU] Suara ledakan saat musuh hancur
                mainkanSuara(sfxLedakan);          
                break;               
            }
        }

        if (musuhKena) {
            musuh.splice(i, 1); 
            i--; 
        }
    }
}

// --- 5. GAMBAR ---
function gambar() {
    // Background
    if (imgBackground.complete) {
        ctx.drawImage(imgBackground, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#0f2027";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Pesawat
    ctx.drawImage(imgPesawat, pesawat.x, pesawat.y, pesawat.lebar, pesawat.tinggi);

    // Peluru
    ctx.shadowBlur = 10; 
    ctx.shadowColor = "#00f2ff";
    ctx.fillStyle = "#00f2ff"; 
    peluru.forEach(p => ctx.fillRect(p.x, p.y, p.lebar, p.tinggi));
    ctx.shadowBlur = 0; 

    // Musuh
    musuh.forEach(m => {
        ctx.drawImage(imgMusuh, m.x, m.y, m.lebar, m.tinggi);
    });

    // UI ATAS (Skor & Level)
    ctx.fillStyle = "white";
    ctx.font = "bold 24px 'Orbitron', sans-serif"; 
    ctx.fillText("SCORE: " + skor, 20, 40);
    
    // [BARU] Tampilkan Level
    ctx.fillStyle = "#ffff00"; // Warna kuning
    ctx.fillText("LEVEL: " + level, 20, 70);

    // Game Over Overlay
    if (isGameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ff0055"; 
        ctx.textAlign = "center";
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff0055";
        ctx.font = "bold 70px 'Orbitron', sans-serif";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = "white";
        ctx.font = "25px 'Orbitron', sans-serif";
        ctx.fillText("Skor Akhir: " + skor, canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText("Tekan ENTER untuk Restart", canvas.width / 2, canvas.height / 2 + 100);
        
        ctx.textAlign = "start";
    }
}

function gameLoop() {
    update();
    gambar();
    requestAnimationFrame(gameLoop);
}

gameLoop();