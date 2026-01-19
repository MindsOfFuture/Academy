"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, Phone, MapPin, FileText, Calendar, School, GraduationCap, Users, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

type UserType = "student" | "teacher";

interface SignUpFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onToggleView: () => void;
}

export function SignUpForm({
  className,
  onToggleView,
  ...props
}: SignUpFormProps) {
  // Common fields
  const [userType, setUserType] = useState<UserType>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [document, setDocument] = useState("");
  const [birthDate, setBirthDate] = useState("");
  
  // Student-specific fields
  const [parentName, setParentName] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  
  // Teacher-specific fields
  const [schools, setSchools] = useState<string[]>([""]);
  const [educationLevel, setEducationLevel] = useState("");
  const [degree, setDegree] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  // Calculate age from birth date
  const calculateAge = (birthDateStr: string): number | null => {
    if (!birthDateStr) return null;
    const today = new Date();
    const birth = new Date(birthDateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(birthDate);

  // Teacher schools management
  const addSchool = () => setSchools([...schools, ""]);
  const removeSchool = (index: number) => {
    if (schools.length > 1) {
      setSchools(schools.filter((_, i) => i !== index));
    }
  };
  const updateSchool = (index: number, value: string) => {
    const updated = [...schools];
    updated[index] = value;
    setSchools(updated);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("As senhas não coincidem. Tente novamente.");
      setIsLoading(false);
      return;
    }

    // Validation for required fields
    if (!name || !email || !phone || !address || !document || !birthDate) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      setIsLoading(false);
      return;
    }

    if (userType === "student" && (!parentName || !school || !grade)) {
      setError("Por favor, preencha todos os campos de aluno.");
      setIsLoading(false);
      return;
    }

    if (userType === "teacher" && (!educationLevel || !degree || schools.some(s => !s.trim()))) {
      setError("Por favor, preencha todos os campos de professor.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    try {
      const metadata: Record<string, unknown> = {
        full_name: name,
        user_type: userType,
        phone,
        address,
        document,
        birth_date: birthDate,
      };

      if (userType === "student") {
        metadata.parent_name = parentName;
        metadata.school = school;
        metadata.grade = grade;
      } else {
        metadata.schools = schools.filter(s => s.trim());
        metadata.education_level = educationLevel;
        metadata.degree = degree;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });

      if (error) throw error;
      toast.success("Conta criada com sucesso! Por favor verifique seu e-mail.");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao criar a conta.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full rounded-full border-none bg-[#EFEBF5] py-5 pl-12 pr-4 text-gray-800 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6A4A98]";

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-6 bg-[#6A4A98] p-6 text-white md:w-1/2 lg:p-8 overflow-y-auto max-h-screen",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-white">Criar sua conta</h2>
        <div className="mx-auto mt-2 h-[3px] w-20 bg-white"></div>
      </div>

      {/* User Type Selector */}
      <div className="flex w-full max-w-md gap-4">
        <button
          type="button"
          onClick={() => setUserType("student")}
          className={cn(
            "flex-1 rounded-full py-3 font-semibold transition-all",
            userType === "student"
              ? "bg-white text-[#6A4A98]"
              : "bg-transparent border-2 border-white text-white hover:bg-white/10"
          )}
        >
          <Users className="inline-block mr-2" size={18} />
          Aluno
        </button>
        <button
          type="button"
          onClick={() => setUserType("teacher")}
          className={cn(
            "flex-1 rounded-full py-3 font-semibold transition-all",
            userType === "teacher"
              ? "bg-white text-[#6A4A98]"
              : "bg-transparent border-2 border-white text-white hover:bg-white/10"
          )}
        >
          <GraduationCap className="inline-block mr-2" size={18} />
          Professor
        </button>
      </div>

      <form onSubmit={handleSignUp} className="w-full max-w-md space-y-4">
        {/* Common Fields */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Dados Pessoais</h3>
          
          <div className="relative flex items-center">
            <User className="absolute left-4 text-[#6A4A98]" size={20} />
            <Input id="name" type="text" placeholder="Nome completo *" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div className="relative flex items-center">
            <FileText className="absolute left-4 text-[#6A4A98]" size={20} />
            <Input id="document" type="text" placeholder="CPF ou RG *" required value={document} onChange={(e) => setDocument(e.target.value)} className={inputClass} />
          </div>

          <div className="relative flex items-center">
            <Calendar className="absolute left-4 text-[#6A4A98]" size={20} />
            <Input id="birthDate" type="date" placeholder="Data de nascimento *" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={cn(inputClass, "pr-4")} />
            {age !== null && (
              <span className="absolute right-4 text-[#6A4A98] text-sm font-medium">{age} anos</span>
            )}
          </div>

          <div className="relative flex items-center">
            <MapPin className="absolute left-4 text-[#6A4A98]" size={20} />
            <Input id="address" type="text" placeholder="Endereço (cidade) *" required value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </div>

          <div className="relative flex items-center">
            <Phone className="absolute left-4 text-[#6A4A98]" size={20} />
            <Input id="phone" type="tel" placeholder="Telefone/Contato *" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>

          <div className="relative flex items-center">
            <Mail className="absolute left-4 text-[#6A4A98]" size={20} />
            <Input id="email" type="email" placeholder="E-mail *" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Student-specific fields */}
        {userType === "student" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Dados do Aluno</h3>
            
            <div className="relative flex items-center">
              <Users className="absolute left-4 text-[#6A4A98]" size={20} />
              <Input id="parentName" type="text" placeholder="Nome do responsável *" required value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputClass} />
            </div>

            <div className="relative flex items-center">
              <School className="absolute left-4 text-[#6A4A98]" size={20} />
              <Input id="school" type="text" placeholder="Escola atual *" required value={school} onChange={(e) => setSchool(e.target.value)} className={inputClass} />
            </div>

            <div className="relative flex items-center">
              <GraduationCap className="absolute left-4 text-[#6A4A98]" size={20} />
              <Input id="grade" type="text" placeholder="Série atual *" required value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass} />
            </div>
          </div>
        )}

        {/* Teacher-specific fields */}
        {userType === "teacher" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Dados do Professor</h3>
            
            <div className="space-y-2">
              <label className="text-sm text-white/70">Escolas onde leciona *</label>
              {schools.map((s, index) => (
                <div key={index} className="relative flex items-center gap-2">
                  <School className="absolute left-4 text-[#6A4A98]" size={20} />
                  <Input
                    type="text"
                    placeholder={`Escola ${index + 1}`}
                    required
                    value={s}
                    onChange={(e) => updateSchool(index, e.target.value)}
                    className={cn(inputClass, "flex-1")}
                  />
                  {schools.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSchool(index)}
                      className="p-2 bg-red-500/80 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSchool}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                <Plus size={16} /> Adicionar outra escola
              </button>
            </div>

            <div className="relative flex items-center">
              <GraduationCap className="absolute left-4 text-[#6A4A98]" size={20} />
              <select
                id="educationLevel"
                required
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className={cn(inputClass, "appearance-none cursor-pointer")}
              >
                <option value="">Grau de escolaridade *</option>
                <option value="graduacao">Graduação</option>
                <option value="pos-graduacao">Pós-Graduação</option>
                <option value="mestrado">Mestrado</option>
                <option value="doutorado">Doutorado</option>
                <option value="pos-doutorado">Pós-Doutorado</option>
              </select>
            </div>

            <div className="relative flex items-center">
              <FileText className="absolute left-4 text-[#6A4A98]" size={20} />
              <Input id="degree" type="text" placeholder="Formação (ex: Licenciatura em Matemática) *" required value={degree} onChange={(e) => setDegree(e.target.value)} className={inputClass} />
            </div>
          </div>
        )}

        {/* Password fields */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Senha</h3>
          
          <div className="relative flex items-center">
            <Lock className="absolute left-4 text-[#6A4A98]" size={20} />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Senha *"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(inputClass, "pr-12")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-4 text-[#6A4A98] transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative flex items-center">
            <Lock className="absolute left-4 text-[#6A4A98]" size={20} />
            <Input
              id="repeat-password"
              type={showRepeatPassword ? "text" : "password"}
              placeholder="Repita a Senha *"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className={cn(inputClass, "pr-12")}
            />
            <button
              type="button"
              onClick={() => setShowRepeatPassword(p => !p)}
              aria-label={showRepeatPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-4 text-[#6A4A98] transition-colors"
            >
              {showRepeatPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && <p className="text-center text-sm text-yellow-300">{error}</p>}

        <Button type="submit" className="w-full rounded-full bg-white py-6 text-base font-semibold text-[#6A4A98] hover:bg-gray-200" disabled={isLoading}>
          {isLoading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="text-center text-sm md:hidden">
        Já tem uma conta?{" "}
        <button
          type="button"
          onClick={onToggleView}
          className="font-semibold underline hover:text-gray-200"
        >
          Fazer login
        </button>
      </p>
    </div>
  );
}