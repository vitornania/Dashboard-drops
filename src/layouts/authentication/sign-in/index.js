import { useEffect, useState } from "react";
import { Redirect, useHistory } from "react-router-dom";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";
import VuiSwitch from "components/VuiSwitch";
import GradientBorder from "examples/GradientBorder";

import radialGradient from "assets/theme/functions/radialGradient";
import palette from "assets/theme/base/colors";
import borders from "assets/theme/base/borders";
import CoverLayout from "layouts/authentication/components/CoverLayout";
import bgSignIn from "assets/images/signInImage.png";
import { useAuth } from "context/AuthContext";

function SignIn() {
  const { signIn, session, isConfigured } = useAuth();
  const history = useHistory();
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState(() => localStorage.getItem("dropship_ops_email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (rememberMe) {
      const saved = localStorage.getItem("dropship_ops_email");
      if (saved) setEmail(saved);
    }
  }, [rememberMe]);

  if (session) return <Redirect to="/revenue" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (!isConfigured) throw new Error("Supabase is not configured. Add env vars from .env.example");
      await signIn(email, password);
      if (rememberMe) localStorage.setItem("dropship_ops_email", email);
      else localStorage.removeItem("dropship_ops_email");
      history.replace("/revenue");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CoverLayout
      title="Dropship Ops"
      color="white"
      description="Sign in with your team account"
      premotto="PRIVATE DASHBOARD:"
      motto="REVENUE · WHITEBOARD · TEAM"
      image={bgSignIn}
    >
      <VuiBox component="form" role="form" onSubmit={handleSubmit}>
        {error && (
          <VuiBox mb={2} p={2} borderRadius="lg" sx={{ backgroundColor: "rgba(227,26,26,0.15)" }}>
            <VuiTypography color="error">{error}</VuiTypography>
          </VuiBox>
        )}
        <VuiBox mb={2}>
          <VuiBox mb={1} ml={0.5}>
            <VuiTypography component="label" variant="button" color="white" fontWeight="medium">
              Email
            </VuiTypography>
          </VuiBox>
          <GradientBorder
            minWidth="100%"
            padding="1px"
            borderRadius={borders.borderRadius.lg}
            backgroundImage={radialGradient(
              palette.gradients.borderLight.main,
              palette.gradients.borderLight.state,
              palette.gradients.borderLight.angle
            )}
          >
            <VuiInput type="email" placeholder="Your email..." value={email} onChange={(e) => setEmail(e.target.value)} required />
          </GradientBorder>
        </VuiBox>
        <VuiBox mb={2}>
          <VuiBox mb={1} ml={0.5}>
            <VuiTypography component="label" variant="button" color="white" fontWeight="medium">
              Password
            </VuiTypography>
          </VuiBox>
          <GradientBorder
            minWidth="100%"
            borderRadius={borders.borderRadius.lg}
            padding="1px"
            backgroundImage={radialGradient(
              palette.gradients.borderLight.main,
              palette.gradients.borderLight.state,
              palette.gradients.borderLight.angle
            )}
          >
            <VuiInput type="password" placeholder="Your password..." value={password} onChange={(e) => setPassword(e.target.value)} required />
          </GradientBorder>
        </VuiBox>
        <VuiBox display="flex" alignItems="center">
          <VuiSwitch color="info" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
          <VuiTypography variant="caption" color="white" fontWeight="medium" sx={{ cursor: "pointer", userSelect: "none" }} onClick={() => setRememberMe(!rememberMe)}>
            &nbsp;&nbsp;&nbsp;&nbsp;Remember me
          </VuiTypography>
        </VuiBox>
        <VuiBox mt={4} mb={1}>
          <VuiButton color="info" fullWidth type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "SIGN IN"}
          </VuiButton>
        </VuiBox>
        <VuiBox mt={3} textAlign="center">
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Accounts are created in Supabase — no public signup.
          </VuiTypography>
        </VuiBox>
      </VuiBox>
    </CoverLayout>
  );
}

export default SignIn;
