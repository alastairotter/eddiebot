'use strict';

const config = require('./config');
require('./questions');
const express = require('express');
// const crypto = require('crypto');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const apiai = require('apiai');
const apiApp = apiai(config.API_AI_CLIENT_ACCESS_TOKEN);
// const uuid = require('uuid');


console.log(q[curQ].q);


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
        //CHECK FOR PAYLOAD
        else {

          console.log("payload: " + event.postback.payload);

          if(event.postback && event.postback.payload === '@getStarted' )
          {
                  sendGetStartedMessage(event);
          }
          else if(event.postback && event.postback.payload === '@go' )
          {
                  console.log("Got GO message");
                  sendQuestion(event, 0);

          }
          // CAPTURE ANSWERS
          else if(event.postback && event.postback.payload.indexOf("Answer_") >= 0)

            {
              // SPLIT
              var answer = event.postback.payload;
              var answers = answer.split("_");

              var answer = answers[3];
              var question = answers[1];

              checkAnswer(question, answer, event);

            }

            // CAPTURE NAVIGATION
            else if(event.postback && event.postback.payload.indexOf("Navigation_") >= 0)
              {
                var navigation = event.postback.payload;
                navigation = navigation.split("_");

                if(navigation[1] === "tellmore") {
                  var question = +navigation[3];
                  tellMore(question, event);

                }
                else if(navigation[1] === "moveon") {
                  var question = +navigation[3];
                  question++;

                  sendQuestion(event, question);
                }

                console.log(navigation);

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
    sessionId: 'tabby_cat'
  });

  api.on('response', (response) => {



    // if(response.result.action === "help") { console.log("This person needs help"); }

// TESTING GIF
if(response.result.action === "input.unknown") {
  sendConfusedImage(sender);
}

// SEND GREETING MESSAGE
if(response.result.action === "get_started") {
  var handled = true;
  sendGetStartedMessage(event);
}

// if(response.result.action === "move_on") {
//   var handled = true;
//   console.log("Moving on");
//   curQ++;
//   sendQuestion(event);
// }
//
// if(response.result.action === "tell_more") {
//   var handled = true;
//   console.log(response);
//   // console.log("Tell me more");
// }


    // RESPOND TO USER USING API.AI RESPONSE IF NOT ALREADY HANDLED
    if(!handled) {
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

  }



  var handled = false;


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

function sendImage(recipientId, url) {

	var messageDataImage = {
		recipient: {
			id: recipientId
		},
    "message":{
    "attachment":{
      "type":"image",
      "payload":{
        "url": url
      }
    }
  }
	};

	sendApi(messageDataImage);
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

// QUESTIONS
function sendQuestion(event, no) {
  console.log("Question number: " + no);
  console.log(q[1]);

  let recipientId = event.sender.id;

  var messageData = {
    recipient: {
      id: recipientId
    },
    "message":{
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text": q[no].q,
        "buttons":[
          // {
          //   "type":"web_url",
          //   "url":"https://petersapparel.parseapp.com",
          //   "title":"Show Website"
          // },
          {
            "type": "postback",
            "title": q[no].a,
            "payload": "Question_" + no + "_Answer_a"
          },
          {
            "type":"postback",
            "title":q[no].b,
            "payload": "Question_" + no + "_Answer_b"
          },
          {
            "type": "postback",
            "title": q[no].c,
            "payload": "Question_" + no + "_Answer_c"
          }
        ]
      }
    }
  }
  };

  sendApi(messageData);


}


function checkAnswer(question, answer, event) {
  let sender = event.sender.id;

  if(answer === q[question].answer) {
    var text = "👏 🎉 Awesome! That's right. " + q[question].more;
  }
  else {
    var text = "😞 Sorry, that's not right." + q[question].more;
  }


  var messageData = {
  		recipient: {
  			id: sender
  		},
      message: {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text": text,
            "buttons":[
              {
                "type": "postback",
                "title": "Tell me more",
                "payload": "Navigation_tellmore_Question_" + question
              },
              {
                "type":"postback",
                "title": "Let's move on",
                "payload": "Navigation_moveon_Question_" + question
              }
            ]
          }
        }
      }
  	};

    sendTypingOn(sender);

    setTimeout( function () {
      sendApi(messageData);


    }, 3000);




}



function tellMore(question, event) {
  let sender = event.sender.id;
  var text = q[question].extra;
  var messageData = {
  		recipient: {
  			id: sender
  		},
      message: {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text": text,
            "buttons":[
              {
                "type":"postback",
                "title": "Okay, let's move on",
                "payload": "Navigation_moveon_Question_" + question
              }
            ]
          }
        }
      }
  	};

    sendTypingOn(sender);

    setTimeout( function () {
      sendApi(messageData);


    }, 3000);




}

// function sendMore(sender) {
//       var messageData = {
//         "recipient":{
//         "id": sender
//       },
//       "message":{
//         "text":"Pick a color:",
//         "quick_replies":[
//           {
//             "content_type":"text",
//             "title":"More",
//             "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
//           },
//           {
//             "content_type":"text",
//             "title":"Next",
//             "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
//           }
//         ]
//       }
//     }
//
//     sendApi(messageData);
//
// }
