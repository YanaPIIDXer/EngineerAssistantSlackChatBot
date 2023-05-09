import dotenv from "dotenv";
dotenv.config();

import Express from "express";
const app = Express();

app.listen(3000, () => {
  console.info("Slack Assistant Bot is Running...");
});
