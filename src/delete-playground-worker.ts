import { commandOptions } from 'redis';
import { handleDeletion } from './k8s/delete-playground';
import { publisher, subscriber } from './redis/redis';

subscriber.connect();
publisher.connect();

async function deletePlaygroundWorker() {
  while (true) {
    try {
      const response = await subscriber.brPop(
        commandOptions({ isolated: true }),
        'delete-playground',
        0
      );

      await handleDeletion(response?.element!);

      const playground = JSON.parse(response?.element!);
      publisher.hSet('status', playground.podName, 'deleted');
    } catch (error) {
      console.error(`Error during playground deletion: ${error}`);
    }
  }
}

deletePlaygroundWorker();
