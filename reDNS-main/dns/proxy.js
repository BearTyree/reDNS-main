const net = require('net');
const dns = require('./resolve.js');

// Proxy code taken from https://github.com/nimit95/Forward-Proxy/blob/master/server.js

const server = net.createServer();

server.on('connection', async (clientToProxySocket) => {
  console.log('Client Connected To Proxy');
  // We need only the data once, the starting packet
  clientToProxySocket.once('data', async (data) => {
    // If you want to see the packet uncomment below
    // console.log(data.toString());

    let isTLSConnection = data.toString().indexOf('CONNECT') !== -1;

    // By Default port is 80
    let serverPort = 80;
    let serverAddress;
    if (isTLSConnection) {
      // Port changed if connection is TLS
      serverPort = data.toString()
                          .split('CONNECT ')[1].split(' ')[0].split(':')[1];; // (Connect is the escalation to HTTPS, data is encrypted but the host is given)
      serverAddress = data.toString()
                          .split('CONNECT ')[1].split(' ')[0].split(':')[0];
    } else {
      serverAddress = data.toString().split('Host: ')[1].split('\r\n')[0];
    }
    serverAddress = await dns.getIP(serverAddress); // get IP of the domain name thru Sk-rDNS
    console.log(serverAddress); // Log given result

    let proxyToServerSocket = net.createConnection({
      host: serverAddress,
      port: serverPort
    }, () => {
      console.log('PROXY TO SERVER SET UP');
      if (isTLSConnection) {
        clientToProxySocket.write('HTTP/1.1 200 OK\r\n\n'); // Write HTTP headers on successful connection
      } else {
        proxyToServerSocket.write(data);
      }

      clientToProxySocket.pipe(proxyToServerSocket);
      proxyToServerSocket.pipe(clientToProxySocket);

      proxyToServerSocket.on('error', (err) => {
        console.log('PROXY TO SERVER ERROR');
        console.log(err);
      });
      
    });
    clientToProxySocket.on('error', err => {
      console.log('CLIENT TO PROXY ERROR');
      console.log(err);
    });
  });
});

server.on('error', (err) => {
  console.log('SERVER ERROR');
  console.log(err);
  throw err;
});

server.on('close', () => {
  console.log('Client Disconnected');
});

server.listen(8124, () => { // 8124 is the server port, change this value to make sk-rDNS run on a different port, this will often crash if multiple instances are running
  console.log('Server running at http://localhost:' + 8124);
});

