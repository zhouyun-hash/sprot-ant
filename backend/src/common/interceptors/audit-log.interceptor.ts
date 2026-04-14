import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../audit-log/entities/audit-log.entity';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    if (method === 'GET') return next.handle();

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditLogRepo.save({
            userId: user?.id || null,
            username: user?.username || 'anonymous',
            action: method,
            resource: url,
            detail: JSON.stringify(body || {}).substring(0, 2000),
            ip: request.ip || request.headers['x-forwarded-for'] || '',
            duration: Date.now() - startTime,
            status: 'success',
          }).catch(() => {});
        },
        error: (err) => {
          this.auditLogRepo.save({
            userId: user?.id || null,
            username: user?.username || 'anonymous',
            action: method,
            resource: url,
            detail: JSON.stringify(body || {}).substring(0, 2000),
            ip: request.ip || request.headers['x-forwarded-for'] || '',
            duration: Date.now() - startTime,
            status: 'error',
            errorMessage: err?.message?.substring(0, 500) || '',
          }).catch(() => {});
        },
      }),
    );
  }
}
