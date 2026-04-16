// app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // Start at face login; inside that screen we redirect to tabs after success
  return <Redirect href="/face-login" />;
}
