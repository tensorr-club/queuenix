import {
  KubeConfig,
  CoreV1Api,
  NetworkingV1Api,
} from '@kubernetes/client-node';

interface ProjectInfo {
  name: string;
  image: string;
  containerPort: number;
}

const kc = new KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(CoreV1Api);
const k8sNetworkingApi = kc.makeApiClient(NetworkingV1Api);

let projectInfo: ProjectInfo;

export async function handleCreation(msg: string) {
  projectInfo = JSON.parse(msg);

  console.log('Creating playground:', projectInfo);

  const pod = {
    metadata: {
      name: projectInfo.name,
      labels: {
        app: projectInfo.name,
      },
    },
    spec: {
      containers: [
        {
          name: projectInfo.name,
          image: projectInfo.image,
          ports: [
            {
              containerPort: projectInfo.containerPort,
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
            claimName: `${projectInfo.name}-playground-data-pvc`,
          },
        },
      ],
    },
  };

  const service = {
    metadata: {
      name: `${projectInfo.name}-service`,
    },
    spec: {
      selector: {
        app: projectInfo.name,
      },
      ports: [
        {
          name: `${projectInfo.name}-app`,
          port: projectInfo.containerPort,
        },
        {
          name: `${projectInfo.name}-api`,
          port: 5001,
          targetPort: 5001,
        },
      ],
    },
  };

  const ingress = {
    metadata: {
      name: `${projectInfo.name}-ingress`,
    },
    spec: {
      rules: [
        {
          host: `app.${projectInfo.name}.localhost`,
          http: {
            paths: [
              {
                pathType: 'Prefix',
                path: `/`,
                backend: {
                  service: {
                    name: `${projectInfo.name}-service`,
                    port: {
                      number: projectInfo.containerPort,
                    },
                  },
                },
              },
            ],
          },
        },
        {
          host: `api.${projectInfo.name}.localhost`,
          http: {
            paths: [
              {
                pathType: 'Prefix',
                path: `/`,
                backend: {
                  service: {
                    name: `${projectInfo.name}-service`,
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

  const pvc = {
    metadata: {
      name: `${projectInfo.name}-playground-data-pvc`,
    },
    spec: {
      storageClassName: 'playgrounds-storage-class',
      accessModes: ['ReadWriteMany'],
      resources: {
        requests: {
          storage: '100Mi',
        },
      },
    },
  };

  try {
    await k8sApi.createNamespacedPod('default', pod);
    await k8sApi.createNamespacedService('default', service);
    await k8sNetworkingApi.createNamespacedIngress('default', ingress);
    await k8sApi.createNamespacedPersistentVolumeClaim('default', pvc);
  } catch (err: any) {
    console.log('Error:', err);
  }
}
