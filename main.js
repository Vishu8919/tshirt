// Global variables
let tshirtMesh, tshirtMaterial, currentAddon, currentTextMesh;
let originalColor = 0xffffff;  // White background

// Set up Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(originalColor);

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);

renderer.setSize(canvas.clientWidth, canvas.clientHeight);
camera.position.set(0, 2, 5);

const light = new THREE.AmbientLight(0x404040, 2);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 5, 5);
scene.add(directionalLight);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Load T-shirt model
const loader = new THREE.OBJLoader();
loader.load(
    'models/tshirt.obj',
    (object) => {
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        object.scale.setScalar(3 / maxDimension);

        // Material with white base color
        tshirtMaterial = new THREE.MeshStandardMaterial({ color: originalColor });
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = tshirtMaterial;
            }
        });

        tshirtMesh = object;
        scene.add(tshirtMesh);
    },
    undefined,
    (error) => console.error('Error loading model:', error)
);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// --- COLOR PICKER FUNCTIONALITY ---
$(document).ready(() => {
    // Spectrum color picker
    $('#colorPicker').spectrum({
        color: '#ffffff',
        showInput: true,
        showAlpha: false,
        showPalette: true,
        palette: [
            ['#ff0000', '#00ff00', '#0000ff'], 
            ['#ffff00', '#ff00ff', '#00ffff']
        ],
        change: (color) => {
            if (tshirtMaterial) {
                tshirtMaterial.color.set(color.toHexString());
                tshirtMaterial.needsUpdate = true;
            }
        }
    });

    // Ensure color swatches update T-shirt color properly
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            const color = swatch.dataset.color;
            if (tshirtMaterial) {
                tshirtMaterial.color.set(color);  // Apply color on T-shirt
                tshirtMaterial.needsUpdate = true;
            }
            $('#colorPicker').spectrum('set', color);  // Sync picker with swatch
        });
    });
});

// --- NEW FUNCTIONALITY: COLOR BOX INTERACTION ---
document.querySelectorAll('.color-box').forEach(box => {
    box.addEventListener('click', () => {
        const color = box.style.backgroundColor;

        if (tshirtMaterial) {
            tshirtMaterial.color.set(new THREE.Color(color));
            tshirtMaterial.needsUpdate = true;
        }

        // Highlight selected color box
        document.querySelectorAll('.color-box').forEach(b => b.classList.remove('selected'));
        box.classList.add('selected');
    });
});

// --- RESET FUNCTIONALITY ---
function resetDesign() {
    // Reset color
    if (tshirtMaterial) {
        tshirtMaterial.color.set(originalColor);
        tshirtMaterial.map = null;
        tshirtMaterial.needsUpdate = true;
    }

    // Reset image upload
    document.getElementById('imageUpload').value = '';
    
    // Reset text
    if (currentTextMesh) {
        scene.remove(currentTextMesh);
        currentTextMesh = null;
    }
    
    // Reset addons
    if (currentAddon) {
        scene.remove(currentAddon);
        currentAddon = null;
    }
    
    // Reset UI elements
    $('#colorPicker').spectrum('set', '#ffffff');
    document.getElementById('textInput').value = '';
}

// Add reset event listener
document.querySelector('.reset-btn').addEventListener('click', resetDesign);

// --- SAVE DESIGN FUNCTIONALITY ---
document.querySelector('.save-btn').addEventListener('click', () => {
    renderer.render(scene, camera);
    const dataURL = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = 'tshirt-design.png';
    link.href = dataURL;
    link.click();
});

// --- SHARE DESIGN FUNCTIONALITY ---
document.querySelector('.share-btn').addEventListener('click', () => {
    renderer.render(scene, camera);
    const dataURL = canvas.toDataURL('image/png');

    // Simulate sharing link
    const shareLink = `https://mytshirtshare.com/design?img=${encodeURIComponent(dataURL)}`;
    alert(`Share your design: ${shareLink}`);
});

// --- IMAGE UPLOAD FUNCTIONALITY ---
const imageUpload = document.getElementById('imageUpload');
imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const texture = new THREE.TextureLoader().load(e.target.result);
        texture.colorSpace = THREE.SRGBColorSpace;
        tshirtMaterial.map = texture;
        tshirtMaterial.needsUpdate = true;
    };
    reader.readAsDataURL(file);
});

// --- ADDONS FUNCTIONALITY ---
const addonsSelect = document.getElementById('addons');
addonsSelect.addEventListener('change', () => {
    if (currentAddon) {
        scene.remove(currentAddon);
        currentAddon = null;
    }

    const selected = addonsSelect.value;
    if (!selected) return;

    const addonLoader = new THREE.OBJLoader();
    addonLoader.load(
        `models/${selected}.obj`,
        (object) => {
            object.scale.set(0.5, 0.5, 0.5);
            object.position.set(0, 0, 0.1);

            object.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({ color: 0x000000 });
                }
            });

            currentAddon = object;
            scene.add(currentAddon);
        },
        undefined,
        (error) => console.error(`Error loading addon (${selected}):`, error)
    );
});

// --- ADD TEXT FUNCTIONALITY ---
document.getElementById('addTextBtn').addEventListener('click', () => {
    const text = document.getElementById('textInput').value;

    if (currentTextMesh) {
        scene.remove(currentTextMesh);
        currentTextMesh = null;
    }

    if (text) {
        const loader = new THREE.FontLoader();
        loader.load('fonts/helvetiker_regular.typeface.json', (font) => {
            const geometry = new THREE.TextGeometry(text, {
                font: font,
                size: 0.4,
                height: 0.1
            });

            const textMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            currentTextMesh = new THREE.Mesh(geometry, textMaterial);

            currentTextMesh.position.set(-1, 1, 0.6);
            scene.add(currentTextMesh);
        });
    }
});

// --- TAB SWITCHING FUNCTIONALITY ---
const tabs = document.querySelectorAll('.customization-tabs .tab');
const sections = document.querySelectorAll('.customization-content > div');

tabs.forEach(tab => {
    tab.addEventListener('click', function () {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        sections.forEach(section => section.style.display = 'none');

        const tabName = this.textContent.toLowerCase().replace(' ', '-');
        document.querySelector(`.${tabName}-section`).style.display = 'block';

        // Refresh scene to ensure it updates properly
        renderer.render(scene, camera);
    });
});
