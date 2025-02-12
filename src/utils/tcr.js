const tencentcloud = require("tencentcloud-sdk-nodejs-tcr");

const TcrClient = tencentcloud.tcr.v20190924.Client;

const clientConfig = {
    credential: {
        secretId: process.env.TENCENTCLOUD_SECRET_ID,
        secretKey: process.env.TENCENTCLOUD_SECRET_KEY,
    },
    region: process.env.Region,
    profile: {
        httpProfile: {
            endpoint: "tcr.tencentcloudapi.com",
        },
    },
};

export const tcrClient = new TcrClient(clientConfig); 