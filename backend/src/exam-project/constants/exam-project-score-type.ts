/**
 * 体测项目「计分方式」统一枚举（库存 `exam_project.score_type`）。
 * 与 PC 管理端 `pc-web/src/constants/examProjectScoreType.ts` 保持一致。
 */
export enum ExamProjectScoreType {
  /** 计时（越小越好，如秒） */
  Time = 'time',
  /** 计数（越大越好，如次数） */
  Count = 'count',
  /** 计距（越大越好，如米） */
  Distance = 'distance',
}

export const EXAM_PROJECT_SCORE_TYPE_VALUES = Object.values(
  ExamProjectScoreType,
) as ExamProjectScoreType[];

/** 中文旧数据 / 别名 → 标准码 */
const LEGACY_TO_CODE: Record<string, ExamProjectScoreType> = {
  计时: ExamProjectScoreType.Time,
  计数: ExamProjectScoreType.Count,
  计距: ExamProjectScoreType.Distance,
  timing: ExamProjectScoreType.Time,
  TIME: ExamProjectScoreType.Time,
  Time: ExamProjectScoreType.Time,
  count: ExamProjectScoreType.Count,
  COUNT: ExamProjectScoreType.Count,
  Count: ExamProjectScoreType.Count,
  distance: ExamProjectScoreType.Distance,
  DISTANCE: ExamProjectScoreType.Distance,
  Distance: ExamProjectScoreType.Distance,
};

export function normalizeExamProjectScoreType(
  raw: string | null | undefined,
): ExamProjectScoreType {
  const s = (raw ?? '').trim();
  if (!s) {
    return ExamProjectScoreType.Count;
  }
  if (EXAM_PROJECT_SCORE_TYPE_VALUES.includes(s as ExamProjectScoreType)) {
    return s as ExamProjectScoreType;
  }
  const mapped = LEGACY_TO_CODE[s];
  if (mapped) {
    return mapped;
  }
  return ExamProjectScoreType.Count;
}
