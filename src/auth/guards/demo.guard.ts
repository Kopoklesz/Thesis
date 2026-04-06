import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class DemoGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.is_demo === true) {
      throw new ForbiddenException('Demo felhasználóval ez a művelet nem hajtható végre');
    }

    return true;
  }
}
