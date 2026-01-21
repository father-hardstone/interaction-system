const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        return next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

function requireRoles(roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Unauthenticated' });
        }
        if (!allowed.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        return next();
    };
}

module.exports = {
    authenticateToken,
    requireRoles
};

