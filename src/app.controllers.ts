/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, Post } from "@nestjs/common";
import { AppService } from "./app.services";
import { ArrayMaxSize, arrayMaxSize, ArrayMinSize, arrayMinSize, IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class SubmitUrlsDto {
   
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(3)
    @ArrayMinSize(1)
    urls: string[];

    @IsString()
    namespace: string;
}

export class QuestionDto {
    @IsString()
    question: string;

    @IsNotEmpty()
    @IsString()
    namespace:string;
}

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Post('urls')
    async submitUrls(@Body() body: SubmitUrlsDto) {
        console.log(body)
        return await this.appService.submitUrls(body);
    }

    @Post('question')
    async askQuestion(@Body() body: QuestionDto) {
        return await this.appService.processQuestion(body.question,body.namespace);
    }

    @Post('check-namespace')
    async checkNamespace(@Body() body: { namespace: string }) {
        return await this.appService.checkNamespace(body.namespace);
    }
}
