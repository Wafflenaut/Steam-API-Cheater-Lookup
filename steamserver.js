var express = require('express');
var request = require('request');

var bodyParser = require('body-parser');



var app = express();
app.use('/', express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var apiKey = 'INSERT YOUR STEAM API KEY HERE';

app.get('/get-steamid?:vname', function(req, res){
	var url = 'http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=' + apiKey + '&vanityurl=' + req.query.vname;
	console.log(req.query.vname);
	
	request.get(url, function(error, steamRes, steamRet){
		res.setHeader('Content-Type', 'application/json');
		res.send(steamRet);
	});
});

app.get('/player-lookup?:pid', function(req, res){
	var url = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + apiKey + '&steamids=' + req.query.pid;
	console.log(req.query.pid);
	
	request.get(url, function(error, steamRes, steamRet){
		res.setHeader('Content-Type', 'application/json');
		res.send(steamRet);
	})
});

app.get('/cheater-lookup?:pid', function(req, res){
	
	//url for api request to get a user's friendlist
	var url = 'http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=' + apiKey + '&steamid=' + req.query.pid + '&relationship=friend';

	request.get(url, function(error, steamRes, steamRet){
		var friendString = "";
		var steamResponse = JSON.parse(steamRet);
		
		//adds every player on the queried user's friendlist to a comma separated string
		for(var i = 0; i < steamResponse.friendslist.friends.length; i++){
			friendString += steamResponse.friendslist.friends[i].steamid + ',';
		}
		
		//removes last comma in string
		friendString = friendString.substring(0,friendString.lastIndexOf(','));

		//url to request bans for a list of players
		url = 'http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=' + apiKey + '&steamids=' + friendString;
		
		request.get(url, function(error, banRes, banRet){
			var banResponse = JSON.parse(banRet);
			var banList = "";
			count = 0;

			//checks the list of players for players with bans on their records (up to 100, the max that can be submitted to get user summary)
			for(var i = 0; i < banResponse.players.length && count < 100; i++){
				//if the VACBanned variable is true, the player has been banned before and is added to the list
				if(banResponse.players[i].VACBanned == true){
					banList += banResponse.players[i].SteamId + ',';
					count++;
				}
			}

			//removes last comma in string
			banList = banList.substring(0,banList.lastIndexOf(','));
			//url of all the players with bans on their record to submit for user data
			url = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + apiKey + '&steamids=' + banList;
			
			request.get(url, function(error, banPlayerRes, banPlayerRet){
				res.setHeader('Content-Type', 'application/json');
				res.send(banPlayerRet);
			})
		})	
	})
});

var port = 23236;
var server = app.listen(port);
console.log('Server active on port ' + port);