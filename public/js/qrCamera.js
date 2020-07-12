let stream = null;
const player = document.getElementById("videoPreview");
const selector = document.getElementById("deviceSelector");
// const overlay = document.getElementById("overlay");
let overlay;
let videoDevices = [];
let videoDeviceIndex = -1;

player.addEventListener("playing", ev => {
  const { videoWidth, videoHeight } = ev.target;
  console.log(`started stream size: ${videoWidth} x ${videoHeight}`);
  drawSight();
  startScanning();
});

function populateSelector(items) {
  items.forEach(({ label, deviceId}, index) => {
    const opt = document.createElement("option");
    opt.value = deviceId;
    opt.innerHTML = label;
    selector.appendChild(opt);
  });
  videoDeviceIndex = selector.selectedIndex;
}

function getCurrentDeviceId() {
  return videoDevices[videoDeviceIndex].deviceId;
}

(function setupDeviceSelector(){
  if (videoDevices.length > 0) {
    populateSelector(videoDevices);
    return;
  }

  navigator.mediaDevices.getUserMedia({video: true})
    .then(dummyStream => {
      const dummyVideo = document.createElement("video");
      dummyVideo.srcObject = dummyStream;
      dummyVideo.play();
      dummyVideo.pause();
      // dummyVideo.srcObject = null;
      dummyStream.getVideoTracks().forEach(trk => trk.stop());
    }).then(() => {
      return navigator.mediaDevices.enumerateDevices()
    })
    .then(devices => {
      const vDevices = devices.filter(dev => dev.kind === "videoinput");
      populateSelector(vDevices);
      videoDevices = vDevices;
    })
    .catch(console.error);
})();

function onSelectChanged () {
  const { selectedIndex, options } = this;
  const { value, innerHTML } = options[selectedIndex];
  videoDeviceIndex = selectedIndex;
  console.log({deviceId: value, label: innerHTML, index: selectedIndex});
}

selector.addEventListener("change", onSelectChanged);

function stopCamera() {
  if (stream === null) {
    return;
  }

  player.pause();
  player.srcObject = null;
  let tracks = stream.getVideoTracks();
  tracks.forEach(track => track.stop());
  stream = null;
}

function startCamera() {
  if (stream !== null) {
    console.warn("stop camera first!");
    return;
  }

  const dummyConstraints = {
    video: {
      deviceId: getCurrentDeviceId(),
      width: { ideal: 600},
      height: { ideal: 600}
    }
  }

  console.log("constraints", dummyConstraints);
  navigator.mediaDevices
    .getUserMedia(dummyConstraints).then(mStream => {
      stream = mStream;
      player.srcObject = stream;
    })
    .catch(console.error);
}

function drawSight() {
  const cvs = document.createElement("canvas");
  cvs.width = 600;
  cvs.height = 600;
  cvs.id = "overlay";
  const container = document.getElementById("absContainer");
  container.appendChild(cvs);
  overlay = cvs;

  const ctx = cvs.getContext("2d");
  ctx.fillStyle = "#FFFFFFaa";
  ctx.fillRect(0, 0, 600, 600);
  ctx.clearRect(150, 150, 300, 300);
  ctx.strokeStyle = "#f9ed0299";
  ctx.strokeRect(200, 200, 200, 200);
}

function startScanning() {
  const {deviceId} = videoDevices[videoDeviceIndex];
  const codeReader = new ZXing.BrowserQRCodeReader();

  codeReader
    .decodeFromInputVideoDeviceContinuously(deviceId, void 0, (result, err) => {
      if (err) {
        if (err instanceof ZXing.NotFoundException) {
          // console.log('No QR code found.')
        } else if (err instanceof ZXing.ChecksumException) {
          console.log('A code was found, but it\'s read value was not valid.')
        } else if (err instanceof ZXing.FormatException) {
          console.log('A code was found, but it was in a invalid format.')
        } else {
          console.error("reader error", err);
        }
        return;
      }

      if (result) {
        console.log("found: ", result.text);
      }
    })
}