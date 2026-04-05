/// <reference lib="webworker" />

addEventListener('message', async ({ data }) => {
  if(data.event === 'load' && !data.fileName) {
    postMessage({ file: null, event: data.event });
    return;
  }
  const file = await processEvent(data);

  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (e) => {
    // File content is in e.target.result (e.g., ArrayBuffer, text, etc.)
    const fileContent = e.target?.result;
    postMessage({ url: fileContent, file, event: data.event });
  };

  reader.onerror = (e) => {
    console.error('FileReader error:', e);
  };
});

async function processEvent(data: {
  event: string;
  url: string;
  type: string;
  fileName: string;
  file: any;
}) {
  if (data.event === 'load') {
    const arrayBuffer = await createBlobFromImageUrl(data.url, data.type, data.fileName);
    return arrayBuffer
      ? new File([new Blob([arrayBuffer], { type: data.type })], data.fileName, { type: data.type })
      : null;
  }
  return data.file;
}

async function createBlobFromImageUrl(
  imageUrl: string,
  type: string,
  filename: string,
): Promise<Blob | null> {
  try {
    const response = await fetch(imageUrl);
    return await response.blob();
  } catch (error) {
    console.error('Error fetching image:', error);
    // This may happen due to network issues or CORS policy blocks
    alert('Could not fetch image. Check console for CORS issues.');
    return null;
  }
}
