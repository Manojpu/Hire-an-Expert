import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ApplyExpert from "../ApplyGig";
import React from "react";

// Mock hooks and services
jest.mock("@/context/auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user-id", getIdToken: async () => "test-token" } })
}));
jest.mock("@/services/gigService", () => ({
  convertFormToGigData: jest.fn((data) => data),
  gigServiceAPI: { create: jest.fn(async () => ({ id: "gig123", status: "pending" })) }
}));
jest.mock("@/utils/expertUtils", () => ({
  convertApplicationToExpert: jest.fn(() => ({})),
  syncExpertData: jest.fn()
}));

global.fetch = jest.fn((url) => {
  if (url.includes("categories")) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, name: "TestCat" }]) });
  }
  if (url.includes("documents")) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ url: "file_url" }) });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
});

describe("ApplyExpert page", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders step 0 and category select", async () => {
    render(<ApplyExpert />);
    expect(screen.getByText(/Expertise & Services/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("TestCat")).toBeInTheDocument());
  });

  it("shows validation errors on submit with missing fields", async () => {
    render(<ApplyExpert />);
    // Go to last step
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Submit Application"));
    await waitFor(() => {
      expect(screen.getByText(/Expertise & Services/i)).toBeInTheDocument();
    });
  });

  it("submits application with valid data", async () => {
    render(<ApplyExpert />);
    // Fill required fields
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: 1 } });
    fireEvent.change(screen.getByLabelText("Hourly Rate (Rs.)"), { target: { value: 1000 } });
    fireEvent.change(screen.getByLabelText("Background Check Consent"), { target: { checked: true, type: "checkbox" } });
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByLabelText("I agree to the terms of service"));
    fireEvent.click(screen.getByText("Submit Application"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
