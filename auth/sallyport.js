const jwt = require('jsonwebtoken');

// Verify token
async function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET || 'development-secret-key';
    const decoded = jwt.verify(token, secret);
    return {
      valid: true,
      userId: decoded.sub,
      roles: decoded.roles || []
    };
  } catch (error) {
    console.error(`Token verification failed: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

// Generate test token
function generateToken() {
  const secret = process.env.JWT_SECRET || 'development-secret-key';
  return jwt.sign({
    sub: 'test-user-123',
    roles: ['user', 'admin']
  }, secret, { expiresIn: '1h' });
}

module.exports = {
  verifyToken,
  generateToken
};
