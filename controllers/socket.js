const Room = require('../models/Room.js');
const Utils = require('../utils/StreamUtils');
const LiveStatus = require('../utils/LiveStatus');

module.exports = (io) => {
    function emitListLiveStreamInfo() {
        return Room.find({}, (error, results) => {
            io.emit('list-live-stream', results);
        });
    }

    io.on('connection', (socket) => {
        console.log('New connection');
        /**
         * Get list live stream information
         */
        socket.on('list-live-stream', () => {
            return Room.find({}, (error, results) => {
                socket.emit('list-live-stream', results);
            });
        });
        /**
         * Join live stream room
         */
        socket.on('join-room', (data) => {
            console.log('Join room', data);
            const { userName, roomName } = data;
            if (!userName || !roomName) return;
            socket.join(roomName);
        });

        /**
         * Leave live stream room
         */
        socket.on('leave-room', (data) => {
            console.log('Leave room', data);
            const { userName, roomName } = data;
            if (!userName || !roomName) return;
            socket.leave(roomName);
        });

        /**
         * The host join the room and prepare live stream
         */
        socket.on('prepare-live-stream', (data) => {
            console.log('Prepare live stream', data);
            const { userName, roomName } = data;
            if (!userName || !roomName) return;
            return Room.findOneAndUpdate(
                { userName, roomName },
                { liveStatus: LiveStatus.PREPARE, createdAt: Utils.getCurrentDateTime() },
                { new: true, useFindAndModify: false }
            ).exec((error, foundRoom) => {
                if (error) return;
                if (foundRoom) return emitListLiveStreamInfo();
                const condition = {
                    userName,
                    roomName,
                    liveStatus: LiveStatus.PREPARE,
                };
                return Room.create(condition).then((createdData) => {
                    emitListLiveStreamInfo();
                });
            });
        });

        /**
         * When user begin live stream
         */
        socket.on('begin-live-stream', (data) => {
            console.log('Begin live stream', data);
            const { userName, roomName } = data;
            if (!userName || !roomName) return;
            return Room.findOneAndUpdate(
                { userName, roomName },
                { liveStatus: LiveStatus.ON_LIVE, beginAt: Utils.getCurrentDateTime() },
                { new: true, useFindAndModify: false }
            ).exec((error, foundRoom) => {
                if (error) return;
                if (foundRoom) {
                    io.in(roomName).emit('begin-live-stream', foundRoom);
                    return emitListLiveStreamInfo();
                }
                const condition = {
                    userName,
                    roomName,
                    liveStatus: LiveStatus.ON_LIVE,
                };
                return Room.create(condition).then((createdData) => {
                    io.in(roomName).emit('begin-live-stream', createdData);
                    emitListLiveStreamInfo();
                });
            });
        });

        /**
         * When user finish live stream action
         */
        socket.on('finish-live-stream', (data) => {
            console.log('Finish live stream');
            const { userName, roomName } = data;
            const filePath = Utils.getMp4FilePath();
            if (!userName || !roomName) return;
            return Room.findOneAndUpdate(
                { userName, roomName },
                { liveStatus: LiveStatus.FINISH, filePath },
                { new: true, useFindAndModify: false }
            ).exec((error, updatedData) => {
                if (error) return;
                io.in(roomName).emit('finish-live-stream', updatedData);
                socket.leave(roomName);
                return emitListLiveStreamInfo();
            });
        });

        /**
         * User send message to room
         */
        socket.on('send-message', (data) => {
            console.log('Send message');
            const { roomName = '', message, userName } = data;
            return Room.findOneAndUpdate(
                { roomName },
                {
                    $push: { messages: { message, userName, createdAt: Utils.getCurrentDateTime() } },
                },
                { new: true, useFindAndModify: false },
                (err, result) => {
                    io.in(roomName).emit('send-message', result);
                }
            );
        });

    });
};