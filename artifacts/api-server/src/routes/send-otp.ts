import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/send-otp", async (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !code || code.length !== 4) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const apiKey = process.env["VITE_RESEND_API_KEY"];

  if (!apiKey) {
    req.log.error("VITE_RESEND_API_KEY is not set");
    res.status(500).json({ error: "Email service not configured" });
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Your SpaceX Portal Access Code",
        html: `
          <div style="font-family:Arial,sans-serif;background:#050505;color:#fff;padding:40px;text-align:center;border-radius:12px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2e/SpaceX_logo_black.svg"
                 style="filter:brightness(0) invert(1);width:120px;margin-bottom:32px;" alt="SpaceX"/>
            <h2 style="font-size:18px;font-weight:600;margin-bottom:8px;letter-spacing:-0.02em;">Your access code</h2>
            <p style="color:#a1a1aa;font-size:13px;margin-bottom:28px;">Use this code to sign in to the SpaceX Member Portal. It expires in 10 minutes.</p>
            <div style="font-family:'Courier New',monospace;font-size:48px;font-weight:700;letter-spacing:16px;margin:0 auto 28px;">${code}</div>
            <p style="color:#52525b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">SpaceX HQ &mdash; Restricted Access</p>
          </div>
        `,
      }),
    });

    const data = (await response.json()) as { id?: string; message?: string };

    if (!response.ok) {
      req.log.error({ status: response.status, data }, "Resend API error");
      res.status(502).json({ error: data.message ?? "Failed to send email" });
      return;
    }

    res.json({ ok: true, id: data.id });
  } catch (err) {
    req.log.error({ err }, "Failed to call Resend API");
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
