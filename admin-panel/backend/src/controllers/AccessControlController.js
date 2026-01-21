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
        // If decryption failed, originalText will be empty or the result will still look encrypted
        // Check if we got a valid decrypted string (not empty and doesn't look like base64)
        if (!originalText || originalText.length === 0) {
            console.error('Password decryption failed: empty result');
            throw new Error('Password decryption failed');
        }
        // Basic check: if it still looks like an encrypted string (starts with U2FsdGVkX1), decryption likely failed
        if (originalText.startsWith('U2FsdGVkX1')) {
            console.error('Password decryption failed: result still appears encrypted');
            throw new Error('Password decryption failed');
        }
        return originalText;
    } catch (e) {
        console.error('Password decryption error:', e.message);
        throw new Error('Password decryption failed');
    }
};

exports.register = async (req, res) => {
    try {
        let { name, phone, password } = req.body;

        // Decrypt password if it was sent encrypted
        const originalPassword = password;
        password = decryptPassword(password);
        // Trim whitespace that might cause issues
        password = password.trim();
        console.log('Registration - Password decrypted successfully, length:', password.length);

        if (!name || !phone || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const admin = await AccessControlService.registerAdmin({ name, phone, password });

        // Generate token immediately or require OTP first? 
        // "sign up and login flow... as sign up completes... otp 123456"
        // Usually means verify OTP next. But let's send back the user data to proceed.

        res.status(201).json({ message: 'Admin registered successfully', admin });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        let { phone, password } = req.body;

        // Decrypt password if it was sent encrypted
        const originalPassword = password;
        password = decryptPassword(password);
        // Trim whitespace that might cause issues
        password = password.trim();
        console.log('Login - Password decrypted successfully, length:', password.length);

        if (!phone || !password) {
            return res.status(400).json({ error: 'Missing credentials' });
        }

        const admin = await AccessControlService.loginAdmin({ phone, password });

        /* 
          We successfully matched password. 
          Now checking OTP? The prompt says "otp (it would be 123456)".
          Let's assume the flow is: 
          1. Login (User/Pass) -> Returns "OK, waiting for OTP" 
          2. Verify OTP -> Returns Token
          OR 
          Just return token if we treating '123456' as a static thing for now.
          
          "create a admin login and register flow... and an otp"
          Let's make a proper 2-step or simulate it. 
          I will generate a temporary token for the OTP step or just client side handling for this stage-0.
          
          Actually, let's just return a JWT here for simplicity as "Stage-0 Barebones", 
          but includes the OTP in the response for 'dev' purposes or say "OTP sent".
        */

        res.json({ message: 'Credentials valid. Please verify OTP.', phone: admin.phone });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(401).json({ error: error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        await AccessControlService.verifyOtp({ phone, otp });

        // Generate real JWT with role
        const token = jwt.sign({
            phone,
            role: 'admin'
        }, SECRET_KEY, { expiresIn: '1d' });

        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
