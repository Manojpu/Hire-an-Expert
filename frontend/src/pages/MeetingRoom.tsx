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

const client: IAgoraRTCClient = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8",
});

const MeetingRoom: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

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

  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Get booking details to retrieve channel name
        const bookingResponse = await axios.get(
          `${import.meta.env.VITE_API_GATEWAY_URL}/bookings/${bookingId}`
        );

        const channelName =
          bookingResponse.data.meeting_link || `booking-${bookingId}`;

        // Get Agora token from meeting service
        const tokenResponse = await axios.get(
          `${
            import.meta.env.VITE_API_GATEWAY_URL
          }/api/agora/token?channel_name=${channelName}`
        );

        const { token, appId, uid } = tokenResponse.data;

        // Join Agora channel
        await client.join(appId, channelName, token, uid);
        setIsJoined(true);

        // Create local tracks
        const [audioTrack, videoTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        // Publish local tracks
        await client.publish([audioTrack, videoTrack]);

        // Handle remote users
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          if (mediaType === "video") {
            const remoteVideoTrack = user.videoTrack;
            if (remoteVideoTrack && remoteVideoRef.current) {
              remoteVideoTrack.play(remoteVideoRef.current);
            }
          }

          if (mediaType === "audio") {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack?.play();
          }

          setRemoteUsers((prev) => prev + 1);
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") {
            setRemoteUsers((prev) => prev - 1);
          }
        });

        client.on("user-left", () => {
          setRemoteUsers((prev) => Math.max(0, prev - 1));
        });
      } catch (err) {
        console.error("Failed to join call:", err);
        setError(
          err instanceof Error ? err.message : "Failed to join the meeting"
        );
      }
    };

    if (bookingId) {
      initializeCall();
    }

    // Cleanup function
    return () => {
      if (localAudioTrack) {
        localAudioTrack.close();
      }
      if (localVideoTrack) {
        localVideoTrack.close();
      }
      client.leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const endCall = async () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    await client.leave();
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
