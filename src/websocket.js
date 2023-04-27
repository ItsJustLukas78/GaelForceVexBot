const WebSocketClient = require('websocket').client;

const client = new WebSocketClient();
client.on('connectFailed', function(error) {
  console.log('Connect Error: ' + error.toString());
});

let WS_connection = null;
client.on('connect', function(connection) {
  console.log('WebSocket Client Connected');
  WS_connection = connection;

  connection.on('error', function(error) {
    console.log("Connection Error: " + error.toString());
  });

  connection.on('close', function() {
    console.log('Connection Closed');
  });

  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      console.log("Received: '" + message.utf8Data + "'");
      if (message.utf8Data === "0") {
        console.log("Received ping from Jaiveer");
      }
    }
  });
});



const startWSConnection = () => {
  client.connect('ws://localhost:4242/');
}

const getWSConnection = () => {
  return WS_connection;
}

module.exports = { getWSConnection, startWSConnection };


