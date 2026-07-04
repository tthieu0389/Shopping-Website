require("dotenv").config();
const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET || "fallback_secret_if_env_not_found";

const ACCOUNTS = [
  { id: 11, email: "admin@gmail.com", role: "admin" },
  { id: 12, email: "staff@gmail.com", role: "staff" },
  { id: 13, email: "user@example.com", role: "user" },
];

const EXPIRES_IN = "4h";

// In cho đẹp
const LINE = "-".repeat(70);

console.log(LINE);
console.log("JWT TEST TOKENS");
console.log(`Expires in: ${EXPIRES_IN}`);
console.log(LINE);

ACCOUNTS.forEach(({ id, email, role }, index) => {
  const payload = { id, email, role };
  const token = jwt.sign(payload, secret, { expiresIn: EXPIRES_IN });

  console.log(`\n[${index + 1}] Role: ${role.toUpperCase()}`);
  console.log(`    id:    ${id}`);
  console.log(`    email: ${email}`);
  console.log(`    token: ${token}`);
});

console.log(`\n${LINE}`);
console.log("Usage: Authorization: Bearer <token>");
console.log(LINE);
