//메세지에 스크롤바 기능
let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;
//응답 토글? 
const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');
//채팅 컨테이너 => 열고 닫고 
const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

let activeMemberContainer = false;

memberButton.addEventListener('click', () => {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  activeMemberContainer = !activeMemberContainer;
});

let activeChatContainer = false;

chatButton.addEventListener('click', () => {
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }

  activeChatContainer = !activeChatContainer;
});

let displayFrame = document.getElementById('stream__box')
let videoFrames = document.getElementsByClassName('video__container')
let userIdInDisplayFrame = null;

//Click시 비디오 프레임 확장되는 함수
let expandVideoFrame = (e) => {

  //새로 생성되는 비디오에도 적용되도록
  let child = displayFrame.children[0]
  if(child){
      document.getElementById('streams__container').appendChild(child)
  }

  //메인 스트림 박스 => 클릭 될때마다 순서를 변경
  displayFrame.style.display = 'block'
  displayFrame.appendChild(e.currentTarget)
  userIdInDisplayFrame = e.currentTarget.id

  for(let i = 0; videoFrames.length > i; i++){
    if(videoFrames[i].id != userIdInDisplayFrame){
      videoFrames[i].style.height = '100px'
      videoFrames[i].style.width = '100px'
    }
  }

}

for(let i = 0; videoFrames.length > i; i++){
  videoFrames[i].addEventListener('click', expandVideoFrame)
}


let hideDisplayFrame = () => {
    userIdInDisplayFrame = null
    displayFrame.style.display = null

    let child = displayFrame.children[0]
    document.getElementById('streams__container').appendChild(child)

    for(let i = 0; videoFrames.length > i; i++){
      videoFrames[i].style.height = '300px'
      videoFrames[i].style.width = '300px'
  }
}

displayFrame.addEventListener('click', hideDisplayFrame)