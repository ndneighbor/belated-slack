
// Run your bot from the command line:
//// clientId=24596994691.24603105637 clientSecret=1e8a7fbc1d9a8d675d63de45b6a82720 port=$PORT ip=$IP nodemon bot.js


/* Uses the slack button feature to offer a real time bot to multiple teams */
var Botkit = require('./lib/Botkit.js');

if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}


var controller = Botkit.slackbot({
  json_file_store: './db_slackbutton_bot/',
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot','channels:history','channels:write'],
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

controller.hears('hello','direct_message',function(bot,message) {
  bot.reply(message,'Hello!');
});

controller.hears('^stop','direct_message',function(bot,message) {
  bot.reply(message,'Goodbye');
  bot.rtm.close();
});


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
  var options = {
      host: 'belated-runner.herokuapp.com',
      port: '80',
      path: '/angeloisgay',
      method: 'GET',
      
  }
  
  var request = http.request(options, function(res) {
      res.setEncoding('utf8')
      res.on('data', function (chunk) {
      console.log('Responce: ' + chunk);
          bot.startPrivateConversation(chunk,function(){
          })
      })
  })
  
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
	    var req = convo.extractResponses();

	    // reference a specific response by key
	    var period  = convo.extractResponse('key');
	    var genre  = convo.extractResponse('key');

	    // 

	  } else {
	    // something happened that caused the conversation to stop prematurely
	  }

	});	

controller.on(['direct_message','mention','direct_mention'],function(bot,message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  },function(err) {
    if (err) { console.log(err) }
    bot.reply(message,'I heard you loud and clear boss.');
  });
});

controller.storage.teams.all(function(err,teams) {

  if (err) {
    throw new Error(err);
  }

  // connect all teams with bots up to slack!
  for (var t  in teams) {
    if (teams[t].bot) {
      var bot = controller.spawn(teams[t]).startRTM(function(err) {
        if (err) {
          console.log('Error connecting bot to Slack:',err);
        } else {
          trackBot(bot);
        }
      });
    }
  }

});

} //THIS IS IMPORTANT DONT DELETE