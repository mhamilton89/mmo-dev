const bcrypt = require('bcrypt');
const db = require('../database/db');

const SALT_ROUNDS = 10;

// Register new account
async function register(username, email, password) {
    try {
        // Check if username or email exists
        const existingAccount = await db.query(
            'SELECT id FROM accounts WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingAccount.rows.length > 0) {
            return { success: false, message: 'Username or email already exists' };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create account
        const result = await db.query(
            'INSERT INTO accounts (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email, passwordHash]
        );

        return {
            success: true,
            account: result.rows[0]
        };

    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Registration failed' };
    }
}

// Login
async function login(username, password) {
    try {
        // Get account by username
        const result = await db.query(
            'SELECT id, email, username, password_hash FROM accounts WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return { success: false, message: 'Invalid credentials' };
        }

        const account = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, account.password_hash);

        if (!validPassword) {
            return { success: false, message: 'Invalid credentials' };
        }

        // Update last login
        await db.query(
            'UPDATE accounts SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [account.id]
        );

        return {
            success: true,
            account: {
                id: account.id,
                email: account.email,
                username: account.username
            }
        };

    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed' };
    }
}

// Get characters for account
async function getCharacters(accountId) {
    try {
        const result = await db.query(
            'SELECT id, name, class, level, experience, health, max_health, mana, max_mana, last_played FROM characters WHERE account_id = $1 ORDER BY last_played DESC',
            [accountId]
        );

        return result.rows;
    } catch (error) {
        console.error('Error fetching characters:', error);
        return [];
    }
}

// Create character
async function createCharacter(accountId, name, className) {
    try {
        const { getClassDefaults } = require('./classes');

        // Check if character name is taken
        const existingChar = await db.query(
            'SELECT id FROM characters WHERE name = $1',
            [name]
        );

        if (existingChar.rows.length > 0) {
            return { success: false, message: 'Character name already taken' };
        }

        // Check character limit per account (max 5)
        const charCount = await db.query(
            'SELECT COUNT(*) FROM characters WHERE account_id = $1',
            [accountId]
        );

        if (parseInt(charCount.rows[0].count) >= 5) {
            return { success: false, message: 'Maximum 5 characters per account' };
        }

        // Get class defaults
        const defaults = getClassDefaults(className);
        if (!defaults) {
            return { success: false, message: 'Invalid class' };
        }

        // Create character
        const result = await db.query(
            `INSERT INTO characters
            (account_id, name, class, health, max_health, mana, max_mana,
             strength, intelligence, dexterity, vitality, attack_power, magic_power, defense, x, y)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
                accountId, name, className,
                defaults.health, defaults.max_health,
                defaults.mana, defaults.max_mana,
                defaults.strength, defaults.intelligence,
                defaults.dexterity, defaults.vitality,
                defaults.attack_power, defaults.magic_power,
                defaults.defense, defaults.x, defaults.y
            ]
        );

        return {
            success: true,
            character: result.rows[0]
        };

    } catch (error) {
        console.error('Character creation error:', error);
        return { success: false, message: 'Character creation failed' };
    }
}

// Get character by ID (with ownership check)
async function getCharacter(characterId, accountId) {
    try {
        const result = await db.query(
            'SELECT * FROM characters WHERE id = $1 AND account_id = $2',
            [characterId, accountId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error fetching character:', error);
        return null;
    }
}

// Delete character
async function deleteCharacter(characterId, accountId) {
    try {
        const result = await db.query(
            'DELETE FROM characters WHERE id = $1 AND account_id = $2 RETURNING name',
            [characterId, accountId]
        );

        if (result.rows.length === 0) {
            return { success: false, message: 'Character not found' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting character:', error);
        return { success: false, message: 'Failed to delete character' };
    }
}

module.exports = {
    register,
    login,
    getCharacters,
    createCharacter,
    getCharacter,
    deleteCharacter
};