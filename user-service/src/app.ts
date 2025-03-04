import express from "express";
import connectDB from "./config/db";
import ENV from "./config/env";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

connectDB().then(() => {
  app.listen(ENV.port, () => {
    console.log("Server is running on ", ENV.port);
  });
});
