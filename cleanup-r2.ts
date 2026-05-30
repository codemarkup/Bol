import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const extract = (key: string) => {
  const match = env.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : '';
};

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${extract('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: extract('R2_ACCESS_KEY_ID'),
    secretAccessKey: extract('R2_SECRET_ACCESS_KEY'),
  },
});

const BUCKET = extract('R2_BUCKET_NAME') || 'bol-media';

async function deletePrefix(prefix: string) {
  try {
    let continuationToken: string | undefined = undefined;
    do {
      const listCmd: any = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken
      });
      const res: any = await r2Client.send(listCmd);

      if (res.Contents && res.Contents.length > 0) {
        const deleteCmd: any = new DeleteObjectsCommand({
          Bucket: BUCKET,
          Delete: {
            Objects: res.Contents.map((c: any) => ({ Key: c.Key }))
          }
        });
        await r2Client.send(deleteCmd);
        console.log(`Deleted ${res.Contents.length} objects from ${prefix}`);
      }

      continuationToken = res.NextContinuationToken;
    } while (continuationToken);
    
    console.log(`Finished deleting ${prefix}`);
  } catch (err) {
    console.error(`Error deleting ${prefix}:`, err);
  }
}

async function run() {
  await deletePrefix('image/');
  await deletePrefix('video/');
  await deletePrefix('voice/');
  console.log("Cleanup complete!");
}

run();
