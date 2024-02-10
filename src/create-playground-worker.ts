import { commandOptions } from 'redis';
import { handleCreation } from './k8s/create-playground';
import { publisher, subscriber } from './redis/redis';

subscriber.connect();
publisher.connect();

async function createPlaygroundWorker() {
  while (true) {
    try {
      const response = await subscriber.brPop(
        commandOptions({ isolated: true }),
        'create-playground',
        0
      );

      await handleCreation(response?.element!);

      const playground = JSON.parse(response?.element!);
      publisher.hSet('status', playground.name, 'ready');
    } catch (error) {
      console.error(`Error during playground creation: ${error}`);
    }
  }
}

createPlaygroundWorker();
