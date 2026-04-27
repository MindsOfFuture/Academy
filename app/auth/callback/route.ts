import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function normalizeNextPath(nextPath: string | null): string | null {
    if (!nextPath) return null;
    if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return null;
    return nextPath;
}

/**
 * OAuth callback route for Google authentication
 * GET /auth/callback?code=...
 *
 * This route is called by Supabase after successful OAuth authentication.
 * It exchanges the code for a session and creates/updates the user profile.
 */
export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");
    const nextPath = normalizeNextPath(requestUrl.searchParams.get("next"));

    if (error) {
        console.error("[oauth/callback] OAuth error:", { error, errorDescription });
        return NextResponse.redirect(
            new URL(
                `/auth?error=${encodeURIComponent(errorDescription || error)}`,
                requestUrl.origin
            )
        );
    }

    if (code) {
        const supabase = await createServerSupabase();
        const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            console.error("[oauth/callback] Session exchange error:", exchangeError);
            return NextResponse.redirect(
                new URL(
                    `/auth?error=${encodeURIComponent(exchangeError.message)}`,
                    requestUrl.origin
                )
            );
        }

        // Get current user after successful session
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
            return NextResponse.redirect(new URL("/auth?error=User not found", requestUrl.origin));
        }

        const user = authData.user;

        // Check if user profile exists
        const { data: existingProfile } = await supabase
            .from("user_profile")
            .select("id, full_name, phone, address, document, birth_date")
            .eq("id", user.id)
            .maybeSingle();

        // If profile exists and has required data, redirect to protected
        if (
            existingProfile?.full_name &&
            existingProfile?.phone &&
            existingProfile?.address &&
            existingProfile?.document &&
            existingProfile?.birth_date
        ) {
            return NextResponse.redirect(new URL(nextPath || "/protected", requestUrl.origin));
        }

        // Otherwise, redirect to onboarding to collect missing data
        return NextResponse.redirect(
            new URL(
                `/auth/complete-profile?from=oauth&email=${encodeURIComponent(
                    user.email || ""
                )}&name=${encodeURIComponent(
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    ""
                )}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`,
                requestUrl.origin
            )
        );
    }

    // No code provided
    return NextResponse.redirect(new URL("/auth?error=Invalid callback", requestUrl.origin));
}
