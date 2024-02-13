const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { ContainerInstanceManagementClient } = require('@azure/arm-containerinstance');
const { DefaultAzureCredential } = require('@azure/identity');
const { Server } = require('socket.io');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 9000;

const subscriber = new Redis(process.env.REDIS_URL); // Redis URL

const io = new Server({ cors: '*' });

io.on('connection', (socket) => {
    socket.on('subscribe', (channel) => {
        socket.join(channel);
        socket.emit('message', `Joined ${channel}`);
    });
});

io.listen(9002, () => console.log('Socket Server 9002'));

const credentials = new DefaultAzureCredential();
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID; // Azure Subscription ID

const containerInstanceClient = new ContainerInstanceManagementClient(credentials, subscriptionId);

const config = {
    RESOURCE_GROUP: 'Resource Group',
    ACR_NAME: 'Azure Container Registry Name',
    CONTAINER_GROUP_NAME: 'Azure Container Group Name',
};

app.use(express.json());

app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body;
    const projectSlug = slug ? slug : generateSlug();

    // Spin the container
    const containerGroup = {
        containers: [
            {
                name: 'Container Name',
                image: `Container Image Name`,
                environmentVariables: [
                    { name: 'GIT_REPOSITORY__URL', value: gitURL },
                    { name: 'PROJECT_ID', value: projectSlug },
                ],
                resources: {
                    requests: {
                        memoryInGB: 1.0, // specify the memory in GB
                        cpu: 1.0, // specify the CPU in cores
                    },
                },
            },
        ],
        ipAddress: {
            type: "Public",
            autoGeneratedDomainNameLabelScope: "Unsecure",
            dnsNameLabel: "dnsnamelabel1",
            ports: [{ port: 80, protocol: "TCP" }],
        },
        osType: 'Linux',
        restartPolicy: 'OnFailure',
        imageRegistryCredentials: [
            {
                server: 'azure container registry (acr)',
                username: 'acr username',
                password: 'acr password',
            }
        ],
    };
    
    const poller = await containerInstanceClient.containerGroups.beginCreateOrUpdate(
        config.RESOURCE_GROUP,
        config.CONTAINER_GROUP_NAME,
        {
            location: 'location',
            containers: containerGroup.containers,
            osType: containerGroup.osType,
            restartPolicy: containerGroup.restartPolicy,
            imageRegistryCredentials: containerGroup.imageRegistryCredentials,
        }
    );
    
    const response = await poller.pollUntilDone();
    
    console.log(response);
    // Use response to get container group details if needed

    return res.json({
        status: 'queued',
        data: { projectSlug, url: `http://${projectSlug}.localhost:8000` }, // Reverse Proxy URL
    });
});


async function initRedisSubscribe() {
    console.log('Subscribed to logs....');
    subscriber.psubscribe('logs:*');
    subscriber.on('pmessage', (pattern, channel, message) => {
        io.to(channel).emit('message', message);
    });
}

initRedisSubscribe();

app.listen(PORT, () => console.log(`API Server Running..${PORT}`));