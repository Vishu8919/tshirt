// Global variables for the T-shirt mesh and material
let tshirtMesh, tshirtMaterial;

// Set up the Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
renderer.setSize(window.innerWidth / 2, window.innerHeight);

// Add OrbitControls for 360-degree rotation
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth rotation
controls.dampingFactor = 0.05;

// Add a basic light to the scene for visibility
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 1).normalize();
scene.add(light);

// Add ambient light to reduce harsh shadows
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

// Load the T-shirt model
const loader = new THREE.OBJLoader();
loader.load(
    'models/tshirt.obj', // Path to the T-shirt model
    function (object) {
        // Center and scale the model
        const box = new THREE.BoxHelper(object, 0xffff00);
        box.update();
        const center = new THREE.Vector3();
        object.traverse(function (child) {
            if (child.isMesh && child.geometry) {
                child.geometry.computeBoundingBox();
                child.geometry.boundingBox.getCenter(center);
            }
        });
        object.position.sub(center); // Center the model at origin

        const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scaleFactor = 5 / maxDimension; // Scale to make largest dimension 5 units
        object.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Adjust camera position based on model size
        camera.position.z = maxDimension * scaleFactor * 2;

        // Assign a default material if none exists
        tshirtMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Default color: red
        object.traverse(function (child) {
            if (child.isMesh) {
                if (!child.material) {
                    child.material = tshirtMaterial;
                } else {
                    child.material = tshirtMaterial; // Override with our material for consistency
                }
            }
        });

        tshirtMesh = object; // Store for later customization
        scene.add(object);
        console.log('T-shirt model loaded successfully');
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded'); // Progress
    },
    function (error) {
        console.error('An error occurred while loading the model:', error); // Error handling
    }
);

// Animation loop for rendering
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Initialize the Spectrum color picker
$(document).ready(function() {
    $('#colorPicker').spectrum({
        color: '#ff0000', // Default color: red
        showInput: true,
        showAlpha: true,
        showPalette: true,
        palette: [
            ['#ff0000', '#00ff00', '#0000ff'],
            ['#ffff00', '#ff00ff', '#00ffff']
        ],
        chooseText: 'Select',
        cancelText: 'Cancel',
        change: function(color) {
            if (tshirtMaterial) {
                tshirtMaterial.color.set(color.toHexString()); // Update the T-shirt color
                tshirtMaterial.map = null; // Remove any texture to show the color
                tshirtMaterial.needsUpdate = true;
            }
        }
    });
});

// Text input functionality
const textInput = document.getElementById('textInput');
textInput.addEventListener('input', function() {
    const text = textInput.value;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    if (tshirtMaterial) {
        tshirtMaterial.map = texture;
        tshirtMaterial.needsUpdate = true;
    }
});

// Image upload functionality
const imageUpload = document.getElementById('imageUpload');
imageUpload.addEventListener('change', function() {
    const file = imageUpload.files[0];
    if (!file) return; // Exit if no file is selected
    const data = new FormData();
    data.append('image', file);
    fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(data => {
        const imageUrl = data.url;
        const loader = new THREE.TextureLoader();
        loader.load(imageUrl, function(texture) {
            if (tshirtMaterial) {
                tshirtMaterial.map = texture;
                tshirtMaterial.needsUpdate = true;
            }
        }, undefined, function(error) {
            console.error('An error occurred while loading the texture:', error);
        });
    })
    .catch(error => {
        console.error('An error occurred while uploading the image:', error);
    });
});

// Add-ons functionality
const addonsSelect = document.getElementById('addons');
let currentAddon = null; // Track the current add-on to remove it if a new one is selected
addonsSelect.addEventListener('change', function() {
    // Remove the previous add-on if it exists
    if (currentAddon) {
        scene.remove(currentAddon);
        currentAddon = null;
    }

    const selected = addonsSelect.value;
    if (selected === 'pocket') {
        const loader = new THREE.OBJLoader();
        loader.load('models/pocket.obj', function(object) {
            // Scale and position the pocket (adjust as needed)
            const box = new THREE.BoxHelper(object, 0xffff00);
            box.update();
            const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
            const maxDimension = Math.max(size.x, size.y, size.z);
            const scaleFactor = 5 / maxDimension;
            object.scale.set(scaleFactor, scaleFactor, scaleFactor);
            object.position.set(0, 0, 0.1); // Adjust position to place on T-shirt
            object.traverse(function(child) {
                if (child.isMesh) {
                    child.material = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black pocket
                }
            });
            scene.add(object);
            currentAddon = object;
        }, undefined, function(error) {
            console.error('An error occurred while loading the pocket:', error);
        });
    } else if (selected === 'buttons') {
        const loader = new THREE.OBJLoader();
        loader.load('models/buttons.obj', function(object) {
            // Scale and position the buttons (adjust as needed)
            const box = new THREE.BoxHelper(object, 0xffff00);
            box.update();
            const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
            const maxDimension = Math.max(size.x, size.y, size.z);
            const scaleFactor = 5 / maxDimension;
            object.scale.set(scaleFactor, scaleFactor, scaleFactor);
            object.position.set(0, 0, 0.1); // Adjust position to place on T-shirt
            object.traverse(function(child) {
                if (child.isMesh) {
                    child.material = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black buttons
                }
            });
            scene.add(object);
            currentAddon = object;
        }, undefined, function(error) {
            console.error('An error occurred while loading the buttons:', error);
        });
    }
});

// Reset to default functionality
const resetBtn = document.querySelector('.reset-btn');
resetBtn.addEventListener('click', function(event) {
    event.preventDefault();
    if (tshirtMaterial) {
        tshirtMaterial.color.set(0xff0000); // Reset to red
        tshirtMaterial.map = null; // Remove any texture
        tshirtMaterial.needsUpdate = true;
    }
    textInput.value = ''; // Clear text input
    imageUpload.value = ''; // Clear image upload
    addonsSelect.value = ''; // Clear add-ons
    if (currentAddon) {
        scene.remove(currentAddon);
        currentAddon = null;
    }
});

// Tab switching functionality
const tabs = document.querySelectorAll('.customization-tabs .tab');
const sections = document.querySelectorAll('.customization-content > div');

tabs.forEach(tab => {
    tab.addEventListener('click', function() {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        this.classList.add('active');

        // Hide all sections
        sections.forEach(section => section.style.display = 'none');
        // Show the corresponding section
        if (this.textContent === 'Choose Color') {
            document.querySelector('.color-section').style.display = 'block';
        } else if (this.textContent === 'Addons') {
            document.querySelector('.addons-section').style.display = 'block';
        } else if (this.textContent === 'Image or Logo') {
            document.querySelector('.image-section').style.display = 'block';
        } else if (this.textContent === 'Add Text') {
            document.querySelector('.text-section').style.display = 'block';
        }
    });
});