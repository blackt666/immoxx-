import { Router } from "express";

const router = Router();

router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/properties</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/ai-valuation</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/kontakt</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;

    // Add property pages with enhanced metadata
    try {
      const { db } = await import("../db.js");
      const { propertiesTable } = await import("../../shared/schema.js");
      const properties = await db.select().from(propertiesTable);

      properties.forEach((property) => {
        sitemap += `  <url>
    <loc>${baseUrl}/immobilien/${property.id}</loc>
    <lastmod>${property.updatedAt ? new Date(property.updatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${baseUrl}/api/gallery/${property.id}/image</image:loc>
      <image:title>${property.title}</image:title>
      <image:caption>${property.description?.substring(0, 100) || property.title}</image:caption>
    </image:image>
  </url>
`;
      });
    } catch (error) {
      console.warn("Could not load properties for sitemap:", error);
    }

    // Add AI valuation tool
    sitemap += `  <url>
    <loc>${baseUrl}/bewertung</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
`;

    // Add legal pages
    const legalPages = ["impressum", "datenschutz", "agb", "widerrufsrecht"];
    legalPages.forEach((page) => {
      sitemap += `  <url>
    <loc>${baseUrl}/${page}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
`;
    });

    sitemap += `</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

export default router;
