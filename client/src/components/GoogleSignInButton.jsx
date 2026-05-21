import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { setCredentials } from "../store/slices/authSlice";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.003 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.003 0-9.603-3.343-11.283-8.181l-6.571 4.819C9.656 39.663 16.318 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c1.649 4.657 6.675 8 11.697 8 3.059 0 5.842-1.154 7.961-3.039l5.657-5.657C42.488 32.783 44 28.771 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

function GoogleButtonFace() {
  return (
    <div className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-slate-800 font-medium text-sm border border-white/10 shadow-sm pointer-events-none select-none">
      <GoogleIcon />
      Continue with Google
    </div>
  );
}

const setupMessage =
  "Google sign-in needs a Client ID. Add VITE_GOOGLE_CLIENT_ID to client/.env and GOOGLE_CLIENT_ID to server/.env (same value from Google Cloud Console), then restart both servers.";

export default function GoogleSignInButton() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  const handleSuccess = async (credentialResponse) => {
    try {
      const { data } = await api.post("/auth/google", {
        credential: credentialResponse.credential
      });
      dispatch(
        setCredentials({
          user: { _id: data._id, name: data.name, email: data.email, role: data.role, avatar: data.avatar },
          token: data.token
        })
      );
      toast.success("Signed in with Google!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google sign-in failed");
    }
  };

  if (!clientId) {
    return (
      <button
        type="button"
        onClick={() => toast.error(setupMessage, { duration: 6000 })}
        className="w-full"
        title="Google OAuth not configured"
      >
        <GoogleButtonFace />
      </button>
    );
  }

  return (
    <div className="relative w-full min-h-[48px]">
      <GoogleButtonFace />
      <div className="absolute inset-0 z-10 opacity-0 overflow-hidden cursor-pointer [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => toast.error("Google sign-in was cancelled or failed")}
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          width={400}
        />
      </div>
    </div>
  );
}
