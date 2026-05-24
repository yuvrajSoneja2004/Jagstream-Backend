import Redis from "ioredis";

export const redisClient = new Redis("redis://20.244.8.123:6379");

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});
