import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Menghapus latar belakang gambar dan menggantinya dengan warna putih (Studio Look)
 * @param {string} inputImagePath - Path absolut gambar mentah
 * @param {string} outputFilename - Nama file output yang diinginkan
 * @returns {Promise<string>} - Path relatif gambar yang sudah bersih
 */
export async function createCleanProductShot(inputImagePath, outputFilename) {
  console.log(`[AI Vision] Memulai pemotongan latar belakang untuk: ${path.basename(inputImagePath)}`);
  
  try {
    // 1. Eksekusi AI Background Removal (Berjalan 100% Offline via ONNX)
    const imageBuffer = fs.readFileSync(inputImagePath);
    const ext = path.extname(inputImagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    const blob = new Blob([imageBuffer], { type: mimeType });
    
    // Model 'medium' cukup cepat dan akurat untuk gambar produk
    const transparentBlob = await removeBackground(blob, { model: 'medium' });
    const transparentBuffer = Buffer.from(await transparentBlob.arrayBuffer());

    // 2. Tambahkan Latar Belakang Putih menggunakan Sharp
    const finalOutputDir = path.join(process.cwd(), 'public', 'uploads', 'products', 'clean');
    if (!fs.existsSync(finalOutputDir)) {
      fs.mkdirSync(finalOutputDir, { recursive: true });
    }

    const finalOutputPath = path.join(finalOutputDir, outputFilename);

    await sharp(transparentBuffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // Paksa latar belakang jadi putih solid
      .jpeg({ quality: 90 }) // Simpan sebagai JPEG agar ukuran file ringan
      .toFile(finalOutputPath);

    console.log(`[AI Vision] Sukses! Foto produk studio tersimpan di: clean/${outputFilename}`);
    
    return `/uploads/products/clean/${outputFilename}`;

  } catch (error) {
    console.error(`[AI Vision] Gagal memproses gambar:`, error.message);
    throw error;
  }
}
