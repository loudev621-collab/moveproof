import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="text-2xl font-bold">Sign in to Doorstamp</h1>
      <p className="mt-2 text-soft">No password needed.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
