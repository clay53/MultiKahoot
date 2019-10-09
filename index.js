const express = require('express');
const http = require('http');
const sio = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = sio(server);

const kahootAPI = require('kahoot-api');
const Session = kahootAPI.Session;
const Adapters = kahootAPI.Adapters;

const session = new Session(108421);

async function joinPlayers(session, count, prefix="", suffix="", spaceChar="0") {
    return new Promise(async function (resolve, reject) {
        if (prefix.length+suffix.length+(spaceChar.length > 0 ? spaceChar.length : 1)*count.toString().length <= 15) {
            var players = [];
            for (let i = 1; i <= count; i++) {
                let spacer = "";
                let spacerLength = count.toString().length-i.toString().length;
                for (let j = 0; j < spacerLength; j++) {
                    spacer += spaceChar;
                }
                await session.openSocket().then((socket) => {
                    const player = new Adapters.Player(socket); //Create player class
                    player.join(prefix + spacer + i + suffix).then(() => {
                        players.push(player);
                    }).catch((err) => {
                        console.error(err);
                    });
                });
            }
            var check = () => {
                if (players.length === count) {
                    resolve(players);
                } else {
                    setTimeout(check, 1000);
                }
            }
            check();
        } else {
            reject("Name too long");
        }
    });
}

app.get('/w/*', (req, res) => {
	let path = __dirname + req.path;
	//console.log("Sending file: " + req.path);
	res.sendFile(path);
});

app.get('/', (req, res) => {
	res.redirect('/w/index.html');
});

io.on('connect', async (socket) => {
    var session = new Session();
    var players = [];

    console.log(socket.id + ' connected to main');

    socket.on('session id', async (msg) => {
        if (typeof(msg) === "number" || typeof(msg) === "string") {
            if (!session.pin) {
                session.check(msg).then((info) => {
                    session = new Session(msg);
                    socket.emit('session joined', true);
                }).catch((err) => {
                    console.error(err);
                    socket.emit('err', "Failed to join session.");
                });
            } else {
                socket.emit('err', "Already connected to a session");
            }
        } else {
            socket.emit('err', "Message is of wrong type");
        }
    });

    socket.on('join players', async (msg) => {
        if (typeof(msg) === "object") {
            if (session.pin) {
                if (
                    typeof(msg.prefix) === "string" &&
                    typeof(msg.suffix) === "string" &&
                    typeof(msg.spaceChar) === "string" &&
                    typeof(msg.count) === "number" &&
                    msg.count > 0 &&
                    msg.count <= 1000
                ) {
                    playersJoining = true;
                    joinPlayers(session, msg.count, msg.prefix, msg.suffix, msg.spaceChar).then((p) => {
                        players = p;
                        playersJoining = false;
                        socket.emit('players joined', true);
                    }).catch((err) => {
                        console.log(err);
                        playersJoining = false;
                        socket.emit('players joined', false);
                    });
                } else {
                    socket.emit('err', "Bad request");
                } 
            } else {
                socket.emit('err', "Not connected to a session");
            }
        } else {
            socket.emit('err', "Message is of wrong type");
        }
    });

    socket.on('answer', async (msg) => {
        if (
            typeof(msg) === "number" &&
            msg >= 0 &&
            msg < 4
        ) {
            if (session.pin) {
                for (let i in players) {
                    players[i].answer(msg).catch(()=>{});
                }
            } else {
                socket.emit('err', "Not connected to a session");
            }
        } else {
            socket.emit('err', "Bad request");
        }
    });

    socket.on('disconnect', function(){
		console.log(socket.id + ' disconnected from main');
	});
});

server.listen(3000, () => {
	console.log('server started');
});