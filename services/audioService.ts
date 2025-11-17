// Base64 decoding function
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Raw PCM to AudioBuffer decoding function
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Singleton AudioContext to avoid creating multiple instances
let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
  }
  return audioContext;
};

let currentNarrationSource: AudioBufferSourceNode | null = null;

// Main function to play narration audio from a base64 string
export const playAudio = (base64Audio: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!base64Audio) {
      resolve();
      return;
    }

    // Stop any currently playing narration
    if (currentNarrationSource) {
      try {
        currentNarrationSource.stop();
        currentNarrationSource.disconnect();
      } catch (e) {
        // This can throw if the source is already stopped, which is fine.
      }
    }

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);

      const source = ctx.createBufferSource();
      currentNarrationSource = source;
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();

      source.onended = () => {
        if (currentNarrationSource === source) {
          currentNarrationSource = null;
        }
        resolve(); // Resolve the promise when playback finishes
      };
    } catch (error) {
      console.error("Failed to play audio:", error);
      currentNarrationSource = null;
      reject(error); // Reject the promise on error
    }
  });
};


// --- Tick Sound Logic ---
const TICK_SOUND_B64 = "UklGRkIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQCAAC7/w==";
let tickAudioBuffer: AudioBuffer | null = null;

// Pre-decode the tick sound for better performance
const prepareTickSound = async () => {
    if (tickAudioBuffer) return;
    try {
        const ctx = getAudioContext();
        const audioBytes = decode(TICK_SOUND_B64);
        // The tick sound has a sample rate of 22050
        const tickContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 22050 });
        tickAudioBuffer = await decodeAudioData(audioBytes, tickContext, 22050, 1);
    } catch (error) {
        console.error("Failed to prepare tick sound:", error);
    }
};
// Call it once to have it ready
prepareTickSound();


export const playTick = async () => {
    if (!tickAudioBuffer) {
        await prepareTickSound();
        if (!tickAudioBuffer) return;
    };
    try {
        // Use a separate context for the tick to not interfere with narration sample rate
        const tickContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 22050 });
         if (tickContext.state === 'suspended') {
            await tickContext.resume();
        }
        const source = tickContext.createBufferSource();
        source.buffer = tickAudioBuffer;
        source.connect(tickContext.destination);
        source.start();
    } catch(e) {
        console.error("Could not play tick sound", e);
    }
};