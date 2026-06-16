const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  company: user.company,
});

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, company } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const user = await User.create({ name, email, password, role, company });
    const token = signToken(user._id);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      // Same message for both cases to prevent user enumeration
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
};

const getMe = (req, res) => {
  res.json({ user: safeUser(req.user) });
};

module.exports = { register, login, getMe };
