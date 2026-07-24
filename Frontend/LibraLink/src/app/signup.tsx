import { useLocalSearchParams } from "expo-router";
import SignupScreen, { SignupRole } from "../components/auth/SignupScreen";

function parseInitialRole(role?: string): SignupRole | null {
  if (role === "student" || role === "lecturer") {
    return role;
  }
  return null;
}

export default function SignUp() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  return <SignupScreen initialRole={parseInitialRole(role)} />;
}
