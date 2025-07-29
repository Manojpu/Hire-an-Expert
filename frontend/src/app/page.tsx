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
      <button
        onClick={navigateToMessages}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Messages
      </button>
    </main>
  );
}