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
    // Got a response from api.ai. Let's POST to Facebook Messenger
    console.log("response --- ");
    console.log(response.result);


    // RESPOND TO USER
    let aiText = response.result.fulfillment.speech;

    // RESPOND TO

    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: config.FB_PAGE_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: sender},

        message: {
          text: aiText,
          "quick_replies":[
      {
        "content_type":"text",
        "title":"Private Schools",
        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
      },
      {
        "content_type":"text",
        "title":"Public Scools",
        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
      }
    ]


        }
      }
    }, (error, response) => {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });

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

	callSendAPI(messageData);
}

// function sendMessage(event) {
//   let sender = event.sender.id;
//   let text = event.message.text;
//
//   request({
//     url: 'https://graph.facebook.com/v2.6/me/messages',
//     qs: {access_token: config.FB_PAGE_TOKEN},
//     method: 'POST',
//     json: {
//       recipient: {id: sender},
//       message: {text: text}
//     }
//   }, function (error, response) {
//     if (error) {
//         console.log('Error sending message: ', error);
//     } else if (response.body.error) {
//         console.log('Error: ', response.body.error);
//     }
//   });
// }
