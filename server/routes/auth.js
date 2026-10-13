const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const router = express.Router();


router.post("/register", async (req, res) => {
    try {
        const { full_name, email, password, phone, address } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                message: "Full name, email and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const [existingUsers] = await pool.execute(
            "SELECT user_id FROM users WHERE email = ?",
            [email.trim().toLowerCase()]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        const [roles] = await pool.execute(
            "SELECT role_id FROM roles WHERE role_name = ?",
            ["citizen"]
        );

        if (roles.length === 0) {
            return res.status(500).json({
                message: "Citizen role is not configured"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await pool.execute(
            `INSERT INTO users
             (role_id, full_name, email, password_hash, phone, address, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
            [
                roles[0].role_id,
                full_name.trim(),
                email.trim().toLowerCase(),
                passwordHash,
                phone || null,
                address || null
            ]
        );

        return res.status(201).json({
            message: "Registration successful",
            user: {
                user_id: result.insertId,
                full_name: full_name.trim(),
                email: email.trim().toLowerCase(),
                role: "citizen"
            }
        });
    } catch (error) {
        console.error("Registration error:", error.message);
        return res.status(500).json({
            message: "Unable to register user"
        });
    }
});


router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const [users] = await pool.execute(
            `SELECT u.user_id, u.full_name, u.email,
                    u.password_hash, u.is_active, r.role_name
             FROM users u
             JOIN roles r ON u.role_id = r.role_id
             WHERE u.email = ?
             LIMIT 1`,
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        if (user.is_active === 0) {
            return res.status(403).json({
                message: "Your account is inactive"
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role_name
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.json({
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role_name
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Unable to sign in"
        });
    }
});

module.exports = router;
