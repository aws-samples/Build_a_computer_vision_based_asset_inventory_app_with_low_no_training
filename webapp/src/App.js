import * as React from "react";
import { Amplify } from "aws-amplify";
import { ThemeProvider, useTheme } from "@aws-amplify/ui-react";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import CameraComponent from "./Camera/CameraComponent";
import amplifyconfig from "./amplifyconfiguration.json";

Amplify.configure(amplifyconfig);

function App() {
  const { tokens } = useTheme();

  return (
    <ThemeProvider>
      <CameraComponent />
    </ThemeProvider>
  );
}

export default withAuthenticator(App);
