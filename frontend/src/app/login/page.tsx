"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState("user");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Predefined test users
  const testUsers = {
    user: [
      { id: "user123", name: "John Doe", type: "user" },
      { id: "user456", name: "Jane Smith", type: "user" },
      { id: "user789", name: "Mike Johnson", type: "user" }
    ],
    expert: [
      { id: "expert123", name: "Dr. Sarah Wilson", type: "expert" },
      { id: "expert456", name: "Prof. David Lee", type: "expert" },
      { id: "expert789", name: "Alex Chen", type: "expert" }
    ]
  };

  const handleLogin = async (userId: string, userName: string, type: string) => {
    setLoading(true);
    
    try {
      // Create a simple JWT token for testing (in production, this would come from your backend)
      const tokenPayload = {
        userId: userId,
        username: userName,
        userType: type,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
      };
      
      // Simple base64 encoding for testing (NOT secure for production)
      const token = btoa(JSON.stringify(tokenPayload));
      
      // Store in localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("username", userName);
      localStorage.setItem("userType", type);
      
      // Redirect to messaging page
      router.push("/messaging");
      
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }
    
    const customUserId = `${userType}_${Date.now()}`;
    handleLogin(customUserId, username, userType);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '500px'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          color: '#1f2937',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          🔐 Test Login - Messaging Service
        </h1>

        {/* Quick Login Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            marginBottom: '1rem', 
            color: '#374151',
            fontSize: '1.1rem'
          }}>
            Quick Test Users:
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              👤 Users:
            </h4>
            {testUsers.user.map((user) => (
              <button
                key={user.id}
                onClick={() => handleLogin(user.id, user.name, user.type)}
                disabled={loading}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem',
                  margin: '0.25rem 0',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Login as {user.name} ({user.id})
              </button>
            ))}
          </div>

          <div>
            <h4 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              👨‍⚕️ Experts:
            </h4>
            {testUsers.expert.map((expert) => (
              <button
                key={expert.id}
                onClick={() => handleLogin(expert.id, expert.name, expert.type)}
                disabled={loading}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem',
                  margin: '0.25rem 0',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Login as {expert.name} ({expert.id})
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          backgroundColor: '#e5e7eb',
          margin: '1.5rem 0'
        }}></div>

        {/* Custom Login Section */}
        <div>
          <h3 style={{ 
            marginBottom: '1rem', 
            color: '#374151',
            fontSize: '1.1rem'
          }}>
            Custom Login:
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: '#374151',
              fontSize: '0.9rem'
            }}>
              Username:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: '#374151',
              fontSize: '0.9rem'
            }}>
              User Type:
            </label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'white'
              }}
            >
              <option value="user">👤 User</option>
              <option value="expert">👨‍⚕️ Expert</option>
            </select>
          </div>

          <button
            onClick={handleCustomLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login with Custom User'}
          </button>
        </div>

        {/* Info */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#fef3c7',
          borderRadius: '4px',
          fontSize: '0.8rem',
          color: '#92400e'
        }}>
          <strong>ℹ️ Testing Info:</strong><br />
          • This is a temporary login for testing purposes<br />
          • JWT tokens are stored in localStorage<br />
          • Use different browser tabs to simulate multiple users<br />
          • Tokens expire in 24 hours
        </div>
      </div>
    </div>
  );
}
