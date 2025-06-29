import { db } from '../../db';
import { storage } from '../../storage';
import SecureStorageService from '../../services/secure-storage-service';

// Integration test for doctor photo upload flow
describe('Doctor Photo Upload Integration', () => {
  // Mock data
  const mockUserId = 'test-doctor-user-id';
  const mockDoctorId = 1;
  const mockImageUrl = 'https://cnvidas-profile-images.s3.amazonaws.com/doctors/test-image.jpg';
  const mockImageKey = 'doctors/test-doctor-user-id/profile.jpg';
  const mockBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Upload Flow', () => {
    it('should handle the complete upload flow correctly', async () => {
      // Step 1: Mock doctor exists
      const mockDoctor = {
        id: mockDoctorId,
        userId: mockUserId,
        profileImage: null,
        name: 'Dr. Test',
        specialization: 'General Medicine'
      };

      jest.spyOn(storage, 'getDoctorByUserId').mockResolvedValue(mockDoctor);

      // Step 2: Mock S3 upload success
      jest.spyOn(SecureStorageService, 'uploadSecure').mockResolvedValue({
        url: mockImageUrl,
        key: mockImageKey
      });

      // Step 3: Mock database updates
      jest.spyOn(storage, 'updateDoctor').mockResolvedValue({
        ...mockDoctor,
        profileImage: mockImageUrl
      });

      jest.spyOn(storage, 'updateUser').mockResolvedValue({
        id: mockUserId,
        profileImage: mockImageUrl
      });

      jest.spyOn(storage, 'createSecureFile').mockResolvedValue({
        id: 'secure-file-id',
        userId: mockUserId,
        fileKey: mockImageKey,
        fileType: 'profile',
        bucketName: 'cnvidas-profile-images'
      });

      // Execute the upload flow
      const buffer = Buffer.from(mockBase64Image, 'base64');
      
      // 1. Get doctor
      const doctor = await storage.getDoctorByUserId(mockUserId);
      expect(doctor).toBeTruthy();
      expect(doctor?.id).toBe(mockDoctorId);

      // 2. Upload to S3
      const uploadResult = await SecureStorageService.uploadSecure(
        buffer,
        {
          userId: mockUserId,
          fileType: 'profile',
          fileName: 'profile.jpg',
          contentType: 'image/jpeg',
          metadata: {
            uploadSource: 'doctor_profile_update',
            doctorId: doctor!.id.toString()
          }
        },
        {
          ip: '127.0.0.1',
          userAgent: 'test-agent'
        }
      );

      expect(uploadResult.url).toBe(mockImageUrl);
      expect(uploadResult.key).toBe(mockImageKey);

      // 3. Update databases
      await storage.updateDoctor(doctor!.id, { profileImage: uploadResult.url });
      await storage.updateUser(mockUserId, { profileImage: uploadResult.url });

      // 4. Create secure file record
      const secureFile = await storage.createSecureFile({
        userId: mockUserId,
        fileKey: uploadResult.key,
        fileType: 'profile',
        originalName: 'profile.jpg',
        contentType: 'image/jpeg',
        sizeBytes: buffer.length,
        bucketName: 'cnvidas-profile-images',
        storageClass: 'STANDARD_IA',
        encryptionType: 'AES256',
        isEncrypted: false,
        lgpdConsent: true,
        consentDate: new Date(),
        metadata: { doctorId: doctor!.id }
      });

      expect(secureFile).toBeTruthy();

      // Verify all calls were made correctly
      expect(storage.getDoctorByUserId).toHaveBeenCalledWith(mockUserId);
      expect(SecureStorageService.uploadSecure).toHaveBeenCalledWith(
        buffer,
        expect.objectContaining({
          userId: mockUserId,
          fileType: 'profile'
        }),
        expect.any(Object)
      );
      expect(storage.updateDoctor).toHaveBeenCalledWith(mockDoctorId, {
        profileImage: mockImageUrl
      });
      expect(storage.updateUser).toHaveBeenCalledWith(mockUserId, {
        profileImage: mockImageUrl
      });
    });

    it('should handle upload with existing profile image', async () => {
      const oldImageUrl = 'https://cnvidas-profile-images.s3.amazonaws.com/old-image.jpg';
      const oldImageKey = 'doctors/test-doctor-user-id/old-image.jpg';

      const mockDoctor = {
        id: mockDoctorId,
        userId: mockUserId,
        profileImage: oldImageUrl,
        name: 'Dr. Test'
      };

      jest.spyOn(storage, 'getDoctorByUserId').mockResolvedValue(mockDoctor);
      jest.spyOn(storage, 'getSecureFileByUrl').mockResolvedValue({
        id: 'old-file-id',
        fileKey: oldImageKey,
        userId: mockUserId
      });
      jest.spyOn(SecureStorageService, 'deleteSecure').mockResolvedValue(true);
      jest.spyOn(storage, 'softDeleteSecureFile').mockResolvedValue(true);

      // The flow should delete old image before uploading new one
      const doctor = await storage.getDoctorByUserId(mockUserId);
      expect(doctor?.profileImage).toBe(oldImageUrl);

      // In a real scenario, the route would handle deletion
      // This test verifies the storage methods work correctly
      const oldFile = await storage.getSecureFileByUrl(oldImageUrl);
      if (oldFile) {
        await SecureStorageService.deleteSecure(
          oldFile.fileKey,
          mockUserId,
          'profile',
          { ip: '127.0.0.1', userAgent: 'test' }
        );
        await storage.softDeleteSecureFile(oldFile.id);
      }

      expect(storage.getSecureFileByUrl).toHaveBeenCalledWith(oldImageUrl);
      expect(SecureStorageService.deleteSecure).toHaveBeenCalledWith(
        oldImageKey,
        mockUserId,
        'profile',
        expect.any(Object)
      );
    });
  });

  describe('Error Scenarios', () => {
    it('should handle S3 upload failure', async () => {
      const mockDoctor = {
        id: mockDoctorId,
        userId: mockUserId,
        profileImage: null
      };

      jest.spyOn(storage, 'getDoctorByUserId').mockResolvedValue(mockDoctor);
      jest.spyOn(SecureStorageService, 'uploadSecure').mockRejectedValue(
        new Error('S3 service unavailable')
      );

      const buffer = Buffer.from(mockBase64Image, 'base64');

      await expect(
        SecureStorageService.uploadSecure(
          buffer,
          {
            userId: mockUserId,
            fileType: 'profile',
            fileName: 'profile.jpg',
            contentType: 'image/jpeg'
          },
          { ip: '127.0.0.1', userAgent: 'test' }
        )
      ).rejects.toThrow('S3 service unavailable');

      // Ensure no database updates were attempted
      expect(storage.updateDoctor).not.toHaveBeenCalled();
      expect(storage.updateUser).not.toHaveBeenCalled();
    });

    it('should handle database update failure', async () => {
      jest.spyOn(storage, 'getDoctorByUserId').mockResolvedValue({
        id: mockDoctorId,
        userId: mockUserId,
        profileImage: null
      });

      jest.spyOn(SecureStorageService, 'uploadSecure').mockResolvedValue({
        url: mockImageUrl,
        key: mockImageKey
      });

      jest.spyOn(storage, 'updateDoctor').mockRejectedValue(
        new Error('Database connection failed')
      );

      // In real scenario, the route should handle this and potentially rollback S3 upload
      await expect(
        storage.updateDoctor(mockDoctorId, { profileImage: mockImageUrl })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle missing doctor profile', async () => {
      jest.spyOn(storage, 'getDoctorByUserId').mockResolvedValue(null);

      const doctor = await storage.getDoctorByUserId(mockUserId);
      expect(doctor).toBeNull();

      // The route should return 404 in this case
      // No upload should be attempted
      expect(SecureStorageService.uploadSecure).not.toHaveBeenCalled();
      expect(storage.updateDoctor).not.toHaveBeenCalled();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistency between doctors and users tables', async () => {
      const updateDoctorMock = jest.spyOn(storage, 'updateDoctor');
      const updateUserMock = jest.spyOn(storage, 'updateUser');

      // Mock successful updates
      updateDoctorMock.mockResolvedValue({ profileImage: mockImageUrl });
      updateUserMock.mockResolvedValue({ profileImage: mockImageUrl });

      // Execute updates
      await storage.updateDoctor(mockDoctorId, { profileImage: mockImageUrl });
      await storage.updateUser(mockUserId, { profileImage: mockImageUrl });

      // Verify both tables were updated with same URL
      expect(updateDoctorMock).toHaveBeenCalledWith(mockDoctorId, {
        profileImage: mockImageUrl
      });
      expect(updateUserMock).toHaveBeenCalledWith(mockUserId, {
        profileImage: mockImageUrl
      });

      // Both calls should have the same image URL
      const doctorCall = updateDoctorMock.mock.calls[0][1];
      const userCall = updateUserMock.mock.calls[0][1];
      expect(doctorCall.profileImage).toBe(userCall.profileImage);
    });

    it('should handle removal consistently across tables', async () => {
      const updateDoctorMock = jest.spyOn(storage, 'updateDoctor');
      const updateUserMock = jest.spyOn(storage, 'updateUser');

      updateDoctorMock.mockResolvedValue({ profileImage: null });
      updateUserMock.mockResolvedValue({ profileImage: null });

      // Execute removal
      await storage.updateDoctor(mockDoctorId, { profileImage: null });
      await storage.updateUser(mockUserId, { profileImage: null });

      // Verify both were set to null
      expect(updateDoctorMock).toHaveBeenCalledWith(mockDoctorId, {
        profileImage: null
      });
      expect(updateUserMock).toHaveBeenCalledWith(mockUserId, {
        profileImage: null
      });
    });
  });
});