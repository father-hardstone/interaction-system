const Admin = require('../models/Admin');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class AccessControlService {
    async getAll() {
        const admins = await Admin.find({ deletedAt: '' });
        return admins.map(a => a.toObject());
    }

    async create(data) {
        const admin = new Admin(data);
        return await admin.save();
    }

    async findOne(query) {
        // Support both function predicate (for backward compatibility) and object query
        if (typeof query === 'function') {
            const all = await this.getAll();
            return all.find(query);
        }
        return await Admin.findOne({ ...query, deletedAt: '' });
    }

    async update(id, updates) {
        updates.editedAt = new Date().toISOString();
        return await Admin.findOneAndUpdate(
            { id, deletedAt: '' },
            updates,
            { new: true }
        );
    }

    async delete(id) {
        return await Admin.findOneAndUpdate(
            { id },
            { 
                deletedAt: new Date().toISOString(),
                active: 'false'
            },
            { new: true }
        );
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

    async registerAdmin({ name, phone, password }) {
        const existing = await Admin.findOne({ phone, deletedAt: '' });
        if (existing) {
            throw new Error('Admin with this phone already exists');
        }

        // Ensure password is trimmed before hashing
        const trimmedPassword = password.trim();
        const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
        const now = new Date().toISOString();
        const serial = await this.getNextSerial('A'); // A1, A2...

        const newAdmin = {
            id: uuidv4(),
            serial,
            name,
            phone,
            password: hashedPassword,
            otp: '123456',
            active: 'true',
            createdAt: now,
            editedAt: now,
            deletedAt: ''
        };

        const admin = await this.create(newAdmin);

        const { password: _, ...result } = admin.toObject();
        return result;
    }

    async loginAdmin({ phone, password }) {
        console.log('LoginAdmin - Searching for phone:', phone);
        
        const admin = await Admin.findOne({ phone, active: 'true', deletedAt: '' });
        if (!admin) {
            console.log('LoginAdmin - Admin not found with phone:', phone);
            throw new Error('Invalid credentials or inactive account');
        }
        console.log('LoginAdmin - Admin found:', admin.serial);

        // Check if the stored password looks like a bcrypt hash
        if (!admin.password || (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$') && !admin.password.startsWith('$2y$'))) {
            console.error('Stored password does not appear to be a bcrypt hash. It may be encrypted or corrupted.');
            console.error('Stored password format:', admin.password ? admin.password.substring(0, 20) + '...' : 'null');
            throw new Error('Invalid credentials - password format error');
        }

        console.log('Comparing password - Input length:', password.length, 'Stored hash starts with:', admin.password.substring(0, 10));
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log('Password comparison result:', isMatch);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        return admin.toObject();
    }

    async verifyOtp({ phone, otp }) {
        const admin = await Admin.findOne({ phone, deletedAt: '' });
        if (!admin) throw new Error('Admin not found');
        if (admin.otp !== otp) throw new Error('Invalid OTP');
        return admin.toObject();
    }
}

module.exports = new AccessControlService();
