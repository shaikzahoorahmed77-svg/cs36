import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { env } from '../config.js';

const router = Router();

const paramsId = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hash });

    const token = jwt.sign({ userId: user._id.toString(), role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id.toString(), role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;