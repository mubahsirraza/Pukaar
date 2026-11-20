
import { useState } from "react";
import {
  UserRound,
  ShieldCheck,
  LockKeyhole,
  Mail,
  Phone,
  CalendarDays,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function Settings({ user, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [notice, setNotice] = useState(null);

  const showNotice = (type, message) => {
    setNotice({ type, message });

    window.setTimeout(() => {
      setNotice(null);
    }, 4000);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPassword((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    if (!profile.name.trim() || !profile.email.trim()) {
      showNotice("error", "Name and email are required.");
      return;
    }

    if (profile.name.trim().length > 100) {
      showNotice("error", "Name cannot exceed 100 characters.");
      return;
    }

    try {
      setSavingProfile(true);

      const response = await api.patch("/auth/profile", {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
      });

      const updatedUser = response.data.user;

      onUserUpdate(updatedUser);

      setProfile({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
      });

      showNotice(
        "success",
        response.data.message || "Profile updated successfully."
      );
    } catch (error) {
      console.error("Profile update failed:", error);

      showNotice(
        "error",
        error.response?.data?.message ||
          "Unable to update profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (
      !password.currentPassword ||
      !password.newPassword ||
      !password.confirmPassword
    ) {
      showNotice("error", "Please complete all password fields.");
      return;
    }

    if (password.newPassword.length < 8) {
      showNotice(
        "error",
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (password.newPassword.length > 128) {
      showNotice("error", "New password cannot exceed 128 characters.");
      return;
    }

    if (password.newPassword !== password.confirmPassword) {
      showNotice("error", "New passwords do not match.");
      return;
    }

    if (password.currentPassword === password.newPassword) {
      showNotice(
        "error",
        "New password must be different from the current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await api.patch("/auth/change-password", {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showNotice(
        "success",
        response.data.message || "Password changed successfully."
      );
    } catch (error) {
      console.error("Password change failed:", error);

      showNotice(
        "error",
        error.response?.data?.message ||
          "Unable to change password. Please try again."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: UserRound },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "account", label: "Account Information", icon: LockKeyhole },
  ];

  const inputClass =
    "mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-[#10243E] outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass = "text-sm font-medium text-gray-700";

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-[#10243E]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your administrator profile, security and account details.
        </p>
      </div>

      {/* Notification */}
      {notice && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 text-sm ${
            notice.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={19} />
          ) : (
            <AlertCircle size={19} />
          )}

          <span>{notice.message}</span>
        </div>
      )}

      {/* Account summary */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-700">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-[#10243E]">
              {user?.name || "Administrator"}
            </h2>

            <p className="mt-1 break-all text-sm text-gray-500">
              {user?.email}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {user?.role || "ADMIN"}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {user?.isActive ? "Active Account" : "Inactive Account"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings layout */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Navigation */}
        <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-sm lg:col-span-3">
          <div className="flex gap-2 overflow-x-auto lg:flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                    selected
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#10243E]"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7 lg:col-span-9">
          {/* Profile */}
          {activeTab === "profile" && (
            <div>
              <div className="mb-6 border-b border-gray-100 pb-5">
                <h2 className="text-lg font-semibold text-[#10243E]">
                  Personal Information
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update the information associated with your administrator account.
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div>
                  <label className={labelClass}>
                    Full Name
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleProfileChange}
                      maxLength={100}
                      required
                      placeholder="Enter your full name"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      required
                      placeholder="Enter your email"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      placeholder="Enter your phone number"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-gray-100 pt-5">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingProfile ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Save size={17} />
                    )}

                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div>
              <div className="mb-6 border-b border-gray-100 pb-5">
                <h2 className="text-lg font-semibold text-[#10243E]">
                  Password & Security
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Change your password to keep your administrator account secure.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {[
                  {
                    name: "currentPassword",
                    label: "Current Password",
                    key: "current",
                    placeholder: "Enter current password",
                  },
                  {
                    name: "newPassword",
                    label: "New Password",
                    key: "new",
                    placeholder: "Enter new password",
                  },
                  {
                    name: "confirmPassword",
                    label: "Confirm New Password",
                    key: "confirm",
                    placeholder: "Re-enter new password",
                  },
                ].map((field) => (
                  <div key={field.name}>
                    <label className={labelClass}>
                      {field.label}
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type={showPasswords[field.key] ? "text" : "password"}
                        name={field.name}
                        value={password[field.name]}
                        onChange={handlePasswordChange}
                        autoComplete="off"
                        required
                        placeholder={field.placeholder}
                        className={`${inputClass} pr-12 pl-10`}
                      />

                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(field.key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        aria-label={
                          showPasswords[field.key]
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPasswords[field.key] ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-800">
                    Password requirements
                  </p>

                  <ul className="mt-2 space-y-1 text-xs text-blue-700">
                    <li>• Minimum 8 characters</li>
                    <li>• Maximum 128 characters</li>
                    <li>• New password must differ from current password</li>
                    <li>• Confirmation must match the new password</li>
                  </ul>
                </div>

                <div className="flex justify-end border-t border-gray-100 pt-5">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {changingPassword ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={17} />
                    )}

                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Account information */}
          {activeTab === "account" && (
            <div>
              <div className="mb-6 border-b border-gray-100 pb-5">
                <h2 className="text-lg font-semibold text-[#10243E]">
                  Account Information
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  View your account status and registration details.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                    <UserRound size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Account Name</p>
                    <p className="mt-1 break-words text-sm font-semibold text-[#10243E]">
                      {user?.name || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
                  <div className="rounded-lg bg-purple-50 p-3 text-purple-700">
                    <Mail size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Email Address</p>
                    <p className="mt-1 break-all text-sm font-semibold text-[#10243E]">
                      {user?.email || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
                  <div className="rounded-lg bg-green-50 p-3 text-green-700">
                    <ShieldCheck size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Account Role</p>
                    <p className="mt-1 text-sm font-semibold text-[#10243E]">
                      {user?.role || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
                  <div className="rounded-lg bg-orange-50 p-3 text-orange-700">
                    <CalendarDays size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Registration Date</p>
                    <p className="mt-1 text-sm font-semibold text-[#10243E]">
                      {formatDate(user?.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-lg border border-gray-100 p-4">
                  <div className="rounded-lg bg-green-50 p-3 text-green-700">
                    <CheckCircle2 size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Account Status</p>
                    <p className="mt-1 text-sm font-semibold text-[#10243E]">
                      {user?.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-[#10243E]">
                  Administrator Account
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your account has administrator privileges in the Pukaar
                  management portal. Access to administrative functions is
                  controlled by your assigned role.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
