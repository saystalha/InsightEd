// lib/useClassroomWebRTC.js
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getCleanVoiceConstraints, optimizeOpusForVoice } from '@/lib/webrtcAudio';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
};

const getScreenConnectionKey = (peerId, shareId) => `${peerId}|${shareId}`;

export function useClassroomWebRTC({
  sessionId,
  user,
  audioDeviceId = '',
  videoDeviceId = '',
  initialMuted = false,
  initialCamOff = false,
  onChatMessage,
  onPeerJoin,
  onKnock,
  onPinState,
  onPeerLeave,
  onSessionEnded,
  onMediaError,
}) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [peers, setPeers] = useState({});

  const [muted, setMuted] = useState(Boolean(initialMuted));
  const [camOff, setCamOff] = useState(Boolean(initialCamOff));
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localScreenStream, setLocalScreenStream] = useState(null);
  const [screenShares, setScreenShares] = useState({});

  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [localMediaReady, setLocalMediaReady] = useState(false);

  // Stable persistent peerId for this tab
  const [myId] = useState(() => {
    if (user?.id || user?._id) return String(user.id || user._id);
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`insighted_peer_${sessionId}`);
      if (stored) return stored;
      const gen = 'peer_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      sessionStorage.setItem(`insighted_peer_${sessionId}`, gen);
      return gen;
    }
    return 'peer_client';
  });

  const myName =
    user?.name ||
    (typeof window !== 'undefined' ? localStorage.getItem('userName') : null) ||
    (user?.role === 'teacher' ? 'Instructor' : 'Student');
  const myRole = user?.role || 'student';

  const callbacksRef = useRef({
    onChatMessage,
    onPeerJoin,
    onKnock,
    onPinState,
    onPeerLeave,
    onSessionEnded,
    onMediaError,
  });
  const myInfoRef = useRef({ id: myId, name: myName, role: myRole });
  const peersRef = useRef(peers);

  useEffect(() => {
    callbacksRef.current = {
      onChatMessage,
      onPeerJoin,
      onKnock,
      onPinState,
      onPeerLeave,
      onSessionEnded,
      onMediaError,
    };
    myInfoRef.current = { id: myId, name: myName, role: myRole };
    peersRef.current = peers;
  }, [onChatMessage, onPeerJoin, onKnock, onPinState, onPeerLeave, onSessionEnded, onMediaError, myId, myName, myRole, peers]);

  const pcsRef = useRef({});
  const screenSendPcsRef = useRef({});
  const screenReceivePcsRef = useRef({});
  const iceCandidatesQueueRef = useRef({});
  const screenIceQueueRef = useRef({});

  const localStreamRef = useRef(null);
  const localScreenStreamRef = useRef(null);
  const localScreenShareIdRef = useRef(null);
  const lastSignalTimeRef = useRef(0);
  const processedSignalIdsRef = useRef(new Set());
  const joinSentRef = useRef(false);
  const mediaStateRef = useRef({ muted: Boolean(initialMuted), camOff: Boolean(initialCamOff) });
  const peerStatusRef = useRef({
    muted: Boolean(initialMuted),
    camOff: Boolean(initialCamOff),
    handRaised,
    isSpeaking,
  });

  useEffect(() => {
    peerStatusRef.current = { muted, camOff, handRaised, isSpeaking };
  }, [muted, camOff, handRaised, isSpeaking]);

  // ─── Send signal via POST ───
  const sendSignal = useCallback(
    async (type, data = {}, to = 'all') => {
      if (!sessionId || !myId) return;
      try {
        const response = await fetch(`/api/classroom/${sessionId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: myId,
            to,
            type,
            data,
            senderName: myInfoRef.current.name,
            senderRole: myInfoRef.current.role,
          }),
        });
        if (!response.ok) {
          throw new Error(`Signal request failed with status ${response.status}`);
        }
      } catch (err) {
        console.warn('Signal send failed:', type, err);
      }
    },
    [sessionId, myId]
  );

  // ─── Create PeerConnection for camera/mic ───
  const createPeerConnection = useCallback(
    (peerId, peerName, peerRole) => {
      if (pcsRef.current[peerId]) {
        return pcsRef.current[peerId];
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      let restartInProgress = false;
      pcsRef.current[peerId] = pc;
      iceCandidatesQueueRef.current[peerId] = [];

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, localStreamRef.current);
          } catch (e) {
            console.warn('Failed to add track to PC:', e);
          }
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('ice-candidate', { candidate: event.candidate }, peerId);
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams?.[0] || new MediaStream([event.track]);
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: stream,
        }));
      };

      const restartIce = async () => {
        if (restartInProgress || pc.signalingState !== 'stable') return;
        restartInProgress = true;
        try {
          const rawOffer = await pc.createOffer({ iceRestart: true });
          const offer = { type: rawOffer.type, sdp: optimizeOpusForVoice(rawOffer.sdp) };
          await pc.setLocalDescription(offer);
          await sendSignal('offer', { sdp: pc.localDescription }, peerId);
        } catch (err) {
          console.warn(`ICE restart failed for peer ${peerId}:`, err);
        } finally {
          restartInProgress = false;
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          setConnectionStatus('connected');
        } else if (state === 'failed') {
          restartIce();
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected') {
          setTimeout(() => {
            if (pc.iceConnectionState === 'disconnected') {
              restartIce();
            }
          }, 3000);
        }
      };

      // Deduplicate strictly by peerId (never delete participants who share a name)
      setPeers((prev) => ({
        ...prev,
        [peerId]: {
          id: peerId,
          name: peerName || prev[peerId]?.name || 'Participant',
          role: peerRole || prev[peerId]?.role || 'student',
          camOff: prev[peerId]?.camOff ?? false,
          muted: prev[peerId]?.muted ?? false,
          handRaised: prev[peerId]?.handRaised ?? false,
          isSpeaking: prev[peerId]?.isSpeaking ?? false,
        },
      }));

      return pc;
    },
    [sendSignal]
  );

  const createScreenOffer = useCallback(
    async (peerId, share) => {
      const connectionKey = getScreenConnectionKey(peerId, share.shareId);
      const previous = screenSendPcsRef.current[connectionKey];
      if (previous) {
        previous.close();
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      screenSendPcsRef.current[connectionKey] = pc;
      share.stream.getTracks().forEach((track) => {
        pc.addTrack(track, share.stream);
      });
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(
            'screen-ice',
            {
              shareId: share.shareId,
              candidate: event.candidate,
            },
            peerId
          );
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal(
          'screen-offer',
          {
            shareId: share.shareId,
            sdp: pc.localDescription,
            sharerName: share.name,
          },
          peerId
        );
      } catch (err) {
        pc.close();
        delete screenSendPcsRef.current[connectionKey];
        throw err;
      }
    },
    [sendSignal]
  );

  // ─── Initialize local media (camera & microphone) ───
  useEffect(() => {
    let active = true;

    async function setupLocalMedia() {
      const videoConstraints = videoDeviceId
        ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: getCleanVoiceConstraints(audioDeviceId),
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !mediaStateRef.current.muted;
        });
        stream.getVideoTracks().forEach((track) => {
          track.enabled = !mediaStateRef.current.camOff;
        });
        setLocalStream(stream);
      } catch (err) {
        console.warn('Webcam/mic access error (or denied):', err);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: getCleanVoiceConstraints(audioDeviceId),
          });
          if (active) {
            localStreamRef.current = audioStream;
            audioStream.getAudioTracks().forEach((track) => {
              track.enabled = !mediaStateRef.current.muted;
            });
            setLocalStream(audioStream);
            mediaStateRef.current.camOff = true;
            setCamOff(true);
            callbacksRef.current.onMediaError?.(
              'Camera unavailable. You joined using microphone audio only.'
            );
          } else {
            audioStream.getTracks().forEach((track) => track.stop());
          }
        } catch (audioErr) {
          console.warn('Audio-only access also unavailable:', audioErr);
          if (active) {
            callbacksRef.current.onMediaError?.(
              'Microphone access is unavailable. Check your browser permissions and device settings.'
            );
          }
        }
      } finally {
        if (active) {
          setLocalMediaReady(true);
        }
      }
    }

    setupLocalMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Hot-swap microphone or camera mid-call across all active PeerConnections ───
  const switchAudioDevice = useCallback(async (newMicId) => {
    try {
      const newAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: getCleanVoiceConstraints(newMicId),
      });
      const newTrack = newAudioStream.getAudioTracks()[0];
      if (!newTrack) return;

      newTrack.enabled = !mediaStateRef.current.muted;

      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          localStreamRef.current.removeTrack(t);
          t.stop();
        });
        localStreamRef.current.addTrack(newTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }

      for (const pc of Object.values(pcsRef.current)) {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
        if (sender) {
          await sender.replaceTrack(newTrack);
        }
      }
    } catch (err) {
      callbacksRef.current.onMediaError?.('Could not switch microphone device.');
    }
  }, []);

  const switchVideoDevice = useCallback(async (newCamId) => {
    try {
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: newCamId
          ? { deviceId: { exact: newCamId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      const newTrack = newVideoStream.getVideoTracks()[0];
      if (!newTrack) return;

      newTrack.enabled = !mediaStateRef.current.camOff;

      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          localStreamRef.current.removeTrack(t);
          t.stop();
        });
        localStreamRef.current.addTrack(newTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }

      for (const pc of Object.values(pcsRef.current)) {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newTrack);
        }
      }
    } catch (err) {
      callbacksRef.current.onMediaError?.('Could not switch camera device.');
    }
  }, []);

  // ─── Speech volume indicator ───
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

  // ─── Signal handler ───
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
      case 'knock': {
        callbacksRef.current.onKnock?.(data);
        break;
      }

      case 'pin-state': {
        callbacksRef.current.onPinState?.(data?.pin || null);
        break;
      }

      case 'join': {
        if (!peersRef.current[from]) {
          callbacksRef.current.onPeerJoin?.({ id: from, name: senderName, role: senderRole });
        }
        const pc = createPeerConnection(from, senderName, senderRole);

        try {
          const rawOffer = await pc.createOffer();
          const offer = { type: rawOffer.type, sdp: optimizeOpusForVoice(rawOffer.sdp) };
          await pc.setLocalDescription(offer);
          sendSignal('offer', { sdp: pc.localDescription }, from);

          if (localScreenStreamRef.current && localScreenShareIdRef.current) {
            await createScreenOffer(from, {
              shareId: localScreenShareIdRef.current,
              stream: localScreenStreamRef.current,
              name: myInfoRef.current.name,
            });
          }
        } catch (err) {
          console.error('Error creating offer for peer:', from, err);
        }
        break;
      }

      case 'offer': {
        const pc = createPeerConnection(from, senderName, senderRole);

        try {
          if (pc.signalingState === 'have-local-offer') {
            if (myId > from) {
              break;
            }
            await pc.setLocalDescription({ type: 'rollback' });
          }

          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          if (iceCandidatesQueueRef.current[from]) {
            for (const cand of iceCandidatesQueueRef.current[from]) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {}
            }
            iceCandidatesQueueRef.current[from] = [];
          }

          const rawAnswer = await pc.createAnswer();
          const answer = { type: rawAnswer.type, sdp: optimizeOpusForVoice(rawAnswer.sdp) };
          await pc.setLocalDescription(answer);
          sendSignal('answer', { sdp: pc.localDescription }, from);
        } catch (err) {
          console.error('Error handling offer from peer:', from, err);
        }
        break;
      }

      case 'answer': {
        const pc = pcsRef.current[from];
        if (pc && pc.signalingState === 'have-local-offer') {
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
        setPeers((prev) => {
          if (!prev[from]) {
            return {
              ...prev,
              [from]: {
                id: from,
                name: senderName || 'Participant',
                role: senderRole || 'student',
                ...data,
              },
            };
          }
          return {
            ...prev,
            [from]: {
              ...prev[from],
              ...data,
            },
          };
        });
        break;
      }

      case 'screen-offer': {
        const shareId = data.shareId || `screen:${from}`;
        const connectionKey = getScreenConnectionKey(from, shareId);
        const previous = screenReceivePcsRef.current[connectionKey];
        if (previous) {
          previous.close();
        }
        const screenPc = new RTCPeerConnection(RTC_CONFIG);
        screenReceivePcsRef.current[connectionKey] = screenPc;
        screenIceQueueRef.current[connectionKey] = screenIceQueueRef.current[connectionKey] || [];

        screenPc.ontrack = (event) => {
          const scrStream = event.streams[0] || new MediaStream([event.track]);
          if (scrStream) {
            setScreenShares((prev) => ({
              ...prev,
              [shareId]: {
                shareId,
                peerId: from,
                name: data.sharerName || senderName || 'Participant',
                stream: scrStream,
                isLocal: false,
              },
            }));
          }
          if (event.track.kind === 'video') {
            event.track.addEventListener(
              'ended',
              () => {
                screenReceivePcsRef.current[connectionKey]?.close();
                delete screenReceivePcsRef.current[connectionKey];
                delete screenIceQueueRef.current[connectionKey];
                setScreenShares((prev) => {
                  const next = { ...prev };
                  delete next[shareId];
                  return next;
                });
              },
              { once: true }
            );
          }
        };

        screenPc.onicecandidate = (e) => {
          if (e.candidate) {
            sendSignal('screen-ice', { shareId, candidate: e.candidate }, from);
          }
        };

        try {
          await screenPc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          if (screenIceQueueRef.current[connectionKey]) {
            for (const cand of screenIceQueueRef.current[connectionKey]) {
              try {
                await screenPc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {}
            }
            screenIceQueueRef.current[connectionKey] = [];
          }

          const scrAnswer = await screenPc.createAnswer();
          await screenPc.setLocalDescription(scrAnswer);
          await sendSignal(
            'screen-answer',
            {
              shareId,
              sdp: screenPc.localDescription,
            },
            from
          );
        } catch (err) {
          console.error('Error handling screen offer:', err);
        }
        break;
      }

      case 'screen-answer': {
        const shareId = data.shareId;
        const connectionKey = getScreenConnectionKey(from, shareId);
        const screenPc = screenSendPcsRef.current[connectionKey];
        if (screenPc && screenPc.signalingState !== 'stable') {
          try {
            await screenPc.setRemoteDescription(new RTCSessionDescription(data.sdp));

            if (screenIceQueueRef.current[connectionKey]) {
              for (const cand of screenIceQueueRef.current[connectionKey]) {
                try {
                  await screenPc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {}
              }
              screenIceQueueRef.current[connectionKey] = [];
            }
          } catch (err) {
            console.error('Error setting remote description for screen answer:', err);
          }
        }
        break;
      }

      case 'screen-ice': {
        const shareId = data.shareId || `screen:${from}`;
        const connectionKey = getScreenConnectionKey(from, shareId);
        const screenPc =
          data.shareId === localScreenShareIdRef.current
            ? screenSendPcsRef.current[connectionKey]
            : screenReceivePcsRef.current[connectionKey];
        if (data.candidate) {
          if (screenPc && screenPc.remoteDescription) {
            try {
              await screenPc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) {
              console.warn('Error adding screen ice candidate:', err);
            }
          } else {
            if (!screenIceQueueRef.current[connectionKey]) {
              screenIceQueueRef.current[connectionKey] = [];
            }
            screenIceQueueRef.current[connectionKey].push(data.candidate);
          }
        }
        break;
      }

      case 'screen-stop': {
        const shareId = data.shareId;
        if (shareId) {
          const connectionKey = getScreenConnectionKey(from, shareId);
          screenReceivePcsRef.current[connectionKey]?.close();
          delete screenReceivePcsRef.current[connectionKey];
          delete screenIceQueueRef.current[connectionKey];
          setScreenShares((prev) => {
            const next = { ...prev };
            delete next[shareId];
            return next;
          });
        } else {
          Object.keys(screenReceivePcsRef.current)
            .filter((key) => key.startsWith(`${from}|`))
            .forEach((key) => {
              screenReceivePcsRef.current[key].close();
              delete screenReceivePcsRef.current[key];
              delete screenIceQueueRef.current[key];
            });
          setScreenShares((prev) =>
            Object.fromEntries(Object.entries(prev).filter(([, share]) => share.peerId !== from))
          );
        }
        break;
      }

      case 'chat': {
        callbacksRef.current.onChatMessage?.({
          id: data.clientMsgId || sig.id,
          clientMsgId: data.clientMsgId || sig.id,
          sender: senderName,
          role: senderRole,
          msg: data.msg,
          time:
            data.time ||
            new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
          timestamp: data.timestamp || Date.now(),
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
        Object.keys(screenSendPcsRef.current)
          .filter((key) => key.startsWith(`${from}|`))
          .forEach((key) => {
            screenSendPcsRef.current[key].close();
            delete screenSendPcsRef.current[key];
            delete screenIceQueueRef.current[key];
          });
        Object.keys(screenReceivePcsRef.current)
          .filter((key) => key.startsWith(`${from}|`))
          .forEach((key) => {
            screenReceivePcsRef.current[key].close();
            delete screenReceivePcsRef.current[key];
            delete screenIceQueueRef.current[key];
          });
        setPeers((prev) => {
          const next = { ...prev };
          delete next[from];
          return next;
        });
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[from];
          return next;
        });
        setScreenShares((prev) =>
          Object.fromEntries(Object.entries(prev).filter(([, share]) => share.peerId !== from))
        );
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

  // ─── Connect to signaling channel ───
  useEffect(() => {
    if (!sessionId || !myId || !localMediaReady) return;

    let isSubscribed = true;
    let pollTimer = null;
    let initialTimeFetched = false;
    let pollInFlight = false;

    const pollSignals = async () => {
      if (pollInFlight) return;
      pollInFlight = true;
      try {
        const since = lastSignalTimeRef.current;
        const res = await fetch(
          `/api/classroom/${sessionId}/signal?userId=${encodeURIComponent(myId)}&since=${since}`
        );
        if (!res.ok) return;
        const json = await res.json();

        if (!initialTimeFetched && json.serverTime) {
          lastSignalTimeRef.current = json.serverTime;
          initialTimeFetched = true;

          if (!joinSentRef.current) {
            joinSentRef.current = true;
            await sendSignal('join', {
              name: myInfoRef.current.name,
              role: myInfoRef.current.role,
            });
            await sendSignal('peer-status', {
              ...peerStatusRef.current,
            });
          }
          return;
        }

        initialTimeFetched = true;

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
      } catch (err) {
        console.warn('Signal poll error:', err);
      } finally {
        pollInFlight = false;
      }
    };

    pollTimer = setInterval(pollSignals, 800);
    pollSignals();

    return () => {
      isSubscribed = false;
      if (pollTimer) clearInterval(pollTimer);

      sendSignal('leave');

      Object.values(pcsRef.current).forEach((pc) => {
        try {
          pc.close();
        } catch (e) {}
      });
      pcsRef.current = {};
      Object.values(screenSendPcsRef.current).forEach((pc) => {
        try {
          pc.close();
        } catch (e) {}
      });
      screenSendPcsRef.current = {};
      Object.values(screenReceivePcsRef.current).forEach((pc) => {
        try {
          pc.close();
        } catch (e) {}
      });
      screenReceivePcsRef.current = {};
      screenIceQueueRef.current = {};
      if (localScreenStreamRef.current) {
        localScreenStreamRef.current.getTracks().forEach((track) => track.stop());
        localScreenStreamRef.current = null;
        localScreenShareIdRef.current = null;
      }
    };
  }, [sessionId, myId, localMediaReady, sendSignal]);

  // ─── Broadcast status changes ───
  useEffect(() => {
    if (!joinSentRef.current) return;
    sendSignal('peer-status', {
      muted,
      camOff,
      handRaised,
      isSpeaking,
    });
  }, [isSpeaking, muted, camOff, handRaised, sendSignal]);

  // ─── Toggle microphone ───
  const toggleMic = useCallback(() => {
    const next = !mediaStateRef.current.muted;
    mediaStateRef.current.muted = next;
    setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
  }, []);

  // ─── Toggle camera ───
  const toggleCam = useCallback(() => {
    const next = !mediaStateRef.current.camOff;
    mediaStateRef.current.camOff = next;
    setCamOff(next);
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
  }, []);

  // ─── Toggle hand raise ───
  const toggleHandRaise = useCallback(() => {
    setHandRaised((prev) => !prev);
  }, []);

  // ─── Stop screen sharing ───
  const stopScreenShare = useCallback(() => {
    const shareId = localScreenShareIdRef.current;
    if (!shareId) return;

    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach((t) => t.stop());
      localScreenStreamRef.current = null;
    }
    localScreenShareIdRef.current = null;
    setLocalScreenStream(null);
    setIsScreenSharing(false);
    setScreenShares((prev) => {
      const next = { ...prev };
      delete next[shareId];
      return next;
    });

    Object.keys(screenSendPcsRef.current)
      .filter((key) => key.endsWith(`|${shareId}`))
      .forEach((key) => {
        screenSendPcsRef.current[key].close();
        delete screenSendPcsRef.current[key];
        delete screenIceQueueRef.current[key];
      });

    sendSignal('screen-stop', { shareId });
  }, [sendSignal]);

  // ─── Start screen sharing ───
  const startScreenShare = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      callbacksRef.current.onMediaError?.(
        'Screen sharing is not supported on this browser. You can still view shared screens.'
      );
      return;
    }

    let scrStream;
    try {
      scrStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', frameRate: { ideal: 30, max: 60 } },
        audio: true,
      });

      localScreenStreamRef.current = scrStream;
      const shareId = `${myId}:${
        globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      }`;
      localScreenShareIdRef.current = shareId;
      setLocalScreenStream(scrStream);
      setIsScreenSharing(true);
      const share = {
        shareId,
        peerId: myId,
        name: myInfoRef.current.name,
        stream: scrStream,
        isLocal: true,
      };
      setScreenShares((prev) => ({ ...prev, [shareId]: share }));

      const peerIds = Object.keys(peersRef.current);
      for (const peerId of peerIds) {
        try {
          await createScreenOffer(peerId, share);
        } catch (err) {
          console.warn(`Screen share could not be sent to peer ${peerId}:`, err);
        }
      }

      scrStream.getVideoTracks()[0]?.addEventListener(
        'ended',
        () => {
          stopScreenShare();
        },
        { once: true }
      );
    } catch (err) {
      console.warn('Screen share cancelled or failed:', err);
      if (scrStream && localScreenStreamRef.current === scrStream) {
        stopScreenShare();
      }
    }
  }, [myId, createScreenOffer, stopScreenShare]);

  // ─── Send chat message with shared clientMsgId ───
  const sendChatMessage = useCallback(
    (text, customMeta = {}) => {
      if (!text?.trim()) return;
      const msgObj = {
        clientMsgId:
          customMeta.clientMsgId ||
          `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        msg: text.trim(),
        time:
          customMeta.time ||
          new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        timestamp: customMeta.timestamp || Date.now(),
      };
      sendSignal('chat', msgObj);
      return msgObj;
    },
    [sendSignal]
  );

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
    screenShares,
    connectionStatus,
    toggleMic,
    toggleCam,
    toggleHandRaise,
    switchAudioDevice,
    switchVideoDevice,
    startScreenShare,
    stopScreenShare,
    sendChatMessage,
  };
}