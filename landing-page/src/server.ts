import express from 'express';
import path from 'path';
import mime from 'mime-types';

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Handle downloads
app.get('/downloads/:platform', (req, res) => {
    const { platform } = req.params;
    const downloads = {
        mac: 'ChatApp.dmg',
        windows: 'ChatApp.exe',
        linux: 'ChatApp.AppImage'
    };
    
    const filename = downloads[platform as keyof typeof downloads];
    if (!filename) {
        return res.status(404).send('Platform not found');
    }
    
    const filePath = path.join(__dirname, '../public/downloads', filename);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    
    res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Security-Policy': "default-src 'self'",
        'X-Content-Type-Options': 'nosniff'
    });
    
    res.sendFile(filePath);
});

app.listen(port, () => {
    console.log(`Landing page server running at http://localhost:${port}`);
}); 