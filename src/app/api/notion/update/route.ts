import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { NOTION_SECRET } from "@/lib/notion";

export async function POST(request: Request) {
    try {
        const { pageId, statusPropertyName, statusValue, propertyType } = await request.json();

        if (!pageId || !statusPropertyName || !statusValue) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const notion = new Client({ auth: NOTION_SECRET });
        const propertyValueMap: any = {
            status: { status: { name: statusValue } },
            select: { select: { name: statusValue } },
            number: { number: parseFloat(statusValue) },
            rich_text: { rich_text: [{ text: { content: statusValue } }] },
            date: { date: { start: statusValue } },
            phone_number: { phone_number: statusValue },
            email: { email: statusValue }
        };

        const response = await (notion.pages as any).update({
            page_id: pageId,
            properties: {
                [statusPropertyName]: propertyValueMap[propertyType] || { [propertyType || "status"]: { name: statusValue } }
            },
        });

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Notion Update Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update Notion page" },
            { status: 500 }
        );
    }
}
