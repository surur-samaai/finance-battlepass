import { useState, type FormEvent } from "react";
import { supabase, setAuthStorage } from "../lib/supabase";

type AuthMode = "signin" | "signup" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSent, setSignupSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const passwordStrong = password.length >= 8;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    setAuthStorage(mode === "signin" ? rememberMe : true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setAuthStorage(rememberMe);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordStrong) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError(null);
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSignupSent(true);
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setSignupSent(false);
    setResetSent(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-white tracking-widest uppercase">
            Budgt Hero
          </h1>
        </div>

        {mode !== "forgot" && (
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "signin"
                  ? "bg-accent/20 text-accent"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "signup"
                  ? "bg-accent/20 text-accent"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {mode === "forgot" && (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">Reset password</h2>
            <p className="text-white/40 text-sm mt-1">
              Enter your email and we&apos;ll send a reset link.
            </p>
          </div>
        )}

        {signupSent ? (
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-6 text-center space-y-2">
            <p className="text-accent font-semibold">Check your email</p>
            <p className="text-white/60 text-sm">
              We sent a verification link to <strong>{email}</strong>. Click it
              to activate your account.
            </p>
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="text-sm text-accent hover:underline mt-2"
            >
              Back to sign in
            </button>
          </div>
        ) : resetSent ? (
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-6 text-center space-y-2">
            <p className="text-accent font-semibold">Reset link sent</p>
            <p className="text-white/60 text-sm">
              Check your inbox for a password reset link.
            </p>
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="text-sm text-accent hover:underline mt-2"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form
            onSubmit={
              mode === "signin"
                ? handleSignIn
                : mode === "signup"
                  ? handleSignUp
                  : handleForgotPassword
            }
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
                />
                {mode === "signup" && password.length > 0 && (
                  <p
                    className={`text-xs mt-1.5 ${
                      passwordStrong ? "text-green-400" : "text-white/40"
                    }`}
                  >
                    {passwordStrong
                      ? "Password strength: good"
                      : "At least 8 characters required"}
                  </p>
                )}
              </div>
            )}

            {mode === "signin" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-sm text-accent hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send reset link"}
            </button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="w-full text-sm text-white/40 hover:text-white transition-colors"
              >
                Back to sign in
              </button>
            )}

            {mode !== "forgot" && (
              <>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/10" />
                  <span className="flex-shrink mx-4 text-white/30 text-xs uppercase tracking-wider">
                    or
                  </span>
                  <div className="flex-grow border-t border-white/10" />
                </div>

                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  disabled={loading}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Continue with Google
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
