window.game = {};

game.config = "/js/app/config/gameconfig.js";

/**
 * The State of the engine
 * @type {Object}
 */
game.state = {};

/**
 * Initializes the game engine
 * @param  {Function} cb The callback
 */
game.init = function(cb) {
	if(!cb)
		cb = function() {};

	require([
		"/js/app/chat.js",
		"/js/app/invite.js"
		],
		function(chat, invite) {
			game.chat = chat;
			game.invite = invite;
			
			game.chats = {};

			game.socket.on("chat", game.chat.recieveMessage);
			game.socket.on('invite', game.invite.recieveInvite);

			mapi.getCurrentUser(function(user) {
				game.state.user = user;
				
				require([game.config], function(config) {
					game.config = config;

					// Get all the states
					require(_.values(game.config.states), function() {
						game.states = _.object(_.keys(game.config.states), arguments);

						if(window.matchId){
							mapi.joinMatch({
								matchId : matchId
							},function(status) {
								if(status.success){
									game.loadMatch(status.data);
								}
								else
									alert(status.data);
							});
						}
						else if(game.config.startingState)
							game.loadState(game.config.startingState, {}, cb);
						else
							cb();
					});
				});
			});
		}
	);
};

/**
 * Switches to a new State
 * @param  {String}   stateName The name of the state to switch to
 * @param  {Object}   data      The data to pass to the load function of the new state
 * @param  {Function} cb        The callback
 */
game.switchState = function(stateName, data, cb) {
	if(!cb)
		cb = function() {};
	game.unloadCurrentState();
	game.loadState(stateName, data, cb);
};

/**
 * Unloads the current state
 */
game.unloadCurrentState = function() {
	if(game.state.currentState)
		game.state.currentState.unload();
};

game.loadMatch = function(match) {
	switch(match.state){
		case "lobby":
			game.switchState("lobby", match);	
			break;
		case "pieceSelection":
			game.switchState("pieceSelection", match);
			break;
		case "playing":
			game.switchState("match", match);
			break;
	}
};

/**
 * Loads a new State
 * @param  {String}   stateName The name of the state to switch to
 * @param  {Object}   data      The object to pass to the load function of the state
 * @param  {Function} cb        The callback
 */
game.loadState = function(stateName, data, cb) {
	if(!cb)
		cb = function() {};
	game.state.currentState = game.states[stateName];
	game.state.currentState.load(data, cb);
};

/**
 * Recieves a message and forwards it to the states
 * @param  {Object} message The message
 */
game.recieveMessage = function(message) {
	if(game.state.currentState.recieveMessage)
		game.state.currentState.recieveMessage(message);
};

game.unloadPage = function(cb) {

	game.chat.unloadPage(function() {
		if(game.state.currentState.unloadPage)
			game.state.currentState.unloadPage(function() {
				cb();
			});
	});

};

/*****************************************************************************
 * Startup code
 *****************************************************************************/

$(document).ready(function() {

	require.config({
	    urlArgs: "bust=" + (new Date()).getTime(),

    	baseUrl: window.location.origin,
	});

	var host = window.location.origin;

	var socket = io.connect(host);


	socket.on('connect', function() {

		window.game.socket = socket;

		window.createMApi(socket);
		game.init();
		mapi.registerSocket(function(status) {});

	});

	socket.on('message', function(message) {	    
		game.recieveMessage(message);
	});


	window.onbeforeunload = function(e) {
		game.unloadPage(function() {
		 	mapi.deregisterSocket();
		});
	};

});

