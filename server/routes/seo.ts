
import { Router } from "express";
import { SEOManager } from "../lib/seo-manager.js";
import { StructuredDataManager } from "../lib/structured-data.js";
import { db } from "../db.js";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Get active SEO strategy
router.get("/seo-strategies/active", async (req, res) => {
  try {
    const activeStrategies = await db
      .select()
      .from(schema.seoStrategiesTable)
      .where(eq(schema.seoStrategiesTable.isActive, true))
      .limit(1);

    if (activeStrategies.length === 0) {
      return res.status(404).json({ error: "No active SEO strategy found" });
    }

    res.json(activeStrategies[0]);
  } catch (error) {
    console.error("Error fetching active SEO strategy:", error);
    res.status(500).json({ error: "Failed to fetch active SEO strategy" });
  }
});

// Get all SEO strategies
router.get("/seo-strategies", async (req, res) => {
  try {
    const strategies = await db.select().from(schema.seoStrategiesTable);
    res.json(strategies);
  } catch (error) {
    console.error("Error fetching SEO strategies:", error);
    res.status(500).json({ error: "Failed to fetch SEO strategies" });
  }
});

// Create or update SEO strategy
router.post("/seo-strategies", async (req, res) => {
  try {
    const { id, name, description, isActive, sections } = req.body;
    
    if (id) {
      // Update existing strategy
      await db
        .update(schema.seoStrategiesTable)
        .set({
          name,
          description,
          isActive,
          sections,
          updatedAt: new Date(),
        })
        .where(eq(schema.seoStrategiesTable.id, id));
        
      res.json({ message: "SEO strategy updated successfully", id });
    } else {
      // Create new strategy
      const [newStrategy] = await db.insert(schema.seoStrategiesTable).values({
        name,
        description,
        isActive: isActive || false,
        sections,
      }).returning({ id: schema.seoStrategiesTable.id });
      
      res.json({ message: "SEO strategy created successfully", id: newStrategy.id });
    }

    // Clear SEO cache after update
    SEOManager.clearCache();
  } catch (error) {
    console.error("Error saving SEO strategy:", error);
    res.status(500).json({ error: "Failed to save SEO strategy" });
  }
});

// Activate SEO strategy
router.post("/seo-strategies/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Deactivate all strategies
    await db
      .update(schema.seoStrategiesTable)
      .set({ isActive: false, updatedAt: new Date() });
    
    // Activate selected strategy
    await db
      .update(schema.seoStrategiesTable)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(schema.seoStrategiesTable.id, id));
    
    // Clear SEO cache
    SEOManager.clearCache();
    
    res.json({ message: "SEO strategy activated successfully" });
  } catch (error) {
    console.error("Error activating SEO strategy:", error);
    res.status(500).json({ error: "Failed to activate SEO strategy" });
  }
});

// Generate meta tags for specific section
router.get("/seo/meta/:section", async (req, res) => {
  try {
    const { section } = req.params;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    
    const metaTags = await SEOManager.generateMetaTags(section, baseUrl);
    
    res.setHeader("Content-Type", "text/html");
    res.send(metaTags);
  } catch (error) {
    console.error("Error generating meta tags:", error);
    res.status(500).json({ error: "Failed to generate meta tags" });
  }
});

// SEO audit endpoint
router.get("/seo/audit", async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    
    const auditResults = {
      pages: [
        { url: baseUrl, section: "home" },
        { url: `${baseUrl}/properties`, section: "properties" },
        { url: `${baseUrl}/ai-valuation`, section: "ai-valuation" },
        { url: `${baseUrl}/kontakt`, section: "contact" },
      ],
      seo: {
        activeSEOStrategy: await SEOManager.getActiveSEO("home"),
        issues: [],
        recommendations: [
          "Implementieren Sie strukturierte Daten für Immobilien",
          "Optimieren Sie Ladezeiten für bessere Core Web Vitals",
          "Fügen Sie lokale SEO-Optimierungen für Bodensee-Region hinzu"
        ]
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(auditResults);
  } catch (error) {
    console.error("Error performing SEO audit:", error);
    res.status(500).json({ error: "Failed to perform SEO audit" });
  }
});

// Structured data endpoints
router.get("/structured-data/property/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    
    const structuredData = await StructuredDataManager.generatePropertyStructuredData(id, baseUrl);
    
    res.setHeader("Content-Type", "application/ld+json");
    res.send(structuredData);
  } catch (error) {
    console.error("Error generating property structured data:", error);
    res.status(500).json({ error: "Failed to generate structured data" });
  }
});

router.get("/structured-data/organization", async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    
    const structuredData = await StructuredDataManager.generateOrganizationStructuredData(baseUrl);
    
    res.setHeader("Content-Type", "application/ld+json");
    res.send(structuredData);
  } catch (error) {
    console.error("Error generating organization structured data:", error);
    res.status(500).json({ error: "Failed to generate structured data" });
  }
});

router.get("/structured-data/breadcrumb", async (req, res) => {
  try {
    const { path } = req.query;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    
    // Generate breadcrumbs based on path
    const breadcrumbs = [
      { name: "Home", url: baseUrl }
    ];
    
    if (path === "/properties") {
      breadcrumbs.push({ name: "Immobilien", url: `${baseUrl}/properties` });
    } else if (path === "/ai-valuation") {
      breadcrumbs.push({ name: "AI-Bewertung", url: `${baseUrl}/ai-valuation` });
    } else if (path === "/kontakt") {
      breadcrumbs.push({ name: "Kontakt", url: `${baseUrl}/kontakt` });
    }
    
    const structuredData = StructuredDataManager.generateBreadcrumbStructuredData(breadcrumbs);
    
    res.setHeader("Content-Type", "application/ld+json");
    res.send(structuredData);
  } catch (error) {
    console.error("Error generating breadcrumb structured data:", error);
    res.status(500).json({ error: "Failed to generate structured data" });
  }
});

export default router;
