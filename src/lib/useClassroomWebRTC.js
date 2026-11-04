'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

/**
 * Custom hook to manage WebRTC multi-peer audio, video, and screen sharing
 * with rock-solid, persistent signaling and zero redundant re-joining loops.
 */
export function useClassroomWebRTC({
  sessionId,
  user,
  onChatMessage,
  onPeerJoin,
  onPeerLeave
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

  // Stable persistent myId for the entire session in this browser tab
  const myIdRef = useRef(null);
  if (!myIdRef.current) {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`insighted_peer_${sessionId}`);
      if (stored) {
        myIdRef.current = stored;
      } else {
        const generated = user?.id || user?._id || ('peer_' + Math.random().toString(36).substring(2, 9));
        sessionStorage.setItem(`insighted_peer_${sessionId}`, generated);
        myIdRef.current = generated;
      }
    } else {
      myIdRef.current = user?.id || user?._id || 'peer_ssr';
    }
  }
  const myId = myIdRef.current;

  const myName = user?.name || (typeof window !== 'undefined' ? localStorage.getItem('userName') : null) || (user?.role === 'teacher' ? 'Instructor' : 'Student');
  const myRole = user?.role || 'student';

  // Refs for callbacks & mutable values to prevent useEffect teardowns
  const callbacksRef = useRef({});
  callbacksRef.current = { onChatMessage, onPeerJoin, onPeerLeave };

  const myInfoRef = useRef({ id: myId, name: myName, role: myRole });
  myInfoRef.current = { id: myId, name: myName, role: myRole };

  const peersRef = useRef({});
  peersRef.current = peers;

  const pcsRef = useRef({});
  const screenPcsRef = useRef({});
  const localStreamRef = useRef(null);
  const localScreenStreamRef = useRef(null);
  const lastSignalTimeRef = useRef(Date.now() - 3000);
  const processedSignalIdsRef = useRef(new Set());

  // Helper to send signal via POST
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
      console.warn('Failed to send signal:', type, err);
    }
  }, [sessionId, myId]);

  // Create an RTCPeerConnection for a remote peer (Camera + Mic)
  const createPeerConnection = useCallback((peerId, peerName, peerRole) => {
    if (pcsRef.current[peerId]) {
      return pcsRef.current[peerId];
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcsRef.current[peerId] = pc;

    // Add local tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (e) {
          // Track already added
        }
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
      // Remove any ghost entry that has the same name but different peerId
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

  // Initialize Local Media (Camera & Microphone) - runs once
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

        // Add tracks to any active peer connections
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

  // Monitor Local Speech with Web Audio API for speaking indicator
  useEffect(() => {
    if (!localStream || muted) {
      setIsSpeaking(false);
      return;
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

  // Handle incoming signaling messages with stable ref references
  const handleSignalRef = useRef();
  handleSignalRef.current = async (sig) => {
    if (!sig || !sig.type || sig.from === myId) return;
    if (processedSignalIdsRef.current.has(sig.id)) return;
    processedSignalIdsRef.current.add(sig.id);

    if (processedSignalIdsRef.current.size > 500) {
      processedSignalIdsRef.current.clear();
    }

    const { from, type, data, senderName, senderRole } = sig;

    switch (type) {
      case 'join': {
        // Only trigger join notification if peer is new
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
          } catch (err) {
            console.error('Error setting remote description for answer:', from, err);
          }
        }
        break;
      }

      case 'ice-candidate': {
        const pc = pcsRef.current[from];
        if (pc && data.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.warn('Error adding ice candidate:', err);
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
          } catch (err) {
            console.error('Error setting remote description for screen answer:', err);
          }
        }
        break;
      }

      case 'screen-ice': {
        const screenPc = screenPcsRef.current[from];
        if (screenPc && data.candidate) {
          try {
            await screenPc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.warn('Error adding screen ice candidate:', err);
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
        break;
      }

      default:
        break;
    }
  };

  // Connect to Signaling channel - STRICTLY RUNS ONCE per session
  useEffect(() => {
    if (!sessionId || !myId) return;

    let isSubscribed = true;
    let sseSource = null;
    let pollTimer = null;

    const pollSignals = async () => {
      try {
        const since = lastSignalTimeRef.current;
        const res = await fetch(`/api/classroom/${sessionId}/signal?userId=${encodeURIComponent(myId)}&since=${since}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.signals)) {
          if (json.serverTime) lastSignalTimeRef.current = json.serverTime;
          for (const s of json.signals) {
            if (isSubscribed && handleSignalRef.current) {
              await handleSignalRef.current(s);
            }
          }
        }
      } catch (err) {}
    };

    try {
      const sseUrl = `/api/classroom/${sessionId}/signal?userId=${encodeURIComponent(myId)}&sse=true&since=${lastSignalTimeRef.current}`;
      sseSource = new EventSource(sseUrl);

      sseSource.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const sig = JSON.parse(event.data);
          if (handleSignalRef.current) handleSignalRef.current(sig);
        } catch (e) {}
      };

      sseSource.onerror = () => {
        if (!pollTimer) {
          pollTimer = setInterval(pollSignals, 1000);
        }
      };
    } catch (e) {
      pollTimer = setInterval(pollSignals, 1000);
    }

    // Safety poll every 3 seconds to guarantee no missed signals
    const safetyPoll = setInterval(pollSignals, 3000);

    // Broadcast our join ONCE
    sendSignal('join', {
      name: myInfoRef.current.name,
      role: myInfoRef.current.role
    });

    return () => {
      isSubscribed = false;
      clearInterval(safetyPoll);
      if (pollTimer) clearInterval(pollTimer);
      if (sseSource) {
        sseSource.close();
      }
      sendSignal('leave');
      Object.values(pcsRef.current).forEach(pc => pc.close());
      pcsRef.current = {};
      Object.values(screenPcsRef.current).forEach(pc => pc.close());
      screenPcsRef.current = {};
    };
  }, [sessionId, myId, sendSignal]);

  // Broadcast status changes (muted, camOff, handRaised, isSpeaking)
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

  // Start Screen Sharing
  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert('Screen sharing is not supported by your browser.');
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
  }, [myId, sendSignal]);

  // Stop Screen Sharing
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
