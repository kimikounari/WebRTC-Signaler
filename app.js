const express = require('express');
const app = express();
var http = require('http').Server(app);
var http2 = require('http').Server(app);
const { ExpressPeerServer } = require('peer');
const { Server } = require('socket.io');
const peerServer = ExpressPeerServer(http, {
  debug: true,
});
let connectedUsers = []; // 接続されている全ユーザーの情報を格納する配列
const cors = require("cors");
require('dotenv').config();

app.use(cors({
  origin: process.env.CORS_ORIGIN
  //'https://comunity-app-front.web.app/',//本番用コード
}));

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use('/peerjs', peerServer);
app.get("/", (req, res) => {
  res.render("room")
});

const io = new Server(http
  , {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

const chat_socket = io.of('/chat');
const video_socket = io.of('/video_socket');//追加
const audio_chat_socket = io.of('/audio_chat_socket');
const video_chat_socket = io.of('/video_chat_socket');

chat_socket.on('connection', (socket) => {
  socket.emit('allUsersInfo', Object.values(connectedUsers));
  //ユーザー同士でデータの交換
  socket.on('userInfo', (userInfo) => {
    // ユーザー情報を保存
    connectedUsers[socket.id] = userInfo;
    console.log('Updated connected users:', connectedUsers); // ログ出力
    // 新しいユーザー情報を全クライアントにブロードキャスト
    chat_socket.emit('allUsersInfo', Object.values(connectedUsers));
  });
  socket.on('chatMessage', (message) => {
    chat_socket.emit('chatMessage', message);
  });
  socket.on("join-room", (ROOM_ID, userId) => {
    socket.join(ROOM_ID)
    socket.to(ROOM_ID).emit("user-connected", userId)
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.rooms.forEach((ROOM_ID) => {
      socket.to(ROOM_ID).emit("user-disconnected", socket.id);
    });
    // connectedUsersからユーザーを削除し、更新情報をブロードキャスト
    delete connectedUsers[socket.id];
    chat_socket.emit('allUsersInfo', Object.values(connectedUsers));
  });
});

audio_chat_socket.on("connection", socket => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId)
    })
  })
})

video_chat_socket.on("connection", socket => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId)
    })
  })
})

video_socket.on("connection", socket => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId)
    })
  })
})


http.listen(process.env.PORT || 3000, function () {
  console.log('listening on *:3000');
});
