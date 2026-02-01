import { redirect } from "react-router-dom";

const TOKEN_KEY = "poco_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const requireAuth = () => {
  const token = getToken();
  if (!token) {
    throw redirect("/login");
  }
  return null;
};

export const redirectIfAuthenticated = () => {
  const token = getToken();
  if (token) {
    throw redirect("/");
  }
  return null;
};
