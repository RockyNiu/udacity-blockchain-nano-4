
import http from 'http';
import app from './server';

const server = http.createServer(app);
const currentApp = app;
server.listen(3000);

if (module.hot) {
    module.hot.accept('./server', () => {
        server.removeListener('request', currentApp);
        server.on('request', app);
        currentApp = app;
    });
}
