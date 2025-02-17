import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI,GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import {ChatPromptTemplate} from "@langchain/core/prompts"
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import {CheerioWebBaseLoader} from "@langchain/community/document_loaders/web/cheerio"
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters"
import { Document } from "@langchain/core/documents";
import {v4 as uuid, UUIDTypes} from "uuid"

@Injectable()
export class AiServices {
    private readonly model:ChatGoogleGenerativeAI;
    private readonly pinecone:PineconeClient;
    private readonly embedding:GoogleGenerativeAIEmbeddings;
    private readonly splitText:RecursiveCharacterTextSplitter;
    constructor(
        private readonly configService:ConfigService
    ) {
        const pineconeApiKey = this.configService.get<string>("PINECONE_DATABASE_API");
        const googleApiKey = this.configService.get<string>("GOOGLE_GEN_AI_API");

        if (!pineconeApiKey || !googleApiKey) {
            throw new Error("Missing required API keys");
        }
        
        this.pinecone = new PineconeClient({
            apiKey: pineconeApiKey
        });

        this.model = new ChatGoogleGenerativeAI({
            apiKey: googleApiKey,
            temperature: 0
        });
        this.embedding = new GoogleGenerativeAIEmbeddings({
            apiKey:googleApiKey
        })
        this.splitText = new RecursiveCharacterTextSplitter({
            chunkSize:400,
            chunkOverlap:200
        });
    }

    async addContentToPinecone(urls:string[],id:string){
        try{

            let data :string[] = []
            for(let url of urls){
                const loader = new CheerioWebBaseLoader(url)
                const webData = await loader.load()
            const splitedtext = await this.splitText.createDocuments([webData[0].pageContent])
            splitedtext.forEach(d=>data.push(d.pageContent))
        }
        
        // interface obj{
        //     id:string,
        //     metadata:{content:string},
        //     values:number[]
        // }
        
        // const finalData: obj[] = []
        
        const index =  this.pinecone.index("second")
        const namespace =  index.namespace(`${id}`)
        
        for(let content of data){
            const vector = await this.embedding.embedQuery(content);
            // console.log(vector)
            // const object = {
            //     id:uuid().toString(),
            //     metadata:{
            //         content:content
            //     },
            //     values:vector,
            // }
            
            await namespace.upsert([
                {
                    id:uuid(),
                    values:vector,
                    metadata:{
                        content:content
                    }
                }
            ])

            // finalData.push(object)
        }
        console.log("created")
        // console.log(namespace)
        return { 
            success: true, 
            message: "URLs submitted successfully. You can now ask questions about the content." 
        };
    }catch(err){
        return { 
            success: false, 
            message: "something went wrong" 
        };
    }

    }

    async ask(message:string,prompt:ChatPromptTemplate,id:string){
        
        const vector = await this.embedding.embedQuery(message);
        const namespace = this.pinecone.index('second').namespace(id);
        const data = await namespace.query({
            topK:5,
            vector:vector,
            includeMetadata:true,
            includeValues:false
        })
        const chain = prompt.pipe(this.model)
        // const context = data.matches.forEach(d=>d.metadata)
        // console.log(context)
        // console.log(history)
        const response = await chain.invoke({message:message,context:data.matches});
        return response.content;
    }

    getPineconeIndex() {
        return this.pinecone.index("second");
    }

}
