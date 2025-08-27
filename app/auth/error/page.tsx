import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center flex flex-col items-center gap-10">
              <Image
                src="/Logo.svg"
                alt="Error"
                width={200}
                height={150}
              />
              <p className="text-2xl ">Algo deu errado =(</p>
            </CardTitle>
          </CardHeader>
          <CardContent>

            {params?.error ? (
              <p className="text-sm text-muted-foreground">
                {params.error_description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro não especificado.
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/">Voltar para Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
