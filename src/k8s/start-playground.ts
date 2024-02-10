import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import { publisher } from '../redis/redis';

const kc = new KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(CoreV1Api);

publisher.connect();

export async function handleStart(msg: string) {
  const podInfo = JSON.parse(msg);
  const { podName, containerPort, containerImage } = podInfo;

  const pod = {
    metadata: {
      name: podName,
      labels: {
        app: podName,
      },
    },
    spec: {
      containers: [
        {
          name: podName,
          image: containerImage,
          ports: [
            {
              containerPort: containerPort,
            },
            {
              containerPort: 5001,
            },
          ],
          volumeMounts: [
            {
              name: 'playground-data-pv',
              mountPath: '/data',
            },
          ],
        },
      ],
      volumes: [
        {
          name: 'playground-data-pv',
          persistentVolumeClaim: {
            claimName: `${podName}-playground-data-pvc`,
          },
        },
      ],
    },
  };

  try {
    await k8sApi.createNamespacedPod('default', pod);
    publisher.hSet('status', podName, 'ready');
  } catch (err: any) {
    console.log('Error:', err);
  }
}
