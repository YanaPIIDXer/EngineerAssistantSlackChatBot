import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "langchain/prompts";
import { roleTemplate } from "./template";

/**
 * チャットボットクラス
 */
export class ChatBot {
  private chat: ChatOpenAI;

  /**
   * コンストラクタ
   */
  constructor() {
    this.chat = new ChatOpenAI({
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_TOKEN,
    });
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
