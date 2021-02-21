let stream = null;
const player = document.getElementById("video");
const selector = document.getElementById("deviceSelector");
let videoDevices = [];
let videoDeviceIndex = -1;

player.addEventListener("playing", ev => {
  const { videoWidth, videoHeight } = ev.target;
  logToPre("dimensions", `${videoWidth} x ${videoHeight}`);
})

function populateSelector(items) {
  items.forEach(({ label, deviceId }) => {
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

(async function setupDeviceSelector() {
  if (videoDevices.length > 0) {
    populateSelector(videoDevices);
    return;
  }

  try {
    const dummyStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const dummyVideo = document.createElement("video");
    dummyVideo.srcObject = dummyStream;
    await dummyVideo.play();
    dummyStream.getVideoTracks().forEach(trk => trk.stop());
    dummyVideo.srcObject = null;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const vDevices = devices.filter(dev => dev.kind === "videoinput");
    populateSelector(vDevices);
    videoDevices = vDevices;
  } catch (e) {
    console.error(e);
  }
})();

function onSelectChanged() {
  const { selectedIndex, options } = this;
  const { value, innerHTML } = options[selectedIndex];
  videoDeviceIndex = selectedIndex;
  console.log({ deviceId: value, label: innerHTML, index: selectedIndex });
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

  const outputNodes = document.querySelectorAll("pre.output");
  [...outputNodes].forEach(node => {
    logToPre(node.id, "");
  })
}

function startCamera() {
  if (stream !== null) {
    console.warn("stop camera first!");
    return;
  }

  const dummyConstraints = {
    video: {
      deviceId: getCurrentDeviceId()
    }
  }

  const { width, height, aspect, aSampleRate } = getFormData();
  if (width.value > 0) {
    dummyConstraints.video['width'] = { [width.modifier]: width.value };
  }
  if (height.value > 0) {
    dummyConstraints.video['height'] = { [height.modifier]: height.value };
  }
  if (aspect.value > 0) {
    dummyConstraints.video['aspectRatio'] = { [aspect.modifier]: aspect.value };
  }
  if (aSampleRate.value > 0) {
    dummyConstraints['audio'] = {};
    dummyConstraints['audio']['sampleRate'] = { [aSampleRate.modifier]: aSampleRate.value };
  }

  console.log("constraints", dummyConstraints);
  navigator.mediaDevices
    .getUserMedia(dummyConstraints).then(mStream => {
      stream = mStream;
      player.srcObject = stream;
    })
    .then(() => {
      logTrackSettings();
    })
    .catch(console.error);
}

function getParamModifier(paramName) {
  const id = `${paramName}Selector`;
  const { options, selectedIndex } = document.getElementById(id);
  return options[selectedIndex].value;
}

function getFormData() {
  return ["widthIn", "heightIn", "aspectIn", "aSampleRateIn"].reduce((sum, id) => {
    const modifier = getParamModifier(id);
    const inputValue = document.getElementById(id).value;
    const parsedValue = parseInt(inputValue);
    const key = id.split("I")[0];
    sum[key] = { value: parsedValue, modifier };
    return sum;
  }, {});
}

function logToPre(id, msg) {
  const elem = document.getElementById(id);
  elem.innerText = msg;
  elem.parentElement.open = (msg.length > 0);
}

function logObjectToPre(id, obj) {
  logToPre(id, JSON.stringify(obj, null, 2));
}

function logTrackSettings() {
  if (stream === null) {
    console.warn("can't get track settings, stream is null");
    return;
  }

  const vTrack = stream.getVideoTracks()[0];

  const vSettings = vTrack.getSettings();
  logObjectToPre("v-settings", vSettings);

  const vConstraints = vTrack.getConstraints();
  logObjectToPre("v-constraints", vConstraints);

  if (vTrack.getCapabilities) {
    const vCaps = vTrack.getCapabilities();
    logObjectToPre("v-caps", vCaps);
  }

  let aTrack = void 0;
  if (stream.getAudioTracks) {
    aTrack = stream.getAudioTracks()[0];
  }
  if (!aTrack) {
    return;
  }

  const aSettings = aTrack.getSettings();
  logObjectToPre("a-settings", aSettings);

  const aConstraints = aTrack.getConstraints();
  logObjectToPre("a-constraints", aConstraints);

  if (aTrack.getCapabilities) {
    const aCaps = aTrack.getCapabilities();
    logObjectToPre("a-caps", aCaps);
  }
}