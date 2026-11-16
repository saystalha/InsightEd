'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
  iceCandidatePoolSize: 10
};

/**
 * Robust WebRTC multi-peer audio, video, and screen sharing hook
 * powered by MongoDB signaling (compatible with Vercel serverless deployments).
 */
export function useClassroomWebRTC({
  sessionId,
  user,
  onChatMessage,
  onPeerJoin,
  onPeerLeave,
  onSessionEnded
}) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // peerId -> MediaStream
  const [peers, setPeers] = useState({}); // peerId -> { id, name, role, camOff, muted, handRaised, isSpeaking }

  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localScreenStream, setLocalScreenStream] = useState(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);
  const [screenSharer, setScreenSharer] = useState(null); // { id, name }

  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Stable persistent peerId for this tab using useState initializer (React 19 pure)
  const [myId] = useState(() => {
    if (user?.id || user?._id) return user.id || user._id;
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`insighted_peer_${sessionId}`);
      if (stored) return stored;
      const gen = 'peer_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      sessionStorage.setItem(`insighted_peer_${sessionId}`, gen);
      return gen;
    }
    return 'peer_client';
  });

  const myName = user?.name || (typeof window !== 'undefined' ? localStorage.getItem('userName') : null) || (user?.role === 'teacher' ? 'Instructor' : 'Student');
  const myRole = user?.role || 'student';

  const callbacksRef = useRef({ onChatMessage, onPeerJoin, onPeerLeave, onSessionEnded });
  const myInfoRef = useRef({ id: myId, name: myName, role: myRole });
  const peersRef = useRef(peers);

  // Synchronize refs inside useEffect (React 19 compliant)
  useEffect(() => {
    callbacksRef.current = { onChatMessage, onPeerJoin, onPeerLeave, onSessionEnded };
    myInfoRef.current = { id: myId, name: myName, role: myRole };
    peersRef.current = peers;
  }, [onChatMessage, onPeerJoin, onPeerLeave, onSessionEnded, myId, myName, myRole, peers]);

  const pcsRef = useRef({});
  const screenPcsRef = useRef({});
  const iceCandidatesQueueRef = useRef({});
  const screenIceQueueRef = useRef({});

  const localStreamRef = useRef(null);
  const localScreenStreamRef = useRef(null);
  const lastSignalTimeRef = useRef(0);
  const processedSignalIdsRef = useRef(new Set());

  // Helper to send signals via POST
  const sendSignal = useCallback(async (type, data = {}, to = 'all') => {
    if (!sessionId || !myId) return;
    try {
      await fetch(`/api/classroom/${sessionId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: myId,
          to,
          type,
          data,
          senderName: myInfoRef.current.name,
          senderRole: myInfoRef.current.role
        })
      });
    } catch (err) {
      console.warn('Signal send failed:', type, err);
    }
  }, [sessionId, myId]);

  // Create PeerConnection for camera and mic
  const createPeerConnection = useCallback((peerId, peerName, peerRole) => {
    if (pcsRef.current[peerId]) {
      return pcsRef.current[peerId];
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcsRef.current[peerId] = pc;
    iceCandidatesQueueRef.current[peerId] = [];

    // Add local media tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (e) {}
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ice-candidate', { candidate: event.candidate }, peerId);
      }
    };

    // Remote Track handler
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStreams(prev => ({
          ...prev,
          [peerId]: stream
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      }
    };

    setPeers(prev => {
      // Clean up any stale duplicate entry with same name
      const cleaned = { ...prev };
      Object.keys(cleaned).forEach(id => {
        if (id !== peerId && cleaned[id].name === peerName) {
          delete cleaned[id];
        }
      });

      return {
        ...cleaned,
        [peerId]: {
          id: peerId,
          name: peerName || 'Participant',
          role: peerRole || 'student',
          camOff: false,
          muted: false,
          handRaised: false,
          isSpeaking: false
        }
      };
    });

    return pc;
  }, [sendSignal]);

  // Initialize Local Media (Camera & Microphone)
  useEffect(() => {
    let active = true;

    async function setupLocalMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Attach tracks to existing peer connections
        Object.values(pcsRef.current).forEach(pc => {
          stream.getTracks().forEach(track => {
            try {
              pc.addTrack(track, stream);
            } catch (e) {}
          });
        });
      } catch (err) {
        console.warn('Webcam/mic access error (or denied):', err);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (active) {
            localStreamRef.current = audioStream;
            setLocalStream(audioStream);
            setCamOff(true);
          }
        } catch (audioErr) {
          console.warn('Audio-only access also unavailable:', audioErr);
        }
      }
    }

    setupLocalMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Monitor Speech Volume for speaking indicator
  useEffect(() => {
    if (!localStream || muted) {
      const timer = setTimeout(() => setIsSpeaking(false), 0);
      return () => clearTimeout(timer);
    }

    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) return;

    let audioCtx = null;
    let analyser = null;
    let source = null;
    let animId = null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;

      source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length;
        setIsSpeaking(avg > 10);
        animId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Audio analyser setup failed:', e);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (source) source.disconnect();
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [localStream, muted]);

  // Signal handler with ICE candidate queueing
  const handleSignalRef = useRef(null);

  const handleSignal = async (sig) => {
    if (!sig || !sig.type || sig.from === myId) return;
    if (processedSignalIdsRef.current.has(sig.id)) return;
    processedSignalIdsRef.current.add(sig.id);

    if (processedSignalIdsRef.current.size > 500) {
      processedSignalIdsRef.current.clear();
    }

    const { from, type, data, senderName, senderRole } = sig;

    switch (type) {
      case 'join': {
        if (!peersRef.current[from]) {
          callbacksRef.current.onPeerJoin?.({ id: from, name: senderName, role: senderRole });
        }
        const pc = createPeerConnection(from, senderName, senderRole);

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal('offer', { sdp: offer }, from);

          // If currently sharing screen, offer screen stream to newcomer
          if (localScreenStreamRef.current) {
            const screenPc = new RTCPeerConnection(RTC_CONFIG);
            screenPcsRef.current[from] = screenPc;
            screenIceQueueRef.current[from] = [];

            localScreenStreamRef.current.getTracks().forEach(t => {
              screenPc.addTrack(t, localScreenStreamRef.current);
            });
            screenPc.onicecandidate = (e) => {
              if (e.candidate) {
                sendSignal('screen-ice', { candidate: e.candidate }, from);
              }
            };
            const scrOffer = await screenPc.createOffer();
            await screenPc.setLocalDescription(scrOffer);
            sendSignal('screen-offer', { sdp: scrOffer, sharerName: myInfoRef.current.name }, from);
          }
        } catch (err) {
          console.error('Error creating offer for peer:', from, err);
        }
        break;
      }

      case 'offer': {
        const pc = createPeerConnection(from, senderName, senderRole);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          // Flush buffered ICE candidates
          if (iceCandidatesQueueRef.current[from]) {
            for (const cand of iceCandidatesQueueRef.current[from]) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {}
            }
            iceCandidatesQueueRef.current[from] = [];
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal('answer', { sdp: answer }, from);
        } catch (err) {
          console.error('Error handling offer from peer:', from, err);
        }
        break;
      }

      case 'answer': {
        const pc = pcsRef.current[from];
        if (pc && pc.signalingState !== 'stable') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

            if (iceCandidatesQueueRef.current[from]) {
              for (const cand of iceCandidatesQueueRef.current[from]) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {}
              }
              iceCandidatesQueueRef.current[from] = [];
            }
          } catch (err) {
            console.error('Error setting remote description for answer:', from, err);
          }
        }
        break;
      }

      case 'ice-candidate': {
        const pc = pcsRef.current[from];
        if (data.candidate) {
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) {
              console.warn('Error adding ice candidate:', err);
            }
          } else {
            if (!iceCandidatesQueueRef.current[from]) {
              iceCandidatesQueueRef.current[from] = [];
            }
            iceCandidatesQueueRef.current[from].push(data.candidate);
          }
        }
        break;
      }

      case 'peer-status': {
        setPeers(prev => {
          if (!prev[from]) {
            return {
              ...prev,
              [from]: {
                id: from,
                name: senderName || 'Participant',
                role: senderRole || 'student',
                ...data
              }
            };
          }
          return {
            ...prev,
            [from]: {
              ...prev[from],
              ...data
            }
          };
        });
        break;
      }

      case 'screen-offer': {
        const screenPc = new RTCPeerConnection(RTC_CONFIG);
        screenPcsRef.current[from] = screenPc;
        screenIceQueueRef.current[from] = [];

        screenPc.ontrack = (event) => {
          const [scrStream] = event.streams;
          if (scrStream) {
            setRemoteScreenStream(scrStream);
            setScreenSharer({ id: from, name: data.sharerName || senderName });
          }
        };

        screenPc.onicecandidate = (e) => {
          if (e.candidate) {
            sendSignal('screen-ice', { candidate: e.candidate }, from);
          }
        };

        try {
          await screenPc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          if (screenIceQueueRef.current[from]) {
            for (const cand of screenIceQueueRef.current[from]) {
              try {
                await screenPc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {}
            }
            screenIceQueueRef.current[from] = [];
          }

          const scrAnswer = await screenPc.createAnswer();
          await screenPc.setLocalDescription(scrAnswer);
          sendSignal('screen-answer', { sdp: scrAnswer }, from);
        } catch (err) {
          console.error('Error handling screen offer:', err);
        }
        break;
      }

      case 'screen-answer': {
        const screenPc = screenPcsRef.current[from];
        if (screenPc && screenPc.signalingState !== 'stable') {
          try {
            await screenPc.setRemoteDescription(new RTCSessionDescription(data.sdp));

            if (screenIceQueueRef.current[from]) {
              for (const cand of screenIceQueueRef.current[from]) {
                try {
                  await screenPc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {}
              }
              screenIceQueueRef.current[from] = [];
            }
          } catch (err) {
            console.error('Error setting remote description for screen answer:', err);
          }
        }
        break;
      }

      case 'screen-ice': {
        const screenPc = screenPcsRef.current[from];
        if (data.candidate) {
          if (screenPc && screenPc.remoteDescription) {
            try {
              await screenPc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) {
              console.warn('Error adding screen ice candidate:', err);
            }
          } else {
            if (!screenIceQueueRef.current[from]) {
              screenIceQueueRef.current[from] = [];
            }
            screenIceQueueRef.current[from].push(data.candidate);
          }
        }
        break;
      }

      case 'screen-stop': {
        setRemoteScreenStream(null);
        setScreenSharer(null);
        if (screenPcsRef.current[from]) {
          screenPcsRef.current[from].close();
          delete screenPcsRef.current[from];
        }
        break;
      }

      case 'chat': {
        callbacksRef.current.onChatMessage?.({
          id: sig.id,
          sender: senderName,
          role: senderRole,
          msg: data.msg,
          time: data.time || new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
        });
        break;
      }

      case 'leave': {
        if (peersRef.current[from]) {
          callbacksRef.current.onPeerLeave?.({ id: from, name: senderName });
        }
        if (pcsRef.current[from]) {
          pcsRef.current[from].close();
          delete pcsRef.current[from];
        }
        if (screenPcsRef.current[from]) {
          screenPcsRef.current[from].close();
          delete screenPcsRef.current[from];
        }
        setPeers(prev => {
          const next = { ...prev };
          delete next[from];
          return next;
        });
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[from];
          return next;
        });
        if (screenSharer?.id === from) {
          setRemoteScreenStream(null);
          setScreenSharer(null);
        }
        break;
      }

      case 'session-ended': {
        callbacksRef.current.onSessionEnded?.();
        break;
      }

      default:
        break;
    }
  };

  useEffect(() => {
    handleSignalRef.current = handleSignal;
  });

  // Connect to Signaling channel - Runs ONCE on mount
  useEffect(() => {
    if (!sessionId || !myId) return;

    let isSubscribed = true;
    let pollTimer = null;

    const pollSignals = async () => {
      try {
        const since = lastSignalTimeRef.current;
        const res = await fetch(`/api/classroom/${sessionId}/signal?userId=${encodeURIComponent(myId)}&since=${since}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.signals)) {
          if (json.signals.length > 0) {
            lastSignalTimeRef.current = json.signals[json.signals.length - 1].timestamp;
          } else if (json.serverTime) {
            lastSignalTimeRef.current = json.serverTime;
          }
          for (const s of json.signals) {
            if (isSubscribed && handleSignalRef.current) {
              await handleSignalRef.current(s);
            }
          }
        }
      } catch (err) {}
    };

    // Fast polling every 900ms to ensure near real-time response on Vercel
    pollTimer = setInterval(pollSignals, 900);
    pollSignals();

    // Broadcast our join
    sendSignal('join', {
      name: myInfoRef.current.name,
      role: myInfoRef.current.role
    });

    return () => {
      isSubscribed = false;
      if (pollTimer) clearInterval(pollTimer);
      sendSignal('leave');
      Object.values(pcsRef.current).forEach(pc => pc.close());
      pcsRef.current = {};
      Object.values(screenPcsRef.current).forEach(pc => pc.close());
      screenPcsRef.current = {};
    };
  }, [sessionId, myId, sendSignal]);

  // Broadcast status changes
  useEffect(() => {
    sendSignal('peer-status', {
      muted,
      camOff,
      handRaised,
      isSpeaking
    });
  }, [isSpeaking, muted, camOff, handRaised, sendSignal]);

  // Toggle Microphone Mute
  const toggleMic = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  // Toggle Camera
  const toggleCam = useCallback(() => {
    setCamOff(prev => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  // Toggle Hand Raise
  const toggleHandRaise = useCallback(() => {
    setHandRaised(prev => !prev);
  }, []);

  // Stop Screen Sharing (declared before startScreenShare)
  const stopScreenShare = useCallback(() => {
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach(t => t.stop());
      localScreenStreamRef.current = null;
    }
    setLocalScreenStream(null);
    setIsScreenSharing(false);
    setScreenSharer(null);

    Object.values(screenPcsRef.current).forEach(pc => pc.close());
    screenPcsRef.current = {};

    sendSignal('screen-stop');
  }, [sendSignal]);

  // Start Screen Sharing
  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert('Screen sharing is not supported on this browser (e.g. mobile devices). You can still view screens shared by others.');
      return;
    }

    try {
      const scrStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', frameRate: { ideal: 30, max: 60 } },
        audio: true
      });

      localScreenStreamRef.current = scrStream;
      setLocalScreenStream(scrStream);
      setIsScreenSharing(true);
      setScreenSharer({ id: myId, name: myInfoRef.current.name });

      const peerIds = Object.keys(peersRef.current);
      for (const peerId of peerIds) {
        const screenPc = new RTCPeerConnection(RTC_CONFIG);
        screenPcsRef.current[peerId] = screenPc;
        screenIceQueueRef.current[peerId] = [];

        scrStream.getTracks().forEach(track => {
          screenPc.addTrack(track, scrStream);
        });

        screenPc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal('screen-ice', { candidate: event.candidate }, peerId);
          }
        };

        const offer = await screenPc.createOffer();
        await screenPc.setLocalDescription(offer);
        sendSignal('screen-offer', { sdp: offer, sharerName: myInfoRef.current.name }, peerId);
      }

      scrStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn('Screen share cancelled or failed:', err);
    }
  }, [myId, sendSignal, stopScreenShare]);

  // Send Chat message
  const sendChatMessage = useCallback((text) => {
    if (!text?.trim()) return;
    const msgObj = {
      msg: text.trim(),
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
    };
    sendSignal('chat', msgObj);
    return msgObj;
  }, [sendSignal]);

  return {
    myId,
    myName,
    myRole,
    localStream,
    remoteStreams,
    peers,
    muted,
    camOff,
    isSpeaking,
    handRaised,
    isScreenSharing,
    localScreenStream,
    remoteScreenStream,
    screenSharer,
    connectionStatus,
    toggleMic,
    toggleCam,
    toggleHandRaise,
    startScreenShare,
    stopScreenShare,
    sendChatMessage
  };
}
