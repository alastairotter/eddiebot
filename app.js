'use strict';

const config = require('./config');
const express = require('express');
// const crypto = require('crypto');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const apiai = require('apiai');
const apiApp = apiai(config.API_AI_CLIENT_ACCESS_TOKEN);
// const uuid = require('uuid');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// START EXPRESS SERVER
const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});



// SET UP INDEX ROUTE
app.get('/', function (req, res) {
	res.send('Hi, I am the local Passmark bot')
})


// FACEBOOK VALIDATION (ONCE OFF)
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});




// HANDLING MESSAGES
app.post('/webhook/', (req, res) => {
  console.log(req.body);





  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {

          console.log("Event: " + event.message.text);

          sendMessage(event);
        }
        //CHECK FOR PAYLOAD
        else {
          if(event.postback && event.postback.payload === '@getStarted' )
          {
                  sendGetStartedMessage(event);
          }
          else if(event.postback && event.postback.payload === '@go' )
          {
                  console.log("Got GO message");
          }
        }

      });
    });
    res.status(200).end();
  }
});



// SEND MESSAGE

function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  let api = apiApp.textRequest(text, {
    sessionId: 'tabby_cat' // use any arbitrary id
  });

  api.on('response', (response) => {



    // if(response.result.action === "help") { console.log("This person needs help"); }

// TESTING GIF
if(response.result.action === "input.unknown") {
  sendConfusedImage(sender);
}

// SEND GREETING MESSAGE
if(response.result.action === "get_started") {
  sendGetStartedMessage(event);
}


    // RESPOND TO USER
    let aiText = response.result.fulfillment.speech;
    var messageData = {
  		recipient: {
  			id: sender
  		},
      message: {
        text: aiText
      }
  	};

    // SEND TYPING
    sendTypingOn(sender);

    setTimeout( function () {
      sendApi(messageData);


    }, 3000);






  });

  api.on('error', (error) => {
    console.log(error);
  });

  api.end();
}



function sendTypingOn(recipientId) {
	console.log("Turning typing indicator on");

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_on"
	};

	sendApi(messageData);
}

function sendImage(recipientId) {

	var messageDataLogo = {
		recipient: {
			id: recipientId
		},
    "message":{
    "attachment":{
      "type":"image",
      "payload":{
        "url":"http://goinkscape.com/wp-content/uploads/2015/07/twitter-logo-final.png"
      }
    }
  }
	};

	sendApi(messageData);
}


function sendConfusedImage(recipientId) {

	var messageDataConfused = {
		recipient: {
			id: recipientId
		},
    "message":{
    "attachment":{
      "type":"image",
      "payload":{
        "url":"http://dev.mediahack.co.za/eddiebot/confused.gif"
      }
    }
  }
	};

	sendApi(messageDataConfused);
}




function sendApi(messageData) {
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {
			access_token: config.FB_PAGE_TOKEN
		},
		method: 'POST',
		json: messageData

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;

			if (messageId) {
				console.log("Successfully sent message with id %s to recipient %s",
					messageId, recipientId);
			} else {
				console.log("Successfully called Send API for recipient %s",
					recipientId);
			}
		} else {
			console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
		}
	});
}

// SET GET STARTED MESSAGES

function sendGetStartedMessage(event) {
  let recipientId = event.sender.id;

  setTimeout( function () {
      sendTypingOn(recipientId);
  }, 500)

  var greetings = [
    "Hi there, I'm Eddie. Before we start here are a few tips. (1) If you get stuck type 'help'. (2) If you want updates as I add new information type 'subscribe'. (3) If you want to talk to a human(!), type 'take me to your leader' or, if you're lazy, 'leader'",
    // "Want to know what an acceptable school looks like? Check out 'School Standards'",
    // "Is your school listed as being made of asbestos or having asbestos classrooms? Take a look at 'Look Up'",
    // "I can also help you sign up for occasional alerts when Passmark releases new school data",
    // "Choose an option below"
  ];

  greetings.forEach(function (msg, i) {

    setTimeout( function () {
        sendTypingOn(recipientId);
    }, 300)

    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: msg
      }
    };

    setTimeout( function () {

        sendApi(messageData);

    }, i * 3000);

  });


setTimeout( function () {


  var messageData = {
    recipient: {
      id: recipientId
    },
    "message":{
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Let's get started. Click 'Go' when you're ready. ",
        "buttons":[
          // {
          //   "type":"web_url",
          //   "url":"https://petersapparel.parseapp.com",
          //   "title":"Show Website"
          // },
          {
            "type":"postback",
            "title":"Go",
            "payload":"@go"
          }
        ]
      }
    }
  }
  };


  sendApi(messageData);

}, 5000);









}
