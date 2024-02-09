import {
  KubeConfig,
  CoreV1Api,
  NetworkingV1Api,
} from '@kubernetes/client-node';

const kc = new KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(CoreV1Api);
const k8sNetworkingApi = kc.makeApiClient(NetworkingV1Api);

export async function handleClose(msg: string) {
  const podInfo = JSON.parse(msg);
  const { podName } = podInfo;

  try {
    await k8sApi.deleteNamespacedPod(podName, 'default');
    await k8sApi.deleteNamespacedService(`${podName}-service`, 'default');
    await k8sNetworkingApi.deleteNamespacedIngress(
      `${podName}-ingress`,
      'default'
    );
  } catch (err: any) {
    console.log('Error:', err);
  }
}
