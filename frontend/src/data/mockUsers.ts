import { User } from "@/context/AuthContext";

export const MOCK_USERS: User[] = [
  {
    id: "user_client_001",
    name: "John Client",
    email: "john.client@example.com",
    role: "client",
    profileImage: "https://i.pravatar.cc/150?img=3",
    verified: true,
  },
  {
    id: "user_expert_001",
    name: "Dr. Sarah Johnson",
    email: "sarah.expert@example.com",
    role: "expert",
    profileImage: "https://i.pravatar.cc/150?img=12",
    verified: true,
  },
  {
    id: "user_admin_001",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    profileImage: "https://i.pravatar.cc/150?img=8",
    verified: true,
  },
];
