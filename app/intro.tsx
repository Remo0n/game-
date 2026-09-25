import { Redirect, useLocalSearchParams } from "expo-router";

// Keep existing level links working without an extra confirmation screen.
export default function IntroScreen() {
  const params = useLocalSearchParams<{
    source?: string;
    level?: string;
    variation?: string;
    date?: string;
  }>();
  return <Redirect href={{ pathname: "/play", params }} />;
}
