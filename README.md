# simple-socket-server
Server Socket basico basato su socket.io.

## Installazione
Dopo aver scaricato la repo, lanciare il comando di installazione.
```bash
npm install
```
## Startup
Una volta che l'installazione dei pacchetti è ultimata, per lanciare il server usare il comando:
```bash
node server.js
```
## Idea di base
Il funzionamento è molto basico e si basa su un paio di semplici concetti:

- Il server può gestire molteplici connessioni simultaneamente, creando gruppi di connessione fra client.
- Ogni gruppo di connessione ha un leader, ovvero il client che ha istanziato il gruppo, una tipologia (1 a 1 o 1 a molti) e un'array di client connessi tra loro (leader incluso).
- Il linguaggio di comunicazione tra client e server è definito tramite un set ristretto di missioni, che il server interpreta al fine di svolgere operazioni. La lista di queste missioni è illustrata nella sezioni seguenti.
- Quando il server riceve una missione, in alcune situazioni può inoltrare un nuovo messaggio verso uno o più client: i client possono capire che tipologia di messaggio sia dalla proprietà "azione". La lista di queste azioni predefinite è illustrata nelle sezioni seguenti.


## Esempio di funzionamento
### Connessione di un client al server
```javascript
const webSocket = new WebSocket('ws://[HOST-NAME]:443/');
```
### Creazione di un gruppo di connessione
```javascript
webSocket.send(JSON.stringify({ mission: "define_connection_1tM" }));
```
### Richiesta di ingresso a gruppo di connessione
```javascript
webSocket.send(JSON.stringify({ mission: "ask_for_connection", to: '[ID CLIENT LEADER]' }));
```
### Invio di un messaggio da un client all'altro
```javascript
webSocket.send(JSON.stringify({ 
    mission: "send_message", 
    to: '[ID CLIENT DESIDERATO]',
    data: { 
        action: 'move_pointer', 
        data: {...} 
    }
}));
```
## Lista Missioni
Elenco delle missioni interpretate dal server e relativa documentazione a riguardo.
| Nome missione | Parametri | Esempio invio da client |
|---|---|---|
| define_connection_1t1 | - | {mission: "define_connection_1t1"} |
| define_connection_1tM | - | {mission: "define_connection_1tM"} |
| ask_for_connection | to: string = ID del client leader | {mission: "ask_for_connection", to: ID_LEADER} |
| send_message | to: string = ID del client destinatario<br>data: any = Qualsiasi cosa gestibile da un altro client | {mission: "send_message", to: ID_CLIENT, data: DATA} |
| ping | - | {mission: "ping"} |

## Lista Azioni
Quando il server riceve delle missioni, in alcune situazioni invia un messaggio di azione ad uno o più client.
| Nome missione | Azione eseguita | Parametri |
|---|---|---|
| OPEN CONNECTION | Invio di un azione di tipo "signin_complete" verso il client appena connesso | id: string = ID assegnato al client |
| "ask_for_connection" | Invio di un azione di tipo "alert_connection_update" verso tutti i client di un gruppo di connessione | yourID: string = ID del client<br>connection: Object = info sul gruppo di connessione |
| "send_message" | Inoltro dell'oggetto data verso il client destinatario. L'action è stabilita dal client mittente e dunque il server inoltra semplicemente il messaggio | - |
| "ping" | Invio di un azione di tipo "pong" verso il client che ha inviato la missione | - |
