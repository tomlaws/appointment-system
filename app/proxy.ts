import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if(!session) {
        return notFound();
    }
    return NextResponse.next();
}
export const config = {
  matcher: ["/admin"], // Specify the routes the middleware applies to
};