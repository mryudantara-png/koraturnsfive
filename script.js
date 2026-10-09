const videoElement = document.getElementById('videoFeed');
const cameraSelect = document.getElementById('cameraSelect');
const captureBtn = document.getElementById('captureBtn');
const countdownEl = document.getElementById('countdown');
const cameraSection = document.getElementById('camera-section');
const previewSection = document.getElementById('preview-section');
const photoCanvas = document.getElementById('photoCanvas');
const ctx = photoCanvas.getContext('2d');
const retakeBtn = document.getElementById('retakeBtn');

let currentStream = null;

// --- KONFIGURASI KANVAS (POLAROID 4R) ---
// Set resolusi internal canvas ke 4R Portrait
photoCanvas.width = 1200;
photoCanvas.height = 1800;

// Logika Kamera (Sama seperti sebelumnya)
async function getCameras() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        cameraSelect.innerHTML = '';
        
        if (videoDevices.length === 0) {
            cameraSelect.innerHTML = '<option value="">Tidak ada kamera terdeteksi</option>';
            return;
        }

        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Kamera ${index + 1}`;
            cameraSelect.appendChild(option);
        });

        if (videoDevices.length > 0) startStream(videoDevices[0].deviceId);
    } catch (error) {
        console.error('Gagal mendeteksi kamera:', error);
        cameraSelect.innerHTML = '<option value="">Izin kamera ditolak</option>';
    }
}

async function startStream(deviceId) {
    if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    const constraints = {
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
    };
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;
        videoElement.srcObject = stream;
    } catch (error) {
        console.error('Error stream:', error);
    }
}

cameraSelect.addEventListener('change', (e) => {
    startStream(e.target.value);
    const label = e.target.options[e.target.selectedIndex].text.toLowerCase();
    if (label.includes('back') || label.includes('belakang')) {
        videoElement.classList.remove('scale-x-[-1]');
    } else {
        videoElement.classList.add('scale-x-[-1]');
    }
});

window.addEventListener('DOMContentLoaded', getCameras);

// --- LOGIKA CAPTURE & COUNTDOWN ---

captureBtn.addEventListener('click', () => {
    // Kunci tombol agar tidak ditekan berkali-kali
    captureBtn.disabled = true;
    countdownEl.classList.remove('hidden');
    
    let count = 3;
    countdownEl.innerText = count;

    // Timer hitung mundur
    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.innerText = count;
        } else {
            clearInterval(timer);
            countdownEl.classList.add('hidden');
            captureBtn.disabled = false;
            takePhoto();
        }
    }, 1000);
});

function takePhoto() {
    // 1. Warnai seluruh background canvas dengan warna putih
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);

    // 2. Dapatkan ukuran asli dari video yang sedang berjalan
    const videoW = videoElement.videoWidth;
    const videoH = videoElement.videoHeight;
    
    // 3. Hitung area tengah untuk Crop 1:1 (Persegi)
    const cropSize = Math.min(videoW, videoH);
    const startX = (videoW - cropSize) / 2;
    const startY = (videoH - cropSize) / 2;

    // 4. Konfigurasi peletakan foto di Canvas (Polaroid Style)
    const margin = 80; // Margin putih untuk sisi kiri, atas, dan kanan
    const drawSize = photoCanvas.width - (margin * 2); // Lebar/Tinggi foto di kanvas (1200 - 160 = 1040)
    
    // 5. Cek apakah video sedang dimirror (kamera depan)
    const isMirrored = videoElement.classList.contains('scale-x-[-1]');
    
    ctx.save(); // Simpan state canvas sebelum modifikasi

    if (isMirrored) {
        // Balikkan koordinat kanvas secara horizontal agar foto tidak terbalik
        ctx.translate(photoCanvas.width, 0);
        ctx.scale(-1, 1);
    }

    // 6. Gambar frame video ke dalam Canvas
    ctx.drawImage(
        videoElement, 
        startX, startY, cropSize, cropSize, // Source (Area yang di-crop dari video)
        margin, margin, drawSize, drawSize  // Destination (Posisi di Canvas)
    );
    
    ctx.restore(); // Kembalikan state canvas ke normal

    // 7. Ubah Tampilan UI
    cameraSection.classList.add('hidden');
    previewSection.classList.remove('hidden');
}

// Logika tombol ulangi foto
retakeBtn.addEventListener('click', () => {
    previewSection.classList.add('hidden');
    cameraSection.classList.remove('hidden');
});