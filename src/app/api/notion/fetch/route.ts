import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { NOTION_SECRET } from "@/lib/notion";

export async function POST(request: Request) {
    try {
        const { databaseId } = await request.json();

        if (!databaseId) {
            return NextResponse.json(
                { error: "Database ID is required" },
                { status: 400 }
            );
        }


        const notion = new Client({ auth: NOTION_SECRET });

        // Fetch database container to get data sources
        const database = await (notion.databases as any).retrieve({ database_id: databaseId });

        // In API 2025-09-03, we must query the data source, not the database
        // A database can have multiple data sources. We'll use the first one available.
        const dataSourceId = (database as any).data_sources?.[0]?.id;

        if (!dataSourceId) {
            return NextResponse.json(
                { error: "No data sources found for this database." },
                { status: 404 }
            );
        }

        // Fetch data source details to get properties/schema
        const dataSource = await (notion.dataSources as any).retrieve({ data_source_id: dataSourceId });

        // Query the data source
        const pages = await (notion.dataSources as any).query({
            data_source_id: dataSourceId,
        });

        return NextResponse.json({
            title: (database as any).title?.[0]?.plain_text || (dataSource as any).title?.[0]?.plain_text || "Untitled",
            properties: (dataSource as any).properties || {},
            items: (pages as any).results,
            dataSourceId: dataSourceId, // Added to support "Add Deal"
        });
    } catch (error: any) {
        console.error("Notion Fetch Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch from Notion" },
            { status: 500 }
        );
    }
}
