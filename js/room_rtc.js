//Agora sdk 사용

const APP_ID = "c9865b862f48484785f48005208ddb45"

//세션을 받아서 생성 
let uid = sessionStorage.getItem('uid')
//uid가 없으면 생성
if(!uid){
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid', uid)
}
//나중에 실제로 토큰 써야할 거임 => 그 방식으로 변경 하셈
let token = null;
let client;

let rtmClient;
let channel;

//url로 이동해서 방의 이름을 얻는다
//room.html?room=234
const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

//방이 없으면 원래는 돌려보내던가 해야댐
if(!roomId){
    roomId = 'main'
}

//Redirect
let displayName = sessionStorage.getItem('display_name')
if(!displayName){
    window.location = 'index.html'
}

let localTracks = []
let remoteUsers = {}

let localScreenTracks;
let sharingScreen = false;

//Join Room Init
let joinRoomInit = async () => {

    rtmClient = await AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({uid,token})

    await rtmClient.addOrUpdateLocalUserAttributes({'name':displayName})

    channel = await rtmClient.createChannel(roomId)
    await channel.join()

    channel.on('MemberJoined', handleMemberJoined)
    channel.on('MemberLeft', handleMemberLeft)
    channel.on('ChannelMessage', handleChannelMessage)

    getMembers()
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`)

    //agora client 생성
    client = AgoraRTC.createClient({mode:'rtc', codec:'h264'})
    //appid, channel 이름, 토큰, uid로 입장
    await client.join(APP_ID, roomId, token, uid)

    //publush 될때다마다 listner
    client.on('user-published', handleUserPublished)
    client.on('user-left', handleUserLeft)
}

//join 후 stream 공유 
let joinStream = async () => {
    document.getElementById('join-btn').style.display = 'none'
    document.getElementsByClassName('stream__actions')[0].style.display = 'flex'

    //오디오랑 비디오 액세스를 허용할 건지 체크 하는 곳(권한 요청)
    //해상도 640x480 ~ 1920x1080
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {encoderConfig:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080}
    }})

    //참여하면 비디오 스트림을 추가함
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`

    //stream__container에 위에서 만든 html을 삽입한다 
    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)    
    //추가한 html에 expandVideoFrame을 클릭 이벤트로 등록
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)
    //0 오디오 1 비디오 => 비디오 재생해라
    localTracks[1].play(`user-${uid}`)
    //모든 사용자들에게 내 오디오, 비디오 publish 진행
    await client.publish([localTracks[0], localTracks[1]])
}

let switchToCamera = async () => {
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`
    displayFrame.insertAdjacentHTML('beforeend', player)

    await localTracks[0].setMuted(true)
    await localTracks[1].setMuted(true)

    document.getElementById('mic-btn').classList.remove('active')
    document.getElementById('screen-btn').classList.remove('active')

    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[1]])
}

let handleUserPublished = async (user, mediaType) => {
    remoteUsers[user.uid] = user
    //다른 유저의 media를 구독 
    await client.subscribe(user, mediaType)
    //다른 유저의 화면을 가져와서 출력
    let player = document.getElementById(`user-container-${user.uid}`)
    if(player === null){
        player = `<div class="video__container" id="user-container-${user.uid}">
                <div class="video-player" id="user-${user.uid}"></div>
            </div>`
        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame)   
    }
    //사용자들을 표시하는 위치
    if(displayFrame.style.display){
        let videoFrame = document.getElementById(`user-container-${user.uid}`)
        videoFrame.style.height = '100px'
        videoFrame.style.width = '100px'
    }
    //다른 유저의 video 실행
    if(mediaType === 'video'){
        user.videoTrack.play(`user-${user.uid}`)
    }
    //다른 유저의 audio 실행
    if(mediaType === 'audio'){
        user.audioTrack.play()
    }

}

//유저가 방에서 나갈때
let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    let item = document.getElementById(`user-container-${user.uid}`)
    if(item){
        item.remove()
    }

    //나가고 나면 
    if(userIdInDisplayFrame === `user-container-${user.uid}`){
        displayFrame.style.display = null
        
        let videoFrames = document.getElementsByClassName('video__container')
        //확장된거 원래대로
        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }
}

let toggleMic = async (e) => {
    let button = e.currentTarget

    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[0].setMuted(true)
        button.classList.remove('active')
    }
}

let toggleCamera = async (e) => {
    let button = e.currentTarget

    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[1].setMuted(true)
        button.classList.remove('active')
    }
}

let toggleScreen = async (e) => {
    let screenButton = e.currentTarget
    let cameraButton = document.getElementById('camera-btn')

    if(!sharingScreen){
        sharingScreen = true

        screenButton.classList.add('active')
        cameraButton.classList.remove('active')
        cameraButton.style.display = 'none'

        localScreenTracks = await AgoraRTC.createScreenVideoTrack()

        document.getElementById(`user-container-${uid}`).remove()
        displayFrame.style.display = 'block'

        let player = `<div class="video__container" id="user-container-${uid}">
                <div class="video-player" id="user-${uid}"></div>
            </div>`

        displayFrame.insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)

        userIdInDisplayFrame = `user-container-${uid}`
        localScreenTracks.play(`user-${uid}`)

        //현재 보여주던 카메라 비디오를 송출 종료
        await client.unpublish([localTracks[1]])
        //그대신 화면 비디오를 송출 시작
        await client.publish([localScreenTracks])

        let videoFrames = document.getElementsByClassName('video__container')
        for(let i = 0; videoFrames.length > i; i++){
            if(videoFrames[i].id != userIdInDisplayFrame){
              videoFrames[i].style.height = '100px'
              videoFrames[i].style.width = '100px'
            }
          }


    }else{
        sharingScreen = false 
        cameraButton.style.display = 'block'
        document.getElementById(`user-container-${uid}`).remove()
        await client.unpublish([localScreenTracks])

        switchToCamera()
    }
}

let leaveStream = async (e) => {
    e.preventDefault()

    document.getElementById('join-btn').style.display = 'block'
    document.getElementsByClassName('stream__actions')[0].style.display = 'none'

    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.unpublish([localTracks[0], localTracks[1]])

    if(localScreenTracks){
        await client.unpublish([localScreenTracks])
    }

    document.getElementById(`user-container-${uid}`).remove()

    if(userIdInDisplayFrame === `user-container-${uid}`){
        displayFrame.style.display = null

        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }

    channel.sendMessage({text:JSON.stringify({'type':'user_left', 'uid':uid})})
    window.location = 'index.html';
}



document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('screen-btn').addEventListener('click', toggleScreen)
document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveStream)


joinRoomInit()
