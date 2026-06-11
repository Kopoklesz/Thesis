import { Injectable, CanActivate, ForbiddenException } from '@nestjs/common';

/**
 * A nyilvános referencia példányon (REFERENCE_MODE=true) a felhasználói
 * fiókok nem módosíthatók: nincs regisztráció, jelszóváltoztatás, törlés,
 * szerepkör- és demo-mód állítás. Így a megosztott minta fiókok nem
 * sajátíthatók ki és nem tehetők tönkre. Minden más funkció (webshopok,
 * termékek, pontok, vásárlás) szabadon kipróbálható.
 */
@Injectable()
export class ReferenceModeGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.REFERENCE_MODE === 'true') {
      throw new ForbiddenException(
        'A nyilvános referencia verzióban ez a művelet nem érhető el',
      );
    }
    return true;
  }
}
