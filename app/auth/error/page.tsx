import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar/navbar";
import Image from "next/image";
import Link from "next/link";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    error_description: string;
    error: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex w-screen flex-col min-h-screen">
      <Navbar showTextLogo={true} />
      <div className="flex flex-grow flex-col items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="flex flex-col items-center gap-10 p-6 text-2xl font-semibold tracking-tight">
            <Image src="/Logo.svg" alt="Error" width={200} height={150} />
            <p>Algo deu errado =(</p>
          </div>
          <div className="p-6 pt-0">
            <p className="text-sm text-muted-foreground">
              {params?.error ? params.error_description : "Ocorreu um erro não especificado."}
            </p>
          </div>
          <div className="flex items-center justify-center p-6 pt-0">
            <Button asChild>
              <Link href="/">Voltar para Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
