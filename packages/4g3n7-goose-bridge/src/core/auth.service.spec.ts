import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      mockConfigService.get.mockReturnValue('development');
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'AUTH_USERS') {
          return `testuser:${hashedPassword}:admin:goose.tasks.create|goose.tasks.read`;
        }
        return undefined;
      });

      const result = await service.validateUser('testuser', 'testpassword');

      expect(result).toBeDefined();
      expect(result?.username).toBe('testuser');
    });

    it('should return null for invalid credentials', async () => {
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'AUTH_USERS') {
          return `testuser:${hashedPassword}:admin:goose.tasks.create`;
        }
        return undefined;
      });

      await expect(
        service.validateUser('testuser', 'wrongpassword'),
      ).rejects.toThrow();
    });

    it('should throw error if AUTH_USERS not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'AUTH_USERS') return undefined;
        return undefined;
      });

      await expect(
        service.validateUser('testuser', 'testpassword'),
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'AUTH_USERS') {
          return `testuser:${hashedPassword}:admin:goose.tasks.create`;
        }
        return undefined;
      });

      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login({
        username: 'testuser',
        password: 'testpassword',
      });

      expect(result).toBeDefined();
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user).toBeDefined();
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'AUTH_USERS') {
          return `testuser:${hashedPassword}:admin:*`;
        }
        return undefined;
      });

      await expect(
        service.login({
          username: 'testuser',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockPayload = {
        sub: '1',
        username: 'testuser',
        roles: ['admin'],
        permissions: ['*'],
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = await service.verifyToken('valid-token');

      expect(result).toBeDefined();
      expect(result.userId).toBe('1');
      expect(result.username).toBe('testuser');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});