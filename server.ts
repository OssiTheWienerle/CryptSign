import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large Base64 image payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Real HTTP download proxy endpoint
  app.post("/api/download", (req, res) => {
    try {
      const { imageData, filename } = req.body;
      if (!imageData) {
        return res.status(400).send("No image data provided");
      }

      // Check structure
      const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).send("Invalid image format. Must be base64 data URL.");
      }

      const fileBuffer = Buffer.from(matches[2], "base64");
      const safeFilename = filename || `cryptsign_${Date.now()}.png`;

      // Return proper attachment headers to bypass iframe / phone download limitations
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", fileBuffer.length);
      res.end(fileBuffer);
    } catch (error) {
      console.error("Server-side download error:", error);
      res.status(500).send("Server download failed");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
