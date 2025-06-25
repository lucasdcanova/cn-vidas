import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { getUploadBasePath } from '../config/upload-config';

const router = express.Router();

// Rota de diagnóstico para verificar uploads (apenas admin)
router.get('/diagnostics', async (req, res) => {
  try {
    const uploadBase = getUploadBasePath();
    const profilesDir = path.join(uploadBase, 'profiles');
    const documentsDir = path.join(uploadBase, 'documents');
    
    const diagnostics = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isRender: process.env.RENDER === 'true',
        cwd: process.cwd(),
        uploadBasePath: uploadBase
      },
      directories: {
        profiles: {
          path: profilesDir,
          exists: false,
          fileCount: 0,
          files: [] as string[]
        },
        documents: {
          path: documentsDir,
          exists: false,
          fileCount: 0,
          files: [] as string[]
        }
      },
      diskSpace: {
        mountPath: process.env.RENDER ? '/opt/render/project/src/public/uploads' : 'N/A',
        configured: !!process.env.RENDER
      }
    };
    
    // Verificar diretório de profiles
    try {
      await fs.access(profilesDir);
      diagnostics.directories.profiles.exists = true;
      const profileFiles = await fs.readdir(profilesDir);
      diagnostics.directories.profiles.fileCount = profileFiles.length;
      diagnostics.directories.profiles.files = profileFiles.slice(0, 10); // Primeiros 10
    } catch (error) {
      // Diretório não existe
    }
    
    // Verificar diretório de documents
    try {
      await fs.access(documentsDir);
      diagnostics.directories.documents.exists = true;
      const docFiles = await fs.readdir(documentsDir);
      diagnostics.directories.documents.fileCount = docFiles.length;
      diagnostics.directories.documents.files = docFiles.slice(0, 10);
    } catch (error) {
      // Diretório não existe
    }
    
    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao executar diagnóstico',
      details: error.message 
    });
  }
});

// Verificar se um arquivo específico existe
router.get('/check/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadBase = getUploadBasePath();
    const filePath = path.join(uploadBase, 'profiles', filename);
    
    try {
      const stats = await fs.stat(filePath);
      res.json({
        exists: true,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    } catch (error) {
      res.json({
        exists: false,
        path: filePath,
        error: 'Arquivo não encontrado'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;