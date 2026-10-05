import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
vi.mock('@/components/navbar/navbar',()=>({default:()=> <nav aria-label="Minds"/>}));
import Loading from '@/app/protected/loading';
it('mostra o painel acessível sem depender das consultas privadas',()=>{
 render(<Loading/>);
 expect(screen.getByRole('heading',{name:'Seu painel'})).toBeInTheDocument();
 expect(screen.getByRole('status')).toHaveTextContent('Carregando seu painel...');
 expect(screen.getByRole('main')).toHaveAttribute('aria-busy','true');
 expect(screen.getByRole('navigation')).toBeInTheDocument();
});
