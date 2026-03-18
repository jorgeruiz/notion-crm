import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { NOTION_SECRET } from "@/lib/notion";

export async function POST(request: Request) {
    try {
        const { dataSourceId, properties } = await request.json();

        if (!dataSourceId) {
            return NextResponse.json(
                { error: "Data Source ID is required" },
                { status: 400 }
            );
        }

        const notion = new Client({ auth: NOTION_SECRET });

        // Create a new page with the data_source_id as parent
        const response = await (notion.pages as any).create({
            parent: {
                data_source_id: dataSourceId,
            },
            properties,
        });

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Notion Create Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create page in Notion" },
            { status: 500 }
        );
    }
}
