import React from 'react';
import { render, screen, within, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
type Usuario={id:string;email:string;user_metadata:{full_name:string}};
const state=vi.hoisted(()=>({push:vi.fn(),gestao:false,perfis:0,pessoais:{phone:'32999990000',address:'Juiz de Fora/MG'} as {phone:string|null;address:string|null},user:null as null|{id:string;email:string;user_metadata:{full_name:string}}}));
vi.mock('next/navigation',()=>({usePathname:()=> '/',useRouter:()=>({push:state.push})}));
vi.mock('next/link',()=>({default:({children,...props}:React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>)=><a {...props}>{children}</a>}));
vi.mock('next/image',()=>({default:()=>null}));
vi.mock('@heroui/react',()=>({
 Dropdown:({children}:React.PropsWithChildren)=><div>{children}</div>,
 DropdownTrigger:({children}:React.PropsWithChildren)=><div>{children}</div>,
 DropdownMenu:({children}:React.PropsWithChildren)=><div data-testid='menu-usuario'>{children}</div>,
 DropdownItem:({as:Component,children,href,onPress}:{as?:React.ElementType;children:React.ReactNode;href?:string;onPress?:()=>void})=>Component?<Component href={href}>{children}</Component>:<button onClick={onPress}>{children}</button>,
}));
const client=vi.hoisted(()=>({auth:{onAuthStateChange:(callback:(event:string,session:unknown)=>void)=>{callback('INITIAL_SESSION',state.user?{user:state.user}:null);return {data:{subscription:{unsubscribe:vi.fn()}}}},signOut:vi.fn()},rpc:async()=>({data:[state.pessoais],error:null}),from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>{state.perfis++;return {data:{full_name:'Aluno',avatar_url:null}}}})})})}));
vi.mock('@/lib/supabase/client',()=>({createClient:()=>client}));
vi.mock('@/app/gestao/actions',()=>({temAcessoGestaoAction:async()=>state.gestao}));
import { AuthButtonClient } from '@/components/auth/auth-button-client';
import { __resetHeaderSessionForTests, faltaDadoPessoal } from '@/lib/auth/header-session';
const ALUNO:Usuario={id:'fixture-user',email:'fixture@example.invalid',user_metadata:{full_name:'Aluno'}};
describe('Navegação autenticada',()=>{
 beforeEach(()=>{state.pessoais={phone:'32999990000',address:'Juiz de Fora/MG'};state.gestao=false;state.perfis=0;state.user=ALUNO;window.sessionStorage.clear();__resetHeaderSessionForTests();});
 it('logado, o lugar do Entrar vira Meu espaço (link nativo) e o menu da conta tem Perfil',async()=>{
  render(<AuthButtonClient/>);
  expect(await screen.findByRole('link',{name:'Meu espaço'})).toHaveAttribute('href','/protected');
  expect(screen.queryByRole('link',{name:'Entrar'})).toBeNull();
  expect(screen.getByRole('link',{name:'Perfil'})).toHaveAttribute('href','/protected/perfil');
  expect(state.push).not.toHaveBeenCalled();
 });
 it('deslogado mostra Entrar e não mostra Meu espaço',async()=>{
  state.user=null;
  render(<AuthButtonClient/>);
  expect(await screen.findByRole('link',{name:'Entrar'})).toHaveAttribute('href','/auth');
  expect(screen.queryByRole('link',{name:'Meu espaço'})).toBeNull();
 });
 it('mostra Gestão no topo para quem é da equipe da gestão',async()=>{
  state.gestao=true;
  render(<AuthButtonClient/>);
  expect(await screen.findByRole('link',{name:'Gestão'})).toHaveAttribute('href','/gestao');
  expect(within(screen.getByTestId('menu-usuario')).queryByRole('link',{name:'Gestão'})).toBeNull();
 });
 it('não mostra Gestão para quem não é da equipe',async()=>{
  render(<AuthButtonClient/>);
  await screen.findByRole('link',{name:'Meu espaço'});
  await act(async()=>{await new Promise((r)=>setTimeout(r,0));});
  expect(screen.queryByRole('link',{name:'Gestão'})).toBeNull();
 });
 it('ao trocar de página o topo já nasce pronto: sem piscar Entrar e sem buscar o perfil de novo',async()=>{
  const primeira=render(<AuthButtonClient/>);
  await screen.findByRole('link',{name:'Meu espaço'});
  await act(async()=>{await new Promise((r)=>setTimeout(r,0));});
  const buscas=state.perfis;
  primeira.unmount();
  render(<AuthButtonClient/>);
  // no primeiro desenho, sem esperar nada
  expect(screen.getByRole('link',{name:'Meu espaço'})).toBeInTheDocument();
  expect(screen.queryByRole('link',{name:'Entrar'})).toBeNull();
  await act(async()=>{await new Promise((r)=>setTimeout(r,0));});
  expect(state.perfis).toBe(buscas);
 });
 it('perfil sem telefone ou endereço: ponto no avatar e "Complete seu perfil" no menu',async()=>{
  state.pessoais={phone:null,address:'Juiz de Fora/MG'};
  render(<AuthButtonClient/>);
  expect(await screen.findByTestId('aviso-perfil')).toBeInTheDocument();
  expect(screen.getByRole('link',{name:/Complete seu perfil/})).toHaveAttribute('href','/protected/perfil');
  expect(screen.getByRole('button',{name:'Menu da conta (complete seu perfil)'})).toBeInTheDocument();
 });
 it('perfil completo: sem ponto e o menu mostra Perfil',async()=>{
  render(<AuthButtonClient/>);
  await screen.findByRole('link',{name:'Meu espaço'});
  await act(async()=>{await new Promise((r)=>setTimeout(r,0));});
  expect(screen.queryByTestId('aviso-perfil')).toBeNull();
  expect(screen.getByRole('link',{name:'Perfil'})).toBeInTheDocument();
 });
 it('faltaDadoPessoal: só acusa com a leitura em mãos',()=>{
  expect(faltaDadoPessoal(null)).toBe(false);
  expect(faltaDadoPessoal({phone:'  ',address:'x'})).toBe(true);
  expect(faltaDadoPessoal({phone:'1',address:null})).toBe(true);
  expect(faltaDadoPessoal({phone:'1',address:'x'})).toBe(false);
 });
});
