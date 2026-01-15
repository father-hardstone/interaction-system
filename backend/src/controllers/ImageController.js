const fs = require('fs').promises;
const path = require('path');

class ImageController {
    // Save interaction image
    async saveInteractionImage(req, res) {
        try {
            const { entitySerial, visitorSerial, interactionSerial, fieldName, imageData } = req.body;

            if (!entitySerial || !visitorSerial || !interactionSerial || !fieldName || !imageData) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Clean serials: remove prefix letters and convert to lowercase
            // e.g., "E2" -> "2", "E1-V3" -> "3" (take last part after dash), "E1-V1-I2" -> "2"
            const cleanEntitySerial = entitySerial.split('-')[0].replace(/^[A-Za-z]+/i, '').toLowerCase();
            const cleanVisitorSerial = visitorSerial.includes('-') 
                ? visitorSerial.split('-').pop().replace(/^[A-Za-z]+/i, '').toLowerCase()
                : visitorSerial.replace(/^[A-Za-z]+/i, '').toLowerCase();
            const cleanInteractionSerial = interactionSerial.includes('-')
                ? interactionSerial.split('-').pop().replace(/^[A-Za-z]+/i, '').toLowerCase()
                : interactionSerial.replace(/^[A-Za-z]+/i, '').toLowerCase();

            // Create filename: e2-v3-i2-CC.png
            const filename = `${cleanEntitySerial}-${cleanVisitorSerial}-${cleanInteractionSerial}-${fieldName}.png`;
            
            // Create images directory if it doesn't exist
            const imagesDir = path.join(__dirname, '../../uploads/interactions');
            await fs.mkdir(imagesDir, { recursive: true });

            // Convert base64 to buffer
            const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            // Save file
            const filePath = path.join(imagesDir, filename);
            await fs.writeFile(filePath, buffer);

            // Return the filename (relative path)
            const relativePath = `uploads/interactions/${filename}`;

            console.log('Image saved:', relativePath);
            res.json({ filename: relativePath, path: relativePath });
        } catch (e) {
            console.error('saveInteractionImage error:', e);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new ImageController();
