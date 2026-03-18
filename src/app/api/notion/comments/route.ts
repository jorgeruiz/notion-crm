import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { NOTION_SECRET } from "@/lib/notion";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
        return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
    }

    try {
        const notion = new Client({ auth: NOTION_SECRET });
        const response = await (notion as any).comments.list({ block_id: pageId });
        return NextResponse.json(response.results);
    } catch (error: any) {
        console.error("Notion List Comments Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch comments" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { pageId, text } = await request.json();

        if (!pageId || !text) {
            return NextResponse.json(
                { error: "Page ID and text are required" },
                { status: 400 }
            );
        }

        const notion = new Client({ auth: NOTION_SECRET });
        const response = await (notion as any).comments.create({
            parent: {
                page_id: pageId,
            },
            rich_text: [
                {
                    text: {
                        content: text,
                    },
                },
            ],
        });

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Notion Create Comment Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create comment" },
            { status: 500 }
        );
    }
}
