const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

class User {
    constructor(data) {
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

    toJSON() {
        return {
            name: this.name,
            email: this.email,
            password: this.password,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin
        };
    }
}

User.usersDir = path.join(process.cwd(), 'users');

module.exports = User;
