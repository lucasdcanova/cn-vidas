import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import profileImageRouter from '../../routes/profile-image-routes';
import profileUploadRouter from '../../routes/profile-upload';
import { storage } from '../../storage';
import SecureStorageService from '../../services/secure-storage-service';

// Mock dependencies
jest.mock('../../db');
jest.mock('../../storage');
jest.mock('../../services/secure-storage-service');
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    // Simulate authentication
    if (req.headers.authorization || req.headers['x-auth-token']) {
      req.user = { id: 'test-user-id', role: 'doctor' };
      next();
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  }
}));

jest.mock('../../middleware/auth-unified', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    if (req.headers.authorization || req.headers['x-auth-token']) {
      req.user = { id: 'test-user-id', role: 'doctor' };
      next();
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  },
  requireDoctor: (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'doctor') {
      next();
    } else {
      res.status(403).json({ error: 'Not authorized' });
    }
  },
  requirePartner: (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'partner') {
      next();
    } else {
      res.status(403).json({ error: 'Not authorized' });
    }
  },
  AuthRequest: {}
}));

describe('Doctor Profile Upload Tests', () => {
  let app: express.Application;
  const authToken = jwt.sign({ id: 'test-user-id', role: 'doctor' }, process.env.JWT_SECRET || 'test-secret');

  beforeEach(() => {
    app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use('/api', profileImageRouter);
    app.use('/api/profile', profileUploadRouter);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/doctor-profile-image (S3 Upload)', () => {
    it('should successfully upload doctor profile image with base64 data', async () => {
      // Mock storage methods
      const mockDoctor = { id: 1, userId: 'test-user-id', profileImage: null };
      (storage.getDoctorByUserId as jest.Mock).mockResolvedValue(mockDoctor);
      (storage.updateDoctor as jest.Mock).mockResolvedValue(true);
      (storage.updateUser as jest.Mock).mockResolvedValue(true);
      (storage.createSecureFile as jest.Mock).mockResolvedValue({ id: 'file-id' });

      // Mock S3 upload
      (SecureStorageService.uploadSecure as jest.Mock).mockResolvedValue({
        url: 'https://cnvidas-profile-images.s3.amazonaws.com/test-image.jpg',
        key: 'doctors/test-user-id/profile.jpg'
      });

      // Create base64 image data
      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

      const response = await request(app)
        .post('/api/doctor-profile-image')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send({
          profileImage: base64Image,
          mimeType: 'image/png'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        imageUrl: expect.stringContaining('https://'),
        message: 'Imagem de perfil do médico atualizada com sucesso'
      });

      // Verify storage calls
      expect(storage.getDoctorByUserId).toHaveBeenCalledWith('test-user-id');
      expect(storage.updateDoctor).toHaveBeenCalledWith(1, {
        profileImage: expect.stringContaining('https://')
      });
      expect(storage.updateUser).toHaveBeenCalledWith('test-user-id', {
        profileImage: expect.stringContaining('https://')
      });
    });

    it('should handle multipart/form-data upload', async () => {
      const mockDoctor = { id: 1, userId: 'test-user-id', profileImage: null };
      (storage.getDoctorByUserId as jest.Mock).mockResolvedValue(mockDoctor);
      (storage.updateDoctor as jest.Mock).mockResolvedValue(true);
      (storage.updateUser as jest.Mock).mockResolvedValue(true);
      (storage.createSecureFile as jest.Mock).mockResolvedValue({ id: 'file-id' });

      (SecureStorageService.uploadSecure as jest.Mock).mockResolvedValue({
        url: 'https://cnvidas-profile-images.s3.amazonaws.com/test-image.jpg',
        key: 'doctors/test-user-id/profile.jpg'
      });

      const response = await request(app)
        .post('/api/doctor-profile-image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profileImage', Buffer.from('fake-image-data'), 'profile.jpg');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/doctor-profile-image')
        .send({
          profileImage: 'base64data',
          mimeType: 'image/jpeg'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Not authenticated');
    });

    it('should fail when no file is provided', async () => {
      const response = await request(app)
        .post('/api/doctor-profile-image')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Nenhuma imagem foi enviada');
    });

    it('should fail when doctor profile not found', async () => {
      (storage.getDoctorByUserId as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/doctor-profile-image')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileImage: 'base64data',
          mimeType: 'image/jpeg'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Perfil de médico não encontrado');
    });

    it('should handle S3 upload errors', async () => {
      const mockDoctor = { id: 1, userId: 'test-user-id', profileImage: null };
      (storage.getDoctorByUserId as jest.Mock).mockResolvedValue(mockDoctor);
      (SecureStorageService.uploadSecure as jest.Mock).mockRejectedValue(new Error('S3 upload failed'));

      const response = await request(app)
        .post('/api/doctor-profile-image')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileImage: 'base64data',
          mimeType: 'image/jpeg'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Erro ao fazer upload da imagem');
      expect(response.body.details).toBe('S3 upload failed');
    });
  });


  describe('DELETE /api/doctor-profile-image', () => {
    it('should successfully remove doctor profile image', async () => {
      const mockDoctor = { 
        id: 1, 
        userId: 'test-user-id', 
        profileImage: 'https://cnvidas-profile-images.s3.amazonaws.com/old-image.jpg' 
      };
      const mockSecureFile = {
        id: 'file-id',
        fileKey: 'doctors/test-user-id/old-image.jpg'
      };

      (storage.getDoctorByUserId as jest.Mock).mockResolvedValue(mockDoctor);
      (storage.getSecureFileByUrl as jest.Mock).mockResolvedValue(mockSecureFile);
      (SecureStorageService.deleteSecure as jest.Mock).mockResolvedValue(true);
      (storage.softDeleteSecureFile as jest.Mock).mockResolvedValue(true);
      (storage.updateDoctor as jest.Mock).mockResolvedValue(true);
      (storage.updateUser as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/doctor-profile-image')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Imagem de perfil do médico removida com sucesso'
      });

      // Verify deletion calls
      expect(SecureStorageService.deleteSecure).toHaveBeenCalledWith(
        'doctors/test-user-id/old-image.jpg',
        'test-user-id',
        'profile',
        expect.any(Object)
      );
      expect(storage.updateDoctor).toHaveBeenCalledWith(1, { profileImage: null });
      expect(storage.updateUser).toHaveBeenCalledWith('test-user-id', { profileImage: null });
    });

    it('should handle removal when no image exists', async () => {
      const mockDoctor = { 
        id: 1, 
        userId: 'test-user-id', 
        profileImage: null 
      };

      (storage.getDoctorByUserId as jest.Mock).mockResolvedValue(mockDoctor);

      const response = await request(app)
        .delete('/api/doctor-profile-image')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(SecureStorageService.deleteSecure).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (storage.getDoctorByUserId as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      const response = await request(app)
        .post('/api/doctor-profile-image')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profileImage: 'base64data',
          mimeType: 'image/jpeg'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Erro ao fazer upload da imagem');
    });

    it('should validate image type', async () => {
      const response = await request(app)
        .post('/api/doctor-profile-image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('profileImage', Buffer.from('fake-data'), {
          filename: 'test.txt',
          contentType: 'text/plain'
        });

      // The multer middleware should reject non-image files
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle concurrent updates gracefully', async () => {
      const mockDoctor = { id: 1, userId: 'test-user-id', profileImage: null };
      (storage.getDoctorByUserId as jest.Mock).mockResolvedValue(mockDoctor);
      (storage.updateDoctor as jest.Mock).mockResolvedValue(true);
      (storage.updateUser as jest.Mock).mockResolvedValue(true);
      (storage.createSecureFile as jest.Mock).mockResolvedValue({ id: 'file-id' });
      (SecureStorageService.uploadSecure as jest.Mock).mockResolvedValue({
        url: 'https://cnvidas-profile-images.s3.amazonaws.com/test-image.jpg',
        key: 'doctors/test-user-id/profile.jpg'
      });

      // Simulate concurrent requests
      const requests = Array(3).fill(null).map(() => 
        request(app)
          .post('/api/doctor-profile-image')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            profileImage: 'base64data',
            mimeType: 'image/jpeg'
          })
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});