const BaseService = require('./BaseService');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Added 'serial' to headers
const ADMIN_HEADERS = [
    'id', 'serial', 'name', 'phone', 'password', 'otp',
    'active', 'createdAt', 'editedAt', 'deletedAt'
];

class AccessControlService extends BaseService {
    constructor() {
        super('admins.csv', ADMIN_HEADERS);
    }

    async registerAdmin({ name, phone, password }) {
        const existing = await this.findOne(admin => admin.phone === phone);
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

        await this.create(newAdmin);

        const { password: _, ...result } = newAdmin;
        return result;
    }

    async loginAdmin({ phone, password }) {
        console.log('LoginAdmin - Searching for phone:', phone);
        const allAdmins = await this.getAll();
        console.log('LoginAdmin - Total admins found:', allAdmins.length);
        allAdmins.forEach(a => {
            console.log(`LoginAdmin - Admin phone: "${a.phone}", active: "${a.active}", match: ${a.phone === phone}`);
        });
        
        const admin = await this.findOne(a => a.phone === phone && a.active === 'true');
        if (!admin) {
            console.log('LoginAdmin - Admin not found with phone:', phone);
            throw new Error('Invalid credentials or inactive account');
        }
        console.log('LoginAdmin - Admin found:', admin.serial);

        // Check if the stored password looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
        // If it doesn't, it might be an encrypted string that wasn't properly hashed during registration
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
        return admin;
    }

    async verifyOtp({ phone, otp }) {
        const admin = await this.findOne(a => a.phone === phone);
        if (!admin) throw new Error('Admin not found');
        if (admin.otp !== otp) throw new Error('Invalid OTP');
        return admin;
    }
}

module.exports = new AccessControlService();
