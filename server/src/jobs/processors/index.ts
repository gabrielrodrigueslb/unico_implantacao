import type { DeploymentJobType } from "../../modules/deployments/deployment.types";
import { assignUsersToQueuesProcessor } from "./assign-users-to-queues";
import { configureIvrProcessor } from "./configure-ivr";
import { configureQueuesProcessor } from "./configure-queues";
import { createChatTagsProcessor } from "./create-chat-tags";
import { createContactTagsProcessor } from "./create-contact-tags";
import { createQuickRepliesProcessor } from "./create-quick-replies";
import { createUsersProcessor } from "./create-users";
import type { Processor } from "./types";

export const processors: Record<DeploymentJobType, Processor> = {
  CONFIGURE_QUEUES: configureQueuesProcessor,
  CREATE_USERS: createUsersProcessor,
  ASSIGN_USERS_TO_QUEUES: assignUsersToQueuesProcessor,
  CONFIGURE_IVR: configureIvrProcessor,
  CREATE_CONTACT_TAGS: createContactTagsProcessor,
  CREATE_CHAT_TAGS: createChatTagsProcessor,
  CREATE_QUICK_REPLIES: createQuickRepliesProcessor,
};
