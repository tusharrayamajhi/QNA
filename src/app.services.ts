import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AiServices } from "./aiServices";
import {v4 as uuid} from "uuid";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

@Injectable()
export class AppService {

    // private  id:string
    // private readonly historyData : Map<string,[HumanMessage|AIMessage]> = new Map();
    private readonly prompt = ChatPromptTemplate.fromTemplate(`
        you are a helpful assistant whose job is to reply to user questions using only the given context.
        if you find relevant information in the chat history, use that information as well to provide a complete answer.
        always reply in text format.
        remember previous conversations and refer back to them when relevant.
        use the chat history to maintain context and provide consistent responses.
        
        context:{context}
        user message:{message}
        `) 

    constructor(private readonly aiService:AiServices){}

    private urlsSubmitted = false;
    private urls: string[] = [];

    async submitUrls(body:{urls: string[],namespace:string}) {
        // this.id = body.namespace.toString().toLowerCase().replace(" ","_");
        // console.log(this.id)
        return await this.processUrls(body.urls,body.namespace);
    }
   
    private async processUrls(urls: string[],namespace:string) {
       return await this.aiService.addContentToPinecone(urls,namespace);
    }


    async processQuestion(question: string,namespace:string) {
        // if(!this.historyData.has(namespace)){
            // this.historyData.set(namespace,[new HumanMessage(question)]);
        // }
        // const history = this.historyData.get(namespace) as Array<HumanMessage | AIMessage>;
        const response = await this.aiService.ask(question, this.prompt, namespace);
        // history.push(new HumanMessage(question))
        // history.push(new AIMessage(response.toString()));
        return response;
    }

    async checkNamespace(namespace: string) {
        try {
            const index = this.aiService.getPineconeIndex();
            const ns = index.namespace(namespace);
            const stats = await ns.query({
                topK: 1,
                vector: Array(768).fill(0), // Dummy vector for query
                includeMetadata: false
            });
            return { 
                exists: stats.matches.length > 0,
                message: stats.matches.length > 0 ? 
                    "Namespace found, you can start chatting" : 
                    "Namespace not found"
            };
        } catch (error) {
            return { exists: false, message: "Error checking namespace" };
        }
    }

}

