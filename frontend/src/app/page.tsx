import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className={cn("min-h-screen flex items-center justify-center p-8")}>
      <main className={cn("text-center")}>
        <h1 className={cn("text-4xl font-bold mb-4")}>Welcome to Edulyt</h1>
        <p className={cn("text-lg text-gray-600 dark:text-gray-300")}>
          Your educational platform starts here
        </p>
      </main>
    </div>
  );
}
