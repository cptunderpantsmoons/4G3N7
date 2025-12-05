import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

export interface User {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: Omit<User, 'userId'>;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    // Load users from environment variables or database
    // For development, use environment variables with pre-hashed passwords
    // In production, this should validate against a database
    
    const isDevelopment = this.configService.get<string>('NODE_ENV') !== 'production';
    
    if (isDevelopment) {
      // Development: Use environment variables for user credentials
      // Format: AUTH_USERS=username1:hashedPassword1:roles1:permissions1,username2:hashedPassword2:roles2:permissions2
      const authUsersEnv = this.configService.get<string>('AUTH_USERS');
      
      if (authUsersEnv) {
        const users = authUsersEnv.split(',').map(userStr => {
          const [username, hashedPassword, rolesStr, permissionsStr] = userStr.split(':');
          return {
            username,
            hashedPassword,
            roles: rolesStr ? rolesStr.split('|') : [],
            permissions: permissionsStr ? permissionsStr.split('|') : [],
          };
        });
        
        const user = users.find(u => u.username === username);
        if (user && await bcrypt.compare(password, user.hashedPassword)) {
          return {
            userId: `dev-${username}`,
            username: user.username,
            roles: user.roles,
            permissions: user.permissions,
          };
        }
      }
    }
    
    // Production: Should use database
    // TODO: Implement database user validation
    // For now, return null to prevent unauthorized access
    throw new Error('User authentication not configured. Please set AUTH_USERS environment variable or implement database authentication.');
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.userId,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        username: user.username,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(token);
      return {
        userId: payload.sub,
        username: payload.username,
        roles: payload.roles,
        permissions: payload.permissions,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    const user = await this.verifyToken(token);
    const payload = {
      sub: user.userId,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        username: user.username,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }
}
