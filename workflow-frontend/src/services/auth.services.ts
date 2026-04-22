export async function loginService(email: string, password: string) {
  const res = await fetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  return res.json();
}

export async function getMeService() {
  const res = await fetch("/api/me");

  if (!res.ok) return null;

  return res.json();
}

export async function logoutService() {
  await fetch("/api/logout", { method: "POST" });
}