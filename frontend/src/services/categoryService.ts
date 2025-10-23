import { Category } from "@/types/category.ts";

const API_GATEWAY_URL = (
  import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000"
).replace(/\/$/, "");
const CATEGORY_SERVICE_URL = `${API_GATEWAY_URL}/api/categories`;

export async function getAllCategories(): Promise<Category[]> {
  const response = await fetch(`${CATEGORY_SERVICE_URL}/categories`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const data = await response.json();
  return data as Category[];
}
