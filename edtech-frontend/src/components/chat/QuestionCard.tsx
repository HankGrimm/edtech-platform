import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import { Check, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface QuestionData {
  id: number;
  stem: string;
  options: string[]; // ["A. xxxx", "B. xxxx"]
  correctAnswer: string; // "A" or "B" or "0" (index)
  analysis: string;
}

interface QuestionCardProps {
  question: QuestionData;
  onSubmit: (isCorrect: boolean, selectedOption: string) => void;
  showHint?: boolean;
}

export function QuestionCard({ question, onSubmit, showHint = true }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setIsSubmitted(true);

    // Assuming correct answer is index-based (0, 1, 2, 3) or Letter (A, B, C, D)
    // Here we handle Letter case: "A" -> 0
    const correctIndex = question.correctAnswer.charCodeAt(0) - 'A'.charCodeAt(0);
    const isCorrect = selected === correctIndex;
    
    onSubmit(isCorrect, String.fromCharCode('A'.charCodeAt(0) + selected));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-black/5"
    >
      {/* 1. Header & Stem */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-8 py-6">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-indigo-500">
          AI Generated Question
        </h3>
        <div className="text-lg font-medium leading-relaxed text-slate-800">
          <Latex>{question.stem}</Latex>
        </div>
      </div>

      {/* 2. Options List */}
      <div className="p-8 space-y-3">
        {question.options.map((option, index) => {
          // Determine status for styling
          const isSelected = selected === index;
          const isCorrect = isSubmitted && index === (question.correctAnswer.charCodeAt(0) - 'A'.charCodeAt(0));
          const isWrong = isSubmitted && isSelected && !isCorrect;

          let optionClass = "hover:bg-indigo-50 hover:border-indigo-200";
          if (isSelected) optionClass = "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500";
          if (isCorrect) optionClass = "bg-green-50 border-green-500 ring-1 ring-green-500";
          if (isWrong) optionClass = "bg-red-50 border-red-500 ring-1 ring-red-500";

          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitted}
              onClick={() => setSelected(index)}
              className={clsx(
                "group relative w-full rounded-2xl border px-5 py-4 text-left transition-all duration-200",
                "border-slate-200",
                optionClass
              )}
            >
              <div className="flex items-center gap-3">
                {/* Option Letter Circle */}
                <span className={clsx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                  isSelected || isCorrect || isWrong ? "bg-white shadow-sm" : "bg-slate-100 text-slate-500"
                )}>
                  {String.fromCharCode(65 + index)}
                </span>
                
                {/* Option Text */}
                <span className="text-slate-700">
                   <Latex>{option}</Latex>
                </span>

                {/* Status Icon */}
                <div className="ml-auto">
                  {isCorrect && <Check className="h-5 w-5 text-green-600" />}
                  {isWrong && <X className="h-5 w-5 text-red-500" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 3. Footer / Action */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-8 py-5">
        <span className="text-sm text-slate-400">
          {isSubmitted ? (showHint ? "解析已显示在下方" : "已提交") : "请选择一个选项"}
        </span>
        
        <AnimatePresence>
          {!isSubmitted && selected !== null && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={handleSubmit}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-transform hover:scale-105 active:scale-95"
            >
              提交答案
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Analysis (Reveal after submit, only if showHint enabled) */}
      <AnimatePresence>
        {isSubmitted && showHint && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden bg-slate-900 px-8"
          >
            <div className="py-6 text-slate-200">
              <h4 className="mb-2 font-bold text-indigo-300">💡 题目解析</h4>
              <div className="leading-relaxed opacity-90">
                {question.analysis
                  ? <Latex>{question.analysis}</Latex>
                  : <span className="flex items-center gap-2 text-slate-400 text-sm"><span className="w-3 h-3 border-2 border-slate-500 border-t-indigo-400 rounded-full animate-spin" />AI 解析生成中...</span>
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
