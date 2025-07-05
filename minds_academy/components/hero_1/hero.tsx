import Image from 'next/image';
import Button from '../button/button';
import CountUp from '../counting/couting';


interface HeroProps {
  escolas_atendidas: number;
  alunos_impactados: number;
}

export function Hero({ escolas_atendidas, alunos_impactados }: HeroProps) {
  return (
    <div className="flex flex-col gap-8 items-center mt-[50px] ">
      <div className='relative p-8 rounded-lg  flex flex-col items-center justify-center'>
        <div className="absolute bg-[rgba(136,113,172,1)]  -inset-0 blur-[180px] -z-10"></div>
        <Image className='transition-all duration-300 hover:scale-[1.02]' src="logo.svg" alt="Hero Image" width={400} height={180} />
      </div>
      <h1 className="text-2xl text-[#767676] font-bold text-center p-1">
        Lorem ipsum dolor sit amet, <span className="text-black">consectetur adipiscing elit.</span><br />
        Morbi hendrerit <span className="text-black">vulputate risus.</span> Nulla a eros nisi. <span className="text-black">onec condimentum.</span>
      </h1>
      <div className='flex text-center gap-6 transition-all duration-300 hover:shadow-2xl p-3 rounded-lg'>
        <div className="flex flex-col items-center justify-center  gap-0">
          <p className="text-black font-bold text-3xl">
            <CountUp
              from={0}
              to={escolas_atendidas}
              separator=","
              direction="up"
              duration={0.3}
              className="count-up-text"
            /></p>
          <p className="text-lg text-[#767676] ">
            Escolas atendidas
          </p>
        </div>
        <div className='border-l-2 border-dotted border-black'></div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-black font-bold text-3xl"><CountUp
            from={0}
            to={alunos_impactados}
            separator=","
            direction="up"
            duration={0.3}
            className="count-up-text"
          /></p>
          <p className="text-lg text-[#767676]">
            Alunos impactados
          </p>
        </div>
      </div>
      <Button Texto="Saiba mais" Link="" />
    </div>
  );
}
