const AccessControlService = require('../services/AccessControlService');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';

const decryptPassword = (ciphertext) => {
    if (!ciphertext) return ciphertext;
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (!originalText || originalText.length === 0) {
            throw new Error('Password decryption failed');
        }
        if (originalText.startsWith('U2FsdGVkX1')) {
            throw new Error('Password decryption failed');
        }
        return originalText;
    } catch (e) {
        console.error('Password decryption error:', e.message);
        throw new Error('Password decryption failed');
    }
};

const signAdminToken = (admin) =>
    jwt.sign(
        {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: 'admin',
        },
        SECRET_KEY,
        { expiresIn: '1d' }
    );

exports.register = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        password = decryptPassword(password).trim();

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const admin = await AccessControlService.registerAdmin({ name, email, password });

        res.status(201).json({ message: 'Admin registered successfully', admin });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;

        password = decryptPassword(password).trim();

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing credentials' });
        }

        const admin = await AccessControlService.loginAdmin({ email, password });
        const token = signAdminToken(admin);

        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(401).json({ error: error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const admin = await AccessControlService.verifyOtp({ email, otp });
        const token = signAdminToken(admin);

        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
