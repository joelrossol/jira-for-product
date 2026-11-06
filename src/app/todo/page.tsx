import { ListTodo } from "lucide-react";

export default function Page() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <ListTodo className="size-7" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">To-do list</h1>
        <p className="mt-2 text-sm text-ink-3">Coming soon.</p>
      </div>
    </div>
  );
}
