/**
 * 体测项目「计分方式」与后端 `ExamProjectScoreType` 一致（库存 `exam_project.score_type`）。
 * 与 backend/src/exam-project/constants/exam-project-score-type.ts 保持同步。
 */
export const ExamProjectScoreType = {
  Time: 'time',
  Count: 'count',
  Distance: 'distance',
} as const;

export type ExamProjectScoreTypeValue =
  (typeof ExamProjectScoreType)[keyof typeof ExamProjectScoreType];

export const EXAM_PROJECT_SCORE_TYPE_OPTIONS: {
  label: string;
  value: ExamProjectScoreTypeValue;
}[] = [
  { label: '计时', value: 'time' },
  { label: '计数', value: 'count' },
  { label: '计距', value: 'distance' },
];

const LABEL_BY_CODE: Record<ExamProjectScoreTypeValue, string> = {
  time: '计时',
  count: '计数',
  distance: '计距',
};

export function examProjectScoreTypeLabel(code: string | null | undefined): string {
  if (!code) return '';
  return LABEL_BY_CODE[code as ExamProjectScoreTypeValue] ?? code;
}
