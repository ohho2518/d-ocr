import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full">
      <Input
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
      />
      <Input
        type="password"
        placeholder="Password"
        autoComplete={mode === "signin" ? "current-password" : "new-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {message && <p className="text-xs text-primary">{message}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        {mode === "signin" ? "No account? " : "Already have an account? "}
        <button
          type="button"
          className="underline"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setMessage(null); }}
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </form>
  );
}
