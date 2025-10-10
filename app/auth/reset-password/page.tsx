import Aurora from "@/components/aurora/aurora";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;
  if (params?.error) {
    redirect("/auth/error?" + new URLSearchParams(params).toString());
  }
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Aurora
          colorStops={["#684A97", "#FFD300", "#684A97"]}
          blend={1.0}
          amplitude={0.3}
          speed={1}
        />
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
