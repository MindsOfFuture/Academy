import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({push:vi.fn(),user:{id:'fixture-user',email:'fixture@example.invalid',user_metadata:{full_name:'Aluno'}}}));
vi.mock('next/navigation',()=>({usePathname:()=> '/',useRouter:()=>({push:state.push})}));
vi.mock('next/link',()=>({default:({children,...props}:React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>)=><a {...props}>{children}</a>}));
vi.mock('next/image',()=>({default:()=>null}));
vi.mock('@heroui/react',()=>({
 Dropdown:({children}:React.PropsWithChildren)=><div>{children}</div>,
 DropdownTrigger:({children}:React.PropsWithChildren)=><div>{children}</div>,
 DropdownMenu:({children}:React.PropsWithChildren)=><div>{children}</div>,
 DropdownItem:({as:Component,children,href,onPress}:{as?:React.ElementType;children:React.ReactNode;href?:string;onPress?:()=>void})=>Component?<Component href={href}>{children}</Component>:<button onClick={onPress}>{children}</button>,
}));
const client=vi.hoisted(()=>({auth:{onAuthStateChange:(callback:(event:string,session:unknown)=>void)=>{callback('INITIAL_SESSION',{user:state.user});return {data:{subscription:{unsubscribe:vi.fn()}}}},signOut:vi.fn()},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{full_name:'Aluno',avatar_url:null}})})})})}));
vi.mock('@/lib/supabase/client',()=>({createClient:()=>client}));
import { AuthButtonClient } from '@/components/auth/auth-button-client';
describe('Navegação autenticada',()=>{
 it('usa links nativos para carregar o painel antes de precisar dele',async()=>{
  render(<AuthButtonClient/>);
  expect(await screen.findByRole('link',{name:'Dashboard'})).toHaveAttribute('href','/protected');
  expect(screen.getByRole('link',{name:'Perfil'})).toHaveAttribute('href','/protected/perfil');
  expect(state.push).not.toHaveBeenCalled();
 });
});
