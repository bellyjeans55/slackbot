if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var phone_data; // Filled with username:number pairs from JSON store.

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var accountSid = process.env.accountsid;
var authToken = process.env.authtoken;

var client = require('twilio')(accountSid, authToken);

var controller = Botkit.slackbot({
    debug: false,
    json_file_store: '/root/botkit/store/db.json'
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

controller.storage.teams.get("Phone Numbers", function(err, team_data){
    phone_data = team_data;
});

/*
 * Bug in botkit causes illegal argument exception.
 * When that gets fixed, these methods are much cleaner than controller.on()
 *
controller.hears(['(.*) requested by (.*).'], 'ambient,bot_message', function(bot,message) {
    movie = message.match[1];
    requester = message.match[2];
    
    controller.storage.teams.save({id: movie, user:requester},function(err){});
});

controller.hears(['(.*) was recently added to Plex.'], 'ambient,bot_message', function(bot,message) {
    movie = message.match[1];
    controller.storage.teams.get(movie, function(err, team_data){
        bot.api.users.list({},function(err,response) {
            if (team_data) {
                client.messages.create({
                    to: phones[team_data.user],
                    from: phones[team_data.slackbot],
                    body: team_data.id+" is ready for you to watch.",
                }, function(err, message) {
                    console.log(message.sid);
                });
                controller.storage.teams.delete({id:team_data.id}, function(err,all_team_data){});    
            }
        });
    });
});
*/

controller.on('ambient,bot_message',function(bot,message) {
    var re_request = new RegExp("(.*) requested by (.*).");
    var re_added = new RegExp("(.*) was recently added to Plex.");
    if (re_request.test(message.text)) {
        matches = re_request.exec(message.text);
        movie = matches[1];
        requester = matches[2];
        controller.storage.teams.save({id: movie, user:requester},function(err){});
    }
    else if (re_added.test(message.text)) {
        matches = re_added.exec(message.text);
        movie = matches[1];
        controller.storage.teams.get(movie, function(err, team_data){
            bot.api.users.list({},function(err,response) {
                if (team_data) {
                    client.messages.create({
                        to: phone_data[team_data.user],
                        from: phone_data["slackbot"],
                        body: team_data.id+" is ready for you to watch.",
                    }, function(err, message) {
                        console.log(message.sid);
                    });
                    controller.storage.teams.delete({id:team_data.id}, function(err,all_team_data){});    
                }
            });
        });
    }
});
