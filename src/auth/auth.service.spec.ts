import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { signAsync: ReturnType<typeof vi.fn> };
  let usersService: {
    findByEmailWithPassword: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    usersService = {
      findByEmailWithPassword: vi.fn(),
      create: vi.fn(),
    };
    jwtService = { signAsync: vi.fn().mockResolvedValue('signed-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('hashes the password and returns public user details on registration', async () => {
    const user = {
      id: 1,
      email: 'ana@example.com',
      passwordHash: 'hashed-password',
      createdAt: new Date(),
    };
    usersService.create.mockResolvedValue(user);

    const result = await service.register({
      email: user.email,
      password: 'secure-password',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      user.email,
      expect.any(String),
    );
    expect(usersService.create.mock.calls[0][1]).not.toBe('secure-password');
    expect(result).toEqual({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });
  });

  it('returns user details for valid credentials', async () => {
    const password = 'secure-password';
    const passwordHash = await bcrypt.hash(password, 4);
    const user = {
      id: 1,
      email: 'ana@example.com',
      passwordHash,
      createdAt: new Date(),
    };
    usersService.findByEmailWithPassword.mockResolvedValue(user);

    const result = await service.login({
      email: user.email,
      password,
    } satisfies LoginDto);

    expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith(user.email);
    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  });

  it('rejects invalid credentials', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'secure-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
