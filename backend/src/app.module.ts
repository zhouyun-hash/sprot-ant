import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ClassModule } from './class/class.module';
import { StudentModule } from './student/student.module';
import { TeacherModule } from './teacher/teacher.module';
import { TaskModule } from './task/task.module';
import { ScoreModule } from './score/score.module';
import { HomeworkModule } from './homework/homework.module';
import { AiModule } from './ai/ai.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportModule } from './report/report.module';
import { SyncModule } from './sync/sync.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { UploadModule } from './upload/upload.module';
import { RankModule } from './rank/rank.module';
import { AlertModule } from './alert/alert.module';
import { SimulationModule } from './simulation/simulation.module';
import { ParentModule } from './parent/parent.module';
import { SchoolModule } from './school/school.module';
import { GradeModule } from './grade/grade.module';
import { RoleModule } from './role/role.module';
import { VenueModule } from './venue/venue.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { ExamProjectModule } from './exam-project/exam-project.module';
import { ExamStandardModule } from './exam-standard/exam-standard.module';
import { ExamPlanModule } from './exam-plan/exam-plan.module';
import { ExamBatchModule } from './exam-batch/exam-batch.module';
import { ScoreReviewModule } from './score-review/score-review.module';
import { DeviceModule } from './device/device.module';
import { RtspModule } from './rtsp/rtsp.module';
import { AiConfigModule } from './ai-config/ai-config.module';
import { CourseScheduleModule } from './schedule/schedule.module';
import { TeachingPlanModule } from './teaching-plan/teaching-plan.module';
import { ResourceLibraryModule } from './resource-library/resource-library.module';
import { HomeworkReviewModule } from './homework-review/homework-review.module';
import { ExercisePrescriptionModule } from './exercise-prescription/exercise-prescription.module';
import { MessageModule } from './message/message.module';
import { BackupModule } from './backup/backup.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { BadgeModule } from './badge/badge.module';
import { AppVersionModule } from './app-version/app-version.module';
import { HelpModule } from './help/help.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.local'] }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: parseInt(config.get<string>('DB_PORT') ?? '3306', 10),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'smart_sports'),
        autoLoadEntities: true,
        // 已启用 TypeORM migrations，synchronize 统一关闭
        // 如需紧急同步可设 DB_SYNC=true（生产环境严禁开启）
        synchronize: config.get<string>('DB_SYNC') === 'true',
        // 应用启动时自动执行未运行的迁移（可通过 DB_MIGRATIONS_RUN=false 关闭）
        migrationsRun: config.get<string>('DB_MIGRATIONS_RUN') !== 'false',
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: config.get<string>('DB_LOGGING') === 'true',
        extra: { decimalNumbers: true },
      }),
    }),
    RedisModule,
    HealthModule,
    AuthModule,
    UserModule,
    ClassModule,
    StudentModule,
    TeacherModule,
    TaskModule,
    ScoreModule,
    HomeworkModule,
    AiModule,
    DashboardModule,
    ReportModule,
    RankModule,
    AlertModule,
    SimulationModule,
    ParentModule,
    SyncModule,
    UploadModule,
    SchoolModule,
    GradeModule,
    RoleModule,
    VenueModule,
    AuditLogModule,
    ExamProjectModule,
    ExamStandardModule,
    ExamPlanModule,
    ExamBatchModule,
    ScoreReviewModule,
    DeviceModule,
    RtspModule,
    AiConfigModule,
    CourseScheduleModule,
    TeachingPlanModule,
    ResourceLibraryModule,
    HomeworkReviewModule,
    ExercisePrescriptionModule,
    MessageModule,
    BackupModule,
    SystemConfigModule,
    BadgeModule,
    AppVersionModule,
    HelpModule,
  ],
})
export class AppModule {}
