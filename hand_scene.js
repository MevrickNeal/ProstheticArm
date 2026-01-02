import * as THREE from 'three'

let serialWriter = null;
let lastCmd = "";

// 1. SERIAL CONNECTION HANDLER
const initSerial = async () => {
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    serialWriter = port.writable.getWriter();
    alert("Robotic Arm Connected!");
  } catch (e) { console.error("Serial error:", e); }
}

const sendToArm = async (cmd) => {
  if (!serialWriter || cmd === lastCmd) return;
  const encoder = new TextEncoder();
  await serialWriter.write(encoder.encode(cmd));
  lastCmd = cmd;
  console.log("Sent:", cmd);
}

// 2. XR8 PIPELINE MODULE
const handScenePipelineModule = () => {
  let handMesh_ = null;

  const init = ({canvas, detail}) => {
    // UI for Connection
    const btn = document.createElement('button');
    btn.innerText = "🔌 Connect Arm (Port 1420)";
    btn.style.cssText = "position:fixed; top:20px; left:20px; z-index:1000; padding:15px; border-radius:10px; background:#00e676; font-weight:bold;";
    btn.onclick = initSerial;
    document.body.appendChild(btn);

    const {scene, camera, renderer} = XR8.Threejs.xrScene();
    // ... [Insert your existing buildHand(detail) logic here] ...
  }

  const show = (event) => {
    const { transform, attachmentPoints } = event.detail;
    
    // Update 3D Mesh (Your existing code)
    // ... 
    
    // GESTURE ANALYSIS
    if (attachmentPoints && attachmentPoints.indexLower && attachmentPoints.thumbLower) {
      const thumb = attachmentPoints.thumbLower.position;
      const index = attachmentPoints.indexLower.position;
      const middle = attachmentPoints.middleLower.position;

      // Calculate Pinch Distance
      const pinchDist = Math.sqrt(
        Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
      );

      // Analyze and Send Commands
      if (pinchDist < 0.07) {
        sendToArm("B"); // Grab
      } else if (pinchDist > 0.15) {
        // Check if Middle finger is extended while others are down
        const isMiddleUp = (middle.y < index.y - 0.05); 
        if (isMiddleUp) sendToArm("C"); 
        else sendToArm("A");
      }
    }
  }

  return {
    name: 'handscene',
    onAttach: init,
    listeners: [
      {event: 'handcontroller.handfound', process: show},
      {event: 'handcontroller.handupdated', process: show},
      {event: 'handcontroller.handlost', process: () => sendToArm("A")},
    ],
  }
}

export {handScenePipelineModule}
