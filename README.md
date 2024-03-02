Vercel Clone using Azure enabling users to upload project code and receive a live deployment URL.

This Project contains following services and folders:

- `api-server`: Express API Server, Redis and Socket for log tracking.
- `build-server`: Docker Image code which clones, builds and pushes the build to S3 (Azure Blob)
- `s3-reverse-proxy`: Reverse Proxy the subdomains and domains to s3 bucket static assets

### Local Setup

1. Run `npm install` in all the 3 services i.e. `api-server`, `build-server` and `s3-reverse-proxy`
2. Docker build the `build-server` and push the image to ACR (Azure Container Registry).
3. Setup the `api-server` by providing all the required config.
4. Run `node index.js` in `api-server` and `s3-reverse-proxy`

At this point following services would be up and running:

| S.No | Service            | PORT    |
| ---- | ------------------ | ------- |
| 1    | `api-server`       | `:9000` |
| 2    | `socket.io-server` | `:9002` |
| 3    | `s3-reverse-proxy` | `:8000` |

### Architecture
![architecture](https://github.com/Ayt1da/Vercel-clone/assets/61749332/017eaa33-4589-4155-89cd-04275f7f3d5f)

