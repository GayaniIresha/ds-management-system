
require("dotenv").config();

const bcrypt = require("bcrypt");
const readline = require("readline/promises");
const pool = require("./config/db");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function createAdmin() {
    try {
        const fullName = (
            await rl.question("Admin full name: ")
        ).trim();

        const email = (
            await rl.question("Admin email: ")
        ).trim().toLowerCase();

        const password = await rl.question(
            "Create a strong admin password: "
        );

        if (!fullName || !email || password.length < 8) {
            console.log(
                "Name and email are required. Password must have at least 8 characters."
            );
            return;
        }

        const [existingUsers] = await pool.execute(
            "SELECT user_id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            console.log(
                "This email already exists. No account was changed."
            );
            return;
        }

        const [roles] = await pool.execute(
            "SELECT role_id FROM roles WHERE role_name = ?",
            ["admin"]
        );

        if (roles.length === 0) {
            throw new Error("Admin role not found in the roles table.");
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await pool.execute(
            `INSERT INTO users
             (role_id, full_name, email, password_hash,
              is_active, created_at)
             VALUES (?, ?, ?, ?, 1, NOW())`,
            [
                roles[0].role_id,
                fullName,
                email,
                passwordHash
            ]
        );

        console.log("Admin account created successfully.");
        console.log("Admin user ID:", result.insertId);
        console.log("Admin email:", email);
    } catch (error) {
        console.error("Admin creation failed:", error.message);
    } finally {
        rl.close();
        await pool.end();
    }
}

createAdmin();