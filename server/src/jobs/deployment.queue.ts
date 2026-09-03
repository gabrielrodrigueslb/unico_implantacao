import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";
import type { DeploymentJobData } from "../modules/deployments/deployment.types";

export const deploymentQueue = new Queue<DeploymentJobData>("deployment", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});
