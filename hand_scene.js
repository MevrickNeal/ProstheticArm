// Aesthetic Settings
const DOT_SIZE = 2; // Much smaller
const LINE_WIDTH = 1.5;
const ACTIVE_COLOR = '#00e676'; // Neon Medical Green

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw the video frame (mirror it for natural feel)
  canvasCtx.translate(canvasElement.width, 0);
  canvasCtx.scale(-1, 1);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      
      // 1. AESTHETIC DRAWING (Clean & Minimal)
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, 
        {color: 'rgba(0, 230, 118, 0.4)', lineWidth: LINE_WIDTH});
      drawLandmarks(canvasCtx, landmarks, 
        {color: ACTIVE_COLOR, lineWidth: 0, radius: DOT_SIZE});

      // 2. INDIVIDUAL FINGER MAPPING
      // Index for fingers: 4=Thumb, 8=Index, 12=Middle, 16=Ring, 20=Pinky
      const wrist = landmarks[0];
      const fingerTips = [16, 20, 4, 12, 8]; // Mapping to Channels: 2, 3, 4, 5, 6
      const channelNames = ["Ring", "Pinky", "Thumb", "Middle", "Index"];

      fingerTips.forEach((tipIndex, i) => {
        const tip = landmarks[tipIndex];
        
        // Calculate 2D distance from Wrist to Tip
        const dist = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
        
        // CALIBRATION: Adjust these thresholds (0.12 and 0.28) based on your camera distance
        let servoPulse = 450; // Default Open
        if (dist < 0.22) servoPulse = 60; // Close if finger is curled toward wrist

        // Only send if it's a specific finger movement
        const channel = i + 2; // Starts at Channel 2
        sendIndividualFinger(channel, servoPulse);
      });
    }
  }
  canvasCtx.restore();
}

// Throttled Sender to prevent Arduino crashing
let lastFingerStates = {};
async function sendIndividualFinger(chan, pulse) {
  if (serialWriter && lastFingerStates[chan] !== pulse) {
    const now = Date.now();
    if (now - lastSent > 40) { // 25 commands per second max
      const cmd = `C${chan},${pulse}`;
      await serialWriter.write(new TextEncoder().encode(cmd));
      lastFingerStates[chan] = pulse;
      lastSent = now;
      console.log("Mapping:", cmd);
    }
  }
}
