import { redirect } from "next/navigation";

export default function Home() {
  redirect("/import-logs");
  return null;
} 