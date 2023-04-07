const { NodeMediaServer } = require('node-media-server');
const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const connectDB = require("./config/db");

const server = http.createServer(app);
/* eslint-disable-next-line */
const io = require('socket.io').listen(server);
require('./controllers/socket')(io);

(async () => await connectDB())();

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(bodyParser.json());
app.set('socketio', io);
app.set('server', server);

server.listen(process.env.PORT ?? 3333, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`listening on port ${process.env.PORT ?? 3333}`);
    }
});

const nodeMediaServerConfig = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
    },
    http: {
        port: 8000,
        allow_origin: '*',
    }
};

const nms = new NodeMediaServer(nodeMediaServerConfig);
nms.run();

// bunch of logs when cetain NMS event gets triggered
nms.on('preConnect', (id, args) => {
    console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('postConnect', (id, args) => {
    console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('doneConnect', (id, args) => {
    console.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('prePublish', (id, StreamPath, args) => {
    console.log(
        '[NodeEvent on prePublish]',
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
});

nms.on('postPublish', (id, StreamPath, args) => {
    console.log(
        '[NodeEvent on postPublish]',
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
});

nms.on('donePublish', (id, StreamPath, args) => {
    console.log(
        '[NodeEvent on donePublish]',
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
});

nms.on('prePlay', (id, StreamPath, args) => {
    console.log(
        '[NodeEvent on prePlay]',
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
});

nms.on('postPlay', (id, StreamPath, args) => {
    console.log(
        '[NodeEvent on postPlay]',
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
});

nms.on('donePlay', (id, StreamPath, args) => {
    console.log(
        '[NodeEvent on donePlay]',
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    );
});