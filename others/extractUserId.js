const jwt = require('jsonwebtoken');
require('dotenv').config();

function extractUserId(req, res, next) {
  // Get the token from the request headers
  const token = req.headers.authorization;


  // Check if token is present
  if (!token) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  try {
    // Verify the token using the JWT secret from environment variables
    req.userId = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET).userId;


    // Call the next middleware
    next();
  } catch (error) {
    console.error('Error verifying token:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = extractUserId;
