import { Client } from "@notionhq/client";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export interface NotionConfig {
  inquiriesDbId: string;
  propertiesDbId: string;
  contactsDbId: string;
  tasksDbId: string;
}

const config: NotionConfig = {
  inquiriesDbId: process.env.NOTION_INQUIRIES_DB_ID || "",
  propertiesDbId: process.env.NOTION_PROPERTIES_DB_ID || "",
  contactsDbId: process.env.NOTION_CONTACTS_DB_ID || "",
  tasksDbId: process.env.NOTION_TASKS_DB_ID || "",
};

// Send customer inquiry to Notion
export async function createNotionInquiry(inquiry: any) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: config.inquiriesDbId },
      properties: {
        Name: {
          title: [{ text: { content: inquiry.name } }],
        },
        "E-Mail": {
          email: inquiry.email,
        },
        Telefon: {
          phone_number: inquiry.phone || "",
        },
        Nachricht: {
          rich_text: [{ text: { content: inquiry.message } }],
        },
        Status: {
          select: {
            name:
              inquiry.status === "new"
                ? "Neu"
                : inquiry.status === "in_progress"
                  ? "In Bearbeitung"
                  : "Beantwortet",
          },
        },
        Immobilie: {
          rich_text: [
            {
              text: { content: inquiry.propertyTitle || "Allgemeine Anfrage" },
            },
          ],
        },
        "Anfrage-Typ": {
          select: {
            name:
              inquiry.type === "property_inquiry"
                ? "Immobilien-Anfrage"
                : inquiry.type === "valuation"
                  ? "Bewertung"
                  : "Beratung",
          },
        },
        "Erstellt am": {
          date: {
            start: new Date().toISOString().split("T")[0],
          },
        },
      },
    });

    console.log("Inquiry sent to Notion:", response.id);
    return response;
  } catch (error) {
    console.error("Error creating Notion inquiry:", error);
    throw error;
  }
}

// Sync property to Notion
export async function syncPropertyToNotion(property: any) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: config.propertiesDbId },
      properties: {
        Titel: {
          title: [{ text: { content: property.title } }],
        },
        Preis: {
          number:
            typeof property.price === "string"
              ? parseFloat(property.price)
              : property.price,
        },
        Ort: {
          select: { name: property.location },
        },
        Typ: {
          select: { name: property.type },
        },
        Status: {
          select: {
            name:
              property.status === "available"
                ? "Verfügbar"
                : property.status === "reserved"
                  ? "Reserviert"
                  : "Verkauft",
          },
        },
        Größe: {
          number: property.size,
        },
        Zimmer: {
          number: property.rooms,
        },
        Badezimmer: {
          number: property.bathrooms,
        },
        Beschreibung: {
          rich_text: [{ text: { content: property.description || "" } }],
        },
        "Erstellt am": {
          date: {
            start: property.createdAt
              ? new Date(property.createdAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          },
        },
      },
    });

    console.log("Property synced to Notion:", response.id);
    return response;
  } catch (error) {
    console.error("Error syncing property to Notion:", error);
    throw error;
  }
}

// Create contact in Notion
export async function createNotionContact(contact: any) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: config.contactsDbId },
      properties: {
        Name: {
          title: [{ text: { content: contact.name } }],
        },
        "E-Mail": {
          email: contact.email,
        },
        Telefon: {
          phone_number: contact.phone || "",
        },
        Typ: {
          select: {
            name: contact.type || "Interessent",
          },
        },
        Status: {
          select: { name: "Aktiv" },
        },
        Notizen: {
          rich_text: [{ text: { content: contact.notes || "" } }],
        },
        "Erstellt am": {
          date: {
            start: new Date().toISOString().split("T")[0],
          },
        },
      },
    });

    return response;
  } catch (error) {
    console.error("Error creating Notion contact:", error);
    throw error;
  }
}

// Get tasks from Notion
export async function getNotionTasks() {
  try {
    const response = await notion.databases.query({
      database_id: config.tasksDbId,
      filter: {
        property: "Status",
        select: {
          does_not_equal: "Erledigt",
        },
      },
      sorts: [
        {
          property: "Fälligkeitsdatum",
          direction: "ascending",
        },
      ],
    });

    const tasks = response.results.map((page: any) => {
      const properties = page.properties;
      return {
        id: page.id,
        title: properties.Titel?.title?.[0]?.text?.content || "",
        description:
          properties.Beschreibung?.rich_text?.[0]?.text?.content || "",
        status: properties.Status?.select?.name || "",
        priority: properties.Priorität?.select?.name || "",
        dueDate: properties.Fälligkeitsdatum?.date?.start || null,
        assignee: properties.Zuständig?.people?.[0]?.name || "",
        createdAt: page.created_time,
      };
    });

    return tasks;
  } catch (error) {
    console.error("Error fetching Notion tasks:", error);
    throw error;
  }
}

// Update inquiry status in Notion
export async function updateNotionInquiryStatus(
  pageId: string,
  status: string,
) {
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: {
          select: {
            name:
              status === "new"
                ? "Neu"
                : status === "in_progress"
                  ? "In Bearbeitung"
                  : "Beantwortet",
          },
        },
      },
    });

    return response;
  } catch (error) {
    console.error("Error updating Notion inquiry status:", error);
    throw error;
  }
}

// Create task in Notion
export async function createNotionTask(task: any) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: config.tasksDbId },
      properties: {
        Titel: {
          title: [{ text: { content: task.title } }],
        },
        Beschreibung: {
          rich_text: [{ text: { content: task.description || "" } }],
        },
        Status: {
          select: { name: "Zu erledigen" },
        },
        Priorität: {
          select: { name: task.priority || "Normal" },
        },
        Fälligkeitsdatum: {
          date: task.dueDate ? { start: task.dueDate } : null,
        },
        Typ: {
          select: { name: task.type || "Allgemein" },
        },
      },
    });

    return response;
  } catch (error) {
    console.error("Error creating Notion task:", error);
    throw error;
  }
}

// Enhanced Notion connection test with comprehensive error handling
export async function testNotionConnection() {
  try {
    // Check if API key is configured
    if (!process.env.NOTION_TOKEN) {
      console.error("❌ NOTION_TOKEN not configured");
      return {
        success: false,
        error: "NOTION_TOKEN nicht konfiguriert",
        details: "Umgebungsvariable NOTION_TOKEN fehlt",
      };
    }

    // Check if database IDs are configured
    const missingDbs = [];
    if (!config.inquiriesDbId) missingDbs.push("NOTION_INQUIRIES_DB_ID");
    if (!config.propertiesDbId) missingDbs.push("NOTION_PROPERTIES_DB_ID");
    if (!config.contactsDbId) missingDbs.push("NOTION_CONTACTS_DB_ID");
    if (!config.tasksDbId) missingDbs.push("NOTION_TASKS_DB_ID");

    if (missingDbs.length > 0) {
      console.error("❌ Missing Notion database IDs:", missingDbs);
      return {
        success: false,
        error: "Notion Datenbank-IDs fehlen",
        details: `Fehlende Umgebungsvariablen: ${missingDbs.join(", ")}`,
      };
    }

    console.log("🔍 Testing Notion API connection...");
    const response = await notion.users.me({});

    console.log("✅ Notion connection successful:", response.name);
    return {
      success: true,
      user: response,
      message: "Notion erfolgreich verbunden",
    };
  } catch (error) {
    console.error("❌ Notion connection test failed:", error);

    let errorMessage = "Unbekannter Notion-Fehler";
    let details = error instanceof Error ? error.message : 'Unknown error';

    if (error && typeof error === 'object' && 'code' in error && error.code === "unauthorized") {
      errorMessage = "Notion API-Token ungültig";
      details = "Überprüfen Sie Ihr NOTION_TOKEN";
    } else if (error && typeof error === 'object' && 'code' in error && error.code === "rate_limited") {
      errorMessage = "Notion API Rate-Limit erreicht";
      details = "Versuchen Sie es in wenigen Minuten erneut";
    } else if (error && typeof error === 'object' && 'code' in error && error.code === "service_unavailable") {
      errorMessage = "Notion Service nicht verfügbar";
      details = "Notion-Server sind momentan nicht erreichbar";
    }

    return {
      success: false,
      error: errorMessage,
      details,
      code: (error && typeof error === 'object' && 'code' in error) ? error.code : undefined,
    };
  }
}
