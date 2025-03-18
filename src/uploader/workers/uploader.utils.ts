import mime from 'mime';

export async function getFileMeta(
  url: string,
  taskId: string,
  index: number,
): Promise<{
  mime: string;
  name: string;
  resumable: boolean;
  size: number | null;
}> {
  const partialResp = await partialRequest(url);
  if (!partialResp.headers.has('content-type'))
    throw new Error('Resource content-type is not specified');

  const ext = mime.getExtension(
    partialResp.headers.get('content-type') as string,
  );
  const resumable = isResumable(partialResp);

  return {
    mime: mime.getType(ext!)!,
    name: `${taskId}-${index}.${ext!}`,
    resumable: resumable,
    size: resumable ? getFileSize(partialResp.headers) : null,
  };
}

async function partialRequest(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: { Range: 'bytes=0-1' },
  });

  return response;
}

function isResumable(response: Response) {
  const acceptRanges = response.headers.get('accept-ranges');
  return response.status === 206 && acceptRanges === 'bytes';
}

function getFileSize(headers: Headers): number | null {
  const lengthHeader = headers.get('content-range');
  if (!lengthHeader) return null;

  const size = lengthHeader.split('/')[1];
  return parseInt(size, 10);
}
