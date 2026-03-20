import { useState, useRef } from "react";
import { TextField, useTheme, useMediaQuery } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Formik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setLogin } from "state";
import Dropzone from "react-dropzone";
import FlexBetween from "components/FlexBetween";
import API_BASE_URL from "config";

const registerSchema = yup.object().shape({
  firstName: yup.string().required("required"),
  lastName: yup.string().required("required"),
  email: yup.string().email("invalid email").required("required"),
  password: yup.string().required("required"),
  location: yup.string().required("required"),
  occupation: yup.string().required("required"),
  picture: yup.string().required("required"),
});

const loginSchema = yup.object().shape({
  email: yup.string().email("invalid email").required("required"),
  password: yup.string().required("required"),
});

const initialValuesRegister = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  location: "",
  occupation: "",
  picture: "",
};

const initialValuesLogin = {
  email: "",
  password: "",
};

/* Shared styled TextField override */
const darkFieldSx = {
  "& .MuiInputBase-root": {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    color: "#fff",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.12)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(0,229,255,0.4)",
  },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#00e5ff !important",
    borderWidth: "1px !important",
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#00e5ff" },
  "& .MuiFormHelperText-root": { color: "rgba(239,68,68,0.8)" },
};

/* ── Forgot Password inline widget ─────────────────────────── */
const ForgotPasswordLink = () => {
  const [open,    setOpen]    = useState(false);
  const [email,   setEmail]   = useState("");
  const [status,  setStatus]  = useState("idle"); // idle | loading | sent | error
  const [msg,     setMsg]     = useState("");

  const handleSend = async () => {
    if (!email.trim()) return;
    setStatus("loading");
    setMsg("");
    try {
      const res  = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setStatus("sent");
      setMsg(data.message || "Reset link sent!");
    } catch {
      setStatus("error");
      setMsg("Network error. Please try again.");
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ background: "none", border: "none", color: "rgba(0,229,255,0.7)", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}
      >
        Forgot password?
      </button>
    );
  }

  return (
    <div style={{ marginTop: "4px", padding: "14px 16px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", marginBottom: "10px" }}>
        Enter your account email and we'll send a reset link.
      </p>
      {status === "sent" ? (
        <p style={{ color: "#4ade80", fontSize: "0.82rem" }}>✅ {msg}</p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            style={{
              width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", marginBottom: "8px",
            }}
          />
          {msg && <p style={{ color: "#f87171", fontSize: "0.78rem", marginBottom: "6px" }}>{msg}</p>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button" onClick={handleSend} disabled={status === "loading"}
              style={{ flex: 1, padding: "8px", borderRadius: "999px", border: "none", background: "linear-gradient(135deg,#00e5ff,#0077ff)", color: "#000", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
            >
              {status === "loading" ? "Sending…" : "Send Reset Link"}
            </button>
            <button
              type="button" onClick={() => { setOpen(false); setEmail(""); setStatus("idle"); setMsg(""); }}
              style={{ padding: "8px 14px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.15)", background: "none", color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const Form = ({ pageType, setPageType }) => {
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const isLogin = pageType === "login";
  const isRegister = pageType === "register";

  const register = async (values, onSubmitProps) => {
    setErrorMsg("");
    const formData = new FormData();
    for (let value in values) formData.append(value, values[value]);
    formData.append("picturePath", values.picture.name);

    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      body: formData,
    });
    const savedUser = await res.json();
    onSubmitProps.resetForm();
    if (savedUser) setPageType("login");
  };

  const login = async (values, onSubmitProps) => {
    setErrorMsg("");
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const loggedIn = await res.json();
    onSubmitProps.resetForm();
    if (loggedIn.token) {
      dispatch(setLogin({ user: loggedIn.user, token: loggedIn.token }));
      navigate("/home");
    } else {
      setErrorMsg(loggedIn.msg || "Invalid credentials. Please try again.");
    }
  };

  const handleFormSubmit = async (values, onSubmitProps) => {
    setLoading(true);
    try {
      if (isLogin) await login(values, onSubmitProps);
      if (isRegister) await register(values, onSubmitProps);
    } catch (e) {
      setErrorMsg("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Formik
      onSubmit={handleFormSubmit}
      initialValues={isLogin ? initialValuesLogin : initialValuesRegister}
      validationSchema={isLogin ? loginSchema : registerSchema}
      enableReinitialize
    >
      {({
        values,
        errors,
        touched,
        handleBlur,
        handleChange,
        handleSubmit,
        setFieldValue,
        resetForm,
      }) => (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gap: "16px",
              gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            }}
          >
            {isRegister && (
              <>
                <TextField
                  label="First Name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.firstName}
                  name="firstName"
                  error={Boolean(touched.firstName) && Boolean(errors.firstName)}
                  helperText={touched.firstName && errors.firstName}
                  sx={{ ...darkFieldSx, gridColumn: "span 2" }}
                  size="small"
                />
                <TextField
                  label="Last Name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.lastName}
                  name="lastName"
                  error={Boolean(touched.lastName) && Boolean(errors.lastName)}
                  helperText={touched.lastName && errors.lastName}
                  sx={{ ...darkFieldSx, gridColumn: "span 2" }}
                  size="small"
                />
                <TextField
                  label="Location"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.location}
                  name="location"
                  error={Boolean(touched.location) && Boolean(errors.location)}
                  helperText={touched.location && errors.location}
                  sx={{ ...darkFieldSx, gridColumn: "span 4" }}
                  size="small"
                />
                <TextField
                  label="Occupation"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.occupation}
                  name="occupation"
                  error={Boolean(touched.occupation) && Boolean(errors.occupation)}
                  helperText={touched.occupation && errors.occupation}
                  sx={{ ...darkFieldSx, gridColumn: "span 4" }}
                  size="small"
                />

                {/* Dropzone */}
                <div style={{ gridColumn: "span 4" }}>
                  <Dropzone
                    acceptedFiles=".jpg,.jpeg,.png"
                    multiple={false}
                    onDrop={(acceptedFiles) => setFieldValue("picture", acceptedFiles[0])}
                  >
                    {({ getRootProps, getInputProps }) => (
                      <div
                        {...getRootProps()}
                        className="border border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-cyan-400/50 transition-colors"
                        style={{ background: "rgba(255,255,255,0.03)" }}
                      >
                        <input {...getInputProps()} />
                        {!values.picture ? (
                          <div className="flex flex-col items-center justify-center gap-1 text-white/40 text-sm py-1">
                            <span className="text-2xl">📷</span>
                            <span>Drop a profile photo here, or click to browse</span>
                          </div>
                        ) : (
                          <FlexBetween>
                            <span className="text-white/70 text-sm">{values.picture.name}</span>
                            <EditOutlinedIcon sx={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }} />
                          </FlexBetween>
                        )}
                      </div>
                    )}
                  </Dropzone>
                </div>
              </>
            )}

            <TextField
              label="Email"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.email}
              name="email"
              error={Boolean(touched.email) && Boolean(errors.email)}
              helperText={touched.email && errors.email}
              sx={{ ...darkFieldSx, gridColumn: "span 4" }}
              size="small"
              inputProps={{ autoComplete: "email" }}
            />
            <TextField
              label="Password"
              type="password"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.password}
              name="password"
              error={Boolean(touched.password) && Boolean(errors.password)}
              helperText={touched.password && errors.password}
              sx={{ ...darkFieldSx, gridColumn: "span 4" }}
              size="small"
              inputProps={{ autoComplete: isLogin ? "current-password" : "new-password" }}
            />

            {/* Forgot password link — login mode only */}
            {isLogin && (
              <div style={{ gridColumn: "span 4", textAlign: "right" }}>
                <ForgotPasswordLink />
              </div>
            )}
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="mt-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {errorMsg}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full py-3 rounded-full font-bold text-sm transition-all duration-200 disabled:opacity-60"
            style={{
              background: loading
                ? "rgba(255,255,255,0.1)"
                : "linear-gradient(135deg, #00e5ff, #0077ff)",
              color: loading ? "rgba(255,255,255,0.5)" : "#000",
              boxShadow: loading ? "none" : "0 0 24px rgba(0,229,255,0.3)",
            }}
          >
            {loading
              ? "Please wait…"
              : isLogin
              ? "Sign In →"
              : "Create Account →"}
          </button>
        </form>
      )}
    </Formik>
  );
};

export default Form;