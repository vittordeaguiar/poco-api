export const verifyLogin = (apiKey: string | undefined, password: string) => {
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      message: "API_KEY not configured"
    };
  }

  if (password !== apiKey) {
    return {
      ok: false,
      status: 401,
      message: "Invalid credentials"
    };
  }

  return { ok: true as const, token: apiKey };
};
