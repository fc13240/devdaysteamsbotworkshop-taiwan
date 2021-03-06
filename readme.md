# 為Microsoft Teams開發智能對話機器人
> 作者：陳希章  2018年5月29日 @ 臺北 亞太技術年會


## 第一步，使用標準的Web App創建一個bot，在網頁中調試，配置Git 倉庫，下載代碼，修改代碼，提交，調試
```javascript
	bot.dialog('/', function (session) {
	    //1. basic
	    session.send('您好，我是機器人小强，我收到了您的消息 ' + session.message.text);
	});
```

## 第二步，修改成圖文卡片消息
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

## 第三步，修改成Form的形式進行會話
```javascript
	//3.form
	bot.dialog('/',[
	    function (session) {
	        builder.Prompts.text(session, "您好... 我能知道您的姓名嗎?");
	    },
	    function (session, results) {
	        session.userData.name = results.response;
	        builder.Prompts.number(session, "您好 " + results.response + ", 請問您做編程已經有多少年了?");
	    },
	    function (session, results) {
	        session.userData.coding = results.response;
	        builder.Prompts.choice(session, "您最喜歡的脚本編程語言是?", ["JavaScript", "CoffeeScript", "TypeScript"]);
	    },
	    function (session, results) {
	        session.userData.language = results.response.entity;
	        session.send("太酷了... " + session.userData.name +
	            " 您已經有了 " + session.userData.coding +
	            " 年的 " + session.userData.language + "經驗.");
	    }
]);
```

## 第四步，使用LUIS來進行會話

	在Bot Service中添加三個設置（需要通過 luis.ai 先創建好相關的語義模型）
	LuisAPIHostName
	LuisAppId
	LuisAPIKey
	
	修改代碼如下
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
	        session.send('您的意圖是跟我打招呼. 您說了 \'%s\'.', session.message.text);
	        session.endDialog();
	    }
	).triggerAction({
	    matches: 'Greeting'
	})
	
	bot.dialog('HelpDialog',
	    (session) => {
	        session.send('您是否需要幫助');
	        session.endDialog();
	    }
	).triggerAction({
	    matches: 'Help'
	})
	
	bot.dialog('CancelDialog',
	    (session) => {
	        session.send('看起來您是想結束跟我的對話，不要啊…..');
	        session.endDialog();
	    }
	).triggerAction({
	    matches: 'Cancel'
	})

```

	通過luis.ai 了解背後的原理（如何定義意圖，訓練等）

## 第五步，改成使用QnAMaker的方式

	首先，安裝一個特殊的包 npm install botbuilder-cognitiveservices --save
	其次，增加一個包導入的命令  var builder_cognitiveservices = require("botbuilder-cognitiveservices");
	接著，修改應用的配置（需要先通過 qnamaker.ai 先創建知識庫）
	QnAKnowledgebaseId
	QnAAuthKey
	QnAEndpointHostName
  
	最後，修改代碼
```javascript
	// Recognizer and and Dialog for preview QnAMaker service
	var previewRecognizer = new builder_cognitiveservices.QnAMakerRecognizer({
	    knowledgeBaseId: process.env.QnAKnowledgebaseId,
	    authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey
	});
	
	var basicQnAMakerPreviewDialog = new builder_cognitiveservices.QnAMakerDialog({
	    recognizers: [previewRecognizer],
	    defaultMessage: '對不起，我不懂你在説什麽',
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
	    defaultMessage: '對不起，我不懂你在説什麽',
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
	
通過qnamaker.ai 了解背後的原理



## 你可以直接用根目錄下面的Devdays.zip文件，在Microsoft Teams中進行加載，測試效果
