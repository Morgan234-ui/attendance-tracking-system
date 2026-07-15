const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const uri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/attendance_system";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: String,
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

const demoAccounts = [
  {
    name: "Admin Demo",
    email: "admin@demo.local",
    password: "password123",
    role: "admin",
  },
  {
    name: "Lecturer Demo",
    email: "lecturer@demo.local",
    password: "password123",
    role: "lecturer",
  },
  {
    name: "Student Demo",
    email: "student@demo.local",
    password: "password123",
    role: "student",
  },
];

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  for (const account of demoAccounts) {
    const hashedPassword = await bcrypt.hash(account.password, 12);
    const email = account.email.toLowerCase();

    await User.updateOne(
      { email },
      {
        $setOnInsert: {
          email,
          createdAt: new Date(),
        },
        $set: {
          name: account.name,
          password: hashedPassword,
          role: account.role,
          isActive: true,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  console.log("Demo accounts created or updated successfully.");
  console.log("================================");
  console.log("Admin: admin@demo.local / password123");
  console.log("Lecturer: lecturer@demo.local / password123");
  console.log("Student: student@demo.local / password123");
  console.log("================================");
}

main()
  .catch((error) => {
    console.error("Failed to create demo accounts:", error);
    process.exit(1);
  })
  .finally(() => {
    mongoose.disconnect();
  });
