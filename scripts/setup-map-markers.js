import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Marker files to download
const markerFiles = [
  {
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x.png',
    filename: 'marker-icon-2x.png'
  },
  {
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon.png',
    filename: 'marker-icon.png'
  },
  {
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
    filename: 'marker-shadow.png'
  }
];

// Download function
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file if there's an error
      reject(err);
    });
  });
}

// Download all marker files
async function setupMarkers() {
  console.log('Setting up map marker files...');
  
  for (const file of markerFiles) {
    const filePath = path.join(publicDir, file.filename);
    console.log(`Downloading ${file.filename}...`);
    
    try {
      await downloadFile(file.url, filePath);
      console.log(`✓ ${file.filename} downloaded successfully`);
    } catch (error) {
      console.error(`Error downloading ${file.filename}:`, error.message);
    }
  }
  
  console.log('Marker setup complete!');
}

// Run the setup
setupMarkers().catch(console.error);
