# 为Microsoft Teams开发智能对话机器人
> 作者：陈希章  2018年5月29日 @ 台北 亚太技术年会


## 第一步，使用标准的Web App创建一个bot，在网页中调试，配置Git 仓库，下载代码，修改代码，提交，调试
```javascript
	bot.dialog('/', function (session) {
	    //1. basic
	    session.send('您好，我是机器人小强，我收到了您的消息 ' + session.message.text);
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
	            .title("欢迎参加亚太技术年会")
	            .subtitle("微软欢迎大家，希望和大家多多交流")
	            .text("这是一个卡片正文")
	            .images([builder.CardImage.create(session, "http://fm.cnbc.com/applications/cnbc.com/resources/img/editorial/2016/04/20/103564443-GettyImages-594827903.1910x1000.jpg")])
	            .buttons([
	                builder.CardAction.imBack(session, "确定", "确定"),
	                builder.CardAction.call(session, "+886xxxxxxxxx", "打电话"),
	                builder.CardAction.openUrl(session, "https://www.microsoft.com/taiwan/events/2018devdays", "打开首页")
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
	        builder.Prompts.text(session, "您好... 我能知道您的姓名吗?");
	    },
	    function (session, results) {
	        session.userData.name = results.response;
	        builder.Prompts.number(session, "您好 " + results.response + ", 请问您做编程已经有多少年了?");
	    },
	    function (session, results) {
	        session.userData.coding = results.response;
	        builder.Prompts.choice(session, "您最喜欢的脚本编程语言是?", ["JavaScript", "CoffeeScript", "TypeScript"]);
	    },
	    function (session, results) {
	        session.userData.language = results.response.entity;
	        session.send("太酷了... " + session.userData.name +
	            " 您已经有了 " + session.userData.coding +
	            " 年的 " + session.userData.language + "经验.");
	    }
]);
```

## 第四步，使用LUIS来进行会话

	在Bot Service中添加三个设置（需要通过 luis.ai 先创建好相关的语义模型）
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
	        session.send('您的意图是跟我打招呼. 您说了 \'%s\'.', session.message.text);
	        session.endDialog();
	    }
	).triggerAction({
	    matches: 'Greeting'
	})
	
	bot.dialog('HelpDialog',
	    (session) => {
	        session.send('您是否需要帮助');
	        session.endDialog();
	    }
	).triggerAction({
	    matches: 'Help'
	})
	
	bot.dialog('CancelDialog',
	    (session) => {
	        session.send('看起来您是想结束跟我的对话，不要啊…..');
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
	接著，修改应用的配置（需要先通过 qnamaker.ai 先创建知识库）
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
	    defaultMessage: '对不起，我不懂你在说什么',
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
	    defaultMessage: '对不起，我不懂你在说什么',
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



## 你可以直接用根目录下面的Devdays.zip文件，在Microsoft Teams中进行加载，测试效果
