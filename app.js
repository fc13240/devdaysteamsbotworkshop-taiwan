/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

bot.dialog('/', function (session) {

    //2. card
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel);
    var attachments = [
        new builder.HeroCard(session)
            .title("歡迎參加亞太技術年會")
            .subtitle("微軟歡迎大家，希望和大家多多交流")
            .text("這是一個卡片正文")
            .images([builder.CardImage.create(session, "http://fm.cnbc.com/applications/cnbc.com/resources/img/editorial/2016/04/20/103564443-GettyImages-594827903.1910x1000.jpg")])
            .buttons([
                builder.CardAction.imBack(session, "確定", "確定"),
                builder.CardAction.call(session, "+886xxxxxxxxx", "打電話"),
                builder.CardAction.openUrl(session, "https://www.microsoft.com/taiwan/events/2018devdays", "打開首頁")
            ])
    ];
    msg.attachments(attachments);
    session.send(msg);

});
