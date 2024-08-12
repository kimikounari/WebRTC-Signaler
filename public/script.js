const socket = io("https://trial-app-comu.onrender.com/video_socket");
const myPeer = new Peer();

const videoWrap = document.getElementById("video-wrap");
const myVideo = document.createElement("video");
myVideo.muted = true;

const peers = {}
let myVideoStream;

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    })
    videoWrap.append(video);
}

const connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream);
    const video = document.createElement("video")
    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream)
    });
    call.on("close", ()=> {
        video.remove();
    })
    peers[userId] = call;
}

navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true,
})
.then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    myPeer.on("call", (call) => {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", userVideoStream => {
            addVideoStream(video, userVideoStream)
        });
        const userId = call.peer
        peers[userId] = call;
    })

    socket.on("user-connected", (userId) => {
    console.log("userId=" + userId);
    connectToNewUser(userId, stream);
    });
}).catch((error) => {
    console.log('getUserMedia error:' + error);
});

socket.on("user-disconnected", (userId) => {
    console.log('userId=' + userId);
    if(peers[userId]) {
        peers[userId].close();
    }
})

myPeer.on("open", (userId) => {
    socket.emit("join-room", ROOM_ID, userId);
})

myPeer.on("disconnected", (userId) => {
    console.log("disconnected=" + userId);
})
const muteUnmute = (e) => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if(enabled) {
        e.classList.add("active");
        myVideoStream.getAudioTracks()[0].enabled = false;
    } else {
        e.classList.remove("active");
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}
const playStop = (e) => {
    console.log("ビデオを止める");
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled) {
        e.classList.add("active");
        myVideoStream.getVideoTracks()[0].enabled = false;
    } else {
        e.classList.remove("active");
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}
const leaveVideo = (e) => {
    socket.disconnect();
    myPeer.disconnect();
    const videos = document.getElementsByTagName("video");
    for (let i = videos.length - 1; i >= 0; --i){
        videos[i].remove();
    }
};
