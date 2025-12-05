import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { GooseBridgeModule } from './bridge.module';

describe('BridgeController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GooseBridgeModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/goose/extensions (GET)', () => {
    it('should return list of extensions', () => {
      return request(app.getHttpServer())
        .get('/api/v1/goose/extensions')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('extensions');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.extensions)).toBe(true);
        });
    });
  });

  describe('/api/v1/goose/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/goose/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('extensions');
          expect(res.body).toHaveProperty('tasks');
        });
    });
  });

  describe('/api/v1/goose/tasks (GET)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/goose/tasks')
        .expect(401);
    });
  });

  describe('/api/v1/goose/tasks (POST)', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/goose/tasks')
        .send({
          type: 'test',
          extensionId: 'test-extension',
          payload: {},
        })
        .expect(401);
    });
  });
});

