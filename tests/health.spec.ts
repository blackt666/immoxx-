import { test, expect, request } from "@playwright/test";

test("health endpoint becomes ready", async () => {
  const baseURL =
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
  const api = await request.newContext();
  let ready = false;
  const started = Date.now();

  while (Date.now() - started < 15000) {
    try {
      const res = await api.get(`${baseURL}/api/health`);
      if (res.ok()) {
        const data = await res.json();
        console.log("Health check response:", data);
        if (data?.ready === true) {
          ready = true;
          break;
        }
      }
    } catch (error) {
      console.log("Health check error:", error.message);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  expect(ready).toBeTruthy();
});

test("health endpoint structure", async () => {
  const baseURL =
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
  const api = await request.newContext();

  const res = await api.get(`${baseURL}/api/health`);
  expect(res.ok()).toBeTruthy();

  const data = await res.json();
  expect(data).toHaveProperty("status");
  expect(data).toHaveProperty("ready");
  expect(data).toHaveProperty("timestamp");
  expect(data).toHaveProperty("port");
  expect(data).toHaveProperty("host");
});
