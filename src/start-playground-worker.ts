import { commandOptions, createClient } from 'redis';
import { handleStart } from './k8s/start-playground';

const subscriber = createClient();
subscriber.connect();

async function startPlaygroundWorker() {
  while (true) {
    try {
      const response = await subscriber.brPop(
        commandOptions({ isolated: true }),
        'start-playground',
        0
      );
      await handleStart(response?.element!);
    } catch (error) {
      console.error(`Error during playground start: ${error}`);
    }
  }
}

startPlaygroundWorker();
