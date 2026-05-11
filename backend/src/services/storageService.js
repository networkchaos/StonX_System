const supabase = require('../config/supabase');

const BUCKET = process.env.SUPABASE_BUCKET || 'county-hardware-excels';

async function uploadFile(fileName, buffer) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return data;
}

async function downloadFile(fileName) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(fileName);

  if (error) throw new Error(`Download failed: ${error.message}`);

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function deleteFile(fileName) {
  const { error } = await supabase.storage.from(BUCKET).remove([fileName]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

async function fileExists(fileName) {
  const { data } = await supabase.storage.from(BUCKET).list('', {
    search: fileName,
  });
  return data && data.some(f => f.name === fileName);
}

module.exports = { uploadFile, downloadFile, deleteFile, fileExists };
