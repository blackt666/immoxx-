
import { Router } from "express";
import { SEOManager } from "../lib/seo-manager.js";
import { StructuredDataManager } from "../lib/structured-data.js";

const router = Router();

// NOTE: seoStrategiesTable doesn't exist in schema

router.get("/seo-strategies/active", async (req, res) => {
  try {
    const defaultStrategy = {
      id: 1,
      name: "Default Strategy",
      isActive: true,
      sections: JSON.stringify({
        home: await SEOManager.getActiveSEO("home"),
        properties: await SEOManager.getActiveSEO("properties")
      })
    };
    res.json(defaultStrategy);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch SEO strategy" });
  }
});

router.get("/seo-strategies", async (req, res) => {
  try {
    res.json([{ id: 1, name: "Default Strategy", isActive: true }]);
  } catch {
    res.status(500).json({ error: "Failed to fetch strategies" });
  }
});

router.post("/seo-strategies", async (req, res) => {
  try {
    res.json({ message: "Acknowledged", id: req.body.id || 1 });
  } catch {
    res.status(500).json({ error: "Failed to save strategy" });
  }
});

router.post("/seo-strategies/:id/activate", async (req, res) => {
  try {
    res.json({ message: "Activated (using defaults)" });
  } catch {
    res.status(500).json({ error: "Failed to activate" });
  }
});

router.get("/seo/meta/:section", async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const metaTags = await SEOManager.generateMetaTags(req.params.section, baseUrl);
    res.setHeader("Content-Type", "text/html");
    res.send(metaTags);
  } catch {
    res.status(500).json({ error: "Failed to generate meta tags" });
  }
});

router.get("/structured-data/property/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const data = await StructuredDataManager.generatePropertyStructuredData(id, baseUrl);
    res.setHeader("Content-Type", "application/ld+json");
    res.send(data);
  } catch {
    res.status(500).json({ error: "Failed to generate structured data" });
  }
});

router.get("/structured-data/organization", async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const data = await StructuredDataManager.generateOrganizationStructuredData(baseUrl);
    res.setHeader("Content-Type", "application/ld+json");
    res.send(data);
  } catch {
    res.status(500).json({ error: "Failed to generate structured data" });
  }
});

export default router;
