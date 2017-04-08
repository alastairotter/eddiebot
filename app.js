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
          sendMessage(event);
        }
        //CHECK FOR GET STARTED
        else {
          if(event.postback && event.postback.payload === '@getStarted' )
          {
                  //present user with some greeting or call to action
                  let sender = event.sender.id;
                  var msg = "Hi ,I'm a Bot ,and I was created to help you easily .... ";
                  sendGetStartedMessage(msg,sender);
                  //sendMessage(event.sender.id,msg);
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

    console.log("response --- ");
    console.log(response.result);

    if(response.result.action === "help") { console.log("This person needs help"); }


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


    }, 1000);






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
	console.log("Sending an image");

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

function sendGetStartedMessage(msg,recipientId) {
  setTimeout( function () {
      sendTypingOn(recipientId);
  }, 500)

  var greetings = [
    "Hi, I'm EddieBot. I'm here to help you with information about education in South Africa. Here are a few things I can do for you ...",
    "I can send you you some facts about asbestos in schools.",
    "Or I could help you look up your school to see if it is on the list of asbestos schools.",
    "I can also help you sign up for updates as Passmark makes schools information available."
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






}
