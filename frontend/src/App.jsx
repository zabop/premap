import React, { useState, useEffect } from "react";
import Image from "./image";

const auth = window.osmAuth.osmAuth({
  client_id: "PhLZXTAu0XSAftdw4ksVZoolXTJSV20l4B5GYqqK3jk",
  scope: "read_prefs",
  redirect_uri: `${window.location.origin}/premap/land.html`,
  singlepage: false,
});

export default function App() {
  const [user, setUser] = useState(null);
  const [instructions, setInstructions] = useState(
    "Log in and you'll get an image to click on."
  );

  // Function to fetch user details using the auth.xhr method provided by osmAuth
  function fetchUserDetails() {
    auth.xhr({ method: "GET", path: "/api/0.6/user/details" }, (err, res) => {
      if (err) {
        setInstructions("Failed to fetch user details");
        return;
      }

      const userEl = res.getElementsByTagName("user")[0];
      const name = userEl.getAttribute("display_name");

      setUser({
        name: name,
        id: userEl.getAttribute("id"),
      });
      setInstructions(`Authenticated: ${name}`);
    });
  }

  // Process auth on component mount if the URL has the authorization code.
  useEffect(() => {
    if (
      window.location.search.includes("code=") &&
      !auth.authenticated() &&
      !user &&
      !instructions
    ) {
      auth.authenticate(() => {
        // Remove the auth code from the URL for a cleaner history entry.
        window.history.pushState({}, null, window.location.pathname);
        fetchUserDetails();
      });
    }
  }, []); // Run on mount only

  function handleLogin() {
    auth.authenticate(() => fetchUserDetails());
  }

  function handleLogout() {
    auth.logout();
    setUser(null);
    setInstructions("Logged out.");
  }

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleLogout}>Logout</button>

      {instructions && <> {instructions} </>}

      {user && <Image />}
    </div>
  );
}
