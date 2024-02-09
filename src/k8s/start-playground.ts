import {
  KubeConfig,
  CoreV1Api,
  NetworkingV1Api,
} from '@kubernetes/client-node';

const kc = new KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(CoreV1Api);
const k8sNetworkingApi = kc.makeApiClient(NetworkingV1Api);

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

  const service = {
    metadata: {
      name: `${podName}-service`,
    },
    spec: {
      selector: {
        app: podName,
      },
      ports: [
        {
          name: `${podName}-app`,
          port: containerPort,
        },
        {
          name: `${podName}-api`,
          port: 5001,
          targetPort: 5001,
        },
      ],
    },
  };

  const ingress = {
    metadata: {
      name: `${podName}-ingress`,
    },
    spec: {
      rules: [
        {
          host: `app.${podName}.localhost`,
          http: {
            paths: [
              {
                pathType: 'Prefix',
                path: `/`,
                backend: {
                  service: {
                    name: `${podName}-service`,
                    port: {
                      number: containerPort,
                    },
                  },
                },
              },
            ],
          },
        },
        {
          host: `api.${podName}.localhost`,
          http: {
            paths: [
              {
                pathType: 'Prefix',
                path: `/`,
                backend: {
                  service: {
                    name: `${podName}-service`,
                    port: {
                      number: 5001,
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };

  try {
    await k8sApi.createNamespacedPod('default', pod);
    await k8sApi.createNamespacedService('default', service);
    await k8sNetworkingApi.createNamespacedIngress('default', ingress);
  } catch (err: any) {
    console.log('Error:', err);
  }
}
