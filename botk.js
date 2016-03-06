
// Run your bot from the command line:

 //   token=<MY TOKEN> node demo_bot.js
 //CID: 24596994691.24603105637
 //Client Secret: 1e8a7fbc1d9a8d675d63de45b6a82720
 //my token xoxb-24609891857-0FvhJX9lQEYCWhDp7eCqhTJm
 // clientId=<my client id> clientSecret=<my client secret> port=3000 node slackbutton_bot.js
var Botkit = require('./lib/Botkit.js');

if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}


var controller = Botkit.slackbot({

}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot'],
  }
);

controller.setupWebserver(process.env.port,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});


// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

controller.on('create_bot',function(bot,config) {

  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM(function(err) {

      if (!err) {
        trackBot(bot);
      }

      bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.say('I am a bot that has just joined your team');
          convo.say('You must now /invite me to a channel so that I can be of use!');
        }
      });

    });
  }

});


// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
  console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
  console.log('** The RTM api just closed');
  // you may want to attempt to re-open
});



var Botkit = require('./lib/Botkit.js');
var os = require('os');
var token = "xoxb-24609891857-0FvhJX9lQEYCWhDp7eCqhTJm"

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();


controller.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    },function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(',err);
        }
    });


    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Hello ' + user.name + '!!');
        } else {
            bot.reply(message,'Hello.');
        }
    });
});

controller.hears(['call me (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
    var matches = message.text.match(/call me (.*)/i);
    var name = matches[1];
    controller.storage.users.get(message.user,function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user,function(err, id) {
            bot.reply(message,'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name','who am i'],'direct_message,direct_mention,mention',function(bot, message) {

    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Your name is ' + user.name);
        } else {
            bot.reply(message,'I don\'t know yet!');
        }
    });
});

/*
controller.hears(['shutdown'],'direct_message,direct_mention,mention',function(bot, message) {

    bot.startConversation(message,function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?',[
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    },3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});

*/
controller.hears(['uptime','identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot, message) {

    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name + '>. I have been running for ' + uptime + ' on ' + hostname + '.');

});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}

controller.hears(['.belate'],['direct_message,direct_mention,mention'],function(bot,message) {
  bot.startPrivateConversation(message, askPeriod);
});

askPeriod = function(response, convo) {
  convo.ask("How far back in hours do you want a summary?", function(response, convo) {
    convo.say("Awesome.");
    askGenre(response, convo);
    convo.next();
  });
}
askGenre = function(response, convo) {
  convo.ask("What summary type you want?" + " We offer summaries of 'humor', 'business', 'gossip', 'general'.", function(response, convo) {
    convo.say("Ok.")
    confirmDeliver(response, convo);
    convo.next();
  });
}
confirmDeliver = function(response, convo) { 
  convo.say("Wonderful we will get your belated summary to you!", function(response, convo) {
    convo.stop("Wonderful, we will get that right to you!");
   
    convo.on();
  });
  
  convo.on('end',function(convo) {

	  if (convo.status=='completed') {
	    // do something useful with the users responses
	    var res = convo.extractResponses();

	    // reference a specific response by key
	    var period  = convo.extractResponse('key');
	    var genre  = convo.extractResponse('key');

	    // 

	  } else {
	    // something happened that caused the conversation to stop prematurely
	  }

	});	

//We have this here to send information to our server

// send webhooks
	bot.configureIncomingWebhook({url: webhook_url});
	bot.sendWebhook({
	  text: 'Hey!',
	  channel: '#testing',
	},function(err,res) {
	  // handle error
	});


	// receive outgoing or slash commands
	// if you are already using Express, you can use your own server instance...
	controller.setupWebserver(process.env.port,function(err,webserver) {

	  controller.createWebhookEndpoints(controller.webserver);

	});

	controller.on('slash_command',function(bot,message) {

	  // reply to slash command
	  bot.replyPublic(message,'Everyone can see the results of this slash command');

	});	

//We have this here because if we need to recieve information it is useful




}

