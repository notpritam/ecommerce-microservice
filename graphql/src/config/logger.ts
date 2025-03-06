import winston from "winston";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = "development";
  return env === "development" ? "debug" : "warn";
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Custom format that pretty-prints objects
const prettyJson = winston.format((info) => {
  // Check if the message contains an object to stringify
  if (info.message && typeof info.message === "object") {
    info.message = JSON.stringify(info.message, null, 2);
  }

  // Handle additional metadata objects
  const splat = info[Symbol.for("splat")] as unknown[];
  if (splat && Array.isArray(splat) && splat.length > 0) {
    const objects = splat.map((item) =>
      typeof item === "object" && item !== null
        ? JSON.stringify(item, null, 2)
        : item
    );
    info.message = `${info.message} ${objects.join(" ")}`;
  }

  return info;
});

// Combine formats
const format = winston.format.combine(
  prettyJson(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
  }),
  new winston.transports.File({ filename: "logs/all.log" }),
];

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
