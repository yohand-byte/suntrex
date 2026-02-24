// SUNTREX — Google OAuth: Callback handler
// Exchanges authorization code for tokens, fetches user profile, redirects to frontend

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  // Handle errors from Google
  if (error) {
    return res.redirect(302, `/?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(302, "/?auth_error=no_code");
  }

  // Verify CSRF state
  const cookies = parseCookies(req.headers.cookie || "");
  if (!cookies.oauth_state || cookies.oauth_state !== state) {
    return res.redirect(302, "/?auth_error=invalid_state");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `https://${req.headers.host}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return res.redirect(302, "/?auth_error=server_config");
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Token exchange failed:", err);
      return res.redirect(302, "/?auth_error=token_exchange");
    }

    const tokens = await tokenRes.json();

    // Fetch user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileRes.ok) {
      return res.redirect(302, "/?auth_error=profile_fetch");
    }

    const profile = await profileRes.json();

    // Build user data object
    // In production: store in DB, create session, issue JWT
    const userData = {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      googleId: profile.id,
      emailVerified: profile.verified_email,
      provider: "google",
    };

    // Encode user data in URL (temporary — production uses JWT cookie)
    const encodedUser = encodeURIComponent(JSON.stringify(userData));

    // Clear the CSRF cookie
    res.setHeader("Set-Cookie", "oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");

    // Redirect to frontend with user data
    res.redirect(302, `/?google_auth=${encodedUser}`);

  } catch (err) {
    console.error("OAuth callback error:", err);
    return res.redirect(302, "/?auth_error=server_error");
  }
}

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  });
  return cookies;
}
