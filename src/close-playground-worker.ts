import { commandOptions } from 'redis';
import { handleClose } from './k8s/close-playground';
import { publisher, subscriber } from './redis/redis';

subscriber.connect();
publisher.connect();

async function closePlaygroundWorker() {
  while (true) {
    try {
      const response = await subscriber.brPop(
        commandOptions({ isolated: true }),
        'close-playground',
        0
      );

      await handleClose(response?.element!);
    } catch (error) {
      console.error(`Error during playground close: ${error}`);
    }
  }
}

closePlaygroundWorker();
