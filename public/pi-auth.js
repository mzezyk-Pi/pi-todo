// Pi sign-in: authenticate in the browser, then exchange the access token with
// App Studio. Only the identity App Studio returns is trusted.
(function (root) {
  const LOGIN_URL = 'https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login';

  async function signIn(Pi, fetchFn) {
    await Pi.init({ version: '2.0' });
    const auth = await Pi.authenticate(['username'], () => {});
    const res = await fetchFn(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: auth.accessToken })
    });
    if (!res.ok) throw new Error('App Studio login failed: ' + res.status);
    const data = await res.json();
    if (!data || !data.user || !data.user.uid) throw new Error('App Studio login returned no user');
    return { sessionToken: data.sessionToken, user: { uid: data.user.uid, username: data.user.username } };
  }

  root.PiAuth = { signIn, LOGIN_URL };
})(typeof window !== 'undefined' ? window : globalThis);
