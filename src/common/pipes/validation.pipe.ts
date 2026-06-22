import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: unknown, { metatype, type }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    // Only validate body/query params, not route params or custom decorator values
    if (type !== 'body' && type !== 'query') {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object as object, { forbidUnknownValues: false });

    if (errors.length > 0) {
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints ?? {}),
      );
      throw new BadRequestException(messages);
    }

    return object;
  }

  private toValidate(metatype: new (...args: unknown[]) => unknown): boolean {
    const types: (new (...args: unknown[]) => unknown)[] = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return !types.includes(metatype);
  }
}
