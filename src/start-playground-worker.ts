import { commandOptions } from 'redis';
import { handleStart } from './k8s/start-playground';
import { publisher, subscriber } from './redis/redis';

subscriber.connect();
publisher.connect();

async function startPlaygroundWorker() {
  while (true) {
    try {
      const response = await subscriber.brPop(
        commandOptions({ isolated: true }),
        'start-playground',
        0
      );

      await handleStart(response?.element!);

      const playground = JSON.parse(response?.element!);
    } catch (error) {
      console.error(`Error during playground start: ${error}`);
    }
  }
}

startPlaygroundWorker();
