import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const extract = (key: string) => {
  const match = env.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : '';
};

const r2 = new S3Client({
  region: "auto",
  endpoint: extract('CLOUDFLARE_R2_ENDPOINT'),
  credentials: {
    accessKeyId: extract('CLOUDFLARE_R2_ACCESS_KEY_ID'),
    secretAccessKey: extract('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
  },
});

async function check() {
  const command = new ListObjectsV2Command({
    Bucket: extract('CLOUDFLARE_R2_BUCKET_NAME'),
    MaxKeys: 100
  });

  try {
    const response = await r2.send(command);
    console.log(response.Contents?.map(c => c.Key));
  } catch (err) {
    console.error(err);
  }
}

check()
