import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import bcrypt from 'bcryptjs';

async function main() {
  await mongoose.connect(process.env.DATABASE_URL);

  const users = await User.find({}, { email: 1, name: 1, password: 1 });
  console.log('=== USER PASSWORDS ===');
  for (const u of users) {
    console.log('\nEmail:', u.email);
    console.log('Name:', u.name);
    console.log('Password hash:', u.password?.slice(0, 30) + '...');
    
    // Check if it's a bcrypt hash (starts with $2a$, $2b$, etc.)
    if (u.password?.startsWith('$2')) {
      console.log('Type: bcrypt hash ✓');
    } else {
      console.log('Type: PLAIN TEXT or unknown ⚠️');
    }
    
    // Try to login with common passwords
    const testPasswords = ['Admin123!', 'Student123!', 'password', 'Password123!', u.email?.split('@')[0] + '123'];
    for (const pw of testPasswords) {
      try {
        // Try bcrypt compare
        const valid = await bcrypt.compare(pw, u.password);
        if (valid) console.log(`  ✅ Login with "${pw}" works!`);
      } catch {
        // Not bcrypt, try plain text
        if (u.password === pw) console.log(`  ✅ Login with "${pw}" works (plain text)!`);
      }
    }
  }

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });