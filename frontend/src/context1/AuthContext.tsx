
import React, { createContext, useContext, useReducer, ReactNode } from "react";

type Role = "client" | "expert" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  profileImage?: string;
  verified?: boolean;
};

type AuthState = {
  user: User | null;
  token: string | null;
};

type AuthAction =
  | { type: "LOGIN"; payload: { user: User; token: string } }
  | { type: "LOGOUT" };

const initialState: AuthState = {
  user: null,
  token: null,

};

const AuthContext = createContext<{
  state: AuthState;
  login: (user: User, token?: string) => void;
  logout: () => void;
} | null>(null);

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload.user, token: action.payload.token };
    case "LOGOUT":
      return { user: null, token: null };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = (user: User, token = "mock-token") => {
    // In a real app you would persist token to secure storage
    dispatch({ type: "LOGIN", payload: { user, token } });
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout }}>{children}</AuthContext.Provider>

  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};



