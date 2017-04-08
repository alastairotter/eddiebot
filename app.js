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


// CHECK FOR GET STARTED payload
var data = req.body;

// Make sure this is a page subscription
if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
    var pageID = entry.id;
    var timeOfEvent = entry.time;

    // Iterate over each messaging event
    entry.messaging.forEach(function(event) {
        if (event.message) {
        //receivedMessage(event);
        } else {
            // If the event is a postback and has a payload equals USER_DEFINED_PAYLOAD
        if(event.postback && event.postback.payload === '@getStarted' )
        {
                //present user with some greeting or call to action
                var msg = "Hi ,I'm a Bot ,and I was created to help you easily .... ";
                console.log(msg);
                //sendMessage(event.sender.id,msg);
        }

        }
    });
    });

    res.sendStatus(200);
}
// END CHECK FOR GET STARTED PAYLOAD


  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          sendMessage(event);
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

    if(response.result.action === "help") {
      setTimeout( function () {
          sendTypingOn(sender);
      }, 500)

      // MESSAGE 2
      var messageData2 = {
        recipient: {
          id: sender
        },
        message: {
          text: "For example, I could send you some facts about asbestos in schools."
        }
      };

      var messageData3 = {
        recipient: {
          id: sender
        },
        message: {
          text: "Or I could help you look up your school and see if it is listed on the asbestos lists."
        }
      };

      var messageData4 = {
        recipient: {
          id: sender
        },
        message: {
          text: "Or I could help you sign up for for alerts when Passmark releases new data."
        }
      };


      var messageData5 = {
    		recipient: {
    			id: sender
    		},
        message: {
          attachment:{
            type:"image",
            payload:{
            url:"http://dev.mediahack.co.za/eddiebot/logo.png"
          }
        }
      }
    	};

      var messageData6 = {
        recipient: {
          id: sender
        },
        message: {
          text: "Try it now: type 'fact' for a fact about asbestos schools"
        }
      };








      setTimeout( function () {
          sendApi(messageData2);
          setTimeout( function () {
              sendTypingOn(sender);
          }, 300)

      }, 6000)

      setTimeout( function () {
          sendApi(messageData3);
          setTimeout( function () {
              sendTypingOn(sender);
          }, 300)
      }, 9000)

      setTimeout( function () {
          sendApi(messageData4);
          setTimeout( function () {
              sendTypingOn(sender);
          }, 300)

      }, 12000)

      // setTimeout( function () {
      //     sendApi(messageData5);
      //
      // }, 15000)


      setTimeout( function () {
          sendApi(messageData6);

      }, 18000)



    }



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
