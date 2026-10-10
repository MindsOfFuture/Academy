import { beforeEach, it, expect, vi } from "vitest";
const { guard, search, grant, exact } = vi.hoisted(() => ({guard:vi.fn(),search:vi.fn(),grant:vi.fn(),exact:vi.fn()}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/api/gestao/auth",()=>({ensureGestaoMember:guard}));
vi.mock("@/lib/api/gestao/equipe",()=>({buscarUsuarios:search,buscarUsuarioPorEmail:exact,concederPapel:grant}));
import { buscarPessoasAction, concederPapelAction } from "@/app/gestao/equipe/actions";
const id='10000000-0000-4000-8000-000000000001';
beforeEach(()=>{vi.clearAllMocks();guard.mockResolvedValue('coordenacao');grant.mockResolvedValue({coordenacao:false,bolsista:true});});
it('busca parcial sob guard sem conceder papel',async()=>{
 search.mockResolvedValue([{id,nome:'Ana',email:'ana@x'}]);
 expect(await buscarPessoasAction('Ana')).toMatchObject({ok:true,pessoas:[{id}]});
 expect(search).toHaveBeenCalledWith('Ana'); expect(grant).not.toHaveBeenCalled();
});
it('seleção UUID é autoridade, ignora nome/email apresentados',async()=>{
 const f=new FormData();f.set('userProfileId',id);f.set('papel','bolsista');f.set('nome','Forged');f.set('email','forged@x');
 expect(await concederPapelAction(null,f)).toMatchObject({ok:true});
 expect(grant).toHaveBeenCalledWith(id,{coordenacao:false,bolsista:true}); expect(exact).not.toHaveBeenCalled();
});
it('UUID malformado não cai no fallback por email',async()=>{
 const f=new FormData();f.set('userProfileId','not-uuid');f.set('papel','bolsista');f.set('email','ana@x.com');
 expect(await concederPapelAction(null,f)).toMatchObject({ok:false});expect(grant).not.toHaveBeenCalled();expect(exact).not.toHaveBeenCalled();
});
it('nega busca e concessão antes de acesso a dados',async()=>{
 for(const role of ['bolsista',null]){
 guard.mockResolvedValue(role);
 expect(await buscarPessoasAction('Ana')).toMatchObject({ok:false,pessoas:[]});
 const f=new FormData();f.set('userProfileId',id);f.set('papel','ambos');
 expect(await concederPapelAction(null,f)).toMatchObject({ok:false});
 }
 guard.mockRejectedValue(new Error('Acesso negado'));
 expect(await buscarPessoasAction('Ana')).toMatchObject({ok:false});
 expect(search).not.toHaveBeenCalled();expect(grant).not.toHaveBeenCalled();
});
it('mantém compatibilidade do email exato e erro de busca',async()=>{
 const f=new FormData();f.set('email','ana@example.com');f.set('papel','ambos');
 exact.mockResolvedValue({id,nome:'Ana'});grant.mockResolvedValue({coordenacao:true,bolsista:true});
 expect(await concederPapelAction(null,f)).toMatchObject({ok:true});expect(grant).toHaveBeenCalledWith(id,{coordenacao:true,bolsista:true});
 search.mockRejectedValue(new Error('Falha'));expect(await buscarPessoasAction('Ana')).toMatchObject({ok:false,pessoas:[]});
});
