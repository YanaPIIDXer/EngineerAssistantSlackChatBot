import dotenv from "dotenv";
dotenv.config();

import { App, ExpressReceiver } from "@slack/bolt";
const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGN_SECRET ?? "",
  processBeforeResponse: true,
});
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGN_SECRET ?? "",
  receiver: expressReceiver,
  processBeforeResponse: true,
  endpoints: "/slack/events",
});

app.use(async ({ context, next }) => {
  // リトライは握り潰す
  if (context.retryNum ?? 0 > 0) { return; }
  await next();
});

app.event("app_mention", async ({ event, say }) => {
  const msg = event.text.replace(/<@\w+>/g, "");

  const channelInfo = await app.client.conversations.info({
    channel: event.channel,
  });
  const aboutChannel = channelInfo.channel?.purpose?.value ?? "";
  
  const bot = new ChatBot();
  const response = await bot.sendMessage(msg, aboutChannel);
  await say({
    text: `<@${event.user}>\n` + response,
    thread_ts: event.thread_ts || event.ts,
  })
});

import * as AwsServerlessExpress from "aws-serverless-express";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { ChatBot } from "./Bot";
const server = AwsServerlessExpress.createServer(expressReceiver.app);

export const lambdaHandler = (event: APIGatewayProxyEvent, context: Context): void => {
  AwsServerlessExpress.proxy(server, event, context);
}

if (process.env.SERVER_RUNNING_MODE === "Local") {
  (async () => {
    await app.start(3000);
    console.info("Assistant Bot Server Running...");
  })();
}
