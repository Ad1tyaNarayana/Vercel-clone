const { exec } = require('child_process');
const path = require('path')
const fs = require('fs')
const { BlobServiceClient } = require('@azure/storage-blob');
const mime = require('mime-types')
const Redis = require('ioredis')

const publisher = new Redis(process.env.REDIS_URL); // Connect to Redis

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_STRING); // Azure Blob Storage Connection String

const PROJECT_ID = process.env.PROJECT_ID; // Vercel Project ID

function publishLog(log) {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }))
}

async function init() {
    console.log('Executing script.js');
    const outDirPath = path.join(__dirname, 'output');

    const p = exec(`cd ${outDirPath} && npm i && rm -rf node_modules && rm -f package-lock.json && npm i && npm run build`) 
    // just running cd ${outDirPath} && npm i && npm run build might work for you

    p.stdout.on('data', function (data) {
        console.log(data.toString())
        publishLog(data.toString())
    });

    p.stdout.on('error', function (data) {
        console.log('Error', data.toString())
        publishLog(`error: ${data.toString()}`)
        process.exit(1); // Exit the process if there is an error
    });

    p.on('close', async function () {
        console.log('Build Complete')
        publishLog(`Build Complete`)

        const distFolderPath = path.join(__dirname, 'output', 'dist')
        console.log('distFolderPath', distFolderPath)

        const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true })
        publishLog(`Starting to upload`)

        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file)
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log('uploading', filePath)
            publishLog(`uploading ${file}`)

            const containerClient = blobServiceClient.getContainerClient("vercel-outputs");
            const blockBlobClient = containerClient.getBlockBlobClient(`__outputs/${PROJECT_ID}/${file}`);
            const data = fs.readFileSync(filePath);
            const contentType = mime.lookup(filePath);

            const response = await blockBlobClient.upload(data, data.length, {
                blobHTTPHeaders: {
                    blobContentType: contentType
                }
            });

            publishLog(`uploaded ${file}`)
            console.log('uploaded', filePath)
        }
        publishLog(`Done`)
        console.log('Done...')
        process.exit(0); // Exit the process after the build is complete
    });
}

init()