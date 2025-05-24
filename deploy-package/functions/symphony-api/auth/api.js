const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Session storage (in-memory for development)
const sessions = {};

router.post('/authenticate', (req, res) => {
  const { username, password } = req.body;
  
  // For development, accept any credentials with username
  if (username) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    sessions[sessionId] = {
      username,
      role: username.includes('admin') ? 'admin' : 'user',
      expiresAt
    };
    
    console.log(`[SallyPort] Authentication successful for ${username}`);
    
    return res.json({
      success: true,
      sessionId,
      expiresAt,
      user: {
        username,
        role: sessions[sessionId].role,
        name: username === 'roark' ? 'Phillip Corey Roark' : username
      }
    });
  }
  
  return res.status(401).json({
    success: false,
    message: 'Invalid credentials'
  });
});

router.post('/validate', (req, res) => {
  const { sessionId } = req.body;
  
  if (sessions[sessionId] && sessions[sessionId].expiresAt > Date.now()) {
    return res.json({
      success: true,
      user: {
        username: sessions[sessionId].username,
        role: sessions[sessionId].role
      }
    });
  }
  
  return res.status(401).json({
    success: false,
    message: 'Invalid or expired session'
  });
});

router.post('/logout', (req, res) => {
  const { sessionId } = req.body;
  
  if (sessions[sessionId]) {
    delete sessions[sessionId];
    return res.json({ success: true });
  }
  
  return res.json({ success: false, message: 'Session not found' });
});

module.exports = router;
