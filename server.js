const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
let User;
try {
    User = require('./models/User');
} catch (error) {
    console.error('Error loading User model:', error);
}
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days
const MESSAGE_HISTORY_SIZE = 20;
const channelMessages = {
    General: [],
    "The Inn": [],
    "The Park": [],
    "The Groomers": [],
    "Pet Center": [],
    "Vet": [],
    "Mall": [],
    Auction: [],
    Pets: [],
    Quests: []
};

// Add this function right after channelMessages declaration
function ensureChannelExists(channel) {
    if (!channelMessages[channel]) {
        channelMessages[channel] = [];
    }
}

// Serve static files from public directory
app.use(express.json());
app.use(express.static(PUBLIC_DIR));
app.use(cookieParser());

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    if (!User) {
        return res.status(500).json({ message: 'User model not found' });
    }
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
        
        const sessionKey = crypto.randomBytes(64).toString('hex');
        const hashedSessionKey = await bcrypt.hash(sessionKey, 10);
        await user.storeSessionKey(hashedSessionKey);
        res.cookie('sessionKey', hashedSessionKey, { maxAge: SESSION_TIMEOUT, httpOnly: true });
        res.json({ 
            message: 'Login successful', 
            sessionKey,
            username: user.username // Include username in response
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/verify', async (req, res) => {
    const { sessionKey } = req.body;
    const validUser = await User.findBySessionKey(sessionKey);
    if (!validUser) return res.status(401).json({ valid: false });
    res.json({ valid: true, user: validUser.username });
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    if (!User) {
        return res.status(500).json({ message: 'User model not found' });
    }
    try {
        const { username, name, email, password } = req.body;
        
        if (await User.findByEmail(email)) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        await User.create({ username, name, email, password });
        res.json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { sessionKey, message, channel } = req.body;
        ensureChannelExists(channel);
        await User.sendChannelMessage(sessionKey, message, channel, io, channelMessages);
        res.json({ success: true });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ message: 'Chat error' });
    }
});

// Add socket authentication middleware
io.use(async (socket, next) => {
    const sessionKey = socket.handshake.query.sessionKey;
    if (!sessionKey) {
        return next(new Error('Authentication error'));
    }
    const user = await User.findBySessionKey(sessionKey);
    if (!user) {
        return next(new Error('Authentication error'));
    }
    socket.user = user;
    next();
});

io.on('connection', async (socket) => {
    console.log(`${socket.user.username} has connected to chat`);
    
    // Send initial message history
    socket.emit('messageHistory', channelMessages);
    
    // Handle channel change requests
    socket.on('requestChannel', (channel) => {
        if (channelMessages[channel]) {
            socket.emit('messageHistory', { [channel]: channelMessages[channel] });
        }
    });
    
    socket.on('disconnect', () => {
        console.log(`${socket.user.username} has disconnected from chat`);
    });
});

const PORT = process.env.PORT || 3234;
server.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
});
