var socket = io();

socket.on('err', (msg) => {
    console.error(msg);
});

var sessionID = "";
var joinedSession = false;

socket.on('session joined', (msg) => {
    joinedSession = msg;
    console.log("Joined room");
    document.getElementById('join-session').style.display = "none";
    document.getElementById('join-players').style.display = "block";
});

function joinSession(roomCode) {
    let onlyNumbers = /^[0-9]*$/;
    let match = roomCode.match(onlyNumbers);
    if (roomCode.length > 0 && match !== null && match[0].length > 0) {
        console.log("Attepting to join room");
        socket.emit('session id', roomCode);
    } else {
        console.error("Invalid room code");
    }
}

function joinPlayers() {
    let count = document.getElementById("player-count").value;
    let prefix = document.getElementById("player-prefix").value;
    let suffix = document.getElementById("player-suffix").value;
    let spaceChar = document.getElementById("player-space-chars").value;
    let onlyNumbers = /^[0-9]*$/;
    let match = count.match(onlyNumbers);
    if (count.length > 0 && match !== null && match[0].length > 0 && parseInt(count) > 0 && parseInt(count) <= 100) {
        if (count.length + prefix.length + suffix.length + spaceChar.length*count.length <= 15) {
            playersJoining = true;
            socket.emit('join players', {
                count: Number.parseInt(count),
                prefix: prefix,
                suffix: suffix,
                spaceChar: spaceChar
            });
        }
    } else {
        console.error("Invalid Count")
    }
}

var playersJoining = false;
var playersJoined = false;

socket.on('players joined', (msg) => {
    if (!msg) {
        console.error("Error joining players");
    } else {
        console.log("Players joined");
        playersJoined = true;
        document.getElementById("join-players").style.display = "none";
        document.getElementById("answer").style.display = "block";
    }
    playersJoining = false;
});