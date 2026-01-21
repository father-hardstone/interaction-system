import CryptoJS from 'crypto-js';

export const hashPassword = (password) => {
    return CryptoJS.SHA256(password).toString();
};

// Strong email validation
export const validateEmail = (email) => {
    if (!email || email.trim().length === 0) {
        return { valid: false, error: 'Email is required' };
    }
    
    const trimmedEmail = email.trim();
    
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
        return { valid: false, error: 'Please enter a valid email address' };
    }
    
    // Check for common invalid patterns
    if (trimmedEmail.startsWith('.') || trimmedEmail.startsWith('@') || 
        trimmedEmail.endsWith('.') || trimmedEmail.endsWith('@')) {
        return { valid: false, error: 'Please enter a valid email address' };
    }
    
    // Check for consecutive dots
    if (trimmedEmail.includes('..')) {
        return { valid: false, error: 'Please enter a valid email address' };
    }
    
    // Check length (reasonable limits)
    if (trimmedEmail.length > 254) {
        return { valid: false, error: 'Email address is too long' };
    }
    
    // Check domain has at least one dot
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2 || !parts[1].includes('.')) {
        return { valid: false, error: 'Please enter a valid email address' };
    }
    
    return { valid: true, error: null };
};