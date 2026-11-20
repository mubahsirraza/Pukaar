
import { useState } from "react";
import {
  ShieldCheck,
  EnvelopeSimple,
  LockKey,
  Eye,
  EyeSlash,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Info,
} from "@phosphor-icons/react";

import api from "../services/api";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      if (!data.success || !data.token || !data.user) {
        throw new Error(data.message || "Unable to sign in.");
      }

      if (data.user.role !== "ADMIN") {
        throw new Error(
          "Access restricted to authorized administrators."
        );
      }

      localStorage.setItem("pukaarToken", data.token);
      localStorage.setItem("pukaarUser", JSON.stringify(data.user));

      onLogin(data.user);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();

    setNotice(
      "Password recovery is not connected yet. Email-based password reset will be enabled when the backend setup is completed."
    );
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setNotice("");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F3F6FB] px-4 py-8 sm:px-6">

      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-blue-200/30 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[520px] w-[520px] rounded-full bg-indigo-200/30 blur-[110px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70" />

      {/* Main authentication card */}
      <div className="relative z-10 grid w-full max-w-[1050px] overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_25px_80px_rgba(16,36,62,0.14)] backdrop-blur-2xl lg:grid-cols-2">

        {/* Left branding panel */}
        <section className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden bg-[#10243E] p-12 text-white lg:flex">

          {/* Decorative shapes */}
          <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-36 -left-24 h-96 w-96 rounded-full bg-[#2563EB]/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-20 right-10 h-40 w-40 rounded-full border border-blue-300/10" />

          {/* Brand */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/15 text-white shadow-lg shadow-black/10 backdrop-blur-xl">
              <ShieldCheck size={29} weight="bold" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h1 className="text-[23px] font-bold leading-tight tracking-[0.13em]">
                PUKAAR
              </h1>

              <p className="text-[10px] font-medium leading-relaxed tracking-[0.17em] text-blue-200/80">
                CIVIC RESPONSE PLATFORM
              </p>
            </div>
          </div>

          {/* Branding content */}
          <div className="relative z-10 max-w-[390px] py-10">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/[0.10] px-5 py-3 text-xs font-semibold tracking-wide text-blue-100 shadow-lg shadow-black/5 backdrop-blur-xl">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
              Administration Portal
            </div>

            <h2 className="text-[42px] font-bold leading-[1.17] tracking-tight">
              Making communities
              <span className="mt-1 block text-blue-300">
                better together.
              </span>
            </h2>

            <p className="mt-7 max-w-[350px] text-[15px] leading-8 text-slate-300">
              Manage civic reports, coordinate departments, and
              monitor community issues through one centralized
              platform.
            </p>

            <div className="mt-11 space-y-5">
              {[
                "Centralized issue management",
                "AI-assisted report classification",
                "Transparent administrative monitoring",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-slate-200"
                >
                  <CheckCircle
                    size={19}
                    weight="fill"
                    className="shrink-0 text-blue-300"
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} Pukaar</span>
            <span>Civic Response Platform</span>
          </div>
        </section>

        {/* Right authentication panel */}
        <section className="flex min-h-[680px] flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">

          <div className="mx-auto w-full max-w-[390px]">

            {/* Mobile branding */}
            <div className="mb-12 flex items-center gap-4 lg:hidden">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#10243E] text-white shadow-lg shadow-blue-950/15">
                <ShieldCheck size={27} weight="bold" />
              </div>

              <div className="flex flex-col gap-1.5">
                <h1 className="text-xl font-bold leading-tight tracking-[0.12em] text-[#10243E]">
                  PUKAAR
                </h1>

                <p className="text-[10px] font-semibold tracking-[0.15em] text-slate-400">
                  CIVIC RESPONSE PLATFORM
                </p>
              </div>
            </div>

            {mode === "login" ? (
              <>
                {/* Login heading */}
                <div className="mb-9">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[2px] text-[#2563EB]">
                    Welcome back
                  </p>

                  <h2 className="text-[32px] font-bold tracking-tight text-[#10243E]">
                    Admin sign in
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Sign in to access your Pukaar administration
                    dashboard.
                  </p>
                </div>

                {/* Login form */}
                <form onSubmit={handleLogin} className="space-y-6">

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="login-email"
                      className="mb-2.5 block text-[13px] font-semibold text-slate-700"
                    >
                      Email address
                    </label>

                    <div className="relative">
                      <EnvelopeSimple
                        size={19}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="login-email"
                        type="email"
                        required
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="h-[54px] w-full rounded-xl border border-slate-200 bg-[#FAFBFD] pl-12 pr-4 text-sm text-[#10243E] outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <label
                        htmlFor="login-password"
                        className="text-[13px] font-semibold text-slate-700"
                      >
                        Password
                      </label>

                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs font-semibold text-[#2563EB] transition hover:text-blue-800"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <LockKey
                        size={19}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="h-[54px] w-full rounded-xl border border-slate-200 bg-[#FAFBFD] pl-12 pr-12 text-sm text-[#10243E] outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeSlash size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600"
                    >
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {loading ? "Signing in..." : "Sign in to dashboard"}

                    {!loading && (
                      <ArrowRight size={18} weight="bold" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* Back */}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="mb-9 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#2563EB]"
                >
                  <ArrowLeft size={17} />
                  Back to sign in
                </button>

                {/* Forgot password heading */}
                <div className="mb-9">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#2563EB] shadow-sm">
                    <LockKey size={28} weight="duotone" />
                  </div>

                  <p className="mb-3 text-xs font-bold uppercase tracking-[2px] text-[#2563EB]">
                    Account assistance
                  </p>

                  <h2 className="text-[32px] font-bold tracking-tight text-[#10243E]">
                    Reset password
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Enter your registered email address to begin
                    recovering access to your account.
                  </p>
                </div>

                {/* Forgot password form */}
                <form
                  onSubmit={handleForgotPassword}
                  className="space-y-6"
                >
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="mb-2.5 block text-[13px] font-semibold text-slate-700"
                    >
                      Registered email address
                    </label>

                    <div className="relative">
                      <EnvelopeSimple
                        size={19}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="forgot-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setNotice("");
                        }}
                        placeholder="admin@example.com"
                        className="h-[54px] w-full rounded-xl border border-slate-200 bg-[#FAFBFD] pl-12 pr-4 text-sm text-[#10243E] outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>

                  {notice && (
                    <div
                      role="status"
                      className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800"
                    >
                      <Info
                        size={20}
                        className="mt-0.5 shrink-0"
                      />
                      <p>{notice}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-blue-600/30"
                  >
                    Continue
                    <ArrowRight size={18} weight="bold" />
                  </button>
                </form>
              </>
            )}

            {/* Footer */}
            <div className="mt-11 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
                <ShieldCheck size={16} />
                Secure administrator authentication
              </div>

              <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                Pukaar · Civic Issue Reporting and Management System
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
