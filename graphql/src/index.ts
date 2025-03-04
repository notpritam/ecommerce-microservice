import express from "express";
import { createServer } from "http";

const app = express();

const httpServer = createServer(app);

httpServer.listen(4000, () => {
  console.log("Server is running on port 4000");
});

app.get("/", (req, res) => {
  res.send("GraphQL Gateway2");
});

console.log("GraphQL Gateway2");
