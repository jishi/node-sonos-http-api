function HttpEventServer() {
    let clients = [];

    const removeClient = client => clients = clients.filter(value => value !== client);

    this.addClient = res => clients.push(new HttpEventSource(res, removeClient));

    this.sendEvent = event => clients.forEach(client => client.sendEvent(event))
}

function HttpEventSource(res, done) {
    this.sendEvent = event => res.write('data: ' + event + '\n\n')

    res.on('close', () => done(this))

    res.setHeader('Content-Type', 'text/event-stream');
}

module.exports = HttpEventServer;
