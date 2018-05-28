# 為Microsoft Teams開發智能對話機器人
> 作者：陳希章  2018年5月29日 @ 臺北 



## 第一步，使用标准的Web App创建一个bot，在网页中调试，配置Git 仓库，下载代码，修改代码，提交，调试
```javascript
	bot.dialog('/', function (session) {
	    //1. basic
	    session.send('You said ' + session.message.text);
	});
```

## 第二步，修改成图文卡片消息
```javascript
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
 ```

## 第三步，修改成Form的形式进行会话
```javascript
	//3.form
	bot.dialog('/',[
	    function (session) {
	        builder.Prompts.text(session, "Hello... What's your name?");
	    },
	    function (session, results) {
	        session.userData.name = results.response;
	        builder.Prompts.number(session, "Hi " + results.response + ", How many years have you been coding?");
	    },
	    function (session, results) {
	        session.userData.coding = results.response;
	        builder.Prompts.choice(session, "What language do you code Node using?", ["JavaScript", "CoffeeScript", "TypeScript"]);
	    },
	    function (session, results) {
	        session.userData.language = results.response.entity;
	        session.send("Got it... " + session.userData.name +
	            " you've been programming for " + session.userData.coding +
	            " years and use " + session.userData.language + ".");
	    }
	]);
```

## 第四步，使用LUIS来进行会话

	在Bot Service中添加三个设置
	LuisAPIHostName
	LuisAppId
	LuisAPIKey
	
	修改代码如下
```javascript
	var luisAppId = process.env.LuisAppId;
	var luisAPIKey = process.env.LuisAPIKey;
	var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
	
	const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;
	
	// Create a recognizer that gets intents from LUIS, and add it to the bot
	var recognizer = new builder.LuisRecognizer(LuisModelUrl);
	bot.recognizer(recognizer);
	
	// Add a dialog for each intent that the LUIS app recognizes.
	// See https://docs.microsoft.com/en-us/bot-framework/nodejs/bot-builder-nodejs-recognize-intent-luis 
	bot.dialog('GreetingDialog',
	    (session) => {
	        session.send('You reached the Greeting intent. You said \'%s\'.', session.message.text);
	        session.endDialog();
	    }
	).triggerAction({
	    matches: 'Greeting'
	})
	
	bot.dialog('HelpDialog',
	    (session) => {
	        session.send('You reached the Help intent. You said \'%s\'.', session.message.text);
	        session.endDialog();
	    }
	).triggerAction({
	    matches: 'Help'
	})
	
	bot.dialog('CancelDialog',
	    (session) => {
	        session.send('You reached the Cancel intent. You said \'%s\'.', session.message.text);
	        session.endDialog();
	    }
	).triggerAction({
	    matches: 'Cancel'
	})
```

	通过luis.ai 了解背后的原理（如何定义意图，训练等）

## 第五步，改成使用QnAMaker的方式

	首先，安装一个特殊的包 npm install botbuilder-cognitiveservices --save
	其次，增加一个包导入的命令  var builder_cognitiveservices = require("botbuilder-cognitiveservices");
	接着，修改应用的配置
	QnAKnowledgebaseId
	QnAAuthKey
	QnAEndpointHostName
  
	最后，修改代码
```javascript
	// Recognizer and and Dialog for preview QnAMaker service
	var previewRecognizer = new builder_cognitiveservices.QnAMakerRecognizer({
	    knowledgeBaseId: process.env.QnAKnowledgebaseId,
	    authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey
	});
	
	var basicQnAMakerPreviewDialog = new builder_cognitiveservices.QnAMakerDialog({
	    recognizers: [previewRecognizer],
	    defaultMessage: 'No match! Try changing the query terms!',
	    qnaThreshold: 0.3
	}
	);
	
	bot.dialog('basicQnAMakerPreviewDialog', basicQnAMakerPreviewDialog);
	
	// Recognizer and and Dialog for GA QnAMaker service
	var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
	    knowledgeBaseId: process.env.QnAKnowledgebaseId,
	    authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey, // Backward compatibility with QnAMaker (Preview)
	    endpointHostName: process.env.QnAEndpointHostName
	});
	
	var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
	    recognizers: [recognizer],
	    defaultMessage: 'No match! Try changing the query terms!',
	    qnaThreshold: 0.3
	}
	);
	
	bot.dialog('basicQnAMakerDialog', basicQnAMakerDialog);
	
	bot.dialog('/', //basicQnAMakerDialog);
	    [
	        function (session) {
	            var qnaKnowledgebaseId = process.env.QnAKnowledgebaseId;
	            var qnaAuthKey = process.env.QnAAuthKey || process.env.QnASubscriptionKey;
	            var endpointHostName = process.env.QnAEndpointHostName;
	
	            // QnA Subscription Key and KnowledgeBase Id null verification
	            if ((qnaAuthKey == null || qnaAuthKey == '') || (qnaKnowledgebaseId == null || qnaKnowledgebaseId == ''))
	                session.send('Please set QnAKnowledgebaseId, QnAAuthKey and QnAEndpointHostName (if applicable) in App Settings. Learn how to get them at https://aka.ms/qnaabssetup.');
	            else {
	                if (endpointHostName == null || endpointHostName == '')
	                    // Replace with Preview QnAMakerDialog service
	                    session.replaceDialog('basicQnAMakerPreviewDialog');
	                else
	                    // Replace with GA QnAMakerDialog service
	                    session.replaceDialog('basicQnAMakerDialog');
	            }
	        }
	    ]);
```	
	
通过qnamaker.ai 了解背后的原理
