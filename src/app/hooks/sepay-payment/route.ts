import { NextRequest } from "next/server";
import { handleSepayWebhook } from "@/lib/sepayWebhook";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleSepayWebhook(req);
}
