"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const navigateToMessages = () => {
    router.push("../messaging");
  };

  return (
    <main style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Hello World from Next.js!</h1>
      <p>Welcome to your homepage.</p>
      
      <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
        <button
          onClick={navigateToMessages}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            cursor: "pointer",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          Messages
        </button>
        
        <button
          onClick={() => router.push("/login")}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            cursor: "pointer",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          🔐 Test Login
        </button>
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fef3c7',
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        <strong>🧪 Testing Instructions:</strong><br />
        1. Click "🔐 Test Login" to authenticate as different users<br />
        2. Open multiple browser tabs to simulate different users<br />
        3. Test real-time messaging between users and experts
      </div>
    </main>
  );
}