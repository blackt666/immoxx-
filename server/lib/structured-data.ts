
import { db } from "../db.js";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

export interface StructuredDataProperty {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  address: {
    "@type": string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    "@type": string;
    latitude: number;
    longitude: number;
  };
  offers: {
    "@type": string;
    price: string;
    priceCurrency: string;
    availability: string;
  };
  floorSize?: {
    "@type": string;
    value: number;
    unitCode: string;
  };
  numberOfRooms?: number;
  yearBuilt?: number;
  image?: string[];
  url: string;
}

export class StructuredDataManager {
  static async generatePropertyStructuredData(propertyId: string, baseUrl: string): Promise<string> {
    try {
      const properties = await db
        .select()
        .from(schema.properties)
        .where(eq(schema.properties.id, propertyId))
        .limit(1);

      if (properties.length === 0) {
        return "";
      }

      const property = properties[0];
      
      const structuredData: StructuredDataProperty = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: property.title,
        description: property.description || "",
        address: {
          "@type": "PostalAddress",
          streetAddress: property.address || "",
          addressLocality: this.extractCity(property.address || ""),
          addressRegion: "Baden-Württemberg",
          postalCode: this.extractPostalCode(property.address || ""),
          addressCountry: "DE"
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 47.6779, // Bodensee region
          longitude: 9.1732
        },
        offers: {
          "@type": "Offer",
          price: property.price?.toString() || "0",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock"
        },
        url: `${baseUrl}/properties/${property.id}`
      };

      // Add optional fields
      if (property.size) {
        structuredData.floorSize = {
          "@type": "QuantitativeValue",
          value: property.size,
          unitCode: "MTK"
        };
      }

      if (property.rooms) {
        structuredData.numberOfRooms = property.rooms;
      }

      // Note: yearBuilt field not available in current schema

      // Add images if available
      if (property.images && property.images.length > 0) {
        structuredData.image = property.images.map(img => `${baseUrl}${img}`);
      }

      return `<script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
</script>`;

    } catch (error) {
      console.error("Error generating structured data:", error);
      return "";
    }
  }

  static async generateOrganizationStructuredData(baseUrl: string): Promise<string> {
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: "Bodensee Immobilien Müller",
      description: "Ihr Experte für Immobilien am Bodensee mit über 20 Jahren Erfahrung",
      url: baseUrl,
      telephone: "+49-7541-123456",
      email: "info@bodensee-immobilien-mueller.de",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Musterstraße 123",
        addressLocality: "Friedrichshafen",
        addressRegion: "Baden-Württemberg",
        postalCode: "88045",
        addressCountry: "DE"
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 47.6779,
        longitude: 9.1732
      },
      areaServed: {
        "@type": "Place",
        name: "Bodenseeregion"
      },
      serviceArea: {
        "@type": "GeoCircle",
        geoMidpoint: {
          "@type": "GeoCoordinates",
          latitude: 47.6779,
          longitude: 9.1732
        },
        geoRadius: 50000
      },
      logo: `${baseUrl}/uploads/logo.png`,
      image: `${baseUrl}/uploads/hero-bodensee-sunset.jpg`,
      sameAs: [
        "https://www.facebook.com/bodensee.immobilien",
        "https://www.instagram.com/bodensee_immobilien"
      ]
    };

    return `<script type="application/ld+json">
${JSON.stringify(organizationData, null, 2)}
</script>`;
  }

  static generateBreadcrumbStructuredData(breadcrumbs: Array<{name: string, url: string}>): string {
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };

    return `<script type="application/ld+json">
${JSON.stringify(breadcrumbData, null, 2)}
</script>`;
  }

  private static extractCity(address: string): string {
    // Simple extraction - in production, use proper geocoding
    const cities = ["Friedrichshafen", "Konstanz", "Überlingen", "Meersburg", "Lindau"];
    const found = cities.find(city => address.includes(city));
    return found || "Friedrichshafen";
  }

  private static extractPostalCode(address: string): string {
    const match = address.match(/\b\d{5}\b/);
    return match ? match[0] : "88045";
  }
}
