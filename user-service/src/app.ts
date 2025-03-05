import express from "express";
import User from "./models/user.model";
import { Request, Response } from "express";
import logger from "./config/logger";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.post(
  "/api/users/login",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email, password });

      if (!user) {
        return res
          .status(404)
          .json({ error: "User not found", status: 404, success: false });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    logger.info("Get user by ID:", req.params.id);
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found", status: 404, success: false });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, password, email } = req.body;
    const user = new User({
      name,
      password,
      email,
    });
    await user.save();
    res.status(201).json(user);
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(400).json({ error: error.message });
  }
});

export default app;
