const express = require('express');
const path = require('path');
const User = require('./models/User');
const app = express();

const PUBLIC_DIR = path.join(__dirname, 'public');

// Serve static files from public directory
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const isValid = await user.verifyPassword(password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        await user.updateLastLogin();
        res.json({ message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (await User.findByEmail(email)) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        await User.create({ name, email, password });
        res.json({ message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

const PORT = process.env.PORT || 3234;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
});
