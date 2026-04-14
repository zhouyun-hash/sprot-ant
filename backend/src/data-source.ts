import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

// 加载 .env（与 app.module.ts 中 ConfigModule 行为一致）
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });

/**
 * 独立 DataSource 配置 —— 供 TypeORM CLI 使用
 *
 * 用途:
 *   npx typeorm migration:generate -d dist/data-source.js src/migrations/XXX
 *   npx typeorm migration:run      -d dist/data-source.js
 *   npx typeorm migration:revert   -d dist/data-source.js
 *
 * 注意:
 *   CLI 读取的是编译后的 dist/data-source.js，运行前需先执行 npm run build
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'smart_sports',
  // CLI 需要显式指定实体路径（不能用 NestJS 的 autoLoadEntities）
  entities: [path.join(__dirname, '**', '*.entity.{ts,js}')],
  // 迁移文件路径
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  // CLI 模式下不自动同步
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  extra: { decimalNumbers: true },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
