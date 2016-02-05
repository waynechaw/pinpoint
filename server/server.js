var express = require('express');
var bodyParser = require('body-parser');
var jwt = require('jwt-simple');
var db = require('./db/dbModel');
var controller = require('./controller');
var visitHelper = require('./visit');

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('./public'));

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});
var io = require('socket.io').listen(server);

db.init();

var allUsers = {};
var usersTracker = {};

/* *******  
Login and Signup
   *******
*/

app.post('/login', function (req, res) {
	var username = req.body.username;
	var password = req.body.password;

  controller.authenticateUser(username, password, function(err, match) {
  	if (err) { // err: String describing the error
  		res.status(401).json({error: err});
  	} else {
  		var token = jwt.encode(username, 'secret');
  		res.json({ token: token });	
		}
  });
});

app.post('/signup', function(req, res){
	var username = req.body.username;
	var password = req.body.password;

	var userObj = {
		username: username,
		password: password
	};

	controller.findUser(userObj)
	.then(function(user) {
		if (user) {
			res.status(401).json({error: "user already exists!"});
		} else {
			controller.addUser(userObj);
			var token = jwt.encode(username, 'secret');
  		res.json({token:token})
		}
	});
});

/* ***** 
	Settings
***** */

app.post('/settings', function (req, res) {
	var token = req.headers['x-access-token']; 
	var user = jwt.decode(token, "secret");
	var tag1 = req.body.tag1;
	var tag2 = req.body.tag2;
	var tag3 = req.body.tag3;
	var isBroadcasting = req.body.isBroadcasting;

	controller.findUser({ username: user })
	.then(function(user) {
		var userID = user.id;
		controller.addTag([tag1, tag2, tag3])
		.then(function(results) {
			var tagsArray = results.map(function(tag){
				return tag[0].dataValues.id;
			});
			controller.addTagsUsers(tagsArray, userID)
			res.send("tags added");
		});
	});

	controller.setBroadcast(user, isBroadcasting);
});

app.get('/settings', function (req, res) {
	var token = req.headers['x-access-token']; 
	var user = jwt.decode(token, "secret");

	controller.findSettings(user)
	.then(function(result) {
		res.send(result);
	});
});

/* ***** 
	Stats
***** */

// This is really more of a GET request, but we use POST to send parameters
app.post('/stats', function(req, res){
	var lat = req.body.lat;
	var lon = req.body.lon;
	var tag = req.body.tag;

	controller.visitStats(lat, lon, tag)
	.then(function(result){
		console.log('got POST to /stats:', lat, lon, tag);
		res.json(result);
	});
});


/* ***** 
	Sockets for user geolocation updates
***** */

io.on('connection', function(client) {
	console.log("Client connected!");

	// On initial connection, check for JWT match
	// if match, then allow access to below. If not, then send an error
	client.on("connected", function(data) {
		var username = jwt.decode(data.token, "secret");
		controller.findUser({ username: username })
		.then(function(user) {
			if (user) {
				data.userID = user.id;
				allUsers[data.socketID] = data; 
				usersTracker[data.socketID] = data;
				io.emit('refreshEvent', allUsers);
			} else {
				io.emit('error', 'username not found');
			}
		});
	});

	// client.on("disconnected", function(data) {
	// 	delete usersTracker[data.userID];
	// 	delete allUsers[data.userID];
	// 	io.emit('refreshEvent', allUsers);
	// });

	client.on("update", function(data) {
		var userID = allUsers[data.socketID].userID;
		controller.findUserTags(userID)
		.then(function(tags) {
			data.tags = tags;
			data.userID = userID;
			usersTracker[data.socketID] = data;
			io.emit('refreshEvent', usersTracker);
		});
		
		var previousData = allUsers[data.socketID];
		var distance = visitHelper.getDistance([previousData.latitude, previousData.longitude],[data.latitude, data.longitude]);
		var timeDiff = visitHelper.timeDifference(previousData.time, data.time);
		if (distance >= 10 && timeDiff >= 3){
			previousData.endTime = new Date();
			controller.addVisit(previousData).then(function(obj) {
				controller.addTagsVisits(userID, obj[0].dataValues.id);
			});
			allUsers[data.socketID] = data;
		} else if (distance < 10 && timeDiff < 10){
			allUsers[data.socketID] = previousData;
		} else if (distance > 10 && timeDiff < 10){
			allUsers[data.socketID] = data;
		}
		// controller.getHotSpots("soccer").then(function(data){
		// 	console.log(data);
		// });
	});
});