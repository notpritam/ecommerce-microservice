import app from "./app";
import connectDB from "./config/db";
import ENV from "./config/env";

const startServer = async () => {
  await connectDB();

  app.listen(ENV.port, () => {
    console.log("Server is running on ", ENV.port);
  });
};

console.log("User Service Started!");

startServer();
