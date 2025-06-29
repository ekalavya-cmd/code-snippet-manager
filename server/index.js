require("dotenv").config(); // Load environment variables from .env

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB using the URI from .env
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Log MongoDB connection state
mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established");
});
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB connection disconnected");
});

const User = require("./models/User");
const Snippet = require("./models/Snippet");
const Collection = require("./models/Collection");

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

app.post("/register", async (req, res) => {
  const { email, username, password } = req.body;
  console.log("Register request received:", { email, username, password });

  // Validate input fields
  if (!email || !username || !password) {
    console.log("Missing fields in registration request:", {
      email,
      username,
      password,
    });
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate email format
  if (!/^[^\s@]+@csm\.com$/.test(email)) {
    return res
      .status(400)
      .json({ message: "Email must be a valid @csm.com address" });
  }

  try {
    // Check MongoDB connection state before proceeding
    if (mongoose.connection.readyState !== 1) {
      console.error(
        "MongoDB is not connected. Current state:",
        mongoose.connection.readyState
      );
      return res.status(500).json({ message: "Database connection error" });
    }

    // Check for existing email and username separately for specific error messages
    const existingEmail = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });

    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });

    if (existingEmail && existingUsername) {
      console.log("Both email and username already exist:", {
        email,
        username,
      });
      return res
        .status(400)
        .json({
          message:
            "Both email and username are already registered. Please use different credentials.",
        });
    }

    if (existingEmail) {
      console.log("Email already exists:", email);
      return res
        .status(400)
        .json({
          message:
            "This email is already registered. Please use a different email or try logging in.",
        });
    }

    if (existingUsername) {
      console.log("Username already exists:", username);
      return res
        .status(400)
        .json({
          message:
            "This username is already taken. Please choose a different username.",
        });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully for user:", username);

    // Set role: "admin" if the email matches the admin email, otherwise "user"
    const adminEmail = process.env.ADMIN_EMAIL || "default-admin@example.com";
    const role =
      email.toLowerCase() === adminEmail.toLowerCase() ? "admin" : "user";

    // Create and save the new user
    const user = new User({
      email,
      username,
      password: hashedPassword,
      role,
    });
    const savedUser = await user.save();
    console.log("User save operation completed. Saved user:", savedUser);

    // Verify that the user was actually saved by querying the database
    const verifyUser = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    if (!verifyUser) {
      console.error("User was not found in the database after save:", {
        email,
        username,
      });
      return res
        .status(500)
        .json({ message: "Failed to save user to database" });
    }
    console.log("User verified in database:", verifyUser);

    res.status(201).json({
      message: `Account created successfully! Welcome ${username}! You can now login with your credentials.`,
    });
  } catch (err) {
    console.error("Error during registration:", err);

    // Handle MongoDB duplicate key error (E11000)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const value = err.keyValue[field];

      if (field === "email") {
        return res.status(400).json({
          message: `The email "${value}" is already registered. Please use a different email or try logging in.`,
        });
      } else if (field === "username") {
        return res.status(400).json({
          message: `The username "${value}" is already taken. Please choose a different username.`,
        });
      }
    }

    res.status(400).json({ message: "Registration failed. Please try again." });
  }
});

app.post("/login", async (req, res) => {
  const { emailOrUsername, password } = req.body;
  console.log("Login request received:", { emailOrUsername });

  try {
    // Create case-insensitive search for both email and username
    const searchCriteria = {
      $or: [
        { email: { $regex: new RegExp(`^${emailOrUsername}$`, "i") } },
        { username: { $regex: new RegExp(`^${emailOrUsername}$`, "i") } },
      ],
    };

    const user = await User.findOne(searchCriteria);

    if (!user) {
      console.log("User not found:", emailOrUsername);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log("Password does not match for user:", emailOrUsername);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Login successful for user:", user.username);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

app.get("/snippets", authenticateToken, async (req, res) => {
  const snippets = await Snippet.find().populate("createdBy", "username");
  res.json(snippets);
});

app.post("/snippets", authenticateToken, async (req, res) => {
  const { title, code, language, tags, category } = req.body;
  const snippet = new Snippet({
    title,
    code,
    language: language.toLowerCase(),
    tags,
    category,
    createdBy: req.user.id,
    verified: false, // Always set to false for new snippets
  });

  await snippet.save();
  res.status(201).json(snippet);
});

app.put("/snippets/:id", authenticateToken, async (req, res) => {
  const { title, code, language, tags, category } = req.body;
  const snippet = await Snippet.findById(req.params.id);

  if (!snippet) return res.status(404).json({ message: "Snippet not found" });

  // Prevent normal users from editing verified snippets
  if (snippet.verified && req.user.role !== "admin") {
    return res.status(403).json({ message: "Cannot edit a verified snippet" });
  }

  snippet.title = title;
  snippet.code = code;
  snippet.language = language.toLowerCase();
  snippet.tags = tags;
  snippet.category = category;
  snippet.verified = false; // Reset verified status on edit

  await snippet.save();
  res.json(snippet);
});

app.delete("/snippets/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  await Snippet.findByIdAndDelete(req.params.id);
  await Collection.deleteMany({ snippetId: req.params.id });
  res.status(204).send();
});

app.post("/collection", authenticateToken, async (req, res) => {
  const { snippetId } = req.body;
  const collection = new Collection({ userId: req.user.id, snippetId });

  await collection.save();
  res.status(201).json({ message: "Added to collection" });
});

app.get("/collection", authenticateToken, async (req, res) => {
  const collections = await Collection.find({ userId: req.user.id }).populate({
    path: "snippetId",
    populate: { path: "createdBy", select: "username" },
  });

  const snippets = collections.map((collection) => collection.snippetId);
  res.json(snippets);
});

app.delete("/collection/:snippetId", authenticateToken, async (req, res) => {
  await Collection.deleteOne({
    userId: req.user.id,
    snippetId: req.params.snippetId,
  });
  res.status(204).send();
});

app.get("/snippets/search", authenticateToken, async (req, res) => {
  const { q, language, category } = req.query;

  try {
    let query = {};

    // Search by title, code, or tags if 'q' is provided
    if (q) {
      const searchRegex = new RegExp(q, "i"); // Case-insensitive search
      query.$or = [
        { title: searchRegex },
        { code: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Filter by language if provided
    if (language) {
      query.language = language.toLowerCase();
    }

    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Fetch snippets matching the query and populate the createdBy field
    const snippets = await Snippet.find(query).populate(
      "createdBy",
      "username"
    );
    res.json(snippets);
  } catch (err) {
    console.error("Error searching snippets:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/snippets/:id/verify", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const snippet = await Snippet.findById(req.params.id);
  if (!snippet) return res.status(404).json({ message: "Snippet not found" });

  snippet.verified = true;
  await snippet.save();
  res.json(snippet);
});

app.put("/snippets/:id/report-invalid", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const snippet = await Snippet.findById(req.params.id);
  if (!snippet) return res.status(404).json({ message: "Snippet not found" });

  snippet.verified = false;
  await snippet.save();
  res.json(snippet);
});

app.listen(3000, () => console.log("Server running on port 3000"));
