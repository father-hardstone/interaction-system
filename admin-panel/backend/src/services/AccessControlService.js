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

    async registerAdmin({ name, email, password }) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await Admin.findOne({ email: normalizedEmail, deletedAt: '' });
        if (existing) {
            throw new Error('Admin with this email already exists');
        }

        const trimmedPassword = password.trim();
        const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
        const now = new Date().toISOString();
        const serial = await this.getNextSerial('A');

        const newAdmin = {
            id: uuidv4(),
            serial,
            name,
            email: normalizedEmail,
            phone: '',
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

    async loginAdmin({ email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        const admin = await Admin.findOne({ email: normalizedEmail, active: 'true', deletedAt: '' });
        if (!admin) {
            throw new Error('Invalid credentials or inactive account');
        }

        if (!admin.password || (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$') && !admin.password.startsWith('$2y$'))) {
            throw new Error('Invalid credentials - password format error');
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        return admin.toObject();
    }

    async verifyOtp({ email, otp }) {
        const normalizedEmail = email.trim().toLowerCase();
        const admin = await Admin.findOne({ email: normalizedEmail, deletedAt: '' });
        if (!admin) throw new Error('Admin not found');
        if (admin.otp !== otp) throw new Error('Invalid OTP');
        return admin.toObject();
    }
}

module.exports = new AccessControlService();
