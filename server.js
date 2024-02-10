const express = require('express')
const webserver = express().use((req, res) => res.sendFile('/websocket-client.html', { root: __dirname })).listen(3000, () => console.log(`Listening on ${3000}`))

const { WebSocketServer } = require('ws')
const sockserver = new WebSocketServer({ port: 443 })

/**
 * Elenco dei gruppi di connessione al WS
 * E' un array di oggetti che contiene info sulle connesisoni in atto, come tipologia, lista clients etc etc
 * @param {
 *  leader: string      il client che ha istanziato il gruppo di connessione
 *  type: string        la tipologia di connessione (1t1 o 1tM)
 *  clients: string[]   lista di ID di client connessi
 * }
 */
let connections = [];


/**
 * Listener del SocketServer
 * Ogni volta che stabilisce una nuova connessione, istanzia sull'elemento che si connette:
 *  - Listener "message": listener che ascolta l'arrivo di nuovi messaggi
 *  - Listener "close": listener che ascolta quando l'elemento di disconnette dal SocketServer
 * 
 */
sockserver.on('connection', ws => {

    let id  = _makeID(4);
    ws.id   = id;
    ws.send(JSON.stringify({ action: 'signin_complete', id: id }));

    ws.on('message', data => {

        let message = JSON.parse(data);

        // richiesta di istanziare una connessione 1t1
        if(message.mission == "define_connection_1t1") defineConnection_1t1(ws.id);

        // richiesta di istanziare una connessione 1tM
        if(message.mission == "define_connection_1tM") defineConnection_1tM(ws.id);

        // richiesta di connettersi a un determinato client
        if(message.mission == "ask_for_connection") tryToConnect(ws.id, message.to);

        // richiesta di inoltro messaggio
        if(message.mission == "send_message") sendMessage(message.data, message.to);

        // richiesta di ping
        if(message.mission == "ping") ws.send(JSON.stringify({ action: 'pong' }));
    })


    ws.on('close', () => { cleanConnections(ws.id); })
    ws.onerror = function () { console.log('websocket error')}
})


// Log delle connessioni
setInterval(function(){ console.log(connections); }, 5000);


/**
 * defineConnection_1t1
 * Metodo che istanzia un gruppo di conessione 1 a 1.
 * @param {*} id l'ID del client che chiede l'apertura di un gruppo di connessione
 */
function defineConnection_1t1(id){
    let connection = { leader: id, clients: [id], type: "1t1"}
    connections.push(connection);
}

/**
 * defineConnection_1tM
 * Metodo che istanzia un gruppo di conessione 1 a M.
 * @param {string} id l'ID del client che chiede l'apertura di un gruppo di connessione
 */
function defineConnection_1tM(id){
    let connection = { leader: id, clients: [id], type: "1tM"}
    connections.push(connection);
}

/**
 * tryToConnect
 * Metodo che cerca di aggiungere un client ad un gruppo di connessione.
 * @param {string} id l'ID del client che chiede l'apertura di un gruppo di connessione
 * @param {string} to l'ID del client che ha istanziato il gruppo di connessione 
 */
function tryToConnect(id, to){
    connections.forEach(connection => {
        if(connection.leader == to){
            if(connection.type == "1t1" && connection.clients.length < 2){
                connection.clients.push(id);
                alertClientsAboutConnection(connection);
            } else if(connection.type == "1tM"){
                connection.clients.push(id)
                alertClientsAboutConnection(connection);
            }
        }
    });
}

/**
 * alertClientsAboutConnection
 * Metodo che aggiorna i vari client di un gruppo di connessione in caso di aggiornamento istanza
 * @param {connection} connection istanza di gruppo di connessione
 */
function alertClientsAboutConnection(connection){
    sockserver.clients.forEach(client => {
        if(connection.clients.includes(client.id)){
            client.send(JSON.stringify({action: 'alert_connection_update', yourID: client.id, connection: connection} ));
        }
    })
}

/**
 * cleanConnections
 * Metodo che ripulisce la lista connections a seguito di una disconnessione client
 * @param {*} id ID del client da rimuovere
 */
function cleanConnections(id){
    console.log('Client has disconnected!');
    connections.forEach((connection, index, object) => {
        if(connection.clients.includes(id)){
            if(connection.type == "1t1"){
                connection.clients.splice(index, 1);
                if(connection.clients.length == 0) connections.splice(index, 1);
                alertClientsAboutConnection(connection);
            }
            if(connection.type == "1tM"){
                const thisIndex = connection.clients.indexOf(id);
                connection.clients.splice(thisIndex, 1);
                if(connection.clients.length == 0) connections.splice(index, 1);
                alertClientsAboutConnection(connection);
            }
        }
    });
}


/**
 * sendMessage
 * Metodo che invia un messaggio verso un client
 * @param {*} dataToSend oggetto data da inoltrare al client destinatario
 * @param {*} to ID del client destinatario
 */
function sendMessage(dataToSend, to){
    sockserver.clients.forEach(client => {
        if(to == client.id) client.send(JSON.stringify(dataToSend));
    })
}





/* UTILITY */
/**
 * Metodo che genera un ID randomico
 * @param {*} length lunghezza desiderata della stringa ID
 */
function _makeID(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}