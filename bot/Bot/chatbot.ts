import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate, AIMessagePromptTemplate } from "langchain/prompts";
import { roleTemplate } from "./template";

/**
 * コンテキスト情報
 */
interface ContextInfo {
  message: string;
  isUserMessage: boolean;
}

/**
 * チャットボットクラス
 */
export class ChatBot {
  private chat: ChatOpenAI;
  private contexts: ContextInfo[] = [];

  /**
   * コンストラクタ
   */
  constructor() {
    this.chat = new ChatOpenAI({
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_TOKEN,
      modelName: "gpt-4-0613",
    });
  }

  /**
   * コンテキスト追加
   * @param message 発言内容
   * @param isUserMessage 人間の発言か？
   */
  addContext(message: string, isUserMessage: boolean): void {
    this.contexts.push({ message, isUserMessage });
  }

  /**
   * メッセージ送信
   * @params message メッセージ
   * @params aboutChannel チャンネルの説明
   * @returns Botの返答
   */
  async sendMessage(message: string, aboutChannel: string = ""): Promise<string> {
    const prompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(roleTemplate),
      ...this.contexts.map(c => {
        if (c.isUserMessage) {
          return HumanMessagePromptTemplate.fromTemplate(c.message);
        } else {
          return AIMessagePromptTemplate.fromTemplate(c.message);
        }
      }),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
    ]);
    
    const chain = new LLMChain({
      llm: this.chat,
      prompt,
    });

    const response = await chain.predict({ input: message, aboutChannel });
    return response;
  }
}
