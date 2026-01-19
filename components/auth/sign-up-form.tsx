"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  User, Mail, Lock, Eye, EyeOff, Phone, MapPin, 
  FileText, Calendar, School, GraduationCap, Users, 
  Plus, X, ChevronRight, ChevronLeft, Check, ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type UserType = "student" | "teacher";

interface SignUpFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onToggleView: () => void;
}

export function SignUpForm({
  className,
  onToggleView,
  ...props
}: SignUpFormProps) {
  // Steps control
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [direction, setDirection] = useState(0);

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

  const validateStep = (currentStep: number): string | null => {
    switch (currentStep) {
      case 1: // Perfil
        if (!name.trim()) return "Por favor, preencha seu nome.";
        if (name.trim().split(" ").length < 2) return "Por favor, digite seu nome completo.";
        if (document.replace(/\D/g, "").length < 11) return "Documento inválido (mínimo 11 dígitos).";
        if (!birthDate) return "Data de nascimento é obrigatória.";
        
        const birth = new Date(birthDate);
        if (birth > new Date()) return "Data de nascimento inválida.";
        const ageVal = calculateAge(birthDate);
        if (ageVal !== null && ageVal < 5) return "Idade mínima de 5 anos.";
        
        return null;

      case 2: // Contato
        if (address.trim().length < 5) return "Por favor, insira um endereço mais completo.";
        if (phone.replace(/\D/g, "").length < 10) return "Telefone inválido (mínimo 10 dígitos com DDD).";
        return null;

      case 3: // Detalhes
        if (userType === "student") {
          if (!parentName.trim()) return "Nome do responsável é obrigatório.";
          if (!school.trim()) return "Nome da escola é obrigatório.";
          if (!grade.trim()) return "Série/Ano é obrigatório.";
        }
        if (userType === "teacher") {
          if (!educationLevel) return "Selecione o grau de escolaridade.";
          if (!degree.trim()) return "Formação acadêmica é obrigatória.";
          if (schools.some(s => !s.trim())) return "Preencha todas as escolas ou remova as vazias.";
        }
        return null;

      case 4: // Credenciais
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Por favor, insira um e-mail válido.";
        if (password.length < 6) return "A senha deve ter no mínimo 6 caracteres.";
        if (password !== repeatPassword) return "As senhas não conferem.";
        return null;

      default:
        return null;
    }
  };

  const handleNext = () => {
    const errorMsg = validateStep(step);
    if (!errorMsg) {
      setError(null);
      setDirection(1);
      setStep((prev) => prev + 1);
    } else {
      setError(errorMsg);
    }
  };

  const handlePrev = () => {
    setError(null);
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errorMsg = validateStep(4);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setIsLoading(true);

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
  
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return "Quem é você?";
      case 2: return "Onde te encontramos?";
      case 3: return userType === "student" ? "Sua Escola" : "Sua Carreira";
      case 4: return "Acesso à conta";
      default: return "";
    }
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-6 bg-[#6A4A98] p-6 text-white md:w-1/2 lg:p-12 overflow-hidden relative",
        className
      )}
      {...props}
    >
      {/* Header & Title */}
      <div className="w-full max-w-md space-y-2 z-10">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-white">Criar Conta</h2>
            <p className="text-white/80 text-sm font-medium h-5">{getStepTitle()}</p>
          </div>
          <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
            Passo {step} de {totalSteps}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-2 w-full mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500", 
                i <= step ? "bg-white" : "bg-white/20"
              )} 
            />
          ))}
        </div>
      </div>

      {/* Main Form Content */}
      <div className="w-full max-w-md relative min-h-[350px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4 w-full"
            >
               {/* User Type Selector */}
              <div className="flex w-full gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setUserType("student")}
                  className={cn(
                    "flex-1 rounded-full py-3 font-semibold transition-all border-2",
                    userType === "student"
                      ? "bg-white text-[#6A4A98] border-white"
                      : "bg-transparent border-white/50 text-white/70 hover:bg-white/10 hover:border-white hover:text-white"
                  )}
                >
                  <Users className="inline-block mr-2" size={18} />
                  Aluno
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("teacher")}
                  className={cn(
                    "flex-1 rounded-full py-3 font-semibold transition-all border-2",
                    userType === "teacher"
                      ? "bg-white text-[#6A4A98] border-white"
                      : "bg-transparent border-white/50 text-white/70 hover:bg-white/10 hover:border-white hover:text-white"
                  )}
                >
                  <GraduationCap className="inline-block mr-2" size={18} />
                  Professor
                </button>
              </div>

              <div className="relative flex items-center">
                <User className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                <Input type="text" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus />
              </div>

              <div className="relative flex items-center">
                <FileText className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                <Input type="text" placeholder="CPF ou RG" value={document} onChange={(e) => setDocument(e.target.value)} className={inputClass} />
              </div>

              <div className="relative flex items-center">
                <Calendar className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                <Input type="date" placeholder="Data de nascimento" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={cn(inputClass, "pr-4")} />
                {age !== null && (
                  <span className="absolute right-4 text-[#6A4A98] text-sm font-medium">{age} anos</span>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
             <motion.div
             key="step2"
             custom={direction}
             variants={variants}
             initial="enter"
             animate="center"
             exit="exit"
             transition={{ duration: 0.2 }}
             className="space-y-4 w-full"
           >
              <div className="relative flex items-center">
                <MapPin className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                <Input type="text" placeholder="Endereço (Cidade/Estado)" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} autoFocus />
              </div>

              <div className="relative flex items-center">
                <Phone className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                <Input type="tel" placeholder="Telefone / Celular" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
              </div>
              
              <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                <p className="text-sm text-white/90 leading-relaxed text-center">
                  Utilizamos esses dados apenas para manter seu cadastro atualizado e para comunicações importantes sobre a plataforma.
                </p>
              </div>
           </motion.div>
          )}

          {step === 3 && (
             <motion.div
             key="step3"
             custom={direction}
             variants={variants}
             initial="enter"
             animate="center"
             exit="exit"
             transition={{ duration: 0.2 }}
             className="space-y-4 w-full"
           >
            {userType === "student" ? (
              <>
                <div className="relative flex items-center">
                  <Users className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                  <Input type="text" placeholder="Nome do responsável" value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputClass} autoFocus />
                </div>

                <div className="relative flex items-center">
                  <School className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                  <Input type="text" placeholder="Escola atual" value={school} onChange={(e) => setSchool(e.target.value)} className={inputClass} />
                </div>

                <div className="relative flex items-center">
                  <GraduationCap className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                  <Input type="text" placeholder="Série / Ano" value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass} />
                </div>
              </>
            ) : (
              <>
                 <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  <label className="text-sm text-white/70 ml-2">Escolas onde leciona</label>
                  {schools.map((s, index) => (
                    <div key={index} className="relative flex items-center gap-2">
                      <School className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                      <Input
                        type="text"
                        placeholder={`Escola ${index + 1}`}
                        value={s}
                        onChange={(e) => updateSchool(index, e.target.value)}
                        className={cn(inputClass, "flex-1")}
                        autoFocus={index === 0}
                      />
                      {schools.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSchool(index)}
                          className="p-2 bg-red-500/80 rounded-full hover:bg-red-600 transition-colors text-white"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSchool}
                    className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors ml-2"
                  >
                    <Plus size={16} /> Adicionar outra escola
                  </button>
                </div>

                <div className="relative flex items-center">
                  <GraduationCap className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className={cn(inputClass, "appearance-none cursor-pointer")}
                  >
                    <option value="">Grau de escolaridade</option>
                    <option value="graduacao">Graduação</option>
                    <option value="pos-graduacao">Pós-Graduação</option>
                    <option value="mestrado">Mestrado</option>
                    <option value="doutorado">Doutorado</option>
                    <option value="pos-doutorado">Pós-Doutorado</option>
                  </select>
                </div>

                <div className="relative flex items-center">
                  <FileText className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                  <Input type="text" placeholder="Formação (ex: Matemática)" value={degree} onChange={(e) => setDegree(e.target.value)} className={inputClass} />
                </div>
              </>
            )}
           </motion.div>
          )}

          {step === 4 && (
             <motion.div
             key="step4"
             custom={direction}
             variants={variants}
             initial="enter"
             animate="center"
             exit="exit"
             transition={{ duration: 0.2 }}
             className="space-y-4 w-full"
           >
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                <Input type="email" placeholder="Seu melhor E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoFocus />
              </div>

              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(inputClass, "pr-12")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label="Alternar visibilidade"
                  className="absolute right-4 text-[#6A4A98] transition-colors z-20"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-[#6A4A98] z-10" size={20} />
                <Input
                  type={showRepeatPassword ? "text" : "password"}
                  placeholder="Confirme a senha"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className={cn(inputClass, "pr-12")}
                />
                <button
                  type="button"
                  onClick={() => setShowRepeatPassword(p => !p)}
                  aria-label="Alternar visibilidade"
                  className="absolute right-4 text-[#6A4A98] transition-colors z-20"
                >
                  {showRepeatPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
           </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center text-sm bg-red-500/20 text-red-100 py-2 px-4 rounded-lg font-medium border border-red-500/30"
        >
          {error}
        </motion.p>
      )}

      {/* Navigation Buttons */}
      <div className="flex w-full max-w-md gap-4 mt-auto">
        {step > 1 ? (
          <Button 
            type="button" 
            onClick={handlePrev} 
            className="flex-1 rounded-full bg-transparent border-2 border-white/50 text-white hover:bg-white/10 hover:border-white h-12"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        ) : (
          <Button 
            type="button" 
            onClick={onToggleView} 
            className="flex-1 rounded-full bg-transparent border-2 border-white/50 text-white hover:bg-white/10 hover:border-white h-12"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Já tenho conta
          </Button>
        )}

        {step < totalSteps ? (
          <Button 
            type="button" 
            onClick={handleNext} 
            className="flex-[2] rounded-full bg-white text-[#6A4A98] hover:bg-gray-100 font-bold h-12"
          >
            Próximo <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleSignUp} 
            disabled={isLoading} 
            className="flex-[2] rounded-full bg-emerald-400 text-emerald-950 hover:bg-emerald-300 font-bold h-12"
          >
            {isLoading ? "Criando..." : "Concluir Cadastro"} <Check className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}