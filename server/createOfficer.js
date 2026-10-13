
require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("./config/db");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  try {
    const email = (await ask("Officer email: ")).trim();
    const password = await ask("Officer password: ");

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const [existing] = await pool.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      throw new Error("This email already exists. No account was changed.");
    }

    const [roles] = await pool.execute(
      "SELECT role_id FROM roles WHERE LOWER(role_name) = 'officer' LIMIT 1"
    );

    if (roles.length === 0) {
      throw new Error("Officer role was not found in the roles table.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users
       (role_id, full_name, email, password_hash, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [roles[0].role_id, "DSMS Officer", email, passwordHash]
    );

    console.log("\nOfficer account created successfully!");
    console.log("User ID:", result.insertId);
    console.log("Email:", email);
  } catch (error) {
    console.error("\nError:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
    rl.close();
  }
}

main();
