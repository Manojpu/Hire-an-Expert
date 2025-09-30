import {Category} from "@/types/category.ts";

const GIG_SERVICE_URL =
    import.meta.env.VITE_GIG_SERVICE_URL || "http://localhost:8002";

export async function getAllCategories(): Promise<Category[]> {
    const response = await fetch(`${GIG_SERVICE_URL}/categories/categories`, {
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