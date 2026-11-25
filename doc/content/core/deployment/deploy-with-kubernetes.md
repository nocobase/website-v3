---
title: Deploy with Kubernetes
description: Deploy an application on Kubernetes with an Agent or manually, run database updates, verify and release changes, and package deployment manifests as a Helm chart.
minimumEdition: enterprise
---

## Prerequisites

Prepare a Kubernetes cluster and install and configure `kubectl` on the machine you will use to manage deployments. Confirm that you are connected to the intended cluster, then check the node architectures and available ingress and storage configurations:

```bash
kubectl config current-context
kubectl get nodes -L kubernetes.io/arch
kubectl get ingressclass
kubectl get storageclass
```

Once you have confirmed the cluster, prepare the application and its dependencies:

- **Application configuration**: Adapt the application for [multi-instance deployment](multi-instance-deployment.md) and configure the database, Redis, and file storage it needs.
- **Application image**: After adapting the application, follow [Deploy with Docker](../tutorials/deploy-with-docker.md#build-the-docker-image) to build an image for the node architecture and push it to your registry.
- **External access**: Make sure the cluster has an Ingress Controller, and prepare the application's domain and TLS certificate.
- **Shared storage**: If you store files on a filesystem, prepare a StorageClass that supports `ReadWriteMany` (RWX).

> [!TIP]
> A StorageClass defines how Kubernetes provisions storage volumes, including which storage service to use. `ReadWriteMany` (RWX) allows multiple nodes to mount and read and write the same volume, so application replicas on different nodes can share uploaded files. Common backends include NFS, CephFS, and cloud file storage. Support depends on the storage service and driver; ask your cluster administrator which StorageClass names are available.

The examples use `my-app` as the namespace and application name, `registry.example.com/team/my-app:1` as the image, and `https://apps.example.com/main/` as the application URL. Replace the image and domain with your actual values. If you change resource names, keep all manifest references consistent. `<…>` marks a required placeholder; replace the entire placeholder, including the angle brackets.

## Use an Agent

### Generate deployment configuration

Open a development Agent in an environment where it can read the application project, run commands, and use `kubectl`. Back up the configuration of any existing deployment first. Provide passwords, keys, and registry tokens through local files or existing Secrets, not in the prompt.

Describe the deployment you want, and ask the Agent to inspect the current configuration and confirm the required resources with you:

```text
Read this Kubernetes deployment guide and prepare a two-replica deployment plan for the current project:
https://docs.nocobase.com/core/deployment/deploy-with-kubernetes/

Inspect the project configuration first, then confirm the target environment, image, dependent services, storage, and access setup with me. Prepare the manifests using the guide. If the project differs from its assumptions, explain the differences rather than applying it unchanged.

Save the Kubernetes manifests in the deployment directory. Write a README.md at its root with the guide URL, environment parameters, and reusable steps for deployment, updates, backups, rollback, and verification. Preserve existing data and keys, and do not record sensitive values.

Generate the files for my review first. Do not operate on the cluster or change business data without my approval.
```

### Deploy and verify

After approving the plan, give the Agent this prompt to deploy and verify the application:

```text
The deployment plan is approved. Read the README.md and manifests in the deployment directory, then follow the guide linked there to:

1. Check the target cluster, namespace, image, and configuration, and complete the planned backups. Ask me before proceeding if prerequisites are missing or the work would exceed the approved scope.
2. Run the database-update Job using the application image for this release. Start or roll out the application only after it succeeds. On failure or timeout, stop further changes and report the issue; do not rerun migrations without approval.
3. Verify HTTPS access, sign-in, data and file operations, and cross-replica business functionality. In a test environment, verify that data and files persist after Pod recreation. Mark any checks you cannot perform as unverified; passing a health check does not prove business functionality works.
4. Produce a deployment and verification report with the target environment, actual image, results and evidence for each check, and outstanding issues. Distinguish passed, failed, and unverified checks.
5. Keep the manifests and README.md in sync with any adjustments, retaining the guide URL and reusable procedures. Read and reuse these files for future updates.
```

### Generate a Helm chart

Generating a Helm chart is optional. If you want to turn existing deployment manifests into reusable templates, ask the Agent to convert them:

```text
Read the README.md and its linked guide in the deployment directory, and convert the existing Kubernetes manifests into a Helm chart while retaining the current configuration and external services.

First explain which resources Helm will manage, which dependencies remain independently managed, and how the existing deployment will be handed over. Preserve data and keys, and ensure database updates succeed before the application is released.

Prepare the chart, environment values, and local validation. Add installation, upgrade, rollback, and verification steps to README.md, and report validation results and anything still unverified.
Submit the chart and handover plan for my approval first. Do not take ownership of resources or operate on the cluster without authorization.
```

## Deployment directory and files

Keep the deployment files in a `my-app-k8s` directory on your deployment management machine:

```tree
my-app-k8s/
├── .gitignore       # Excludes local sensitive files
├── configmap.yml    # Embeds non-sensitive config.yaml
├── secrets.env      # Sensitive environment variables; do not commit
├── files-pvc.yml    # Shared volume for business files
├── db-job.yml       # Database-update Job
├── app.yml          # Application Deployment and Service
└── ingress.yml      # Domain, HTTPS, and ingress routing
```

`config.yaml` is embedded in `configmap.yml`; you do not need a separate file. Create and enter the deployment directory, and run the subsequent commands there:

```bash
mkdir -p "$HOME/my-app-k8s"
cd "$HOME/my-app-k8s"
```

Add `secrets.env` to `.gitignore`:

```text title=".gitignore"
secrets.env
```

## Create a namespace and image pull credentials

Create the `my-app` namespace for the application. All resources in the following manifests use this namespace:

```bash
kubectl create namespace my-app
```

Create a Secret named `registry-pull` in the same namespace so Kubernetes can pull the private image. Replace the placeholders with your registry address, username, and access token. The account must have permission to pull the image:

```bash
kubectl -n my-app create secret docker-registry registry-pull \
  --docker-server='<registry address>' \
  --docker-username='<registry username>' \
  --docker-password='<registry access token>'
```

The Job and Deployment reference `registry-pull` through `imagePullSecrets`.

## Mount runtime configuration and file storage

### Mount non-sensitive configuration with a ConfigMap

Create `configmap.yml` and put the application's non-sensitive configuration in `data.config.yaml`. Supply database passwords, application keys, and other sensitive values through the Secret in the next section.

Check the following settings in the application's existing configuration:

- Set `migrations.autoRun` and `seeds.autoRun` to `false` for each managed database connection. The Job below runs database updates separately. See the configuration in the [multi-instance release procedure](multi-instance-deployment.md#start-multiple-instances).
- When using the shared volume below, set the disk path for business files, such as `drive.disks.local.location`, to `/app/files`. Keep the existing configuration if you use object storage. See [File storage and drives](../framework/file-storage.md#configure-disks).

This example shows only `server` and `app`. Replace the placeholder comment at the end with your database connection and shared-service configuration, keeping the four-space indentation.

```yaml title="configmap.yml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app-config
  namespace: my-app
data:
  config.yaml: |
    server:
      host: 0.0.0.0
      port: 13000
    app:
      publicOrigin: https://apps.example.com
      sampleData: false
    # <add non-sensitive database connection and shared-service configuration here>
```

```bash
kubectl apply -f configmap.yml
```

The Job and Deployment mount this configuration read-only at `/run/nocobase/config.yaml`. `APP_CONFIG_FILE` specifies the path to read.

### Inject sensitive environment variables with a Secret

Create `secrets.env` in the deployment directory and fill in sensitive configuration using the application's supported [environment variables](../reference/configuration.md#environment-variables). Use one `VARIABLE=value` entry per line, without `export` or surrounding quotes:

```text title="secrets.env"
DB_PASSWORD=<database password>
SECRETS_KEYS=<key version>:<key value>
INITIAL_ADMIN_PASSWORD=<initial administrator password>
```

`DB_PASSWORD` applies to the `main` database connection. When deploying an existing application, preserve the original key versions and values in `SECRETS_KEYS`, including any keys still needed to decrypt existing data.

Save the file, then create or update the `my-app-secrets` Secret in the `my-app` namespace:

```bash
kubectl -n my-app create secret generic my-app-secrets \
  --from-env-file=secrets.env --dry-run=client -o yaml | kubectl apply -f -
```

The Job and Deployment reference `my-app-secrets` through `envFrom.secretRef`, which injects its entries as environment variables when each container starts. `secrets.env` is only used to create or update the Secret; it does not need to be mounted into the containers.

Do not commit `secrets.env` or exported Secret contents to version control.

### Configure shared storage for business files

When business files are stored on a filesystem, every application replica needs access to the same files. The Job and Deployment below mount the shared volume at `/app/files`.

If all business files already use object storage, skip this subsection and remove the `files` volume and volume mount from both the Job and Deployment below.

Create `files-pvc.yml` to request a shared volume with a PersistentVolumeClaim (PVC). Choose a StorageClass that supports concurrent read/write access from multiple nodes (RWX), and adjust the requested `storage` capacity as needed:

```yaml title="files-pvc.yml"
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-app-files
  namespace: my-app
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: "<StorageClass name with RWX support>"
  resources:
    requests:
      storage: 10Gi
```

Create the PVC and check its binding status:

```bash
kubectl apply -f files-pvc.yml
kubectl -n my-app get pvc my-app-files
```

The PVC shows `Bound` once it has been bound. If the StorageClass uses delayed binding, the PVC remains `Pending` until the Job that uses the volume is created.

Before starting the application, migrate existing business files into the shared volume and make sure the application containers can read and write them.

## Run database updates with a Job

Create `db-job.yml` to run migrations and data initialization separately, using the same image and configuration as the application:

```yaml title="db-job.yml"
apiVersion: batch/v1
kind: Job
metadata:
  name: my-app-db
  namespace: my-app
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      imagePullSecrets:
        - name: registry-pull
      securityContext:
        fsGroup: 1000
      containers:
        - name: migrate
          image: registry.example.com/team/my-app:1
          command: ["node", "dist/cli/index.js"]
          args: ["db", "apply", "--connection", "main"]
          envFrom:
            - secretRef:
                name: my-app-secrets
          env:
            - name: APP_CONFIG_FILE
              value: /run/nocobase/config.yaml
          volumeMounts:
            - name: config
              mountPath: /run/nocobase
              readOnly: true
            - name: files
              mountPath: /app/files
      volumes:
        - name: config
          configMap:
            name: my-app-config
        - name: files
          persistentVolumeClaim:
            claimName: my-app-files
```

`--connection main` updates the `main` database connection. Replace it with `--all` to update all managed connections. `backoffLimit: 0` disables automatic retries after failure.

Create the Job, wait for it to complete, and inspect its logs:

```bash
kubectl create -f db-job.yml
kubectl -n my-app wait --for=condition=complete job/my-app-db --timeout=600s
kubectl -n my-app logs job/my-app-db
```

**Confirm that the Job is `Complete` before deploying the application.** A wait timeout does not stop the Job. Check its status and logs before taking further action; do not submit it again without investigating.

## Create a Deployment and Service

### Application replicas and resource configuration

Create `app.yml` to run two application replicas and expose them within the cluster through a Service:

```yaml title="app.yml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      terminationGracePeriodSeconds: 60
      imagePullSecrets:
        - name: registry-pull
      securityContext:
        fsGroup: 1000
      containers:
        - name: app
          image: registry.example.com/team/my-app:1
          ports:
            - name: http
              containerPort: 13000
          envFrom:
            - secretRef:
                name: my-app-secrets
          env:
            - name: NOCOBASE_STRICT_STARTUP
              value: "true"
            - name: APP_CONFIG_FILE
              value: /run/nocobase/config.yaml
          readinessProbe:
            httpGet:
              path: /main/api/healthz
              port: http
          volumeMounts:
            - name: config
              mountPath: /run/nocobase
              readOnly: true
            - name: files
              mountPath: /app/files
      volumes:
        - name: config
          configMap:
            name: my-app-config
        - name: files
          persistentVolumeClaim:
            claimName: my-app-files
---
apiVersion: v1
kind: Service
metadata:
  name: my-app
  namespace: my-app
spec:
  selector:
    app: my-app
  ports:
    - port: 13000
      targetPort: http
```

Create the resources and wait for the application to become ready:

```bash
kubectl apply -f app.yml
kubectl -n my-app rollout status deployment/my-app --timeout=600s
kubectl -n my-app get pods -l app=my-app -o wide
```

You should see two application Pods with `READY` set to `1/1`.

### Health probes and graceful termination

`readinessProbe` requests `/main/api/healthz` to check whether the application responds. Only Pods that pass the check receive Service traffic. If you change the application's path prefix, update the probe path as well. This endpoint does not replace business functionality checks.

`NOCOBASE_STRICT_STARTUP=true` makes the application exit on startup failure so Kubernetes can restart it.

`terminationGracePeriodSeconds: 60` gives the application up to 60 seconds to exit. Containers still running after that period are forcibly terminated.

## Configure Ingress and HTTPS

Prepare a TLS Secret in the `my-app` namespace. Reference an existing suitable Secret, or import a certificate with:

```bash
kubectl -n my-app create secret tls my-app-tls \
  --cert='<path to the TLS certificate chain>' \
  --key='<path to the TLS private key>'
```

> [!TIP]
> An Ingress describes which service should receive requests for a domain and path. An Ingress Controller makes those rules take effect on a load balancer or proxy. An IngressClass specifies which controller and configuration should handle that Ingress.
>
> For example, if your administrator provides an IngressClass named `public` for public access, use `ingressClassName: public`. Run `kubectl get ingressclass` to see available names in the `NAME` column, and confirm with your administrator which one to use. This is not the application name or domain.

Create `ingress.yml`, replacing `<IngressClass name>` with the actual IngressClass name. Use the domain configured in `app.publicOrigin` in `config.yaml`:

```yaml title="ingress.yml"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  namespace: my-app
spec:
  ingressClassName: "<IngressClass name>"
  tls:
    - hosts:
        - apps.example.com
      secretName: my-app-tls
  rules:
    - host: apps.example.com
      http:
        paths:
          - path: /main
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 13000
```

```bash
kubectl apply -f ingress.yml
kubectl -n my-app get ingress my-app
```

Point the application's domain to the Ingress endpoint and enable HTTP-to-HTTPS redirection. Preserve the `/main` prefix when forwarding requests; do not rewrite it to `/`.

Configure host and protocol header forwarding, cookies, WebSockets, upload size limits, and long-connection timeouts according to your Ingress Controller's configuration options.

## Verify access and Pod recreation

Check the Service backends, application logs, and public endpoint:

```bash
kubectl -n my-app get endpointslices -l kubernetes.io/service-name=my-app
kubectl -n my-app logs -l app=my-app --all-containers=true --prefix --tail=100
curl --fail https://apps.example.com/main/api/healthz
```

Once the health endpoint returns `ok: true`, open `https://apps.example.com/main/` and verify business functionality using the [cross-instance verification checklist](multi-instance-deployment.md#verify-cross-instance-access-and-business-processing).

In a test environment, create a business record and upload a file, then select an application Pod from the Pod list and delete it:

```bash
kubectl -n my-app delete pod '<selected application Pod name>'
kubectl -n my-app rollout status deployment/my-app --timeout=600s
kubectl -n my-app get pods -l app=my-app -o wide
```

The Deployment should restore the replica count. The application should remain accessible, and the existing data and uploaded files should still be readable. Do not delete the PVC or namespace during verification.

## Scaling and release updates

### Change the replica count

For example, scale up to four replicas:

```bash
kubectl -n my-app scale deployment/my-app --replicas=4
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

Use `--replicas=2` to scale back down to two. After a manual change, update `spec.replicas` in `app.yml` so applying the manifest again does not restore the old count. If GitOps or an HPA manages replicas, update its configuration instead.

### Update the image and configuration

Keep database changes incremental and backward-compatible so old replicas can still read and write after migration. During a rolling update, old and new versions must also remain compatible with configuration, shared state, and task messages.

First follow [Release a new application version](publish-app-release.md) to review version changes. Independently back up the database, business files, and pre-release deployment files, including `configmap.yml`, `secrets.env`, and `app.yml`. Prepare the new image, such as `registry.example.com/team/my-app:2`.

Run releases serially. Inspect the previous Job and confirm that it has ended and none of its Pods are still running. Do not delete or recreate an unfinished Job:

```bash
kubectl -n my-app describe job my-app-db
```

If configuration has changed, update the existing resources without changing their names:

- Non-sensitive configuration: edit `config.yaml` in `configmap.yml` and run `kubectl apply -f configmap.yml`.
- Sensitive variables: edit `secrets.env` and run:

```bash
kubectl -n my-app create secret generic my-app-secrets \
  --from-env-file=secrets.env --dry-run=client -o yaml | kubectl apply -f -
```

The configuration references in the Job and Deployment do not change. Mounted ConfigMap files update asynchronously after the ConfigMap changes, so the new contents must be compatible with the old replicas still running.

Change the image in `db-job.yml` to the new version. Delete the completed or failed old Job, then create a new database-update Job with the same name. Application replicas continue serving traffic; there is no need to scale them down:

```bash
kubectl -n my-app delete job my-app-db --cascade=foreground
kubectl create -f db-job.yml
kubectl -n my-app wait --for=condition=complete job/my-app-db --timeout=600s
kubectl -n my-app logs job/my-app-db
```

After the Job succeeds, update the image in `app.yml` if needed, keeping the intended replica count. Applying the manifest triggers a rolling replacement of the old replicas:

```bash
kubectl apply -f app.yml
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

If only the ConfigMap or Secret changes and `app.yml` is unchanged, the Deployment does not update automatically. Perform a rolling restart so every replica reloads the configuration. Use the same commands when you only need to restart the application:

```bash
kubectl -n my-app rollout restart deployment/my-app
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

After the rollout completes, verify that business operations and background task processing work correctly.

### Inspect rollout status and roll back

Check the Deployment's rollout status and revision history:

```bash
kubectl -n my-app rollout status deployment/my-app --timeout=600s
kubectl -n my-app rollout history deployment/my-app
```

`rollout undo` restores only the Deployment's Pod template. It does not restore ConfigMaps, Secrets, the database, or data in PVCs. Before rolling back, confirm that the target image is still available, is compatible with the current data, and that the relevant passwords and tokens remain valid.

To roll back configuration, restore `configmap.yml` and `secrets.env` from backup, then update the resources with the same names using the commands in [Update the image and configuration](#update-the-image-and-configuration).

To roll back the application version, choose the target revision from the rollout history and replace the placeholder:

```bash
kubectl -n my-app rollout undo deployment/my-app --to-revision='<target revision>'
kubectl -n my-app rollout status deployment/my-app --timeout=600s
```

For a configuration-only rollback, restore the configuration and perform a rolling restart. Do not use `rollout undo` as a substitute for restoring configuration.

After rollback, update `app.yml` or your GitOps configuration so the next deployment does not overwrite the rollback. If you need to restore the database or business files, prepare a matching recovery plan as described in [Handle data when rolling back](../tutorials/deploy-with-docker.md#handle-data-when-rolling-back).

## Write a Helm chart

This section is optional. The manifests above are sufficient to deploy the application. Create a chart if you want to use Helm to reuse configuration and manage releases.

Install Helm 3 or later on your deployment management machine, then create a chart from the manifests above. In this approach, Helm manages the Deployment, Service, and Ingress and runs a pre-release Job to update the database. The namespace, ConfigMap, Secrets, and PVC remain independently managed and must be ready before you install the chart.

### Initialize the directory structure

Create the chart in the deployment directory and copy the manifests you have adjusted for your environment:

```bash
cd "$HOME/my-app-k8s"
mkdir -p charts/my-app/templates
cp app.yml charts/my-app/templates/app.yaml
cp db-job.yml charts/my-app/templates/db-job.yaml
cp ingress.yml charts/my-app/templates/ingress.yaml
```

Keep the new files in this structure. Leave the existing configuration, credentials, and storage manifests outside the chart:

```tree
my-app-k8s/
├── charts/
│   └── my-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── app.yaml
│           ├── db-job.yaml
│           └── ingress.yaml
├── values-prod.yaml
└── README.md
```

Create `charts/my-app/Chart.yaml`:

```yaml title="charts/my-app/Chart.yaml"
apiVersion: v2
name: my-app
type: application
version: 0.1.0
```

`version` is the chart version, not the application image version. Increment it when you change the templates.

### Convert manifests into templates

Create `charts/my-app/values.yaml` for the default parameters. This example still uses a shared PVC. If you use object storage, keep your adjusted manifests and omit `existingClaim` and the corresponding `files` volume and volume mounts.

```yaml title="charts/my-app/values.yaml"
image: registry.example.com/team/my-app:1
replicaCount: 2
imagePullSecret: registry-pull
existingConfigMap: my-app-config
existingSecret: my-app-secrets
existingClaim: my-app-files
configRevision: "1"
healthPath: /main/api/healthz
ingress:
  className: "<IngressClass name>"
  host: apps.example.com
  path: /main
  tlsSecret: my-app-tls
```

Replace the following field values in the three templates with Helm expressions, leaving the rest unchanged. Each installation of a chart is a release. This example uses the release name `my-app`; keep its name and namespace unchanged when upgrading the same application.

| Field | Template value |
| --- | --- |
| `metadata.namespace` on every resource | `{{ .Release.Namespace \| quote }}` |
| Application resource names, `app` labels, selectors, and the Ingress Service name | `{{ .Release.Name \| quote }}` |
| Database Job `metadata.name` | `{{ printf "%s-db" .Release.Name \| quote }}` |
| Deployment `spec.replicas` | `{{ .Values.replicaCount }}` |
| Container `image` in the Job and Deployment | `{{ .Values.image \| quote }}` |
| Names in `imagePullSecrets` | `{{ .Values.imagePullSecret \| quote }}` |
| `envFrom.secretRef.name` | `{{ .Values.existingSecret \| quote }}` |
| Configuration volume `configMap.name` | `{{ .Values.existingConfigMap \| quote }}` |
| File volume `persistentVolumeClaim.claimName` | `{{ .Values.existingClaim \| quote }}` |
| Readiness probe `httpGet.path` | `{{ .Values.healthPath \| quote }}` |
| Ingress `ingressClassName` | `{{ .Values.ingress.className \| quote }}` |
| Ingress rule host and TLS host | `{{ .Values.ingress.host \| quote }}` |
| Ingress forwarding path | `{{ .Values.ingress.path \| quote }}` |
| Ingress TLS `secretName` | `{{ .Values.ingress.tlsSecret \| quote }}` |

Add a configuration revision annotation to the Deployment's Pod template, retaining its labels:

```yaml
spec:
  template:
    metadata:
      labels:
        app: {{ .Release.Name | quote }}
      annotations:
        nocobase.com/config-revision: {{ .Values.configRevision | quote }}
```

When the external ConfigMap or Secret contents change, increment `configRevision` so a Helm upgrade triggers a rolling update. Keep the domain, path, and application configuration consistent. Update `healthPath` whenever the application path prefix changes.

Copy the defaults to a production configuration file, then adjust the image, domain, IngressClass, and external resource names:

```bash
cp charts/my-app/values.yaml values-prod.yaml
```

Do not put passwords, keys, or tokens in `values.yaml`, environment values files, or `--set` arguments. Helm stores these parameters in release records. The chart references only existing Secret names; manage sensitive values independently as described above.

### Configure the database migration workflow

Replace `metadata` in `templates/db-job.yaml` with:

```yaml
metadata:
  name: {{ printf "%s-db" .Release.Name | quote }}
  namespace: {{ .Release.Namespace | quote }}
  annotations:
    helm.sh/hook: pre-install,pre-upgrade
    helm.sh/hook-delete-policy: before-hook-creation
```

`pre-install` and `pre-upgrade` make Helm run the Job before installing or updating application resources and wait for it to succeed. Submitting a regular Job alongside a Deployment does not guarantee that migration finishes first, even with `--wait-for-jobs`.

Keep the database command, `backoffLimit: 0`, and mount configuration from the Job above. Use the same `.Values.image`, configuration, keys, and file storage as the Deployment. Keep `migrations.autoRun` and `seeds.autoRun` set to `false` for each managed connection.

Prepare or update the external ConfigMap, Secrets, and file storage before release. They must not wait to be created as ordinary templates in this chart, or the first hook Job will not have access to them. The updated configuration and database schema must remain compatible with old replicas still serving traffic.

`before-hook-creation` deletes the old Job with the same name before the next execution; it does not check whether the old task is still running. Before every install, upgrade, or retry, confirm that the previous Job and its Pods have ended. Run releases for the same application serially. This policy keeps the current Job and its logs available for inspection after the release.

### Validate, install, and upgrade

First lint and render locally, without connecting to the cluster:

```bash
helm lint charts/my-app -f values-prod.yaml --strict
helm template my-app charts/my-app -n my-app -f values-prod.yaml > rendered.yaml
```

Inspect `rendered.yaml`: the Job and application must use the same image, external resource references and namespaces must be correct, the Service must select only application Pods, and the migration Job must have the pre-release hook annotations. Do not submit the rendered output with `kubectl apply`, which does not follow Helm's hook execution order.

**If the application is already deployed manually, transfer resource ownership first.** Compare the existing Deployment, Service, and Ingress with the rendered output, preserving names, selectors, and backend references. Add Helm ownership metadata only after confirming that the resources belong to this application, are not managed by another Helm release or GitOps, and have been backed up:

```bash
kubectl -n my-app get deployment/my-app service/my-app ingress/my-app -o yaml
kubectl -n my-app label deployment/my-app service/my-app ingress/my-app \
  app.kubernetes.io/managed-by=Helm
kubectl -n my-app annotate deployment/my-app service/my-app ingress/my-app \
  meta.helm.sh/release-name=my-app \
  meta.helm.sh/release-namespace=my-app
```

Skip ownership transfer for a new installation. If conflicting ownership metadata already exists, investigate the management relationship instead of forcing an overwrite or deleting and recreating resources. After the handover, manage application resources through Helm rather than modifying them directly with the previous `kubectl apply -f app.yml`, `rollout undo`, or similar commands. External configuration, credentials, and storage remain independently managed.

Before installing or upgrading, back up the database, files, and configuration. Confirm that configuration, credentials, and storage are ready in the target namespace, and check the previous Job:

```bash
kubectl -n my-app get job my-app-db
kubectl -n my-app get pods -l job-name=my-app-db
```

It is normal for the Job not to exist on the first installation. If it already exists, confirm that it is `Complete` or `Failed` and all associated Pods have terminated. The next release must not delete a task that is still running or terminating.

Once these conditions are met, install or upgrade the release:

```bash
helm upgrade --install my-app charts/my-app -n my-app \
  -f values-prod.yaml --wait --timeout 10m
kubectl -n my-app logs job/my-app-db
kubectl -n my-app rollout status deployment/my-app --timeout=600s
helm status my-app -n my-app
```

A failure or timeout while waiting does not undo migrations already executed or guarantee that the Job has stopped. Inspect the Job, Pods, and logs, resolve the issue, and then decide whether to retry. Do not skip hooks or blindly repeat the release. After success, verify business functionality as described in [Verify access and Pod recreation](#verify-access-and-pod-recreation).

For subsequent releases, change the image in `values-prod.yaml`. If external configuration changes, update those resources first and increment `configRevision`. Validate again, back up, and check the previous Job before running the same `helm upgrade --install` command. You do not need to create the migration Job separately.

To roll back, first inspect the Helm release history:

```bash
helm history my-app -n my-app
```

Confirm that the database-update task has ended and the target version is compatible with the current data. Restore external configuration if necessary, then specify the target revision:

```bash
helm rollback my-app '<target revision>' -n my-app --wait --timeout 10m
```

`helm rollback` does not undo database migrations or restore external ConfigMaps, Secrets, or business files. This example does not rerun the migration hook during rollback either. After rollback, synchronize the chart, environment values, and external configuration, then verify again. Do not uninstall and reinstall as a substitute for rollback; uninstalling does not automatically clean up this example's hook Job or external storage.

Keep the chart, environment values, and operating instructions in the deployment directory. Record the guide URL, external dependencies, ownership transfer procedure, and commands for installation, upgrades, rollback, and verification in `README.md`. Reuse these files for subsequent releases, keeping sensitive values out of the chart and version control.

## Common deployment issues

| Symptom | Checks and actions |
| --- | --- |
| `ImagePullBackOff` | Check the image name, tag, node architecture, registry connectivity, and `imagePullSecrets` in the same namespace. |
| PVC or Pod remains `Pending` | Use `kubectl -n my-app describe pvc my-app-files` or `kubectl -n my-app describe pod '<Pod name>'` to inspect events. Check the StorageClass, volume binding, resources, and scheduling constraints. |
| `EACCES` / `permission denied` | Confirm that the container's runtime user (UID/GID `1000` in this example) can read configuration and write to data directories. If the storage driver does not support setting volume permissions through `fsGroup`, configure permissions on the storage backend. |
| Job fails or waiting times out | Use `kubectl -n my-app logs 'job/<Job name>'` to inspect logs, and check Pod events. The Job may still be running after a timeout; do not resubmit it. Do not deploy new replicas after a failure. |
| `CrashLoopBackOff` / `OOMKilled` | Use `kubectl -n my-app logs '<Pod name>' --previous` to inspect the previous container's logs. Check events, configuration, probes, and resource limits. |
| Service has no available backends | Check the Service selector, Pod labels, and readiness status. Confirm that the probe path matches the application's path prefix. |
| Ingress returns 404, 502, or incorrect redirects | Check the IngressClass, Service port, DNS, TLS, and `app.publicOrigin`. Confirm that forwarding preserves `/main`. |