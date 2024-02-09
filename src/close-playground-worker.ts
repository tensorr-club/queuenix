import { commandOptions, createClient } from 'redis';
import { handleClose } from './k8s/close-playground';

const subscriber = createClient();
subscriber.connect();

async function closePlaygroundWorker() {
  while (true) {
    try {
      const response = await subscriber.brPop(
        commandOptions({ isolated: true }),
        'close-playground',
        0
      );
      console.log(response?.element);
      console.log('Closing playground:');
      await handleClose(response?.element!);
    } catch (error) {
      console.error(`Error during playground close: ${error}`);
    }
  }
}

closePlaygroundWorker();
