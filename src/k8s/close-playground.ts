import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import { publisher } from '../redis/redis';

const kc = new KubeConfig();
kc.loadFromDefault();

publisher.connect();

const k8sApi = kc.makeApiClient(CoreV1Api);

export async function handleClose(msg: string) {
  const podInfo = JSON.parse(msg);
  const { podName } = podInfo;
  try {
    await k8sApi.deleteNamespacedPod(podName, 'default');
    publisher.hSet('status', podName, 'closed');
  } catch (err: any) {
    console.log('Error:', err);
  }
}
