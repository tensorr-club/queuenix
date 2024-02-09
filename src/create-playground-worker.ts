import { commandOptions, createClient } from 'redis';
import { handleCreation } from './k8s/create-playground';

const subscriber = createClient();
subscriber.connect();

async function createPlaygroundWorker() {
  while (true) {
    try {
      const response = await subscriber.brPop(
        commandOptions({ isolated: true }),
        'create-playground',
        0
      );
      console.log(response?.element);
      await handleCreation(response?.element!);
    } catch (error) {
      console.error(`Error during playground creation: ${error}`);
    }
  }
}

createPlaygroundWorker();
