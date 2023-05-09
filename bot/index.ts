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
    token: process.env.SLACK_BOT_TOKEN,
    channel: event.channel,
  });
  const aboutChannel = channelInfo.channel?.purpose?.value ?? "";

  const thread_ts = event.thread_ts || event.ts;
  const threadInfo = await app.client.conversations.replies({
    token: process.env.SLACK_BOT_TOKEN,
    channel: event.channel,
    ts: thread_ts,
  });

  const bot = new ChatBot();
  if (threadInfo.messages) {
    threadInfo.messages.forEach(async (info, index) => {
      // 最後の発言はこの後ChatGPTに投げる分なのでここでは弾く
      if (index < threadInfo.messages!.length - 1 && info.text) {
        await bot.addContext(info.text, !info.bot_id);
      }
    })
  }
  
  const response = await bot.sendMessage(msg, aboutChannel);
  const text = `<@${event.user}>\n` + response;
  await say({
    token: process.env.SLACK_BOT_TOKEN,
    text,
    thread_ts,
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
