import React from "react";
import { Link } from "wouter";

export const AdminLogin = (): JSX.Element => {
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get("error");

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-[#f5f8fb] flex">
      {/* Left Sidebar */}
      <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-2 gap-6">
        <Link
          href="/"
          className="w-12 h-12 flex items-center justify-center text-white text-lg font-bold"
        >
          <img src="/figmaAssets/logo-admin.png" alt="Logo" className="w-10 h-10 object-contain" />
        </Link>
        <nav className="flex flex-col items-center w-full gap-4 text-gray-500 text-xl">
          <span className="w-full h-14 flex items-center justify-center">
            <img src="/figmaAssets/home1.png" alt="Home" className="w-5 h-5 object-contain" />
          </span>
          <span className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/figmaAssets/notifications.png" alt="Notifications" className="w-5 h-5 object-contain" />
          </span>
          <span className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/figmaAssets/security.png" alt="Security" className="w-5 h-5 object-contain" />
          </span>
          <span className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/figmaAssets/user.png" alt="User" className="w-5 h-5 object-contain" />
          </span>
          <span className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/figmaAssets/notifications.png" alt="Notifications" className="w-5 h-5 object-contain" />
          </span>
          <span className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/figmaAssets/setting.png" alt="Settings" className="w-5 h-5 object-contain" />
          </span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="w-5 h-5 text-[#00b7ff]">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" stroke="#00b7ff" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" stroke="#00b7ff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
                <p className="text-gray-600">Sign in to access the admin panel</p>
              </div>

              {error === "auth_failed" && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">Authentication failed. Please try again.</p>
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
