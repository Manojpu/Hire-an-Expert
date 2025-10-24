// import { useEffect, useRef } from "react";
// import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

// interface MeetingRoomProps {
//   channelName: string;
// }

// const client: IAgoraRTCClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// export const MeetingRoom: React.FC<MeetingRoomProps> = ({ channelName }) => {
//   const localVideoRef = useRef<HTMLDivElement>(null);
//   const remoteVideoRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     let localAudioTrack: IMicrophoneAudioTrack;
//     let localVideoTrack: ICameraVideoTrack;

//     const startCall = async () => {
//       try {
//         const res = await fetch(`http://localhost:8000/api/agora/token?channel_name=${channelName}`);
//         const data = await res.json();

//         await client.join(data.appId, channelName, data.token, data.uid);

//         [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
//         localVideoTrack.play(localVideoRef.current!);

//         await client.publish([localAudioTrack, localVideoTrack]);

//         client.on("user-published", async (user, mediaType) => {
//           await client.subscribe(user, mediaType);
//           if (mediaType === "video") {
//             user.videoTrack?.play(remoteVideoRef.current!);
//           }
//           if (mediaType === "audio") {
//             user.audioTrack?.play();
//           }
//         });

//         client.on("user-unpublished", (user, mediaType) => {
//           if (mediaType === "video") {
//             remoteVideoRef.current!.innerHTML = "";
//           }
//         });
//       } catch (err) {
//         console.error("Agora join error:", err);
//       }
//     };

//     startCall();

//     return () => {
//       // Cleanup
//       localAudioTrack?.close();
//       localVideoTrack?.close();
//       client.leave();
//     };
//   }, [channelName]);

//   return (
//     <div className="flex gap-4">
//       <div
//         ref={localVideoRef}
//         className="w-1/2 h-64 bg-gray-200 rounded-lg flex items-center justify-center"
//       >
//         <span className="text-gray-500">Your video</span>
//       </div>
//       <div
//         ref={remoteVideoRef}
//         className="w-1/2 h-64 bg-gray-200 rounded-lg flex items-center justify-center"
//       >
//         <span className="text-gray-500">Expert video</span>
//       </div>
//     </div>
//   );
// };

import { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteUser,
} from "agora-rtc-sdk-ng";

interface MeetingRoomProps {
  channelName: string;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({ channelName }) => {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const [remoteUserCount, setRemoteUserCount] = useState(0);
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  useEffect(() => {
    let localAudioTrack: IMicrophoneAudioTrack | null = null;
    let localVideoTrack: ICameraVideoTrack | null = null;
    let isJoined = false;
    let recheckInterval: NodeJS.Timeout | null = null;

    const startCall = async () => {
      try {
        // Create a fresh client instance for this session
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        const res = await fetch(
          `${
            import.meta.env.VITE_API_GATEWAY_URL
          }/api/agora/token?channel_name=${channelName}`
        );
        const data = await res.json();

        console.log("🚀 Starting Agora call with channel:", channelName);

        // 1️⃣ Setup event listeners FIRST (before joining)
        client.on("user-published", async (user: IRemoteUser, mediaType) => {
          console.log("👤 User published:", user.uid, "mediaType:", mediaType);
          try {
            await client.subscribe(user, mediaType);
            console.log("✅ Subscribed to user:", user.uid, mediaType);

            if (mediaType === "video" && user.videoTrack) {
              const playerElement = remoteVideoRef.current;
              if (playerElement) {
                user.videoTrack.play(playerElement);
                console.log("🎥 Playing remote video for user:", user.uid);
                setRemoteUserCount(
                  client.remoteUsers.filter((u) => u.hasVideo).length
                );
              }
            }
            if (mediaType === "audio" && user.audioTrack) {
              user.audioTrack.play();
              console.log("🔊 Playing remote audio for user:", user.uid);
            }
          } catch (error) {
            console.error("❌ Error subscribing to user:", user.uid, error);
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          console.log("👋 User unpublished:", user.uid, mediaType);
          if (mediaType === "video") {
            setRemoteUserCount(
              client.remoteUsers.filter((u) => u.hasVideo).length
            );
          }
        });

        client.on("user-joined", (user) => {
          console.log("✨ User joined channel:", user.uid);
          setRemoteUserCount(client.remoteUsers.length);
        });

        client.on("user-left", (user) => {
          console.log("👋 User left channel:", user.uid);
          setRemoteUserCount(client.remoteUsers.length);
          if (client.remoteUsers.length === 0 && remoteVideoRef.current) {
            remoteVideoRef.current.innerHTML =
              "<p class='text-gray-500'>Waiting for others...</p>";
          }
        });

        // 2️⃣ Join the channel
        await client.join(data.appId, channelName, data.token, data.uid);
        isJoined = true;
        console.log("✅ Joined channel:", channelName, "with UID:", data.uid);

        // 3️⃣ Immediately check for already-published remote users (BEFORE creating local tracks)
        const subscribeToRemoteUsers = async () => {
          const existingUsers = client.remoteUsers;
          console.log("👥 Checking remote users:", existingUsers.length);

          for (const remoteUser of existingUsers) {
            console.log(
              "🔍 User UID:",
              remoteUser.uid,
              "hasVideo:",
              remoteUser.hasVideo,
              "hasAudio:",
              remoteUser.hasAudio
            );

            // Subscribe to already-published video
            if (remoteUser.hasVideo && remoteUser.videoTrack) {
              try {
                await client.subscribe(remoteUser, "video");
                remoteUser.videoTrack.play(remoteVideoRef.current!);
                console.log(
                  "✅ Subscribed to already-published video from user:",
                  remoteUser.uid
                );
              } catch (error) {
                console.error("❌ Error subscribing to existing video:", error);
              }
            }

            // Subscribe to already-published audio
            if (remoteUser.hasAudio && remoteUser.audioTrack) {
              try {
                await client.subscribe(remoteUser, "audio");
                remoteUser.audioTrack.play();
                console.log(
                  "✅ Subscribed to already-published audio from user:",
                  remoteUser.uid
                );
              } catch (error) {
                console.error("❌ Error subscribing to existing audio:", error);
              }
            }
          }

          setRemoteUserCount(existingUsers.filter((u) => u.hasVideo).length);
        };

        // Initial check immediately after join
        await subscribeToRemoteUsers();

        // Periodic recheck every 5 seconds for 2 minutes to catch delayed publications
        let recheckCount = 0;
        const maxRechecks = 24; // 5 seconds * 24 = 2 minutes
        recheckInterval = setInterval(async () => {
          recheckCount++;
          console.log(`🔄 Periodic recheck ${recheckCount}/${maxRechecks}`);
          await subscribeToRemoteUsers();

          if (recheckCount >= maxRechecks) {
            clearInterval(recheckInterval!);
            console.log("⏹️ Periodic recheck completed");
          }
        }, 5000);

        // 4️⃣ Create and publish local tracks
        [localAudioTrack, localVideoTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();
        if (localVideoRef.current) {
          localVideoTrack.play(localVideoRef.current);
          console.log("🎥 Local video playing");
        }

        await client.publish([localAudioTrack, localVideoTrack]);
        console.log("� Local tracks published");
      } catch (err) {
        console.error("❌ Agora join error:", err);
      }
    };

    startCall();

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up Agora resources");

      // Clear the periodic recheck interval
      if (recheckInterval) {
        clearInterval(recheckInterval);
        console.log("⏹️ Cleared periodic recheck interval");
      }

      localAudioTrack?.close();
      localVideoTrack?.close();
      const client = clientRef.current;
      if (client) {
        if (isJoined) {
          client.leave();
        }
        client.removeAllListeners();
      }
    };
  }, [channelName]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm text-gray-600">
        Channel: {channelName} | Remote users: {remoteUserCount}
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium mb-2">Your Video</div>
          <div
            ref={localVideoRef}
            className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center"
          >
            <span className="text-gray-500">Your video</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium mb-2">
            Remote Video ({remoteUserCount} participant(s))
          </div>
          <div
            ref={remoteVideoRef}
            className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center"
          >
            <span className="text-gray-500">Waiting for others...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
