// lib/webrtcAudio.js

/**
 * Google Meet-grade wideband voice constraints (48kHz mono, echo & noise suppression)
 */
export function getCleanVoiceConstraints(deviceId = '') {
  return {
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48000 },
    sampleSize: { ideal: 16 },
  };
}

/**
 * Tunes WebRTC SDP Opus codec parameters for crisp human speech:
 * - maxaveragebitrate=48000 (high-clarity wideband voice)
 * - usedtx=0 (prevents clipping the start of spoken sentences)
 * - useinbandfec=1 (recovers lost packets smoothly on unstable Wi-Fi)
 */
export function optimizeOpusForVoice(sdp) {
  if (!sdp) return sdp;
  const lines = sdp.split('\r\n');
  let opusPayload = null;

  for (const line of lines) {
    const match = line.match(/^a=rtpmap:(\d+)\s+opus\/48000/i);
    if (match) {
      opusPayload = match[1];
      break;
    }
  }

  if (!opusPayload) return sdp;

  const fmtpPrefix = `a=fmtp:${opusPayload}`;
  let foundFmtp = false;

  const updated = lines.map((line) => {
    if (line.startsWith(fmtpPrefix)) {
      foundFmtp = true;
      let params = line.slice(fmtpPrefix.length).trim();
      const overrides = {
        minptime: '10',
        useinbandfec: '1',
        usedtx: '0',
        maxaveragebitrate: '48000',
        stereo: '0',
        'sprop-stereo': '0',
      };

      for (const [key, val] of Object.entries(overrides)) {
        const regex = new RegExp(`(^|;)\\s*${key}=[^;]*`, 'i');
        if (regex.test(params)) {
          params = params.replace(regex, `$1${key}=${val}`);
        } else {
          params = params ? `${params};${key}=${val}` : `${key}=${val}`;
        }
      }
      return `${fmtpPrefix} ${params}`;
    }
    return line;
  });

  if (!foundFmtp) {
    const rtpIndex = updated.findIndex((l) => l.startsWith(`a=rtpmap:${opusPayload}`));
    if (rtpIndex !== -1) {
      updated.splice(
        rtpIndex + 1,
        0,
        `${fmtpPrefix} minptime=10;useinbandfec=1;usedtx=0;maxaveragebitrate=48000;stereo=0`
      );
    }
  }

  return updated.join('\r\n');
}

/**
 * Plays a gentle diagnostic chime through the selected output speaker
 */
export function playTestChime(sinkId = '') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    if (sinkId && typeof ctx.setSinkId === 'function') {
      ctx.setSinkId(sinkId).catch(() => {});
    }

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.38);
    });
  } catch (e) {
    // Ignore autoplay restriction errors
  }
}