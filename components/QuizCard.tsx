import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle, XCircle, Award } from 'lucide-react-native';
import { colors, spacing, radii } from '../src/theme/tokens';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizCardProps {
  quiz: QuizQuestion;
  onComplete: (correct: boolean) => void;
}

export default function QuizCard({ quiz, onComplete }: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (index: number) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    
    const isCorrect = index === quiz.correctAnswer;
    setTimeout(() => {
      onComplete(isCorrect);
    }, 2000);
  };

  const isCorrect = selectedAnswer === quiz.correctAnswer;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Award size={24} color={colors.purple} />
        <Text style={styles.headerText}>Quick Quiz</Text>
      </View>

      <Text style={styles.question}>{quiz.question}</Text>

      <View style={styles.options}>
        {quiz.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === quiz.correctAnswer;
          const showCorrect = showResult && isCorrectOption;
          const showWrong = showResult && isSelected && !isCorrect;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                showCorrect && styles.optionCorrect,
                showWrong && styles.optionWrong,
              ]}
              onPress={() => handleAnswer(index)}
              disabled={showResult}
            >
              <Text style={[
                styles.optionText,
                (showCorrect || showWrong) && styles.optionTextBold
              ]}>
                {option}
              </Text>
              {showCorrect && (
                <CheckCircle size={20} color={colors.mint} fill={colors.mint} />
              )}
              {showWrong && (
                <XCircle size={20} color="#EF4444" fill="#EF4444" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {showResult && (
        <View style={[
          styles.result,
          isCorrect ? styles.resultCorrect : styles.resultWrong
        ]}>
          <Text style={styles.resultTitle}>
            {isCorrect ? '🎉 Correct!' : '💡 Not quite!'}
          </Text>
          <Text style={styles.resultText}>{quiz.explanation}</Text>
          {isCorrect && (
            <Text style={styles.pointsText}>+20 points earned!</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.purple,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[4],
    lineHeight: 26,
  },
  options: {
    gap: spacing[3],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.purple + '10',
  },
  optionCorrect: {
    borderColor: colors.mint,
    backgroundColor: colors.mint + '20',
  },
  optionWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  optionText: {
    fontSize: 16,
    color: colors.charcoal,
    flex: 1,
  },
  optionTextBold: {
    fontWeight: '600',
  },
  result: {
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radii.lg,
  },
  resultCorrect: {
    backgroundColor: colors.mint + '20',
  },
  resultWrong: {
    backgroundColor: '#FEE2E2',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  resultText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.mint,
    marginTop: spacing[2],
  },
});
