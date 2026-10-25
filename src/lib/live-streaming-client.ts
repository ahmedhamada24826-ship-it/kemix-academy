export interface StartWhipStreamOptions {
  endpoint: string;
  mediaStream: MediaStream;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
}

export async function startWhipStream({ endpoint, mediaStream, onIceCandidate }: StartWhipStreamOptions) {
  if (!window || !("RTCPeerConnection" in window)) {
    throw new Error("This browser does not support WebRTC WHIP streaming");
  }

  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  mediaStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, mediaStream);
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate?.(event.candidate);
    }
  };

  const offer = await peerConnection.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
  await peerConnection.setLocalDescription(offer);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/sdp",
      Accept: "application/sdp, application/json",
    },
    body: offer.sdp ?? "",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WHIP negotiation failed: ${text}`);
  }

  const answer = await response.text();
  if (!answer) {
    return { peerConnection };
  }

  try {
    const parsedAnswer = JSON.parse(answer) as { sdp?: string };
    if (parsedAnswer?.sdp) {
      await peerConnection.setRemoteDescription({ type: "answer", sdp: parsedAnswer.sdp });
      return { peerConnection };
    }
  } catch {
    // Some WHIP servers return a raw SDP payload rather than JSON.
  }

  await peerConnection.setRemoteDescription({ type: "answer", sdp: answer });

  return { peerConnection };
}
