import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Customer } from '../customers/entities/customer.entity';
import { RefreshToken, TokenOwnerType } from './entities/refresh-token.entity';
import { OAuthProvider, OAuthProviderType, OAuthOwnerType } from './entities/oauth-provider.entity';
import { OAuthExchangeCode } from './entities/oauth-exchange-code.entity';
import { LessThan } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { LoginDto, RegisterCustomerDto, AuthResponseDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(OAuthProvider)
    private readonly oauthProviderRepo: Repository<OAuthProvider>,
    @InjectRepository(OAuthExchangeCode)
    private readonly oauthExchangeCodeRepo: Repository<OAuthExchangeCode>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async registerCustomer(
    dto: RegisterCustomerDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const existing = await this.customerRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const verificationToken = uuidv4();
    const customer = this.customerRepo.create({
      ...dto,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await this.customerRepo.save(customer);

    await this.mailService.sendWelcome(customer.email, customer.firstName);
    await this.mailService.sendEmailVerification(
      customer.email,
      customer.firstName,
      verificationToken,
    );

    return this.generateTokens(customer, 'customer', ipAddress, userAgent);
  }

  async loginCustomer(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const customer = await this.customerRepo.findOne({
      where: { email: dto.email, isActive: true },
      select: { id: true, email: true, password: true, firstName: true, lastName: true, isActive: true },
    });

    if (!customer || !(await customer.validatePassword(dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.customerRepo.update(customer.id, { lastLoginAt: new Date() });

    return this.generateTokens(customer, 'customer', ipAddress, userAgent);
  }

  async bootstrapAdmin(): Promise<{ email: string; password: string; message: string }> {
    const userCount = await this.userRepo.count();
    if (userCount > 0) {
      throw new BadRequestException('Admin bootstrap already completed');
    }

    const defaultRoles = [
      { name: 'super_admin', description: 'Full access to everything', isSystem: true },
      { name: 'admin', description: 'General admin access', isSystem: true },
      { name: 'marketing_manager', description: 'Marketing and promotions', isSystem: true },
      { name: 'warehouse_manager', description: 'Inventory and shipping', isSystem: true },
      { name: 'finance_manager', description: 'Orders and payments', isSystem: true },
      { name: 'customer_support', description: 'Customer service', isSystem: true },
      { name: 'content_editor', description: 'Blog and CMS', isSystem: true },
    ];

    for (const roleData of defaultRoles) {
      const exists = await this.roleRepo.findOne({ where: { name: roleData.name } });
      if (!exists) await this.roleRepo.save(this.roleRepo.create(roleData));
    }

    const defaultPermissions = [
      { resource: 'products', action: 'create' }, { resource: 'products', action: 'read' },
      { resource: 'products', action: 'update' }, { resource: 'products', action: 'delete' },
      { resource: 'orders', action: 'read' }, { resource: 'orders', action: 'update' },
      { resource: 'orders', action: 'refund' }, { resource: 'customers', action: 'read' },
      { resource: 'customers', action: 'update' }, { resource: 'inventory', action: 'manage' },
      { resource: 'marketing', action: 'manage' }, { resource: 'reports', action: 'view' },
      { resource: 'settings', action: 'manage' }, { resource: 'users', action: 'manage' },
      { resource: 'blog', action: 'manage' }, { resource: 'support', action: 'manage' },
    ];

    for (const permData of defaultPermissions) {
      const exists = await this.permissionRepo.findOne({
        where: { resource: permData.resource, action: permData.action },
      });
      if (!exists) await this.permissionRepo.save(this.permissionRepo.create(permData));
    }

    const superAdminRole = await this.roleRepo.findOne({
      where: { name: 'super_admin' },
      relations: { permissions: true },
    });
    if (superAdminRole) {
      superAdminRole.permissions = await this.permissionRepo.find();
      await this.roleRepo.save(superAdminRole);
    }

    // Randomly generated per-call rather than a hardcoded literal — a fixed, source-visible
    // password would let anyone who reads this file log in as super_admin on any deployment
    // where this public (though count()===0-gated) endpoint gets called, e.g. after a DB wipe.
    const email = 'admin@cgagames.com';
    const password = `${randomBytes(12).toString('base64url')}Aa1!`;

    const admin = this.userRepo.create({
      email,
      password,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      isEmailVerified: true,
      roles: superAdminRole ? [superAdminRole] : [],
    });
    await this.userRepo.save(admin);

    return {
      email,
      password,
      message: 'Default admin account created. Change the password after first login.',
    };
  }

  async loginUser(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email, isActive: true },
      select: { id: true, email: true, password: true, firstName: true, lastName: true, isActive: true },
      relations: { roles: { permissions: true } },
    });

    if (!user || !(await user.validatePassword(dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    return this.generateTokens(user, 'user', ipAddress, userAgent);
  }

  async refreshTokens(
    rawToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const tokenEntity = await this.refreshTokenRepo.findOne({
      where: { token: rawToken, isRevoked: false },
    });

    if (!tokenEntity || tokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenRepo.update(tokenEntity.id, { isRevoked: true });

    if (tokenEntity.ownerType === TokenOwnerType.USER && tokenEntity.userId) {
      const user = await this.userRepo.findOne({
        where: { id: tokenEntity.userId, isActive: true },
      });
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user, 'user', ipAddress, userAgent);
    } else if (tokenEntity.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: tokenEntity.customerId, isActive: true },
      });
      if (!customer) throw new UnauthorizedException();
      return this.generateTokens(customer, 'customer', ipAddress, userAgent);
    }

    throw new UnauthorizedException();
  }

  /** `requester` scopes revocation to the caller's own token — without it, anyone who knows any
   * valid-looking refresh token string could revoke another user's session with zero auth. */
  async logout(rawToken: string, requester?: { id: string; type: 'user' | 'customer' }): Promise<void> {
    if (!requester) {
      await this.refreshTokenRepo.update({ token: rawToken }, { isRevoked: true });
      return;
    }
    const tokenEntity = await this.refreshTokenRepo.findOne({ where: { token: rawToken } });
    if (!tokenEntity) return;
    const owns =
      (requester.type === 'user' && tokenEntity.ownerType === TokenOwnerType.USER && tokenEntity.userId === requester.id) ||
      (requester.type === 'customer' && tokenEntity.ownerType === TokenOwnerType.CUSTOMER && tokenEntity.customerId === requester.id);
    if (!owns) return;
    await this.refreshTokenRepo.update(tokenEntity.id, { isRevoked: true });
  }

  /** Revokes every active refresh token for a customer — called after a password reset/change so a
   * previously-stolen refresh token can't keep minting new access tokens past the reset. */
  async revokeAllCustomerRefreshTokens(customerId: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { customerId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async verifyEmail(token: string): Promise<void> {
    const customer = await this.customerRepo.findOne({
      where: { emailVerificationToken: token },
    });

    if (!customer || !customer.emailVerificationExpires) {
      throw new BadRequestException('Invalid verification token');
    }

    if (customer.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Verification token expired');
    }

    await this.customerRepo.update(customer.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const customer = await this.customerRepo.findOne({ where: { email } });
    if (!customer) return;

    const resetToken = uuidv4();
    await this.customerRepo.update(customer.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    await this.mailService.sendPasswordReset(customer.email, customer.firstName, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const customer = await this.customerRepo.findOne({
      where: { passwordResetToken: token },
    });

    if (!customer || !customer.passwordResetExpires) {
      throw new BadRequestException('Invalid reset token');
    }

    if (customer.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token expired');
    }

    customer.password = newPassword;
    await this.customerRepo.save(customer);
    await this.customerRepo.update(customer.id, {
      passwordResetToken: null,
      passwordResetExpires: null,
    });
    // A refresh token issued before this reset (e.g. one that leaked) must not remain valid after
    // the customer has deliberately changed their password.
    await this.revokeAllCustomerRefreshTokens(customer.id);
  }

  async handleOAuthCallback(
    provider: OAuthProviderType,
    providerUserId: string,
    email: string,
    firstName: string,
    lastName: string,
    accessToken: string,
    refreshToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    let oauthRecord = await this.oauthProviderRepo.findOne({
      where: { provider, providerUserId, ownerType: OAuthOwnerType.CUSTOMER },
    });

    if (oauthRecord?.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: oauthRecord.customerId, isActive: true },
      });
      if (customer) {
        await this.customerRepo.update(customer.id, { lastLoginAt: new Date() });
        return this.generateTokens(customer, 'customer', ipAddress, userAgent);
      }
    }

    let customer = await this.customerRepo.findOne({ where: { email } });

    if (!customer) {
      customer = this.customerRepo.create({
        email,
        firstName,
        lastName,
        isEmailVerified: true,
        isActive: true,
      });
      await this.customerRepo.save(customer);
      await this.mailService.sendWelcome(customer.email, customer.firstName);
    }

    if (!oauthRecord) {
      oauthRecord = this.oauthProviderRepo.create({
        provider,
        providerUserId,
        ownerType: OAuthOwnerType.CUSTOMER,
        customerId: customer.id,
        accessToken,
        refreshToken: refreshToken ?? null,
      });
    } else {
      oauthRecord.customerId = customer.id;
      oauthRecord.accessToken = accessToken;
      oauthRecord.refreshToken = refreshToken ?? null;
    }
    await this.oauthProviderRepo.save(oauthRecord);

    await this.customerRepo.update(customer.id, { lastLoginAt: new Date() });
    return this.generateTokens(customer, 'customer', ipAddress, userAgent);
  }

  /**
   * Stores the real tokens server-side and returns a short-lived, single-use opaque code to put
   * in the OAuth redirect URL instead — putting the actual access/refresh tokens in a URL query
   * string leaks them via browser history, Referer headers, and reverse-proxy/CDN access logs.
   */
  async createOAuthExchangeCode(tokens: AuthResponseDto): Promise<string> {
    const code = uuidv4();
    await this.oauthExchangeCodeRepo.save(
      this.oauthExchangeCodeRepo.create({
        code,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        expiresAt: new Date(Date.now() + 60 * 1000),
      }),
    );
    return code;
  }

  /** Single-use: the row is deleted immediately whether or not it was found/valid. */
  async exchangeOAuthCode(code: string): Promise<AuthResponseDto> {
    const entry = await this.oauthExchangeCodeRepo.findOne({ where: { code } });
    if (entry) await this.oauthExchangeCodeRepo.delete(entry.id);
    // Opportunistic cleanup of stale rows — this table has no scheduled job of its own.
    await this.oauthExchangeCodeRepo.delete({ expiresAt: LessThan(new Date()) });

    if (!entry || entry.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired exchange code');
    }
    return { accessToken: entry.accessToken, refreshToken: entry.refreshToken, expiresIn: entry.expiresIn };
  }

  private async generateTokens(
    entity: User | Customer,
    type: 'user' | 'customer',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: entity.id,
      email: entity.email,
      type,
      roles: type === 'user'
        ? (entity as User).roles?.map((r) => r.name) ?? []
        : undefined,
    };

    // Access tokens never expire (no `exp` claim signed at all) — sessions are only ended by an
    // explicit logout (which revokes the refresh token; the access token itself stays valid until
    // then, same tradeoff any non-expiring token carries).
    const accessToken = this.jwtService.sign(payload);
    const expiresIn = 100 * 365 * 24 * 60 * 60;

    const refreshExpiresInDays = 30;
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + refreshExpiresInDays);

    const rawRefreshToken = uuidv4();

    const tokenEntity = this.refreshTokenRepo.create({
      token: rawRefreshToken,
      ownerType: type === 'user' ? TokenOwnerType.USER : TokenOwnerType.CUSTOMER,
      userId: type === 'user' ? entity.id : null,
      customerId: type === 'customer' ? entity.id : null,
      expiresAt: refreshExpiresAt,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });
    await this.refreshTokenRepo.save(tokenEntity);

    await this.cleanupExpiredTokens(entity.id, type);

    return { accessToken, refreshToken: rawRefreshToken, expiresIn };
  }

  private async cleanupExpiredTokens(ownerId: string, type: 'user' | 'customer'): Promise<void> {
    const where = type === 'user'
      ? { userId: ownerId, isRevoked: false }
      : { customerId: ownerId, isRevoked: false };

    const tokens = await this.refreshTokenRepo.find({ where });
    const expired = tokens.filter((t) => t.expiresAt < new Date());

    if (expired.length > 0) {
      await this.refreshTokenRepo.remove(expired);
    }
  }
}
