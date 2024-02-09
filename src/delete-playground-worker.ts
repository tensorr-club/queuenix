import { commandOptions, createClient } from 'redis';
import { handleDeletion } from './k8s/delete-playground';

const subscriber = createClient();
subscriber.connect();

async function deletePlaygroundWorker() {
  while (true) {
    try {
      const response = await subscriber.brPop(
        commandOptions({ isolated: true }),
        'delete-playground',
        0
      );
      await handleDeletion(response?.element!);
    } catch (error) {
      console.error(`Error during playground deletion: ${error}`);
    }
  }
}

deletePlaygroundWorker();
