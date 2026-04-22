import { ProcessCategory } from "@/store/processCategories.store";

export async function fetchProcessCategories(): Promise<ProcessCategory[]> {
  const res = await fetch("/api/process-categories");
  return res.json();
}
