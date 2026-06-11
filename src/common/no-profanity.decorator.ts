import { registerDecorator, ValidationOptions } from 'class-validator';
import { containsProfanity } from './profanity';

/**
 * Class-validator dekorátor: a mező értéke nem tartalmazhat trágár vagy
 * sértő kifejezést. Publikusan megjelenő nevekre (felhasználónév, webshop-
 * és terméknév, kategória) alkalmazandó.
 */
export function NoProfanity(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'noProfanity',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value !== 'string' || !containsProfanity(value);
        },
        defaultMessage(): string {
          return 'A megadott név nem megengedett kifejezést tartalmaz';
        },
      },
    });
  };
}
