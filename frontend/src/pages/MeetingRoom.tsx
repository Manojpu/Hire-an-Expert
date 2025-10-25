import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/auth/AuthContext";

const client: IAgoraRTCClient = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8",
});

const MeetingRoom: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const [localAudioTrack, setLocalAudioTrack] =
    useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Track refs to avoid stale cleanup and duplicate listeners
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const mountedRef = useRef(true);
  const remoteUserIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;

    const setRemoteCount = () => {
      if (mountedRef.current) setRemoteUsers(remoteUserIdsRef.current.size);
    };

    const parseChannelName = (data: any) => {
      // Prefer explicit channel_name when provided
      if (data?.channel_name && typeof data.channel_name === "string")
        return data.channel_name;

      // If meeting_link looks like a URL, try to derive a short segment; otherwise ignore it
      const link = data?.meeting_link;
      if (typeof link === "string") {
        try {
          const looksLikeUrl = /^https?:\/\//i.test(link);
          if (looksLikeUrl) {
            const u = new URL(link);
            const last = u.pathname.split("/").filter(Boolean).pop();
            if (last) return last;
          } else if (link.includes("/")) {
            const last = link.split("/").filter(Boolean).pop();
            if (last) return last;
          } else if (link.length < 64 && !/\s/.test(link)) {
            return link;
          }
        } catch {
          // fall through to default
        }
      }

      // Fallback to booking-based channel
      return `booking-${bookingId}`;
    };

    const initializeCall = async () => {
      try {
        const idToken = user ? await user.getIdToken() : null;
        const headers = idToken ? { Authorization: `Bearer ${idToken}` } : {};

        // Remove any existing listeners to avoid duplicates on re-entry
        client.removeAllListeners();

        // 1) Fetch booking -> resolve channel
        const bookingResp = await axios.get(
          `${import.meta.env.VITE_API_GATEWAY_URL}/api/bookings/${bookingId}`,
          { headers }
        );
        if (!bookingResp?.data)
          throw new Error("Empty booking response from server");

        const channelName = parseChannelName(bookingResp.data);

        // 2) Get agora token
        const tokenResp = await axios.get(
          `${import.meta.env.VITE_API_GATEWAY_URL}/api/agora/token`,
          { params: { channel_name: channelName }, headers }
        );
        const { token, appId, uid } = tokenResp.data || {};
        if (!token || !appId) {
          throw new Error("Invalid Agora token response");
        }

        // 3) Join channel
        await client.join(appId, channelName, token, uid ?? null);
        setIsJoined(true);

        // 4) Create & publish local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        audioTrackRef.current = audioTrack;
        videoTrackRef.current = videoTrack;
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }
        await client.publish([audioTrack, videoTrack]);

        // 5) Remote events (use user join/left for count; publish for media)
        client.on("user-joined", (u) => {
          remoteUserIdsRef.current.add(String(u.uid));
          setRemoteCount();
        });

        client.on("user-left", (u) => {
          remoteUserIdsRef.current.delete(String(u.uid));
          setRemoteCount();
        });

        client.on("user-published", async (u, mediaType) => {
          await client.subscribe(u, mediaType);
          if (mediaType === "video" && u.videoTrack && remoteVideoRef.current) {
            u.videoTrack.play(remoteVideoRef.current);
          }
          if (mediaType === "audio" && u.audioTrack) {
            u.audioTrack.play();
          }
        });

        client.on("user-unpublished", (u, mediaType) => {
          // No count change here; count is tracked on join/left
          if (mediaType === "video" && remoteVideoRef.current) {
            // Video element will be cleared automatically when next video plays
          }
        });
      } catch (err: any) {
        console.error("Failed to join call:", err);
        const status = err?.response?.status;
        if (status === 404) {
          setError("Meeting not found. The booking may be invalid or expired.");
        } else if (status === 401 || status === 403) {
          setError("You are not authorized to join this meeting.");
        } else if (err?.name === "NotAllowedError") {
          setError("Please allow microphone/camera permissions and try again.");
        } else if (err?.message) {
          setError(err.message);
        } else {
          setError("Failed to join the meeting");
        }
      }
    };

    if (bookingId) {
      initializeCall();
    }

    return () => {
      mountedRef.current = false;
      try {
        client.removeAllListeners();
      } catch {}
      try {
        const tracks = [audioTrackRef.current, videoTrackRef.current].filter(
          Boolean
        ) as (IMicrophoneAudioTrack | ICameraVideoTrack)[];
        if (tracks.length) client.unpublish(tracks).catch(() => {});
      } catch {}
      try {
        audioTrackRef.current?.close();
        videoTrackRef.current?.close();
      } catch {}
      audioTrackRef.current = null;
      videoTrackRef.current = null;
      remoteUserIdsRef.current.clear();
      client.leave().catch(() => {});
    };
    // Include user in deps to ensure token header is available when user resolves
  }, [bookingId, user]);

  const toggleVideo = async () => {
    const track = videoTrackRef.current || localVideoTrack;
    if (track) {
      await track.setEnabled(!isVideoEnabled);
      setIsVideoEnabled((v) => !v);
    }
  };

  const toggleAudio = async () => {
    const track = audioTrackRef.current || localAudioTrack;
    if (track) {
      await track.setEnabled(!isAudioEnabled);
      setIsAudioEnabled((v) => !v);
    }
  };

  const endCall = async () => {
    try {
      const tracks = [audioTrackRef.current, videoTrackRef.current].filter(
        Boolean
      ) as (IMicrophoneAudioTrack | ICameraVideoTrack)[];
      if (tracks.length) await client.unpublish(tracks);
    } catch {}
    try {
      audioTrackRef.current?.close();
      videoTrackRef.current?.close();
    } catch {}
    audioTrackRef.current = null;
    videoTrackRef.current = null;
    await client.leave().catch(() => {});
    navigate("/my-bookings");
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Meeting Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={() => navigate("/my-bookings")}>
            Return to Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Video Consultation</h1>
          <div className="text-sm text-gray-300">
            {remoteUsers > 0
              ? `${remoteUsers} participant(s)`
              : "Waiting for others..."}
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 container mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Remote Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
          <div
            ref={remoteVideoRef}
            className="w-full h-full flex items-center justify-center"
          >
            {remoteUsers === 0 && (
              <div className="text-gray-400 text-center">
                <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                <p>Waiting for other participant to join...</p>
              </div>
            )}
          </div>
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded text-white text-sm">
            Remote User
          </div>
        </div>

        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
          <div
            ref={localVideoRef}
            className="w-full h-full flex items-center justify-center"
          >
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <VideoOff className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded text-white text-sm">
            You {!isAudioEnabled && "(Muted)"}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6">
        <div className="container mx-auto flex justify-center gap-4">
          <Button
            onClick={toggleAudio}
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-14 h-14"
            disabled={!isJoined}
          >
            {isAudioEnabled ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </Button>

          <Button
            onClick={toggleVideo}
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-14 h-14"
            disabled={!isJoined}
          >
            {isVideoEnabled ? (
              <Video className="h-6 w-6" />
            ) : (
              <VideoOff className="h-6 w-6" />
            )}
          </Button>

          <Button
            onClick={endCall}
            variant="destructive"
            size="lg"
            className="rounded-full w-14 h-14"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
