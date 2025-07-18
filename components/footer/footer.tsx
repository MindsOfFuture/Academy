import Image from 'next/image';

interface SocialLink {
  href: string;
  iconSrc: string;
  alt: string;
  nome: string;
}

export default function Footer({ socials }: { socials: SocialLink[] }) {
  return (
    <footer className="bg-white min-h-64 flex flex-col md:flex-row justify-between px-4 sm:px-8 py-8">

      <div className="flex-1 flex justify-center items-center gap-6 md:gap-16 mb-8 md:mb-0">
        <Image
          src={"/logo_ufjf.svg"}
          alt="Logo UFJF"
          width={120}
          height={120}
          className="w-24 h-auto md:w-40"
        />
        <Image
          src={"/logo_mg.svg"}
          alt="Logo Governo de Minas Gerais"
          width={120}
          height={120}
          className="w-24 h-auto md:w-40"
        />
      </div>

      <div className='hidden lg:block border-l-2 border-dotted border-black'></div>

      <div className="flex-1 flex flex-col justify-center items-center gap-4 text-[#262626]">
        {socials.map((social, index) => (
          <a
            key={index}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className='flex items-center gap-0 transform transition-transform hover:scale-105'
          >
            <Image
              src={social.iconSrc}
              alt={social.alt}
              width={35}
              height={35}
            />
            <p className='text-base md:text-lg'>{social.nome}</p>
          </a>
        ))}
        <a href="/termos-de-uso" className="text-sm text-gray-500 hover:underline mt-4">
          Termos de Uso
        </a>
      </div>

    </footer>
  );
}