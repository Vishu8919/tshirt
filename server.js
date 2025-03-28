const express = require('express');
const multer = require('multer');
const app = express();

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('image'), function(req, res) {
    const url = `http://localhost:3000/uploads/${req.file.filename}`;
    res.json({ url: url });
});

app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname)); // Serve static files (index.html, styles.css, main.js)

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.listen(3000, function() {
    console.log('Server started on port 3000');
});