const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

// Add constant for message history size
const MESSAGE_HISTORY_SIZE = 20;

class User {
    constructor(data) {
        this.username = data.username; // add username
        this.name = data.name;
        this.email = data.email;
        this.password = data.password;
        this.createdAt = data.createdAt || Date.now();
        this.lastLogin = data.lastLogin || null;
    }

    static async findByEmail(email) {
        try {
            const files = await fs.readdir(User.usersDir);
            for (const file of files) {
                const userData = JSON.parse(
                    await fs.readFile(path.join(User.usersDir, file), 'utf8')
                );
                if (userData.email === email) {
                    return new User(userData);
                }
            }
        } catch (error) {
            console.error('Error finding user:', error);
        }
        return null;
    }

    static async create(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = new User({
                ...userData,
                password: hashedPassword
            });

            const fileName = `${Date.now()}_${userData.email.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            await fs.writeFile(
                path.join(User.usersDir, fileName),
                JSON.stringify(user, null, 2)
            );
            return user;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async verifyPassword(password) {
        return bcrypt.compare(password, this.password);
    }

    async updateLastLogin() {
        this.lastLogin = Date.now();
        // Update user file
        try {
            const files = await fs.readdir(User.usersDir);
            for (const file of files) {
                const userData = JSON.parse(
                    await fs.readFile(path.join(User.usersDir, file), 'utf8')
                );
                if (userData.email === this.email) {
                    await fs.writeFile(
                        path.join(User.usersDir, file),
                        JSON.stringify(this, null, 2)
                    );
                    break;
                }
            }
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }

    async storeSessionKey(hashedSessionKey) {
        this.hashedSessionKey = hashedSessionKey;
        try {
            const files = await fs.readdir(User.usersDir);
            for (const file of files) {
                const userData = JSON.parse(
                    await fs.readFile(path.join(User.usersDir, file), 'utf8')
                );
                if (userData.email === this.email) {
                    await fs.writeFile(
                        path.join(User.usersDir, file),
                        JSON.stringify(this, null, 2)
                    );
                    break;
                }
            }
        } catch (error) {
            console.error('Error storing session key:', error);
        }
    }

    static async findBySessionKey(rawSessionKey) {
        try {
            const files = await fs.readdir(User.usersDir);
            for (const file of files) {
                const userData = JSON.parse(
                    await fs.readFile(path.join(User.usersDir, file), 'utf8')
                );
                if (!userData.hashedSessionKey) continue;
                const match = await bcrypt.compare(rawSessionKey, userData.hashedSessionKey);
                if (match) {
                    return new User(userData);
                }
            }
        } catch (error) {
            console.error('Error finding user by session key:', error);
        }
        return null;
    }

    static async sendGlobalChatMessage(token, message, io) {
        const user = await User.findBySessionKey(token);
        if (!user) return;
        io.emit('globalChatMessage', {
            user: user.username || user.name || 'UnknownUser',
            message
        });
    }

    static async sendChannelMessage(token, message, channel, io, channelMessages) {
        const user = await User.findBySessionKey(token);
        if (!user) return;
        
        const messageData = {
            user: user.username || user.name || 'UnknownUser',
            message,
            channel,
            timestamp: Date.now()
        };

        // Ensure channel exists and is an array
        if (!Array.isArray(channelMessages[channel])) {
            channelMessages[channel] = [];
        }

        // Store message in history
        channelMessages[channel] = [
            ...(channelMessages[channel].slice(-(MESSAGE_HISTORY_SIZE - 1)) || []),
            messageData
        ];

        io.emit('channelMessage', messageData);
    }

    toJSON() {
        return {
            username: this.username, // include username
            name: this.name,
            email: this.email,
            password: this.password,
            hashedSessionKey: this.hashedSessionKey,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin
        };
    }
}

User.usersDir = path.join(process.cwd(), 'users');

module.exports = User;
