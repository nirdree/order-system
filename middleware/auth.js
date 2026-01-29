import jwt from 'jsonwebtoken';
import User from '../models/User';

export const authenticate = async (req) => {
  try {
    // Try to get token from Authorization header first, then from cookies
    let token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // Get from cookies
      const cookieHeader = req.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = decodeURIComponent(value);
          return acc;
        }, {});
        token = cookies.authToken;
      }
    }
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };
  } catch (error) {
    console.log(error)
    throw new Error('Authentication failed');
  }
};

export const authorize = (...allowedRoles) => {
  return (user) => {
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!allowedRoles.includes(user.role)) {
      throw new Error('Forbidden: Insufficient permissions');
    }

    return true;
  };
};

export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

export async function verifyToken(token) {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };
  } catch (error) {
    console.log(error)
    throw new Error('Authentication failed');
  }
}
  
