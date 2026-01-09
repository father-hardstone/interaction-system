const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const DB_DIR = path.join(__dirname, '../../databases');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

class BaseService {
    constructor(filename, headers) {
        this.filePath = path.join(DB_DIR, filename);
        this.headers = headers; // Array of strings
        this.csvWriter = createCsvWriter({
            path: this.filePath,
            header: headers.map(h => ({ id: h, title: h })),
            append: true
        });

        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, headers.join(',') + '\n');
        }
    }

    async getAll() {
        const results = [];
        return new Promise((resolve, reject) => {
            fs.createReadStream(this.filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', (err) => reject(err));
        });
    }

    async create(data) {
        const records = Array.isArray(data) ? data : [data];
        await this.csvWriter.writeRecords(records);
        return records[0];
    }

    async findOne(predicate) {
        const all = await this.getAll();
        return all.find(predicate);
    }

    async update(id, updates) {
        const all = await this.getAll();
        const index = all.findIndex(item => item.id === id);
        if (index === -1) return null;

        const updatedItem = { ...all[index], ...updates, editedAt: new Date().toISOString() };
        all[index] = updatedItem;

        const overwriteWriter = createCsvWriter({
            path: this.filePath,
            header: this.headers.map(h => ({ id: h, title: h }))
        });

        await overwriteWriter.writeRecords(all);
        return updatedItem;
    }

    async delete(id) {
        const all = await this.getAll();
        const index = all.findIndex(item => item.id === id);
        if (index === -1) return false;

        // Soft delete: set deletedAt
        // all[index].deletedAt = new Date().toISOString(); 
        // User asked for "deleted at" flag, usually implies soft delete.

        // But for "controls to delete", maybe we just soft delete.
        all[index].deletedAt = new Date().toISOString();
        all[index].active = 'false';

        const overwriteWriter = createCsvWriter({
            path: this.filePath,
            header: this.headers.map(h => ({ id: h, title: h }))
        });

        await overwriteWriter.writeRecords(all);
        return true;
    }

    async getNextSerial(prefix) {
        const all = await this.getAll();
        let max = 0;
        all.forEach(item => {
            if (item.serial && item.serial.startsWith(prefix)) {
                const numPart = parseInt(item.serial.replace(prefix, ''));
                if (!isNaN(numPart) && numPart > max) {
                    max = numPart;
                }
            }
        });
        return `${prefix}${max + 1}`;
    }
}

module.exports = BaseService;
