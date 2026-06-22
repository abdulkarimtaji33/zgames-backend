import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'user' | 'customer';
  roles?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<User | Customer> {
    if (payload.type === 'user') {
      const user = await this.userRepo.findOne({
        where: { id: payload.sub, isActive: true },
      });
      if (!user) throw new UnauthorizedException();
      return user;
    } else {
      const customer = await this.customerRepo.findOne({
        where: { id: payload.sub, isActive: true },
      });
      if (!customer) throw new UnauthorizedException();
      return customer;
    }
  }
}
