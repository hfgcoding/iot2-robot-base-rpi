//Requires
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

//DONTCHANGEME - AWS-Serververbindung via SSH Tunnel
var socket = require('socket.io-client')('http://localhost:5000');
require('dotenv').config({ path: '/home/pi/ROBO_CONFIG.cfg' })

//Setup Serialport START
//CHANGEME - Serieller Port zu Arduino
const port = new SerialPort("/dev/ttyAMA0", {
	baudRate: 9600
})
console.log("Port init");

const parser = new Readline()
port.pipe(parser)
//Setup Serialport ENDE

//Variablen
let lastdata = "";
let isConnected = false;

//eigener "Raumname" ist aus Robotername und "_control zusammengesetzt"
const ownRoom = process.env.ROBOTNAME + "_control";

//Socket.io Handling - das ist der Kern!
socket.on('connect', function () {

	console.log("Connected to Master");
	isConnected = true;

	// Verbunden, registiere für jeweiligen Bot-"Raum"
	socket.emit('register_bot', {
		room: ownRoom,
		port: process.env.CAMPORT
	});

	// Eingehende Serialevents an zentralen SIO Server senden (für Debugging etc.)
	parser.on('data', line => {
		//console.log(`> ${line}`);
		if (line != lastData) {
			socket.to(ownRoom).emit("serialresponse", line);
			lastData = line;
		}
	})

	// Eingehende SIO Events an serialport via Arduino weiterleiten
	socket.on('serialevent', function (data) {
		port.write(data.toString())
		console.log("Wrote " + data);
	});

	// CHANGEME - Hier könnte eure eigene Logik stehen, nur ein Beispiel ----------
	//

	socket.on("preset", function(data) {
		console.log("Preset "+data);
		port.write("presetAnArduino "+data);
	})

	socket.on("kommando2", function(data) {
		port.write("k2AnArduino");
	})

	//
	// Beispiel Ende --------------------------------------------------------------

	//Verbindungsabbruch handhaben
	socket.on('disconnect', function () {
		isConnected = false;
		console.log("Disconnected");
	});
});
