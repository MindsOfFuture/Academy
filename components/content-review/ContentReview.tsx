"use client";

import { useState } from "react";
import { Star, MessageSquare, Send, X, ChevronDown, ChevronUp } from "lucide-react";
import { trackingService } from "@/lib/services/tracking.service";
import type { ReviewScope, ReviewRating } from "@/lib/api/telemetry-types";
import toast from "react-hot-toast";

interface ContentReviewProps {
  /** UUID do curso */
  courseId: string;
  /** UUID da aula (obrigatório quando scope='lesson') */
  lessonId?: string;
  /** UUID da matrícula */
  enrollmentId?: string;
  /** Escopo: avaliação de aula ou curso inteiro */
  scope: ReviewScope;
  /** Porcentagem de conclusão do curso no momento (0-100) */
  courseCompletionPercent: number;
  /** Label exibido (ex: "Avaliar esta aula" ou "Avaliar este curso") */
  label?: string;
  /** Variante visual: inline (embutido) ou compact (botão que expande) */
  variant?: "inline" | "compact";
}

/**
 * Componente de avaliação qualitativa (1-5 estrelas + comentário opcional).
 * Dispara evento `content_reviewed` via TrackingService ao enviar.
 *
 * Mantém a identidade visual da plataforma: roxo #684A97, purple-600, rounded-lg.
 */
export default function ContentReview({
  courseId,
  lessonId,
  enrollmentId,
  scope,
  courseCompletionPercent,
  label,
  variant = "compact",
}: ContentReviewProps) {
  const [isExpanded, setIsExpanded] = useState(variant === "inline");
  const [rating, setRating] = useState<ReviewRating | 0>(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const defaultLabel =
    scope === "lesson" ? "Avaliar esta aula" : "Avaliar este curso";
  const displayLabel = label || defaultLabel;

  const starLabels = ["", "Muito ruim", "Ruim", "Regular", "Bom", "Excelente"];

  async function handleSubmit() {
    if (rating === 0) {
      toast.error("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    setIsSubmitting(true);
    try {
      await trackingService.trackContentReview({
        courseId,
        lessonId: scope === "lesson" ? lessonId : undefined,
        enrollmentId,
        rating: rating as ReviewRating,
        comment: comment.trim() || undefined,
        reviewScope: scope,
        courseCompletionPercent,
      });

      setHasSubmitted(true);
      toast.success("Avaliação enviada! Obrigado pelo feedback. ✨");
    } catch (error) {
      console.error("[ContentReview] Erro ao enviar avaliação:", error);
      toast.error("Não foi possível enviar sua avaliação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setHasSubmitted(false);
    setRating(0);
    setHoveredStar(0);
    setComment("");
  }

  // Estado pós-envio: mensagem de agradecimento
  if (hasSubmitted) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-purple-700 font-medium">
              Obrigado pela sua avaliação!
            </span>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-purple-500 hover:text-purple-700 transition-colors underline"
          >
            Avaliar novamente
          </button>
        </div>
      </div>
    );
  }

  // Variante compacta: botão que expande
  if (variant === "compact" && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-100 rounded-lg transition-all duration-200 group"
      >
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-purple-500 group-hover:text-purple-600 transition-colors" />
          <span className="text-sm font-medium text-purple-700 group-hover:text-purple-800 transition-colors">
            {displayLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-3.5 h-3.5 text-gray-300 group-hover:text-purple-300 transition-colors"
              />
            ))}
          </div>
          <ChevronDown className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
        </div>
      </button>
    );
  }

  // Formulário expandido
  return (
    <div className="bg-white border border-purple-100 rounded-lg shadow-sm overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">
            {displayLabel}
          </span>
        </div>
        {variant === "compact" && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded-md hover:bg-purple-100 transition-colors"
            aria-label="Fechar avaliação"
          >
            <ChevronUp className="w-4 h-4 text-purple-500" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Estrelas */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5] as ReviewRating[]).map((star) => {
              const isActive = star <= (hoveredStar || rating);
              return (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 rounded-full hover:bg-purple-50 transition-all duration-150 transform hover:scale-110"
                  aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`w-7 h-7 transition-all duration-150 ${
                      isActive
                        ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                        : "text-gray-300 hover:text-purple-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {(hoveredStar > 0 || rating > 0) && (
            <span className="text-xs text-purple-600 font-medium animate-in fade-in duration-150">
              {starLabels[hoveredStar || rating]}
            </span>
          )}
        </div>

        {/* Comentário (só aparece após selecionar estrelas) */}
        {rating > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              <label className="text-xs text-gray-500 font-medium">
                Comentário (opcional)
              </label>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                scope === "lesson"
                  ? "O que você achou desta aula?"
                  : "Como foi sua experiência com o curso?"
              }
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 placeholder:text-gray-400 transition-all"
              rows={3}
              maxLength={500}
            />
            {comment.length > 0 && (
              <p className="text-xs text-gray-400 text-right">
                {comment.length}/500
              </p>
            )}
          </div>
        )}

        {/* Botão enviar */}
        {rating > 0 && (
          <div className="flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <button
              onClick={() => {
                setRating(0);
                setComment("");
                setHoveredStar(0);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Limpar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-[#684A97] hover:bg-[#553d7a] text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Enviar avaliação
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
