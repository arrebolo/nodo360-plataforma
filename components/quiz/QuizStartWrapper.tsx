"use client";

import { useRouter, usePathname } from "next/navigation";
import { QuizStartCard } from "./QuizStartCard";
import type { QuizAttempt } from "@/types/database";

interface QuizStartWrapperProps {
  moduleTitle: string;
  questionCount: number;
  passingScore?: number;
  estimatedMinutes?: number;
  previousAttempts: QuizAttempt[];
  bestAttempt: QuizAttempt | null;
}

export function QuizStartWrapper({
  moduleTitle,
  questionCount,
  passingScore = 70,
  estimatedMinutes,
  previousAttempts,
  bestAttempt,
}: QuizStartWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleStart = () => {
    router.push(`${pathname}?start=true`);
  };

  return (
    <QuizStartCard
      moduleTitle={moduleTitle}
      questionCount={questionCount}
      passingScore={passingScore}
      estimatedMinutes={estimatedMinutes}
      previousAttempts={previousAttempts}
      bestAttempt={bestAttempt}
      onStart={handleStart}
    />
  );
}
