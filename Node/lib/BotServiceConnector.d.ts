import * as builder from 'botbuilder-proxy';
export declare class BotServiceConnector extends builder.ChatConnector {
    constructor(settings?: builder.IChatConnectorSettings);
    listen(): (context: any, req: any) => void;
}
